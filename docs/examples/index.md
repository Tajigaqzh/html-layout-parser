# Examples Overview

Practical examples for using HTML Layout Parser in different environments and scenarios.

## Environment Examples

### [Web Browser](/examples/web)
Basic to advanced examples for web browser environments, including:
- Basic HTML parsing
- Multi-font usage
- CSS separation
- Canvas rendering
- Theme switching
- Complete web application

### [Web Worker](/examples/worker)
Examples for Web Worker environments:
- Basic worker setup
- OffscreenCanvas rendering
- Background processing
- Worker pool pattern

### [Node.js](/examples/node)
Server-side examples:
- Basic Node.js usage
- File-based font loading
- Batch processing
- Server-side rendering (Express.js)
- CLI tool example

## Pattern Examples

### [Batch Processing](/examples/batch)
Efficient batch and parallel processing:
- Shared font processing
- Sequential batch processing
- Parallel document parsing
- High-throughput patterns
- Memory-efficient batch processing

### [Memory Management](/examples/memory)
Correct memory management patterns:
- Load/unload patterns
- Memory monitoring
- Resource cleanup
- Long-running applications
- Common mistakes to avoid

## Quick Start Examples

### Minimal Example

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

const parser = new HtmlLayoutParser();
await parser.init();

// Load font
const fontData = await fetch('/font.ttf').then(r => r.arrayBuffer());
parser.loadFont(new Uint8Array(fontData), 'MyFont');
parser.setDefaultFont(1);

// Parse
const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });

// Use layouts...
console.log(layouts);

// Clean up
parser.destroy();
```

### With CSS

```typescript
const html = '<div class="title">Hello World</div>';
const css = '.title { color: red; font-size: 24px; }';

const layouts = parser.parseWithCSS(html, css, { viewportWidth: 800 });
```

### Canvas Rendering

```typescript
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

for (const char of layouts) {
  ctx.font = `${char.fontSize}px ${char.fontFamily}`;
  ctx.fillStyle = char.color;
  ctx.fillText(char.character, char.x, char.baseline);
}
```

### With Diagnostics

```typescript
const result = parser.parseWithDiagnostics(html, {
  viewportWidth: 800,
  enableMetrics: true
});

if (result.success) {
  console.log(`Parsed ${result.data?.length} characters`);
  console.log(`Time: ${result.metrics?.totalTime}ms`);
} else {
  console.error('Errors:', result.errors);
}
```

## Best Practices

### Do's ✅

- Load fonts once, reuse for multiple parses
- Always call `destroy()` when done
- Use `try/finally` for cleanup
- Monitor memory in long-running apps
- Use environment-specific imports for smaller bundles

### Don'ts ❌

- Don't load/unload fonts for each parse
- Don't forget to destroy the parser
- Don't use parser after destroy
- Don't ignore memory warnings
- Don't block main thread with large documents
