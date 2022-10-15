const { assert, expect } = require("chai")
const { deployments, getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function() {
      let fundMe, deployer, mockV3Aggregator
      const sendValue = ethers.utils.parseEther("1")
      beforeEach(async function() {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture("all")
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        )
      })

      describe("constructor", async function() {
        it("sets aggregator address correctly", async function() {
          const response = await fundMe.getPriceFeed()
          assert.equal(response, mockV3Aggregator.address)
        })
      })

      describe("fund", async function() {
        it("Fails if not sent enough amount", async function() {
          await expect(fundMe.fund()).to.be.reverted
        })
        it("Updates the amount funded of the funder", async function() {
          await fundMe.fund({ value: sendValue })
          const response = await fundMe.getAddress2Amt(deployer)
          assert.equal(response.toString(), sendValue.toString())
        })
        it("Adds funder to funders list", async function() {
          await fundMe.fund({ value: sendValue })
          const funder = await fundMe.getFunder(0)
          assert.equal(funder, deployer)
        })
      })

      describe("withdraw", async function() {
        beforeEach(async function() {
          await fundMe.fund({ value: sendValue })
        })

        it("Withdraws eth when there is single funder", async function() {
          const startingFundBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { effectiveGasPrice, gasUsed } = transactionReceipt
          const gasCost = effectiveGasPrice.mul(gasUsed)
          const endingFundBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )
          assert.equal(endingFundBalance, 0)
          assert.equal(
            startingFundBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )
        })

        it("Withdraws funds when there are multiple funders", async function() {
          const accounts = await ethers.getSigners()

          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: sendValue })
          }
          const startingFundBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { effectiveGasPrice, gasUsed } = transactionReceipt
          const gasCost = effectiveGasPrice.mul(gasUsed)
          const endingFundBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )
          assert.equal(endingFundBalance, 0)
          assert.equal(
            startingFundBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )
          await expect(fundMe.getFunder(0)).to.be.reverted
          for (let i = 0; i < 6; i++) {
            assert.equal(await fundMe.getAddress2Amt(accounts[i].address), 0)
          }
        })

        it("Allows only owner to withdraw", async function() {
          const [owner, acc1] = await ethers.getSigners()
          const nonOwnerContract = await fundMe.connect(acc1)
          await expect(nonOwnerContract.withdraw()).to.be.reverted
        })
      })
    })
