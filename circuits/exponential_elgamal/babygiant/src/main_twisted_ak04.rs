use ark_ed_on_bn254::{EdwardsAffine as BabyJubJub};
use ark_ff::MontFp;
use ark_ff::Field;

fn main() {
    let gx = MontFp!(
        "5299619240641551281634865583518297030282874472190772894086521144482721001553"
    );
    let gy = MontFp!(
        "16950150798460657717958625567821834550301663161624707787222815936182638968203"
    );

    let a = BabyJubJub::new(gx*MontFp!("168700").sqrt().unwrap(), gy);
    assert!(BabyJubJub::is_on_curve(&a));
}
