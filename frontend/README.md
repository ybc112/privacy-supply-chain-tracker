# Private Supply Chain Tracker - Frontend

## 🌐 Live Demo
The frontend application for interacting with the Private Supply Chain smart contracts deployed on Sepolia testnet.

## 📋 Contract Addresses
- **Main Contract**: `0x97FAb964a762feE3aF1bDddEF2138c8Ac5cb9238`
- **Traceability Contract**: `0x54BcFC4BdfDEb4376fa844dFFd1A784570F82C56`

## 🚀 Quick Start

### Option 1: Using Python HTTP Server
```bash
cd frontend
python3 -m http.server 8080
```
Then open http://localhost:8080 in your browser

### Option 2: Using Node.js HTTP Server
```bash
cd frontend
npx http-server -p 8080
```
Then open http://localhost:8080 in your browser

### Option 3: Using Live Server (VS Code)
If you have VS Code with Live Server extension:
1. Open the `frontend` folder in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## 🔧 Features

### For All Users
- **Track Product**: Track any product batch by entering its ID
- **View Checkpoints**: See the complete supply chain journey
- **View Batch Info**: See product details and status

### For Registered Participants
- **Create Product Batch**: Manufacturers can create new product batches
- **Add Checkpoints**: Add supply chain checkpoints for products
- **Verify Quality**: Inspectors can update quality scores

### For Admin
- **Register Participants**: Register new supply chain participants
- **Grant Access**: Grant access to specific batches
- **View Contract Info**: See contract addresses and admin details

## 📱 How to Use

1. **Connect Wallet**
   - Click "Connect Wallet" button
   - Approve MetaMask connection
   - Switch to Sepolia network if prompted

2. **Register as Participant** (Admin only)
   - Go to "Register Participant" tab
   - Enter participant address
   - Select role (Manufacturer, Supplier, etc.)
   - Set initial rating
   - Click "Register Participant"

3. **Create Product Batch** (Manufacturer only)
   - Go to "Create Batch" tab
   - Enter product details (quantity, quality, price)
   - Add product description
   - Click "Create Batch"
   - Note the Batch ID from the success message

4. **Track Product**
   - Go to "Track Product" tab
   - Enter Batch ID
   - Click "Track"
   - View complete batch information and supply chain history

5. **Add Checkpoint**
   - Go to "Add Checkpoint" tab
   - Enter Batch ID
   - Provide location and note
   - Select new status
   - Click "Add Checkpoint"

## 🔐 Privacy Features

The smart contracts use hashing to protect sensitive data:
- **Hashed Data**: Quantities, prices, quality scores, locations
- **Public Data**: Product descriptions, status updates, public notes
- **Access Control**: Only authorized participants can access batch data

## 🛠 Technical Stack
- **Smart Contracts**: Solidity 0.8.19
- **Blockchain**: Sepolia Testnet
- **Frontend**: Pure HTML/CSS/JavaScript
- **Web3 Library**: Ethers.js v5.7.2
- **Wallet**: MetaMask

## 📝 Network Configuration

Make sure MetaMask is configured for Sepolia:
- **Network Name**: Sepolia Test Network
- **RPC URL**: https://sepolia.infura.io/v3/YOUR-PROJECT-ID
- **Chain ID**: 11155111
- **Currency Symbol**: ETH
- **Block Explorer**: https://sepolia.etherscan.io

## 🎯 Test Scenarios

1. **Complete Supply Chain Flow**
   - Register participants (manufacturer, distributor, retailer, inspector)
   - Create a product batch
   - Add checkpoints as product moves
   - Verify quality at inspection
   - Track the complete journey

2. **Access Control Test**
   - Create a batch as manufacturer
   - Try accessing from different account
   - Grant access to specific participant
   - Verify access is working

## ⚠️ Important Notes
- This is deployed on Sepolia testnet
- You need Sepolia ETH to interact with contracts
- Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com)
- All sensitive data is hashed for privacy

## 🔗 Useful Links
- [Main Contract on Etherscan](https://sepolia.etherscan.io/address/0x97FAb964a762feE3aF1bDddEF2138c8Ac5cb9238)
- [Traceability Contract on Etherscan](https://sepolia.etherscan.io/address/0x54BcFC4BdfDEb4376fa844dFFd1A784570F82C56)
- [Sepolia Faucet](https://sepoliafaucet.com)
- [MetaMask Download](https://metamask.io)