# Private-token
Token with private balances using zkSNARKs and Homomorphic Encryption, inspired by [Zeestar](https://files.sri.inf.ethz.ch/website/papers/sp22-zeestar.pdf) and [Zether](https://crypto.stanford.edu/~buenz/papers/zether.pdf), implemented in [Noir](https://noir-lang.org/) (and Rust).

You can read the slides presenting the final project [here](https://docs.google.com/presentation/d/1SDTOthvK1xCXcoKlILIKCobktrDf_ibPUbHtykAQfpc/edit?usp=sharing).

# Requirements
* nargo version 0.10.5 **Important**
* node version 18 or later
* cargo v1.73.0-nightly
* hardhat v2.17.2
* just 1.14.0

# To run the tests : 

Clone the repo, install the requirements, and then run : 
```
just test
```

# Warning
Do not use in production, this was not audited and done as a final project for the [zkCamp Noir bootcamp](https://www.zkcamp.xyz/aztec).