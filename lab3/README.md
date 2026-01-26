# Lab 3: SecureVault - Reentrancy Protected Ethereum Vault

A secure Ethereum vault smart contract implementation using Hardhat and OpenZeppelin, demonstrating protection against common DeFi vulnerabilities.

---

## 📋 Table of Contents

1. [Project Setup](#project-setup)
2. [Smart Contract Explanation](#smart-contract-explanation)
3. [Security Vulnerabilities & Mitigations](#security-vulnerabilities--mitigations)
4. [Test Cases](#test-cases)
5. [Commands Reference](#commands-reference)
6. [Viva Questions & Answers](#viva-questions--answers)

---

## 🛠️ Project Setup

### Task 1: Hardhat Project & OpenZeppelin Installation

#### What is Hardhat?
Hardhat is a development environment for Ethereum that helps developers:
- Compile Solidity smart contracts
- Deploy contracts to networks
- Test contracts with JavaScript/TypeScript
- Debug and trace transactions

#### What is OpenZeppelin?
OpenZeppelin provides secure, audited, reusable smart contract libraries. We use:
- **ReentrancyGuard**: Prevents reentrancy attacks on functions

#### Installation Commands Used
```bash
# Initialize npm project
npm init -y

# Install Hardhat
npm install --save-dev hardhat

# Initialize Hardhat project
npx hardhat init

# Install OpenZeppelin Contracts
npm install @openzeppelin/contracts
```

#### Project Structure
```
lab3/
├── contracts/
│   ├── SecureVault.sol       # Main vault contract
│   └── MaliciousAttacker.sol # Attack contract for testing
├── test/
│   └── SecureVault.js        # Test suite
├── hardhat.config.js         # Hardhat configuration
├── package.json              # Dependencies
├── VULNERABILITIES.md        # Security analysis
└── README.md                 # This file
```

---

## 📝 Smart Contract Explanation

### Task 2: SecureVault.sol Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SecureVault is ReentrancyGuard {
    mapping(address => uint256) private balances;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    function deposit() external payable {
        require(msg.value > 0, "Deposit must be greater than zero");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Ether transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }
}
```

### Line-by-Line Explanation

| Line | Code | Explanation |
|------|------|-------------|
| 1 | `// SPDX-License-Identifier: MIT` | License identifier (required by Solidity) |
| 2 | `pragma solidity ^0.8.20` | Compiler version - 0.8+ has built-in overflow protection |
| 4 | `import "@openzeppelin/contracts/utils/ReentrancyGuard.sol"` | Import the reentrancy protection library |
| 6 | `contract SecureVault is ReentrancyGuard` | Inherit from ReentrancyGuard for reentrancy protection |
| 7 | `mapping(address => uint256) private balances` | Store each user's deposited ETH amount |
| 9-10 | `event Deposited/Withdrawn` | Events for logging on-chain - can be tracked by frontends |
| 12-16 | `deposit()` | Payable function - accepts ETH and updates balance |
| 18-25 | `withdraw()` | Protected withdrawal with `nonReentrant` modifier |
| 27-29 | `getBalance()` | View function - reads state without gas cost |

### Key Concepts

#### 1. `payable` Keyword
```solidity
function deposit() external payable
```
- Makes the function able to receive Ether
- `msg.value` contains the amount of ETH sent
- Without `payable`, sending ETH to this function reverts

#### 2. `external` vs `public`
- `external`: Can only be called from outside the contract (cheaper gas)
- `public`: Can be called both externally and internally

#### 3. `view` Keyword
```solidity
function getBalance(address user) external view returns (uint256)
```
- Indicates function only reads state, doesn't modify it
- No gas cost when called off-chain

#### 4. `nonReentrant` Modifier
```solidity
function withdraw(uint256 amount) external nonReentrant
```
- Comes from OpenZeppelin's `ReentrancyGuard`
- Uses a mutex lock to prevent reentrant calls
- Sets a lock at function start, releases at function end

#### 5. Events and `indexed` Keyword
```solidity
event Deposited(address indexed user, uint256 amount);
```
- Events are stored in transaction logs (cheaper than storage)
- `indexed` parameters can be searched/filtered efficiently
- Up to 3 indexed parameters allowed per event

#### 6. Low-Level `call` for ETH Transfer
```solidity
(bool success, ) = msg.sender.call{value: amount}("");
require(success, "Ether transfer failed");
```
- Recommended way to send ETH (forwards all gas)
- Returns a boolean for success/failure
- Alternative to deprecated `transfer()` and `send()`

---

## 🔒 Security Vulnerabilities & Mitigations

### Task 3: Vulnerability Analysis

### Vulnerability 1: Reentrancy Attack

#### What is Reentrancy?
A reentrancy attack occurs when an external contract calls back into the calling contract before the first execution completes.

#### How it Works (Without Protection)
```solidity
// VULNERABLE CODE - DO NOT USE
function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount);
    
    // 1. Send ETH BEFORE updating balance (WRONG ORDER!)
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success);
    
    // 2. Balance updated AFTER external call
    balances[msg.sender] -= amount;
}
```

**Attack Flow:**
1. Attacker deposits 1 ETH
2. Attacker calls `withdraw(1 ETH)`
3. Contract sends 1 ETH to attacker
4. Attacker's `receive()` function triggers
5. Attacker calls `withdraw(1 ETH)` again (balance not updated yet!)
6. Step 3-5 repeats until vault is drained
7. Finally, balance is set (underflows or becomes huge in old Solidity)

#### The DAO Hack (2016)
- Real-world reentrancy attack on "The DAO" smart contract
- Attacker drained ~3.6 million ETH ($50 million at the time)
- Led to Ethereum's hard fork creating Ethereum Classic

#### Our Mitigation (Two Layers)

**Layer 1: ReentrancyGuard**
```solidity
function withdraw(uint256 amount) external nonReentrant
```
- Uses a boolean lock variable
- Sets lock = true at function start
- If same function called again while locked, it reverts
- Sets lock = false at function end

**Layer 2: Checks-Effects-Interactions Pattern**
```solidity
function withdraw(uint256 amount) external nonReentrant {
    // CHECKS - Validate inputs
    require(balances[msg.sender] >= amount, "Insufficient balance");
    
    // EFFECTS - Update state FIRST
    balances[msg.sender] -= amount;
    
    // INTERACTIONS - External calls LAST
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Ether transfer failed");
}
```

---

### Vulnerability 2: Integer Overflow/Underflow

#### What is Integer Overflow?
When a number exceeds its maximum value and wraps around:
```
uint8 max = 255;
max + 1 = 0  // Overflow!

uint8 min = 0;
min - 1 = 255  // Underflow!
```

#### Solidity Version Protection
- **Solidity < 0.8.0**: No automatic overflow protection
  - Developers used `SafeMath` library
- **Solidity >= 0.8.0**: Built-in overflow/underflow checks
  - Transactions automatically revert on overflow

#### Our Mitigation
```solidity
pragma solidity ^0.8.20;  // Version 0.8+ has built-in protection
```

---

### Vulnerability 3: Denial of Service (DoS)

#### DoS via Failed Transfer
If using `transfer()` with its 2300 gas limit:
```solidity
payable(msg.sender).transfer(amount);  // Only 2300 gas forwarded
```
- Contracts with complex `receive()` functions might fail
- Malicious contracts could intentionally fail

#### Our Mitigation
```solidity
(bool success, ) = msg.sender.call{value: amount}("");
require(success, "Ether transfer failed");
```
- Forwards all available gas
- Handles failure gracefully

---

## 🧪 Test Cases

### Task 4: Test Suite

#### Test File: `test/SecureVault.js`

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Successful deposit | Deposit 1 ETH | Balance should be 1 ETH |
| Deposit event | Deposit triggers event | `Deposited` event emitted with correct args |
| Zero deposit rejection | Deposit 0 ETH | Should revert with "Deposit must be greater than zero" |
| Successful withdrawal | Withdraw after deposit | Balance should be 0 |
| Withdrawal event | Withdraw triggers event | `Withdrawn` event emitted with correct args |
| Zero balance withdrawal | Withdraw with 0 balance | Should revert with "Insufficient balance" |
| Over-balance withdrawal | Withdraw more than balance | Should revert with "Insufficient balance" |
| **Reentrancy protection** | Malicious contract attack | Attacker only gets their deposit, not others' funds |
| Normal withdrawal after attack | Withdraw after attack attempt | Should work normally |
| getBalance accuracy | Multiple deposits/withdrawals | Returns correct balance at each step |

#### Understanding the Reentrancy Test

```javascript
it("should be protected against reentrancy attack", async () => {
  // Deploy malicious attacker contract
  const MaliciousAttacker = await ethers.getContractFactory("MaliciousAttacker");
  const attacker = await MaliciousAttacker.deploy(vaultAddress);

  // Owner deposits 5 ETH (innocent user funds)
  await vault.connect(owner).deposit({ value: ethers.parseEther("5") });
  
  // Attacker deposits 1 ETH
  await attacker.deposit({ value: ethers.parseEther("1") });

  // Vault has 6 ETH total
  expect(await ethers.provider.getBalance(vaultAddress)).to.equal(ethers.parseEther("6"));

  // Attacker tries reentrancy attack
  await attacker.attack();

  // Attacker only got their 1 ETH back (not the 5 ETH!)
  expect(await attacker.getBalance()).to.equal(ethers.parseEther("1"));
  
  // Owner's 5 ETH is still safe in the vault
  expect(await ethers.provider.getBalance(vaultAddress)).to.equal(ethers.parseEther("5"));
});
```

#### MaliciousAttacker Contract Explained
```solidity
contract MaliciousAttacker {
    SecureVault public vault;
    
    receive() external payable {
        // When vault sends ETH, try to withdraw again!
        if (vault.getBalance(address(this)) > 0) {
            vault.withdraw(vault.getBalance(address(this)));
        }
    }
    
    function attack() external {
        vault.withdraw(vault.getBalance(address(this)));
    }
}
```

---

## 💻 Commands Reference

```bash
# Run all tests
npx hardhat test

# Run tests with gas report
REPORT_GAS=true npx hardhat test

# Compile contracts
npx hardhat compile

# Start local Hardhat node
npx hardhat node

# Clean build artifacts
npx hardhat clean
```

---

## ❓ Viva Questions & Answers

### Q1: What is the purpose of `ReentrancyGuard`?
**Answer:** ReentrancyGuard is an OpenZeppelin contract that provides a `nonReentrant` modifier. This modifier uses a mutex lock (boolean flag) to prevent a function from being called again while it's still executing. It protects against reentrancy attacks where a malicious contract tries to call back into our contract during an external call.

### Q2: What is the Checks-Effects-Interactions (CEI) pattern?
**Answer:** CEI is a security pattern where:
- **Checks**: First validate all inputs and conditions
- **Effects**: Then update all state variables
- **Interactions**: Finally make external calls

This prevents reentrancy because by the time an external call is made, the state is already updated.

### Q3: Why use `call{value}` instead of `transfer()`?
**Answer:** 
- `transfer()` forwards only 2300 gas, which may not be enough for contracts with complex receive functions
- `transfer()` and `send()` are considered deprecated
- `call{value}` forwards all remaining gas and allows proper error handling
- `call{value}` is the recommended way to send ETH in modern Solidity

### Q4: What is `msg.sender` and `msg.value`?
**Answer:**
- `msg.sender`: Address of the account/contract that called the current function
- `msg.value`: Amount of ETH (in Wei) sent with the transaction
- These are global variables available in every function

### Q5: Why is the `balances` mapping private?
**Answer:** Private visibility means:
- The variable cannot be accessed directly by other contracts
- It provides encapsulation - users must use `getBalance()` function
- Note: Private only means contract-level access control; data on blockchain is still publicly visible

### Q6: What would happen without reentrancy protection?
**Answer:** An attacker could:
1. Deposit a small amount
2. Call withdraw, which sends ETH to their contract
3. Their contract's `receive()` function calls withdraw again
4. Since balance isn't updated yet, the check passes
5. This loop drains all funds from the vault

### Q7: How does Solidity 0.8+ prevent overflow?
**Answer:** Starting from Solidity 0.8.0, arithmetic operations have built-in overflow/underflow checks. If an operation would cause overflow or underflow, the transaction automatically reverts with a panic error. This is done at the compiler level, so no external library like SafeMath is needed.

### Q8: What are events used for?
**Answer:** Events:
- Log important contract activities on the blockchain
- Are stored in transaction logs (cheaper than storage)
- Allow external applications (frontends, indexers) to listen for changes
- `indexed` parameters enable efficient filtering and searching

### Q9: What is the difference between `view` and `pure`?
**Answer:**
- `view`: Function reads state but doesn't modify it
- `pure`: Function neither reads nor modifies state
- Both don't cost gas when called externally (off-chain)

### Q10: Explain the attack in The DAO Hack.
**Answer:** In 2016, The DAO smart contract had a reentrancy vulnerability in its withdrawal function. An attacker:
1. Created a malicious contract
2. Deposited ETH into The DAO
3. Called the withdrawal function
4. In the fallback function, recursively called withdraw again
5. Drained ~3.6 million ETH before the attack was stopped
This led to Ethereum's contentious hard fork.

### Q11: What makes a function `payable`?
**Answer:** The `payable` keyword allows a function to receive Ether. Without it, sending ETH to a function reverts. When a function is payable, `msg.value` contains the amount of Wei sent with the call.

### Q12: How does the `nonReentrant` modifier work internally?
**Answer:** It uses a status variable:
```solidity
uint256 private _status;
uint256 private constant _NOT_ENTERED = 1;
uint256 private constant _ENTERED = 2;

modifier nonReentrant() {
    require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
    _status = _ENTERED;
    _;  // Execute function body
    _status = _NOT_ENTERED;
}
```
If a reentrant call is made, `_status` is still `_ENTERED`, so the require fails.

---

## 📚 Additional Resources

- [OpenZeppelin ReentrancyGuard Documentation](https://docs.openzeppelin.com/contracts/4.x/api/security#ReentrancyGuard)
- [Solidity Security Considerations](https://docs.soliditylang.org/en/latest/security-considerations.html)
- [Hardhat Documentation](https://hardhat.org/docs)
- [The DAO Attack Explained](https://www.coindesk.com/learn/understanding-the-dao-attack/)
