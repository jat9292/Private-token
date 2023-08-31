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
    uint privKeyDeployer;
    uint privKeyUser1;
    uint privKeyUser2;

    struct PublicKey {
            uint x;
            uint y;
        }
    struct PairKeys {
            uint privateKey;
            PublicKey publicKey;
        }

    event Log(string);

    function setUp() public {
        // Initialize the actors' addresses
        deployer = makeAddr("CentralBanker");
        user1 = makeAddr("User1");
        user2 = makeAddr("User2");

        // Deploy the verification contracts (those should be deployed only once to save gas, and be reused for any new PrivateToken instance)
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
    function testFFI() public {
        string[] memory cmds = new string[](3);
        cmds[0] = "node";
        cmds[1] = "utils/cli_utils.js";
        cmds[2] = "generatePrivateAndPublicKey";
        string memory res = string(vm.ffi(cmds));    // equivalent to : `node utils/cli_utils.js generatePrivateAndPublicKey`
        uint privateKey = vm.parseJsonUint(res,".privateKey");
        uint x = vm.parseJsonUint(res,".publicKey.x");
        uint y = vm.parseJsonUint(res,".publicKey.y");
        

    }

    /*
    function testFFI2() public {
        string[] memory cmds = new string[](4);
        cmds[0] = "node";
        cmds[1] = "utils/cli_utils.js";
        cmds[2] = "privateToPublicKey";
        cmds[3] = "791106410638591143611845459056285936513507729259988359186893524387045442411";
        string memory res = string(vm.ffi(cmds));    // equivalent to : `node utils/cli_utils.js privateToPublicKey 791106410638591143611845459056285936513507729259988359186893524387045442411`
        uint x = vm.parseJsonUint(res,".x");
        console.log(x);
        uint y = vm.parseJsonUint(res,".y");
        console.log(y);
    }*/

    /*
    function test_Balance() public {
        deal(deployer,1000); 
        console.log(deployer,unicode"🙂");
    }*/

}
