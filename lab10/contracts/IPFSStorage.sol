// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IPFSStorage — on-chain registry of IPFS CIDs
/// @notice Stores file metadata + CID on Sepolia so files can be retrieved trustlessly
contract IPFSStorage {

    struct FileRecord {
        uint256 id;
        string  cid;
        string  fileName;
        uint256 fileSize;
        bool    encrypted;
        address uploader;
        uint256 timestamp;
    }

    FileRecord[] private _files;

    // uploader → list of file IDs
    mapping(address => uint256[]) private _userFiles;

    // ── Events ──────────────────────────────────────────────────────────────
    event FileStored(
        uint256 indexed id,
        string  cid,
        string  fileName,
        address indexed uploader,
        uint256 timestamp
    );

    event FileDeleted(uint256 indexed id, address indexed by);

    // ── Store a new file ────────────────────────────────────────────────────
    /// @param cid       IPFS Content Identifier
    /// @param fileName  Original file name
    /// @param fileSize  File size in bytes
    /// @param encrypted Whether the file was encrypted before upload
    /// @return id       Index of the stored record
    function storeFile(
        string  calldata cid,
        string  calldata fileName,
        uint256          fileSize,
        bool             encrypted
    ) external returns (uint256 id) {
        require(bytes(cid).length > 0,      "CID cannot be empty");
        require(bytes(fileName).length > 0, "fileName cannot be empty");

        id = _files.length;
        _files.push(FileRecord({
            id:        id,
            cid:       cid,
            fileName:  fileName,
            fileSize:  fileSize,
            encrypted: encrypted,
            uploader:  msg.sender,
            timestamp: block.timestamp
        }));
        _userFiles[msg.sender].push(id);

        emit FileStored(id, cid, fileName, msg.sender, block.timestamp);
    }

    // ── Read a single record ─────────────────────────────────────────────────
    function getFile(uint256 id) external view returns (FileRecord memory) {
        require(id < _files.length, "File not found");
        return _files[id];
    }

    // ── All files stored by a given address ─────────────────────────────────
    function getUserFileIds(address user) external view returns (uint256[] memory) {
        return _userFiles[user];
    }

    function getUserFiles(address user) external view returns (FileRecord[] memory) {
        uint256[] memory ids = _userFiles[user];
        FileRecord[] memory records = new FileRecord[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            records[i] = _files[ids[i]];
        }
        return records;
    }

    // ── All files (paginated) ────────────────────────────────────────────────
    function getFiles(uint256 from, uint256 count) external view returns (FileRecord[] memory) {
        uint256 total = _files.length;
        if (from >= total) return new FileRecord[](0);
        uint256 end = from + count > total ? total : from + count;
        FileRecord[] memory result = new FileRecord[](end - from);
        for (uint256 i = from; i < end; i++) {
            result[i - from] = _files[i];
        }
        return result;
    }

    // ── Stats ────────────────────────────────────────────────────────────────
    function totalFiles() external view returns (uint256) {
        return _files.length;
    }
}
