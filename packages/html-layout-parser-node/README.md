# html-layout-parser-node

HTML Layout Parser for Node.js environments - compiled to WebAssembly.

This is a standalone package for Node.js environments. Includes additional support for loading fonts from file paths. For other environments, see:
- `html-layout-parser-web` - Web browser main thread
- `html-layout-parser-worker` - Web Worker environments
- `html-layout-parser` - Unified package with auto-detection

## Installation

```bash
npm install html-layout-parser-node
```

## Quick Start

```typescript
import { HtmlLayoutParser } from 'html-layout-parser-node';

// Create parser instance
const parser = new HtmlLayoutParser();

// Initialize WASM module
await parser.init('./html_layout_parser.js');

// Load font from file (Node.js specific)
const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
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

- **File-based Font Loading**: Load fonts directly from file paths
- **Batch Processing**: Process multiple HTML files efficiently
- **Multi-font Management**: Load multiple fonts, set default font, font fallback
- **CSS Separation**: Pass HTML and CSS separately for dynamic theming
- **Multiple Output Modes**: flat, byRow, simple, full
- **Memory Safe**: Proper memory management with explicit cleanup

## Node.js Specific Features

### Load Font from File

```typescript
// Load single font
const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');

// Load multiple fonts
const fontIds = await parser.loadFontsFromFiles([
  { path: './fonts/arial.ttf', name: 'Arial' },
  { path: './fonts/times.ttf', name: 'Times New Roman' },
  { path: './fonts/courier.ttf', name: 'Courier New' }
]);
```

### Batch Processing

```typescript
import { HtmlLayoutParser } from 'html-layout-parser-node';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

const parser = new HtmlLayoutParser();
await parser.init();

// Load font once
const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
parser.setDefaultFont(fontId);

// Process all HTML files in a directory
const htmlDir = './html-files';
const files = await readdir(htmlDir);
const htmlFiles = files.filter(f => f.endsWith('.html'));

const results = await Promise.all(
  htmlFiles.map(async (file) => {
    const html = await readFile(join(htmlDir, file), 'utf-8');
    return {
      file,
      layouts: parser.parse(html, { viewportWidth: 800 })
    };
  })
);

console.log(`Processed ${results.length} files`);
parser.destroy();
```

### Server-side Rendering

```typescript
import { HtmlLayoutParser } from 'html-layout-parser-node';
import express from 'express';

const app = express();
const parser = new HtmlLayoutParser();

// Initialize once at startup
await parser.init();
const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
parser.setDefaultFont(fontId);

app.post('/api/parse', express.json(), (req, res) => {
  const { html, viewportWidth = 800 } = req.body;
  
  try {
    const layouts = parser.parse(html, { viewportWidth });
    res.json({ success: true, layouts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cleanup on shutdown
process.on('SIGTERM', () => {
  parser.destroy();
  process.exit(0);
});

app.listen(3000);
```

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

// Load font from file path (Node.js only)
const fontId = await parser.loadFontFromFile(fontPath: string, fontName: string): Promise<number>;

// Load multiple fonts from files
const fontIds = await parser.loadFontsFromFiles(fonts: Array<{ path: string; name: string }>): Promise<number[]>;

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

## Memory Management

For long-running Node.js applications, proper memory management is important:

```typescript
// Load fonts once at startup
const parser = new HtmlLayoutParser();
await parser.init();
const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
parser.setDefaultFont(fontId);

// Process many documents (fonts are reused)
for (const html of htmlDocuments) {
  const layouts = parser.parse(html, { viewportWidth: 800 });
  // Process layouts...
}

// Cleanup when done
parser.destroy();
```

## License

MIT
