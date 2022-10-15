//SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
  function getPrice(AggregatorV3Interface priceFeed)
    internal
    view
    returns (uint256)
  {
    // AggregatorV3Interface pricefeed = AggregatorV3Interface(
    //   0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
    // );
    (, int256 price, , , ) = priceFeed.latestRoundData();
    return uint256(price * 1e18);
  }

  function converter(uint256 eth, AggregatorV3Interface priceFeed)
    internal
    view
    returns (uint256)
  {
    uint256 price = getPrice(priceFeed);
    uint256 ethInUsd = (price * eth) / 1e18;
    return ethInUsd;
  }
}
