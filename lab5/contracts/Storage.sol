// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Storage {
    uint256 private value;
    address public owner;

    mapping(address => bool) public allowlist;

    event ValueChanged(address indexed user, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event AccessGranted(address indexed user);
    event AccessRevoked(address indexed user);
    event ValueReset(address indexed by);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || allowlist[msg.sender], "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Set a new value (owner or authorized user)
    function setValue(uint256 _value) public onlyAuthorized {
        value = _value;
        emit ValueChanged(msg.sender, _value);
    }

    /// @notice Read the current stored value
    function getValue() public view returns (uint256) {
        return value;
    }

    /// @notice Transfer ownership to a new address (only owner)
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Grant write access to a user (only owner)
    function grantAccess(address user) public onlyOwner {
        allowlist[user] = true;
        emit AccessGranted(user);
    }

    /// @notice Revoke write access from a user (only owner)
    function revokeAccess(address user) public onlyOwner {
        allowlist[user] = false;
        emit AccessRevoked(user);
    }

    /// @notice Reset the stored value to 0 (only owner)
    function resetValue() public onlyOwner {
        value = 0;
        emit ValueReset(msg.sender);
        emit ValueChanged(msg.sender, 0);
    }
}
