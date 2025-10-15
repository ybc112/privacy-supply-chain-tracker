#!/bin/bash

echo "================================================"
echo "    🌐 Private Supply Chain Tracker Frontend"
echo "================================================"
echo ""
echo "Contract Addresses:"
echo "Main: 0x97FAb964a762feE3aF1bDddEF2138c8Ac5cb9238"
echo "Traceability: 0x54BcFC4BdfDEb4376fa844dFFd1A784570F82C56"
echo ""
echo "Starting local server..."
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "Using Python HTTP server on port 8080..."
    echo ""
    echo "📱 Open in browser: http://localhost:8080"
    echo "Press Ctrl+C to stop the server"
    echo ""
    cd frontend
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "Using Python HTTP server on port 8080..."
    echo ""
    echo "📱 Open in browser: http://localhost:8080"
    echo "Press Ctrl+C to stop the server"
    echo ""
    cd frontend
    python -m SimpleHTTPServer 8080
elif command -v npx &> /dev/null; then
    echo "Using Node.js HTTP server on port 8080..."
    echo ""
    echo "📱 Open in browser: http://localhost:8080"
    echo "Press Ctrl+C to stop the server"
    echo ""
    cd frontend
    npx http-server -p 8080
else
    echo "❌ No suitable HTTP server found!"
    echo ""
    echo "Please install Python or Node.js, or open index.html directly in your browser:"
    echo "file://$(pwd)/frontend/index.html"
fi