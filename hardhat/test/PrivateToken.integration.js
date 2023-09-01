import { expect } from "chai";
import pkg from 'hardhat';
const { ethers } = pkg;

import * as babyjubjubUtils from '../../utils/babyjubjub_utils.js';
import * as proofUtils from '../../utils/proof_utils.js';

describe("Private Token integration testing", function () {
  let publicKeyInfrastructure;
  let privateToken;
  let mintUltraVerifier;
  let transferUltraVerifier;
  let transferToNewUltraVerifier;
  let accounts;
  let deployer; // i.e Central Banker, or deployer of Private Token
  let userA;
  let userB;
  let privateKeyDeployer;
  let privateKeyUserA;
  let privateKeyUserB;


- before(async () => { //Setup phase with initial deployments
  accounts = await ethers.getSigners();
  deployer = accounts[0];
  userA = accounts[1];
  userB = accounts[2];

  console.log("Deploying the 3 verification contracts - these could be deployed only once and used for all the instances of private tokens");
  const mintUltraVerifierFactory = await ethers.getContractFactory("MintUltraVerifier");
  const transferUltraVerifierFactory = await ethers.getContractFactory("TransferUltraVerifier");
  const transferToNewUltraVerifierFactory = await ethers.getContractFactory("TransferToNewUltraVerifier");

  console.log(" ");
  mintUltraVerifier = await mintUltraVerifierFactory.deploy();
  console.log(" ✅ Mint circuit verifier contract deployed successfully ✅ ");
  transferUltraVerifier = await transferUltraVerifierFactory.deploy();
  console.log(" ✅ Transfer circuit verifier contract deployed successfully ✅ ");
  transferToNewUltraVerifier = await transferToNewUltraVerifierFactory.deploy();
  console.log(" ✅ Transfer_To_New circuit verifier contract deployed successfully ✅ ");
  console.log(" ");
  console.log("Now the deployer setups the Public Key Infrastrucutre contract and the corresponding Private Token contract");
  console.log(" ");
  const publicKeyInfrastructureFactory = await ethers.getContractFactory("PublicKeyInfrastructure");
  publicKeyInfrastructure = await publicKeyInfrastructureFactory.deploy();
  console.log(" ✅ PublicKeyInfrastructure deployed by central banker ✅ ");
  const { privateKey: privateKeyDeployer, publicKey: publicKeyDeployer } = babyjubjubUtils.generatePrivateAndPublicKey();
  console.log(" 👌 Central banker generated his pair of private/public keys on Baby Jubjub 👌 ");
  await publicKeyInfrastructure.registerPublicKey(publicKeyDeployer.x,publicKeyDeployer.y);
  console.log(" 🤝 Central banker registered his public key in PublicKeyInfrastructure 🤝 ");
  const privateTokenFactory = await ethers.getContractFactory("PrivateToken");
  const totalSupply = 1_000_000_000_000;
  const totalSupplyEncrypted = babyjubjubUtils.exp_elgamal_encrypt(publicKeyDeployer,totalSupply);
  const inputs_mint = {private_key: privateKeyDeployer, 
              randomness: totalSupplyEncrypted.randomness,
              public_key_x: publicKeyDeployer.x,
              public_key_y: publicKeyDeployer.y,
              value: BigInt(totalSupply.toString()),
              C1_x: totalSupplyEncrypted.C1.x,
              C1_y: totalSupplyEncrypted.C1.y,
              C2_x: totalSupplyEncrypted.C2.x,
              C2_y: totalSupplyEncrypted.C2.y};
  console.log(" ⏳ Central banker is computing a mint circuit proof offchain ⏳");
  const proof_mint = await proofUtils.genProof("mint",inputs_mint);
  console.log(" 🆗 Central banker successfully computed a mint proof and checked it offchain 🆗 ");
  //console.log(await mintUltraVerifier.getAddress())
  privateToken = await privateTokenFactory.deploy(totalSupply,await publicKeyInfrastructure.getAddress(),await mintUltraVerifier.getAddress(),
                                              await transferUltraVerifier.getAddress(),await transferToNewUltraVerifier.getAddress(), proof_mint, 
                                        {C1x: totalSupplyEncrypted.C1.x, C1y: totalSupplyEncrypted.C1.y, C2x: totalSupplyEncrypted.C2.x,C2y: totalSupplyEncrypted.C2.y});
  console.log(" ✅ Private token deployed by central banker ✅ ");


});


  it("Scenario with multiple private transfers", async () => {
    
  });


});
