// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Token {
    string public name = "Hardhat Token";
    string public symbol = "HHT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    address public owner;
    
    mapping(address => uint256) private balances;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    constructor() {
        totalSupply = 1000000 * 10**decimals;
        owner = msg.sender;
        balances[msg.sender] = totalSupply;
        // Emit mint event
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(to != address(0), "Invalid address");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        balances[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}
