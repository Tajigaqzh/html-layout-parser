# HTML Layout Parser Playground

Interactive playground for testing and demonstrating HTML Layout Parser v0.0.1 features.

## Prerequisites

1. **Build WASM module first**:
   ```bash
   cd ..
   ./build.sh
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Copy WASM files** (automatic on first run, or manually):
   ```bash
   pnpm run copy-wasm
   ```

## Development

```bash
pnpm dev
```

The WASM files will be automatically copied from `../wasm-output/` to `public/wasm/`.

Open http://localhost:5173

## Features

### 🏠 Home
- Overview of all features
- Quick start guide

### 🎯 Basic Demo
- Compare DOM rendering vs Canvas rendering
- Load custom fonts
- Edit HTML and CSS in real-time
- See parsing metrics

### 🔤 Multi-Font Demo (Coming Soon)
- Load multiple fonts
- Test font fallback chains
- Compare different fonts

### 🎨 CSS Separation Demo (Coming Soon)
- Separate HTML from CSS
- Switch themes dynamically
- Test CSS specificity

### 📦 Output Modes Demo (Coming Soon)
- Compare all 4 output modes
- Visualize data structures
- Performance comparison

### ⚡ Performance Demo (Coming Soon)
- Benchmark parsing speed
- Test with different document sizes
- Memory usage monitoring

## Usage

1. **Load a Font**:
   - Click "Load Font" button
   - Select a `.ttf` or `.otf` font file
   - Font will be loaded into WASM module

2. **Edit HTML/CSS**:
   - Modify the HTML and CSS in the editors
   - Use the default examples or write your own

3. **Parse & Render**:
   - Click "Parse & Render" button
   - See DOM rendering on the left
   - See Canvas rendering on the right
   - Compare the results

4. **View Metrics**:
   - Character count
   - Parse time
   - Memory usage

## Project Structure

```
playground/
├── src/
│   ├── components/
│   │   └── ComparisonView.vue    # DOM vs Canvas comparison
│   ├── composables/
│   │   └── useParser.ts           # WASM module wrapper
│   ├── router/
│   │   └── index.ts               # Vue Router config
│   ├── views/
│   │   ├── HomeView.vue           # Home page
│   │   ├── BasicDemo.vue          # Basic demo
│   │   ├── MultiFontDemo.vue      # Multi-font demo
│   │   ├── CssSeparationDemo.vue  # CSS separation demo
│   │   ├── OutputModesDemo.vue    # Output modes demo
│   │   └── PerformanceDemo.vue    # Performance demo
│   ├── App.vue                    # Main app component
│   └── main.ts                    # App entry point
├── public/                        # Static assets
├── vite.config.ts                 # Vite configuration
└── package.json                   # Dependencies
```

## Notes

- Make sure WASM module is built before running the playground
- Font files should be in TTF or OTF format
- The playground uses local WASM files (not published npm package)
- WASM files are loaded from `../wasm-output/` directory

## Troubleshooting

### WASM module not found
```bash
# Build WASM first
cd ..
./build.sh
```

### Font loading fails
- Make sure the font file is valid TTF/OTF format
- Check browser console for detailed error messages

### Canvas rendering issues
- Ensure font is loaded before parsing
- Check that HTML/CSS is valid
- Verify viewport width is reasonable (100-2000px)
