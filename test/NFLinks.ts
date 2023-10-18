import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

const getTestNft = () => {
  const chainId = 1;
  const tokenAddress = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
  const tokenId = 1;
  const nft = {
    chainId,
    tokenAddress,
    tokenId,
  };
  return nft;
};

describe("NFTLinker", function () {
  async function deployLinker() {
    const [owner] = await ethers.getSigners();

    const NFLinks = await ethers.getContractFactory("NFLinks");
    const nflinks = await NFLinks.deploy(await owner.getAddress(), 500);

    return { nflinks };
  }

  async function deployLinkerWithSingleSeat() {
    const [owner] = await ethers.getSigners();

    const NFLinks = await ethers.getContractFactory("NFLinks");
    const nflinks = await NFLinks.deploy(await owner.getAddress(), 1);

    return { nflinks };
  }

  describe("Deployment", function () {
    it("Should be deployable with no problem", async function () {
      await loadFixture(deployLinker);
    });
  });

  describe("Calculate Token ID", function () {
    it("Token ID must be a non zero uint256", async function () {
      const { nflinks } = await loadFixture(deployLinker);

      const chainId = 1;
      const tokenAddress = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
      const tokenId = 1;

      const nft = {
        chainId,
        tokenAddress,
        tokenId,
      };

      expect(await nflinks.calculateLinkerId(nft)).to.not.equal(0);
    });
  });
});
