#!/bin/bash

# Publish main package script
# Usage: ./scripts/publish-all.sh [--dry-run]

set -e

DRY_RUN=""
if [ "$1" == "--dry-run" ]; then
    DRY_RUN="--dry-run"
    echo "🔍 Running in dry-run mode..."
fi

echo "📤 Publishing HTML Layout Parser package..."
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

# Step 1: Ensure package is built
echo "📦 Step 1: Ensuring package is built..."
if [ ! -d "packages/html-layout-parser/dist" ]; then
    echo "⚠️  Package not built. Running build first..."
    ./scripts/build-all.sh
fi
echo "✅ Package ready"
echo ""

# Step 2: Run tests
echo "📦 Step 2: Running tests..."
if [ -d "tests" ]; then
    cd tests && pnpm test && cd ..
    echo "✅ Tests passed"
else
    echo "⚠️  No tests found, skipping"
fi
echo ""

# Step 3: Publish package
echo "📦 Step 3: Publishing package..."
cd "packages/html-layout-parser"
npm publish --access public $DRY_RUN
echo "✅ Package published"
cd ../..

echo ""
echo "🎉 Publish complete!"
echo ""
echo "Published package:"
echo "  - html-layout-parser@$(cd packages/html-layout-parser && node -p "require('./package.json').version")"
