use dep::std::ec::tecurve::affine::Curve as AffineCurve;
use dep::std::ec::tecurve::affine::Point as Gaffine;
use dep::std;

global bjj_a = 168700;
global bjj_d = 168696;
global bjj_generator_x = 995203441582195749578291179787384436505546430278305826713579947235728471134;
global bjj_generator_y = 5472060717959818805561601436314318772137091100104008585924551046643952123905;
global bjj_basept_x = 5299619240641551281634865583518297030282874472190772894086521144482721001553;
global bjj_basept_y = 16950150798460657717958625567821834550301663161624707787222815936182638968203;

fn main(priv_key: Field, message: Field, randomness: Field) {
    let pub_key: Gaffine = bjj_priv_to_pub_key(priv_key);
    let encryption: (Gaffine,Field) = bjj_elgamal_exp_encrypt(pub_key, message, randomness);
    std::println(bjj_elgamal_exp_decrypt(priv_key, encryption)); // should print 0x2a , i.e 42 when using: nargo test --show-output
}

#[test]
fn test_main() {
    let message = 42;
    let secret_key = 2291123624948246627368989940774052753470489062495018070576418670157516550852; // see debug notebook for an example on how to compute those
    let randomness = 168986485046885582825082387270879151100288537211746581237924789162159767775; // see debug notebook for an example on how to compute those
    main(secret_key,message,randomness);
}

fn bjj_priv_to_pub_key(priv_key: Field) -> Gaffine
{
 // Define Baby Jubjub (ERC-2494) parameters in affine representation
 let bjj_affine: AffineCurve = AffineCurve::new(bjj_a, bjj_d, Gaffine::new(bjj_generator_x,bjj_generator_y));
 let base_pt: Gaffine = Gaffine::new(bjj_basept_x, bjj_basept_y);
 bjj_affine.mul(priv_key,base_pt)
}

fn bjj_elgamal_exp_encrypt(pub_key: Gaffine, message: Field, randomness: Field) -> (Gaffine,Field)
{
 let bjj_affine: AffineCurve = AffineCurve::new(bjj_a, bjj_d, Gaffine::new(bjj_generator_x,bjj_generator_y));
 let base_pt: Gaffine = Gaffine::new(bjj_basept_x, bjj_basept_y);
 let C = bjj_affine.mul(randomness,base_pt);
 let _D = bjj_affine.mul(randomness,pub_key);
 assert(_D.x!=0); // we need this assert to make sure that the encoding of the message on next line is invertible, if it does not pass, just take another randomness parameter
 let D = _D.x*message; // see https://crypto.stackexchange.com/questions/75949/is-this-the-right-way-to-implement-elgamal-scheme-over-elliptic-curves-over-prim (Or https://crypto.stackexchange.com/questions/9987/elgamal-with-elliptic-curves/9990#9990 )
 (C,D)
}

fn bjj_elgamal_exp_decrypt(priv_key : Field, ciphertext: (Gaffine,Field)) -> Field
{
 let bjj_affine: AffineCurve = AffineCurve::new(bjj_a, bjj_d, Gaffine::new(bjj_generator_x,bjj_generator_y));
 let Cx = bjj_affine.mul(priv_key,ciphertext.0);
 let Cx_x = Cx.x;
 let Dec = ciphertext.1/Cx_x; // inverse is safe, i.e 1/0 = 0, but this cannot happen even maliciously because of the assert inside bjj_elgamal_encrypt, so we recover the message in all cases
 Dec
}


