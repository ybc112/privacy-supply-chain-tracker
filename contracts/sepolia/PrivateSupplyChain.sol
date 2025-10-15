// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PrivateSupplyChain (Sepolia Version)
 * @dev Privacy-preserving supply chain tracking using hashing for Sepolia testnet
 */
contract PrivateSupplyChain {

    // Role definitions
    enum Role { None, Manufacturer, Supplier, Distributor, Retailer, Inspector }

    // Product status
    enum ProductStatus { Created, InTransit, Delivered, Verified, Recalled }

    // Participant structure
    struct Participant {
        address addr;
        Role role;
        bytes32 hashedRating;  // Hashed reputation rating
        bool isActive;
        uint256 registeredAt;
    }

    // Product batch structure with hashed sensitive data
    struct ProductBatch {
        uint256 batchId;
        address manufacturer;
        bytes32 hashedQuantity;    // Hashed quantity
        bytes32 hashedQualityScore; // Hashed quality score
        bytes32 hashedPrice;        // Hashed price per unit
        ProductStatus status;
        uint256 createdAt;
        string publicMetadata;      // Public metadata
    }

    // Supply chain checkpoint with hashed data
    struct Checkpoint {
        uint256 batchId;
        address handler;
        bytes32 hashedTimestamp;   // Hashed timestamp
        bytes32 hashedLocation;    // Hashed location
        string publicNote;
        ProductStatus newStatus;
    }

    // State variables
    mapping(address => Participant) public participants;
    mapping(uint256 => ProductBatch) public productBatches;
    mapping(uint256 => Checkpoint[]) public batchCheckpoints;
    mapping(address => mapping(uint256 => bool)) public accessPermissions;

    // Commitment storage for reveal mechanism
    mapping(uint256 => mapping(address => bytes32)) private commitments;
    mapping(uint256 => mapping(address => uint256)) private revealedData;

    uint256 public nextBatchId = 1;
    address public admin;

    // Events
    event ParticipantRegistered(address indexed participant, Role role);
    event ProductBatchCreated(uint256 indexed batchId, address indexed manufacturer);
    event CheckpointAdded(uint256 indexed batchId, address indexed handler, ProductStatus newStatus);
    event AccessGranted(address indexed participant, uint256 indexed batchId);
    event QualityVerified(uint256 indexed batchId, address indexed inspector);
    event DataCommitted(uint256 indexed batchId, address indexed committer);
    event DataRevealed(uint256 indexed batchId, address indexed revealer);

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
            accessPermissions[msg.sender][_batchId] || msg.sender == admin,
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
        uint256 _rating
    ) external onlyAdmin {
        require(!participants[_participant].isActive, "Already registered");
        require(_role != Role.None, "Invalid role");

        participants[_participant] = Participant({
            addr: _participant,
            role: _role,
            hashedRating: keccak256(abi.encodePacked(_rating, _participant)),
            isActive: true,
            registeredAt: block.timestamp
        });

        emit ParticipantRegistered(_participant, _role);
    }

    /**
     * @dev Create a new product batch with hashed data
     */
    function createProductBatch(
        uint256 _quantity,
        uint256 _qualityScore,
        uint256 _pricePerUnit,
        string calldata _publicMetadata,
        uint256 _nonce
    ) external onlyRegistered hasRole(Role.Manufacturer) returns (uint256) {
        uint256 batchId = nextBatchId++;

        // Hash sensitive data with nonce for privacy
        bytes32 hashedQty = keccak256(abi.encodePacked(_quantity, _nonce, msg.sender));
        bytes32 hashedQuality = keccak256(abi.encodePacked(_qualityScore, _nonce, msg.sender));
        bytes32 hashedPrice = keccak256(abi.encodePacked(_pricePerUnit, _nonce, msg.sender));

        productBatches[batchId] = ProductBatch({
            batchId: batchId,
            manufacturer: msg.sender,
            hashedQuantity: hashedQty,
            hashedQualityScore: hashedQuality,
            hashedPrice: hashedPrice,
            status: ProductStatus.Created,
            createdAt: block.timestamp,
            publicMetadata: _publicMetadata
        });

        // Store commitment for future reveal
        commitments[batchId][msg.sender] = keccak256(
            abi.encodePacked(_quantity, _qualityScore, _pricePerUnit, _nonce)
        );

        // Grant access to manufacturer
        accessPermissions[msg.sender][batchId] = true;

        emit ProductBatchCreated(batchId, msg.sender);
        return batchId;
    }

    /**
     * @dev Add a checkpoint to track product movement
     */
    function addCheckpoint(
        uint256 _batchId,
        uint256 _timestamp,
        string calldata _location,
        string calldata _publicNote,
        ProductStatus _newStatus,
        uint256 _nonce
    ) external onlyRegistered {
        require(productBatches[_batchId].batchId != 0, "Batch not found");

        bytes32 hashedTime = keccak256(abi.encodePacked(_timestamp, _nonce, msg.sender));
        bytes32 hashedLoc = keccak256(abi.encodePacked(_location, _nonce, msg.sender));

        Checkpoint memory checkpoint = Checkpoint({
            batchId: _batchId,
            handler: msg.sender,
            hashedTimestamp: hashedTime,
            hashedLocation: hashedLoc,
            publicNote: _publicNote,
            newStatus: _newStatus
        });

        batchCheckpoints[_batchId].push(checkpoint);
        productBatches[_batchId].status = _newStatus;

        emit CheckpointAdded(_batchId, msg.sender, _newStatus);
    }

    /**
     * @dev Grant access to product data for a participant
     */
    function grantAccess(address _participant, uint256 _batchId) external {
        require(
            msg.sender == productBatches[_batchId].manufacturer || msg.sender == admin,
            "Not authorized"
        );
        require(participants[_participant].isActive, "Participant not active");

        accessPermissions[_participant][_batchId] = true;
        emit AccessGranted(_participant, _batchId);
    }

    /**
     * @dev Commit encrypted data (for commit-reveal pattern)
     */
    function commitData(uint256 _batchId, bytes32 _commitment) external onlyRegistered {
        commitments[_batchId][msg.sender] = _commitment;
        emit DataCommitted(_batchId, msg.sender);
    }

    /**
     * @dev Reveal committed data
     */
    function revealData(
        uint256 _batchId,
        uint256 _data,
        uint256 _nonce
    ) external onlyRegistered hasAccess(_batchId) {
        bytes32 commitment = keccak256(abi.encodePacked(_data, _nonce, msg.sender));
        require(commitments[_batchId][msg.sender] == commitment, "Invalid reveal");

        revealedData[_batchId][msg.sender] = _data;
        emit DataRevealed(_batchId, msg.sender);
    }

    /**
     * @dev Verify product quality (for inspectors)
     */
    function verifyQuality(
        uint256 _batchId,
        uint256 _newQualityScore,
        uint256 _nonce
    ) external onlyRegistered hasRole(Role.Inspector) {
        require(productBatches[_batchId].batchId != 0, "Batch not found");

        // Update hashed quality score
        productBatches[_batchId].hashedQualityScore = keccak256(
            abi.encodePacked(_newQualityScore, _nonce, msg.sender)
        );
        productBatches[_batchId].status = ProductStatus.Verified;

        emit QualityVerified(_batchId, msg.sender);
    }

    /**
     * @dev Verify data integrity using hash
     */
    function verifyDataIntegrity(
        uint256 _batchId,
        uint256 _data,
        uint256 _nonce,
        bytes32 _expectedHash
    ) external view returns (bool) {
        bytes32 calculatedHash = keccak256(abi.encodePacked(_data, _nonce, msg.sender));
        return calculatedHash == _expectedHash;
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

    /**
     * @dev Get checkpoint count for a batch
     */
    function getCheckpointCount(uint256 _batchId) external view returns (uint256) {
        return batchCheckpoints[_batchId].length;
    }

    /**
     * @dev Get checkpoint details
     */
    function getCheckpoint(uint256 _batchId, uint256 _index) external view returns (
        address handler,
        bytes32 hashedTimestamp,
        bytes32 hashedLocation,
        string memory publicNote,
        ProductStatus newStatus
    ) {
        require(_index < batchCheckpoints[_batchId].length, "Invalid index");
        Checkpoint memory cp = batchCheckpoints[_batchId][_index];
        return (cp.handler, cp.hashedTimestamp, cp.hashedLocation, cp.publicNote, cp.newStatus);
    }

    /**
     * @dev Check if address has access to batch
     */
    function hasAccessToBatch(address _participant, uint256 _batchId) external view returns (bool) {
        return accessPermissions[_participant][_batchId];
    }
}