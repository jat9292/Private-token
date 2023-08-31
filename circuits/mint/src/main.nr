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

// Code of the circuit used once at construction of the token to prove the correctness of encryption of the minted total supply.
// In this particular case, we are using a zkSNARK only for its succintness property, not the zk property, because total supply is publicly known.
// The alternative would have been to reimplement Baby JubJub encryption in the EVM onchain which is very gas-expensive and complex.
fn main(private_key: Field, randomness: Field, public_key: pub Gaffine, value: pub u40, C1: pub Gaffine, C2 : pub Gaffine) { // initially wanted to put the encrypted value, i.e (C1,C2), as a public output to the circuit, but because Noir 10.3 does not support yet tuple types as outputs, I had to put it as public inputs and add a constraint verifying the equality with computed encryption at the end of the circuit
    let computed_public_key = bjj_priv_to_pub_key(private_key);
    assert((public_key.x == computed_public_key.x) & (public_key.y == computed_public_key.y)); // while this constraint is not strictly mandatory, we keep it to make sure that the deployer owns the private key corresponding to his registered public key
    let ciphertext: (Gaffine,Gaffine) = bjj_exp_elgamal_encrypt(public_key, value, randomness); // we encrypt the minted value with the minter's public key
    assert((ciphertext.0.x == C1.x) & (ciphertext.0.y == C1.y) & (ciphertext.1.x == C2.x) & (ciphertext.1.y == C2.y)); // the circuit outputs the correctly encrypted initial supply

}

#[test]
fn test_main() {
    // private values
    let private_key: Field = 2291123624948246627368989940774052753470489062495018070576418670157516550852; // see debug notebook for an example on how to compute those
    let randomness: Field = 168986485046885582825082387270879151100288537211746581237924789162159767775; // see debug notebook for an example on how to compute those

    // public values
    let public_key: Gaffine = bjj_priv_to_pub_key(private_key);
    let value: u40 = 1000000000000; // the message being encrypted
    let (C1, C2) = bjj_exp_elgamal_encrypt(public_key, value, randomness);

    main(private_key, randomness, public_key,value,C1,C2);  // checks that public_key is derived from private_key and returns encrypted value and most importantly that the encrpyted value, i.e (C1,C2), is correct
}

fn bjj_priv_to_pub_key(private_key: Field) -> Gaffine
{
 // Define Baby Jubjub (ERC-2494) parameters in affine representation
 let bjj_affine: AffineCurve = AffineCurve::new(bjj_a, bjj_d, Gaffine::new(bjj_generator_x, bjj_generator_y));
 let base_pt: Gaffine = Gaffine::new(bjj_basept_x, bjj_basept_y);
 bjj_affine.mul(private_key, base_pt)
}

fn bjj_exp_elgamal_encrypt(public_key: Gaffine, plaintext: u40, randomness: Field) -> (Gaffine,Gaffine) // same notations as in https://en.wikipedia.org/wiki/ElGamal_encryption 
{
 let bjj_affine: AffineCurve = AffineCurve::new(bjj_a, bjj_d, Gaffine::new(bjj_generator_x, bjj_generator_y));
 let base_pt: Gaffine = Gaffine::new(bjj_basept_x, bjj_basept_y);
 let C1: Gaffine = bjj_affine.mul(randomness, base_pt);
 let plain_embedded: Gaffine = bjj_affine.mul(plaintext as Field, base_pt);
 let shared_secret: Gaffine = bjj_affine.mul(randomness, public_key);
 let C2: Gaffine = bjj_affine.add(shared_secret, plain_embedded);
 (C1,C2)
}