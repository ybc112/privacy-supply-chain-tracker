const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment to Sepolia testnet...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");

  // Check if we have enough balance for deployment
  const minBalance = ethers.utils.parseEther("0.1");
  if (balance.lt(minBalance)) {
    console.error("❌ Insufficient balance! You need at least 0.1 ETH for deployment.");
    console.log("Get Sepolia testnet ETH from: https://sepoliafaucet.com");
    process.exit(1);
  }

  // Deploy PrivateSupplyChain contract
  console.log("\n📦 Deploying PrivateSupplyChain contract...");
  const PrivateSupplyChain = await ethers.getContractFactory("contracts/sepolia/PrivateSupplyChain.sol:PrivateSupplyChain");
  const privateSupplyChain = await PrivateSupplyChain.deploy();
  await privateSupplyChain.deployed();
  console.log("✅ PrivateSupplyChain deployed to:", privateSupplyChain.address);

  // Wait for confirmation
  console.log("⏳ Waiting for confirmations...");
  await privateSupplyChain.deployTransaction.wait(5);

  // Deploy ProductTraceability contract
  console.log("\n📦 Deploying ProductTraceability contract...");
  const ProductTraceability = await ethers.getContractFactory("contracts/sepolia/ProductTraceability.sol:ProductTraceability");
  const productTraceability = await ProductTraceability.deploy(privateSupplyChain.address);
  await productTraceability.deployed();
  console.log("✅ ProductTraceability deployed to:", productTraceability.address);

  // Wait for confirmation
  await productTraceability.deployTransaction.wait(5);

  // Register initial participants for demo
  console.log("\n👥 Registering demo participants...");

  try {
    // Register manufacturer
    const tx1 = await privateSupplyChain.registerParticipant(
      deployer.address,
      1, // Role.Manufacturer
      90 // Rating
    );
    await tx1.wait();
    console.log("✅ Registered deployer as Manufacturer");

    // Create a demo batch
    console.log("\n📦 Creating demo product batch...");
    const tx2 = await privateSupplyChain.createProductBatch(
      1000,  // quantity
      95,    // quality score
      50,    // price per unit
      "Organic Coffee Beans - Premium Grade A",
      Date.now() // nonce
    );
    await tx2.wait();
    console.log("✅ Demo batch created");

  } catch (error) {
    console.log("⚠️ Could not create demo data:", error.message);
  }

  // Save deployment addresses
  const deploymentInfo = {
    network: "sepolia",
    chainId: 11155111,
    deployer: deployer.address,
    contracts: {
      PrivateSupplyChain: privateSupplyChain.address,
      ProductTraceability: productTraceability.address
    },
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    etherscanUrl: `https://sepolia.etherscan.io/address/${privateSupplyChain.address}`
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

  // Verify on Etherscan if API key is available
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\n🔍 Verifying contracts on Etherscan...");

    try {
      await hre.run("verify:verify", {
        address: privateSupplyChain.address,
        constructorArguments: [],
      });
      console.log("✅ PrivateSupplyChain verified");

      await hre.run("verify:verify", {
        address: productTraceability.address,
        constructorArguments: [privateSupplyChain.address],
      });
      console.log("✅ ProductTraceability verified");
    } catch (error) {
      console.log("⚠️ Verification failed:", error.message);
      console.log("You can verify manually at: https://sepolia.etherscan.io");
    }
  }

  console.log("\n✨ Deployment completed successfully!");
  console.log("\n🌐 View on Etherscan:");
  console.log(`   ${deploymentInfo.etherscanUrl}`);
  console.log("\n📝 Next steps:");
  console.log("   1. Update .env file with deployed contract addresses");
  console.log("   2. Run the frontend with: npm run dev");
  console.log("   3. Connect MetaMask to Sepolia network");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });