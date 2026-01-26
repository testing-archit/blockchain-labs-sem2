const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Token contract", function () {

  async function deployTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const token = await ethers.deployContract("Token");
    await token.waitForDeployment();
    return { token, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should assign total supply to owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.balanceOf(owner.address))
        .to.equal(await token.totalSupply());
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);

      await expect(token.transfer(addr1.address, 50))
        .to.changeTokenBalances(token, [owner, addr1], [-50, 50]);

      await expect(token.connect(addr1).transfer(addr2.address, 50))
        .to.changeTokenBalances(token, [addr1, addr2], [-50, 50]);
    });

    it("Should emit Transfer events", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);

      await expect(token.transfer(addr1.address, 50))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, addr1.address, 50);

      await expect(token.connect(addr1).transfer(addr2.address, 50))
        .to.emit(token, "Transfer")
        .withArgs(addr1.address, addr2.address, 50);
    });

    it("Should fail if sender has insufficient balance", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTokenFixture);

      await expect(
        token.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("Not enough tokens");
    });
  });
});

