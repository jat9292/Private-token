import { buildBabyjub } from "circomlibjs";
import crypto from "crypto";

let babyJub;

async function getBabyJub() {
  if (!babyJub) {
    babyJub = await buildBabyjub();
  }
  return babyJub;
}

export async function generatePrivateAndPublicKey() {
  const max_value = BigInt(
    "2736030358979909402780800718157159386076813972158567259200215660948447373041"
  ); // max value should be l (https://eips.ethereum.org/EIPS/eip-2494), the order of the big subgroup to avoid modulo bias
  const privateKey = _getRandomBigInt(max_value);
  const publicKey = await privateToPublicKey(privateKey);
  return { privateKey: privateKey, publicKey: publicKey };
}

// Utils functions (should be called directly by the dapp)
export async function privateToPublicKey(privateKey) {
  const babyJubInstance = await getBabyJub();
  const publicKeyPoint = babyJubInstance.mulPointEscalar(
    babyJubInstance.Base8,
    privateKey
  ); // A point on Baby Jubjub : C = (CX, Cy)
  return {
    x: _uint8ArrayToBigInt(
      babyJubInstance.F.fromMontgomery(
        babyJubInstance.F.e(publicKeyPoint[0])
      ).reverse()
    ), // fromMontgomery because circomlibjs uses the Montgomery form by default, but we need the Twisted Edwards form in Noir
    y: _uint8ArrayToBigInt(
      babyJubInstance.F.fromMontgomery(
        babyJubInstance.F.e(publicKeyPoint[1])
      ).reverse()
    ),
  };
}

function _uint8ArrayToBigInt(bytes) {
  let hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return BigInt("0x" + hex);
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
