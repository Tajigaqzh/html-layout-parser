# Installation

## Package Options

HTML Layout Parser offers multiple package options to fit your needs:

### Main Package (Recommended)

The main package includes all environments with automatic detection:

```bash
npm install html-layout-parser
```

```typescript
// Auto-detects environment
import { HtmlLayoutParser } from 'html-layout-parser';

// Or import specific environment
import { HtmlLayoutParser } from 'html-layout-parser/web';
import { HtmlLayoutParser } from 'html-layout-parser/worker';
import { HtmlLayoutParser } from 'html-layout-parser/node';
```

### Platform-Specific Packages

For smaller bundle sizes, install only what you need:

::: code-group

```bash [Web Browser]
npm install html-layout-parser-web
```

```bash [Web Worker]
npm install html-layout-parser-worker
```

```bash [Node.js]
npm install html-layout-parser-node
```

:::

## Package Sizes

| Package | Size |
|---------|------|
| html-layout-parser | ~2.3MB (includes WASM) |
| html-layout-parser-web | ~2.3MB |
| html-layout-parser-worker | ~2.3MB |
| html-layout-parser-node | ~2.3MB |

::: info
The WASM module (~2.25MB) is included in each package. The JavaScript wrapper is ~25KB.
:::

## Module Formats

All packages support both ESM and CommonJS:

```typescript
// ESM
import { HtmlLayoutParser } from 'html-layout-parser';

// CommonJS
const { HtmlLayoutParser } = require('html-layout-parser');
```

## TypeScript Support

Full TypeScript support is included with all packages:

```typescript
import { 
  HtmlLayoutParser, 
  CharLayout, 
  ParseOptions,
  LayoutDocument 
} from 'html-layout-parser';

const parser = new HtmlLayoutParser();
await parser.init();

const layouts: CharLayout[] = parser.parse(html, {
  viewportWidth: 800
} satisfies ParseOptions);
```

## Browser Support

- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

## Node.js Support

- Node.js 16+

## CDN Usage

You can also use the package via CDN (not recommended for production):

```html
<script type="module">
  import { HtmlLayoutParser } from 'https://unpkg.com/html-layout-parser/dist/web.js';
  
  const parser = new HtmlLayoutParser();
  await parser.init('https://unpkg.com/html-layout-parser/dist/html_layout_parser.js');
</script>
```

## Building from Source

### Prerequisites

- [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html)
- Node.js 16+
- pnpm 8+

### Build Steps

```bash
# Clone the repository
git clone https://github.com/Tajigaqzh/html-layout-parser.git
cd html-layout-parser

# Install dependencies
pnpm install

# Build WASM module
./build.sh

# Build TypeScript packages
pnpm run build:packages

# Run tests
pnpm test
```

## Troubleshooting

### WASM Loading Issues

If the WASM module fails to load, you may need to configure your server to serve `.wasm` files with the correct MIME type:

```
Content-Type: application/wasm
```

### Custom WASM Path

If you need to load the WASM from a custom path:

```typescript
const parser = new HtmlLayoutParser();
await parser.init('/custom/path/html_layout_parser.js');
```

### Webpack Configuration

For Webpack, you may need to configure asset handling:

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: 'asset/resource'
      }
    ]
  }
};
```

### Vite Configuration

Vite handles WASM files automatically, but you can configure if needed:

```typescript
// vite.config.ts
export default {
  optimizeDeps: {
    exclude: ['html-layout-parser']
  }
};
```
