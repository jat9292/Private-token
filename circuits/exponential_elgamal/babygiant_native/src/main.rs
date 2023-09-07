/* This code is heavily inspired by zkay, see : https://github.com/eth-sri/zkay/blob/master/babygiant-lib/src/lib.rs
Two main differences with respect to zkay : 
1/ we replaced scalar multiplication inside the baby steps loop by point addition, this lead to a 7x speedup on average, allowing to decrypt 
uint40 instead of just uint32 in less than 10 seconds (on a Mac M1 chip), this is why we replaced the 32 argument by 40 in the baby_giant call.
2/ We added multithreading for another 2.5x improvement, so eveen in the browser (WASM overhead) this should be practical for uint40 in less than 10s in the worst case.
3/ Another big difference is that the imported arkworks library uses the Edwards form instead of the Twisted Edwards form which is used in Noir for the baby Jubjub curve, 
so we did a coordinate transform when encoding points on the Edwards form, using the coordinates given by the Noir implementation. */

use ark_ed_on_bn254::{EdwardsAffine as BabyJubJub, Fr, Fq, EdwardsParameters};
use ark_ff::{BigInteger256, field_new, PrimeField, BigInteger, SquareRootField};
use ark_ec::{AffineCurve, ProjectiveCurve};
use ark_ec::twisted_edwards_extended::{GroupProjective, GroupAffine};
use hex;
use std::env;

use std::collections::HashMap;
use std::sync::mpsc;
use std::thread;
use num_cpus;

fn baby_giant(max_bitwidth: u64, a: &GroupAffine<EdwardsParameters>, b: &GroupProjective<EdwardsParameters>) -> Option<u64> {
    let m = 1u64 << (max_bitwidth / 2);

    let threads = num_cpus::get() as u64;
    let chunk_size = m / threads;
    let (tx, rx) = mpsc::channel();

    for idx in 0..threads {
        let a = a.clone();
        let b = b.clone();
        let tx = tx.clone();
        thread::spawn(move || {
            let start = idx * chunk_size;
            let end = if idx == threads - 1 { m } else { start + chunk_size };

            let mut table = HashMap::new();


            // NOTE: equality and hashing (used for HashMap) does not perform as expected
            // for projective representation (because coordinates are ambiguous), so switching
            // to affine coordinates here
            let mut v =  a.mul(Fr::new(BigInteger256::from(start))).into_affine();
            let a1 = a.mul(Fr::new(BigInteger256::from(1))).into_affine();

            for j in start..end { // baby_steps
                table.insert(v, j);
                v =  v + a1; // original zkay version was doing scalar multiplication inside the loop, we replaced it by constant increment, because addition is faster than scalar multiplication on the elliptic curve, this lead to a 7x speedup
            }
            let am = a.mul(Fr::new(BigInteger256::from(m)));
            let mut gamma = b.clone();

            for i in 0..m { // giant_steps
                if let Some(j) = table.get(&gamma.into_affine()) {
                    tx.send(Some(i * m + j)).unwrap();
                    return;
                }
                gamma = gamma - &am;
                
            }
            tx.send(None).unwrap();
        });
    }




    let mut result = None;
    for _ in 0..threads {
        if let Some(res) = rx.recv().unwrap() {
            result = Some(res);
            break;
        }
    }

    result

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
    let coeff_twisted = field_new!(Fq,"168700").sqrt().unwrap(); // this coeff_twisted was introduced to transform the coordinates of baby Jubjub points from the Twisted Edwards form coming from Noir, to the Edwards form compatible with arkworks
    let gx = field_new!(Fq, "5299619240641551281634865583518297030282874472190772894086521144482721001553")*coeff_twisted;
    let gy = field_new!(Fq, "16950150798460657717958625567821834550301663161624707787222815936182638968203");
    let a = BabyJubJub::new(gx, gy); // the base point of the twisted Edwards form of Baby Jubjub : https://eips.ethereum.org/EIPS/eip-2494#forms-of-the-curve
    assert!(BabyJubJub::is_on_curve(&a));
    assert!(BabyJubJub::is_in_correct_subgroup_assuming_on_curve(&a));
    let bx = Fq::from_repr(parse_le_bytes_str(x)).unwrap()*coeff_twisted;
    let by = Fq::from_repr(parse_le_bytes_str(y)).unwrap();

    let b = BabyJubJub::new(bx, by);
    assert!(BabyJubJub::is_on_curve(&b));
    assert!(BabyJubJub::is_in_correct_subgroup_assuming_on_curve(&b));
    let b = b.mul(Fr::new(BigInteger256::from(1)));

    baby_giant(40, &a, &b).unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;

    /*#[test]
    fn test_compute_dlog() {
        let dlog = do_compute_dlog("05c8f08545f6882bad9807a929ab4685d47216b8422d61ab49e3bed0cb12e705",
                                   "10c3d3d9d7b645fae3488ac1783f253a56fe190387c6d643d6a74631d5b2bd00");
        assert_eq!(65545, dlog);
    }*/

    
    #[test]
    fn test_compute_dlog() {
        let dlog = do_compute_dlog("cad3cd30e863eb0e2ed2ef543b5a7fe4f26a06dfb08828542cdf2487237bf500",
                                   "123b986383d08a0ca623bf8c59288032c8ce8054ebc415a53114bec295047a0a");
        assert_eq!(4294967295, dlog);
    }
    /* 
    #[test]
    fn test_compute_dlog() {
        let dlog = do_compute_dlog("f78559023c89207614e4677b86354a3588d443bdbe97f2b79c7c5e5affee382f",
                                   "dadb3067e6dd4e120cdb93fb4d9b2fc8af60a50ff0a68680ffc9d12a5e451f01");
        assert_eq!(943594123598, dlog);
    }*/
    /* 
    #[test]
    fn test_compute_dlog() {
        let dlog = do_compute_dlog("02d02e26730623f70bb5974a86aabcbdad1d60a60d9bd7f3f4dfab9ae9574908",
                                   "849761d6c7e79ce5d7a42fac89153833fbd109d4351e97a8059585a86555b406");
        assert_eq!(1099511627775, dlog);
    }*/
}



fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 3 {
        eprintln!("Please provide two string arguments.");
        return;
    }

    println!("{}", do_compute_dlog(&args[1], &args[2]));
}