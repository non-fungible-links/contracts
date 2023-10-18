So the main contract of the system is NFLinks. It's an erc1155 which provides two main type of tokens of the system.

- Linker Token

Linker tokens are the main tokens of the system. These are the tokens users could use to link a token to another one.

Linker token id is different for each ERC721 NFT. The Id will be calculated by hashing the combination of chainId, tokenAddress and tokenId, then it will become a uint256.

- Referral Token

Referral token are the tokens that can be consumed to refer somebody. A user must consume a token if there is no available seat and he's not a registered user to mint his first linker token. Users will get one referrer token each time they mint a linker token.

Referral token id is different for each user based on their addresses . The Id will be calculated by casting the address to uint256.

mintReferralToken is responsible for minting a new referral token for the user whenever he mints a new linker token.
