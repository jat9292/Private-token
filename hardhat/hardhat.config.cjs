require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("hardhat-deploy");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      chainId: 11155111,
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.TESTING_PRIVATE_KEY],
      saveDeployments: true,
      verify: {
        etherscan: {
          apiKey: process.env.ETHERSCAN_API_KEY
        }
      }
  },
  },

  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
      sepolia: "0xF273ac6D39fe8FBa3FA49e5085dB6411B1FeE943", //it can also specify a specific netwotk name (specified in hardhat.config.js)
      31337: 0,
    },
  },
  paths: {
    deploy: "deploy",
    deployments: "deployments",
  },
};
