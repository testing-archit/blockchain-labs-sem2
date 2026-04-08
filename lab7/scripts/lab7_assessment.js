const hre = require("hardhat");
const readline = require("readline");

// ============================================================================
// PART 1: The 6 Mandatory ERC-20 Functions defined together in one JS file
// ============================================================================

// 1. totalSupply
async function getTotalSupply(token) {
  const supply = await token.totalSupply();
  console.log(`[View] Total Supply: ${hre.ethers.formatUnits(supply, 18)}`);
  return supply;
}

// 2. balanceOf
async function getBalanceOf(token, account) {
  const balance = await token.balanceOf(account);
  console.log(`[View] Balance of ${account}: ${hre.ethers.formatUnits(balance, 18)}`);
  return balance;
}

// 3. transfer
async function transferTokens(token, recipient, amountStr) {
  console.log(`[Action] Transferring ${amountStr} tokens to ${recipient}...`);
  const parsedAmount = hre.ethers.parseUnits(amountStr.toString(), 18);
  const tx = await token.transfer(recipient, parsedAmount);
  return tx;
}

// 4. approve
async function approveAllowance(token, spender, amountStr) {
  console.log(`[Action] Approving ${spender} to spend ${amountStr} tokens...`);
  const parsedAmount = hre.ethers.parseUnits(amountStr.toString(), 18);
  const tx = await token.approve(spender, parsedAmount);
  return tx;
}

// 5. transferFrom
async function transferFromTokens(token, sender, recipient, amountStr) {
  console.log(`[Action] Transferring ${amountStr} tokens from ${sender} to ${recipient}...`);
  const parsedAmount = hre.ethers.parseUnits(amountStr.toString(), 18);
  const tx = await token.transferFrom(sender, recipient, parsedAmount);
  return tx;
}

// 6. allowance
async function getAllowance(token, owner, spender) {
  const allowance = await token.allowance(owner, spender);
  console.log(`[View] Allowance for ${spender} by ${owner}: ${hre.ethers.formatUnits(allowance, 18)}`);
  return allowance;
}


// ============================================================================
// PART 2: CLI Interface to Complete Assessment Tasks (2, 3, 4, 5)
// ============================================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log("\n==============================================");
  console.log("       Lab 7 ERC-20 Assessment CLI tool       ");
  console.log("==============================================\n");

  const [deployer, secondaryAccount] = await hre.ethers.getSigners();
  console.log(`Executing from primary deployer account: ${deployer.address}\n`);

  let tokenAddress = await question("Do you have an existing deployed token address on Sepolia? (Leave blank to DEPLOY NEW): ");
  let token;

  if (!tokenAddress) {
    console.log("\n[Task 2] Deploying the smart contract...");
    const ArchitToken = await hre.ethers.getContractFactory("ArchitToken");
    
    console.log("Deploying contract to Sepolia testnet... (please wait)");
    token = await ArchitToken.deploy();
    await token.waitForDeployment();
    
    tokenAddress = await token.getAddress();
    console.log(`Contract Deployed! Address: ${tokenAddress}`);
    console.log(`[Task 5] Deployment Transaction Hash: ${token.deploymentTransaction().hash}\n`);
    
    // Check initial state
    await getTotalSupply(token);
    await getBalanceOf(token, deployer.address);
  } else {
    const ArchitToken = await hre.ethers.getContractFactory("ArchitToken");
    token = ArchitToken.attach(tokenAddress);
    console.log(`\nAttached to contract at: ${tokenAddress}`);
    await getTotalSupply(token);
    await getBalanceOf(token, deployer.address);
  }

  while (true) {
    console.log("\n----------------------------------------------");
    console.log("Please select a task to execute:");
    console.log("1. Check Current Balances & Total Supply");
    console.log("2. [Task 3] Transfer 100 tokens to 0xf16095EEFBA8B88fe92180c1aca76B17ea68B101");
    console.log("3. [Task 4] Give allowance and execute transferFrom function");
    console.log("4. Exit CLI");
    console.log("----------------------------------------------");
    
    const choice = await question("Enter choice (1-4): ");

    try {
      if (choice === "1") {
        await getTotalSupply(token);
        await getBalanceOf(token, deployer.address);
      } 
      else if (choice === "2") {
        const defaultRecipient = "0xf16095EEFBA8B88fe92180c1aca76B17ea68B101";
        const recipient = await question(`Enter recipient address (default: ${defaultRecipient}): `) || defaultRecipient;
        const amount = await question("Enter amount to transfer (default: 100): ") || "100";
        
        const tx = await transferTokens(token, recipient, amount);
        console.log("Waiting for block confirmation...");
        await tx.wait();
        console.log(`[Task 5] Transfer Hash: ${tx.hash}`);
      }
      else if (choice === "3") {
        console.log("\n--- Part A: Give Allowance ---");
        const defaultSpender = secondaryAccount ? secondaryAccount.address : "0x...";
        const spender = await question(`Enter address of person sitting next to you (spender) (default: ${defaultSpender}): `) || defaultSpender;
        const amount = await question("Enter allowance amount (default: 50): ") || "50";
        
        const approveTx = await approveAllowance(token, spender, amount);
        console.log("Waiting for block confirmation...");
        await approveTx.wait();
        console.log(`[Task 5] Approve Hash: ${approveTx.hash}`);
        await getAllowance(token, deployer.address, spender);

        console.log("\n--- Part B: Execute transferFrom ---");
        const recipient = await question(`Enter final recipient of these tokens (default: ${deployer.address}): `) || deployer.address;
        
        console.log("Note: To execute transferFrom, the SPENDER must call the contract.");
        console.log(`Connecting asspender wallet ${spender} to execute...`);
        
        let tokenAsSpender;
        if (secondaryAccount && spender.toLowerCase() === secondaryAccount.address.toLowerCase()) {
           tokenAsSpender = token.connect(secondaryAccount);
        } else {
           console.log("Cannot connect as the exact spender address automatically unless we have their private key.");
           console.log("If this fails, it's because the spender didn't initiate the transaction.");
           tokenAsSpender = token; // This might fail if we aren't the spender
        }

        const transferFromTx = await transferFromTokens(tokenAsSpender, deployer.address, recipient, amount);
        console.log("Waiting for block confirmation...");
        await transferFromTx.wait();
        console.log(`[Task 5] TransferFrom Hash: ${transferFromTx.hash}`);
      }
      else if (choice === "4") {
        console.log("\nExiting CLI. Have a great day!");
        rl.close();
        break;
      } else {
        console.log("Invalid choice, please select 1-4.");
      }
    } catch (error) {
      console.error("\n[Error] An error occurred during execution:");
      console.error(error.reason || error.message);
    }
  }
}

main().catch((error) => {
  console.error("Fatal Error:", error);
  process.exitCode = 1;
  rl.close();
});
