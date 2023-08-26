use dep::std::ec::tecurve::affine::Curve as AffineCurve;
use dep::std::ec::tecurve::affine::Point as Gaffine;
use dep::std;

global bjj_a = 168700;
global bjj_d = 168696;
global bjj_generator_x = 995203441582195749578291179787384436505546430278305826713579947235728471134;
global bjj_generator_y = 5472060717959818805561601436314318772137091100104008585924551046643952123905;
global bjj_basept_x = 5299619240641551281634865583518297030282874472190772894086521144482721001553;
global bjj_basept_y = 16950150798460657717958625567821834550301663161624707787222815936182638968203;

fn main(private_key: Field, plaintext: Field, randomness: Field) {
    let public_key: Gaffine = bjj_priv_to_pub_key(private_key);
    let ciphertext: (Gaffine,Gaffine) = bjj_exp_elgamal_encrypt(public_key, plaintext, randomness);
    std::println(bjj_exp_elgamal_decrypt(private_key, ciphertext)); // should print emb(0x2a) , i.e emb(42) when using: nargo test --show-output

    let bjj_affine: AffineCurve = AffineCurve::new(bjj_a, bjj_d, Gaffine::new(bjj_generator_x,bjj_generator_y));
    let base_pt: Gaffine = Gaffine::new(bjj_basept_x, bjj_basept_y);
    let plain_embedded: Gaffine = bjj_affine.mul(plaintext,base_pt);
    std::println(plain_embedded); // should print emb(0x2a) , i.e emb(42) when using: nargo test --show-output

}

#[test]
fn test_main() {
    let message = 42;
    let private_key = 2291123624948246627368989940774052753470489062495018070576418670157516550852; // see debug notebook for an example on how to compute those
    let randomness = 168986485046885582825082387270879151100288537211746581237924789162159767775; // see debug notebook for an example on how to compute those
    main(private_key,message,randomness);
}

fn bjj_priv_to_pub_key(private_key: Field) -> Gaffine
{
 // Define Baby Jubjub (ERC-2494) parameters in affine representation
 let bjj_affine: AffineCurve = AffineCurve::new(bjj_a, bjj_d, Gaffine::new(bjj_generator_x,bjj_generator_y));
 let base_pt: Gaffine = Gaffine::new(bjj_basept_x, bjj_basept_y);
 bjj_affine.mul(private_key,base_pt)
}

fn bjj_exp_elgamal_encrypt(public_key: Gaffine, plaintext: Field, randomness: Field) -> (Gaffine,Gaffine)
{
 let bjj_affine: AffineCurve = AffineCurve::new(bjj_a, bjj_d, Gaffine::new(bjj_generator_x,bjj_generator_y));
 let base_pt: Gaffine = Gaffine::new(bjj_basept_x, bjj_basept_y);
 let C1: Gaffine = bjj_affine.mul(randomness,base_pt);
 let plain_embedded: Gaffine = bjj_affine.mul(plaintext,base_pt);
 let shared_secret: Gaffine = bjj_affine.mul(randomness,public_key);
 let C2: Gaffine = bjj_affine.add(shared_secret,plain_embedded);
 (C1,C2)
}

fn bjj_exp_elgamal_decrypt(private_key : Field, ciphertext: (Gaffine,Gaffine)) -> Gaffine
{
 let bjj_affine: AffineCurve = AffineCurve::new(bjj_a, bjj_d, Gaffine::new(bjj_generator_x,bjj_generator_y));
 let shared_secret = bjj_affine.mul(private_key,ciphertext.0);
 let plain_embedded = bjj_affine.subtract(ciphertext.1,shared_secret);
 plain_embedded
}




