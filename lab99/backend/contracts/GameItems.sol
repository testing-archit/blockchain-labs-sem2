// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GameItems
 * @dev ERC-1155 contract managing all RPG game assets:
 *      - Fungible tokens: Gold, Silver, Shield, Crown
 *      - NFTs: Sword (rare), Legendary Reward (1-of-1 prize for winner)
 */
contract GameItems is ERC1155, Ownable {
    // ── Fungible tokens ──────────────────────────────────────
    uint256 public constant GOLD   = 0;
    uint256 public constant SILVER = 1;
    uint256 public constant SHIELD = 3;
    uint256 public constant CROWN  = 4;

    // ── NFTs ─────────────────────────────────────────────────
    uint256 public constant SWORD            = 2;  // Rare NFT
    uint256 public constant LEGENDARY_REWARD = 5;  // 1-of-1 NFT prize for the winner

    // ── Token names for display ───────────────────────────────
    mapping(uint256 => string) public tokenName;

    constructor() ERC1155("ipfs://QmSampleHashForMetadata/{id}.json") Ownable(msg.sender) {
        tokenName[GOLD]             = "Gold";
        tokenName[SILVER]           = "Silver";
        tokenName[SWORD]            = "Iron Sword";
        tokenName[SHIELD]           = "Shield";
        tokenName[CROWN]            = "Crown";
        tokenName[LEGENDARY_REWARD] = "Legendary Reward";

        // Mint the ONE legendary NFT prize to the deployer (winner receives it via transfer)
        _mint(msg.sender, LEGENDARY_REWARD, 1, "");
    }

    /**
     * @dev Mint a single token type. LEGENDARY_REWARD is capped at supply = 1 total.
     */
    function mint(address to, uint256 id, uint256 amount) public {
        require(
            id != LEGENDARY_REWARD || amount == 1,
            "LEGENDARY_REWARD is a 1-of-1 NFT prize"
        );
        _mint(to, id, amount, "");
    }

    /**
     * @dev Mint multiple token types in a single transaction.
     */
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) public {
        _mintBatch(to, ids, amounts, "");
    }
}
