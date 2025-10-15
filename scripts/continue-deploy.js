const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Continuing deployment to Sepolia testnet...");

  // 已部署的主合约地址
  const privateSupplyChainAddress = "0x97FAb964a762feE3aF1bDddEF2138c8Ac5cb9238";
  console.log("✅ Using existing PrivateSupplyChain at:", privateSupplyChainAddress);

  const [deployer] = await ethers.getSigners();
  console.log("Deployer account:", deployer.address);

  // Deploy ProductTraceability contract
  console.log("\n📦 Deploying ProductTraceability contract...");
  const ProductTraceability = await ethers.getContractFactory("contracts/sepolia/ProductTraceability.sol:ProductTraceability");
  const productTraceability = await ProductTraceability.deploy(privateSupplyChainAddress);
  await productTraceability.deployed();
  console.log("✅ ProductTraceability deployed to:", productTraceability.address);

  // Save deployment addresses
  const deploymentInfo = {
    network: "sepolia",
    chainId: 11155111,
    deployer: deployer.address,
    contracts: {
      PrivateSupplyChain: privateSupplyChainAddress,
      ProductTraceability: productTraceability.address
    },
    deployedAt: new Date().toISOString(),
    etherscanUrl: `https://sepolia.etherscan.io/address/${privateSupplyChainAddress}`
  };

  console.log("\n📋 Deployment Summary:");
  console.log("=======================");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Write deployment info to file
  const fs = require("fs");
  fs.writeFileSync(
    "./sepolia-deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n💾 Deployment info saved to sepolia-deployment.json");

  console.log("\n✨ Deployment completed successfully!");
  console.log("\n🌐 View on Etherscan:");
  console.log(`   Main Contract: https://sepolia.etherscan.io/address/${privateSupplyChainAddress}`);
  console.log(`   Traceability:  https://sepolia.etherscan.io/address/${productTraceability.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });