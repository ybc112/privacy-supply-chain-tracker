// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "fhevm/lib/TFHE.sol";
import "fhevm/abstracts/Reencrypt.sol";
import "fhevm/gateway/GatewayCaller.sol";

/**
 * @title PrivateSupplyChain
 * @dev Main contract for privacy-preserving supply chain tracking using FHE
 */
contract PrivateSupplyChain is Reencrypt, GatewayCaller {

    // Encrypted data types from TFHE library
    using TFHE for euint32;
    using TFHE for euint64;
    using TFHE for ebool;

    // Role definitions
    enum Role { None, Manufacturer, Supplier, Distributor, Retailer, Inspector }

    // Product status in encrypted form
    enum ProductStatus { Created, InTransit, Delivered, Verified, Recalled }

    // Participant structure
    struct Participant {
        address addr;
        Role role;
        euint32 encryptedRating;  // Encrypted reputation rating (0-100)
        bool isActive;
        uint256 registeredAt;
    }

    // Product batch structure with encrypted sensitive data
    struct ProductBatch {
        uint256 batchId;
        address manufacturer;
        euint64 encryptedQuantity;    // Encrypted quantity
        euint32 encryptedQualityScore; // Encrypted quality score (0-100)
        euint64 encryptedPrice;        // Encrypted price per unit
        ProductStatus status;
        uint256 createdAt;
        string publicMetadata;         // Public metadata (product type, category)
    }

    // Supply chain checkpoint with encrypted data
    struct Checkpoint {
        uint256 batchId;
        address handler;
        euint64 encryptedTimestamp;   // Encrypted timestamp
        euint32 encryptedLocationHash; // Encrypted location hash
        string publicNote;
        ProductStatus newStatus;
    }

    // State variables
    mapping(address => Participant) public participants;
    mapping(uint256 => ProductBatch) public productBatches;
    mapping(uint256 => Checkpoint[]) public batchCheckpoints;
    mapping(address => mapping(uint256 => ebool)) private accessPermissions;

    uint256 public nextBatchId = 1;
    address public admin;

    // Events
    event ParticipantRegistered(address indexed participant, Role role);
    event ProductBatchCreated(uint256 indexed batchId, address indexed manufacturer);
    event CheckpointAdded(uint256 indexed batchId, address indexed handler, ProductStatus newStatus);
    event AccessGranted(address indexed participant, uint256 indexed batchId);
    event QualityVerified(uint256 indexed batchId, address indexed inspector);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyRegistered() {
        require(participants[msg.sender].isActive, "Not registered");
        _;
    }

    modifier hasRole(Role _role) {
        require(participants[msg.sender].role == _role, "Invalid role");
        _;
    }

    modifier hasAccess(uint256 _batchId) {
        require(
            TFHE.decrypt(accessPermissions[msg.sender][_batchId]) ||
            msg.sender == admin,
            "No access"
        );
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Register a new participant in the supply chain
     */
    function registerParticipant(
        address _participant,
        Role _role,
        bytes calldata _encryptedRating
    ) external onlyAdmin {
        require(!participants[_participant].isActive, "Already registered");
        require(_role != Role.None, "Invalid role");

        participants[_participant] = Participant({
            addr: _participant,
            role: _role,
            encryptedRating: TFHE.asEuint32(_encryptedRating),
            isActive: true,
            registeredAt: block.timestamp
        });

        emit ParticipantRegistered(_participant, _role);
    }

    /**
     * @dev Create a new product batch with encrypted data
     */
    function createProductBatch(
        bytes calldata _encryptedQuantity,
        bytes calldata _encryptedQualityScore,
        bytes calldata _encryptedPrice,
        string calldata _publicMetadata
    ) external onlyRegistered hasRole(Role.Manufacturer) returns (uint256) {
        uint256 batchId = nextBatchId++;

        productBatches[batchId] = ProductBatch({
            batchId: batchId,
            manufacturer: msg.sender,
            encryptedQuantity: TFHE.asEuint64(_encryptedQuantity),
            encryptedQualityScore: TFHE.asEuint32(_encryptedQualityScore),
            encryptedPrice: TFHE.asEuint64(_encryptedPrice),
            status: ProductStatus.Created,
            createdAt: block.timestamp,
            publicMetadata: _publicMetadata
        });

        // Grant access to manufacturer
        accessPermissions[msg.sender][batchId] = TFHE.asEbool(true);

        emit ProductBatchCreated(batchId, msg.sender);
        return batchId;
    }

    /**
     * @dev Add a checkpoint to track product movement
     */
    function addCheckpoint(
        uint256 _batchId,
        bytes calldata _encryptedTimestamp,
        bytes calldata _encryptedLocationHash,
        string calldata _publicNote,
        ProductStatus _newStatus
    ) external onlyRegistered {
        require(productBatches[_batchId].batchId != 0, "Batch not found");

        Checkpoint memory checkpoint = Checkpoint({
            batchId: _batchId,
            handler: msg.sender,
            encryptedTimestamp: TFHE.asEuint64(_encryptedTimestamp),
            encryptedLocationHash: TFHE.asEuint32(_encryptedLocationHash),
            publicNote: _publicNote,
            newStatus: _newStatus
        });

        batchCheckpoints[_batchId].push(checkpoint);
        productBatches[_batchId].status = _newStatus;

        emit CheckpointAdded(_batchId, msg.sender, _newStatus);
    }

    /**
     * @dev Grant access to encrypted data for a participant
     */
    function grantAccess(address _participant, uint256 _batchId) external {
        require(
            msg.sender == productBatches[_batchId].manufacturer ||
            msg.sender == admin,
            "Not authorized"
        );
        require(participants[_participant].isActive, "Participant not active");

        accessPermissions[_participant][_batchId] = TFHE.asEbool(true);
        emit AccessGranted(_participant, _batchId);
    }

    /**
     * @dev Verify product quality (for inspectors)
     */
    function verifyQuality(
        uint256 _batchId,
        bytes calldata _newQualityScore
    ) external onlyRegistered hasRole(Role.Inspector) {
        require(productBatches[_batchId].batchId != 0, "Batch not found");

        // Update encrypted quality score
        productBatches[_batchId].encryptedQualityScore = TFHE.asEuint32(_newQualityScore);
        productBatches[_batchId].status = ProductStatus.Verified;

        emit QualityVerified(_batchId, msg.sender);
    }

    /**
     * @dev Get re-encrypted product quantity for authorized viewer
     */
    function getProductQuantity(
        uint256 _batchId,
        bytes32 publicKey,
        bytes calldata signature
    ) external view onlyRegistered hasAccess(_batchId) returns (bytes memory) {
        return TFHE.reencrypt(
            productBatches[_batchId].encryptedQuantity,
            publicKey,
            signature
        );
    }

    /**
     * @dev Get re-encrypted quality score for authorized viewer
     */
    function getQualityScore(
        uint256 _batchId,
        bytes32 publicKey,
        bytes calldata signature
    ) external view onlyRegistered hasAccess(_batchId) returns (bytes memory) {
        return TFHE.reencrypt(
            productBatches[_batchId].encryptedQualityScore,
            publicKey,
            signature
        );
    }

    /**
     * @dev Get re-encrypted price for authorized viewer
     */
    function getProductPrice(
        uint256 _batchId,
        bytes32 publicKey,
        bytes calldata signature
    ) external view onlyRegistered hasAccess(_batchId) returns (bytes memory) {
        return TFHE.reencrypt(
            productBatches[_batchId].encryptedPrice,
            publicKey,
            signature
        );
    }

    /**
     * @dev Compare two encrypted quantities (useful for inventory management)
     */
    function compareQuantities(
        uint256 _batchId1,
        uint256 _batchId2
    ) external view returns (ebool) {
        require(
            TFHE.decrypt(accessPermissions[msg.sender][_batchId1]) &&
            TFHE.decrypt(accessPermissions[msg.sender][_batchId2]),
            "No access to batches"
        );

        return TFHE.gt(
            productBatches[_batchId1].encryptedQuantity,
            productBatches[_batchId2].encryptedQuantity
        );
    }

    /**
     * @dev Get participant rating (re-encrypted)
     */
    function getParticipantRating(
        address _participant,
        bytes32 publicKey,
        bytes calldata signature
    ) external view onlyAdmin returns (bytes memory) {
        require(participants[_participant].isActive, "Participant not found");
        return TFHE.reencrypt(
            participants[_participant].encryptedRating,
            publicKey,
            signature
        );
    }

    /**
     * @dev Get public batch information
     */
    function getBatchInfo(uint256 _batchId) external view returns (
        address manufacturer,
        ProductStatus status,
        uint256 createdAt,
        string memory publicMetadata,
        uint256 checkpointCount
    ) {
        ProductBatch memory batch = productBatches[_batchId];
        return (
            batch.manufacturer,
            batch.status,
            batch.createdAt,
            batch.publicMetadata,
            batchCheckpoints[_batchId].length
        );
    }
}