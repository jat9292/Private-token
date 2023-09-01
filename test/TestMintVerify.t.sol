// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {UltraVerifier} from "../circuits/mint/contract/mint/plonk_vk.sol";

contract TestMintVerify is Test {
    UltraVerifier mintVerifier;
    bytes proofBytes;

    function setUp() public {
        mintVerifier = new UltraVerifier();
        string memory proofFilePath = "./circuits/mint/proofs/mint.proof";
        string memory proof = vm.readLine(proofFilePath);
        proofBytes = vm.parseBytes(proof);
        
    }
    function test_verifyProof() public {
        bytes32[] memory publicInputs = new bytes32[](7);
        publicInputs[0] = 0x1cda22076db52c0b803c239b6515e88e2e2ae819aec57a4601599b0e9ca1ec9a; // same public inputs as in ../circuits/mint/Prover.toml
        publicInputs[1] = 0x27e92be248c00a5d0e387a641474370d593f1724de2774ff663c6442d9ac75bf;
        publicInputs[2] = 0x000000000000000000000000000000000000000000000000000000e8d4a51000;
        publicInputs[3] = 0x21f019c26030a8ba04e840eef7355cac5b2daa35fc8d3dc9bd3f4f924134e079;
        publicInputs[4] = 0x0cbbf6b4e12c000df0ebd4f378e5257e0f6d86c2f13f32b67018f9ced1c90c63;
        publicInputs[5] = 0x283278d73f095173259a856b3389dbf8ee7eff2a3e231eb212ec213d9f9e91bb;
        publicInputs[6] = 0x219c325f30779f272ade47d8437c0881f3d7dcd5a7922ad8a6998b90f9ecefd2;
        assert(mintVerifier.verify(proofBytes, publicInputs));
    }

}
