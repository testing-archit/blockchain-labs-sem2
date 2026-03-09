// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract UniversityCredentials {
    // ── Admin Access Control ──
    address public admin;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    // ── Credential Structure ──
    struct Credential {
        string name;
        string course;
        string hash;
        uint issuedOn;
    }

    // ── Storage ──
    mapping(address => Credential[]) private credentials;

    // ── Events ──
    event CredentialAdded(address indexed student, string degree, uint256 year);
    event CredentialUpdated(address indexed student, uint256 timestamp);

    // ── Constructor ──
    constructor() {
        admin = msg.sender;
    }

    // ── Core Functions ──

    /// @notice Allows admin to issue a credential to a student
    function addCredential(
        address student,
        string memory name,
        string memory course,
        string memory docHash
    ) public onlyAdmin {
        credentials[student].push(Credential({
            name: name,
            course: course,
            hash: docHash,
            issuedOn: block.timestamp
        }));

        emit CredentialAdded(student, course, block.timestamp);
    }

    /// @notice Allows anyone to view credentials of a student
    function getCredentials(address student) public view returns (Credential[] memory) {
        return credentials[student];
    }

    /// @notice Allows admin to update credential hash
    function updateCredential(
        address student,
        uint index,
        string memory newHash
    ) public onlyAdmin {
        require(index < credentials[student].length, "Invalid index");
        credentials[student][index].hash = newHash;

        emit CredentialUpdated(student, block.timestamp);
    }

    // ── Security & Integrity (Task 5) ──

    /// @notice Compute keccak256 hash of credential data for integrity verification
    function computeHash(string memory name, string memory course) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(name, course));
    }
}
