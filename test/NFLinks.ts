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

const getOtherTestNft = () => {
  const chainId = 1;
  const tokenAddress = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
  const tokenId = 5;
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
    const nflinks = await NFLinks.deploy(
      await owner.getAddress(),
      500,
      ethers.parseEther("1"),
      1000
    );

    return { nflinks };
  }

  async function deployLinkerWithSingleSeat() {
    const [owner] = await ethers.getSigners();

    const NFLinks = await ethers.getContractFactory("NFLinksMocks");
    const nflinks = await NFLinks.deploy(
      await owner.getAddress(),
      1,
      ethers.parseEther("1"),
      1000
    );

    return { nflinks };
  }

  async function deployWithMintAndTransferTokenToConsumer() {
    const amount = 1;

    const fixtureParams = await loadFixture(deployLinkerWithSingleSeat);
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
    const fixtureParams = await loadFixture(deployLinkerWithSingleSeat);
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

  async function deployWithMintAndTransferTokenToConsumerMultiWithMultiSeat() {
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

      expect(await nflinks.members(consumer_.address)).to.be.false;

      await nflinks
        .connect(consumer_)
        .register(referrer_.address, consumer_.address);

      expect(await nflinks.members(consumer_.address)).to.be.true;
    });

    it("Must set proper referrer", async function () {
      const { nflinks, referrer_, consumer_ } = await loadFixture(
        deployWithMintAndTransferTokenToConsumer
      );

      expect(await nflinks.referrers(consumer_.address)).to.be.equal(
        ethers.ZeroAddress
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

  describe("Mint Prices", function () {
    it("Prices must increase 10% each time", async function () {
      const { nflinks, consumer_ } = await loadFixture(
        deployWithMintAndTransferTokenToConsumerMulti
      );

      const priceLists = [];
      const formattedPriceList = [];

      for (let i = 0; i < 10; i++) {
        const price = await nflinks.mintPrices(i);
        priceLists.push(price);
        formattedPriceList.push(Number(ethers.formatEther(price)));
        await nflinks.setNextMintPrice();
      }

      for (let i = 9; i > 0; i--) {
        expect(
          formattedPriceList[i] / formattedPriceList[i - 1]
        ).to.be.greaterThan(1.09999999);
        expect(
          formattedPriceList[i] / formattedPriceList[i - 1]
        ).to.be.lessThan(1.10000001);
      }
    });

    it("Figure mint price must work", async function () {
      const { nflinks } = await loadFixture(
        deployWithMintAndTransferTokenToConsumerMulti
      );

      await expect(nflinks.mintPrices(1)).to.reverted;
      expect(
        await nflinks.mintLinkerJustForPriceTest.staticCall(getOtherTestNft())
      ).to.equal(ethers.parseEther("1"));
      await nflinks.mintLinkerJustForPriceTest(getOtherTestNft());
      expect(
        await nflinks.mintLinkerJustForPriceTest.staticCall(getOtherTestNft())
      ).to.equal(ethers.parseEther("1.1"));
      await nflinks.mintLinkerJustForPriceTest(getOtherTestNft());

      await expect(nflinks.mintPrices(1)).to.not.reverted;
      expect(
        await nflinks.mintLinkerJustForPriceTest.staticCall(getOtherTestNft())
      ).to.equal(ethers.parseEther("1.21"));
    });
  });

  describe("Mint", function () {
    it("if there is a seat user can register without referrer and should reduce the amount of available seat", async function () {
      const { nflinks, consumer_ } = await loadFixture(
        deployWithMintAndTransferTokenToConsumerMulti
      );

      const referrerAddress = ethers.ZeroAddress;

      // expect to be able to register with no referer since seat exist

      const avilableSeatsBefore = await nflinks.availableSeats();

      const nftPrice = await nflinks.mintLinkerJustForPriceTest.staticCall(
        getOtherTestNft()
      );

      expect(await nflinks.members(consumer_.address)).to.be.false;
      expect(await nflinks.referrers(consumer_.address)).to.be.equal(
        ethers.ZeroAddress
      );
      await expect(
        nflinks
          .connect(consumer_)
          .registerAndMint(getTestNft(), consumer_.address, referrerAddress, {
            value: nftPrice,
          })
      )
        .to.emit(nflinks, "UserRegistered")
        .withArgs(consumer_.address, referrerAddress);

      const avilableSeatsAfter = await nflinks.availableSeats();

      expect(await nflinks.members(consumer_.address)).to.be.true;
      expect(await nflinks.referrers(consumer_.address)).to.be.equal(
        referrerAddress
      );
      expect(avilableSeatsBefore - avilableSeatsAfter).to.be.equal(1);
    });

    it("if there is no seat user can not register without referrer ", async function () {
      const { nflinks, referrer_, consumer_ } = await loadFixture(
        deployWithMintAndTransferTokenToConsumerMulti
      );
      const [_, __, ___, consumer2_] = await ethers.getSigners();

      const referrerAddress = ethers.ZeroAddress;

      const nftPrice = await nflinks.mintLinkerJustForPriceTest.staticCall(
        getOtherTestNft()
      );

      await nflinks
        .connect(consumer_)
        .registerAndMint(getTestNft(), consumer_.address, referrerAddress, {
          value: nftPrice,
        });

      await nflinks.connect(referrer_).mintReferralToken(consumer2_);

      await expect(
        nflinks
          .connect(consumer2_)
          .registerAndMint(getTestNft(), consumer2_.address, referrerAddress, {
            value: nftPrice,
          })
      ).to.revertedWith("no seat");
    });

    it("if there is no seat user can not register without referrer ", async function () {
      const { nflinks, referrer_, consumer_ } = await loadFixture(
        deployWithMintAndTransferTokenToConsumerMulti
      );

      const referrerAddress = ethers.ZeroAddress;

      const nftPrice = await nflinks.mintLinkerJustForPriceTest.staticCall(
        getOtherTestNft()
      );

      await expect(
        nflinks
          .connect(consumer_)
          .registerAndMint(getTestNft(), consumer_.address, referrerAddress)
      ).to.revertedWith("wrong value");

      await expect(
        nflinks
          .connect(consumer_)
          .registerAndMint(getTestNft(), consumer_.address, referrerAddress, {
            value: nftPrice + BigInt(1),
          })
      ).to.revertedWith("wrong value");
    });

    it("should set proper system share if there is no referrer", async function () {
      const { nflinks, referrer_, consumer_ } = await loadFixture(
        deployWithMintAndTransferTokenToConsumerMulti
      );

      const referrerAddress = ethers.ZeroAddress;

      const nftPrice = await nflinks.mintLinkerJustForPriceTest.staticCall(
        getTestNft()
      );

      const nftId = await nflinks.calculateLinkerId(getTestNft());

      expect(await nflinks.referralBalances(referrerAddress)).to.be.equal(0);
      expect(await nflinks.systemBalance()).to.be.equal(0);
      expect(await nflinks.tokenBalances(nftId)).to.be.equal(0);

      await nflinks
        .connect(consumer_)
        .registerAndMint(getTestNft(), consumer_.address, referrerAddress, {
          value: nftPrice,
        });

      expect(await nflinks.referralBalances(referrerAddress)).to.be.equal(0);

      expect(await nflinks.systemBalance()).to.be.equal(
        ethers.parseEther("0.3")
      );
      expect(await nflinks.tokenBalances(nftId)).to.be.equal(
        ethers.parseEther("0.7")
      );
    });

    it("should set proper system share if there is no referrer", async function () {
      const { nflinks, referrer_, consumer_ } = await loadFixture(
        deployWithMintAndTransferTokenToConsumerMulti
      );

      const nftPrice = await nflinks.mintLinkerJustForPriceTest.staticCall(
        getTestNft()
      );

      const nftId = await nflinks.calculateLinkerId(getTestNft());

      expect(await nflinks.referralBalances(referrer_.address)).to.be.equal(0);
      expect(await nflinks.systemBalance()).to.be.equal(0);
      expect(await nflinks.tokenBalances(nftId)).to.be.equal(0);

      await nflinks
        .connect(consumer_)
        .registerAndMint(getTestNft(), consumer_.address, referrer_.address, {
          value: nftPrice,
        });

      expect(await nflinks.referralBalances(referrer_.address)).to.be.equal(
        ethers.parseEther("0.15")
      );
      expect(await nflinks.systemBalance()).to.be.equal(
        ethers.parseEther("0.15")
      );
      expect(await nflinks.tokenBalances(nftId)).to.be.equal(
        ethers.parseEther("0.7")
      );
    });

    it("should properly mint token", async function () {
      const { nflinks, referrer_, consumer_ } = await loadFixture(
        deployWithMintAndTransferTokenToConsumerMulti
      );

      const target = getTestNft();

      const nftPrice = await nflinks.mintLinkerJustForPriceTest.staticCall(
        getTestNft()
      );

      const nftId = await nflinks.calculateLinkerId(getTestNft());

      expect(await nflinks.balanceOf(consumer_.address, nftId)).to.be.equal(0);

      await expect(
        nflinks
          .connect(consumer_)
          .registerAndMint(getTestNft(), consumer_.address, referrer_.address, {
            value: nftPrice,
          })
      )
        .to.emit(nflinks, "LinkerMinted")
        .withArgs(
          nftId,
          target.chainId,
          ethers.getAddress(target.tokenAddress),
          target.tokenId,
          nftPrice,
          ethers.parseEther("0.15"),
          ethers.parseEther("0.15"),
          referrer_.address,
          ethers.parseEther("0.7")
        );

      expect(await nflinks.balanceOf(consumer_.address, nftId)).to.be.equal(1);
    });

    it("should mint a referral token for the ", async function () {
      const {
        nflinks,
        referrer_,
        consumer_: minter_,
      } = await loadFixture(deployWithMintAndTransferTokenToConsumerMulti);

      const nftPrice = await nflinks.mintLinkerJustForPriceTest.staticCall(
        getTestNft()
      );

      const referralTokenId = await nflinks.calculateReferralTokenId(
        minter_.address
      );

      expect(
        await nflinks.balanceOf(minter_.address, referralTokenId)
      ).to.be.equal(0);

      await nflinks
        .connect(minter_)
        .registerAndMint(getTestNft(), minter_.address, referrer_.address, {
          value: nftPrice,
        });

      expect(
        await nflinks.balanceOf(minter_.address, referralTokenId)
      ).to.be.equal(1);
    });

    it("Can not mint if not registered.", async function () {
      const {
        nflinks,
        referrer_,
        consumer_: minter_,
      } = await loadFixture(deployWithMintAndTransferTokenToConsumerMulti);

      const nftPrice = await nflinks.mintLinkerJustForPriceTest.staticCall(
        getTestNft()
      );

      const referralTokenId = await nflinks.calculateReferralTokenId(
        minter_.address
      );

      expect(
        await nflinks.balanceOf(minter_.address, referralTokenId)
      ).to.be.equal(0);

      await expect(
        nflinks.connect(minter_).mint(getTestNft(), minter_.address, {
          value: nftPrice,
        })
      ).to.be.revertedWith("not registered");
    });
  });

  describe("Link", function () {
    it("Should be able to Link if have a linker token of target", async function () {
      const { nflinks, consumer_ } = await loadFixture(
        deployWithMintAndTransferTokenToConsumerMultiWithMultiSeat
      );

      const referrerAddress = ethers.ZeroAddress;

      let nftPrice;

      const target = getTestNft();
      const subject = getOtherTestNft();

      nftPrice = await nflinks.mintLinkerJustForPriceTest.staticCall(target);

      await nflinks
        .connect(consumer_)
        .registerAndMint(target, consumer_.address, referrerAddress, {
          value: nftPrice,
        });

      for (let i = 0; i < 4; i++) {
        nftPrice = await nflinks.mintLinkerJustForPriceTest.staticCall(target);

        await nflinks.connect(consumer_).mint(target, consumer_.address, {
          value: nftPrice,
        });
      }

      await expect(
        nflinks.connect(consumer_).link(subject, subject, 1)
      ).to.rejectedWith("self-link prohibited");

      await expect(
        nflinks.connect(consumer_).link(target, subject, 1)
      ).to.rejectedWith("not enough linker");

      await expect(
        nflinks.connect(consumer_).link(subject, target, 6)
      ).to.rejectedWith("not enough linker");

      const linkId = await nflinks
        .connect(consumer_)
        .calculateLinkId(subject, target);

      const targetLinkerId = await nflinks
        .connect(consumer_)
        .calculateLinkerId(target);

      expect(
        await nflinks.connect(consumer_).balanceOf(consumer_.address, linkId)
      ).to.be.equal(0);

      expect(
        await nflinks
          .connect(consumer_)
          .balanceOf(consumer_.address, targetLinkerId)
      ).to.be.equal(5);

      expect(
        await nflinks
          .connect(consumer_)
          .balanceOf(nflinks.getAddress(), targetLinkerId)
      ).to.be.equal(0);

      await expect(nflinks.connect(consumer_).link(subject, target, 5))
        .to.emit(nflinks, "Linked")
        .withArgs(
          subject.chainId,
          ethers.getAddress(subject.tokenAddress),
          subject.tokenId,
          target.chainId,
          ethers.getAddress(target.tokenAddress),
          target.tokenId,
          5
        );

      expect(
        await nflinks
          .connect(consumer_)
          .balanceOf(consumer_.address, targetLinkerId)
      ).to.be.equal(0);

      expect(
        await nflinks
          .connect(consumer_)
          .balanceOf(nflinks.getAddress(), targetLinkerId)
      ).to.be.equal(5);

      expect(
        await nflinks.connect(consumer_).balanceOf(consumer_.address, linkId)
      ).to.be.equal(5);
    });
  });

  /*describe("Delink", function () {
    it("Should be able to Link if have a linker token of target", async function () {
      const { nflinks, consumer_ } = await loadFixture(
        deployWithMintAndTransferTokenToConsumerMultiWithMultiSeat
      );

      const referrerAddress = ethers.ZeroAddress;

      let nftPrice;

      const target = getTestNft();
      const subject = getOtherTestNft();

      nftPrice = await nflinks.mintLinkerJustForPriceTest.staticCall(target);

      await nflinks
        .connect(consumer_)
        .registerAndMint(target, consumer_.address, referrerAddress, {
          value: nftPrice,
        });

      for (let i = 0; i < 4; i++) {
        nftPrice = await nflinks.mintLinkerJustForPriceTest.staticCall(target);

        await nflinks.connect(consumer_).mint(target, consumer_.address, {
          value: nftPrice,
        });
      }

      await expect(
        nflinks.connect(consumer_).link(subject, subject, 1)
      ).to.rejectedWith("self-link prohibited");

      await expect(
        nflinks.connect(consumer_).link(target, subject, 1)
      ).to.rejectedWith("not enough linker");

      await expect(
        nflinks.connect(consumer_).link(subject, target, 6)
      ).to.rejectedWith("not enough linker");

      const linkId = await nflinks
        .connect(consumer_)
        .calculateLinkId(subject, target);

      const targetLinkerId = await nflinks
        .connect(consumer_)
        .calculateLinkerId(target);

      expect(
        await nflinks.connect(consumer_).balanceOf(consumer_.address, linkId)
      ).to.be.equal(0);

      expect(
        await nflinks
          .connect(consumer_)
          .balanceOf(consumer_.address, targetLinkerId)
      ).to.be.equal(5);

      expect(
        await nflinks
          .connect(consumer_)
          .balanceOf(nflinks.getAddress(), targetLinkerId)
      ).to.be.equal(0);

      await nflinks.connect(consumer_).link(subject, target, 5);

      expect(
        await nflinks
          .connect(consumer_)
          .balanceOf(consumer_.address, targetLinkerId)
      ).to.be.equal(0);

      expect(
        await nflinks
          .connect(consumer_)
          .balanceOf(nflinks.getAddress(), targetLinkerId)
      ).to.be.equal(5);

      expect(
        await nflinks.connect(consumer_).balanceOf(consumer_.address, linkId)
      ).to.be.equal(5);
    });
  });*/
});
