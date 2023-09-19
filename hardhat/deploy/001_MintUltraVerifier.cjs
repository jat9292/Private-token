const { parseEther } = require("ethers");

async function deployFunc(hre) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  console.log(deployer);
  await deploy("MintUltraVerifier", {
    from: deployer,
    log: true,
  });
}

module.exports = deployFunc;
deployFunc.tags = ["MintUltraVerifier"];
