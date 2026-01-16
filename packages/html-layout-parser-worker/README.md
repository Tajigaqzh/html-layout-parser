# html-layout-parser-worker

HTML Layout Parser for Web Worker environments - compiled to WebAssembly.

This is a standalone package for Web Worker environments. Supports both module workers and classic workers. For other environments, see:
- `html-layout-parser-web` - Web browser main thread
- `html-layout-parser-node` - Node.js environments
- `html-layout-parser` - Unified package with auto-detection

## Installation

```bash
npm install html-layout-parser-worker
```

## Quick Start

### Module Worker

```typescript
// worker.ts
import { HtmlLayoutParser } from 'html-layout-parser-worker';

const parser = new HtmlLayoutParser();
await parser.init('./html_layout_parser.js');

// Load font
const fontResponse = await fetch('./fonts/arial.ttf');
const fontData = new Uint8Array(await fontResponse.arrayBuffer());
const fontId = parser.loadFont(fontData, 'Arial');
parser.setDefaultFont(fontId);

// Handle messages
self.onmessage = async (e) => {
  const { html, options } = e.data;
  const result = parser.parse(html, options);
  self.postMessage(result);
};
```

### Classic Worker

```javascript
// worker.js
importScripts('./html_layout_parser.js');

(async () => {
  const { HtmlLayoutParser } = await import('html-layout-parser-worker');
  
  const parser = new HtmlLayoutParser();
  await parser.init();
  
  // ... rest of the code
})();
```

## OffscreenCanvas Example

```typescript
// worker.ts
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser-worker';

const parser = new HtmlLayoutParser();
await parser.init();

// Load font
const fontResponse = await fetch('./fonts/arial.ttf');
const fontData = new Uint8Array(await fontResponse.arrayBuffer());
const fontId = parser.loadFont(fontData, 'Arial');
parser.setDefaultFont(fontId);

self.onmessage = async (e) => {
  const { html, canvas } = e.data;
  
  // Parse HTML
  const layouts = parser.parse(html, { 
    viewportWidth: canvas.width 
  }) as CharLayout[];
  
  // Render to OffscreenCanvas
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  for (const char of layouts) {
    ctx.font = `${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
    ctx.fillStyle = char.color;
    ctx.fillText(char.character, char.x, char.baseline);
  }
  
  // Transfer bitmap back to main thread
  const bitmap = canvas.transferToImageBitmap();
  self.postMessage({ bitmap }, [bitmap]);
};
```

### Main Thread

```typescript
// main.ts
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const offscreen = canvas.transferControlToOffscreen();

const worker = new Worker('./worker.ts', { type: 'module' });

worker.postMessage({ 
  html: '<div style="color: red;">Hello World</div>',
  canvas: offscreen 
}, [offscreen]);

worker.onmessage = (e) => {
  const { bitmap } = e.data;
  const ctx = canvas.getContext('bitmaprenderer')!;
  ctx.transferFromImageBitmap(bitmap);
};
```

## Features

- **Module & Classic Workers**: Works with both worker types
- **OffscreenCanvas Support**: Render directly in worker thread
- **Multi-font Management**: Load multiple fonts, set default font, font fallback
- **CSS Separation**: Pass HTML and CSS separately for dynamic theming
- **Multiple Output Modes**: flat, byRow, simple, full
- **Memory Safe**: Proper memory management with explicit cleanup

## API Reference

### Initialization

```typescript
const parser = new HtmlLayoutParser();
await parser.init(wasmPath?: string);
```

### Font Management

```typescript
// Load font from Uint8Array
const fontId = parser.loadFont(fontData: Uint8Array, fontName: string): number;

// Set default font for fallback
parser.setDefaultFont(fontId: number): void;

// Unload a font
parser.unloadFont(fontId: number): void;

// Get loaded fonts
const fonts = parser.getLoadedFonts(): FontInfo[];

// Clear all fonts
parser.clearAllFonts(): void;
```

### Parsing

```typescript
// Basic parsing
const layouts = parser.parse(html: string, options: ParseOptions);

// Parse with external CSS
const layouts = parser.parseWithCSS(html: string, css: string, options);

// Parse with diagnostics
const result = parser.parseWithDiagnostics(html: string, options: ParseOptions);
```

### Parse Options

```typescript
interface ParseOptions {
  viewportWidth: number;      // Required: viewport width in pixels
  viewportHeight?: number;    // Optional: viewport height
  mode?: OutputMode;          // 'flat' | 'byRow' | 'simple' | 'full'
  css?: string;               // External CSS string
  isDebug?: boolean;          // Enable debug logging
}
```

### Cleanup

```typescript
parser.destroy();
```

## License

MIT
