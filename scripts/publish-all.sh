#!/bin/bash

# Publish all packages script
# Usage: ./scripts/publish-all.sh [--dry-run]

set -e

DRY_RUN=""
if [ "$1" == "--dry-run" ]; then
    DRY_RUN="--dry-run"
    echo "🔍 Running in dry-run mode..."
fi

echo "📤 Publishing HTML Layout Parser packages..."
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

# Step 1: Ensure packages are built
echo "📦 Step 1: Ensuring packages are built..."
if [ ! -d "packages/html-layout-parser/dist" ]; then
    echo "⚠️  Packages not built. Running build first..."
    ./scripts/build-all.sh
fi
echo "✅ Packages ready"
echo ""

# Step 2: Run tests
echo "📦 Step 2: Running tests..."
if [ -d "test" ]; then
    cd test && pnpm test && cd ..
    echo "✅ Tests passed"
else
    echo "⚠️  No tests found, skipping"
fi
echo ""

# Step 3: Publish packages
echo "📦 Step 3: Publishing packages..."

PACKAGES=(
    "html-layout-parser"
    "html-layout-parser-web"
    "html-layout-parser-worker"
    "html-layout-parser-node"
)

for pkg in "${PACKAGES[@]}"; do
    echo "  Publishing $pkg..."
    cd "packages/$pkg"
    pnpm publish --access public $DRY_RUN || echo "  ⚠️  Failed to publish $pkg"
    cd ../..
done

echo ""
echo "🎉 Publish complete!"
