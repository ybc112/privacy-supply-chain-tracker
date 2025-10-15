const { ethers } = require("hardhat");
const { createInstances, generateKeys } = require("fhevmjs");

async function main() {
  console.log("🚀 Starting deployment of Privacy-Preserving Supply Chain Tracker...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance));

  // Deploy PrivateSupplyChain contract
  console.log("\n📦 Deploying PrivateSupplyChain contract...");
  const PrivateSupplyChain = await ethers.getContractFactory("PrivateSupplyChain");
  const privateSupplyChain = await PrivateSupplyChain.deploy();
  await privateSupplyChain.deployed();
  console.log("✅ PrivateSupplyChain deployed to:", privateSupplyChain.address);

  // Deploy ProductTraceability contract
  console.log("\n📦 Deploying ProductTraceability contract...");
  const ProductTraceability = await ethers.getContractFactory("ProductTraceability");
  const productTraceability = await ProductTraceability.deploy(privateSupplyChain.address);
  await productTraceability.deployed();
  console.log("✅ ProductTraceability deployed to:", productTraceability.address);

  // Deploy SupplierManagement contract
  console.log("\n📦 Deploying SupplierManagement contract...");
  const SupplierManagement = await ethers.getContractFactory("SupplierManagement");
  const supplierManagement = await SupplierManagement.deploy(privateSupplyChain.address);
  await supplierManagement.deployed();
  console.log("✅ SupplierManagement deployed to:", supplierManagement.address);

  // Initialize FHE instance for testing
  console.log("\n🔐 Initializing FHE instance...");
  const fhevmInstance = await createInstances(privateSupplyChain.address, ethers.provider);

  // Register initial participants (for demo purposes)
  console.log("\n👥 Registering initial participants...");

  const participants = [
    { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", role: 1, rating: 90 }, // Manufacturer
    { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", role: 2, rating: 85 }, // Supplier
    { address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", role: 3, rating: 88 }, // Distributor
  ];

  for (const participant of participants) {
    try {
      const encryptedRating = await fhevmInstance.encrypt32(participant.rating);
      await privateSupplyChain.registerParticipant(
        participant.address,
        participant.role,
        encryptedRating
      );
      console.log(`✅ Registered participant ${participant.address} with role ${participant.role}`);
    } catch (error) {
      console.log(`⚠️ Could not register ${participant.address}: ${error.message}`);
    }
  }

  // Save deployment addresses
  const deploymentInfo = {
    network: network.name,
    deployer: deployer.address,
    contracts: {
      PrivateSupplyChain: privateSupplyChain.address,
      ProductTraceability: productTraceability.address,
      SupplierManagement: supplierManagement.address
    },
    deployedAt: new Date().toISOString()
  };

  console.log("\n📋 Deployment Summary:");
  console.log("=======================");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Write deployment info to file
  const fs = require("fs");
  fs.writeFileSync(
    "./deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to deployment.json");

  console.log("\n✨ Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });