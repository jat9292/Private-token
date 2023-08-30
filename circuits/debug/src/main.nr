// Note: Exponential ElGamal only supports plaintexts constrained to 40 bits, because solving the Discrete Log is needed during decryption
// It is the responsiblity of the smart contract developer to ensure that all plaintexts are in the u40 range before encryption
use dep::std::ec::tecurve::affine::Curve as AffineCurve;
use dep::std::ec::tecurve::affine::Point as Gaffine;
use dep::std::collections::vec::Vec;
use dep::std;

global bjj_a = 168700;
global bjj_d = 168696;
global bjj_generator_x = 995203441582195749578291179787384436505546430278305826713579947235728471134;
global bjj_generator_y = 5472060717959818805561601436314318772137091100104008585924551046643952123905;
global bjj_basept_x = 5299619240641551281634865583518297030282874472190772894086521144482721001553;
global bjj_basept_y = 16950150798460657717958625567821834550301663161624707787222815936182638968203;

fn main(private_key: Field, plaintext: u40, randomness: Field) {
    let public_key: Gaffine = bjj_priv_to_pub_key(private_key);
    let ciphertext: (Gaffine,Gaffine) = bjj_exp_elgamal_encrypt(public_key, plaintext, randomness);
    let decryption = bjj_exp_elgamal_decrypt(private_key, ciphertext);
    std::println(decryption.x); // should print emb(message) , when using: nargo test --show-output
    std::println(decryption.y); // should print emb(message) , when using: nargo test --show-output
    let bjj_affine: AffineCurve = AffineCurve::new(bjj_a, bjj_d, Gaffine::new(bjj_generator_x,bjj_generator_y));
    let base_pt: Gaffine = Gaffine::new(bjj_basept_x, bjj_basept_y);
    let plain_embedded: Gaffine = bjj_affine.mul(plaintext as Field,base_pt);
    std::println(plain_embedded); // should print emb(message) , when using: nargo test --show-output
    //std::println(compute_discrete_log(plain_embedded)); // too slow for 32 bits in Noir, we will use the Rust implementation compatible with u40 (see babygiant/main.rs)

}

#[test]
fn test_main() {
    let message: u40 = 943594123598;
    let private_key: Field = 2291123624948246627368989940774052753470489062495018070576418670157516550852; // see debug notebook for an example on how to compute those
    let randomness: Field = 168986485046885582825082387270879151100288537211746581237924789162159767775; // see debug notebook for an example on how to compute those
    main(private_key, message, randomness);
}

fn bjj_priv_to_pub_key(private_key: Field) -> Gaffine
{
 // Define Baby Jubjub (ERC-2494) parameters in affine representation
 let bjj_affine: AffineCurve = AffineCurve::new(bjj_a, bjj_d, Gaffine::new(bjj_generator_x,bjj_generator_y));
 let base_pt: Gaffine = Gaffine::new(bjj_basept_x, bjj_basept_y);
 bjj_affine.mul(private_key,base_pt)
}

fn bjj_exp_elgamal_encrypt(public_key: Gaffine, plaintext: u40, randomness: Field) -> (Gaffine,Gaffine)  // same notations as in https://en.wikipedia.org/wiki/ElGamal_encryption 
{
 let bjj_affine: AffineCurve = AffineCurve::new(bjj_a, bjj_d, Gaffine::new(bjj_generator_x,bjj_generator_y));
 let base_pt: Gaffine = Gaffine::new(bjj_basept_x, bjj_basept_y);
 let C1: Gaffine = bjj_affine.mul(randomness,base_pt);
 let plain_embedded: Gaffine = bjj_affine.mul(plaintext as Field,base_pt);
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

unconstrained fn get_index(table: [Gaffine;65536], search_element: Gaffine)->(bool,Field) {
    let mut found: bool = false;
    let mut index = 0;
    let len = table.len();
    for k in 0..len {
        if !found {
            if (table[k].x == search_element.x) & (table[k].y == search_element.y) {
                index = k;
                found = true;
            }
        }
    };
    (found,index)
}

// this function implements baby-step giant-step algorithm to compute efficiently the discrete logarithm
// NOTE : this was extremely slow above u8, so we are going to replace it with the Rust version (DLP for u40 in 10s) in the babygiant folder
unconstrained fn compute_discrete_log(plain_embedded: Gaffine)-> u32 {
    let bjj_affine: AffineCurve = AffineCurve::new(bjj_a, bjj_d, Gaffine::new(bjj_generator_x,bjj_generator_y));
    let base_pt: Gaffine = Gaffine::new(bjj_basept_x, bjj_basept_y);
    let m = 65536; // 2**16, because we are limited to 32 bits for plaintext, i.e 32/2=16
    let mut table: [Gaffine;65536]=[base_pt;65536];
    
    let mut v = Gaffine::zero();
    for j in 0..m { // baby-steps
        table[j]=v;
        std::println(j);
        std::println(v);
        v = bjj_affine.add(v,base_pt);        
    }

    let mut plain_embedded_mut = plain_embedded;
    let mut found: bool = false;
    let mut i_index: Field = 0;
    let mut j_index: Field = 0;
    let giant_step = v; // last computed value of v is equal to bjj_affine.mul(m,base_pt)
    for i in 0..m { // giant-steps
        if !found {
            let return_value = get_index(table,plain_embedded_mut);
            let found_step = return_value.0;
            if found_step {
                found = true;
                i_index=i;
                j_index = return_value.1;
                }
        }
        plain_embedded_mut = bjj_affine.subtract(plain_embedded_mut,giant_step);
    };
    assert(found); // this must always be true, it never fails unless plaintext is outside the u32 range (responsiblity of smart contract developer)
    (i_index*m+j_index) as u32
}




