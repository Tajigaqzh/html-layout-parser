#!/bin/bash

# Version bump script for main package
# Usage: ./scripts/version-bump.sh [patch|minor|major]

set -e

VERSION_TYPE="${1:-patch}"

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo "❌ Invalid version type: $VERSION_TYPE"
    echo "Usage: ./scripts/version-bump.sh [patch|minor|major]"
    exit 1
fi

echo "📦 Bumping version ($VERSION_TYPE) for main package..."
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo "  Bumping html-layout-parser..."
cd "packages/html-layout-parser"
npm version $VERSION_TYPE --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "    → $NEW_VERSION"
cd ../..

echo ""
echo "🎉 Version bump complete!"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Commit: git commit -am 'chore: bump version to $NEW_VERSION'"
echo "  3. Tag: git tag v$NEW_VERSION"
echo "  4. Push: git push && git push --tags"
echo "  5. Publish: ./scripts/publish-all.sh"
