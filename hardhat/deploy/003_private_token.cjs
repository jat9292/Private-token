const { parseEther } = require("ethers");
const fs = require("fs");
const path = require("path");

let babyjubjubUtils;

async function loadUtils() {
  babyjubjubUtils = await import("../../utils/babyjubjub_utils.js");
  proofUtils = await import("../../utils/proof_utils.js");
}

async function deployFunc(hre) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, execute } = deployments;
  const { deployer } = await getNamedAccounts();

  let privateKeyDeployer;
  let publicKeyDeployer;
  let totalSupply = 1_000_000_000_000;
  let totalSupplyEncrypted;
  await loadUtils().then(() => {
    ({ privateKey: privateKeyDeployer, publicKey: publicKeyDeployer } =
      babyjubjubUtils.generatePrivateAndPublicKey());
    totalSupplyEncrypted = babyjubjubUtils.exp_elgamal_encrypt(
      publicKeyDeployer,
      totalSupply
    );
  });

  const inputs_mint = {
    private_key: privateKeyDeployer,
    randomness: totalSupplyEncrypted.randomness,
    public_key_x: publicKeyDeployer.x,
    public_key_y: publicKeyDeployer.y,
    value: BigInt(totalSupply.toString()),
    C1_x: totalSupplyEncrypted.C1.x,
    C1_y: totalSupplyEncrypted.C1.y,
    C2_x: totalSupplyEncrypted.C2.x,
    C2_y: totalSupplyEncrypted.C2.y,
  };

  const proof_mint = await proofUtils.genProof("mint", inputs_mint);

  const sliced_proof_mint = uint8ArrayToHexString(proof_mint.slice(7 * 32)); // bb.js appends the public inputs to the proof, and there are 7 public inputs (bytes32) for the mint circuit

  const addressMUV = getAddrFromDeployments("localhost", "MintUltraVerifier");
  const addressTransferUltraVerifier = getAddrFromDeployments(
    "localhost",
    "TransferUltraVerifier"
  );
  const addressTransferToNewUltraVerifier = getAddrFromDeployments(
    "localhost",
    "TransferToNewUltraVerifier"
  );

  const addressPubKeyInfra = getAddrFromDeployments(
    "localhost",
    "PublicKeyInfrastructure"
  );

  await execute(
    "PublicKeyInfrastructure",
    { from: deployer, log: true },
    "registerPublicKey",
    publicKeyDeployer.x,
    publicKeyDeployer.y
  );

  await deploy("PrivateToken", {
    from: deployer,
    args: [
      totalSupply,
      addressPubKeyInfra,
      addressMUV,
      addressTransferUltraVerifier,
      addressTransferToNewUltraVerifier,
      sliced_proof_mint,
      {
        C1x: totalSupplyEncrypted.C1.x,
        C1y: totalSupplyEncrypted.C1.y,
        C2x: totalSupplyEncrypted.C2.x,
        C2y: totalSupplyEncrypted.C2.y,
      },
    ],
    log: true,
  });
}

function getAddrFromDeployments(chainName, contractName) {
  const filePath = path.join(
    __dirname,
    "..",
    "deployments",
    chainName,
    `${contractName}.json`
  );

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const jsonObject = JSON.parse(fileContent);

  return jsonObject.address;
}

function getAbiFromDeployments(chainName, contractName) {
  const filePath = path.join(
    __dirname,
    "..",
    "deployments",
    chainName,
    `${contractName}.json`
  );

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const jsonObject = JSON.parse(fileContent);

  return jsonObject.abi;
}

function uint8ArrayToHexString(arr) {
  return (
    "0x" +
    Array.from(arr)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  );
}

module.exports = deployFunc;
deployFunc.tags = ["PrivateToken"];
