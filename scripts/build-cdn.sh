#!/bin/bash

# Build CDN distribution
echo "Building CDN distribution..."

# Create CDN directory
mkdir -p docs/public/cdn

# Copy built packages to CDN directory
cp -r packages/html-layout-parser/web docs/public/cdn/
cp -r packages/html-layout-parser/node docs/public/cdn/
cp -r packages/html-layout-parser/worker docs/public/cdn/

# Create version-specific directories
VERSION=$(node -p "require('./packages/html-layout-parser/package.json').version")
mkdir -p docs/public/cdn/v$VERSION

cp -r packages/html-layout-parser/web docs/public/cdn/v$VERSION/
cp -r packages/html-layout-parser/node docs/public/cdn/v$VERSION/
cp -r packages/html-layout-parser/worker docs/public/cdn/v$VERSION/

echo "CDN files built in docs/public/cdn/"
echo "Latest version: $VERSION"
echo ""
echo "Usage:"
echo "  https://Tajigaqzh.github.io/html-layout-parser/cdn/web/index.js"
echo "  https://Tajigaqzh.github.io/html-layout-parser/cdn/v$VERSION/web/index.js"