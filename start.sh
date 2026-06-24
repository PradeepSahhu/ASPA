#!/bin/bash
set -e

echo "Building and starting ASPA application..."

# Check if docker is available (for local deployment with docker-compose)
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "Docker found. Using docker-compose..."
    docker-compose up
else
    echo "Docker not found. Building services manually..."
    
    # Backend setup
    echo "Setting up Backend..."
    cd Backend
    npm install
    npm run prisma:generate
    
    # Start backend server
    echo "Starting Backend server..."
    PORT=3000 npm start
fi
