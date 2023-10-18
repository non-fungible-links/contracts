// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

contract NFLinks is ERC1155, Ownable, ERC1155Burnable, ERC1155Supply {
    struct NFT {
        uint256 chainId;
        address tokenAddress;
        uint256 tokenId;
    }

    uint256 public availableSeats;

    constructor(
        address initialOwner,
        uint256 initialSeats_
    ) ERC1155("") Ownable(initialOwner) {
        availableSeats = initialSeats_;
    }

    function calculateLinkerId(
        NFT memory nft
    ) public pure returns (uint256 id) {
        bytes32 hash = keccak256(
            abi.encodePacked(nft.chainId, nft.tokenAddress, nft.tokenId)
        );
        id = uint256(hash);
    }

    function calculateReferralTokenId(
        address referrer
    ) public pure returns (uint256 id) {
        id = uint256(uint160(referrer));
    }

    // The following functions are overrides required by Solidity.

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }
}
