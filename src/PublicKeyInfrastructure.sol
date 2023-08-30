// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

struct PublicKey { // #TODO : We could pack those in a single uint256 to save storage costs (for e.g using circomlibjs library to pack points on BabyJubjub) 
    uint256 X;
    uint256 Y;
} // The Public Key should be a point on Baby JubJub elliptic curve : checks must be done offchain before registering to ensure that X<p and Y<p and (X,Y) is on the curve
// p = 21888242871839275222246405745257275088548364400416034343698204186575808495617 < 2**254

/**
 * @dev Implementation of a simple PublicKeyInfrastructure.
 * The Public Key should be a point on the Baby JubJub elliptic curve : 
 * It is represented by its coordinates X and Y in the struct PublicKey.
 * Any Ethereum account could set its own PublicKey, which is *non-revocable* once set.
 * *Important* : it is the responsability of the user to register a valid point on Baby Jubjub as his public key, or else transfers
 * to him will fail as there is no check on X and Y values to verify that the registered point is on Baby Jubjub in this contract.
 */
contract PublicKeyInfrastructure {
    
    mapping(address  => PublicKey) internal registry;

    event NewRegisteredPublicKey(address indexed owner, uint PubKeyX, uint PubKeyY);

    function registerPublicKey(uint256 X, uint256 Y) external {
        require(X+Y!=0, "Public Key cannot be the origin point");
        PublicKey memory registeredKey = registry[msg.sender];
        require(registeredKey.X+registeredKey.Y==0, "Account already registered");
        registry[msg.sender] = PublicKey(X,Y);
        emit NewRegisteredPublicKey(msg.sender, X, Y);
    }

    function getRegistredKey(address user) external view returns(PublicKey memory){
        return registry[user];
    }
}
