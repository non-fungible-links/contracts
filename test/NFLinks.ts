import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

const { getSigner } = ethers;

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

async function signRegistrationData(
  data: { referrer: string; consumer: string },
  signer: SignerWithAddress
): Promise<string> {
  // Create a wallet instance for the signer
  const wallet = signer;

  const abiCoder = new ethers.AbiCoder();
  const signature = await wallet.signMessage("REGISTER ME");

  return signature;
}

describe("NFTLinker", function () {
  async function deployLinker() {
    const [owner] = await ethers.getSigners();

    const NFLinks = await ethers.getContractFactory("NFLinksMocks");
    const nflinks = await NFLinks.deploy(await owner.getAddress(), 500);

    return { nflinks };
  }

  async function deployLinkerWithSingleSeat() {
    const [owner] = await ethers.getSigners();

    const NFLinks = await ethers.getContractFactory("NFLinksMocks");
    const nflinks = await NFLinks.deploy(await owner.getAddress(), 1);

    return { nflinks };
  }

  async function deployWithMintAndTransferTokenToConsumer() {
    const amount = 1;

    const fixtureParams = await loadFixture(deployLinker);
    const { nflinks } = fixtureParams;
    const [_, referrer_, consumer_] = await ethers.getSigners();

    const referralTokenId = await nflinks.calculateReferralTokenId(
      referrer_.address
    );

    for (let i = 0; i <= amount; i++) {
      await nflinks.connect(referrer_).mintReferralToken(referrer_.address);
    }

    await nflinks
      .connect(referrer_)
      .safeTransferFrom(
        referrer_.address,
        consumer_.address,
        referralTokenId,
        amount,
        "0x"
      );

    return {
      ...fixtureParams,
      referrer_,
      consumer_,
    };
  }

  async function deployWithMintAndTransferTokenToConsumerMulti() {
    const amount = 5;
    const fixtureParams = await loadFixture(deployLinker);
    const { nflinks } = fixtureParams;
    const [_, referrer_, consumer_] = await ethers.getSigners();

    const referralTokenId = await nflinks.calculateReferralTokenId(
      referrer_.address
    );

    for (let i = 0; i <= amount; i++) {
      await nflinks.connect(referrer_).mintReferralToken(referrer_.address);
    }

    await nflinks
      .connect(referrer_)
      .safeTransferFrom(
        referrer_.address,
        consumer_.address,
        referralTokenId,
        amount,
        "0x"
      );

    return {
      ...fixtureParams,
      referrer_,
      consumer_,
    };
  }

  describe("Deployment", function () {
    it("Should be deployable with no problem", async function () {
      await loadFixture(deployLinker);
    });
  });

  describe("Calculate Linker Token ID", function () {
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

  describe("Calculate Referral Token Id", function () {
    it("Token ID must be a non zero uint256", async function () {
      const { nflinks } = await loadFixture(deployLinker);
      const [_, user1] = await ethers.getSigners();

      expect(
        await nflinks.calculateReferralTokenId(user1.address)
      ).to.not.equal(0);
    });
  });

  describe("Mint Referral token", function () {
    it("Token with proper token id must be minted", async function () {
      const { nflinks } = await loadFixture(deployLinker);
      const [_, user1] = await ethers.getSigners();

      const referralTokenId = await nflinks.calculateReferralTokenId(
        user1.address
      );

      expect(await nflinks["totalSupply(uint256)"](referralTokenId)).to.equal(
        0
      );

      await nflinks.mintReferralToken(user1.address);

      expect(await nflinks["totalSupply(uint256)"](referralTokenId)).to.equal(
        1
      );
    });

    it("Balance of user must increase", async function () {
      const { nflinks } = await loadFixture(deployLinker);
      const [_, user1] = await ethers.getSigners();

      const referralTokenId = await nflinks.calculateReferralTokenId(
        user1.address
      );

      expect(await nflinks.balanceOf(user1.address, referralTokenId)).to.equal(
        0
      );

      await nflinks.mintReferralToken(user1.address);

      expect(await nflinks.balanceOf(user1.address, referralTokenId)).to.equal(
        1
      );
    });

    it("ReferralTokenMint event must be emitted", async function () {
      const { nflinks } = await loadFixture(deployLinker);
      const [_, user1] = await ethers.getSigners();

      const referralTokenId = await nflinks.calculateReferralTokenId(
        user1.address
      );

      await expect(nflinks.mintReferralToken(user1.address))
        .to.emit(nflinks, "ReferralTokenMint")
        .withArgs(user1.address, referralTokenId);
    });
  });

  describe("Register", function () {
    it("Must throw if consumer is not the msg.sender", async function () {
      const { nflinks } = await loadFixture(deployLinker);
      const [_, referrer_, consumer_] = await ethers.getSigners();

      await expect(
        nflinks.register(referrer_.address, consumer_.address)
      ).to.be.revertedWith("unauthorized");
    });

    it("Must revert if the sender can't burn referrer token", async function () {
      const { nflinks } = await loadFixture(deployLinker);
      const [_, referrer_, consumer_] = await ethers.getSigners();

      await expect(
        nflinks
          .connect(consumer_)
          .register(referrer_.address, consumer_.address)
      ).to.be.revertedWithCustomError(nflinks, "ERC1155InsufficientBalance");
    });

    it("Must become a member if can burn a token", async function () {
      const { nflinks, referrer_, consumer_ } = await loadFixture(
        deployWithMintAndTransferTokenToConsumer
      );

      await nflinks
        .connect(consumer_)
        .register(referrer_.address, consumer_.address);

      expect(await nflinks.members(consumer_.address)).to.be.true;
    });

    it("Must set proper referrer", async function () {
      const { nflinks, referrer_, consumer_ } = await loadFixture(
        deployWithMintAndTransferTokenToConsumer
      );

      await nflinks
        .connect(consumer_)
        .register(referrer_.address, consumer_.address);

      expect(await nflinks.referrers(consumer_.address)).to.be.equal(
        referrer_.address
      );
    });

    it("Must emit user registered event", async function () {
      const { nflinks, referrer_, consumer_ } = await loadFixture(
        deployWithMintAndTransferTokenToConsumer
      );

      await expect(
        nflinks
          .connect(consumer_)
          .register(referrer_.address, consumer_.address)
      )
        .to.emit(nflinks, "UserRegistered")
        .withArgs(consumer_.address, referrer_.address);
    });

    it("Must throw if consumer is already registered", async function () {
      const { nflinks } = await loadFixture(
        deployWithMintAndTransferTokenToConsumerMulti
      );
      const [_, referrer_, consumer_] = await ethers.getSigners();

      await nflinks
        .connect(consumer_)
        .register(referrer_.address, consumer_.address);

      await expect(
        nflinks
          .connect(consumer_)
          .register(referrer_.address, consumer_.address)
      ).to.be.revertedWith("already registered");
    });

    it("Must be able to register with signature", async function () {
      const {
        nflinks,
        referrer_,
        consumer_: executor_,
      } = await loadFixture(deployWithMintAndTransferTokenToConsumerMulti);
      const [owner, __, ___, consumer_] = await ethers.getSigners();

      // Create a valid signature using consumer_ as the signer
      const registrationData = {
        referrer: referrer_.address,
        consumer: consumer_.address,
      };
      const signature = await signRegistrationData(registrationData, consumer_);

      // Execute the registration with the valid signature
      await nflinks
        .connect(executor_)
        .registerWithSignature(referrer_.address, consumer_.address, signature);

      // Verify that the consumer is now a member
      const isConsumerRegistered = await nflinks.members(consumer_.address);
      expect(isConsumerRegistered).to.be.true;
    });

    it("Must be able to register with signature", async function () {
      const {
        nflinks,
        referrer_,
        consumer_: executor_,
      } = await loadFixture(deployWithMintAndTransferTokenToConsumerMulti);
      const [owner, __, ___, consumer_] = await ethers.getSigners();

      // Create a valid signature using consumer_ as the signer
      const registrationData = {
        referrer: referrer_.address,
        consumer: consumer_.address,
      };
      const signature = await signRegistrationData(registrationData, executor_);

      // Execute the registration with the valid signature
      await expect(
        nflinks
          .connect(executor_)
          .registerWithSignature(
            referrer_.address,
            consumer_.address,
            signature
          )
      ).to.be.revertedWith("not consumer");
    });
  });
});
