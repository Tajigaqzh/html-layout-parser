# HTML Layout Parser

[![npm version](https://img.shields.io/npm/v/html-layout-parser.svg)](https://www.npmjs.com/package/html-layout-parser)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-performance WebAssembly-based HTML layout parser with multi-font support, rich text attributes, and standardized JSON output. Perfect for Canvas rendering applications.

[中文文档](./README_ZH.md)

## Features

- 🚀 **High Performance** - WebAssembly-powered parsing up to 103,000+ chars/sec
- 🔤 **Multi-Font Support** - Load and manage multiple fonts with fallback chains
- 🎨 **Rich Text Attributes** - Full CSS text styling including shadows, decorations, transforms
- 📦 **Multiple Output Modes** - Full hierarchy, simple, flat, or row-based output
- 🎯 **Canvas-Ready** - Output format directly maps to Canvas 2D API
- 🌐 **Cross-Environment** - Works in Web, Worker, and Node.js environments
- 📝 **TypeScript First** - Complete type definitions with JSDoc documentation
- 💾 **Memory Efficient** - Strict memory management with monitoring and smart caching
- 🔧 **Debug Mode** - Built-in debugging support for development

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Environment-Specific Imports](#environment-specific-imports)
- [API Reference](#api-reference)
- [Output Modes](#output-modes)
- [CSS Separation](#css-separation)
- [Canvas Rendering](#canvas-rendering)
- [Memory Management](#memory-management)
- [Performance Optimization](#performance-optimization)
- [Smart Caching](#smart-caching)
- [Debug Mode](#debug-mode)
- [Large Document Handling](#large-document-handling)
- [Error Handling](#error-handling)
- [Platform-Specific Packages](#platform-specific-packages)
- [Building from Source](#building-from-source)
- [Performance Targets](#performance-targets)
- [Browser Support](#browser-support)
- [License](#license)

## Installation

```bash
# Using npm
npm install html-layout-parser

# Using yarn
yarn add html-layout-parser

# Using pnpm
pnpm add html-layout-parser
```

### Platform-Specific Packages

For smaller bundle sizes, you can install platform-specific packages:

```bash
# Web browser only
npm install html-layout-parser-web

# Web Worker only
npm install html-layout-parser-worker

# Node.js only
npm install html-layout-parser-node
```

## Quick Start

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

// Create and initialize parser
const parser = new HtmlLayoutParser();
await parser.init();

// Load a font (required before parsing)
const fontResponse = await fetch('/fonts/arial.ttf');
const fontData = new Uint8Array(await fontResponse.arrayBuffer());
const fontId = parser.loadFont(fontData, 'Arial');
parser.setDefaultFont(fontId);

// Parse HTML - fragments are automatically wrapped!
// You can pass either HTML fragments or complete documents
const layouts = parser.parse('<div style="color: blue;">Hello World</div>', {
  viewportWidth: 800
});

// Use the layouts for Canvas rendering
for (const char of layouts) {
  console.log(`${char.character} at (${char.x}, ${char.y})`);
}

// Clean up when done
parser.destroy();
```

### HTML Input Flexibility

The parser automatically handles both HTML fragments and complete documents:

```typescript
// ✅ HTML Fragment (automatically wrapped)
const layouts1 = parser.parse('<div>Hello</div>', { viewportWidth: 800 });

// ✅ Complete Document (used as-is)
const layouts2 = parser.parse(`
<!DOCTYPE html>
<html>
<head><style>div { color: red; }</style></head>
<body><div>Hello</div></body>
</html>
`, { viewportWidth: 800 });

// Both work perfectly! The parser detects and handles each case automatically.
```

## Environment-Specific Imports

```typescript
// Web browser
import { HtmlLayoutParser } from 'html-layout-parser/web';

// Web Worker
import { HtmlLayoutParser } from 'html-layout-parser/worker';

// Node.js
import { HtmlLayoutParser } from 'html-layout-parser/node';

// Auto-detect environment
import { HtmlLayoutParser } from 'html-layout-parser';
```

## API Reference

### Initialization

```typescript
const parser = new HtmlLayoutParser();
await parser.init();                    // Initialize WASM module
await parser.init('/custom/path.js');   // Custom WASM path

parser.isInitialized();                 // Check if ready
parser.getEnvironment();                // 'web' | 'worker' | 'node' | 'unknown'
parser.getVersion();                    // '2.0.0'
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
// [{ id: 1, name: 'Arial', memoryUsage: 245760 }, ...]

// Unload a specific font
parser.unloadFont(fontId);

// Clear all fonts
parser.clearAllFonts();
```

### HTML Parsing

```typescript
// Basic parsing (returns CharLayout[])
const layouts = parser.parse(html, { viewportWidth: 800 });

// With external CSS
const layouts = parser.parse(html, { 
  viewportWidth: 800,
  css: '.title { color: red; }'
});

// Full mode output (returns LayoutDocument)
const doc = parser.parse<'full'>(html, { 
  viewportWidth: 800, 
  mode: 'full' 
});

// With diagnostics and metrics
const result = parser.parseWithDiagnostics(html, { 
  viewportWidth: 800,
  enableMetrics: true
});

// Convenience method for CSS separation
const layouts = parser.parseWithCSS(html, css, { viewportWidth: 800 });
```

### Parse Options

```typescript
interface ParseOptions {
  viewportWidth: number;      // Required: viewport width in pixels
  viewportHeight?: number;    // Optional: viewport height
  mode?: OutputMode;          // 'flat' | 'byRow' | 'simple' | 'full'
  defaultFontId?: number;     // Default font ID for fallback
  enableMetrics?: boolean;    // Enable performance metrics
  maxCharacters?: number;     // Limit max characters processed
  timeout?: number;           // Timeout in milliseconds
  css?: string;               // External CSS string
  isDebug?: boolean;          // Enable debug logging
}
```

### Memory Management

```typescript
// Get total memory usage in bytes
const bytes = parser.getTotalMemoryUsage();

// Check if memory exceeds 50MB threshold
if (parser.checkMemoryThreshold()) {
  console.warn('Memory threshold exceeded');
}

// Get detailed memory metrics
const metrics = parser.getMemoryMetrics();
// { totalMemoryUsage: 15728640, fontCount: 3, fonts: [...] }

// Destroy parser and release all resources
parser.destroy();
```

### Cache Management

```typescript
// Get cache statistics
const stats = parser.getCacheStats();
// { hits: 237, misses: 23, entries: 41, hitRate: 0.912, memoryUsage: 2316 }

// Reset cache statistics
parser.resetCacheStats();

// Clear cache manually
parser.clearCache();

// Get detailed metrics including cache
const metrics = parser.getDetailedMetrics();
```

## Output Modes

The parser supports four output modes:

| Mode | Type | Description | Use Case |
|------|------|-------------|----------|
| `flat` | `CharLayout[]` | Flat array of characters | Simple rendering, v1 compatibility |
| `byRow` | `Row[]` | Characters grouped by row | Line-by-line rendering |
| `simple` | `SimpleOutput` | Lines with characters | Basic structure with line info |
| `full` | `LayoutDocument` | Complete hierarchy | Complex layouts, debugging |

```typescript
// Flat mode (default) - fastest
const chars = parser.parse(html, { viewportWidth: 800 });

// By row mode
const rows = parser.parse<'byRow'>(html, { viewportWidth: 800, mode: 'byRow' });

// Simple mode
const simple = parser.parse<'simple'>(html, { viewportWidth: 800, mode: 'simple' });

// Full mode - most detailed
const doc = parser.parse<'full'>(html, { viewportWidth: 800, mode: 'full' });
```

### CharLayout Structure

```typescript
interface CharLayout {
  character: string;          // The character
  x: number;                  // X position (pixels)
  y: number;                  // Y position (pixels)
  width: number;              // Character width
  height: number;             // Character height
  baseline: number;           // Baseline Y position
  
  // Font properties
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: string;
  fontId: number;
  
  // Colors (RGBA format: #RRGGBBAA)
  color: string;
  backgroundColor: string;
  opacity: number;            // 0-1
  
  // Text decoration
  textDecoration: {
    underline: boolean;
    overline: boolean;
    lineThrough: boolean;
    color: string;
    style: string;            // 'solid' | 'double' | 'dotted' | 'dashed' | 'wavy'
    thickness: number;
  };
  
  // Spacing
  letterSpacing: number;
  wordSpacing: number;
  
  // Shadow (array for multiple shadows)
  textShadow: Array<{
    offsetX: number;
    offsetY: number;
    blurRadius: number;
    color: string;
  }>;
  
  // Transform
  transform: {
    scaleX: number;
    scaleY: number;
    skewX: number;
    skewY: number;
    rotate: number;
  };
  
  direction: string;          // 'ltr' | 'rtl'
}
```

## CSS Separation

Separate HTML content from CSS styles for flexible theming:

```typescript
// HTML content (no inline styles)
const html = `
  <div class="container">
    <h1 class="title">Welcome</h1>
    <p class="content">Hello World</p>
  </div>
`;

// CSS styles (separate)
const css = `
  .title { color: #333; font-size: 24px; font-weight: bold; }
  .content { color: #666; font-size: 16px; }
`;

// Parse with separated CSS
const layouts = parser.parse(html, { viewportWidth: 800, css });

// Or use convenience method
const layouts = parser.parseWithCSS(html, css, { viewportWidth: 800 });
```

### Theme Switching Example

```typescript
const themes = {
  light: `.title { color: #1a1a1a; } .content { color: #333; }`,
  dark: `.title { color: #ffffff; } .content { color: #ccc; }`
};

// Switch themes dynamically
const layouts = parser.parse(html, { 
  viewportWidth: 800, 
  css: themes.dark 
});
```

## Canvas Rendering

The output format is designed for direct Canvas 2D API usage:

```typescript
function renderToCanvas(ctx: CanvasRenderingContext2D, layouts: CharLayout[]) {
  for (const char of layouts) {
    // Set font
    ctx.font = `${char.fontStyle} ${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
    
    // Draw background
    if (char.backgroundColor !== '#00000000') {
      ctx.fillStyle = char.backgroundColor;
      ctx.fillRect(char.x, char.y, char.width, char.height);
    }
    
    // Apply text shadow
    if (char.textShadow.length > 0) {
      const shadow = char.textShadow[0];
      ctx.shadowOffsetX = shadow.offsetX;
      ctx.shadowOffsetY = shadow.offsetY;
      ctx.shadowBlur = shadow.blurRadius;
      ctx.shadowColor = shadow.color;
    }
    
    // Draw text
    ctx.fillStyle = char.color;
    ctx.globalAlpha = char.opacity;
    ctx.fillText(char.character, char.x, char.baseline);
    
    // Reset
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    
    // Draw underline
    if (char.textDecoration.underline) {
      ctx.strokeStyle = char.textDecoration.color || char.color;
      ctx.lineWidth = char.textDecoration.thickness;
      ctx.beginPath();
      ctx.moveTo(char.x, char.baseline + 2);
      ctx.lineTo(char.x + char.width, char.baseline + 2);
      ctx.stroke();
    }
  }
}
```

## Memory Management

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

### Font Memory Best Practices

```typescript
// ✅ GOOD: Load once, use many times
const fontId = parser.loadFont(fontData, 'Arial');
parser.setDefaultFont(fontId);

for (const html of documents) {
  const layouts = parser.parse(html, { viewportWidth: 800 });
}

parser.unloadFont(fontId);  // Unload when done
```

```typescript
// ❌ BAD: Loading/unloading for each parse
for (const html of documents) {
  const fontId = parser.loadFont(fontData, 'Arial');  // Wasteful!
  const layouts = parser.parse(html, { viewportWidth: 800 });
  parser.unloadFont(fontId);  // Wasteful!
}
```

### Memory Monitoring

```typescript
// Check memory usage
const metrics = parser.getMemoryMetrics();
if (metrics) {
  console.log(`Total: ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Fonts: ${metrics.fontCount}`);
  
  for (const font of metrics.fonts) {
    console.log(`  ${font.name}: ${(font.memoryUsage / 1024).toFixed(1)} KB`);
  }
}

// Check threshold (50MB)
if (parser.checkMemoryThreshold()) {
  console.warn('Memory exceeds 50MB - consider clearing unused fonts');
}
```

### Memory Limits

| Resource | Limit |
|----------|-------|
| Total memory | < 50MB |
| Per font | ≈ font file size (e.g., 8MB TTF → ~8MB memory) |
| Temporary data | Cleared after each parse |

## Performance Optimization

### 1. Reuse Parser Instances

```typescript
// ✅ GOOD: Reuse parser
const parser = new HtmlLayoutParser();
await parser.init();
const fontId = parser.loadFont(fontData, 'Arial');

for (const html of documents) {
  const layouts = parser.parse(html, { viewportWidth: 800 });
}

parser.destroy();
```

### 2. Use Appropriate Output Mode

```typescript
// Use 'flat' for simple rendering (fastest)
const chars = parser.parse(html, { viewportWidth: 800, mode: 'flat' });

// Only use 'full' when you need the hierarchy
const doc = parser.parse<'full'>(html, { viewportWidth: 800, mode: 'full' });
```

### 3. Batch Processing with Shared Fonts

```typescript
// Load fonts once
const arialId = parser.loadFont(arialData, 'Arial');
const timesId = parser.loadFont(timesData, 'Times New Roman');
parser.setDefaultFont(arialId);

// Process documents (fonts are shared)
const results = documents.map(html => 
  parser.parse(html, { viewportWidth: 800 })
);
```

### 4. Monitor Performance

```typescript
const result = parser.parseWithDiagnostics(html, {
  viewportWidth: 800,
  enableMetrics: true
});

if (result.metrics) {
  console.log(`Parse time: ${result.metrics.parseTime}ms`);
  console.log(`Layout time: ${result.metrics.layoutTime}ms`);
  console.log(`Speed: ${result.metrics.charsPerSecond} chars/sec`);
}
```

## Smart Caching

v2.0 includes an intelligent font metrics cache that significantly improves performance:

### Cache Performance

| Metric | Result |
|--------|--------|
| Cache hit rate (repeated parsing) | **91.2%** |
| Cache hit rate (large documents) | **100%** |
| Performance improvement | **45%** faster on repeated content |

### How It Works

- Character width measurements are cached per (fontId, fontSize, codepoint)
- Cache is automatically populated during parsing
- Cache is automatically cleared when fonts are unloaded
- No manual management required

```typescript
// Get cache statistics
const stats = parser.getCacheStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`Entries: ${stats.entries}`);
```

## Debug Mode

Enable debug logging to see detailed parsing information:

```typescript
// Enable via parse options
const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: true
});

// Output includes:
// [HtmlLayoutParser] HTML parsing started (length=1234)
// [HtmlLayoutParser] HTML parsing completed (time=5.2ms)
// [HtmlLayoutParser] Layout calculation started (viewport=800x600)
// [HtmlLayoutParser] Layout calculation completed (time=12.3ms, chars=456)
// [HtmlLayoutParser] Memory usage: 15.2MB (fonts=12MB, buffers=3.2MB)
```

Debug logs include:
- Font loading/unloading events
- HTML/CSS parsing timing
- Layout calculation timing
- Serialization timing
- Memory usage information

## Large Document Handling

### Limit Document Size

```typescript
// Set maximum characters to prevent processing huge documents
const layouts = parser.parse(html, {
  viewportWidth: 800,
  maxCharacters: 10000
});
```

### Use Timeout for Safety

```typescript
// Set timeout to prevent hanging on complex documents
const layouts = parser.parse(html, {
  viewportWidth: 800,
  timeout: 5000  // 5 seconds
});
```

### Chunked Processing

For very large documents, consider processing in chunks:

```typescript
function parseInChunks(html: string, chunkSize: number = 5000) {
  const results = [];
  let offset = 0;
  
  while (offset < html.length) {
    const chunk = html.slice(offset, offset + chunkSize);
    const layouts = parser.parse(chunk, { 
      viewportWidth: 800,
      maxCharacters: chunkSize
    });
    results.push(layouts);
    offset += chunkSize;
  }
  
  return results;
}
```

## Error Handling

```typescript
const result = parser.parseWithDiagnostics(html, { viewportWidth: 800 });

if (result.success) {
  console.log('Parsed successfully');
  // Use result.data
} else {
  for (const error of result.errors || []) {
    console.error(`[${error.code}] ${error.message}`);
    if (error.line) {
      console.error(`  at line ${error.line}, column ${error.column}`);
    }
  }
}

// Check warnings even on success
if (result.warnings?.length) {
  for (const warning of result.warnings) {
    console.warn(`Warning: ${warning.message}`);
  }
}
```

### Error Codes

| Code Range | Category |
|------------|----------|
| 0 | Success |
| 1xxx | Input validation errors |
| 2xxx | Font-related errors |
| 3xxx | Parsing errors |
| 4xxx | Memory errors |
| 5xxx | Internal errors |

## Platform-Specific Packages

For smaller bundle sizes, use platform-specific packages:

```typescript
// Web browser only
import { HtmlLayoutParser } from 'html-layout-parser-web';

// Web Worker only
import { HtmlLayoutParser } from 'html-layout-parser-worker';

// Node.js only
import { HtmlLayoutParser } from 'html-layout-parser-node';
```

### Node.js Specific Features

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/node';

const parser = new HtmlLayoutParser();
await parser.init();

// Load font from file path (Node.js only)
const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
```

## Building from Source

### Prerequisites

- [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html) installed and activated
- Node.js 16+
- pnpm 8+

### Build Steps

```bash
# Clone the repository
git clone <repository-url>
cd litehtml/html-layout-parser

# Install dependencies
pnpm install

# Build WASM module
./build.sh

# Build TypeScript packages
pnpm run build:packages

# Run tests
pnpm test
```

## Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| Parse speed | > 1000 chars/sec | 9,442 - 129,121 chars/sec |
| Memory usage | < 50MB | ~8MB (1 font @ 8MB), ~40MB (5 fonts) ✅ |
| WASM size (full) | < 2.5MB | 2.25MB ✅ |
| Startup time | < 100ms | ~7ms (warm), ~17ms (cold) ✅ |
| Cache hit rate | > 80% | 91.2% ✅ |

### Detailed Performance Benchmarks

Benchmarks from `pnpm bench:performance -- --warmup=10 --iterations=50` (mode=flat, viewport=800),
font `examples/font/aliBaBaFont65.ttf`. Environment: macOS 26.2 (arm64), Apple M4, 16 GB RAM,
Node v25.2.1, pnpm 8.15.0.

| Document Size | Parse Speed | Total Time |
|---------------|-------------|------------|
| Simple (11 chars) | 9,442 chars/sec | 1.17ms |
| Medium (480 chars) | 105,588 chars/sec | 4.55ms |
| Large (7,200 chars) | 126,155 chars/sec | 57.07ms |
| Very Large (24,196 chars) | 129,121 chars/sec | 187.39ms |

> **Note**: Memory usage is approximately equal to the sum of loaded font file sizes. For example, an 8MB TTF font file will use ~8MB of memory when loaded.

## Browser Support

- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

## Node.js Support

- Node.js 16+

## Project Structure

```
html-layout-parser/
├── src/                          # C++ source files
│   ├── html_layout_parser.cpp    # Main API entry point
│   ├── multi_font_manager.cpp/h  # Font management
│   ├── wasm_container.cpp/h      # Container implementation
│   ├── json_serializer.cpp/h     # JSON output
│   └── font_metrics_cache.cpp/h  # Smart caching
├── packages/                     # NPM packages
│   ├── html-layout-parser/       # Main package
│   ├── html-layout-parser-web/   # Web-specific
│   ├── html-layout-parser-worker/# Worker-specific
│   └── html-layout-parser-node/  # Node.js-specific
├── tests/                        # Test files
├── docs/                         # Documentation
├── playground/                   # Interactive demo
├── build.sh                      # Build script
└── README.md                     # This file
```

## Related Documentation

- [📚 完整文档站点](./docs/) - VitePress 文档站点
- [🚀 快速开始](./docs/guide/getting-started.md) - 快速上手指南
- [📖 API 参考](./docs/api/) - 完整 API 文档
- [💾 内存管理指南](./docs/guide/memory-management.md) - 内存优化指南
- [⚡ 性能指南](./docs/guide/performance.md) - 性能优化技巧
- [🌐 Web 示例](./docs/examples/web.md) - 浏览器使用示例
- [🔧 Node.js 示例](./docs/examples/node.md) - 服务端使用示例
- [👷 Worker 示例](./docs/examples/worker.md) - Web Worker 示例

### 文档开发

```bash
# 启动文档开发服务器
cd docs && pnpm dev

# 构建文档
cd docs && pnpm build

# 预览构建结果
cd docs && pnpm preview
```

## Differences from v1

v2 is an independent project with significant improvements:

| Feature | v1 | v2 |
|---------|----|----|
| Font support | Single font | Multi-font with fallback |
| Output modes | 2 (flat, byRow) | 4 (flat, byRow, simple, full) |
| CSS separation | ❌ | ✅ |
| Memory management | Basic | Strict with monitoring |
| TypeScript | Partial | Complete |
| Cross-environment | Limited | Full (Web/Worker/Node.js) |
| Smart caching | ❌ | ✅ |
| Debug mode | ❌ | ✅ |

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a pull request.

## Support

- [GitHub Issues](https://github.com/Tajigaqzh/html-layout-parser/issues)
- [Documentation](./docs/README.md)
