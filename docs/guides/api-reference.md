# API Reference

Complete API reference for HTML Layout Parser v2.0.

## HtmlLayoutParser Class

The main parser class for HTML layout calculation.

### Constructor

```typescript
const parser = new HtmlLayoutParser();
```

Creates a new parser instance. Call `init()` before using.

### Initialization

#### `init(wasmPath?: string): Promise<void>`

Initialize the WASM module.

```typescript
await parser.init();
// or with custom path
await parser.init('/path/to/html_layout_parser.js');
```

#### `isInitialized(): boolean`

Check if the parser is initialized.

```typescript
if (parser.isInitialized()) {
  // Ready to use
}
```

#### `getEnvironment(): Environment`

Get the detected runtime environment.

```typescript
const env = parser.getEnvironment(); // 'web' | 'worker' | 'node' | 'unknown'
```

### Font Management

#### `loadFont(fontData: Uint8Array, fontName: string): number`

Load a font from binary data.

- **fontData**: Font file data (TTF, OTF, WOFF)
- **fontName**: Name for CSS font-family matching
- **Returns**: Font ID (positive) on success, 0 on failure

```typescript
const fontId = parser.loadFont(fontData, 'Arial');
if (fontId > 0) {
  console.log('Font loaded');
}
```

#### `unloadFont(fontId: number): void`

Unload a font and free its memory.

```typescript
parser.unloadFont(fontId);
```

#### `setDefaultFont(fontId: number): void`

Set the default font for fallback.

```typescript
parser.setDefaultFont(fontId);
```

#### `getLoadedFonts(): FontInfo[]`

Get list of all loaded fonts.

```typescript
const fonts = parser.getLoadedFonts();
for (const font of fonts) {
  console.log(`${font.name} (ID: ${font.id}): ${font.memoryUsage} bytes`);
}
```

#### `clearAllFonts(): void`

Clear all loaded fonts.

```typescript
parser.clearAllFonts();
```

#### `loadFontFromFile(fontPath: string, fontName: string): Promise<number>` (Node.js only)

Load a font from a file path.

```typescript
const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
```

### HTML Parsing

#### `parse<T>(html: string, options: ParseOptions): ParseResult<T>`

Parse HTML and calculate character layouts.

```typescript
// Flat mode (default)
const chars = parser.parse(html, { viewportWidth: 800 });

// Full mode
const doc = parser.parse<'full'>(html, { viewportWidth: 800, mode: 'full' });

// With CSS
const chars = parser.parse(html, { viewportWidth: 800, css: '.title { color: red; }' });
```

#### `parseWithCSS<T>(html: string, css: string, options: Omit<ParseOptions, 'css'>): ParseResult<T>`

Convenience method for parsing with external CSS.

```typescript
const chars = parser.parseWithCSS(html, css, { viewportWidth: 800 });
```

#### `parseWithDiagnostics<T>(html: string, options: ParseOptions): ParseResultWithDiagnostics<T>`

Parse with full error and performance diagnostics.

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

#### `getLastParseResult(): ParseResultWithDiagnostics`

Get diagnostics from the last parse operation.

```typescript
const chars = parser.parse(html, { viewportWidth: 800 });
const diagnostics = parser.getLastParseResult();
```

### Utility Methods

#### `getVersion(): string`

Get parser version.

```typescript
const version = parser.getVersion(); // "0.2.0"
```

#### `getMetrics(): MemoryMetrics | null`

Get memory metrics.

```typescript
const metrics = parser.getMetrics();
```

#### `getTotalMemoryUsage(): number`

Get total memory usage in bytes.

```typescript
const bytes = parser.getTotalMemoryUsage();
```

#### `checkMemoryThreshold(): boolean`

Check if memory exceeds 50MB threshold.

```typescript
if (parser.checkMemoryThreshold()) {
  console.warn('Memory threshold exceeded');
}
```

#### `getMemoryMetrics(): MemoryMetrics | null`

Get detailed memory metrics.

```typescript
const metrics = parser.getMemoryMetrics();
if (metrics) {
  console.log(`Total: ${metrics.totalMemoryUsage} bytes`);
  console.log(`Fonts: ${metrics.fontCount}`);
}
```

#### `destroy(): void`

Destroy the parser and release all resources.

```typescript
parser.destroy();
```

---

## Interfaces

### ParseOptions

Options for parsing HTML.

```typescript
interface ParseOptions {
  viewportWidth: number;      // Required: viewport width in pixels
  viewportHeight?: number;    // Optional: viewport height
  mode?: OutputMode;          // Optional: 'flat' | 'byRow' | 'simple' | 'full'
  defaultFontId?: number;     // Optional: default font ID
  enableMetrics?: boolean;    // Optional: enable performance metrics
  maxCharacters?: number;     // Optional: max characters to process
  timeout?: number;           // Optional: timeout in milliseconds
  css?: string;               // Optional: external CSS string
}
```

### CharLayout

Character layout information.

```typescript
interface CharLayout {
  // Position
  character: string;
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Font
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: string;
  fontId: number;
  
  // Color
  color: string;              // #RRGGBBAA
  backgroundColor: string;    // #RRGGBBAA
  opacity: number;            // 0-1
  
  // Text decoration
  textDecoration: TextDecoration;
  
  // Spacing
  letterSpacing: number;
  wordSpacing: number;
  
  // Shadow
  textShadow: TextShadow[];
  
  // Transform
  transform: Transform;
  
  // Baseline and direction
  baseline: number;
  direction: string;          // 'ltr' | 'rtl'
}
```

### TextDecoration

Text decoration information.

```typescript
interface TextDecoration {
  underline: boolean;
  overline: boolean;
  lineThrough: boolean;
  color: string;
  style: string;              // 'solid' | 'double' | 'dotted' | 'dashed' | 'wavy'
  thickness: number;
}
```

### TextShadow

Text shadow information.

```typescript
interface TextShadow {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  color: string;
}
```

### Transform

CSS transform information.

```typescript
interface Transform {
  scaleX: number;
  scaleY: number;
  skewX: number;
  skewY: number;
  rotate: number;
}
```

### FontInfo

Font information.

```typescript
interface FontInfo {
  id: number;
  name: string;
  memoryUsage: number;
}
```

### MemoryMetrics

Memory metrics.

```typescript
interface MemoryMetrics {
  totalMemoryUsage: number;
  fontCount: number;
  fonts: FontInfo[];
}
```

### PerformanceMetrics

Performance metrics.

```typescript
interface PerformanceMetrics {
  parseTime: number;
  layoutTime: number;
  serializeTime: number;
  totalTime: number;
  characterCount: number;
  inputSize: number;
  charsPerSecond: number;
  memory: {
    totalFontMemory: number;
    fontCount: number;
    exceedsThreshold: boolean;
  };
}
```

### ParseError

Parse error information.

```typescript
interface ParseError {
  code: ErrorCode | string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  line?: number;
  column?: number;
  context?: string;
}
```

### ParseResultWithDiagnostics

Parse result with diagnostics.

```typescript
interface ParseResultWithDiagnostics<T = unknown> {
  success: boolean;
  data?: T;
  errors?: ParseError[];
  warnings?: ParseError[];
  metrics?: PerformanceMetrics;
}
```

---

## Output Types

### LayoutDocument (full mode)

```typescript
interface LayoutDocument {
  version: string;
  parserVersion: string;
  viewport: Viewport;
  pages: Page[];
}
```

### SimpleOutput (simple mode)

```typescript
interface SimpleOutput {
  version: string;
  viewport: Viewport;
  lines: Line[];
}
```

### Row (byRow mode)

```typescript
interface Row {
  rowIndex: number;
  y: number;
  children: CharLayout[];
}
```

### Page

```typescript
interface Page {
  pageIndex: number;
  width: number;
  height: number;
  blocks: Block[];
}
```

### Block

```typescript
interface Block {
  blockIndex: number;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  margin: BoxSpacing;
  padding: BoxSpacing;
  backgroundColor: string;
  borderRadius: number;
  lines: Line[];
}
```

### Line

```typescript
interface Line {
  lineIndex: number;
  y: number;
  baseline: number;
  height: number;
  width: number;
  textAlign: string;
  runs?: Run[];
  characters?: CharLayout[];
}
```

### Run

```typescript
interface Run {
  runIndex: number;
  x: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: string;
  color: string;
  backgroundColor: string;
  textDecoration: TextDecoration;
  characters: CharLayout[];
}
```

---

## Error Codes

```typescript
enum ErrorCode {
  Success = 0,
  
  // Input validation (1xxx)
  InvalidInput = 1001,
  EmptyHtml = 1002,
  InvalidViewportWidth = 1003,
  InvalidMode = 1004,
  InvalidOptions = 1005,
  HtmlTooLarge = 1006,
  
  // Font errors (2xxx)
  FontNotLoaded = 2001,
  FontLoadFailed = 2002,
  FontDataInvalid = 2003,
  FontNameEmpty = 2004,
  FontIdNotFound = 2005,
  NoDefaultFont = 2006,
  FontMemoryExceeded = 2007,
  
  // Parse errors (3xxx)
  ParseFailed = 3001,
  DocumentCreationFailed = 3002,
  RenderFailed = 3003,
  LayoutFailed = 3004,
  CssParseError = 3005,
  
  // Memory errors (4xxx)
  MemoryAllocationFailed = 4001,
  MemoryLimitExceeded = 4002,
  
  // Internal errors (5xxx)
  InternalError = 5001,
  SerializationFailed = 5002,
  UnknownError = 5999
}
```

---

## Factory Function

### `createParser(): HtmlLayoutParser`

Create a new parser instance.

```typescript
import { createParser } from 'html-layout-parser';

const parser = createParser();
await parser.init();
```

---

## Environment Detection

### `detectEnvironment(): Environment`

Detect the current runtime environment.

```typescript
import { detectEnvironment } from 'html-layout-parser';

const env = detectEnvironment(); // 'web' | 'worker' | 'node' | 'unknown'
```
