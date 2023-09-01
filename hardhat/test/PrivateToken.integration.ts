import {
  PublicKeyInfrastructure,
  PrivateToken,
  MintUltraVerifier,
  TransferUltraVerifier,
  TransferToNewUltraVerifier
} from "../typechain-types";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import * as utils from "../../utils/babyjubjub_utils.js";

describe("Private Token integration testing", function () {
  let publicKeyInfrastructure: PublicKeyInfrastructure;
  let privateToken: PrivateToken;
  let mintUltraVerifier: MintUltraVerifier;
  let transferUltraVerifier: TransferUltraVerifier;
  let transferToNewUltraVerifier: TransferToNewUltraVerifier;
  let accounts: Signer[];
  let deployer: Signer; // i.e Central Banker, or deployer of Private Token
  let userA: Signer;
  let userB: Signer;


- before(async () => { //Setup phase with initial deployments
  accounts = await ethers.getSigners();
  deployer = accounts[0];
  userA = accounts[1];
  userB = accounts[2];

  console.log("Deploying the 3 verification contracts - these could be deployed only once and used for all the instances of private tokens)");
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
  const privateTokenFactory = await ethers.getContractFactory("PrivateToken");
  publicKeyInfrastructure = await publicKeyInfrastructureFactory.deploy();
  console.log(" ✅ PublicKeyInfrastructure deployed ✅ ");
  console.log(utils.generatePrivateAndPublicKey());


});


  it("Scenario with multiple private transfers", async () => {
    
  });


});
