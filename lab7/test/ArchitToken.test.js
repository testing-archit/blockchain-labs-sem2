const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArchitToken", function () {
  let token;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the contract
    const ArchitToken = await ethers.getContractFactory("ArchitToken");
    token = await ArchitToken.deploy();
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should have correct name", async function () {
      expect(await token.name()).to.equal("archit_token");
    });

    it("Should have correct symbol", async function () {
      expect(await token.symbol()).to.equal("AT");
    });

    it("Should have correct decimals", async function () {
      expect(await token.decimals()).to.equal(18);
    });

    it("Should mint 100000 tokens to owner on deployment", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(ownerBalance).to.equal(ethers.parseEther("100000"));
    });

    it("Should have correct total supply", async function () {
      const totalSupply = await token.totalSupply();
      expect(totalSupply).to.equal(ethers.parseEther("100000"));
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const amount = ethers.parseEther("50");
      await token.transfer(addr1.address, amount);
      expect(await token.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should fail if sender has insufficient funds", async function () {
      const amount = ethers.parseEther("100001");
      await expect(token.transfer(addr1.address, amount)).to.be.revertedWithCustomError(
        token,
        "ERC20InsufficientBalance"
      );
    });

    it("Should update balances after transfer", async function () {
      const amount = ethers.parseEther("50");
      const initialOwnerBalance = await token.balanceOf(owner.address);
      
      await token.transfer(addr1.address, amount);
      
      expect(await token.balanceOf(owner.address)).to.equal(
        initialOwnerBalance - amount
      );
      expect(await token.balanceOf(addr1.address)).to.equal(amount);
    });
  });

  describe("Approvals", function () {
    it("Should approve tokens for spending", async function () {
      const amount = ethers.parseEther("1000");
      await token.approve(addr1.address, amount);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(amount);
    });

    it("Should increase allowance", async function () {
      const initialAmount = ethers.parseEther("1000");
      const increaseAmount = ethers.parseEther("500");
      
      await token.approve(addr1.address, initialAmount);
      await token.increaseAllowance(addr1.address, increaseAmount);
      
      expect(await token.allowance(owner.address, addr1.address)).to.equal(
        initialAmount + increaseAmount
      );
    });

    it("Should decrease allowance", async function () {
      const initialAmount = ethers.parseEther("1000");
      const decreaseAmount = ethers.parseEther("300");
      
      await token.approve(addr1.address, initialAmount);
      await token.decreaseAllowance(addr1.address, decreaseAmount);
      
      expect(await token.allowance(owner.address, addr1.address)).to.equal(
        initialAmount - decreaseAmount
      );
    });
  });

  describe("TransferFrom", function () {
    it("Should transfer tokens from another account", async function () {
      const amount = ethers.parseEther("100");
      
      // Owner approves addr1 to spend 100 tokens
      await token.approve(addr1.address, amount);
      
      // addr1 transfers 100 tokens from owner to addr2
      await token.connect(addr1).transferFrom(owner.address, addr2.address, amount);
      
      expect(await token.balanceOf(addr2.address)).to.equal(amount);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(0);
    });

    it("Should fail if allowance is insufficient", async function () {
      const approveAmount = ethers.parseEther("100");
      const transferAmount = ethers.parseEther("200");
      
      await token.approve(addr1.address, approveAmount);
      
      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });
  });
});
