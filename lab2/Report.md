# Smart Contract Development Workflow Report

## 1. Project Setup Steps
1. Initialized a Node.js project using `npm init -y`.
2. Installed Hardhat and its dependencies:
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   ```
3. Set up a standard Hardhat project structure:
   - `contracts/` for Solidity code.
   - `test/` for automated tests using Mocha/Chai.
   - `scripts/` for deployment and execution scripts.
4. Configured `hardhat.config.js` to define the Solidity version (`0.8.23`) and added Sepolia testnet details using an Infura RPC URL and a private key.

## 2. Smart Contract Code (`Token.sol`)
```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Token {

    string public name = "My Hardhat Token";
    string public symbol = "MHT";
    uint256 public totalSupply = 1000000;

    address public owner;
    mapping(address => uint256) balances;

    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    constructor() {
        balances[msg.sender] = totalSupply;
        owner = msg.sender;
    }

    function transfer(address to, uint256 amount) external {
        require(balances[msg.sender] >= amount, "Not enough tokens");

        console.log(
            "Transferring from %s to %s %s tokens",
            msg.sender,
            to,
            amount
        );

        balances[msg.sender] -= amount;
        balances[to] += amount;

        emit Transfer(msg.sender, to, amount);
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}
```

## 3. Test Code (`test/Token.js`)
```javascript
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
```

## 4. Test Results (Logs)
Running `npx hardhat test`:
```
  Token contract
    Deployment
      ✔ Should set the right owner (685ms)
      ✔ Should assign total supply to owner
    Transactions
Transferring from 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 to 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 50 tokens
Transferring from 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 to 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc 50 tokens
      ✔ Should transfer tokens between accounts
Transferring from 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 to 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 50 tokens
Transferring from 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 to 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc 50 tokens
      ✔ Should emit Transfer events
      ✔ Should fail if sender has insufficient balance

  5 passing (711ms)
```

## 5. Transaction Demonstration Results & 6. Deployment Logs (Local)
Running `npx hardhat run scripts/deploy.js`:
```
Deploying with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Account balance: 10000000000000000000000

=== Deployment ===
Token deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Etherscan: https://sepolia.etherscan.io/address/0x5FbDB2315678afecb367f032d93F642f64180aa3

Total Supply: 1000000 MHT
Deployer balance: 1000000 MHT

=== Transaction 1: Transfer 100 MHT (Owner -> Addr1) ===
From (Owner): 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
To (Addr1): 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Transferring from 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 to 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 100 tokens
Tx Hash: 0x872a7964d7688d04504d00e1411db7887dcd6304d6216c10a604f4d16f2bb4a6

=== Transaction 2: Transfer 50 MHT (Addr1 -> Addr2) ===
From (Addr1): 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
To (Addr2): 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Transferring from 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 to 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc 50 tokens
Tx Hash: 0xbfb56de149758c97a22f15f2f23f899b23392c62e54233c7ebc7675bc8529bbd

=== Final Balances ===
Deployer: 999900 MHT
Addr1: 50 MHT
Addr2: 50 MHT
```
