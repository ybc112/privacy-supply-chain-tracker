// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./PrivateSupplyChain.sol";

/**
 * @title ProductTraceability (Sepolia Version)
 * @dev Extended contract for detailed product traceability with hashed attributes
 */
contract ProductTraceability {
    PrivateSupplyChain public mainContract;

    // Product components tracking
    struct Component {
        uint256 componentId;
        uint256 parentBatchId;
        address supplier;
        bytes32 hashedComponentCode;  // Hashed component identifier
        bytes32 hashedPercentage;     // Hashed percentage in final product
        string publicDescription;
    }

    // Quality metrics with hashing
    struct QualityMetrics {
        bytes32 hashedTemperature;    // Storage temperature
        bytes32 hashedHumidity;       // Storage humidity
        bytes32 hashedShelfLife;      // Days remaining
        bytes32 hashedTestResults;    // Encoded test results
        uint256 lastUpdated;
    }

    // Certification records
    struct Certification {
        string certType;               // ISO, Organic, Fair Trade, etc.
        address certifier;
        bytes32 hashedCertNumber;     // Hashed certificate number
        bytes32 hashedExpiryDate;     // Hashed expiry timestamp
        bool isActive;
    }

    // State mappings
    mapping(uint256 => Component[]) public batchComponents;
    mapping(uint256 => QualityMetrics) public qualityData;
    mapping(uint256 => Certification[]) public batchCertifications;
    mapping(uint256 => mapping(address => bytes32)) private feedbackHashes;

    uint256 public nextComponentId = 1;

    // Events
    event ComponentAdded(uint256 indexed batchId, uint256 componentId, address supplier);
    event QualityUpdated(uint256 indexed batchId, address updater);
    event CertificationAdded(uint256 indexed batchId, string certType, address certifier);
    event FeedbackSubmitted(uint256 indexed batchId, address submitter);

    constructor(address _mainContract) {
        mainContract = PrivateSupplyChain(_mainContract);
    }

    /**
     * @dev Add component information to a product batch
     */
    function addComponent(
        uint256 _batchId,
        uint256 _componentCode,
        uint256 _percentage,
        string calldata _description,
        uint256 _nonce
    ) external {
        uint256 componentId = nextComponentId++;

        Component memory component = Component({
            componentId: componentId,
            parentBatchId: _batchId,
            supplier: msg.sender,
            hashedComponentCode: keccak256(abi.encodePacked(_componentCode, _nonce, msg.sender)),
            hashedPercentage: keccak256(abi.encodePacked(_percentage, _nonce, msg.sender)),
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
        uint256 _temperature,
        uint256 _humidity,
        uint256 _shelfLife,
        uint256 _testResults,
        uint256 _nonce
    ) external {
        qualityData[_batchId] = QualityMetrics({
            hashedTemperature: keccak256(abi.encodePacked(_temperature, _nonce, msg.sender)),
            hashedHumidity: keccak256(abi.encodePacked(_humidity, _nonce, msg.sender)),
            hashedShelfLife: keccak256(abi.encodePacked(_shelfLife, _nonce, msg.sender)),
            hashedTestResults: keccak256(abi.encodePacked(_testResults, _nonce, msg.sender)),
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
        uint256 _certNumber,
        uint256 _expiryDate,
        uint256 _nonce
    ) external {
        Certification memory cert = Certification({
            certType: _certType,
            certifier: msg.sender,
            hashedCertNumber: keccak256(abi.encodePacked(_certNumber, _nonce, msg.sender)),
            hashedExpiryDate: keccak256(abi.encodePacked(_expiryDate, _nonce, msg.sender)),
            isActive: true
        });

        batchCertifications[_batchId].push(cert);
        emit CertificationAdded(_batchId, _certType, msg.sender);
    }

    /**
     * @dev Submit hashed feedback for a batch
     */
    function submitFeedback(
        uint256 _batchId,
        uint256 _rating,
        uint256 _nonce
    ) external {
        feedbackHashes[_batchId][msg.sender] = keccak256(
            abi.encodePacked(_rating, _nonce, msg.sender)
        );
        emit FeedbackSubmitted(_batchId, msg.sender);
    }

    /**
     * @dev Verify quality data integrity
     */
    function verifyQualityData(
        uint256 _batchId,
        uint256 _temperature,
        uint256 _humidity,
        uint256 _shelfLife,
        uint256 _nonce
    ) external view returns (bool, bool, bool) {
        QualityMetrics memory metrics = qualityData[_batchId];

        bool tempValid = keccak256(abi.encodePacked(_temperature, _nonce, msg.sender)) == metrics.hashedTemperature;
        bool humidValid = keccak256(abi.encodePacked(_humidity, _nonce, msg.sender)) == metrics.hashedHumidity;
        bool shelfValid = keccak256(abi.encodePacked(_shelfLife, _nonce, msg.sender)) == metrics.hashedShelfLife;

        return (tempValid, humidValid, shelfValid);
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
     * @dev Get quality metrics timestamps
     */
    function getQualityUpdateTime(uint256 _batchId) external view returns (uint256) {
        return qualityData[_batchId].lastUpdated;
    }
}