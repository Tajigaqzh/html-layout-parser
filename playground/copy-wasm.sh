#!/bin/bash

# Copy WASM files from parent directory to public/wasm
echo "Copying WASM files..."

mkdir -p public/wasm

if [ -f "../wasm-output/html_layout_parser.js" ] && [ -f "../wasm-output/html_layout_parser.wasm" ]; then
  cp ../wasm-output/html_layout_parser.js public/wasm/
  cp ../wasm-output/html_layout_parser.wasm public/wasm/
  echo "✓ WASM files copied successfully"
else
  echo "✗ WASM files not found. Please build WASM first:"
  echo "  cd .. && ./build.sh"
  exit 1
fi
