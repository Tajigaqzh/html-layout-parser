# Font Management

HTML Layout Parser supports loading and managing multiple fonts with automatic fallback mechanisms.

## Loading Fonts

### Web Environment

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/web';

const parser = new HtmlLayoutParser();
await parser.init();

// Load font from URL
const response = await fetch('/fonts/arial.ttf');
const fontData = new Uint8Array(await response.arrayBuffer());
const fontId = parser.loadFont(fontData, 'Arial');

if (fontId > 0) {
  console.log('Font loaded successfully, ID:', fontId);
} else {
  console.error('Font loading failed');
}
```

### Node.js Environment

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/node';

const parser = new HtmlLayoutParser();
await parser.init();

// Load font from file
const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
```

## Supported Font Formats

- **TTF** (TrueType Font)
- **OTF** (OpenType Font)

::: warning Unsupported Formats
- WOFF/WOFF2 (Web Open Font Format)
- EOT (Embedded OpenType)
- SVG fonts

Currently, if you need to use WOFF fonts, please convert them to TTF or OTF format first. **Future versions are planned to support WOFF/WOFF2 formats**.
:::

## Setting Default Font

The default font is used as a fallback when the font specified in CSS is not loaded.

```typescript
const fontId = parser.loadFont(fontData, 'Arial');
parser.setDefaultFont(fontId);
```

## Multi-Font Management

### Loading Multiple Fonts

```typescript
const fonts = [
  { url: '/fonts/arial.ttf', name: 'Arial' },
  { url: '/fonts/times.ttf', name: 'Times New Roman' },
  { url: '/fonts/courier.ttf', name: 'Courier New' }
];

const fontIds = new Map<string, number>();

for (const font of fonts) {
  const response = await fetch(font.url);
  const data = new Uint8Array(await response.arrayBuffer());
  const fontId = parser.loadFont(data, font.name);
  
  if (fontId > 0) {
    fontIds.set(font.name, fontId);
  }
}

// Set default font
const defaultId = fontIds.get('Arial');
if (defaultId) {
  parser.setDefaultFont(defaultId);
}
```

### Font Fallback Chain

### Browser-Like Fallback Behavior

The parser implements **CSS font-family fallback** exactly like browsers:

```typescript
const html = `
  <div style="font-family: 'Custom Font', Arial, sans-serif;">
    Text content
  </div>
`;

// Fallback order (per character):
// 1. Try 'Custom Font' (first in font-family)
// 2. Try 'Arial' (second in font-family)
// 3. Try default font (set via setDefaultFont)
// 4. Use intelligent fallback (character-type based)
const layouts = parser.parse(html, { viewportWidth: 800 });
```

**Key Features:**
- ✅ **Per-Character Fallback**: Each character can use a different font from the fallback chain
- ✅ **Ordered Search**: Fonts are tried in the exact order specified in `font-family`
- ✅ **Accurate Width**: Uses actual character width from the fallback font
- ✅ **Performance**: Results are cached to avoid repeated lookups

### System Font Fallback Limitation

::: warning Why We Can't Match Browser Behavior Exactly
**WASM Sandbox Restriction**: WebAssembly runs in a sandboxed environment and **cannot directly access system fonts** for security reasons. This is a fundamental limitation of the WASM platform, not a design choice.

**Key Differences from Browsers:**
- ❌ **Cannot access** system fonts (Arial, Times New Roman, etc. installed on user's OS)
- ❌ **Cannot query** available system fonts
- ❌ **Cannot load** fonts from the operating system automatically

**Our Solution**: The parser uses a **user-specified default font** instead of system fonts for final fallback. You must explicitly load and set this font.
:::

**Comparison with Browser Behavior:**

| Aspect | Browser | Our Implementation |
|--------|---------|-------------------|
| Fallback Order | font-family list order | ✅ Same |
| Per-Character | Yes, per character | ✅ Same |
| Actual Width | Uses fallback font width | ✅ Same |
| System Fonts | Falls back to system | ⚠️ Uses default font* |
| Font Access | Direct OS access | ⚠️ User must load fonts |

**\*Workaround**: Load a comprehensive fallback font (like Noto Sans) and set it as the default font to replace system font functionality.

### Best Practice: Comprehensive Fallback Font

To achieve browser-like behavior, load a font with wide character coverage:

```typescript
const parser = new HtmlLayoutParser();
await parser.init();

// Load fonts in order of preference
const arialId = parser.loadFont(arialData, 'Arial');
const helveticaId = parser.loadFont(helveticaData, 'Helvetica');

// Load a comprehensive fallback font (acts like system font)
const notoSansId = parser.loadFont(notoSansData, 'Noto Sans');

// Set as default font (replaces system font fallback)
parser.setDefaultFont(notoSansId);

// Use in CSS with proper fallback chain
const html = `
  <div style="font-family: 'Arial', 'Helvetica', 'Noto Sans', sans-serif;">
    Text with multiple languages: Hello 你好 こんにちは
  </div>
`;

const layouts = parser.parse(html, { viewportWidth: 800 });
```

### Recommended Fallback Fonts

For best cross-language support:

| Font | Coverage | Use Case |
|------|----------|----------|
| **Noto Sans** | Latin, Greek, Cyrillic | Western languages |
| **Noto Sans CJK** | Chinese, Japanese, Korean | East Asian languages |
| **Noto Sans Arabic** | Arabic script | Middle Eastern languages |
| **Roboto** | Latin, Greek, Cyrillic | Modern UI design |
| **Arial Unicode MS** | Wide coverage | General purpose (if available) |

**Example: Multi-Language Support**

```typescript
// Load comprehensive font set
const notoSansId = parser.loadFont(notoSansData, 'Noto Sans');
const notoSansCJKId = parser.loadFont(notoSansCJKData, 'Noto Sans CJK');
const notoSansArabicId = parser.loadFont(notoSansArabicData, 'Noto Sans Arabic');

// Set CJK as default (widest coverage)
parser.setDefaultFont(notoSansCJKId);

// Use in CSS
const html = `
  <div style="font-family: 'Noto Sans', 'Noto Sans CJK', 'Noto Sans Arabic', sans-serif;">
    English 中文 日本語 한국어 العربية
  </div>
`;
```

### Intelligent Fallback (Last Resort)

When a character is not found in any loaded font, the parser uses intelligent fallback:

| Character Type | Fallback Strategy | Example |
|----------------|------------------|---------|
| **CJK Characters** (U+4E00-U+9FFF) | Use '中' (U+4E2D) width | 你好 → uses '中' width |
| **CJK Punctuation** (U+3000-U+303F) | Use half-width (fontSize / 2) | 、。→ fontSize/2 |
| **Latin Punctuation** | Use half-width (fontSize / 2) | ,.;: → fontSize/2 |
| **Other Characters** | Try '0' or space | abc → uses '0' width |

**Debug Output Example:**

```typescript
const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: true
});

// Console output:
// [WASM] Character U+8005 (者) not found in font ID 2
// [HtmlLayoutParser] Found character U+8005 in font-family font: aliBaBaFont65 (ID 1)
// [HtmlLayoutParser] Char U+8005 metrics: horiAdvance=20, finalWidth=20, usedFont=1
```

### Why This Approach?

| Aspect | System Fonts (Browser) | Default Font (Our Approach) |
|--------|----------------------|---------------------------|
| Access | Direct OS access | User-loaded fonts only |
| Consistency | Varies by OS | ✅ Consistent across platforms |
| Control | Limited | ✅ Full control over fonts |
| Performance | Fast (cached) | ✅ Fast (pre-loaded) |
| Character Coverage | Depends on OS | ✅ Guaranteed (if you load it) |

**Advantages:**
- ✅ **Consistent rendering** across all platforms (Windows, macOS, Linux)
- ✅ **Predictable output** - no surprises from OS font differences
- ✅ **Full control** - you choose exactly which fonts to use
- ✅ **Better testing** - same fonts in development and production

## Query Loaded Fonts

```typescript
const fonts = parser.getLoadedFonts();

for (const font of fonts) {
  console.log(`Font: ${font.name}`);
  console.log(`ID: ${font.id}`);
  console.log(`Memory usage: ${(font.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
}
```

## Unloading Fonts

### Unload Single Font

```typescript
parser.unloadFont(fontId);
```

### Clear All Fonts

```typescript
parser.clearAllFonts();
```

## Font Memory Management

Each font uses approximately the same amount of memory as the font file size.

### Monitor Font Memory

```typescript
const metrics = parser.getMemoryMetrics();

if (metrics) {
  console.log(`Total memory: ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Font count: ${metrics.fontCount}`);
  
  for (const font of metrics.fonts) {
    const mb = (font.memoryUsage / 1024 / 1024).toFixed(2);
    console.log(`${font.name}: ${mb} MB`);
  }
}
```

### Memory Optimization Tips

1. **Only load fonts you need**
   ```typescript
   // ✅ Good practice
   parser.loadFont(arialData, 'Arial');
   
   // ❌ Avoid loading unused fonts
   parser.loadFont(font1Data, 'Font1');
   parser.loadFont(font2Data, 'Font2');
   parser.loadFont(font3Data, 'Font3'); // Don't load if not used
   ```

2. **Unload fonts when done**
   ```typescript
   // Unload after use
   parser.unloadFont(fontId);
   ```

3. **Reuse loaded fonts**
   ```typescript
   // ✅ Good practice: Load once, use many times
   const fontId = parser.loadFont(fontData, 'Arial');
   parser.setDefaultFont(fontId);
   
   // Parse multiple documents
   for (const html of documents) {
     parser.parse(html, { viewportWidth: 800 });
   }
   
   // ❌ Avoid: Reloading each time
   for (const html of documents) {
     const fontId = parser.loadFont(fontData, 'Arial'); // Wastes memory
     parser.parse(html, { viewportWidth: 800 });
   }
   ```

## Font Manager Example

```typescript
class FontManager {
  private parser: HtmlLayoutParser;
  private loadedFonts: Map<string, number> = new Map();

  constructor(parser: HtmlLayoutParser) {
    this.parser = parser;
  }

  async loadFont(fontData: Uint8Array, fontName: string): Promise<number> {
    // Check if already loaded
    if (this.loadedFonts.has(fontName)) {
      return this.loadedFonts.get(fontName)!;
    }

    const fontId = this.parser.loadFont(fontData, fontName);
    
    if (fontId > 0) {
      this.loadedFonts.set(fontName, fontId);
      console.log(`Loaded font '${fontName}' (ID: ${fontId})`);
    }

    return fontId;
  }

  getFontId(fontName: string): number | undefined {
    return this.loadedFonts.get(fontName);
  }

  isLoaded(fontName: string): boolean {
    return this.loadedFonts.has(fontName);
  }

  unloadFont(fontName: string): void {
    const fontId = this.loadedFonts.get(fontName);
    if (fontId) {
      this.parser.unloadFont(fontId);
      this.loadedFonts.delete(fontName);
      console.log(`Unloaded font '${fontName}'`);
    }
  }

  clearAll(): void {
    this.parser.clearAllFonts();
    this.loadedFonts.clear();
  }
}

// Usage example
const parser = new HtmlLayoutParser();
await parser.init();

const fontManager = new FontManager(parser);

// Load font
const arialData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
await fontManager.loadFont(new Uint8Array(arialData), 'Arial');

// Check if loaded
if (fontManager.isLoaded('Arial')) {
  console.log('Arial is loaded');
}

// Cleanup
fontManager.clearAll();
parser.destroy();
```

## Best Practices

1. **Load common fonts at application startup**
2. **Use a font manager to avoid duplicate loading**
3. **Monitor memory usage and unload unused fonts**
4. **Prepare appropriate fonts for different languages**
5. **Always set a default font as fallback**
