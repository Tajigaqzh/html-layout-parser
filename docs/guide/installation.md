# Installation

## Package Installation

Install the HTML Layout Parser package from npm:

```bash
npm install html-layout-parser
```

### ⚠️ Important: Vite Users Must Configure

If you're using **Vite**, add this to your `vite.config.ts` **before using the package**:

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    exclude: ['html-layout-parser']
  }
})
```

**Why?** Vite's dependency pre-bundling breaks WASM modules. This configuration prevents that.

## Usage Methods

HTML Layout Parser now supports both **direct import** and **manual copy** approaches:

### Method 1: Direct Import (Recommended)

You can now directly import and use the package without manual file copying:

```typescript
// ESM import (recommended)
import { HtmlLayoutParser } from 'html-layout-parser';

async function example() {
  const parser = new HtmlLayoutParser();
  await parser.init(); // Automatically loads WASM from node_modules
  
  // Load font
  const fontResponse = await fetch('/fonts/arial.ttf');
  const fontData = new Uint8Array(await fontResponse.arrayBuffer());
  const fontId = parser.loadFont(fontData, 'Arial');
  parser.setDefaultFont(fontId);
  
  // Parse HTML
  const layouts = parser.parse('<div>Hello World</div>', { viewportWidth: 800 });
  
  parser.destroy();
}
```

```javascript
// CommonJS require (also supported)
const { HtmlLayoutParser } = require('html-layout-parser');

async function example() {
  const parser = new HtmlLayoutParser();
  await parser.init();
  // ... rest of the code
}
```

#### Environment-Specific Imports

For better tree-shaking and explicit targeting:

```typescript
// Web browser
import { HtmlLayoutParser } from 'html-layout-parser/web';

// Node.js
import { HtmlLayoutParser } from 'html-layout-parser/node';

// Web Worker
import { HtmlLayoutParser } from 'html-layout-parser/worker';
```

#### Direct WASM Module Access

For advanced use cases:

```typescript
// Direct WASM module import
import createModule from 'html-layout-parser/wasm';

const wasmModule = await createModule();
// Use low-level WASM API directly
```

### Method 2: Manual Copy (Fallback)

⚠️ **Only use this method if you encounter bundler issues with direct import.**

The direct import method (Method 1) is now the recommended approach. Manual copy is provided as a fallback for edge cases.

#### Web Browser Setup

```bash
# Only if direct import fails
cp -r node_modules/html-layout-parser/web public/html-layout-parser
```

```typescript
// Import from copied files
import { HtmlLayoutParser } from 'html-layout-parser';

async function example() {
  const parser = new HtmlLayoutParser();
  await parser.init('/html-layout-parser/html_layout_parser.mjs');
  // ... rest of the code
}
```

#### Node.js Setup

```bash
# Only if direct import fails
cp -r node_modules/html-layout-parser/node ./lib/html-layout-parser
```

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/node';

async function example() {
  const parser = new HtmlLayoutParser();
  await parser.init('./lib/html-layout-parser/html_layout_parser.mjs');
  // ... rest of the code
}
```

## CDN Usage

You can also use the package directly from CDN:

```html
<script type="module">
  import { HtmlLayoutParser } from 'https://unpkg.com/html-layout-parser@latest/dist/index.js';
  
  const parser = new HtmlLayoutParser();
  await parser.init('https://unpkg.com/html-layout-parser@latest/dist/html_layout_parser.mjs');
  
  // Use parser...
</script>
```

## TypeScript Support

Full TypeScript support is included:

```typescript
import { 
  HtmlLayoutParser, 
  CharLayout, 
  ParseOptions,
  MemoryMetrics,
  detectEnvironment 
} from 'html-layout-parser';

const env = detectEnvironment(); // 'web' | 'worker' | 'node' | 'unknown'
const parser = new HtmlLayoutParser();

const layouts: CharLayout[] = parser.parse(html, {
  viewportWidth: 800
} satisfies ParseOptions);
```

## Browser Support

- Chrome 57+ (ES6 modules)
- Firefox 60+ (ES6 modules)
- Safari 11+ (ES6 modules)
- Edge 16+ (ES6 modules)

## Node.js Support

- Node.js 16+ (ESM support)
- Node.js 14+ (with `--experimental-modules`)

## Next Steps

After installation:

1. 📖 Read the [Getting Started Guide](./getting-started.md)
2. 🎯 Try the [Quick Start](../guides/quick-start.md)
3. 📚 Explore [Examples](../examples/index.md)
