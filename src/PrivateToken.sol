// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./PublicKeyInfrastructure.sol";

// total supply is set at construction by the deployer and cannot exceed type(uint40).max = 1099511627775 because during Exponential ElGamal decryption we must solve the DLP quickly
contract PrivateToken {
    struct EncryptedBalance {
        uint256 C1x;
        uint256 C1y;
        uint256 C2x;
        uint256 C2y;
    }

    PublicKeyInfrastructure public immutable PKI;
    uint40 public immutable totalSupply;
    mapping(address=>EncryptedBalance) public balances;

    constructor(address PKIaddress, uint40 totalSupply_) {
        PKI = PublicKeyInfrastructure(PKIaddress);
        PublicKey memory registeredKey = PKI.getRegistredKey(msg.sender);
        require(registeredKey.X+registeredKey.Y!=0,"Deployer has not registered a Public Key yet");
        totalSupply = totalSupply_;
        _mint(msg.sender,totalSupply_);
    }

    function _mint(address minter, uint40 amount) internal {

    }
}
