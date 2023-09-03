// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./PublicKeyInfrastructure.sol";
import {MintUltraVerifier} from "./mint_plonk_vk.sol";
import {TransferUltraVerifier} from "./transfer_plonk_vk.sol";
import {TransferToNewUltraVerifier} from "./transfer_to_new_plonk_vk.sol";

/**
 * @dev Implementation of PrivateToken.
 * total supply is set at construction by the deployer and cannot exceed type(uint40).max = 1099511627775 because during Exponential ElGamal decryption we must solve the DLP quickly
 * Balances are encrypted to each owner's public key, according to the registered keys inside the PublicKeyInfrastructure.
 * Because we use Exponential ElGamal encryption, each EncryptedBalance is a pair of points on Baby Jubjub (C1,C2) = ((C1x,C1y),(C2x,C2y)).
 */
contract PrivateToken {
    struct EncryptedBalance { // #TODO : We could pack those in 2 uints instead of 4 to save storage costs (for e.g using circomlibjs library to pack points on BabyJubjub) 
        uint256 C1x;
        uint256 C1y;
        uint256 C2x;
        uint256 C2y;
    }

    PublicKeyInfrastructure public immutable PKI;
    MintUltraVerifier public immutable MintVerifier;
    TransferUltraVerifier public immutable TransferVerifier;
    TransferToNewUltraVerifier public immutable TransferToNewVerifier;
    uint40 public immutable totalSupply;

    mapping(address=>EncryptedBalance) public balances;

    event PrivateTransfer(address indexed to, address indexed from);

    constructor(uint40 totalSupply_, address PKIAddress, address MintVerifierAddress, address TransferVerifierAddress, 
            address TransferToNewVerifierAddress, bytes memory proof_mint, EncryptedBalance memory  totalSupplyEncrypted) {
        PKI = PublicKeyInfrastructure(PKIAddress);
        MintVerifier = MintUltraVerifier(MintVerifierAddress);
        TransferVerifier = TransferUltraVerifier(TransferVerifierAddress);
        TransferToNewVerifier = TransferToNewUltraVerifier(TransferToNewVerifierAddress);
        PublicKey memory registeredKey = PKI.getRegistredKey(msg.sender);
        require(registeredKey.X+registeredKey.Y!=0,"Deployer has not registered a Public Key yet"); // this should never overflow because 4*p<type(uint256).max
        totalSupply = totalSupply_;
        _mint(msg.sender,totalSupply_,proof_mint,registeredKey,totalSupplyEncrypted);
    }

    function _mint(address minter, uint40 amount, bytes memory proof_mint, PublicKey memory registeredKey, 
            EncryptedBalance memory totalSupplyEncrypted) internal {
        bytes32[] memory publicInputs = new bytes32[](7);
        publicInputs[0] = bytes32(registeredKey.X);
        publicInputs[1] = bytes32(registeredKey.Y);
        publicInputs[2] = bytes32(uint256(amount));
        publicInputs[3] = bytes32(totalSupplyEncrypted.C1x);
        publicInputs[4] = bytes32(totalSupplyEncrypted.C1y);
        publicInputs[5] = bytes32(totalSupplyEncrypted.C2x);
        publicInputs[6] = bytes32(totalSupplyEncrypted.C2y);
        require(MintVerifier.verify(proof_mint, publicInputs), "Mint proof is invalid"); // checks that the initial balance of the deployer is a correct encryption of the initial supply (and the deployer owns the private key corresponding to his registered public key)
        balances[minter] = totalSupplyEncrypted;
    }

    function transfer(address to, EncryptedBalance calldata EncryptedBalanceOldMe, EncryptedBalance calldata EncryptedBalanceOldTo, 
            EncryptedBalance calldata EncryptedBalanceNewMe, EncryptedBalance calldata EncryptedBalanceNewTo, bytes memory proof_transfer) public {
        EncryptedBalance memory EncryptedBalanceOldMeNow = balances[msg.sender];
        EncryptedBalance memory EncryptedBalanceOldToNow = balances[to];
        require(EncryptedBalanceOldToNow.C1x==EncryptedBalanceOldTo.C1x && EncryptedBalanceOldToNow.C1y==EncryptedBalanceOldTo.C1y
            && EncryptedBalanceOldToNow.C2x==EncryptedBalanceOldTo.C2x && EncryptedBalanceOldToNow.C2y==EncryptedBalanceOldTo.C2y
            && EncryptedBalanceOldMeNow.C1x==EncryptedBalanceOldMe.C1x && EncryptedBalanceOldMeNow.C1y==EncryptedBalanceOldMe.C1y
            && EncryptedBalanceOldMeNow.C2x==EncryptedBalanceOldMe.C2x && EncryptedBalanceOldMeNow.C2y==EncryptedBalanceOldMe.C2y); // this require is at the top of the transfer function, in order to limit gas spent in case of accidental front-running - front-running attack issue is already deterred thanks to the assert(value>=1) constraint inside the circuits (see comments in transfer/src/main.nr)
        require(msg.sender!=to, "Cannot transfer to self");
        PublicKey memory registeredKeyMe = PKI.getRegistredKey(msg.sender);
        PublicKey memory registeredKeyTo = PKI.getRegistredKey(to);
        require(registeredKeyMe.X+registeredKeyMe.Y!=0,"Sender has not registered a Public Key yet");
        require(registeredKeyTo.X+registeredKeyTo.Y!=0,"Receiver has not registered a Public Key yet");
        require(EncryptedBalanceOldMe.C1x+EncryptedBalanceOldMe.C1y+EncryptedBalanceOldMe.C1y+EncryptedBalanceOldMe.C2y!=0,"Sender has not received tokens yet"); // this should never overflow because 4*p<type(uint256).max

        bool receiverAlreadyReceived = (EncryptedBalanceOldTo.C1x+EncryptedBalanceOldTo.C1y+EncryptedBalanceOldTo.C1y+EncryptedBalanceOldTo.C2y!=0); // this should never overflow because 4*p<type(uint256).max

        if (receiverAlreadyReceived){
            bytes32[] memory publicInputs = new bytes32[](20);
            publicInputs[0] = bytes32(registeredKeyMe.X);
            publicInputs[1] = bytes32(registeredKeyMe.Y);

            publicInputs[2] = bytes32(registeredKeyTo.X);
            publicInputs[3] = bytes32(registeredKeyTo.Y);
            
            publicInputs[4] = bytes32(EncryptedBalanceOldMe.C1x);
            publicInputs[5] = bytes32(EncryptedBalanceOldMe.C1y);
            publicInputs[6] = bytes32(EncryptedBalanceOldMe.C2x);
            publicInputs[7] = bytes32(EncryptedBalanceOldMe.C2y);

            publicInputs[8] = bytes32(EncryptedBalanceOldTo.C1x);
            publicInputs[9] = bytes32(EncryptedBalanceOldTo.C1y);
            publicInputs[10] = bytes32(EncryptedBalanceOldTo.C2x);
            publicInputs[11] = bytes32(EncryptedBalanceOldTo.C2y);

            publicInputs[12] = bytes32(EncryptedBalanceNewMe.C1x);
            publicInputs[13] = bytes32(EncryptedBalanceNewMe.C1y);
            publicInputs[14] = bytes32(EncryptedBalanceNewMe.C2x);
            publicInputs[15] = bytes32(EncryptedBalanceNewMe.C2y);

            publicInputs[16] = bytes32(EncryptedBalanceNewTo.C1x);
            publicInputs[17] = bytes32(EncryptedBalanceNewTo.C1y);
            publicInputs[18] = bytes32(EncryptedBalanceNewTo.C2x);
            publicInputs[19] = bytes32(EncryptedBalanceNewTo.C2y);

            require(TransferVerifier.verify(proof_transfer, publicInputs), "Transfer proof is invalid");
        } else {
            bytes32[] memory publicInputs = new bytes32[](16);
            publicInputs[0] = bytes32(registeredKeyMe.X);
            publicInputs[1] = bytes32(registeredKeyMe.Y);

            publicInputs[2] = bytes32(registeredKeyTo.X);
            publicInputs[3] = bytes32(registeredKeyTo.Y);
            
            publicInputs[4] = bytes32(EncryptedBalanceOldMe.C1x);
            publicInputs[5] = bytes32(EncryptedBalanceOldMe.C1y);
            publicInputs[6] = bytes32(EncryptedBalanceOldMe.C2x);
            publicInputs[7] = bytes32(EncryptedBalanceOldMe.C2y);

            publicInputs[8] = bytes32(EncryptedBalanceNewMe.C1x);
            publicInputs[9] = bytes32(EncryptedBalanceNewMe.C1y);
            publicInputs[10] = bytes32(EncryptedBalanceNewMe.C2x);
            publicInputs[11] = bytes32(EncryptedBalanceNewMe.C2y);

            publicInputs[12] = bytes32(EncryptedBalanceNewTo.C1x);
            publicInputs[13] = bytes32(EncryptedBalanceNewTo.C1y);
            publicInputs[14] = bytes32(EncryptedBalanceNewTo.C2x);
            publicInputs[15] = bytes32(EncryptedBalanceNewTo.C2y);

            require(TransferToNewVerifier.verify(proof_transfer, publicInputs), "Transfer to new address proof is invalid");
        }
        balances[msg.sender] = EncryptedBalanceNewMe;
        balances[to] = EncryptedBalanceNewTo;
        emit PrivateTransfer(msg.sender,to);
    }
}