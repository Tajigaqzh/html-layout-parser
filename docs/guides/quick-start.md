# Quick Start Guide

Get started with HTML Layout Parser in minutes using the manual copy approach.

## Installation

```bash
npm install html-layout-parser
```

## Setup

### For Web Applications

1. **Copy the web bundle:**

```bash
cp -r node_modules/html-layout-parser/web public/html-layout-parser
```

2. **Load WASM in your HTML:**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Your App</title>
</head>
<body>
  <div id="app"></div>
  <!-- Load WASM module globally -->
  <script src="/html-layout-parser/html_layout_parser.js"></script>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

## Basic Usage

### Step 1: Import and Initialize

```typescript
// Import from copied files
import { HtmlLayoutParser } from '/html-layout-parser/index.js';

const parser = new HtmlLayoutParser();
await parser.init(); // Uses globally loaded WASM
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
import { HtmlLayoutParser } from '/html-layout-parser/index.js';

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

## Environment-Specific Setup

### Node.js

```bash
# Copy Node.js bundle
cp -r node_modules/html-layout-parser/node ./src/lib/html-layout-parser
```

```typescript
import { HtmlLayoutParser } from './lib/html-layout-parser/index.js';

const parser = new HtmlLayoutParser();
await parser.init('./lib/html-layout-parser/html_layout_parser.js');
```

### Web Worker

```bash
# Copy worker bundle
cp -r node_modules/html-layout-parser/worker public/workers/html-layout-parser
```

```typescript
// In worker file
import { HtmlLayoutParser } from '/workers/html-layout-parser/index.js';

const parser = new HtmlLayoutParser();
await parser.init('/workers/html-layout-parser/html_layout_parser.js');
```

## Next Steps

- 📖 Read the [Installation Guide](../guide/installation.md) for detailed setup
- 🎨 Check out [Web Examples](../examples/web.md) for canvas rendering
- 🔧 Learn about [Memory Management](../examples/memory.md)
- 📚 Browse all [Examples](../examples/index.md)

### Step 4: Clean Up

```typescript
// Always destroy when done
parser.destroy();
```

## Complete Example

```typescript
import { HtmlLayoutParser, CharLayout } from '/html-layout-parser/index.js';

async function main() {
  // Initialize parser
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load font
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    const fontId = parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(fontId);

    // Parse HTML
    const html = `
      <div style="font-size: 24px; color: blue;">
        Hello World
      </div>
    `;

    const layouts = parser.parse(html, { viewportWidth: 800 });

    // Render to canvas
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    for (const char of layouts) {
      ctx.font = `${char.fontSize}px ${char.fontFamily}`;
      ctx.fillStyle = char.color;
      ctx.fillText(char.character, char.x, char.baseline);
    }

  } finally {
    parser.destroy();
  }
}

main();
```

## Using External CSS

Separate your HTML and CSS:

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

## Environment-Specific Usage

### Web Browser

```typescript
import { HtmlLayoutParser } from '/html-layout-parser/index.js';
```

### Web Worker

```typescript
import { HtmlLayoutParser } from '/workers/html-layout-parser/index.js';
```

### Node.js

```typescript
import { HtmlLayoutParser } from './lib/html-layout-parser/index.js';

const parser = new HtmlLayoutParser();
await parser.init('./lib/html-layout-parser/html_layout_parser.js');

// Node.js can load fonts from files
const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
```

## Next Steps

- [Memory Management Guide](./memory-management.md) - Best practices for memory
- [Performance Guide](./performance.md) - Optimization techniques
- [API Reference](../README.md#api-reference) - Complete API documentation
