// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2 as console} from "forge-std/Test.sol";
import {PrivateToken} from "../src/PrivateToken.sol";
import {PublicKeyInfrastructure} from "../src/PublicKeyInfrastructure.sol";
import {MintUltraVerifier} from "../circuits/mint/contract/mint/mint_plonk_vk.sol";
import {TransferUltraVerifier} from "../circuits/transfer/contract/transfer/transfer_plonk_vk.sol";
import {TransferToNewUltraVerifier} from "../circuits/transfer_to_new/contract/transfer_to_new/transfer_to_new_plonk_vk.sol";

contract PrivateTokenTest is Test {
    PrivateToken public privateToken;
    PublicKeyInfrastructure public publicKeyInfrastructure;
    MintUltraVerifier public mintVerifier;
    TransferUltraVerifier public transferVerifier;
    TransferToNewUltraVerifier public transferToNewVerifier;
    address deployer;
    address user1;
    address user2;

    function setUp() public {
        // Initialize the actors' addresses
        deployer = makeAddr("CentralBanker");
        user1 = makeAddr("User1");
        user2 = makeAddr("User2");

        // Deploy the verification contracts
        mintVerifier = new MintUltraVerifier();
        transferVerifier = new TransferUltraVerifier();
        transferToNewVerifier = new TransferToNewUltraVerifier();

        // The deployer aka central banker, deploys the public infrastructure, registers his public key for ElGamal encryption, and deploys a private token contract
        vm.startPrank(deployer);
        publicKeyInfrastructure = new PublicKeyInfrastructure();
        // 
        publicKeyInfrastructure.registerPublicKey(42, 42);
        vm.stopPrank();

    }

    function test_Balance() public {
        deal(deployer,1000); 
        console.log(deployer,unicode"🙂");
    }

}
