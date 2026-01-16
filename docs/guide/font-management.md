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
- **WOFF** (Web Open Font Format)

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

CSS font-family supports fallback chains:

```typescript
const html = `
  <div style="font-family: 'Custom Font', Arial, sans-serif;">
    Text content
  </div>
`;

// If 'Custom Font' is not loaded, Arial will be used
// If Arial is also not loaded, the default font will be used
const layouts = parser.parse(html, { viewportWidth: 800 });
```

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
