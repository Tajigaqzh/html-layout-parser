#!/bin/bash

# Copy WASM files from npm package to public directory
echo "Copying WASM files from npm package..."

# Create wasm directory if it doesn't exist
mkdir -p public/wasm

# Check if npm package exists
if [ -f "node_modules/html-layout-parser/dist/html_layout_parser.js" ] && [ -f "node_modules/html-layout-parser/dist/html_layout_parser.wasm" ]; then
  # Copy files from npm package
  cp node_modules/html-layout-parser/dist/html_layout_parser.js public/wasm/
  cp node_modules/html-layout-parser/dist/html_layout_parser.wasm public/wasm/
  echo "✓ WASM files copied from npm package successfully!"
  echo "  - html_layout_parser.js"
  echo "  - html_layout_parser.wasm"
else
  echo "✗ npm package not found. Trying parent directory..."
  # Fallback to parent directory
  if [ -f "../wasm-output/html_layout_parser.js" ] && [ -f "../wasm-output/html_layout_parser.wasm" ]; then
    cp ../wasm-output/html_layout_parser.js public/wasm/
    cp ../wasm-output/html_layout_parser.wasm public/wasm/
    echo "✓ WASM files copied from parent directory successfully"
  else
    echo "✗ WASM files not found. Please install npm package or build WASM first:"
    echo "  pnpm add html-layout-parser@latest"
    echo "  or cd .. && ./build.sh"
    exit 1
  fi
fi
