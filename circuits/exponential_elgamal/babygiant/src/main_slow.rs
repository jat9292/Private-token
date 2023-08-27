// This code is a fork that we optimized for speed from zkay, see : https://github.com/eth-sri/zkay/blob/master/babygiant-lib/src/lib.rs
// One difference is that we replaced scalar multiplication inside the baby steps curve by point addition
// This could be optimized even further by multithreading (#TODO)
use ark_ed_on_bn254::{EdwardsAffine as BabyJubJub, Fr, Fq, EdwardsParameters};
use ark_ff::{BigInteger256, field_new, PrimeField, BigInteger, SquareRootField};
use ark_ec::{AffineCurve, ProjectiveCurve};
use ark_ec::twisted_edwards_extended::{GroupProjective, GroupAffine};
use hex;

use std::collections::HashMap;

fn baby_giant(max_bitwidth: u64, a: &GroupAffine<EdwardsParameters>, b: &GroupProjective<EdwardsParameters>) -> u64 {
    let m = 1u64 << (max_bitwidth / 2);

    let mut table = HashMap::new();
    for j in 0u64..m {
        // NOTE: equality and hashing (used for HashMap) does not perform as expected
        // for projective representation (because coordinates are ambiguous), so switching
        // to affine coordinates here
        let v = a.mul(Fr::new(BigInteger256::from(j))).into_affine();
        table.insert(v, j);
    }
    let am = a.mul(Fr::new(BigInteger256::from(m)));
    println!("{}",am);
    let mut gamma = b.clone();

    for i in 0u64..m {
        if let Some(j) = table.get(&gamma.into_affine()) {
            return i*m + j;
        }
        gamma = gamma - &am;
        
    }

    panic!("No discrete log found");
}

fn parse_le_bytes_str(s: &str) -> BigInteger256 {
    let mut buffer = [0u8; 32];     // 32 bytes for 256 bits

    let v = hex::decode(s).unwrap();
    assert_eq!(v.len(), 32);
    let v = v.as_slice();
    for i in 0..32 {
        buffer[i] = v[i];
    }

    let mut bi = BigInteger256::new([0; 4]);
    bi.read_le(&mut buffer.as_ref()).unwrap();
    return bi;
}

fn do_compute_dlog(x: &str, y: &str) -> u64 {
    // x and y are in little-endian hex string format
    let coeff_twisted = field_new!(Fq,"168700").sqrt().unwrap();
    let gx = field_new!(Fq, "5299619240641551281634865583518297030282874472190772894086521144482721001553")*coeff_twisted;
    let gy = field_new!(Fq, "16950150798460657717958625567821834550301663161624707787222815936182638968203");
    let a = BabyJubJub::new(gx, gy);
    assert!(BabyJubJub::is_on_curve(&a));
    assert!(BabyJubJub::is_in_correct_subgroup_assuming_on_curve(&a));
    let bx = Fq::from_repr(parse_le_bytes_str(x)).unwrap()*coeff_twisted;
    let by = Fq::from_repr(parse_le_bytes_str(y)).unwrap();

    let b = BabyJubJub::new(bx, by);
    assert!(BabyJubJub::is_on_curve(&b));
    assert!(BabyJubJub::is_in_correct_subgroup_assuming_on_curve(&b));
    let b = b.mul(Fr::new(BigInteger256::from(1)));

    baby_giant(40, &a, &b)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_dlog() {
        let dlog = do_compute_dlog("cad3cd30e863eb0e2ed2ef543b5a7fe4f26a06dfb08828542cdf2487237bf500",
                                   "123b986383d08a0ca623bf8c59288032c8ce8054ebc415a53114bec295047a0a");
        assert_eq!(4294967295, dlog);
    }
}