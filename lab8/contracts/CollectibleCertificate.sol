// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Pausable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CollectibleCertificate
 * @notice ERC-721 contract for minting certificate NFTs with fee, metadata, and access controls.
 */
contract CollectibleCertificate is ERC721Pausable, Ownable, ReentrancyGuard {
    /// @notice Mint fee denominated in wei.
    uint256 public immutable mintFee;

    /// @notice Maximum number of tokens that can ever be minted.
    uint256 public immutable maxSupply;

    /// @notice Next token ID to mint (starts at 1 for clarity).
    uint256 private _nextTokenId = 1;

    /// @notice Controls whether the payable public minting endpoint is available.
    bool public publicMintEnabled;

    /// @dev Stores IPFS/HTTP metadata URIs for every token ID.
    mapping(uint256 => string) private _tokenURIs;

    event CollectibleMinted(address indexed minter, address indexed recipient, uint256 indexed tokenId, string tokenURI);

    error MaxSupplyReached();
    error InvalidMaxSupply();
    error PublicMintDisabled();
    error IncorrectFee(uint256 expected, uint256 provided);
    error ZeroAddress();

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 mintFee_,
        uint256 maxSupply_,
        address initialOwner
    ) ERC721(name_, symbol_) {
        if (maxSupply_ == 0) {
            revert InvalidMaxSupply();
        }
        if (initialOwner == address(0)) {
            revert ZeroAddress();
        }
        mintFee = mintFee_;
        maxSupply = maxSupply_;
        _transferOwnership(initialOwner);
    }

    /**
     * @notice Enables or disables the payable public mint endpoint.
     */
    function setPublicMintEnabled(bool enabled) external onlyOwner {
        publicMintEnabled = enabled;
    }

    /**
     * @notice Owner-restricted minting for administrative drops or certificate issuance.
     */
    function ownerMint(address to, string calldata newTokenURI) external onlyOwner whenNotPaused returns (uint256) {
        return _mintCollectible(to, newTokenURI);
    }

    /**
     * @notice Payable minting entry point. Requires public minting to be enabled.
     */
    function publicMint(string calldata newTokenURI) external payable whenNotPaused nonReentrant returns (uint256) {
        if (!publicMintEnabled) {
            revert PublicMintDisabled();
        }
        if (msg.value != mintFee) {
            revert IncorrectFee(mintFee, msg.value);
        }
        return _mintCollectible(msg.sender, newTokenURI);
    }

    /**
     * @notice Updates the metadata URI for a given token. Restricted to the contract owner.
     */
    function setTokenURI(uint256 tokenId, string calldata newTokenURI) external onlyOwner {
        require(_exists(tokenId), "ERC721: invalid token ID");
        _tokenURIs[tokenId] = newTokenURI;
    }

    /**
     * @notice Current number of minted NFTs.
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @notice Returns the stored metadata URI for a token.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721: invalid token ID");
        return _tokenURIs[tokenId];
    }

    /**
     * @notice Withdraws the accumulated mint fees to a desired address.
     */
    function withdraw(address payable recipient) external onlyOwner nonReentrant {
        if (recipient == address(0)) {
            revert ZeroAddress();
        }
        recipient.transfer(address(this).balance);
    }

    /**
     * @notice Pauses all token transfers and mints.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Resumes token transfers and mints.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    function _mintCollectible(address to, string calldata newTokenURI) private returns (uint256) {
        if (_nextTokenId > maxSupply) {
            revert MaxSupplyReached();
        }
        if (to == address(0)) {
            revert ZeroAddress();
        }

        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = newTokenURI;

        emit CollectibleMinted(msg.sender, to, tokenId, newTokenURI);
        return tokenId;
    }
}
