import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("CollectibleCertificate", () => {
  async function deployFixture() {
    const [owner, alice, bob, carol] = await ethers.getSigners();
    const mintFee = ethers.parseEther("0.05");
    const maxSupply = 3;

    const CollectibleCertificate = await ethers.getContractFactory("CollectibleCertificate");
    const contract = await CollectibleCertificate.deploy(
      "Semester 2 Certificates",
      "SEM2",
      mintFee,
      maxSupply,
      owner.address
    );
    await contract.waitForDeployment();

    return { contract, owner, alice, bob, carol, mintFee, maxSupply };
  }

  it("allows the owner to mint certificates with stored IPFS metadata", async () => {
    const { contract, owner, alice, bob } = await loadFixture(deployFixture);
    const uriOne = "ipfs://bafybeibasiccertone";
    const uriTwo = "ipfs://bafybeibasiccerttwo";

    await expect(contract.ownerMint(alice.address, uriOne))
      .to.emit(contract, "CollectibleMinted")
      .withArgs(owner.address, alice.address, 1, uriOne);

    await expect(contract.ownerMint(bob.address, uriTwo))
      .to.emit(contract, "CollectibleMinted")
      .withArgs(owner.address, bob.address, 2, uriTwo);

    expect(await contract.ownerOf(1)).to.equal(alice.address);
    expect(await contract.ownerOf(2)).to.equal(bob.address);
    expect(await contract.tokenURI(1)).to.equal(uriOne);
    expect(await contract.tokenURI(2)).to.equal(uriTwo);
  });

  it("mints via public endpoint only when correct fee is provided", async () => {
    const { contract, bob, mintFee } = await loadFixture(deployFixture);
    const uri = "ipfs://bafybeiipfscert";

    await contract.setPublicMintEnabled(true);

    await expect(contract.connect(bob).publicMint(uri, { value: mintFee - 1n }))
      .to.be.revertedWithCustomError(contract, "IncorrectFee");

    await expect(contract.connect(bob).publicMint(uri, { value: mintFee }))
      .to.emit(contract, "CollectibleMinted")
      .withArgs(bob.address, bob.address, 1, uri);

    expect(await contract.ownerOf(1)).to.equal(bob.address);
    expect(await contract.tokenURI(1)).to.equal(uri);
  });

  it("rejects minting when the collection supply has been reached", async () => {
    const { contract, alice, mintFee, maxSupply } = await loadFixture(deployFixture);
    await contract.setPublicMintEnabled(true);

    for (let i = 0; i < maxSupply; i++) {
      await contract.publicMint(`ipfs://bafybeimax${i}`, { value: mintFee });
    }

    await expect(contract.ownerMint(alice.address, "ipfs://overflow"))
      .to.be.revertedWithCustomError(contract, "MaxSupplyReached");
  });

  it("blocks minting while the contract is paused", async () => {
    const { contract, bob, mintFee } = await loadFixture(deployFixture);
    await contract.pause();

    await expect(contract.ownerMint(bob.address, "ipfs://paused")).to.be.revertedWith("Pausable: paused");

    await contract.unpause();
    await contract.setPublicMintEnabled(true);

    await expect(contract.connect(bob).publicMint("ipfs://resumed", { value: mintFee }))
      .to.emit(contract, "CollectibleMinted");
  });
});
