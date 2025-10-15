#!/bin/bash

echo "🚀 Starting dependency installation..."

# Clean install with legacy peer deps to avoid conflicts
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "1. Generate a new private key:"
echo "   node -e \"console.log('0x' + require('crypto').randomBytes(32).toString('hex'))\""
echo ""
echo "2. Update .env file with your new private key"
echo ""
echo "3. Compile contracts:"
echo "   npx hardhat compile"
echo ""
echo "4. Deploy to Sepolia:"
echo "   npm run deploy:sepolia"