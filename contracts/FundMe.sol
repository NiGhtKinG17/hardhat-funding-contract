//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./PriceConverter.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

error FundMe__NotOwner();

/**
 * @title Funding contract sample
 * @author Hritik Shelar
 * @notice This contract creates a sample funding contract
 * @dev This implements price feed as our library
 */

contract FundMe {
  using PriceConverter for uint256;

  uint256 public constant MIN_USD = 50 * 1e18;

  address[] private s_funders;
  mapping(address => uint256) private s_address2Amt;

  address private immutable i_owner;

  AggregatorV3Interface private s_priceFeed;

  modifier isOwner() {
    if (msg.sender != i_owner) revert FundMe__NotOwner();
    _;
  }

  constructor(address priceFeedAddress) {
    i_owner = msg.sender;
    s_priceFeed = AggregatorV3Interface(priceFeedAddress);
  }

  receive() external payable {
    fund();
  }

  fallback() external payable {
    fund();
  }

  /**
   * @notice This function accepts the funds after some threshold of 50$ and above
   */
  function fund() public payable {
    require(msg.value.converter(s_priceFeed) >= MIN_USD, "Not enough");
    s_funders.push(msg.sender);
    s_address2Amt[msg.sender] += msg.value;
  }

  function withdraw() public isOwner {
    for (uint256 i = 0; i < s_funders.length; i++) {
      address funder = getFunder(i);
      s_address2Amt[funder] = 0;
    }

    s_funders = new address[](0);
    (bool isSuccess, ) = payable(msg.sender).call{value: address(this).balance}(
      ""
    );
    require(isSuccess, "Call failed");
  }

  function getOwner() public view returns (address) {
    return i_owner;
  }

  function getAddress2Amt(address funder) public view returns (uint256) {
    return s_address2Amt[funder];
  }

  function getFunder(uint256 index) public view returns (address) {
    return s_funders[index];
  }

  function getPriceFeed() public view returns (AggregatorV3Interface) {
    return s_priceFeed;
  }
}
