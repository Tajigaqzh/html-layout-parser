# Quick Start Guide

Get started with HTML Layout Parser v0.0.1 in minutes.

## Installation

```bash
npm install html-layout-parser
```

## Basic Usage

### Step 1: Import and Initialize

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

const parser = new HtmlLayoutParser();
await parser.init();
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
// Always destroy when done
parser.destroy();
```

## Complete Example

```typescript
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser';

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
import { HtmlLayoutParser } from 'html-layout-parser/web';
```

### Web Worker

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/worker';
```

### Node.js

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/node';

// Node.js can load fonts from files
const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
```

## Next Steps

- [Memory Management Guide](./memory-management.md) - Best practices for memory
- [Performance Guide](./performance.md) - Optimization techniques
- [API Reference](../README.md#api-reference) - Complete API documentation
