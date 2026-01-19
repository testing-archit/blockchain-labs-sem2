const { expect } = require("chai");

describe("Token contract", function () {

  it("Should assign the total supply to the owner", async function () {
    const [owner] = await ethers.getSigners();
    const token = await ethers.deployContract("Token");

    const ownerBalance = await token.balanceOf(owner.address);
    expect(await token.totalSupply()).to.equal(ownerBalance);
  });

  it("Should transfer tokens between accounts", async function () {
    const [owner, addr1] = await ethers.getSigners();
    const token = await ethers.deployContract("Token");

    await token.transfer(addr1.address, 100);
    expect(await token.balanceOf(addr1.address)).to.equal(100);
  });

});
