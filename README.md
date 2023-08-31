# Private-token
Token with private balances using zkSNARKs and Homomorphic Encryption, inspired by [Zeestar](https://files.sri.inf.ethz.ch/website/papers/sp22-zeestar.pdf) and [Zether](https://crypto.stanford.edu/~buenz/papers/zether.pdf), implemented in [Noir](https://noir-lang.org/) (and Rust).

# Requirements
* node version 18 or later
* nargo version 0.10.3
* cargo v1.73.0-nightly
* forge 0.2.0
* just 1.14.0

# How to run
First, in the root directory of the project, install necessary dependencies via: 
```
just wp
```
Then, if you want to run the front-end locally in dev mode: 
```
just dev
```
If you want to run the tests for the smart contracts, run: 
```
just test
```
# Warning
Do not use in production, this was not audited and done as a final project for the [zkCamp Noir bootcamp](https://www.zkcamp.xyz/aztec).