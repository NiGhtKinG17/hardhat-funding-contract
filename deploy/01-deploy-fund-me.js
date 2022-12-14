const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId
  let priceFeedAddress
  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator")
    priceFeedAddress = ethUsdAggregator.address
  } else {
    priceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
  }

  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: [priceFeedAddress],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1
  })

  if (!developmentChains.includes(network.name) && process.env.ES_API_KEY) {
    await verify(fundMe.address, [priceFeedAddress])
  }
  log("++++++++++++++++++++++++++++++++++++++")
}

module.exports.tags = ["all", "fundMe"]
