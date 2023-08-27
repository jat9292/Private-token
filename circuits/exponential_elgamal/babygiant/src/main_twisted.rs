use ark_ed_on_bn254::{Fq, EdwardsAffine as BabyJubJub};
use ark_ff::{field_new,SquareRootField};

fn main() {
    let gx = field_new!(
        Fq,
        "5299619240641551281634865583518297030282874472190772894086521144482721001553"
    );
    let gy = field_new!(
        Fq,
        "16950150798460657717958625567821834550301663161624707787222815936182638968203"
    );
    let coeff_twisted = field_new!(Fq,"168700").sqrt().unwrap();
    let a = BabyJubJub::new(gx*coeff_twisted, gy);
    assert!(BabyJubJub::is_on_curve(&a));
}
