# html-layout-parser

High-performance HTML layout parser compiled to WebAssembly. Supports multi-font management, CSS separation, and multiple output modes for Canvas rendering.

This is the unified package that supports all environments (Web, Worker, Node.js) with auto-detection.

## Installation

```bash
npm install html-layout-parser
# or
pnpm add html-layout-parser
# or
yarn add html-layout-parser
```

## Quick Start

```typescript
// Auto-detect environment
import { HtmlLayoutParser } from 'html-layout-parser';

// Or use environment-specific imports for better tree-shaking
import { HtmlLayoutParser } from 'html-layout-parser/web';
import { HtmlLayoutParser } from 'html-layout-parser/worker';
import { HtmlLayoutParser } from 'html-layout-parser/node';
```

### Basic Usage

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

const parser = new HtmlLayoutParser();
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
- **Cross-Environment**: Works in Web, Worker, and Node.js
- **Memory Safe**: Proper memory management with explicit cleanup
- **TypeScript Support**: Full type definitions included

## Environment-Specific Packages

For minimal bundle size, you can also use environment-specific packages:

- `html-layout-parser-web` - Web browser only
- `html-layout-parser-worker` - Web Worker only
- `html-layout-parser-node` - Node.js only

## API Reference

See the full documentation at [docs/](./docs/).

## License

MIT
