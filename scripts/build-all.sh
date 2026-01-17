#!/bin/bash

# Build main package script
# Usage: ./scripts/build-all.sh

set -e

echo "🔨 Building HTML Layout Parser package..."
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

# Step 1: Build WASM
echo "📦 Step 1: Building WASM module..."
if [ -f "./build.sh" ]; then
    ./build.sh
    echo "✅ WASM build complete"
else
    echo "⚠️  build.sh not found, skipping WASM build"
fi
echo ""

# Step 2: Install dependencies
echo "📦 Step 2: Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"
echo ""

# Step 3: Build main package
echo "📦 Step 3: Building main package..."
cd packages/html-layout-parser
pnpm run build
echo "✅ Main package built"
echo ""

# Step 4: Run type checks
echo "📦 Step 4: Running type checks..."
pnpm run typecheck || echo "⚠️  Some type checks failed"
echo ""

echo "🎉 Build complete!"
echo ""
echo "Package built:"
echo "  - html-layout-parser (with web/, node/, worker/ bundles)"
