# HtmlLayoutParser Class

The main parser class for HTML layout calculation.

## Constructor

```typescript
const parser = new HtmlLayoutParser();
```

Creates a new parser instance. Call `init()` before using.

## Initialization Methods

### init()

Initialize the WASM module.

```typescript
init(wasmPath?: string): Promise<void>
```

**Parameters:**
- `wasmPath` (optional): Custom path to the WASM loader script

**Example:**
```typescript
await parser.init();
// or with custom path
await parser.init('/path/to/html_layout_parser.js');
```

### isInitialized()

Check if the parser is initialized.

```typescript
isInitialized(): boolean
```

**Example:**
```typescript
if (parser.isInitialized()) {
  // Ready to use
}
```

### getEnvironment()

Get the detected runtime environment.

```typescript
getEnvironment(): Environment
```

**Returns:** `'web' | 'worker' | 'node' | 'unknown'`

### getVersion()

Get parser version.

```typescript
getVersion(): string
```

**Returns:** Version string (e.g., `"0.0.1"`)

## Font Management Methods

### loadFont()

Load a font from binary data.

```typescript
loadFont(fontData: Uint8Array, fontName: string): number
```

**Parameters:**
- `fontData`: Font file data (TTF, OTF)
- `fontName`: Name for CSS font-family matching

**Returns:** Font ID (positive) on success, 0 on failure

**Example:**
```typescript
const fontId = parser.loadFont(fontData, 'Arial');
if (fontId > 0) {
  console.log('Font loaded');
}
```

### loadFontFromFile() <Badge type="tip" text="Node.js only" />

Load a font from a file path.

```typescript
loadFontFromFile(fontPath: string, fontName: string): Promise<number>
```

**Example:**
```typescript
const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
```

### unloadFont()

Unload a font and free its memory.

```typescript
unloadFont(fontId: number): void
```

### setDefaultFont()

Set the default font for fallback.

```typescript
setDefaultFont(fontId: number): void
```

### getLoadedFonts()

Get list of all loaded fonts.

```typescript
getLoadedFonts(): FontInfo[]
```

**Example:**
```typescript
const fonts = parser.getLoadedFonts();
for (const font of fonts) {
  console.log(`${font.name} (ID: ${font.id}): ${font.memoryUsage} bytes`);
}
```

### clearAllFonts()

Clear all loaded fonts.

```typescript
clearAllFonts(): void
```

## Parsing Methods

### parse()

Parse HTML and calculate character layouts.

```typescript
parse<T extends OutputMode = 'flat'>(
  html: string, 
  options: ParseOptions
): ParseResult<T>
```

**Parameters:**
- `html`: HTML string to parse
- `options`: Parse options (see [ParseOptions](/api/types#parseoptions))

**Returns:** Array of CharLayout (flat mode) or structured output based on mode

**Example:**
```typescript
// Flat mode (default)
const chars = parser.parse(html, { viewportWidth: 800 });

// Full mode
const doc = parser.parse<'full'>(html, { 
  viewportWidth: 800, 
  mode: 'full' 
});

// With CSS
const chars = parser.parse(html, { 
  viewportWidth: 800, 
  css: '.title { color: red; }' 
});
```

### parseWithCSS()

Convenience method for parsing with external CSS.

```typescript
parseWithCSS<T extends OutputMode = 'flat'>(
  html: string, 
  css: string, 
  options: Omit<ParseOptions, 'css'>
): ParseResult<T>
```

**Example:**
```typescript
const chars = parser.parseWithCSS(html, css, { viewportWidth: 800 });
```

### parseWithDiagnostics()

Parse with full error and performance diagnostics.

```typescript
parseWithDiagnostics<T extends OutputMode = 'flat'>(
  html: string, 
  options: ParseOptions
): ParseResultWithDiagnostics<T>
```

**Example:**
```typescript
const result = parser.parseWithDiagnostics(html, { 
  viewportWidth: 800,
  enableMetrics: true 
});

if (result.success) {
  console.log('Data:', result.data);
  console.log('Metrics:', result.metrics);
} else {
  console.error('Errors:', result.errors);
}
```

### getLastParseResult()

Get diagnostics from the last parse operation.

```typescript
getLastParseResult(): ParseResultWithDiagnostics
```

## Memory Management Methods

### getMetrics()

Get memory metrics.

```typescript
getMetrics(): MemoryMetrics | null
```

### getTotalMemoryUsage()

Get total memory usage in bytes.

```typescript
getTotalMemoryUsage(): number
```

### checkMemoryThreshold()

Check if memory exceeds 50MB threshold.

```typescript
checkMemoryThreshold(): boolean
```

**Example:**
```typescript
if (parser.checkMemoryThreshold()) {
  console.warn('Memory threshold exceeded');
}
```

### getMemoryMetrics()

Get detailed memory metrics.

```typescript
getMemoryMetrics(): MemoryMetrics | null
```

**Example:**
```typescript
const metrics = parser.getMemoryMetrics();
if (metrics) {
  console.log(`Total: ${metrics.totalMemoryUsage} bytes`);
  console.log(`Fonts: ${metrics.fontCount}`);
}
```

### destroy()

Destroy the parser and release all resources.

```typescript
destroy(): void
```

::: warning Important
Always call `destroy()` when done to release WebAssembly memory.
:::

**Example:**
```typescript
try {
  // Use parser...
} finally {
  parser.destroy();
}
```

## Complete Example

```typescript
import { HtmlLayoutParser } from '/html-layout-parser/index.js';

async function example() {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();
    console.log(`Version: ${parser.getVersion()}`);
    console.log(`Environment: ${parser.getEnvironment()}`);

    // Load font
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    const fontId = parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(fontId);

    // Parse with diagnostics
    const result = parser.parseWithDiagnostics(
      '<div class="title">Hello World</div>',
      {
        viewportWidth: 800,
        css: '.title { color: blue; font-size: 24px; }',
        enableMetrics: true
      }
    );

    if (result.success) {
      console.log(`Parsed ${result.data?.length} characters`);
      console.log(`Time: ${result.metrics?.totalTime}ms`);
    }

    // Check memory
    const metrics = parser.getMemoryMetrics();
    console.log(`Memory: ${metrics?.totalMemoryUsage} bytes`);

  } finally {
    parser.destroy();
  }
}
```
