// Contract ABIs
const PRIVATE_SUPPLY_CHAIN_ABI = [
    // Admin functions
    "function admin() view returns (address)",
    "function nextBatchId() view returns (uint256)",

    // Register participant
    "function registerParticipant(address participant, uint8 role, uint256 rating)",

    // Create product batch
    "function createProductBatch(uint256 quantity, uint256 qualityScore, uint256 pricePerUnit, string publicMetadata, uint256 nonce) returns (uint256)",

    // Add checkpoint
    "function addCheckpoint(uint256 batchId, uint256 timestamp, string location, string publicNote, uint8 newStatus, uint256 nonce)",

    // Grant access
    "function grantAccess(address participant, uint256 batchId)",

    // Verify quality
    "function verifyQuality(uint256 batchId, uint256 newQualityScore, uint256 nonce)",

    // View functions
    "function getBatchInfo(uint256 batchId) view returns (address manufacturer, uint8 status, uint256 createdAt, string publicMetadata, uint256 checkpointCount)",
    "function getCheckpointCount(uint256 batchId) view returns (uint256)",
    "function getCheckpoint(uint256 batchId, uint256 index) view returns (address handler, bytes32 hashedTimestamp, bytes32 hashedLocation, string publicNote, uint8 newStatus)",
    "function hasAccessToBatch(address participant, uint256 batchId) view returns (bool)",
    "function participants(address) view returns (address addr, uint8 role, bytes32 hashedRating, bool isActive, uint256 registeredAt)",
    "function productBatches(uint256) view returns (uint256 batchId, address manufacturer, bytes32 hashedQuantity, bytes32 hashedQualityScore, bytes32 hashedPrice, uint8 status, uint256 createdAt, string publicMetadata)",

    // Commit-Reveal functions
    "function commitData(uint256 batchId, bytes32 commitment)",
    "function revealData(uint256 batchId, uint256 data, uint256 nonce)",
    "function verifyDataIntegrity(uint256 batchId, uint256 data, uint256 nonce, bytes32 expectedHash) view returns (bool)",

    // Events
    "event ParticipantRegistered(address indexed participant, uint8 role)",
    "event ProductBatchCreated(uint256 indexed batchId, address indexed manufacturer)",
    "event CheckpointAdded(uint256 indexed batchId, address indexed handler, uint8 newStatus)",
    "event AccessGranted(address indexed participant, uint256 indexed batchId)",
    "event QualityVerified(uint256 indexed batchId, address indexed inspector)",
    "event DataCommitted(uint256 indexed batchId, address indexed committer)",
    "event DataRevealed(uint256 indexed batchId, address indexed revealer)"
];

const PRODUCT_TRACEABILITY_ABI = [
    // Add component
    "function addComponent(uint256 batchId, uint256 componentCode, uint256 percentage, string description, uint256 nonce)",

    // Update quality metrics
    "function updateQualityMetrics(uint256 batchId, uint256 temperature, uint256 humidity, uint256 shelfLife, uint256 testResults, uint256 nonce)",

    // Add certification
    "function addCertification(uint256 batchId, string certType, uint256 certNumber, uint256 expiryDate, uint256 nonce)",

    // Submit feedback
    "function submitFeedback(uint256 batchId, uint256 rating, uint256 nonce)",

    // View functions
    "function getComponentCount(uint256 batchId) view returns (uint256)",
    "function getCertificationCount(uint256 batchId) view returns (uint256)",
    "function getQualityUpdateTime(uint256 batchId) view returns (uint256)",
    "function verifyQualityData(uint256 batchId, uint256 temperature, uint256 humidity, uint256 shelfLife, uint256 nonce) view returns (bool, bool, bool)",

    // Events
    "event ComponentAdded(uint256 indexed batchId, uint256 componentId, address supplier)",
    "event QualityUpdated(uint256 indexed batchId, address updater)",
    "event CertificationAdded(uint256 indexed batchId, string certType, address certifier)",
    "event FeedbackSubmitted(uint256 indexed batchId, address submitter)"
];