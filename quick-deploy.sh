#!/bin/bash

echo "================================================"
echo "    🚀 Sepolia Testnet Quick Deploy Script"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create .env file with:"
    echo "  cp .env.example .env"
    echo "  Then add your private key"
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Installation failed!${NC}"
        exit 1
    fi
fi

# Compile contracts
echo -e "${YELLOW}🔨 Compiling contracts...${NC}"
npx hardhat compile

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Compilation failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contracts compiled successfully!${NC}"
echo ""

# Deploy to Sepolia
echo -e "${YELLOW}🚀 Deploying to Sepolia...${NC}"
npx hardhat run scripts/deploy-sepolia.js --network sepolia

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo "Please check:"
    echo "  1. Your private key is correct in .env"
    echo "  2. You have enough Sepolia ETH (min 0.1 ETH)"
    echo "  3. Your RPC URL is working"
    exit 1
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}    ✨ Deployment Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Check sepolia-deployment.json for contract addresses"