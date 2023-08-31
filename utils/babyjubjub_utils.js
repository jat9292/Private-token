// We cannot use typescript with circomlibjs, so we keep it as a js file (no types declaration file)
import { buildBabyjub }  from "circomlibjs";
import { getCurveFromName, Scalar }  from "ffjavascript";
import crypto from 'crypto';

const babyJub = await buildBabyjub();

// Internal functions
function _uint8ArrayToBigInt(bytes) {
    let hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
    return BigInt('0x' + hex);
}

function _getRandomBigInt(maxBigInt) {
    // Calculate the byte length
    const byteLength = (maxBigInt.toString(16).length + 1) >> 1;
    while (true) {
        const buf = crypto.randomBytes(byteLength);
        let num = BigInt('0x' + buf.toString('hex'));

        if (num <= maxBigInt) {
            return num;
        }
    }
}

function _bigIntToUint8Array(bigInt) {
    let hex = bigInt.toString(16);

    // Ensure even number of characters
    if (hex.length % 2 !== 0) {
        hex = '0' + hex;
    }

    const bytes = new Uint8Array(32);
    const hexLength = hex.length;

    // Start from the end of the hex string and assign byte values to the end of the Uint8Array
    for (let i = hexLength, byteIndex = 31; i > 0; i -= 2, byteIndex--) {
        const byteStr = i >= 2 ? hex.slice(i - 2, i) : hex.slice(0, 1); // Handle the scenario where hex has an odd length
        bytes[byteIndex] = parseInt(byteStr, 16);
    }
    return bytes;
}


// Utils functions (should be called directly by the dapp)
export function privateToPublicKey(privateKey){
    const publicKeyPoint = babyJub.mulPointEscalar(babyJub.Base8,privateKey); // A point on Baby Jubjub : C = (CX, Cy)
    return {"x":_uint8ArrayToBigInt(babyJub.F.fromMontgomery(babyJub.F.e(publicKeyPoint[0])).reverse()), // fromMontgomery because circomlibjs uses the Montgomery form by default, but we need the Twisted Edwards form in Noir
            "y":_uint8ArrayToBigInt(babyJub.F.fromMontgomery(babyJub.F.e(publicKeyPoint[1])).reverse())}
}

export function generatePrivateAndPublicKey() {
    const max_value = BigInt('2736030358979909402780800718157159386076813972158567259200215660948447373041'); // max value should be l (https://eips.ethereum.org/EIPS/eip-2494), the order of the big subgroup to avoid modulo bias
    const privateKey = _getRandomBigInt(max_value);
    const publicKey = privateToPublicKey(privateKey);
    return {"privateKey":privateKey, "publicKey":publicKey};
}

export function exp_elgamal_encrypt(public_key, plaintext) {  // same notations as in https://en.wikipedia.org/wiki/ElGamal_encryption 
        // Check if it's a number and an integer in uint40 range
        if (typeof plaintext === 'number' && Number.isInteger(plaintext) && plaintext >= 0 && plaintext <= 1099511627775) {
            const max_value = BigInt('2736030358979909402780800718157159386076813972158567259200215660948447373041'); // max value should be l (https://eips.ethereum.org/EIPS/eip-2494), the order of the big subgroup to avoid modulo bias
            const randomness = _getRandomBigInt(max_value);
            const C1P = babyJub.mulPointEscalar(babyJub.Base8,randomness);
            const plain_embedded = babyJub.mulPointEscalar(babyJub.Base8,plaintext);
            const shared_secret = babyJub.mulPointEscalar([babyJub.F.toMontgomery(_bigIntToUint8Array(public_key.x).reverse()),babyJub.F.toMontgomery(_bigIntToUint8Array(public_key.y).reverse())],randomness);
            const C2P = babyJub.addPoint(plain_embedded,shared_secret);
            const C1 = {"x":_uint8ArrayToBigInt(babyJub.F.fromMontgomery(babyJub.F.e(C1P[0])).reverse()),
                        "y":_uint8ArrayToBigInt(babyJub.F.fromMontgomery(babyJub.F.e(C1P[1])).reverse())};
            const C2 = {"x":_uint8ArrayToBigInt(babyJub.F.fromMontgomery(babyJub.F.e(C2P[0])).reverse()),
                        "y":_uint8ArrayToBigInt(babyJub.F.fromMontgomery(babyJub.F.e(C2P[1])).reverse())};
            return {"C1":C1, "C2": C2};
        }
            else {
                throw new Error("Plain value most be an integer in uint40 range");
            }
}

export function exp_elgamal_decrypt_embedded(private_key, C1, C2) {
    const shared_secret = babyJub.mulPointEscalar([babyJub.F.toMontgomery(_bigIntToUint8Array(C1.x).reverse()),babyJub.F.toMontgomery(_bigIntToUint8Array(C1.y).reverse())],private_key);
    const shared_secret_inverse = babyJub.mulPointEscalar(shared_secret,2736030358979909402780800718157159386076813972158567259200215660948447373040n); // Note : this BigInt is equal to l-1, this equivalent here to -1, to take the inverse of shared_secret, because mulPointEscalar only supports positive values for the second argument
    const plain_embedded = babyJub.addPoint([babyJub.F.toMontgomery(_bigIntToUint8Array(C2.x).reverse()),babyJub.F.toMontgomery(_bigIntToUint8Array(C2.y).reverse())],shared_secret_inverse);
    return {"x":_uint8ArrayToBigInt(babyJub.F.fromMontgomery(babyJub.F.e(plain_embedded[0])).reverse()),
            "y":_uint8ArrayToBigInt(babyJub.F.fromMontgomery(babyJub.F.e(plain_embedded[1])).reverse())};
}

export function intToLittleEndianHex(n) { // should take a BigInt and returns a string in little endian hexadecimal, of size 64, to give as input as the Rust script computing the Discrete Log with baby-step giant-step algo
    // Ensure input is a BigInt
    if (typeof n !== 'bigint') {
        throw new Error('Input must be a BigInt.');
    }

    let hexValue = n.toString(16);

    if (hexValue.length % 2 !== 0) {
        hexValue = '0' + hexValue;
    }

    const pairs = [];
    for (let i = 0; i < hexValue.length; i += 2) {
        pairs.push(hexValue.substring(i, i + 2));
    }
    const littleEndian = pairs.reverse().join('');

    return littleEndian.padEnd(64, '0');
}

// Tests (Uncomment and then run `node babyjubjub_utils.js` to test)
/*
const {privateKey, publicKey} = generatePrivateAndPublicKey();
const {C1,C2} = exp_elgamal_encrypt(publicKey,943594123598);
const decrypted_embedded = exp_elgamal_decrypt_embedded(privateKey,C1,C2);
console.log(decrypted_embedded.x);
console.log(decrypted_embedded.y); // we checked that this gives the same results as the tests inside the exponential_elgamal Noir circuit.

// to give as input as the Rust script computing the Discrete Log with baby-step giant-step algo (../circuits/exponential_elgamal/babygiant/src/main.rs)
console.log(intToLittleEndianHex(decrypted_embedded.x));
console.log(intToLittleEndianHex(decrypted_embedded.y));
*/