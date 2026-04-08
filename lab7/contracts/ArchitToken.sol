// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ArchitToken is ERC20 {
    constructor() ERC20("archit_token", "AT") {
        _mint(msg.sender, 100000 * 10 ** decimals());
    }
    
}
