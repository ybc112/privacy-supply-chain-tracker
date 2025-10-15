const { expect } = require("chai");
const { ethers } = require("hardhat");
const { createInstances, encrypt32, encrypt64, decrypt32, decrypt64 } = require("fhevmjs");

describe("Private Supply Chain System", function () {
  let privateSupplyChain;
  let productTraceability;
  let supplierManagement;
  let owner, manufacturer, supplier, distributor, retailer, inspector;
  let fhevmInstance;

  beforeEach(async function () {
    // Get signers
    [owner, manufacturer, supplier, distributor, retailer, inspector] = await ethers.getSigners();

    // Deploy main contract
    const PrivateSupplyChain = await ethers.getContractFactory("PrivateSupplyChain");
    privateSupplyChain = await PrivateSupplyChain.deploy();
    await privateSupplyChain.deployed();

    // Deploy ProductTraceability
    const ProductTraceability = await ethers.getContractFactory("ProductTraceability");
    productTraceability = await ProductTraceability.deploy(privateSupplyChain.address);
    await productTraceability.deployed();

    // Deploy SupplierManagement
    const SupplierManagement = await ethers.getContractFactory("SupplierManagement");
    supplierManagement = await SupplierManagement.deploy(privateSupplyChain.address);
    await supplierManagement.deployed();

    // Initialize FHEVM instance
    fhevmInstance = await createInstances(privateSupplyChain.address, ethers.provider);
  });

  describe("Participant Registration", function () {
    it("Should register participants with encrypted ratings", async function () {
      // Encrypt rating value (e.g., 85/100)
      const encryptedRating = await encrypt32(fhevmInstance, 85);

      // Register manufacturer
      await privateSupplyChain.connect(owner).registerParticipant(
        manufacturer.address,
        1, // Role.Manufacturer
        encryptedRating
      );

      // Verify registration
      const participant = await privateSupplyChain.participants(manufacturer.address);
      expect(participant.isActive).to.be.true;
      expect(participant.role).to.equal(1);
    });

    it("Should prevent duplicate registration", async function () {
      const encryptedRating = await encrypt32(fhevmInstance, 85);

      await privateSupplyChain.connect(owner).registerParticipant(
        manufacturer.address,
        1,
        encryptedRating
      );

      await expect(
        privateSupplyChain.connect(owner).registerParticipant(
          manufacturer.address,
          1,
          encryptedRating
        )
      ).to.be.revertedWith("Already registered");
    });
  });

  describe("Product Batch Creation", function () {
    beforeEach(async function () {
      // Register manufacturer first
      const encryptedRating = await encrypt32(fhevmInstance, 85);
      await privateSupplyChain.connect(owner).registerParticipant(
        manufacturer.address,
        1,
        encryptedRating
      );
    });

    it("Should create product batch with encrypted data", async function () {
      // Encrypt product data
      const encryptedQuantity = await encrypt64(fhevmInstance, 1000);
      const encryptedQuality = await encrypt32(fhevmInstance, 95);
      const encryptedPrice = await encrypt64(fhevmInstance, 5000);

      // Create batch
      const tx = await privateSupplyChain.connect(manufacturer).createProductBatch(
        encryptedQuantity,
        encryptedQuality,
        encryptedPrice,
        "Organic Coffee Beans - Grade A"
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "ProductBatchCreated");

      expect(event.args.batchId).to.equal(1);
      expect(event.args.manufacturer).to.equal(manufacturer.address);

      // Verify batch info
      const batchInfo = await privateSupplyChain.getBatchInfo(1);
      expect(batchInfo.manufacturer).to.equal(manufacturer.address);
      expect(batchInfo.publicMetadata).to.equal("Organic Coffee Beans - Grade A");
    });
  });

  describe("Supply Chain Checkpoints", function () {
    let batchId;

    beforeEach(async function () {
      // Setup: Register participants and create batch
      const encryptedRating = await encrypt32(fhevmInstance, 85);
      await privateSupplyChain.connect(owner).registerParticipant(
        manufacturer.address,
        1,
        encryptedRating
      );
      await privateSupplyChain.connect(owner).registerParticipant(
        distributor.address,
        3,
        encryptedRating
      );

      const encryptedQuantity = await encrypt64(fhevmInstance, 1000);
      const encryptedQuality = await encrypt32(fhevmInstance, 95);
      const encryptedPrice = await encrypt64(fhevmInstance, 5000);

      const tx = await privateSupplyChain.connect(manufacturer).createProductBatch(
        encryptedQuantity,
        encryptedQuality,
        encryptedPrice,
        "Test Product"
      );

      const receipt = await tx.wait();
      batchId = receipt.events.find(e => e.event === "ProductBatchCreated").args.batchId;
    });

    it("Should add checkpoint with encrypted location", async function () {
      const encryptedTimestamp = await encrypt64(fhevmInstance, Date.now());
      const encryptedLocation = await encrypt32(fhevmInstance, 12345); // Location hash

      await privateSupplyChain.connect(distributor).addCheckpoint(
        batchId,
        encryptedTimestamp,
        encryptedLocation,
        "Product received at distribution center",
        2 // ProductStatus.InTransit
      );

      const batchInfo = await privateSupplyChain.getBatchInfo(batchId);
      expect(batchInfo.checkpointCount).to.equal(1);
    });
  });

  describe("Access Control", function () {
    let batchId;

    beforeEach(async function () {
      // Setup
      const encryptedRating = await encrypt32(fhevmInstance, 85);
      await privateSupplyChain.connect(owner).registerParticipant(
        manufacturer.address,
        1,
        encryptedRating
      );
      await privateSupplyChain.connect(owner).registerParticipant(
        retailer.address,
        4,
        encryptedRating
      );

      const encryptedQuantity = await encrypt64(fhevmInstance, 1000);
      const encryptedQuality = await encrypt32(fhevmInstance, 95);
      const encryptedPrice = await encrypt64(fhevmInstance, 5000);

      const tx = await privateSupplyChain.connect(manufacturer).createProductBatch(
        encryptedQuantity,
        encryptedQuality,
        encryptedPrice,
        "Test Product"
      );

      const receipt = await tx.wait();
      batchId = receipt.events.find(e => e.event === "ProductBatchCreated").args.batchId;
    });

    it("Should grant and verify access permissions", async function () {
      // Grant access to retailer
      await privateSupplyChain.connect(manufacturer).grantAccess(
        retailer.address,
        batchId
      );

      // Retailer should now be able to access encrypted data
      // Note: In actual implementation, this would require proper FHE key management
      const { publicKey, signature } = await fhevmInstance.generatePublicKey({
        verifyingContract: privateSupplyChain.address
      });

      // This would return re-encrypted data that retailer can decrypt
      await expect(
        privateSupplyChain.connect(retailer).getProductQuantity(
          batchId,
          publicKey,
          signature
        )
      ).to.not.be.reverted;
    });
  });

  describe("Product Traceability", function () {
    let batchId;

    beforeEach(async function () {
      // Setup
      const encryptedRating = await encrypt32(fhevmInstance, 85);
      await privateSupplyChain.connect(owner).registerParticipant(
        manufacturer.address,
        1,
        encryptedRating
      );

      const encryptedQuantity = await encrypt64(fhevmInstance, 1000);
      const encryptedQuality = await encrypt32(fhevmInstance, 95);
      const encryptedPrice = await encrypt64(fhevmInstance, 5000);

      const tx = await privateSupplyChain.connect(manufacturer).createProductBatch(
        encryptedQuantity,
        encryptedQuality,
        encryptedPrice,
        "Test Product"
      );

      const receipt = await tx.wait();
      batchId = receipt.events.find(e => e.event === "ProductBatchCreated").args.batchId;
    });

    it("Should add product components", async function () {
      const encryptedComponentCode = await encrypt32(fhevmInstance, 98765);
      const encryptedPercentage = await encrypt16(fhevmInstance, 75);

      await productTraceability.connect(manufacturer).addComponent(
        batchId,
        encryptedComponentCode,
        encryptedPercentage,
        "Premium Raw Material"
      );

      const componentCount = await productTraceability.getComponentCount(batchId);
      expect(componentCount).to.equal(1);
    });

    it("Should update quality metrics", async function () {
      const encryptedTemp = await encrypt32(fhevmInstance, 22); // 22°C
      const encryptedHumidity = await encrypt32(fhevmInstance, 45); // 45%
      const encryptedShelfLife = await encrypt32(fhevmInstance, 365); // 365 days
      const encryptedTestResults = await encrypt64(fhevmInstance, 999);

      await productTraceability.connect(manufacturer).updateQualityMetrics(
        batchId,
        encryptedTemp,
        encryptedHumidity,
        encryptedShelfLife,
        encryptedTestResults
      );

      // Quality data has been updated
      const qualityData = await productTraceability.qualityData(batchId);
      expect(qualityData.lastUpdated).to.be.gt(0);
    });
  });

  describe("Supplier Management", function () {
    it("Should register and verify suppliers", async function () {
      const encryptedDelivery = await encrypt32(fhevmInstance, 90);
      const encryptedQuality = await encrypt32(fhevmInstance, 88);
      const encryptedCompliance = await encrypt32(fhevmInstance, 92);

      await supplierManagement.registerSupplier(
        supplier.address,
        encryptedDelivery,
        encryptedQuality,
        encryptedCompliance
      );

      expect(await supplierManagement.verifiedSuppliers(supplier.address)).to.be.true;
    });

    it("Should create supplier agreements", async function () {
      // Register supplier first
      const encryptedDelivery = await encrypt32(fhevmInstance, 90);
      const encryptedQuality = await encrypt32(fhevmInstance, 88);
      const encryptedCompliance = await encrypt32(fhevmInstance, 92);

      await supplierManagement.registerSupplier(
        supplier.address,
        encryptedDelivery,
        encryptedQuality,
        encryptedCompliance
      );

      // Create agreement
      const encryptedMinQty = await encrypt64(fhevmInstance, 100);
      const encryptedMaxQty = await encrypt64(fhevmInstance, 10000);
      const encryptedPrice = await encrypt32(fhevmInstance, 50);
      const encryptedDiscount = await encrypt32(fhevmInstance, 5);

      await supplierManagement.connect(manufacturer).createAgreement(
        supplier.address,
        encryptedMinQty,
        encryptedMaxQty,
        encryptedPrice,
        encryptedDiscount,
        30 // Valid for 30 days
      );

      const isValid = await supplierManagement.isAgreementValid(
        supplier.address,
        manufacturer.address
      );
      expect(isValid).to.be.true;
    });
  });

  describe("Quality Verification", function () {
    let batchId;

    beforeEach(async function () {
      // Setup: Register inspector and manufacturer, create batch
      const encryptedRating = await encrypt32(fhevmInstance, 90);

      await privateSupplyChain.connect(owner).registerParticipant(
        manufacturer.address,
        1,
        encryptedRating
      );

      await privateSupplyChain.connect(owner).registerParticipant(
        inspector.address,
        5, // Role.Inspector
        encryptedRating
      );

      const encryptedQuantity = await encrypt64(fhevmInstance, 1000);
      const encryptedQuality = await encrypt32(fhevmInstance, 80);
      const encryptedPrice = await encrypt64(fhevmInstance, 5000);

      const tx = await privateSupplyChain.connect(manufacturer).createProductBatch(
        encryptedQuantity,
        encryptedQuality,
        encryptedPrice,
        "Test Product for Inspection"
      );

      const receipt = await tx.wait();
      batchId = receipt.events.find(e => e.event === "ProductBatchCreated").args.batchId;
    });

    it("Should allow inspector to verify quality", async function () {
      const newQualityScore = await encrypt32(fhevmInstance, 92);

      await privateSupplyChain.connect(inspector).verifyQuality(
        batchId,
        newQualityScore
      );

      const batchInfo = await privateSupplyChain.getBatchInfo(batchId);
      expect(batchInfo.status).to.equal(3); // ProductStatus.Verified
    });
  });
});