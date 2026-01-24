# Quick Start Guide

Get started with HTML Layout Parser in minutes.

## Installation

```bash
npm install html-layout-parser
```

## Basic Usage

### Step 1: Import and Initialize

```typescript
// Import directly from npm package
import { HtmlLayoutParser } from 'html-layout-parser';

const parser = new HtmlLayoutParser();
await parser.init(); // Automatically loads WASM from node_modules
```

### Step 2: Load a Font

Fonts must be loaded before parsing HTML:

```typescript
// Fetch font file
const response = await fetch('/fonts/arial.ttf');
const fontData = new Uint8Array(await response.arrayBuffer());

// Load font and get ID
const fontId = parser.loadFont(fontData, 'Arial');

// Set as default font
parser.setDefaultFont(fontId);
```

### Step 3: Parse HTML

```typescript
const html = '<div style="color: red; font-size: 24px;">Hello World</div>';

const layouts = parser.parse(html, {
  viewportWidth: 800
});

// layouts is an array of CharLayout objects
for (const char of layouts) {
  console.log(`${char.character} at (${char.x}, ${char.y})`);
}
```

### Step 4: Clean Up

```typescript
// Always clean up when done
parser.destroy();
```

## Complete Example

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

async function main() {
  const parser = new HtmlLayoutParser();
  
  try {
    // Initialize parser
    await parser.init();
    
    // Load font
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    const fontId = parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(fontId);
    
    // Parse HTML
    const html = `
      <div style="font-size: 24px; color: #333;">
        <h1>Hello World</h1>
        <p>This is a paragraph with <span style="color: red;">red text</span>.</p>
      </div>
    `;
    
    const layouts = parser.parse(html, { viewportWidth: 800 });
    
    console.log(`Parsed ${layouts.length} characters`);
    
    // Use layouts for canvas rendering or other purposes
    layouts.forEach(char => {
      console.log(`'${char.character}' at (${char.x}, ${char.y})`);
    });
    
  } finally {
    // Always clean up
    parser.destroy();
  }
}

main().catch(console.error);
```

## Environment-Specific Usage

### Auto-detect (Recommended)
```typescript
import { HtmlLayoutParser, detectEnvironment } from 'html-layout-parser';

console.log(`Running in ${detectEnvironment()} environment`);
const parser = new HtmlLayoutParser();
await parser.init();
```

### Explicit Environment
```typescript
// Web browser
import { HtmlLayoutParser } from 'html-layout-parser/web';

// Node.js
import { HtmlLayoutParser } from 'html-layout-parser/node';

// Web Worker
import { HtmlLayoutParser } from 'html-layout-parser/worker';
```

### Node.js with File Loading
```typescript
import { HtmlLayoutParser } from 'html-layout-parser/node';

const parser = new HtmlLayoutParser();
await parser.init();

// Load font from file (Node.js only)
const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
parser.setDefaultFont(fontId);
```

## Alternative: Manual Copy Setup

If you encounter bundler issues, you can still use the manual copy approach:

### For Web Applications

```bash
# Copy the web bundle
cp -r node_modules/html-layout-parser/web public/html-layout-parser
```

```typescript
// Import from copied files
import { HtmlLayoutParser } from 'html-layout-parser';

const parser = new HtmlLayoutParser();
await parser.init('/html-layout-parser/html_layout_parser.mjs');
```

### For Node.js Applications

```bash
# Copy the Node.js bundle
cp -r node_modules/html-layout-parser/node ./lib/html-layout-parser
```

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/node';

const parser = new HtmlLayoutParser();
await parser.init('./lib/html-layout-parser/html_layout_parser.mjs');
```

## Next Steps

- 📖 Read the [Installation Guide](../guide/installation.md) for detailed setup
- 🎨 Check out [Web Examples](../examples/web.md) for canvas rendering
- 🔧 Learn about [Memory Management](../examples/memory.md)
- 📚 Browse all [Examples](../examples/index.md)