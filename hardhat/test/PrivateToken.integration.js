import { expect } from "chai";
import pkg from 'hardhat';
const { ethers } = pkg;

import * as babyjubjubUtils from '../../utils/babyjubjub_utils.js';
import * as proofUtils from '../../utils/proof_utils.js';


function uint8ArrayToHexString(arr) {
  return '0x' + Array.from(arr).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function bigIntToHexString(bigIntValue) {
  let hexString = bigIntValue.toString(16);
  // Ensure it's 64 characters long (32 bytes), padding with leading zeros if necessary
  while (hexString.length < 64) {
      hexString = '0' + hexString;
  }
  return '0x' + hexString;
}


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

  this.timeout(1000000);

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

  
  const publicInputs = [bigIntToHexString(publicKeyDeployer.x),bigIntToHexString(publicKeyDeployer.y),bigIntToHexString(BigInt(totalSupply.toString())),
    bigIntToHexString(totalSupplyEncrypted.C1.x),bigIntToHexString(totalSupplyEncrypted.C1.y),bigIntToHexString(totalSupplyEncrypted.C2.x),bigIntToHexString(totalSupplyEncrypted.C2.y)];

  const sliced_proof_mint = proof_mint.slice(publicInputs.length*32); //  bb.js appends the public inputs to the proof
  const string_proof = uint8ArrayToHexString(sliced_proof_mint);
  console.log("All inputs : ", inputs_mint)
  console.log("Public Inputs Array : " , publicInputs)
  //let result = await mintUltraVerifier.verify(uint8ArrayToHexString(sliced_proof_mint),publicInputs);
  let public_inputs_sliced = [];
  for (let i = 0; i < publicInputs.length*32; i += 32) {
    public_inputs_sliced.push(proof_mint.slice(i, i + 32));
  }
  console.log("Public Inputs Sliced : " , public_inputs_sliced);

  const public_inputs_sliced_string = public_inputs_sliced.map(input_sliced => uint8ArrayToHexString(input_sliced));
  console.log("Public Inputs Sliced String: " , public_inputs_sliced_string);
  let result = await mintUltraVerifier.verify(uint8ArrayToHexString(sliced_proof_mint),public_inputs_sliced_string);
  console.log("Testing onchain verification : " , result); 






  //privateToken = await privateTokenFactory.deploy(totalSupply,await publicKeyInfrastructure.getAddress(),await mintUltraVerifier.getAddress(),
  //                                            await transferUltraVerifier.getAddress(),await transferToNewUltraVerifier.getAddress(), uint8ArrayToHexString(sliced_proof_mint), 
   //                                     {C1x: totalSupplyEncrypted.C1.x, C1y: totalSupplyEncrypted.C1.y, C2x: totalSupplyEncrypted.C2.x,C2y: totalSupplyEncrypted.C2.y});
  //console.log(" ✅ Private token deployed by central banker ✅ ");

});


  it("Scenario with multiple private transfers", async () => {
    
  });


});
