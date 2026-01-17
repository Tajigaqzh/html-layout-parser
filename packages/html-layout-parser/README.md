# html-layout-parser

High-performance HTML layout parser compiled to WebAssembly. Supports multi-font management, CSS separation, and multiple output modes for Canvas rendering.

## Installation

```bash
npm install html-layout-parser
# or
pnpm add html-layout-parser
# or
yarn add html-layout-parser
```

## Quick Start

### Web Browser (Recommended Method)

1. **Copy files to your project:**

After installation, copy the web bundle to your public directory:

```bash
# Copy web bundle to your public directory
cp -r node_modules/html-layout-parser/web public/wasm
```

Your project structure should look like:
```
public/
  wasm/
    html_layout_parser.js
    html_layout_parser.wasm
    index.js
    index.d.ts
```

2. **Load in your HTML:**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Your App</title>
</head>
<body>
  <div id="app"></div>
  <!-- Load WASM module globally -->
  <script src="/wasm/html_layout_parser.js"></script>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

3. **Use in your code:**

```typescript
// Import the parser class
import { HtmlLayoutParser } from '/wasm/index.js';

async function example() {
  const parser = new HtmlLayoutParser();
  await parser.init(); // Will use globally loaded WASM module

  // Load a font
  const fontResponse = await fetch('/fonts/arial.ttf');
  const fontData = new Uint8Array(await fontResponse.arrayBuffer());
  const fontId = parser.loadFont(fontData, 'Arial');
  parser.setDefaultFont(fontId);

  // Parse HTML
  const layouts = parser.parse('<div>Hello World</div>', {
    viewportWidth: 800
  });

  console.log(layouts);
  parser.destroy();
}
```

### Node.js Environment

1. **Copy Node.js bundle:**

```bash
cp -r node_modules/html-layout-parser/node ./lib/wasm
```

2. **Use in your code:**

```typescript
import { HtmlLayoutParser } from './lib/wasm/index.js';

const parser = new HtmlLayoutParser();
await parser.init('./lib/wasm/html_layout_parser.js');
// ... use parser
```

### Web Worker

1. **Copy Worker bundle:**

```bash
cp -r node_modules/html-layout-parser/worker public/workers
```

2. **Use in your worker:**

```typescript
// In your worker file
import { HtmlLayoutParser } from '/workers/index.js';

const parser = new HtmlLayoutParser();
await parser.init('/workers/html_layout_parser.js');
// ... use parser
```

## Why Manual Copy?

We recommend manual copying because:

- **Reliable**: Works with all bundlers and deployment environments
- **Predictable**: WASM files are served as static assets
- **Fast**: No complex module resolution or dynamic imports
- **Compatible**: Works with CDNs, static hosting, and any web server

## Build Integration

You can automate the copying process in your build scripts:

### Package.json script:
```json
{
  "scripts": {
    "postinstall": "cp -r node_modules/html-layout-parser/web public/wasm",
    "dev": "npm run postinstall && vite",
    "build": "npm run postinstall && vite build"
  }
}
```

### Vite plugin:
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync } from 'fs'

export default defineConfig({
  plugins: [
    {
      name: 'copy-wasm',
      buildStart() {
        mkdirSync('public/wasm', { recursive: true })
        copyFileSync('node_modules/html-layout-parser/web/html_layout_parser.js', 'public/wasm/html_layout_parser.js')
        copyFileSync('node_modules/html-layout-parser/web/html_layout_parser.wasm', 'public/wasm/html_layout_parser.wasm')
        copyFileSync('node_modules/html-layout-parser/web/index.js', 'public/wasm/index.js')
      }
    }
  ]
})
```

## Features

- **Multi-font Management**: Load multiple fonts, set default font, font fallback
- **CSS Separation**: Pass HTML and CSS separately for dynamic theming
- **Multiple Output Modes**: flat, byRow, simple, full
- **Canvas-Ready Output**: All values in pixels, ready for Canvas 2D rendering
- **Cross-Environment**: Works in Web, Worker, and Node.js
- **Memory Safe**: Proper memory management with explicit cleanup
- **TypeScript Support**: Full type definitions included

## License

MIT
