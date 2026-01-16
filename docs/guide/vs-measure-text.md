# HTML Layout Parser vs Canvas measureText

When rendering text on Canvas, a common approach is to call `ctx.measureText()` and lay out text manually. It is fast for simple labels, but it does not provide DOM-level layout or consistent results across platforms.

## Limitations of Canvas `measureText()`

### 1. DOM consistency and layout coverage

`measureText()` returns metrics for a string, not layout. To match HTML/CSS you still need to implement:

- Line wrapping (`line-height`, `white-space`, `word-break`, `letter-spacing`)
- Inline style runs and nested spans
- Font fallback and baseline alignment
- Decorations and background boxes

As soon as you want DOM-like output, the layout logic becomes complex and easy to diverge from actual HTML rendering.

### 2. Cross-browser and cross-platform drift

`measureText()` depends on the browser and OS font rasterizer. The same font and text can produce different metrics across:

- Chrome vs Safari vs Firefox
- Windows vs macOS vs Linux
- Different browser versions

That drift accumulates in long documents and can cause line breaks or element positions to shift.

### 3. Parsing speed at scale

Single calls are fast, but DOM-like layout typically requires:

- Splitting text into styled runs
- Measuring per character or per word for wrapping
- Reflowing after style or width changes

Overall speed is dominated by repeated calls plus custom layout logic.

### 4. Server-side limitations

In Node.js you need a Canvas implementation (such as node-canvas) and font configuration. Results can still differ from browser output.

## HTML Layout Parser Solution

The parser produces **identical results everywhere** by using a single WASM layout engine with embedded font metrics:

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

const parser = new HtmlLayoutParser();
await parser.init();

const fontData = await loadFont('Arial.ttf');
parser.loadFont(fontData, 'Arial');

const layouts = parser.parse(
  '<div style="font-size: 16px;">Hello World</div>',
  { viewportWidth: 800 }
);
```

## Comparison Table

| Dimension | Canvas `measureText()` | HTML Layout Parser |
|-----------|------------------------|-------------------|
| **DOM consistency** | ⚠️ Manual layout, easy to diverge | ✅ Deterministic engine, consistent output |
| **Layout coverage** | ❌ No box model or inline layout | ✅ CSS-aware layout engine |
| **Cross-platform consistency** | ❌ Font/rasterizer differences | ✅ Platform-independent |
| **Server-side support** | ⚠️ Requires node-canvas | ✅ Native Node.js support |
| **Parsing speed** | ⚠️ Fast per call, slow at scale | ✅ Fast WASM execution |
| **Predictable testing** | ❌ Platform-dependent metrics | ✅ Deterministic tests |

## Use Cases

### ✅ When to Use HTML Layout Parser

- Cross-platform or server-side rendering
- Canvas-based editors or rich text
- Pixel-accurate layout and testing

### ⚠️ When `measureText()` Might Be Sufficient

- Single-line labels with simple styles
- Browser-only apps without layout parity needs
- Approximate positioning is acceptable

## Migration Example

### Before: Manual `measureText()` Layout

```typescript
function layoutText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  let line = '';
  const lines: string[] = [];

  for (const ch of text) {
    const next = line + ch;
    if (ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = ch;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines;
}
```

### After: HTML Layout Parser

```typescript
const layouts = parser.parse(html, { viewportWidth: 800 });
```

## Conclusion

`measureText()` is a convenient low-level API, but it does not provide DOM-level layout, and its metrics vary across browsers and platforms. HTML Layout Parser delivers consistent, CSS-aware layout with predictable performance and testing outcomes.

## See Also

- [Compare with Browser Range API](./vs-range-api.md)
- [Compare with SVG foreignObject](./vs-svg-foreignobject.md)
