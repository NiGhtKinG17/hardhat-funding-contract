const { getNamedAccounts } = require("hardhat")

async function main() {
  const { deployer } = await getNamedAccounts()
  const fundMe = await ethers.getContract("FundMe", deployer)
  console.log("Funding...")
  const transactionResponse = await fundMe.fund({
    value: ethers.utils.parseEther("0.2")
  })
  await transactionResponse.wait(1)
  console.log("Funded 0.2 Eth")
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
