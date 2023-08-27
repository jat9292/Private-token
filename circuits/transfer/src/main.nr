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

// Code of the circuit used at each transfer of the token to prove the validity of transfer (sender has enough balance) and correctness of encrypted new balances of sender and receiver.
// Note : arguments of first line are all the private parameters, the second and third lines contain all the public parameters
fn main(private_key: Field, randomness1: Field, randomness2: Field, value: u40, balance_old_me_clear: u40, // balance_old_me_clear is the clear (i.e decrypted) balance of sender, this is computed offchain by solving the DLP with babygiant algorithm, after calling bjj_exp_elgamal_decrypt with his private key 
 public_key_me: pub Gaffine, public_key_to: pub Gaffine, balance_old_me_encrypted_1: pub Gaffine, balance_old_me_encrypted_2: Gaffine, balance_old_to_encrypted_1: pub Gaffine, balance_old_to_encrypted_2: pub Gaffine,
 balance_new_me_encrypted_1: pub Gaffine, balance_new_me_encrypted_2: pub Gaffine, balance_new_to_encrypted_1: pub Gaffine, balance_new_to_encrypted_2: pub Gaffine) { 
    let computed_public_key = bjj_priv_to_pub_key(private_key);
    assert((public_key_me.x == computed_public_key.x) & (public_key_me.y == computed_public_key.y)); // check that the sender really owns the private key corresponding to his public key
    assert(value<=balance_old_me_clear); // the sender must have sufficient balance
    assert(value>=1); // this is to deter potential front-running issue: ref https://crypto.stanford.edu/~buenz/papers/zether.pdf §3.1. Here we adopt a simpler approach than the multistep approach proposed in the Zether paper, for a better UX: an attacker who tries to DOS the sender should at least pay 1 token to either original sender or receiver. The "1" threshold could be changed to ensure correct economic incentives.
    // another more straightforward solution to front-running would be simply to do the homomorphic addition in the smart contract rather than the circuit, but this is too expensive today on Ethereum, according to the Zeestar paper §III : https://files.sri.inf.ethz.ch/website/papers/sp22-zeestar.pdf
    
    let bjj_affine: AffineCurve = AffineCurve::new(bjj_a, bjj_d, Gaffine::new(bjj_generator_x, bjj_generator_y));
    let base_pt: Gaffine = Gaffine::new(bjj_basept_x, bjj_basept_y);
    let embedded_balance_old_me_clear = bjj_affine.mul(balance_old_me_clear as Field, base_pt);
    let decoded_value = bjj_exp_elgamal_decrypt(private_key, (balance_old_me_encrypted_1,balance_old_me_encrypted_2));
    assert((decoded_value.x == embedded_balance_old_me_clear.x) & (decoded_value.y == embedded_balance_old_me_clear.y)); // check that unencrypted balance of sender really corresponds to his encrypted balance

    let balance_new_me_encrypted_computed = bjj_exp_elgamal_encrypt(public_key_me, balance_old_me_clear - value, randomness1);
    assert((balance_new_me_encrypted_computed.0.x==balance_new_me_encrypted_1.x) & (balance_new_me_encrypted_computed.0.y==balance_new_me_encrypted_1.y) & (balance_new_me_encrypted_computed.1.x==balance_new_me_encrypted_2.x) & (balance_new_me_encrypted_computed.1.y==balance_new_me_encrypted_2.y)); // checks that the new encrypted balance of sender is correct
    
    let value_encrypted_to = bjj_exp_elgamal_encrypt(public_key_to, value, randomness2);
    let balance_new_to_encrypted_computed = (bjj_affine.add(balance_old_to_encrypted_1, value_encrypted_to.0),bjj_affine.add(balance_old_to_encrypted_2, value_encrypted_to.1)); // addition of the points on Baby Jubjub : this operation is additevely homomorphic for Exponential ElGamal
    assert((balance_new_to_encrypted_computed.0.x==balance_new_to_encrypted_1.x) & (balance_new_to_encrypted_computed.0.y==balance_new_to_encrypted_1.y) & (balance_new_to_encrypted_computed.1.x==balance_new_to_encrypted_2.x) & (balance_new_to_encrypted_computed.1.y==balance_new_to_encrypted_2.y)); // checks that the new encrypted balance of receiver is correct

}

#[test]
fn test_main() {
    // private values
    let private_key: Field = 2291123624948246627368989940774052753470489062495018070576418670157516550852; // see debug notebook for an example on how to compute those
    let randomness1: Field = 168986485046885582825082387270879151100288537211746581237924789162159767775; // see debug notebook for an example on how to compute those
    let randomness2: Field = 2512595847879910647549805200013822046432901960729162086417588755890198945115;
    let value: u40 = 100;
    let balance_old_me_clear = 10000;

    // public values
    let public_key_me: Gaffine = bjj_priv_to_pub_key(private_key);
    let public_key_to: Gaffine = bjj_priv_to_pub_key(2397698694665525209403000085013646741088197704326090841842743616643093564368); // bjj_priv_to_pub_key(private_key_to)
    let balance_old_me_encrypted : (Gaffine,Gaffine) = bjj_exp_elgamal_encrypt(public_key_me, balance_old_me_clear, 1223911427385630814994881905088740515414339792865684838215099796087690786721);
    let balance_old_to_encrypted : (Gaffine,Gaffine) = bjj_exp_elgamal_encrypt(public_key_me, 42, 1391605116707840153256607813912547565986654451413670922768018807428594876790);
    let balance_new_me_encrypted : (Gaffine,Gaffine) = bjj_exp_elgamal_encrypt(public_key_me, 9900, 1822621444658611763810175187603135903758150085834502834324145374677801372378);
    let balance_new_to_encrypted : (Gaffine,Gaffine) = bjj_exp_elgamal_encrypt(public_key_me, 142, 2734719865355938354270841735304585029623873348870165700414760972044487721910);
    main(private_key, randomness1, randomness2, value, balance_old_me_clear, public_key_me, public_key_to, balance_old_me_encrypted.0, balance_old_me_encrypted.1, balance_old_to_encrypted.0,
     balance_old_to_encrypted.1, balance_new_me_encrypted.0, balance_new_me_encrypted.1, balance_new_to_encrypted.0,  balance_new_to_encrypted.1);
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

fn bjj_exp_elgamal_decrypt(private_key : Field, ciphertext: (Gaffine,Gaffine)) -> Gaffine
{
 let bjj_affine: AffineCurve = AffineCurve::new(bjj_a, bjj_d, Gaffine::new(bjj_generator_x,bjj_generator_y));
 let shared_secret = bjj_affine.mul(private_key,ciphertext.0);
 let plain_embedded = bjj_affine.subtract(ciphertext.1,shared_secret);
 plain_embedded
}