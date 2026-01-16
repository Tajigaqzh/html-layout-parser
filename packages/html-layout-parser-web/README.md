# html-layout-parser-web

HTML Layout Parser for Web browser environments - compiled to WebAssembly.

This is a standalone package for Web browser main thread environments. For other environments, see:
- `html-layout-parser-worker` - Web Worker environments
- `html-layout-parser-node` - Node.js environments
- `html-layout-parser` - Unified package with auto-detection

## Installation

```bash
npm install html-layout-parser-web
```

## Quick Start

```typescript
import { HtmlLayoutParser } from 'html-layout-parser-web';

// Create parser instance
const parser = new HtmlLayoutParser();

// Initialize WASM module
await parser.init('./html_layout_parser.js');

// Load a font
const fontResponse = await fetch('./fonts/arial.ttf');
const fontData = new Uint8Array(await fontResponse.arrayBuffer());
const fontId = parser.loadFont(fontData, 'Arial');
parser.setDefaultFont(fontId);

// Parse HTML
const layouts = parser.parse('<div style="color: red;">Hello World</div>', {
  viewportWidth: 800
});

console.log(layouts);
// [{ character: 'H', x: 0, y: 0, width: 10, height: 16, ... }, ...]

// Clean up
parser.destroy();
```

## Features

- **Multi-font Management**: Load multiple fonts, set default font, font fallback
- **CSS Separation**: Pass HTML and CSS separately for dynamic theming
- **Multiple Output Modes**: flat, byRow, simple, full
- **Canvas-Ready Output**: All values in pixels, ready for Canvas 2D rendering
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

### Output Modes

- **flat**: Array of CharLayout objects (default)
- **byRow**: Characters grouped by rows
- **simple**: Lines with characters
- **full**: Complete document structure with blocks, lines, runs

### Cleanup

```typescript
parser.destroy();
```

## Canvas Rendering Example

```typescript
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser-web';

const parser = new HtmlLayoutParser();
await parser.init();

// Load font and parse HTML
const fontId = parser.loadFont(fontData, 'Arial');
parser.setDefaultFont(fontId);

const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });

// Render to Canvas
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

for (const char of layouts as CharLayout[]) {
  ctx.font = `${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
  ctx.fillStyle = char.color;
  ctx.fillText(char.character, char.x, char.baseline);
}

parser.destroy();
```

## License

MIT
