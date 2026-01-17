#!/bin/bash

# HTML Layout Parser - First Release Publishing Script
# This script builds and publishes all packages to NPM for the first time

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

print_status "🚀 HTML Layout Parser - First Release (v0.0.1)"
print_status "Working directory: $ROOT_DIR"

# Check if user is logged in to npm
if ! npm whoami >/dev/null 2>&1; then
    print_error "You are not logged in to npm. Please run 'npm login' first."
    exit 1
fi

NPM_USER=$(npm whoami)
print_success "Logged in to NPM as: $NPM_USER"

# Parse command line arguments
DRY_RUN=false

if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    print_warning "DRY RUN MODE - No packages will be actually published"
fi

# Display current package versions
print_status "Package versions to be published:"
PACKAGES=("html-layout-parser" "html-layout-parser-web" "html-layout-parser-node" "html-layout-parser-worker")

for pkg in "${PACKAGES[@]}"; do
    version=$(jq -r '.version' "packages/$pkg/package.json")
    echo "  📦 $pkg@$version"
done

# Clean and build
print_status "🧹 Cleaning previous builds..."
pnpm run clean

print_status "🔨 Building WASM module..."
pnpm run build:wasm

print_status "📦 Building all packages..."
pnpm run build:packages

# Verify build outputs
print_status "✅ Verifying build outputs..."
for pkg in "${PACKAGES[@]}"; do
    dist_dir="packages/$pkg/dist"
    if [[ ! -d "$dist_dir" ]]; then
        print_error "Build output missing for $pkg: $dist_dir"
        exit 1
    fi
    
    # Check for essential files
    essential_files=("index.js" "index.d.ts" "html_layout_parser.wasm")
    for file in "${essential_files[@]}"; do
        if [[ ! -f "$dist_dir/$file" ]]; then
            print_error "Essential file missing for $pkg: $file"
            exit 1
        fi
    done
    
    print_success "Build verification passed for $pkg"
done

# Check if packages already exist on NPM
print_status "🔍 Checking if packages already exist on NPM..."
for pkg in "${PACKAGES[@]}"; do
    if npm view "$pkg" version >/dev/null 2>&1; then
        print_warning "Package $pkg already exists on NPM"
        existing_version=$(npm view "$pkg" version)
        current_version=$(jq -r '.version' "packages/$pkg/package.json")
        echo "  Existing: $existing_version, Current: $current_version"
    else
        print_success "Package $pkg is new (ready for first publish)"
    fi
done

# Publish packages
if [[ "$DRY_RUN" == true ]]; then
    print_status "🧪 Running publish dry run..."
    pnpm -r publish --access public --dry-run
    print_success "Dry run completed successfully"
else
    print_status "📤 Publishing packages to NPM..."
    
    # Confirm before publishing
    echo ""
    print_warning "🚨 FIRST RELEASE - You are about to publish these packages to NPM:"
    for pkg in "${PACKAGES[@]}"; do
        version=$(jq -r '.version' "packages/$pkg/package.json")
        echo "  📦 $pkg@$version"
    done
    echo ""
    
    read -p "Are you sure you want to continue with the first release? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Publish cancelled by user"
        exit 0
    fi
    
    # Publish each package individually for better error handling
    for pkg in "${PACKAGES[@]}"; do
        print_status "📤 Publishing $pkg..."
        
        cd "packages/$pkg"
        
        if npm publish --access public; then
            print_success "Successfully published $pkg ✅"
        else
            print_error "Failed to publish $pkg ❌"
            cd "$ROOT_DIR"
            exit 1
        fi
        
        cd "$ROOT_DIR"
        
        # Small delay between publishes
        sleep 2
    done
    
    print_success "🎉 All packages published successfully!"
fi

# Generate publish summary
echo ""
echo "===================="
print_status "📋 PUBLISH SUMMARY"
echo "===================="

for pkg in "${PACKAGES[@]}"; do
    version=$(jq -r '.version' "packages/$pkg/package.json")
    if [[ "$DRY_RUN" == true ]]; then
        echo "  📦 $pkg@$version (DRY RUN)"
    else
        echo "  ✅ $pkg@$version"
    fi
done

echo ""
if [[ "$DRY_RUN" != true ]]; then
    print_success "🎉 FIRST RELEASE COMPLETED!"
    echo ""
    print_status "📚 Next steps:"
    echo "  1. 🏷️  Create a git tag: git tag v0.0.1 && git push origin v0.0.1"
    echo "  2. 📝 Update the changelog"
    echo "  3. 🚀 Create a GitHub release"
    echo "  4. 📢 Announce the release"
    echo ""
    print_status "📦 Installation commands for users:"
    echo "  # Main package (auto-detects environment)"
    echo "  npm install html-layout-parser"
    echo ""
    echo "  # Environment-specific packages"
    echo "  npm install html-layout-parser-web      # For browsers"
    echo "  npm install html-layout-parser-node     # For Node.js"  
    echo "  npm install html-layout-parser-worker   # For Web Workers"
    echo ""
    print_status "🔗 Package URLs:"
    for pkg in "${PACKAGES[@]}"; do
        echo "  https://www.npmjs.com/package/$pkg"
    done
else
    print_success "🧪 Dry run completed successfully!"
    echo ""
    print_status "To actually publish the first release, run:"
    echo "  ./scripts/publish-first-release.sh"
fi

echo ""