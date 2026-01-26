const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SecureVault", function () {
  let vault;
  let owner, user;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("SecureVault");
    vault = await Vault.deploy();
    await vault.waitForDeployment();
  });

  describe("Deposit", function () {
    it("should allow successful deposit", async () => {
      await vault.connect(user).deposit({
        value: ethers.parseEther("1"),
      });

      expect(
        await vault.getBalance(user.address)
      ).to.equal(ethers.parseEther("1"));
    });

    it("should emit Deposited event on deposit", async () => {
      await expect(
        vault.connect(user).deposit({ value: ethers.parseEther("1") })
      ).to.emit(vault, "Deposited")
        .withArgs(user.address, ethers.parseEther("1"));
    });

    it("should reject zero deposit", async () => {
      await expect(
        vault.connect(user).deposit({ value: 0 })
      ).to.be.revertedWith("Deposit must be greater than zero");
    });
  });

  describe("Withdrawal", function () {
    it("should allow successful withdrawal", async () => {
      await vault.connect(user).deposit({
        value: ethers.parseEther("1"),
      });

      await vault.connect(user).withdraw(ethers.parseEther("1"));

      expect(
        await vault.getBalance(user.address)
      ).to.equal(0);
    });

    it("should emit Withdrawn event on withdrawal", async () => {
      await vault.connect(user).deposit({ value: ethers.parseEther("1") });

      await expect(
        vault.connect(user).withdraw(ethers.parseEther("1"))
      ).to.emit(vault, "Withdrawn")
        .withArgs(user.address, ethers.parseEther("1"));
    });

    it("should fail when balance is zero", async () => {
      await expect(
        vault.connect(user).withdraw(ethers.parseEther("1"))
      ).to.be.revertedWith("Insufficient balance");
    });

    it("should fail when withdrawing more than balance", async () => {
      await vault.connect(user).deposit({ value: ethers.parseEther("1") });

      await expect(
        vault.connect(user).withdraw(ethers.parseEther("2"))
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Reentrancy Protection", function () {
    it("should be protected against reentrancy attack", async () => {
      // Deploy the malicious attacker contract
      const MaliciousAttacker = await ethers.getContractFactory("MaliciousAttacker");
      const vaultAddress = await vault.getAddress();
      const attacker = await MaliciousAttacker.deploy(vaultAddress);
      await attacker.waitForDeployment();

      // Fund the vault with some ETH from other users (this would be stolen in a successful attack)
      await vault.connect(owner).deposit({ value: ethers.parseEther("5") });

      // Attacker deposits 1 ETH
      await attacker.deposit({ value: ethers.parseEther("1") });

      // Verify attacker's balance in vault before attack
      const attackerAddress = await attacker.getAddress();
      expect(await vault.getBalance(attackerAddress)).to.equal(ethers.parseEther("1"));

      // Get vault's total balance before attack
      const vaultBalanceBefore = await ethers.provider.getBalance(vaultAddress);
      expect(vaultBalanceBefore).to.equal(ethers.parseEther("6")); // 5 + 1 = 6 ETH

      // Execute the attack - it should complete but only withdraw the attacker's deposit
      await attacker.attack();

      // Verify attacker's balance in vault is now 0 (they withdrew their own deposit)
      expect(await vault.getBalance(attackerAddress)).to.equal(0);

      // Verify vault still has 5 ETH (owner's deposit is safe)
      const vaultBalanceAfter = await ethers.provider.getBalance(vaultAddress);
      expect(vaultBalanceAfter).to.equal(ethers.parseEther("5"));

      // Attacker only got their 1 ETH back, not the owner's 5 ETH
      expect(await attacker.getBalance()).to.equal(ethers.parseEther("1"));
    });

    it("should allow normal withdrawal after failed attack attempt", async () => {
      // Simple withdraw should work fine
      await vault.connect(user).deposit({ value: ethers.parseEther("1") });

      await expect(
        vault.connect(user).withdraw(ethers.parseEther("1"))
      ).to.not.be.reverted;

      expect(await vault.getBalance(user.address)).to.equal(0);
    });
  });

  describe("getBalance", function () {
    it("should return correct balance for user", async () => {
      expect(await vault.getBalance(user.address)).to.equal(0);

      await vault.connect(user).deposit({ value: ethers.parseEther("2") });
      expect(await vault.getBalance(user.address)).to.equal(ethers.parseEther("2"));

      await vault.connect(user).withdraw(ethers.parseEther("1"));
      expect(await vault.getBalance(user.address)).to.equal(ethers.parseEther("1"));
    });
  });
});
