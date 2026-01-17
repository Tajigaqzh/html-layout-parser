# HTML Layout Parser Packages

This directory contains the main HTML Layout Parser package.

## Package Structure

- `html-layout-parser/` - Main package with all environments (web, node, worker)

## Building

```bash
# Build the main package
cd html-layout-parser
pnpm run build
```

## Publishing

```bash
# Publish the main package
cd html-layout-parser
npm publish
```

The main package includes pre-built bundles for all environments:
- `web/` - Web browser bundle (copy to your public directory)
- `node/` - Node.js bundle (copy to your project)
- `worker/` - Web Worker bundle (copy to your workers directory)

## Usage

After installing the package, copy the appropriate bundle to your project:

```bash
# For web applications
cp -r node_modules/html-layout-parser/web public/wasm

# For Node.js applications  
cp -r node_modules/html-layout-parser/node ./lib/wasm

# For Web Workers
cp -r node_modules/html-layout-parser/worker public/workers
```

Then import from the copied files instead of the npm package directly.
