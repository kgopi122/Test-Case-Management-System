#!/bin/bash

echo "=========================================="
echo "      TCM Project Setup (Mac/Linux)"
echo "=========================================="

# Check if Node is installed
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed! Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo ""
echo "Installing Frontend Dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install frontend dependencies."
    exit 1
fi

echo ""
echo "Installing Backend Dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install backend dependencies."
    exit 1
fi
cd ..

echo ""
echo "=========================================="
echo "      Setup Completed Successfully!"
echo "=========================================="
echo ""
echo "To start the application:"
echo "1. Frontend: npm run dev"
echo "2. Backend: cd backend && npm start"
echo ""
