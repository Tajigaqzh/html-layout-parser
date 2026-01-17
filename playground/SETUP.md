# Playground Setup Guide

## Quick Start

### 1. Build WASM (if not already built)

```bash
cd ..
./build.sh
```

This will create WASM files in `../wasm-output/` directory.

### 2. Copy WASM files to playground

```bash
cd playground
pnpm run copy-wasm
```

Or manually:
```bash
mkdir -p public/wasm
cp ../wasm-output/html_layout_parser.js public/wasm/
cp ../wasm-output/html_layout_parser.wasm public/wasm/
```

### 3. Install dependencies

```bash
pnpm install
```

### 4. Start development server

```bash
pnpm dev
```

Open http://localhost:5173

## File Structure

```
playground/
├── public/
│   └── wasm/                      # WASM files (copied from parent)
│       ├── html_layout_parser.js
│       └── html_layout_parser.wasm
├── src/
│   ├── composables/
│   │   └── useParser.ts           # WASM loader (loads from /wasm/)
│   └── ...
└── copy-wasm.sh                   # Script to copy WASM files
```

## Troubleshooting

### Error: "Could not load WASM module"

**Solution 1**: Make sure WASM is built
```bash
cd ..
./build.sh
```

**Solution 2**: Copy WASM files
```bash
cd playground
pnpm run copy-wasm
```

**Solution 3**: Check if files exist
```bash
ls -la public/wasm/
# Should show:
# html_layout_parser.js
# html_layout_parser.wasm
```

### Error: "Failed to fetch WASM"

Make sure the dev server is running and can access `/wasm/` directory:
- Check browser console for 404 errors
- Verify files are in `public/wasm/` directory
- Restart dev server: `pnpm dev`

### WASM files are outdated

After rebuilding WASM, copy the new files:
```bash
pnpm run copy-wasm
```

Then restart the dev server.

## Notes

- WASM files in `public/wasm/` are gitignored
- Always copy WASM files after rebuilding
- The playground loads WASM from `/wasm/html_layout_parser.js`
- Font files should be loaded via file input (not included in repo)
