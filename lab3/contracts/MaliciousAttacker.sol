// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SecureVault.sol";

/**
 * @title MaliciousAttacker
 * @dev This contract attempts a reentrancy attack on SecureVault
 * Used for testing that the ReentrancyGuard protection works
 */
contract MaliciousAttacker {
    SecureVault public vault;
    uint256 public attackCount;

    constructor(address _vault) {
        vault = SecureVault(_vault);
    }

    // Function to deposit ETH into the vault
    function deposit() external payable {
        vault.deposit{value: msg.value}();
    }

    // Start the attack
    function attack() external {
        attackCount = 0;
        vault.withdraw(vault.getBalance(address(this)));
    }

    // Fallback function that attempts reentrancy
    receive() external payable {
        attackCount++;
        if (attackCount < 3 && vault.getBalance(address(this)) > 0) {
            // Try to reenter the withdraw function
            vault.withdraw(vault.getBalance(address(this)));
        }
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
