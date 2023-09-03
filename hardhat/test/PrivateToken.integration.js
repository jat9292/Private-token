import { expect } from "chai";
import pkg from 'hardhat';
const { ethers } = pkg;
import  { spawn } from "child_process";
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

async function runRustScriptBabyGiant(X,Y) { // this is to compute the DLP during decryption of the balances with baby-step giant-step algo in circuits/exponential_elgamal/babygiant_native
  //  inside the browser this should be replaced by the WASM version in circuits/exponential_elgamal/babygiant
return new Promise((resolve, reject) => {
    const rustProcess = spawn('../circuits/exponential_elgamal/babygiant_native/target/release/babygiant', [X,Y]);
    let output = '';
    rustProcess.stdout.on('data', (data) => {
        output += data.toString();
    });
    rustProcess.stderr.on('data', (data) => {
        reject(new Error(`Rust Error: ${data}`));
    });
    rustProcess.on('close', (code) => {
      if (code !== 0) {
          reject(new Error(`Child process exited with code ${code}`));
      } else {
          resolve(BigInt(output.slice(0,-1)));
        }
    });
  });
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
  let publicKeyDeployer;
  let privateKeyUserA;
  let publicKeyUserA;
  let privateKeyUserB;
  let publicKeyUserB;
  let totalSupply;

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
  console.log(" ✅ PublicKeyInfrastructure deployed by Central Banker ✅ ");
  ({privateKey : privateKeyDeployer, publicKey: publicKeyDeployer} = babyjubjubUtils.generatePrivateAndPublicKey());
  console.log(" ");
  console.log(" 👌 Central Banker generated his pair of private/public keys on Baby Jubjub 👌 ");
  await publicKeyInfrastructure.registerPublicKey(publicKeyDeployer.x,publicKeyDeployer.y);
  console.log(" ");
  console.log(" ✒️  Central Banker registered his public key in PublicKeyInfrastructure ✒️ ");
  const privateTokenFactory = await ethers.getContractFactory("PrivateToken");
  totalSupply = 1_000_000_000_000;
  const totalSupplyEncrypted = babyjubjubUtils.exp_elgamal_encrypt(publicKeyDeployer,totalSupply);
  console.log(" ");
  const inputs_mint = {private_key: privateKeyDeployer, 
              randomness: totalSupplyEncrypted.randomness,
              public_key_x: publicKeyDeployer.x,
              public_key_y: publicKeyDeployer.y,
              value: BigInt(totalSupply.toString()),
              C1_x: totalSupplyEncrypted.C1.x,
              C1_y: totalSupplyEncrypted.C1.y,
              C2_x: totalSupplyEncrypted.C2.x,
              C2_y: totalSupplyEncrypted.C2.y};

  console.log(" ⏳ Central Banker is computing a mint circuit proof offchain ⏳");
  const proof_mint = await proofUtils.genProof("mint",inputs_mint);
  console.log(" 🆗 Central Banker successfully computed a mint proof and checked it offchain 🆗 ");
  console.log(" ");
  const sliced_proof_mint = uint8ArrayToHexString(proof_mint.slice(7*32)); // bb.js appends the public inputs to the proof, and there are 7 public inputs (bytes32) for the mint circuit
  privateToken = await privateTokenFactory.deploy(totalSupply,await publicKeyInfrastructure.getAddress(),await mintUltraVerifier.getAddress(),
                                              await transferUltraVerifier.getAddress(),await transferToNewUltraVerifier.getAddress(), sliced_proof_mint, 
                                        {C1x: totalSupplyEncrypted.C1.x, C1y: totalSupplyEncrypted.C1.y, C2x: totalSupplyEncrypted.C2.x,C2y: totalSupplyEncrypted.C2.y});
  console.log(" ✅ Private token deployed by Central Banker ✅ ");

});


  it("Scenario with multiple private transfers", async () => {
    console.log("Total Supply : ", totalSupply);
    console.log(" ");
    ({ privateKey: privateKeyUserA, publicKey: publicKeyUserA } = babyjubjubUtils.generatePrivateAndPublicKey());
    console.log(" 👌 UserA generated his pair of private/public keys on Baby Jubjub 👌 ");
    await publicKeyInfrastructure.connect(userA).registerPublicKey(publicKeyUserA.x,publicKeyUserA.y);
    console.log(" ");
    console.log(" ✒️  UserA registered his public key in PublicKeyInfrastructure ✒️ ");
    console.log(" ");
    ({ privateKey: privateKeyUserB, publicKey: publicKeyUserB } = babyjubjubUtils.generatePrivateAndPublicKey());
    console.log(" 👌 UserB generated his pair of private/public keys on Baby Jubjub 👌 ");
    await publicKeyInfrastructure.connect(userB).registerPublicKey(publicKeyUserB.x,publicKeyUserB.y);
    console.log(" ");
    console.log(" ✒️  UserB registered his public key in PublicKeyInfrastructure ✒️ ");
    console.log(" ");

    let balance_deployer_enc_old = await privateToken.balances(await deployer.getAddress());
    console.log("Public encrypted Balance of Central Banker (read from PrivateToken contract) : ",  balance_deployer_enc_old.map(bigInt => bigInt.toString()));
    let balance_userA_enc_old = await privateToken.balances(await userA.getAddress());
    console.log("Public encrypted Balance of UserA (read from PrivateToken contract) : ",  balance_userA_enc_old.map(bigInt => bigInt.toString()));
    let balance_userB_enc_old = await privateToken.balances(await userB.getAddress());
    console.log("Public encrypted Balance of UserB (read from PrivateToken contract) : ",  balance_userB_enc_old.map(bigInt => bigInt.toString()));
    console.log(" ");
    console.log(" ⏳ Central Banker is computing a transfer_to_new circuit proof offchain ⏳");
    const value_sent_deployer_to_A = 10000;
    let balance_deployer_enc_new = babyjubjubUtils.exp_elgamal_encrypt(publicKeyDeployer,totalSupply-value_sent_deployer_to_A);
    let balance_userA_enc_new = babyjubjubUtils.exp_elgamal_encrypt(publicKeyUserA,value_sent_deployer_to_A);
    let inputs_transfer_to_new = {private_key: privateKeyDeployer, 
              randomness1: balance_deployer_enc_new.randomness,
              randomness2: balance_userA_enc_new.randomness,
              value: BigInt(value_sent_deployer_to_A.toString()),
              balance_old_me_clear: BigInt(totalSupply.toString()),

              public_key_me_x: publicKeyDeployer.x,
              public_key_me_y: publicKeyDeployer.y,

              public_key_to_x: publicKeyUserA.x,
              public_key_to_y: publicKeyUserA.y,

              balance_old_me_encrypted_1_x: balance_deployer_enc_old[0],
              balance_old_me_encrypted_1_y: balance_deployer_enc_old[1],
              balance_old_me_encrypted_2_x: balance_deployer_enc_old[2],
              balance_old_me_encrypted_2_y: balance_deployer_enc_old[3],

              balance_new_me_encrypted_1_x: balance_deployer_enc_new.C1.x,
              balance_new_me_encrypted_1_y: balance_deployer_enc_new.C1.y,
              balance_new_me_encrypted_2_x: balance_deployer_enc_new.C2.x,
              balance_new_me_encrypted_2_y: balance_deployer_enc_new.C2.y,

              balance_new_to_encrypted_1_x: balance_userA_enc_new.C1.x,
              balance_new_to_encrypted_1_y: balance_userA_enc_new.C1.y,
              balance_new_to_encrypted_2_x: balance_userA_enc_new.C2.x,
              balance_new_to_encrypted_2_y: balance_userA_enc_new.C2.y
              };

    let proof_transfer_to_new = await proofUtils.genProof("transfer_to_new",inputs_transfer_to_new);
    console.log(" 🆗 Central Banker successfully computed a transfer_to_new proof and checked it offchain 🆗 ");

    console.log(" ");
    let sliced_proof_transfer_to_new = uint8ArrayToHexString(proof_transfer_to_new.slice(16*32)); // there are 16 public inputs (bytes32) for the transfer_to_new circuit
    await privateToken.transfer(await userA.getAddress(), 
        {C1x: balance_deployer_enc_old[0], C1y: balance_deployer_enc_old[1], C2x: balance_deployer_enc_old[2], C2y: balance_deployer_enc_old[3]}, 
        {C1x: 0, C1y: 0, C2x: 0, C2y: 0}, 
        {C1x: balance_deployer_enc_new.C1.x, C1y: balance_deployer_enc_new.C1.y, C2x: balance_deployer_enc_new.C2.x, C2y: balance_deployer_enc_new.C2.y}, 
        {C1x: balance_userA_enc_new.C1.x, C1y: balance_userA_enc_new.C1.y, C2x: balance_userA_enc_new.C2.x, C2y: balance_userA_enc_new.C2.y},
        sliced_proof_transfer_to_new);
    console.log("  ✒️  Central Banker transferred 10000 Private Tokens to UserA  ✒️   ");

    console.log(" ");
    balance_deployer_enc_old = await privateToken.balances(await deployer.getAddress());
    console.log("Public encrypted Balance of Central Banker (read from PrivateToken contract) : ",  balance_deployer_enc_old.map(bigInt => bigInt.toString()));
    balance_userA_enc_old = await privateToken.balances(await userA.getAddress());
    console.log("Public encrypted Balance of UserA (read from PrivateToken contract) : ",  balance_userA_enc_old.map(bigInt => bigInt.toString()));
    balance_userB_enc_old = await privateToken.balances(await userB.getAddress());
    console.log("Public encrypted Balance of UserB (read from PrivateToken contract) : ",  balance_userB_enc_old.map(bigInt => bigInt.toString()));
    console.log(" ");

    console.log(" ⏳ UserA is decrypting his received balance using his private key and solving the DLP with baby-step giant-step algorithm ⏳ ");
    const decrypted_embedded_userA = babyjubjubUtils.exp_elgamal_decrypt_embedded(privateKeyUserA,{x:balance_userA_enc_old[0],y:balance_userA_enc_old[1]},
                                                                                  {x:balance_userA_enc_old[2],y:balance_userA_enc_old[3]});
    let decrypted_balance_userA = await runRustScriptBabyGiant(babyjubjubUtils.intToLittleEndianHex(decrypted_embedded_userA.x),
                                                                babyjubjubUtils.intToLittleEndianHex(decrypted_embedded_userA.y));
    expect(decrypted_balance_userA).to.be.equal(10000);
    console.log(" 🆗 UserA succesfully decrypted his new balance to be equal to 10000 🆗 ");
    console.log(" ")

    console.log(" ⏳ Central Banker is computing a transfer_to_new circuit proof offchain ⏳");
    const value_sent_deployer_to_B = 20000;
    balance_deployer_enc_new = babyjubjubUtils.exp_elgamal_encrypt(publicKeyDeployer,totalSupply-value_sent_deployer_to_A-value_sent_deployer_to_B);
    let balance_userB_enc_new = babyjubjubUtils.exp_elgamal_encrypt(publicKeyUserB,value_sent_deployer_to_B);
    inputs_transfer_to_new = {private_key: privateKeyDeployer, 
              randomness1: balance_deployer_enc_new.randomness,
              randomness2: balance_userB_enc_new.randomness,
              value: BigInt(value_sent_deployer_to_B.toString()),
              balance_old_me_clear: BigInt((totalSupply-value_sent_deployer_to_A).toString()),

              public_key_me_x: publicKeyDeployer.x,
              public_key_me_y: publicKeyDeployer.y,

              public_key_to_x: publicKeyUserB.x,
              public_key_to_y: publicKeyUserB.y,

              balance_old_me_encrypted_1_x: balance_deployer_enc_old[0],
              balance_old_me_encrypted_1_y: balance_deployer_enc_old[1],
              balance_old_me_encrypted_2_x: balance_deployer_enc_old[2],
              balance_old_me_encrypted_2_y: balance_deployer_enc_old[3],

              balance_new_me_encrypted_1_x: balance_deployer_enc_new.C1.x,
              balance_new_me_encrypted_1_y: balance_deployer_enc_new.C1.y,
              balance_new_me_encrypted_2_x: balance_deployer_enc_new.C2.x,
              balance_new_me_encrypted_2_y: balance_deployer_enc_new.C2.y,

              balance_new_to_encrypted_1_x: balance_userB_enc_new.C1.x,
              balance_new_to_encrypted_1_y: balance_userB_enc_new.C1.y,
              balance_new_to_encrypted_2_x: balance_userB_enc_new.C2.x,
              balance_new_to_encrypted_2_y: balance_userB_enc_new.C2.y
              };

    proof_transfer_to_new = await proofUtils.genProof("transfer_to_new",inputs_transfer_to_new);
    console.log(" 🆗 Central Banker successfully computed a transfer_to_new proof and checked it offchain 🆗 ");

    console.log(" ");
    sliced_proof_transfer_to_new = uint8ArrayToHexString(proof_transfer_to_new.slice(16*32)); // there are 16 public inputs (bytes32) for the transfer_to_new circuit
    await privateToken.transfer(await userB.getAddress(), 
        {C1x: balance_deployer_enc_old[0], C1y: balance_deployer_enc_old[1], C2x: balance_deployer_enc_old[2], C2y: balance_deployer_enc_old[3]}, 
        {C1x: 0, C1y: 0, C2x: 0, C2y: 0}, 
        {C1x: balance_deployer_enc_new.C1.x, C1y: balance_deployer_enc_new.C1.y, C2x: balance_deployer_enc_new.C2.x, C2y: balance_deployer_enc_new.C2.y}, 
        {C1x: balance_userB_enc_new.C1.x, C1y: balance_userB_enc_new.C1.y, C2x: balance_userB_enc_new.C2.x, C2y: balance_userB_enc_new.C2.y},
        sliced_proof_transfer_to_new);
    console.log("  ✒️  Central Banker transferred 20000 Private Tokens to UserB  ✒️   ");

    console.log(" ");
    balance_deployer_enc_old = await privateToken.balances(await deployer.getAddress());
    console.log("Public encrypted Balance of Central Banker (read from PrivateToken contract) : ",  balance_deployer_enc_old.map(bigInt => bigInt.toString()));
    balance_userA_enc_old = await privateToken.balances(await userA.getAddress());
    console.log("Public encrypted Balance of UserA (read from PrivateToken contract) : ",  balance_userA_enc_old.map(bigInt => bigInt.toString()));
    balance_userB_enc_old = await privateToken.balances(await userB.getAddress());
    console.log("Public encrypted Balance of UserB (read from PrivateToken contract) : ",  balance_userB_enc_old.map(bigInt => bigInt.toString()));
    console.log(" ");

    console.log(" ⏳ UserB is decrypting his received balance using his private key and solving the DLP with baby-step giant-step algorithm ⏳ ");
    let decrypted_embedded_userB = babyjubjubUtils.exp_elgamal_decrypt_embedded(privateKeyUserB,{x:balance_userB_enc_old[0],y:balance_userB_enc_old[1]},
                                                                                  {x:balance_userB_enc_old[2],y:balance_userB_enc_old[3]});
    let decrypted_balance_userB = await runRustScriptBabyGiant(babyjubjubUtils.intToLittleEndianHex(decrypted_embedded_userB.x),
                                                                babyjubjubUtils.intToLittleEndianHex(decrypted_embedded_userB.y));
    expect(decrypted_balance_userB).to.be.equal(20000);
    console.log(" 🆗 UserB succesfully decrypted his new balance to be equal to 20000 🆗 ");
    console.log(" ")

    console.log(" ⏳ UserA is computing a transfer circuit proof offchain ⏳");
    const value_sent_A_to_B = 100;
    balance_userA_enc_new = babyjubjubUtils.exp_elgamal_encrypt(publicKeyUserA,10000-value_sent_A_to_B);
    const delta_balance_userB_enc_new = babyjubjubUtils.exp_elgamal_encrypt(publicKeyUserB,value_sent_A_to_B);
    balance_userB_enc_new = {C1: babyjubjubUtils.add_points({x:balance_userB_enc_old[0],y:balance_userB_enc_old[1]},delta_balance_userB_enc_new.C1),
                            C2: babyjubjubUtils.add_points({x:balance_userB_enc_old[2],y:balance_userB_enc_old[3]},delta_balance_userB_enc_new.C2)}; // Homomorphic addition of encrypted points
    let inputs_transfer = {private_key: privateKeyUserA, 
              randomness1: balance_userA_enc_new.randomness,
              randomness2: delta_balance_userB_enc_new.randomness,
              value: BigInt(value_sent_A_to_B.toString()),
              balance_old_me_clear: BigInt((10000).toString()),

              public_key_me_x: publicKeyUserA.x,
              public_key_me_y: publicKeyUserA.y,

              public_key_to_x: publicKeyUserB.x,
              public_key_to_y: publicKeyUserB.y,

              balance_old_me_encrypted_1_x: balance_userA_enc_old[0],
              balance_old_me_encrypted_1_y: balance_userA_enc_old[1],
              balance_old_me_encrypted_2_x: balance_userA_enc_old[2],
              balance_old_me_encrypted_2_y: balance_userA_enc_old[3],

              balance_old_to_encrypted_1_x: balance_userB_enc_old[0],
              balance_old_to_encrypted_1_y: balance_userB_enc_old[1],
              balance_old_to_encrypted_2_x: balance_userB_enc_old[2],
              balance_old_to_encrypted_2_y: balance_userB_enc_old[3],

              balance_new_me_encrypted_1_x: balance_userA_enc_new.C1.x,
              balance_new_me_encrypted_1_y: balance_userA_enc_new.C1.y,
              balance_new_me_encrypted_2_x: balance_userA_enc_new.C2.x,
              balance_new_me_encrypted_2_y: balance_userA_enc_new.C2.y,

              balance_new_to_encrypted_1_x: balance_userB_enc_new.C1.x,
              balance_new_to_encrypted_1_y: balance_userB_enc_new.C1.y,
              balance_new_to_encrypted_2_x: balance_userB_enc_new.C2.x,
              balance_new_to_encrypted_2_y: balance_userB_enc_new.C2.y
              };

    const proof_transfer = await proofUtils.genProof("transfer",inputs_transfer);
    console.log(" 🆗 UserA successfully computed a transfer proof and checked it offchain 🆗 ");

    console.log(" ");
    const sliced_proof_transfer = uint8ArrayToHexString(proof_transfer.slice(20*32)); // there are 16 public inputs (bytes32) for the transfer_to_new circuit
    await privateToken.connect(userA).transfer(await userB.getAddress(), 
        {C1x: balance_userA_enc_old[0], C1y: balance_userA_enc_old[1], C2x: balance_userA_enc_old[2], C2y: balance_userA_enc_old[3]}, 
        {C1x: balance_userB_enc_old[0], C1y: balance_userB_enc_old[1], C2x: balance_userB_enc_old[2], C2y: balance_userB_enc_old[3]}, 
        {C1x: balance_userA_enc_new.C1.x, C1y: balance_userA_enc_new.C1.y, C2x: balance_userA_enc_new.C2.x, C2y: balance_userA_enc_new.C2.y}, 
        {C1x: balance_userB_enc_new.C1.x, C1y: balance_userB_enc_new.C1.y, C2x: balance_userB_enc_new.C2.x, C2y: balance_userB_enc_new.C2.y},
        sliced_proof_transfer);
    console.log("  ✒️  UserA transferred 100 Private Tokens to UserB  ✒️   ");

    console.log(" ");
    balance_deployer_enc_old = await privateToken.balances(await deployer.getAddress());
    console.log("Public encrypted Balance of Central Banker (read from PrivateToken contract) : ",  balance_deployer_enc_old.map(bigInt => bigInt.toString()));
    balance_userA_enc_old = await privateToken.balances(await userA.getAddress());
    console.log("Public encrypted Balance of UserA (read from PrivateToken contract) : ",  balance_userA_enc_old.map(bigInt => bigInt.toString()));
    balance_userB_enc_old = await privateToken.balances(await userB.getAddress());
    console.log("Public encrypted Balance of UserB (read from PrivateToken contract) : ",  balance_userB_enc_old.map(bigInt => bigInt.toString()));
    console.log(" ");

    console.log(" ⏳ UserB is decrypting his new balance using his private key and solving the DLP with baby-step giant-step algorithm ⏳ ");
    decrypted_embedded_userB = babyjubjubUtils.exp_elgamal_decrypt_embedded(privateKeyUserB,{x:balance_userB_enc_old[0],y:balance_userB_enc_old[1]},
                                                                                  {x:balance_userB_enc_old[2],y:balance_userB_enc_old[3]});
    decrypted_balance_userB = await runRustScriptBabyGiant(babyjubjubUtils.intToLittleEndianHex(decrypted_embedded_userB.x),
                                                                babyjubjubUtils.intToLittleEndianHex(decrypted_embedded_userB.y));
    expect(decrypted_balance_userB).to.be.equal(20100);
    console.log(" 🆗 UserB succesfully decrypted his new balance to be equal to 20100 🆗 ");
    console.log(" ");
    console.log(" 🔥🔥🔥 LFG 🔥🔥🔥");

  });



});
