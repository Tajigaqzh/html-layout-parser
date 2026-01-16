#!/bin/bash

# Build all packages script
# Usage: ./scripts/build-all.sh

set -e

echo "🔨 Building HTML Layout Parser packages..."
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

# Step 3: Build all packages
echo "📦 Step 3: Building all packages..."
pnpm -r run build
echo "✅ All packages built"
echo ""

# Step 4: Run type checks
echo "📦 Step 4: Running type checks..."
pnpm -r run typecheck || echo "⚠️  Some type checks failed"
echo ""

echo "🎉 Build complete!"
echo ""
echo "Packages built:"
echo "  - html-layout-parser (unified package)"
echo "  - html-layout-parser-web"
echo "  - html-layout-parser-worker"
echo "  - html-layout-parser-node"
