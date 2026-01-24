# Getting Started

This guide will help you get up and running with HTML Layout Parser in minutes.

## Installation

```bash
npm install html-layout-parser
```

## Basic Usage (Recommended)

### Step 1: Import and Initialize

```typescript
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

## Using External CSS

Separate your HTML content from CSS styles:

```typescript
const html = '<div class="title">Hello World</div>';
const css = `
  .title {
    color: red;
    font-size: 24px;
    font-weight: bold;
  }
`;

const layouts = parser.parse(html, {
  viewportWidth: 800,
  css: css
});
```

Or use the convenience method:

```typescript
const layouts = parser.parseWithCSS(html, css, { viewportWidth: 800 });
```

## Output Modes

### Flat Mode (Default)

Returns a flat array of characters:

```typescript
const chars: CharLayout[] = parser.parse(html, { viewportWidth: 800 });
```

### By Row Mode

Groups characters by row:

```typescript
const rows = parser.parse<'byRow'>(html, { 
  viewportWidth: 800, 
  mode: 'byRow' 
});

for (const row of rows) {
  console.log(`Row ${row.rowIndex} at y=${row.y}`);
  for (const char of row.children) {
    console.log(`  ${char.character}`);
  }
}
```

### Full Mode

Returns complete document hierarchy:

```typescript
const doc = parser.parse<'full'>(html, { 
  viewportWidth: 800, 
  mode: 'full' 
});

for (const page of doc.pages) {
  for (const block of page.blocks) {
    console.log(`Block: ${block.type}`);
    for (const line of block.lines) {
      console.log(`  Line at y=${line.y}`);
    }
  }
}
```

## Error Handling

Use `parseWithDiagnostics` for detailed error information:

```typescript
const result = parser.parseWithDiagnostics(html, { viewportWidth: 800 });

if (result.success) {
  console.log('Parsed:', result.data);
} else {
  console.error('Errors:', result.errors);
}

if (result.warnings?.length) {
  console.warn('Warnings:', result.warnings);
}
```

## Multi-Font Support

Load multiple fonts for font-family fallback:

```typescript
// Load multiple fonts
const arialId = parser.loadFont(arialData, 'Arial');
const timesId = parser.loadFont(timesData, 'Times New Roman');
const georgiaId = parser.loadFont(georgiaData, 'Georgia');

// Set default
parser.setDefaultFont(arialId);

// HTML with font-family
const html = `
  <div style="font-family: 'Times New Roman', Georgia, Arial;">
    This text uses Times New Roman
  </div>
`;

const layouts = parser.parse(html, { viewportWidth: 800 });
```

## Troubleshooting: Manual Copy Setup

⚠️ **Only use this if direct import fails with your bundler.**

The recommended approach is direct import (shown above). Manual copy is a fallback solution.

### For Web Applications

```bash
# Only if direct import doesn't work
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
# Only if direct import doesn't work
cp -r node_modules/html-layout-parser/node ./lib/html-layout-parser
```

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/node';

const parser = new HtmlLayoutParser();
await parser.init('./lib/html-layout-parser/html_layout_parser.mjs');
```

## Next Steps

- [Memory Management Guide](./memory-management.md) - Best practices for memory
- [Performance Guide](./performance.md) - Optimization techniques
- [API Reference](../api/index.md) - Complete API documentation
- [Examples](../examples/index.md) - More usage examples