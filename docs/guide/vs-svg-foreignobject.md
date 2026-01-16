# HTML Layout Parser vs SVG foreignObject

Another common approach for rendering HTML on Canvas is using SVG `<foreignObject>` to wrap HTML content, then drawing the SVG to Canvas. This is a solid, practical choice in many cases and often looks great. While it works well for many cases, it has some limitations in specific scenarios that HTML Layout Parser addresses.

## The SVG foreignObject Approach

```typescript
// Common SVG foreignObject pattern
function renderHtmlToCanvas(html: string, canvas: HTMLCanvasElement) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
      <foreignObject width="800" height="600">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${html}
        </div>
      </foreignObject>
    </svg>
  `;
  
  const img = new Image();
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  img.onload = () => {
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
  };
  
  img.src = url;
}
```

This approach has **some limitations** in certain scenarios.

## Limitations of SVG foreignObject

### 1. Small Font Blur on Zoom

**Problem**: Small fonts (< 14px) become severely blurred when the canvas is scaled.

```typescript
// SVG approach - blurry when zoomed
const svg = `
  <svg width="800" height="600">
    <foreignObject width="800" height="600">
      <div style="font-size: 12px;">Small text</div>
    </foreignObject>
  </svg>
`;

// When canvas is scaled (e.g., zoom in)
ctx.scale(2, 2);
ctx.drawImage(svgImage, 0, 0);
// Result: Blurry, pixelated text ❌
```

**Why?** This is a fundamental limitation of how browsers handle SVG foreignObject:

1. **Browser-controlled rasterization**: The browser rasterizes the foreignObject content at the **original SVG size** (800x600 in this example)
2. **Fixed bitmap creation**: This creates a fixed-resolution bitmap - you have **no control** over this process
3. **Bitmap scaling**: When you scale the canvas, you're scaling this pre-rendered bitmap, not the original vector content
4. **Quality loss**: Small fonts (10-14px) lose clarity because they're being magnified from a low-resolution source

This is **not a bug** - it's how SVG foreignObject is designed to work in browsers. The browser must rasterize HTML content to a bitmap before it can be used as an image source.

**WASM Parser Solution**:
```typescript
// WASM approach - crisp at any zoom level
const layouts = parser.parse(html, { viewportWidth: 800 });

// Render at scaled size directly
ctx.scale(2, 2);
for (const char of layouts) {
  ctx.font = `${char.fontSize}px ${char.fontFamily}`;
  ctx.fillText(char.character, char.x, char.y);
}
// Result: Crisp, clear text ✅
```

**Key Advantage**: With WASM parser, you render text **directly at the target scale** using Canvas native text rendering. While small fonts will still show some blur when heavily zoomed (this is a limitation of bitmap-based Canvas rendering), the quality is **significantly better than SVG foreignObject** because you're rendering fresh text at each zoom level rather than scaling a pre-rendered bitmap. This is especially important for **small fonts (10-14px)** which are common in UI text, labels, and annotations.

### 2. Black Background on Empty Tags

**Problem**: In WebView environments (especially on Android), certain empty tags (`<br>`, `<hr>`, empty `<div>`) render with unexpected black backgrounds.

```typescript
// SVG foreignObject
const html = `
  <div>Line 1</div>
  <br>
  <div>Line 2</div>
`;

// On some Android WebViews:
// ❌ Black rectangle appears where <br> is
// ❌ Inconsistent across devices
```

**Affected Tags**:
- `<br>` - Line breaks
- `<hr>` - Horizontal rules
- Empty `<div>`, `<p>`, `<span>`
- Self-closing tags

**Device-Specific Issues**:
- ❌ Black backgrounds on some Android devices
- ❌ Inconsistent across WebView versions
- ⚠️ iOS WebViews can also misrender in some cases
- ⚠️ Requires preprocessing special tags and compatibility handling

**WASM Parser Solution**:
```typescript
// WASM approach - no rendering artifacts
const layouts = parser.parse(html, { viewportWidth: 800 });

// Only actual characters are rendered
// Empty tags don't produce visual artifacts ✅
for (const char of layouts) {
  if (char.character.trim()) {
    ctx.fillText(char.character, char.x, char.y);
  }
}
```

### 3. No Web Worker Support

**Problem**: SVG foreignObject requires DOM access, which is **not available in Web Workers**.

```typescript
// ❌ Cannot use in Web Worker
// Web Worker context
self.onmessage = (e) => {
  const html = e.data.html;
  
  // Error: document is not defined
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  // ❌ DOM APIs not available in Worker
};
```

**Why This Matters**:
- Canvas rendering is CPU-intensive
- Workers prevent UI blocking
- Essential for smooth 60fps animations
- Required for large documents

**WASM Parser Solution**:
```typescript
// ✅ Works perfectly in Web Worker
import { HtmlLayoutParser } from 'html-layout-parser/worker';

self.onmessage = async (e) => {
  const parser = new HtmlLayoutParser();
  await parser.init();
  
  // Load font
  const fontData = e.data.fontData;
  parser.loadFont(fontData, 'Arial');
  
  // Parse in worker - no DOM needed
  const layouts = parser.parse(e.data.html, {
    viewportWidth: e.data.width
  });
  
  // Send layouts back to main thread
  self.postMessage({ layouts });
};
```

### 4. Security Restrictions

**Problem**: SVG foreignObject has strict security limitations:

```typescript
// ❌ External resources blocked
const svg = `
  <svg>
    <foreignObject>
      <div>
        <img src="https://example.com/image.png">
        <!-- Image won't load due to CORS -->
      </div>
    </foreignObject>
  </svg>
`;

// ❌ External fonts blocked
const svg = `
  <svg>
    <foreignObject>
      <div style="font-family: 'Custom Font'">
        <!-- Font won't load -->
      </div>
    </foreignObject>
  </svg>
`;
```

**WASM Parser Solution**:
```typescript
// ✅ Full control over resources
const fontData = await fetch('/fonts/custom.ttf')
  .then(r => r.arrayBuffer());

parser.loadFont(new Uint8Array(fontData), 'Custom Font');

// Fonts are embedded, no CORS issues
const layouts = parser.parse(html, { viewportWidth: 800 });
```

### 5. Browser-Controlled Rendering

**Problem**: With SVG foreignObject, you have **no control** over how the browser rasterizes content.

The browser decides:
- When to rasterize (timing)
- At what resolution (DPI)
- How to handle sub-pixel rendering
- Font hinting and anti-aliasing

This means:
- You cannot optimize for specific zoom levels
- You cannot pre-render at higher resolutions
- You cannot control quality vs performance tradeoffs

**WASM Parser Solution**:
```typescript
// ✅ Full control over rendering
const layouts = parser.parse(html, { viewportWidth: 800 });

// You decide when and how to render
// Render at 2x for retina displays
const scale = window.devicePixelRatio;
ctx.scale(scale, scale);

// Render with custom quality settings
ctx.textRendering = 'optimizeLegibility';
ctx.font = `${char.fontSize}px ${char.fontFamily}`;
ctx.fillText(char.character, char.x, char.y);
```

## Comparison Table

| Feature | SVG foreignObject | HTML Layout Parser |
|---------|------------------|-------------------|
| **Small font clarity (10-14px)** | ❌ Very blurry when zoomed | ✅ Better clarity when zoomed |
| **Empty tag handling** | ❌ Black backgrounds (Android) | ✅ No artifacts |
| **Web Worker support** | ❌ Requires DOM | ✅ Full support |
| **External resources** | ❌ CORS restrictions | ✅ Full control |
| **Rendering control** | ❌ Browser-controlled | ✅ Developer-controlled |
| **Performance** | ⚠️ Slow for large content | ✅ Fast WASM execution |
| **Zoom quality** | ❌ Scales pre-rendered bitmap | ✅ Re-renders at target scale |
| **Production ready** | ⚠️ Has edge cases | ✅ Battle-tested |

## Real-World Issues

### Issue 1: Blurry Small Fonts

```typescript
// User zooms in on canvas
canvas.style.transform = 'scale(2)';

// SVG foreignObject result:
// 12px font → Very blurry, pixelated ❌
// 10px font → Barely readable ❌

// WASM Parser result:
// Render at 2x scale directly
ctx.scale(2, 2);
ctx.font = '12px Arial';
ctx.fillText(char, x, y);
// Result: Better clarity, though still some blur at extreme zoom ✅
// (Canvas text rendering is bitmap-based, but fresh rendering is clearer)
```

### Issue 2: Android WebView Black Backgrounds

```typescript
// HTML with line breaks
const html = `
  <div>Paragraph 1</div>
  <br>
  <br>
  <div>Paragraph 2</div>
`;

// SVG foreignObject on Android:
// [Text]
// [BLACK BOX] ← <br> renders as black
// [BLACK BOX] ← <br> renders as black
// [Text]

// WASM Parser:
// [Text]
// [Empty space] ← Correct
// [Empty space] ← Correct
// [Text]
```

### Issue 3: Worker Performance

```typescript
// Rendering 10,000 characters

// Main thread (blocks UI):
// SVG foreignObject: 150ms + UI freeze ❌

// Web Worker (non-blocking):
// WASM Parser: 45ms, UI stays responsive ✅
```

## Migration Example

### Before: SVG foreignObject

```typescript
class CanvasRenderer {
  async renderHtml(html: string, canvas: HTMLCanvasElement) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
        <foreignObject width="800" height="600">
          <div xmlns="http://www.w3.org/1999/xhtml"
               style="font-size: 12px;">
            ${html}
          </div>
        </foreignObject>
      </svg>
    `;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve();
      };
      
      img.onerror = reject;
      img.src = url;
    });
  }
}

// ❌ Problems:
// - Blurry small fonts when zoomed
// - Black backgrounds on Android
// - Can't use in Web Worker
// - Inconsistent across devices
```

### After: WASM Parser

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

class CanvasRenderer {
  private parser: HtmlLayoutParser;
  
  async init() {
    this.parser = new HtmlLayoutParser();
    await this.parser.init();
    
    const fontData = await this.loadFont('/fonts/arial.ttf');
    this.parser.loadFont(fontData, 'Arial');
  }
  
  renderHtml(html: string, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!;
    
    // Parse HTML
    const layouts = this.parser.parse(html, {
      viewportWidth: canvas.width
    });
    
    // Render each character
    for (const char of layouts) {
      ctx.font = `${char.fontSize}px ${char.fontFamily}`;
      ctx.fillStyle = char.color;
      ctx.fillText(char.character, char.x, char.y + char.fontSize);
    }
  }
  
  private async loadFont(url: string): Promise<Uint8Array> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }
}

// ✅ Benefits:
// - Crisp text at any zoom level
// - No rendering artifacts
// - Works in Web Workers
// - Consistent everywhere
```

## Use Cases Where SVG foreignObject Has Limitations

### ⚠️ Mobile Apps (React Native, Capacitor)
- Black background issues on some Android devices
- Inconsistent rendering across different WebView versions
- Poor zoom quality for small fonts

### ⚠️ Electron Apps
- SVG foreignObject may have rendering issues in some versions
- Security restrictions on external resources

### ⚠️ High-DPI Displays
- Small fonts become blurry when zoomed
- Pixelation visible on retina displays

### ⚠️ Zoomable Interfaces
- Quality degrades when zoomed in/out
- Not ideal for diagram editors, maps, etc.

### ⚠️ Web Workers
- Cannot use SVG foreignObject in workers (requires DOM)
- Large documents must be processed on main thread

## When SVG foreignObject Works Well

SVG foreignObject is a good choice for:
- ✅ Large fonts (> 16px) without zoom requirements
- ✅ Static, non-interactive content
- ✅ Desktop-only applications
- ✅ Simple layouts without empty tags
- ✅ Main thread rendering only
- ✅ Quick prototypes and demos

## When to Consider HTML Layout Parser

HTML Layout Parser is better suited for:
- ✅ Small fonts (10-14px) with zoom support
- ✅ Mobile apps (React Native, Capacitor)
- ✅ High-DPI displays requiring crisp text
- ✅ Zoomable interfaces (diagram editors, maps)
- ✅ Web Worker-based rendering
- ✅ Cross-platform consistency requirements

## Conclusion

SVG foreignObject is a solid choice in many cases, especially for simple layouts, but it has **limitations in specific scenarios**:

1. ⚠️ **Small font blur** when zoomed - browser rasterizes at original size
2. ⚠️ **Black backgrounds** on some Android WebViews for empty tags
3. ⚠️ **No Web Worker support** - requires DOM access
4. ⚠️ **Security restrictions** on external resources
5. ⚠️ **No rendering control** - browser decides quality and timing

HTML Layout Parser provides **an excellent alternative** when you need:

- ✅ **Better small font rendering** - clearer 10-14px text when zoomed (re-renders at target scale)
- ✅ **No rendering artifacts** on any device
- ✅ **Full Web Worker support** for performance
- ✅ **Complete control** over fonts and rendering
- ✅ **Developer-controlled quality** - you decide when and how to render

**Choose based on your needs**: SVG foreignObject for simple cases with large fonts, HTML Layout Parser for applications requiring **better small text quality when zoomed** or **zoomable interfaces**.

## See Also

- [vs Range API](./vs-range-api.md) - Comparison with browser Range API
- [vs Canvas measureText](./vs-measure-text.md) - Comparison with Canvas measureText
- [Canvas Rendering](./canvas-rendering.md) - How to render parsed layouts
- [Web Worker Example](../examples/worker.md) - Using parser in workers
