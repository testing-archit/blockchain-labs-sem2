// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract IPFSStorage {
    struct FileRecord {
        string cid;
        string name;
        uint256 timestamp;
        bool encrypted;
    }

    // Mapping from user address to their stored files
    mapping(address => FileRecord[]) private userFiles;

    event FileStored(address indexed user, string cid, string name, bool encrypted);

    function storeFile(string memory _cid, string memory _name, bool _encrypted) public {
        userFiles[msg.sender].push(FileRecord({
            cid: _cid,
            name: _name,
            timestamp: block.timestamp,
            encrypted: _encrypted
        }));
        emit FileStored(msg.sender, _cid, _name, _encrypted);
    }

    function getUserFiles() public view returns (FileRecord[] memory) {
        return userFiles[msg.sender];
    }
}
