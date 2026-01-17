#!/bin/bash

# HTML Layout Parser - NPM Publishing Script
# This script builds and publishes all packages to NPM

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists pnpm; then
    print_error "pnpm is not installed. Please install pnpm first."
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check if user is logged in to npm
if ! npm whoami >/dev/null 2>&1; then
    print_error "You are not logged in to npm. Please run 'npm login' first."
    exit 1
fi

print_success "Prerequisites check passed"

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

print_status "Working directory: $ROOT_DIR"

# Parse command line arguments
DRY_RUN=false
SKIP_BUILD=false
SKIP_TESTS=false
VERSION_TYPE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --version)
            VERSION_TYPE="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dry-run      Perform a dry run (don't actually publish)"
            echo "  --skip-build   Skip the build step"
            echo "  --skip-tests   Skip the test step"
            echo "  --version TYPE Bump version (patch|minor|major)"
            echo "  -h, --help     Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                           # Build and publish"
            echo "  $0 --dry-run                 # Test the publish process"
            echo "  $0 --version patch           # Bump patch version and publish"
            echo "  $0 --skip-build --dry-run    # Quick dry run without building"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Display current package versions
print_status "Current package versions:"
for pkg in packages/*/package.json; do
    if [[ -f "$pkg" ]]; then
        name=$(jq -r '.name' "$pkg")
        version=$(jq -r '.version' "$pkg")
        echo "  $name: $version"
    fi
done

# Version bump if requested
if [[ -n "$VERSION_TYPE" ]]; then
    print_status "Bumping version ($VERSION_TYPE)..."
    
    case $VERSION_TYPE in
        patch|minor|major)
            pnpm -r exec -- npm version "$VERSION_TYPE" --no-git-tag-version
            print_success "Version bumped to $VERSION_TYPE"
            ;;
        *)
            print_error "Invalid version type: $VERSION_TYPE. Use patch, minor, or major."
            exit 1
            ;;
    esac
    
    # Display new versions
    print_status "New package versions:"
    for pkg in packages/*/package.json; do
        if [[ -f "$pkg" ]]; then
            name=$(jq -r '.name' "$pkg")
            version=$(jq -r '.version' "$pkg")
            echo "  $name: $version"
        fi
    done
fi

# Clean previous builds
if [[ "$SKIP_BUILD" != true ]]; then
    print_status "Cleaning previous builds..."
    pnpm run clean
    print_success "Clean completed"
fi

# Run tests
if [[ "$SKIP_TESTS" != true ]]; then
    print_status "Running tests..."
    if pnpm run test; then
        print_success "All tests passed"
    else
        print_error "Tests failed. Aborting publish."
        exit 1
    fi
fi

# Build WASM and packages
if [[ "$SKIP_BUILD" != true ]]; then
    print_status "Building WASM module..."
    if pnpm run build:wasm; then
        print_success "WASM build completed"
    else
        print_error "WASM build failed"
        exit 1
    fi
    
    print_status "Building all packages..."
    if pnpm run build:packages; then
        print_success "Package builds completed"
    else
        print_error "Package build failed"
        exit 1
    fi
fi

# Verify build outputs
print_status "Verifying build outputs..."
PACKAGES=("html-layout-parser" "html-layout-parser-web" "html-layout-parser-node" "html-layout-parser-worker")

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

# Publish packages
if [[ "$DRY_RUN" == true ]]; then
    print_warning "DRY RUN MODE - No packages will be actually published"
    print_status "Running publish dry run..."
    pnpm -r publish --access public --dry-run
    print_success "Dry run completed successfully"
else
    print_status "Publishing packages to NPM..."
    
    # Confirm before publishing
    echo ""
    print_warning "You are about to publish the following packages to NPM:"
    for pkg in "${PACKAGES[@]}"; do
        version=$(jq -r '.version' "packages/$pkg/package.json")
        echo "  $pkg@$version"
    done
    echo ""
    
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Publish cancelled by user"
        exit 0
    fi
    
    # Publish each package individually for better error handling
    for pkg in "${PACKAGES[@]}"; do
        print_status "Publishing $pkg..."
        
        cd "packages/$pkg"
        
        if npm publish --access public; then
            print_success "Successfully published $pkg"
        else
            print_error "Failed to publish $pkg"
            cd "$ROOT_DIR"
            exit 1
        fi
        
        cd "$ROOT_DIR"
    done
    
    print_success "All packages published successfully!"
fi

# Generate publish summary
print_status "Publish Summary:"
echo "=================="

for pkg in "${PACKAGES[@]}"; do
    version=$(jq -r '.version' "packages/$pkg/package.json")
    if [[ "$DRY_RUN" == true ]]; then
        echo "  $pkg@$version (DRY RUN)"
    else
        echo "  $pkg@$version ✓"
    fi
done

echo ""
if [[ "$DRY_RUN" != true ]]; then
    print_success "🎉 All packages have been successfully published to NPM!"
    echo ""
    print_status "Next steps:"
    echo "  1. Create a git tag for this release"
    echo "  2. Update the changelog"
    echo "  3. Create a GitHub release"
    echo ""
    print_status "Install commands for users:"
    for pkg in "${PACKAGES[@]}"; do
        version=$(jq -r '.version' "packages/$pkg/package.json")
        echo "  npm install $pkg@$version"
    done
else
    print_success "🧪 Dry run completed successfully!"
    echo ""
    print_status "To actually publish, run:"
    echo "  $0"
fi

echo ""