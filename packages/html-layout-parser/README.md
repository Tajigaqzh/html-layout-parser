# html-layout-parser

High-performance HTML layout parser compiled to WebAssembly. Supports multi-font management, CSS separation, and multiple output modes for Canvas rendering.

## Installation

```bash
npm install html-layout-parser
```

## ⚠️ Important: Vite Users Must Configure

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

**That's it!** No additional plugins needed for most users.

### Example: Complete Vite Configuration for Users

```typescript
// vite.config.ts - This is all you need!
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue' // or your framework plugin

export default defineConfig({
  plugins: [vue()], // Your normal plugins
  optimizeDeps: {
    exclude: ['html-layout-parser'] // This is the key line!
  }
})
```

**Having WASM loading issues?** See [Troubleshooting](#troubleshooting) section below.

## Quick Start

### Direct Import (Recommended)

**For Vite users, make sure you've configured `optimizeDeps.exclude` first!**

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/web'

async function example() {
  const parser = new HtmlLayoutParser()
  
  // Initialize - WASM will be loaded automatically
  await parser.init()

  // Load a font
  const fontResponse = await fetch('/fonts/arial.ttf')
  const fontData = new Uint8Array(await fontResponse.arrayBuffer())
  const fontId = parser.loadFont(fontData, 'Arial')
  parser.setDefaultFont(fontId)

  // Parse HTML
  const layouts = parser.parse('<div>Hello World</div>', {
    viewportWidth: 800
  })

  console.log(layouts)
  parser.destroy()
}
```

### Different Environments

#### Web Browser
```typescript
import { HtmlLayoutParser } from 'html-layout-parser/web'
```

#### Node.js
```typescript
import { HtmlLayoutParser } from 'html-layout-parser/node'
```

#### Web Worker
```typescript
import { HtmlLayoutParser } from 'html-layout-parser/worker'
```

### Manual Copy (Fallback Option)

If direct import doesn't work with your bundler, you can manually copy files:

### Manual Copy (Fallback Option)

If direct import doesn't work with your bundler:

1. **Copy files to your project:**

```bash
# Copy web bundle to your public directory
cp -r node_modules/html-layout-parser/web public/wasm
```

2. **Use in your code:**

```typescript
// Import from the copied files
import { HtmlLayoutParser } from '/wasm/index.js'

const parser = new HtmlLayoutParser()
await parser.init() // Will use the copied WASM files
```

## API Reference

### Basic Usage

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/web'

// Create parser instance
const parser = new HtmlLayoutParser()

// Initialize (loads WASM module)
await parser.init()

// Load font
const fontId = parser.loadFont(fontData, 'FontName')
parser.setDefaultFont(fontId)

// Parse HTML
const result = parser.parse(html, options)

// Clean up
parser.destroy()
```

### Parse Options

```typescript
interface ParseOptions {
  viewportWidth: number    // Required: viewport width in pixels
  css?: string            // Optional: CSS styles
  mode?: 'flat' | 'byRow' | 'simple' | 'full'  // Default: 'flat'
}
```

### Output Format

The parser returns layout information ready for Canvas 2D rendering:

```typescript
interface LayoutResult {
  elements: Array<{
    tag: string
    text?: string
    x: number      // Position in pixels
    y: number      // Position in pixels  
    width: number  // Size in pixels
    height: number // Size in pixels
    styles: {
      color?: string
      backgroundColor?: string
      fontSize?: number
      fontFamily?: string
      // ... other CSS properties
    }
  }>
}
```

## Features

- **Multi-font Management**: Load multiple fonts, set default font, font fallback
- **CSS Separation**: Pass HTML and CSS separately for dynamic theming  
- **Multiple Output Modes**: flat, byRow, simple, full
- **Canvas-Ready Output**: All values in pixels, ready for Canvas 2D rendering
- **Cross-Environment**: Works in Web, Worker, and Node.js
- **Memory Safe**: Proper memory management with explicit cleanup
- **TypeScript Support**: Full type definitions included
- **Direct Import**: No manual file copying required (with proper bundler config)

## Other Bundlers

### Webpack
```javascript
// webpack.config.js
module.exports = {
  experiments: {
    asyncWebAssembly: true,
  },
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: 'webassembly/async',
      },
    ],
  },
}
```

### Rollup
```javascript
// rollup.config.js
import { wasm } from '@rollup/plugin-wasm'

export default {
  plugins: [
    wasm({
      maxFileSize: 10000000, // 10MB
    })
  ]
}
```

## Troubleshooting

### "Magic word" WASM errors in development

If you see errors like `expected magic word 00 61 73 6d, found 61 73 79 6e`, you need to add a custom middleware to serve WASM files properly in development:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    // ... your other plugins
    {
      name: 'html-layout-parser-dev',
      configureServer(server) {
        server.middlewares.use('/wasm', (req, res, next) => {
          const cleanUrl = req.url?.split('?')[0] || ''
          
          if (cleanUrl.endsWith('.wasm') || cleanUrl.endsWith('.mjs') || cleanUrl.endsWith('.cjs')) {
            try {
              const fileName = cleanUrl.substring(1) // remove leading slash
              const filePath = resolve(process.cwd(), `node_modules/html-layout-parser/dist/${fileName}`)
              const content = readFileSync(filePath)
              
              if (cleanUrl.endsWith('.wasm')) {
                res.setHeader('Content-Type', 'application/wasm')
              } else {
                res.setHeader('Content-Type', 'application/javascript')
              }
              
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.end(content)
              return
            } catch (err) {
              console.error('Failed to serve WASM file:', err)
            }
          }
          next()
        })
      }
    }
  ],
  optimizeDeps: {
    exclude: ['html-layout-parser']
  }
})
```

Then initialize the parser with the custom path:

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/web'

const parser = new HtmlLayoutParser()
await parser.init('/wasm/html_layout_parser.mjs') // Use custom path
```

### Other common issues

- **Module not found errors**: Make sure you're importing from the correct entry point (`html-layout-parser/web`, `html-layout-parser/node`, etc.)
- **MIME type errors**: Use the custom middleware shown above
- **Build errors**: Make sure WASM files are included in your build assets

## License

MIT