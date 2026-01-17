# HTML Layout Parser

<div align="center">

[![npm version](https://img.shields.io/npm/v/html-layout-parser.svg)](https://www.npmjs.com/package/html-layout-parser)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/html-layout-parser.svg)](https://www.npmjs.com/package/html-layout-parser)

**WebAssembly-powered HTML/CSS layout engine for Canvas text rendering**

Extract character-level layout data with multi-font support, rich text attributes, and standardized JSON output

[� Documentatinon](https://tajigaqzh.github.io/html-layout-parser/) • [🚀 Quick Start](#quick-start) • [� Examples](https://tajigaqzh.github.io/html-layout-parser/examples/) • [🌐 中文文档](./README_ZH.md)

</div>

---

## ✨ Features

- � **High Performance** - WebAssembly-powered parsing up to **129,000+ chars/sec**
- � **Multi-Font tSupport** - Load and manage multiple fonts with automatic fallback chains
- 🎨 **Rich Text Attributes** - Full CSS text styling (decorations, transforms, opacity)
- 📦 **Multiple Output Modes** - Flat, byRow, simple, or full hierarchical output
- 🎯 **Canvas-Ready** - Output format directly maps to Canvas 2D API
- 🌐 **Cross-Environment** - Works in Web, Worker, and Node.js with unified API
- 📝 **TypeScript First** - Complete type definitions with JSDoc documentation
- 💾 **Memory Efficient** - Strict memory management with smart caching (91.2% hit rate)

## 📦 Installation

```bash
npm install html-layout-parser
```

### Platform-Specific Packages (Smaller Bundle Size)

```bash
# Web browser only
npm install html-layout-parser-web

# Web Worker only
npm install html-layout-parser-worker

# Node.js only
npm install html-layout-parser-node
```

## 🚀 Quick Start

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

// 1. Create and initialize parser
const parser = new HtmlLayoutParser();
await parser.init();

// 2. Load a font (required)
const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
const fontId = parser.loadFont(new Uint8Array(fontData), 'Arial');
parser.setDefaultFont(fontId);

// 3. Parse HTML with CSS
const layouts = parser.parse('<div class="title">Hello World</div>', {
  viewportWidth: 800,
  css: '.title { color: blue; font-size: 24px; font-weight: bold; }'
});

// 4. Render to Canvas
const ctx = canvas.getContext('2d');
for (const char of layouts) {
  ctx.font = `${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
  ctx.fillStyle = char.color;
  ctx.fillText(char.character, char.x, char.baseline);
}

// 5. Clean up when done
parser.destroy();
```

## 💡 Key Concepts

### HTML Input Flexibility

The parser automatically handles both HTML fragments and complete documents:

```typescript
// ✅ HTML Fragment (automatically wrapped)
parser.parse('<div>Hello</div>', { viewportWidth: 800 });

// ✅ Complete Document (used as-is)
parser.parse(`
<!DOCTYPE html>
<html>
<head><style>div { color: red; }</style></head>
<body><div>Hello</div></body>
</html>
`, { viewportWidth: 800 });
```

### CSS Separation for Theming

Separate HTML content from CSS styles for flexible theming:

```typescript
const html = '<h1 class="title">Welcome</h1><p class="content">Hello World</p>';

const themes = {
  light: '.title { color: #1a1a1a; } .content { color: #333; }',
  dark: '.title { color: #ffffff; } .content { color: #ccc; }'
};

// Switch themes dynamically
const layouts = parser.parse(html, { 
  viewportWidth: 800, 
  css: themes.dark 
});
```

### Multiple Output Modes

Choose the output format that fits your needs:

```typescript
// Flat mode (default) - fastest, simple array
const chars = parser.parse(html, { viewportWidth: 800 });

// By row mode - characters grouped by row
const rows = parser.parse<'byRow'>(html, { viewportWidth: 800, mode: 'byRow' });

// Simple mode - lines with characters
const simple = parser.parse<'simple'>(html, { viewportWidth: 800, mode: 'simple' });

// Full mode - complete DOM hierarchy
const doc = parser.parse<'full'>(html, { viewportWidth: 800, mode: 'full' });
```

## 📊 Performance

Benchmarks from `pnpm bench:performance` (Apple M4, 16GB RAM, Node v25.2.1):

| Document Size | Parse Speed | Total Time |
|---------------|-------------|------------|
| Simple (11 chars) | 9,442 chars/sec | 1.17ms |
| Medium (480 chars) | 105,588 chars/sec | 4.55ms |
| Large (7,200 chars) | 126,155 chars/sec | 57.07ms |
| Very Large (24,196 chars) | 129,121 chars/sec | 187.39ms |

### System Resources

| Metric | Target | Actual |
|--------|--------|--------|
| Parse Speed | > 1,000 chars/sec | 9,442 - 129,121 chars/sec ✅ |
| Memory Usage | < 50MB | ~8MB (1 font), ~40MB (5 fonts) ✅ |
| WASM Size | < 2.5MB | 2.25MB ✅ |
| Startup Time | < 100ms | ~7ms (warm), ~17ms (cold) ✅ |
| Cache Hit Rate | > 80% | 91.2% ✅ |

## 🌐 Cross-Environment Support

```typescript
// Auto-detect environment
import { HtmlLayoutParser } from 'html-layout-parser';

// Or use platform-specific imports for smaller bundle size
import { HtmlLayoutParser } from 'html-layout-parser/web';    // Web browser
import { HtmlLayoutParser } from 'html-layout-parser/worker'; // Web Worker
import { HtmlLayoutParser } from 'html-layout-parser/node';   // Node.js
```

### Node.js Specific Features

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/node';

const parser = new HtmlLayoutParser();
await parser.init();

// Load font from file path (Node.js only)
const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
```

## 📝 CharLayout Output Structure

Each character includes comprehensive layout and styling information:

```typescript
interface CharLayout {
  // Position and size
  character: string;
  x: number;
  y: number;
  width: number;
  height: number;
  baseline: number;
  
  // Font properties
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: string;
  
  // Colors (RGBA format: #RRGGBBAA)
  color: string;
  backgroundColor: string;
  opacity: number;
  
  // Text decoration
  textDecoration: {
    underline: boolean;
    overline: boolean;
    lineThrough: boolean;
    color: string;
    style: 'solid' | 'double' | 'dotted' | 'dashed' | 'wavy';
    thickness: number;
  };
  
  // Spacing
  letterSpacing: number;
  wordSpacing: number;
  
  // Transform
  transform: {
    scaleX: number;
    scaleY: number;
    skewX: number;
    skewY: number;
    rotate: number;
  };
  
  direction: 'ltr' | 'rtl';
}
```

## 💾 Memory Management

### ⚠️ Important: Always Clean Up

The parser uses WebAssembly memory that must be explicitly released:

```typescript
const parser = new HtmlLayoutParser();
await parser.init();

try {
  const fontId = parser.loadFont(fontData, 'Arial');
  const layouts = parser.parse(html, { viewportWidth: 800 });
  // Use layouts...
} finally {
  parser.destroy();  // Always destroy when done
}
```

### Memory Monitoring

```typescript
// Get memory metrics
const metrics = parser.getMemoryMetrics();
console.log(`Total: ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
console.log(`Fonts: ${metrics.fontCount}`);

// Check if memory exceeds 50MB threshold
if (parser.checkMemoryThreshold()) {
  console.warn('Memory threshold exceeded');
}

// Get cache statistics
const stats = parser.getCacheStats();
console.log(`Cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
```

## 🔧 API Overview

### Initialization

```typescript
const parser = new HtmlLayoutParser();
await parser.init();                    // Initialize WASM module
await parser.init('/custom/path.js');   // Custom WASM path
```

### Font Management

```typescript
// Load font from binary data
const fontId = parser.loadFont(fontData: Uint8Array, fontName: string);

// Load font from file (Node.js only)
const fontId = await parser.loadFontFromFile('/path/to/font.ttf', 'FontName');

// Set default font for fallback
parser.setDefaultFont(fontId);

// Get all loaded fonts
const fonts = parser.getLoadedFonts();

// Unload a specific font
parser.unloadFont(fontId);
```

### HTML Parsing

```typescript
// Basic parsing
const layouts = parser.parse(html, { viewportWidth: 800 });

// With external CSS
const layouts = parser.parse(html, { 
  viewportWidth: 800,
  css: '.title { color: red; }'
});

// With diagnostics and metrics
const result = parser.parseWithDiagnostics(html, { 
  viewportWidth: 800,
  enableMetrics: true
});
```

## 📚 Documentation

- [📖 Full Documentation](https://tajigaqzh.github.io/html-layout-parser/)
- [🚀 Getting Started Guide](https://tajigaqzh.github.io/html-layout-parser/guide/getting-started)
- [📘 API Reference](https://tajigaqzh.github.io/html-layout-parser/api/)
- [💡 Examples](https://tajigaqzh.github.io/html-layout-parser/examples/)
- [⚡ Performance Guide](https://tajigaqzh.github.io/html-layout-parser/guide/performance)
- [💾 Memory Management](https://tajigaqzh.github.io/html-layout-parser/guide/memory-management)

## 🛠️ Building from Source

### Prerequisites

- [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html)
- Node.js 16+
- pnpm 8+

### Build Steps

```bash
# Clone the repository
git clone https://github.com/Tajigaqzh/html-layout-parser.git
cd html-layout-parser

# Install dependencies
pnpm install

# Build WASM module
./build.sh

# Build TypeScript packages
pnpm run build:packages

# Run tests
pnpm test
```

## 🌍 Browser & Node.js Support

- **Browsers**: Chrome 57+, Firefox 52+, Safari 11+, Edge 16+
- **Node.js**: 16+

## 📦 Project Structure

```
html-layout-parser/
├── src/                          # C++ source files
│   ├── html_layout_parser.cpp    # Main API entry point
│   ├── multi_font_manager.cpp/h  # Font management
│   ├── font_metrics_cache.cpp/h  # Smart caching
│   └── json_serializer.cpp/h     # JSON output
├── packages/                     # NPM packages
│   ├── html-layout-parser/       # Main package
│   ├── html-layout-parser-web/   # Web-specific
│   ├── html-layout-parser-worker/# Worker-specific
│   └── html-layout-parser-node/  # Node.js-specific
├── tests/                        # Test files
├── docs/                         # VitePress documentation
├── playground/                   # Interactive demo
└── build.sh                      # Build script
```

## 🆚 Differences from v1 (Unreleased)

v0.0.1 is an independent project with significant improvements over the unreleased v1:

| Feature | v1 (Unreleased) | v0.0.1 |
|---------|----|----|
| Font support | Single font | Multi-font with fallback |
| Output modes | 2 (flat, byRow) | 4 (flat, byRow, simple, full) |
| CSS separation | ❌ | ✅ |
| Memory management | Basic | Strict with monitoring |
| TypeScript | Partial | Complete |
| Cross-environment | Limited | Full (Web/Worker/Node.js) |
| Smart caching | ❌ | ✅ (91.2% hit rate) |
| Debug mode | ❌ | ✅ |

## 📄 License

MIT License - see [LICENSE](https://github.com/Tajigaqzh/html-layout-parser/blob/main/LICENSE) file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💬 Support

- [📖 Documentation](https://tajigaqzh.github.io/html-layout-parser/)
- [🐛 Report Issues](https://github.com/Tajigaqzh/html-layout-parser/issues)
- [💡 Discussions](https://github.com/Tajigaqzh/html-layout-parser/discussions)

---

<div align="center">

Made with ❤️ by [Tajigaqzh](https://github.com/Tajigaqzh)

If this project helps you, please consider giving it a ⭐️

</div>
