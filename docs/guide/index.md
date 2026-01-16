# What is HTML Layout Parser?

HTML Layout Parser is a high-performance WebAssembly-based library that parses HTML/CSS and extracts character-level layout information. It's designed for applications that need to render text on Canvas, such as:

- **Rich text editors** - Render formatted text with precise positioning
- **Document viewers** - Display HTML content on Canvas
- **Image generators** - Create images from HTML templates
- **Game UIs** - Render styled text in game engines
- **PDF generators** - Convert HTML to PDF with accurate layout

## Layout Accuracy

The parser provides **high-fidelity layout calculation** that closely matches native HTML rendering. Built on [litehtml](https://github.com/litehtml/litehtml), a production-grade HTML/CSS rendering engine, it accurately handles:

- ✅ Text wrapping and line breaking
- ✅ Font metrics and character spacing  
- ✅ CSS box model (margins, padding, borders)
- ✅ Inline and block element positioning
- ✅ Multi-line text alignment
- ✅ Tables and floating elements
- ✅ Absolute and relative positioning

### Cross-Platform Consistency

**A key advantage over browser Range API, Canvas `measureText()`, and SVG foreignObject**: The parser provides **100% consistent results across all platforms and browsers**. 

Unlike browser-based approaches which can vary between:
- Chrome vs Safari vs Firefox
- Windows vs macOS vs Linux
- Different browser versions
- Different WebView implementations

The WASM-based parser produces **identical character positions** everywhere:

```typescript
// ❌ Browser Range API - inconsistent results
const range = document.createRange();
range.selectNode(textNode);
const rect = range.getBoundingClientRect();
// Different results on Chrome vs Safari!

// ❌ Canvas measureText - no DOM layout, metrics vary across platforms
const width = ctx.measureText(text).width;

// ❌ SVG foreignObject - blurry small fonts, black backgrounds on Android
const svg = `<svg><foreignObject>${html}</foreignObject></svg>`;
// Blurry when zoomed, artifacts on mobile!

// ✅ HTML Layout Parser - consistent everywhere
const layouts = parser.parse(html, { viewportWidth: 800 });
// Same results on all platforms!
```

This makes it ideal for:
- **Server-side rendering** - Generate layouts in Node.js that match client-side
- **Cross-platform apps** - Consistent rendering across desktop and mobile
- **Testing** - Predictable results for automated tests
- **Canvas rendering** - No platform-specific adjustments needed
- **Web Workers** - Full support for background processing (unlike SVG foreignObject)
- **Zoomable interfaces** - Better text quality when zoomed (unlike SVG foreignObject)

::: tip Layout Fidelity
The parser excels at **text-focused layouts** where accuracy is critical. For complex layouts with:
- Advanced CSS features (flexbox, grid, transforms)
- Sub-pixel rendering precision
- Platform-specific font rendering

Minor visual differences may occur. However, for the primary use case of **text rendering on Canvas**, the layout is highly accurate and production-ready.
:::

## Key Features

### 🚀 WebAssembly-Powered
Built on the litehtml C++ library and compiled to WebAssembly via Emscripten, delivering near-native performance.

### 🔤 Multi-Font Management
- Load multiple TTF/OTF/WOFF fonts
- Automatic font fallback chains
- Memory-efficient font storage
- Font metrics caching

### 📦 Flexible Output Modes
- **flat**: Flat character array for simple rendering
- **byRow**: Characters grouped by row for line-by-line processing
- **simple**: Simplified structure with basic document info
- **full**: Complete hierarchical structure with pages, blocks, lines, runs

### 🎨 Rich Text Attributes
- Font styles: family, size, weight, style
- Colors: text color, background color, opacity
- Decorations: underline, strikethrough, overline
- Shadows: multiple text shadows
- Transforms: scale, skew, rotate

### 🌐 Cross-Environment Support
- Web browsers
- Web Workers (with OffscreenCanvas support)
- Node.js

## How It Works

```
HTML + CSS → litehtml Parse → Layout Calculation → Character Layout Data → Canvas Rendering
```

1. **Input**: HTML string and optional CSS
2. **Parse**: litehtml parses HTML and CSS
3. **Layout**: Calculate precise position for each character
4. **Output**: Return character layout array with position, style, etc.
5. **Render**: Use layout data to draw on Canvas

## Use Cases

- **Rich Text Editors**: Render formatted text on Canvas
- **Game UI**: Render text content in games
- **Chart Labels**: Precisely position text in charts
- **PDF Generation**: Calculate text layout for PDF generation
- **Server-Side Rendering**: Pre-calculate text layout in Node.js

## Performance Metrics

| Metric | Value |
|--------|-------|
| Parse Speed | 9,442 - 129,121 chars/sec |
| Memory Usage | Per font ≈ font file size |
| WASM Size | 2.25MB |
| Startup Time | ~7ms (warm), ~17ms (cold) |
| Cache Hit Rate | 91.2% |

## Next Steps

- [Getting Started](/guide/getting-started) - Install and create your first parser
- [Installation](/guide/installation) - Detailed installation options
- [Compare with Browser Range API](/guide/vs-range-api) - Why Range API is inconsistent
- [Compare with Canvas measureText](/guide/vs-measure-text) - Why measureText diverges from DOM layout
- [Compare with SVG foreignObject](/guide/vs-svg-foreignobject) - Why foreignObject blurs on zoom
- [CSS Support](/guide/css-support) - Learn which CSS properties are supported
- [Examples](/examples/) - See real-world usage examples
