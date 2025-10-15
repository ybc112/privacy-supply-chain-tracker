// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "fhevm/lib/TFHE.sol";
import "./PrivateSupplyChain.sol";

/**
 * @title ProductTraceability
 * @dev Extended contract for detailed product traceability with encrypted attributes
 */
contract ProductTraceability {
    using TFHE for euint32;
    using TFHE for euint64;
    using TFHE for euint16;
    using TFHE for ebool;

    PrivateSupplyChain public mainContract;

    // Product components tracking
    struct Component {
        uint256 componentId;
        uint256 parentBatchId;
        address supplier;
        euint32 encryptedComponentCode;  // Encrypted component identifier
        euint16 encryptedPercentage;      // Encrypted percentage in final product
        string publicDescription;
    }

    // Quality metrics with encryption
    struct QualityMetrics {
        euint32 encryptedTemperature;     // Storage temperature
        euint32 encryptedHumidity;        // Storage humidity
        euint32 encryptedShelfLife;       // Days remaining
        euint64 encryptedTestResults;     // Encoded test results
        uint256 lastUpdated;
    }

    // Certification records
    struct Certification {
        string certType;                  // ISO, Organic, Fair Trade, etc.
        address certifier;
        euint64 encryptedCertNumber;      // Encrypted certificate number
        euint64 encryptedExpiryDate;      // Encrypted expiry timestamp
        bool isActive;
    }

    // Recall management
    struct RecallRecord {
        uint256 batchId;
        euint32 encryptedReason;          // Encrypted recall reason code
        euint64 encryptedAffectedUnits;   // Number of units affected
        address initiator;
        uint256 timestamp;
        bool resolved;
    }

    // State mappings
    mapping(uint256 => Component[]) public batchComponents;
    mapping(uint256 => QualityMetrics) public qualityData;
    mapping(uint256 => Certification[]) public batchCertifications;
    mapping(uint256 => RecallRecord) public recalls;
    mapping(uint256 => mapping(address => euint32)) private encryptedFeedback;

    uint256 public nextComponentId = 1;
    uint256 public totalRecalls = 0;

    // Events
    event ComponentAdded(uint256 indexed batchId, uint256 componentId, address supplier);
    event QualityUpdated(uint256 indexed batchId, address updater);
    event CertificationAdded(uint256 indexed batchId, string certType, address certifier);
    event RecallInitiated(uint256 indexed batchId, address initiator);
    event FeedbackSubmitted(uint256 indexed batchId, address submitter);

    modifier onlyAuthorized(uint256 _batchId) {
        (, PrivateSupplyChain.ProductStatus status, , , ) = mainContract.getBatchInfo(_batchId);
        require(status != PrivateSupplyChain.ProductStatus.Recalled, "Batch recalled");
        _;
    }

    constructor(address _mainContract) {
        mainContract = PrivateSupplyChain(_mainContract);
    }

    /**
     * @dev Add component information to a product batch
     */
    function addComponent(
        uint256 _batchId,
        bytes calldata _encryptedComponentCode,
        bytes calldata _encryptedPercentage,
        string calldata _description
    ) external onlyAuthorized(_batchId) {
        uint256 componentId = nextComponentId++;

        Component memory component = Component({
            componentId: componentId,
            parentBatchId: _batchId,
            supplier: msg.sender,
            encryptedComponentCode: TFHE.asEuint32(_encryptedComponentCode),
            encryptedPercentage: TFHE.asEuint16(_encryptedPercentage),
            publicDescription: _description
        });

        batchComponents[_batchId].push(component);
        emit ComponentAdded(_batchId, componentId, msg.sender);
    }

    /**
     * @dev Update quality metrics for a batch
     */
    function updateQualityMetrics(
        uint256 _batchId,
        bytes calldata _encryptedTemperature,
        bytes calldata _encryptedHumidity,
        bytes calldata _encryptedShelfLife,
        bytes calldata _encryptedTestResults
    ) external onlyAuthorized(_batchId) {
        qualityData[_batchId] = QualityMetrics({
            encryptedTemperature: TFHE.asEuint32(_encryptedTemperature),
            encryptedHumidity: TFHE.asEuint32(_encryptedHumidity),
            encryptedShelfLife: TFHE.asEuint32(_encryptedShelfLife),
            encryptedTestResults: TFHE.asEuint64(_encryptedTestResults),
            lastUpdated: block.timestamp
        });

        emit QualityUpdated(_batchId, msg.sender);
    }

    /**
     * @dev Add certification to a batch
     */
    function addCertification(
        uint256 _batchId,
        string calldata _certType,
        bytes calldata _encryptedCertNumber,
        bytes calldata _encryptedExpiryDate
    ) external onlyAuthorized(_batchId) {
        Certification memory cert = Certification({
            certType: _certType,
            certifier: msg.sender,
            encryptedCertNumber: TFHE.asEuint64(_encryptedCertNumber),
            encryptedExpiryDate: TFHE.asEuint64(_encryptedExpiryDate),
            isActive: true
        });

        batchCertifications[_batchId].push(cert);
        emit CertificationAdded(_batchId, _certType, msg.sender);
    }

    /**
     * @dev Initiate a product recall
     */
    function initiateRecall(
        uint256 _batchId,
        bytes calldata _encryptedReason,
        bytes calldata _encryptedAffectedUnits
    ) external {
        require(recalls[_batchId].timestamp == 0, "Recall already exists");

        recalls[_batchId] = RecallRecord({
            batchId: _batchId,
            encryptedReason: TFHE.asEuint32(_encryptedReason),
            encryptedAffectedUnits: TFHE.asEuint64(_encryptedAffectedUnits),
            initiator: msg.sender,
            timestamp: block.timestamp,
            resolved: false
        });

        totalRecalls++;
        emit RecallInitiated(_batchId, msg.sender);
    }

    /**
     * @dev Submit encrypted feedback for a batch
     */
    function submitFeedback(
        uint256 _batchId,
        bytes calldata _encryptedRating
    ) external {
        encryptedFeedback[_batchId][msg.sender] = TFHE.asEuint32(_encryptedRating);
        emit FeedbackSubmitted(_batchId, msg.sender);
    }

    /**
     * @dev Check if batch meets quality threshold (encrypted comparison)
     */
    function meetsQualityThreshold(
        uint256 _batchId,
        bytes calldata _encryptedThreshold
    ) external view returns (ebool) {
        euint32 threshold = TFHE.asEuint32(_encryptedThreshold);
        return TFHE.ge(qualityData[_batchId].encryptedShelfLife, threshold);
    }

    /**
     * @dev Get re-encrypted quality metrics
     */
    function getQualityMetrics(
        uint256 _batchId,
        bytes32 publicKey,
        bytes calldata signature
    ) external view returns (
        bytes memory temperature,
        bytes memory humidity,
        bytes memory shelfLife
    ) {
        QualityMetrics memory metrics = qualityData[_batchId];
        return (
            TFHE.reencrypt(metrics.encryptedTemperature, publicKey, signature),
            TFHE.reencrypt(metrics.encryptedHumidity, publicKey, signature),
            TFHE.reencrypt(metrics.encryptedShelfLife, publicKey, signature)
        );
    }

    /**
     * @dev Calculate aggregated quality score (encrypted)
     */
    function calculateAggregatedScore(
        uint256 _batchId
    ) external view returns (euint32) {
        QualityMetrics memory metrics = qualityData[_batchId];

        // Weighted average: temp(30%) + humidity(30%) + shelfLife(40%)
        euint32 tempScore = TFHE.div(TFHE.mul(metrics.encryptedTemperature, TFHE.asEuint32(30)), TFHE.asEuint32(100));
        euint32 humidScore = TFHE.div(TFHE.mul(metrics.encryptedHumidity, TFHE.asEuint32(30)), TFHE.asEuint32(100));
        euint32 shelfScore = TFHE.div(TFHE.mul(metrics.encryptedShelfLife, TFHE.asEuint32(40)), TFHE.asEuint32(100));

        return TFHE.add(TFHE.add(tempScore, humidScore), shelfScore);
    }

    /**
     * @dev Get component count for a batch
     */
    function getComponentCount(uint256 _batchId) external view returns (uint256) {
        return batchComponents[_batchId].length;
    }

    /**
     * @dev Get certification count for a batch
     */
    function getCertificationCount(uint256 _batchId) external view returns (uint256) {
        return batchCertifications[_batchId].length;
    }

    /**
     * @dev Check if batch is recalled
     */
    function isRecalled(uint256 _batchId) external view returns (bool) {
        return recalls[_batchId].timestamp > 0 && !recalls[_batchId].resolved;
    }

    /**
     * @dev Resolve a recall
     */
    function resolveRecall(uint256 _batchId) external {
        require(recalls[_batchId].initiator == msg.sender, "Not recall initiator");
        require(!recalls[_batchId].resolved, "Already resolved");

        recalls[_batchId].resolved = true;
    }
}