---
layout: home

hero:
  name: HTML Layout Parser
  text: WebAssembly-powered HTML/CSS Layout Engine
  tagline: Extract character-level layout data for Canvas text rendering with multi-font support
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/Tajigaqzh/html-layout-parser

features:
  - icon: 🚀
    title: High Performance
    details: WebAssembly-powered parsing up to 103,000+ chars/sec with smart font metrics caching
  - icon: 🔤
    title: Multi-Font Support
    details: Load and manage multiple fonts with automatic fallback chains and memory-efficient storage
  - icon: 🎨
    title: Rich Text Attributes
    details: Full CSS text styling including decorations, transforms, and opacity
  - icon: 📦
    title: Multiple Output Modes
    details: Choose from flat, byRow, simple, or full hierarchical output based on your needs
  - icon: 🎯
    title: Canvas-Ready
    details: Output format directly maps to Canvas 2D API for seamless rendering
  - icon: 🌐
    title: Cross-Environment
    details: Works in Web browsers, Web Workers, and Node.js with unified API
  - icon: 📝
    title: TypeScript First
    details: Complete type definitions with JSDoc documentation for excellent IDE support
  - icon: 💾
    title: Memory Efficient
    details: Strict memory management with monitoring, smart caching, and automatic cleanup
---

## About This Project

::: info Design Purpose
This WASM-based solution is designed to provide cross-platform capabilities and Web Worker support that complement existing approaches like SVG foreignObject. It's particularly useful for scenarios requiring:
- Rendering in Web Workers (where DOM is unavailable)
- Node.js server-side rendering
- Precise control over text layout and rendering
- High zoom levels with pixel-perfect accuracy

**For main thread browser environments**, SVG foreignObject remains a simpler and more convenient option as it can directly access system fonts without manual loading. Additionally, the WASM solution introduces extra memory overhead beyond the font files themselves. This library is not intended to replace browser-standard SVG solutions, but rather to provide a complementary option for specific scenarios where WASM's unique capabilities are needed.
:::

## Quick Example

::: tip Platform-Specific Imports for Smaller Bundle Size
Import only the platform you need to reduce bundle size:
- **Auto-detect**: `import { HtmlLayoutParser } from 'html-layout-parser'`
- **Web Browser**: `import { HtmlLayoutParser } from 'html-layout-parser/web'`
- **Web Worker**: `import { HtmlLayoutParser } from 'html-layout-parser/worker'`
- **Node.js**: `import { HtmlLayoutParser } from 'html-layout-parser/node'`
:::

::: warning Font File Path Recommendation
Place font files in the `public` directory (not in `src`) to prevent build tools from renaming them, which would cause WASM to fail loading fonts.

**Good**: `/public/fonts/arial.ttf` → `fetch('/fonts/arial.ttf')`  
**Bad**: `/src/assets/fonts/arial.ttf` (may be renamed to `arial.abc123.ttf`)
:::

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

const parser = new HtmlLayoutParser();
await parser.init();

// Load font from public directory
const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
const fontId = parser.loadFont(new Uint8Array(fontData), 'Arial');
parser.setDefaultFont(fontId);

// Parse HTML with CSS
const layouts = parser.parse('<div class="title">Hello World</div>', {
  viewportWidth: 800,
  css: '.title { color: blue; font-size: 24px; }'
});

// Render to Canvas
const ctx = canvas.getContext('2d');
for (const char of layouts) {
  ctx.font = `${char.fontSize}px ${char.fontFamily}`;
  ctx.fillStyle = char.color;
  ctx.fillText(char.character, char.x, char.baseline);
}

parser.destroy();
```

## Performance

| Metric | Result |
|--------|--------|
| Parse Speed | 9,442 - 129,121 chars/sec |
| Memory Usage | Per font ≈ font file size |
| WASM Size | 2.25MB |
| Startup Time | ~7ms (warm), ~17ms (cold) |
| Cache Hit Rate | 91.2% |
