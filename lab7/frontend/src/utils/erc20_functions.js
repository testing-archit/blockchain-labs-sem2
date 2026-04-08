import { ethers } from "ethers";

/**
 * ERC-20 Mandatory Functions Implementation
 * 
 * This file centralizes the 6 mandatory functions of the ERC-20 standard,
 * making them reusable across the entire project (frontend and scripts).
 */

// 1. totalSupply
export async function getTotalSupply(token) {
  const supply = await token.totalSupply();
  return supply;
}

// 2. balanceOf
export async function getBalanceOf(token, account) {
  const balance = await token.balanceOf(account);
  return balance;
}

// 3. transfer
export async function transferTokens(token, recipient, amount) {
  // Accept both string (to be parsed) and BigInt
  const parsedAmount = typeof amount === "string" 
    ? ethers.parseUnits(amount, 18) 
    : amount;
  
  const tx = await token.transfer(recipient, parsedAmount);
  return tx;
}

// 4. approve
export async function approveAllowance(token, spender, amount) {
  const parsedAmount = typeof amount === "string" 
    ? ethers.parseUnits(amount, 18) 
    : amount;
  
  const tx = await token.approve(spender, parsedAmount);
  return tx;
}

// 5. transferFrom
export async function transferFromTokens(token, sender, recipient, amount) {
  const parsedAmount = typeof amount === "string" 
    ? ethers.parseUnits(amount, 18) 
    : amount;
  
  const tx = await token.transferFrom(sender, recipient, parsedAmount);
  return tx;
}

// 6. allowance
export async function getAllowance(token, owner, spender) {
  const allowance = await token.allowance(owner, spender);
  return allowance;
}
