# Private-token
Token with private balances using zkSNARKs and Homomorphic Encryption, inspired by [Zeestar](https://files.sri.inf.ethz.ch/website/papers/sp22-zeestar.pdf) and [Zether](https://crypto.stanford.edu/~buenz/papers/zether.pdf), implemented in [Noir](https://noir-lang.org/) (and Rust).

The dApp is currently deployed here, try it now --> **https://privatetoken.xyz/** <-- you should connect your Web3 wallet to the Sepolia test network and own some testnet ETH. (If needed, you could mine some Sepolia ETH here :  https://sepolia-faucet.pk910.de/  : 0.1 ETH should be enough to send Private Token transactions).

You can read the slides presenting the final project [here](https://docs.google.com/presentation/d/1SDTOthvK1xCXcoKlILIKCobktrDf_ibPUbHtykAQfpc/edit?usp=sharing).

# Quick description

This project is an implementation of a token on Ethereum with private balances, i.e all the balances are publicly stored on the Ethereum blockchain in an encrypted format, but only the owner of an Ethereum account is able to decrypt their own balance. This is possible thanks to the improved expressiveness allowed by homomorphic encryption on top of zkSNARKs, allowing a party **A** to compute over encrypted data owned by *another* party **B** i.e **A** can add encrpyted balances owned by **B** without needing  any knowledge of those balances in unencrypted format.

The current model is the following : 

First, a deployer, also called *Central Banker*, should deploy a new Private Token smart contract by minting its initial supply to himself. The deployment actually consists of creating 2 smart contracts : 

1/ First a Public Key Infrastructure (PKI) contract is deployed, this contract will contain the mapping between Ethereum addresses and Public Keys (points on the Baby Jubjub curve).

2/ Then, after registering his public key in the PKI, the Central banker will compute a "mint proof" locally and deploy the Private Token contract by giving to its constructor the total minted supply, the PKI address and the "mint proof".

3/ More precisely, there are also 3 other contracts which correspond to the 3 zkSNARKs verifier contracts needed for the mint and transfer transactions (see details of architecture in the slides). But those are reused for any instance of a newly deployed Private Token contract.

After the deployment of the new Private Token, transfers between users can occur. Initially, any new receiver should register a public key under their control in the corresponding PKI. Afterwards, they will be able to send or receive tokens as often as they wish (sending transactions still require a sufficient balance, obviously). Note that, initially, only the Central Banker is registered. However, registration is open to any Ethereum account.

The Baby Jubjub private key, which corresponds to the public key, should be safeguarded diligently by each registered user. If lost, the user will no longer have access to their funds. Conversely, if the private key is shared with a third party, privacy is compromised; the third party can decrypt the user's balance. Nonetheless, in this scenario, the user's funds remain secure since each transfer transaction still requires a signature from the corresponding Ethereum private key.

# Requirements
* `nargo` version 0.10.5 **Important**
* `node` version 18 or later
* `cargo` v1.73.0-nightly
* `just 1.14.0` (install it via `cargo install just`)

# To run the tests : 

Clone the repo, install the requirements, and then just run : 
```
just test
```

# To deploy the front-end locally : 

Clone the repo, install the requirements, and then create 2 `.env` files in the `hardhat/` and `frontend` directories. Fill them with the same keys as in the corresponding `.env.example`files placed in the corresponding directories. `CHAINNAME`should be set to `sepolia`in `hardhat/.env`and a valid Sepolia RPC URL given for `SEPOLIA_RPC_URL`. Then run the following commands in this order : 
```
just wp
```
```
just ds
```
```
just release
```

# Warning
Do not use in production, this was not audited and done as a final project for the [zkCamp Noir bootcamp](https://www.zkcamp.xyz/aztec).