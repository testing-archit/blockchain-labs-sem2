// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameItems is ERC1155, Ownable {
    uint256 public constant GOLD = 0;
    uint256 public constant SILVER = 1;
    uint256 public constant SWORD = 2;
    uint256 public constant SHIELD = 3;
    uint256 public constant CROWN = 4;
    uint256 public constant LEGENDARY_REWARD = 5; // The new NFT Prize

    // The URI will be replaced or managed by the user for real IPFS metadata
    constructor() ERC1155("ipfs://QmdSampleHashForMetadata/{id}.json") Ownable(msg.sender) {
        // Mint the ONE non-fungible prize for the winner (deployer gets it initially)
        _mint(msg.sender, LEGENDARY_REWARD, 1, "");
    }

    // Custom mint function — open to any caller for lab demo
    function mint(address to, uint256 id, uint256 amount) public {
        require(
            id != LEGENDARY_REWARD || amount == 1, 
            "LEGENDARY_REWARD is an NFT and can only have amount 1"
        );
        _mint(to, id, amount, "");
    }

    // Custom batch mint function — open to any caller for lab demo
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts) public {
        _mintBatch(to, ids, amounts, "");
    }
}
