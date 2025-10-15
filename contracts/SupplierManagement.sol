// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "fhevm/lib/TFHE.sol";
import "./PrivateSupplyChain.sol";

/**
 * @title SupplierManagement
 * @dev Contract for managing supplier relationships with privacy-preserving features
 */
contract SupplierManagement {
    using TFHE for euint32;
    using TFHE for euint64;
    using TFHE for euint16;
    using TFHE for ebool;

    PrivateSupplyChain public mainContract;

    // Supplier performance metrics
    struct PerformanceMetrics {
        euint32 encryptedDeliveryScore;    // On-time delivery score (0-100)
        euint32 encryptedQualityScore;     // Product quality score (0-100)
        euint32 encryptedComplianceScore;  // Compliance score (0-100)
        euint64 encryptedTotalVolume;      // Total volume supplied
        euint64 encryptedTotalValue;       // Total transaction value
        uint256 lastEvaluated;
    }

    // Transaction record between parties
    struct Transaction {
        uint256 transactionId;
        address buyer;
        address supplier;
        uint256 batchId;
        euint64 encryptedAmount;           // Transaction amount
        euint32 encryptedPaymentTerms;     // Payment terms in days
        euint64 encryptedTimestamp;        // Transaction timestamp
        bool completed;
    }

    // Supplier agreement
    struct Agreement {
        address supplier;
        address buyer;
        euint64 encryptedMinOrderQuantity; // Minimum order quantity
        euint64 encryptedMaxOrderQuantity; // Maximum order quantity
        euint32 encryptedPricePerUnit;     // Agreed price per unit
        euint32 encryptedDiscountRate;     // Volume discount rate
        uint256 validFrom;
        uint256 validUntil;
        bool isActive;
    }

    // Audit record
    struct AuditRecord {
        uint256 auditId;
        address auditor;
        address supplier;
        euint32 encryptedAuditScore;       // Audit score
        euint64 encryptedFindings;         // Encoded findings
        string publicSummary;
        uint256 timestamp;
    }

    // State mappings
    mapping(address => PerformanceMetrics) public supplierMetrics;
    mapping(uint256 => Transaction) public transactions;
    mapping(bytes32 => Agreement) public agreements; // hash(supplier, buyer) => Agreement
    mapping(address => AuditRecord[]) public supplierAudits;
    mapping(address => mapping(address => euint32)) private encryptedTrustScores;
    mapping(address => address[]) public supplierPartners;
    mapping(address => bool) public verifiedSuppliers;

    uint256 public nextTransactionId = 1;
    uint256 public nextAuditId = 1;

    // Events
    event SupplierRegistered(address indexed supplier);
    event TransactionCreated(uint256 indexed transactionId, address buyer, address supplier);
    event AgreementCreated(address indexed supplier, address indexed buyer);
    event AuditCompleted(uint256 indexed auditId, address supplier, address auditor);
    event MetricsUpdated(address indexed supplier);
    event TrustScoreUpdated(address indexed from, address indexed to);

    modifier onlyVerifiedSupplier() {
        require(verifiedSuppliers[msg.sender], "Not verified supplier");
        _;
    }

    constructor(address _mainContract) {
        mainContract = PrivateSupplyChain(_mainContract);
    }

    /**
     * @dev Register a new supplier
     */
    function registerSupplier(
        address _supplier,
        bytes calldata _encryptedDeliveryScore,
        bytes calldata _encryptedQualityScore,
        bytes calldata _encryptedComplianceScore
    ) external {
        require(!verifiedSuppliers[_supplier], "Already registered");

        supplierMetrics[_supplier] = PerformanceMetrics({
            encryptedDeliveryScore: TFHE.asEuint32(_encryptedDeliveryScore),
            encryptedQualityScore: TFHE.asEuint32(_encryptedQualityScore),
            encryptedComplianceScore: TFHE.asEuint32(_encryptedComplianceScore),
            encryptedTotalVolume: TFHE.asEuint64(0),
            encryptedTotalValue: TFHE.asEuint64(0),
            lastEvaluated: block.timestamp
        });

        verifiedSuppliers[_supplier] = true;
        emit SupplierRegistered(_supplier);
    }

    /**
     * @dev Create a transaction record
     */
    function createTransaction(
        address _supplier,
        uint256 _batchId,
        bytes calldata _encryptedAmount,
        bytes calldata _encryptedPaymentTerms,
        bytes calldata _encryptedTimestamp
    ) external returns (uint256) {
        require(verifiedSuppliers[_supplier], "Supplier not verified");

        uint256 transactionId = nextTransactionId++;

        transactions[transactionId] = Transaction({
            transactionId: transactionId,
            buyer: msg.sender,
            supplier: _supplier,
            batchId: _batchId,
            encryptedAmount: TFHE.asEuint64(_encryptedAmount),
            encryptedPaymentTerms: TFHE.asEuint32(_encryptedPaymentTerms),
            encryptedTimestamp: TFHE.asEuint64(_encryptedTimestamp),
            completed: false
        });

        // Update supplier metrics
        PerformanceMetrics storage metrics = supplierMetrics[_supplier];
        metrics.encryptedTotalValue = TFHE.add(
            metrics.encryptedTotalValue,
            TFHE.asEuint64(_encryptedAmount)
        );

        emit TransactionCreated(transactionId, msg.sender, _supplier);
        return transactionId;
    }

    /**
     * @dev Create supplier agreement
     */
    function createAgreement(
        address _supplier,
        bytes calldata _encryptedMinQuantity,
        bytes calldata _encryptedMaxQuantity,
        bytes calldata _encryptedPricePerUnit,
        bytes calldata _encryptedDiscountRate,
        uint256 _validDays
    ) external {
        require(verifiedSuppliers[_supplier], "Supplier not verified");

        bytes32 agreementKey = keccak256(abi.encodePacked(_supplier, msg.sender));

        agreements[agreementKey] = Agreement({
            supplier: _supplier,
            buyer: msg.sender,
            encryptedMinOrderQuantity: TFHE.asEuint64(_encryptedMinQuantity),
            encryptedMaxOrderQuantity: TFHE.asEuint64(_encryptedMaxQuantity),
            encryptedPricePerUnit: TFHE.asEuint32(_encryptedPricePerUnit),
            encryptedDiscountRate: TFHE.asEuint32(_encryptedDiscountRate),
            validFrom: block.timestamp,
            validUntil: block.timestamp + (_validDays * 1 days),
            isActive: true
        });

        // Add to partners list if not already added
        bool isPartner = false;
        for (uint i = 0; i < supplierPartners[_supplier].length; i++) {
            if (supplierPartners[_supplier][i] == msg.sender) {
                isPartner = true;
                break;
            }
        }
        if (!isPartner) {
            supplierPartners[_supplier].push(msg.sender);
        }

        emit AgreementCreated(_supplier, msg.sender);
    }

    /**
     * @dev Conduct supplier audit
     */
    function conductAudit(
        address _supplier,
        bytes calldata _encryptedAuditScore,
        bytes calldata _encryptedFindings,
        string calldata _publicSummary
    ) external {
        require(verifiedSuppliers[_supplier], "Supplier not verified");

        uint256 auditId = nextAuditId++;

        AuditRecord memory audit = AuditRecord({
            auditId: auditId,
            auditor: msg.sender,
            supplier: _supplier,
            encryptedAuditScore: TFHE.asEuint32(_encryptedAuditScore),
            encryptedFindings: TFHE.asEuint64(_encryptedFindings),
            publicSummary: _publicSummary,
            timestamp: block.timestamp
        });

        supplierAudits[_supplier].push(audit);

        // Update compliance score based on audit
        supplierMetrics[_supplier].encryptedComplianceScore = TFHE.asEuint32(_encryptedAuditScore);
        supplierMetrics[_supplier].lastEvaluated = block.timestamp;

        emit AuditCompleted(auditId, _supplier, msg.sender);
    }

    /**
     * @dev Update trust score between two parties
     */
    function updateTrustScore(
        address _partner,
        bytes calldata _encryptedScore
    ) external onlyVerifiedSupplier {
        encryptedTrustScores[msg.sender][_partner] = TFHE.asEuint32(_encryptedScore);
        emit TrustScoreUpdated(msg.sender, _partner);
    }

    /**
     * @dev Calculate supplier reputation (encrypted)
     */
    function calculateReputation(address _supplier) external view returns (euint32) {
        PerformanceMetrics memory metrics = supplierMetrics[_supplier];

        // Weighted average: delivery(30%) + quality(40%) + compliance(30%)
        euint32 deliveryWeight = TFHE.div(TFHE.mul(metrics.encryptedDeliveryScore, TFHE.asEuint32(30)), TFHE.asEuint32(100));
        euint32 qualityWeight = TFHE.div(TFHE.mul(metrics.encryptedQualityScore, TFHE.asEuint32(40)), TFHE.asEuint32(100));
        euint32 complianceWeight = TFHE.div(TFHE.mul(metrics.encryptedComplianceScore, TFHE.asEuint32(30)), TFHE.asEuint32(100));

        return TFHE.add(TFHE.add(deliveryWeight, qualityWeight), complianceWeight);
    }

    /**
     * @dev Check if order quantity meets agreement (encrypted comparison)
     */
    function validateOrderQuantity(
        address _supplier,
        bytes calldata _encryptedQuantity
    ) external view returns (ebool, ebool) {
        bytes32 agreementKey = keccak256(abi.encodePacked(_supplier, msg.sender));
        Agreement memory agreement = agreements[agreementKey];

        require(agreement.isActive && block.timestamp <= agreement.validUntil, "Invalid agreement");

        euint64 quantity = TFHE.asEuint64(_encryptedQuantity);

        // Check if quantity is within min and max limits
        ebool meetsMin = TFHE.ge(quantity, agreement.encryptedMinOrderQuantity);
        ebool meetsMax = TFHE.le(quantity, agreement.encryptedMaxOrderQuantity);

        return (meetsMin, meetsMax);
    }

    /**
     * @dev Calculate discounted price based on volume (encrypted)
     */
    function calculateDiscountedPrice(
        address _supplier,
        bytes calldata _encryptedQuantity
    ) external view returns (euint64) {
        bytes32 agreementKey = keccak256(abi.encodePacked(_supplier, msg.sender));
        Agreement memory agreement = agreements[agreementKey];

        euint64 quantity = TFHE.asEuint64(_encryptedQuantity);
        euint64 basePrice = TFHE.mul(quantity, TFHE.asEuint64(uint64(uint32(TFHE.asEuint32(agreement.encryptedPricePerUnit)))));

        // Apply discount
        euint64 discount = TFHE.div(
            TFHE.mul(basePrice, TFHE.asEuint64(uint64(uint32(TFHE.asEuint32(agreement.encryptedDiscountRate))))),
            TFHE.asEuint64(100)
        );

        return TFHE.sub(basePrice, discount);
    }

    /**
     * @dev Get re-encrypted supplier metrics
     */
    function getSupplierMetrics(
        address _supplier,
        bytes32 publicKey,
        bytes calldata signature
    ) external view returns (
        bytes memory deliveryScore,
        bytes memory qualityScore,
        bytes memory complianceScore
    ) {
        PerformanceMetrics memory metrics = supplierMetrics[_supplier];
        return (
            TFHE.reencrypt(metrics.encryptedDeliveryScore, publicKey, signature),
            TFHE.reencrypt(metrics.encryptedQualityScore, publicKey, signature),
            TFHE.reencrypt(metrics.encryptedComplianceScore, publicKey, signature)
        );
    }

    /**
     * @dev Complete a transaction
     */
    function completeTransaction(uint256 _transactionId) external {
        Transaction storage txn = transactions[_transactionId];
        require(txn.buyer == msg.sender || txn.supplier == msg.sender, "Not authorized");
        require(!txn.completed, "Already completed");

        txn.completed = true;

        // Update supplier volume metrics
        supplierMetrics[txn.supplier].encryptedTotalVolume = TFHE.add(
            supplierMetrics[txn.supplier].encryptedTotalVolume,
            TFHE.asEuint64(1)
        );
    }

    /**
     * @dev Get audit count for a supplier
     */
    function getAuditCount(address _supplier) external view returns (uint256) {
        return supplierAudits[_supplier].length;
    }

    /**
     * @dev Check if agreement is valid
     */
    function isAgreementValid(address _supplier, address _buyer) external view returns (bool) {
        bytes32 agreementKey = keccak256(abi.encodePacked(_supplier, _buyer));
        Agreement memory agreement = agreements[agreementKey];
        return agreement.isActive && block.timestamp <= agreement.validUntil;
    }
}