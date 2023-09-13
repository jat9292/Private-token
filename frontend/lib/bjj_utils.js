import { buildBabyjub } from "circomlibjs";

const babyJub = await buildBabyjub();

export function generatePrivateAndPublicKey() {
  const max_value = BigInt(
    "2736030358979909402780800718157159386076813972158567259200215660948447373041"
  ); // max value should be l (https://eips.ethereum.org/EIPS/eip-2494), the order of the big subgroup to avoid modulo bias
  const privateKey = _getRandomBigInt(max_value);
  const publicKey = privateToPublicKey(privateKey);
  return { privateKey: privateKey, publicKey: publicKey };
}

// Utils functions (should be called directly by the dapp)
export function privateToPublicKey(privateKey) {
  const publicKeyPoint = babyJub.mulPointEscalar(babyJub.Base8, privateKey); // A point on Baby Jubjub : C = (CX, Cy)
  return {
    x: _uint8ArrayToBigInt(
      babyJub.F.fromMontgomery(babyJub.F.e(publicKeyPoint[0])).reverse()
    ), // fromMontgomery because circomlibjs uses the Montgomery form by default, but we need the Twisted Edwards form in Noir
    y: _uint8ArrayToBigInt(
      babyJub.F.fromMontgomery(babyJub.F.e(publicKeyPoint[1])).reverse()
    ),
  };
}

function _getRandomBigInt(maxBigInt) {
  // Calculate the byte length
  const byteLength = (maxBigInt.toString(16).length + 1) >> 1;
  while (true) {
    const buf = crypto.randomBytes(byteLength);
    let num = BigInt("0x" + buf.toString("hex"));

    if (num <= maxBigInt) {
      return num;
    }
  }
}
