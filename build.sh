#!/bin/bash

# Navigate to the my-app directory
cd my-app

# Install dependencies
npm install

# Build the application
npm run build

# Copy the dist directory to the root for Vercel
mkdir -p ../dist
cp -r dist/* ../dist/

echo "Build completed and files copied to root dist directory" 