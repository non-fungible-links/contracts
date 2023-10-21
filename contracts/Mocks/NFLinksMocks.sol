// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {NFLinks} from "../NFLinks.sol";

contract NFLinksMocks is NFLinks {
    constructor(
        address initialOwner_,
        uint256 initialSeats_,
        uint256 initialPrice_,
        uint256 priceIncreaseNumerator_
    )
        NFLinks(
            initialOwner_,
            initialSeats_,
            initialPrice_,
            priceIncreaseNumerator_
        )
    {}

    function mintReferralToken(address referrer_) public {
        _mintReferralToken(referrer_, referrer_);
    }

    function mintLinkerJustForPriceTest(
        NFT memory target_
    ) public returns (uint256 price) {
        price = figureMintPrice(calculateLinkerId(target_));
        _mint(msg.sender, calculateLinkerId(target_), 1, "");
    }
}
