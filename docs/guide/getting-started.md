# Getting Started

This guide will help you get up and running with HTML Layout Parser in minutes.

## Installation

::: code-group

```bash [npm]
npm install html-layout-parser
```

```bash [yarn]
yarn add html-layout-parser
```

```bash [pnpm]
pnpm add html-layout-parser
```

:::

## Platform-Specific Imports

::: tip Reduce Bundle Size
Import only the platform you need to significantly reduce bundle size:

```typescript
// Auto-detect (default) - automatically detects environment
import { HtmlLayoutParser } from 'html-layout-parser';

// Web Browser (explicit)
import { HtmlLayoutParser } from 'html-layout-parser/web';

// Web Worker
import { HtmlLayoutParser } from 'html-layout-parser/worker';

// Node.js
import { HtmlLayoutParser } from 'html-layout-parser/node';
```

Each platform-specific build includes only the necessary code for that environment.
:::

## Font File Setup

::: warning Important: Font File Location
Always place font files in the `public` directory (or equivalent static assets folder) to prevent build tools from renaming them.

**Recommended Structure:**
```
project/
├── public/
│   └── fonts/
│       ├── arial.ttf
│       ├── times.ttf
│       └── helvetica.ttf
├── src/
│   └── main.ts
```

**Why?** Build tools like Vite, Webpack, or Rollup may add hash suffixes to files in `src` (e.g., `arial.abc123.ttf`), causing WASM to fail loading fonts.
:::

## Basic Usage

### Step 1: Import and Initialize

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

const parser = new HtmlLayoutParser();
await parser.init();
```

### Step 2: Load a Font

Fonts must be loaded before parsing. The parser needs font data to calculate character widths and positions.

```typescript
// Fetch font file from public directory
const response = await fetch('/fonts/arial.ttf');
const fontData = new Uint8Array(await response.arrayBuffer());

// Load font and get ID
const fontId = parser.loadFont(fontData, 'Arial');

// Set as default font for fallback
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

### Step 4: Render to Canvas

```typescript
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

for (const char of layouts) {
  ctx.font = `${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
  ctx.fillStyle = char.color;
  ctx.fillText(char.character, char.x, char.baseline);
}
```

### Step 5: Clean Up

::: danger Critical: Memory Management
Always destroy the parser when done to release WebAssembly memory.
:::

```typescript
parser.destroy();
```

## Complete Example

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

async function main() {
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

## Next Steps

- [Font Management](/guide/font-management) - Learn about multi-font support
- [Output Modes](/guide/output-modes) - Choose the right output format
- [Memory Management](/guide/memory-management) - Best practices for memory
- [Examples](/examples/) - See more usage examples
