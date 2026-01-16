# Types & Interfaces

Complete type definitions for HTML Layout Parser.

## Parse Options

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

### OutputMode

Available output modes.

```typescript
type OutputMode = 'flat' | 'byRow' | 'simple' | 'full';
```

| Mode | Description | Use Case |
|------|-------------|----------|
| `flat` | Array of CharLayout | Simple rendering |
| `byRow` | Grouped by rows | Line-by-line processing |
| `simple` | Simplified structure | Basic document structure |
| `full` | Complete hierarchy | Full document analysis |

## Character Layout

### CharLayout

Character layout information - the core output type.

```typescript
interface CharLayout {
  // Position
  character: string;          // The character
  x: number;                  // X position
  y: number;                  // Y position
  width: number;              // Character width
  height: number;             // Character height
  
  // Font
  fontFamily: string;         // Font family name
  fontSize: number;           // Font size in pixels
  fontWeight: number;         // Font weight (100-900)
  fontStyle: string;          // 'normal' | 'italic' | 'oblique'
  fontId: number;             // Internal font ID
  
  // Color
  color: string;              // Text color (#RRGGBBAA)
  backgroundColor: string;    // Background color (#RRGGBBAA)
  opacity: number;            // Opacity (0-1)
  
  // Text decoration
  textDecoration: TextDecoration;
  
  // Spacing
  letterSpacing: number;      // Letter spacing in pixels
  wordSpacing: number;        // Word spacing in pixels
  
  // Shadow
  textShadow: TextShadow[];   // Array of shadows
  
  // Transform
  transform: Transform;       // CSS transform
  
  // Baseline and direction
  baseline: number;           // Baseline Y position
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
  color: string;              // Decoration color
  style: string;              // 'solid' | 'double' | 'dotted' | 'dashed' | 'wavy'
  thickness: number;          // Line thickness
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

## Output Types

### LayoutDocument (full mode)

Complete document structure.

```typescript
interface LayoutDocument {
  version: string;
  parserVersion: string;
  viewport: Viewport;
  pages: Page[];
}
```

### Viewport

Viewport information.

```typescript
interface Viewport {
  width: number;
  height: number;
}
```

### Page

Page structure.

```typescript
interface Page {
  pageIndex: number;
  width: number;
  height: number;
  blocks: Block[];
}
```

### Block

Block element structure.

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

### BoxSpacing

Box model spacing.

```typescript
interface BoxSpacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
```

### Line

Line structure.

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

Text run (group of characters with same style).

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

### Row (byRow mode)

Row structure for byRow output mode.

```typescript
interface Row {
  rowIndex: number;
  y: number;
  children: CharLayout[];
}
```

### SimpleOutput (simple mode)

Simplified output structure.

```typescript
interface SimpleOutput {
  version: string;
  viewport: Viewport;
  lines: Line[];
}
```

## Font Types

### FontInfo

Font information.

```typescript
interface FontInfo {
  id: number;
  name: string;
  memoryUsage: number;        // Memory in bytes
}
```

## Memory Types

### MemoryMetrics

Memory metrics.

```typescript
interface MemoryMetrics {
  totalMemoryUsage: number;   // Total memory in bytes
  fontCount: number;          // Number of loaded fonts
  fonts: FontInfo[];          // Font details
}
```

## Performance Types

### PerformanceMetrics

Performance metrics.

```typescript
interface PerformanceMetrics {
  parseTime: number;          // HTML parse time (ms)
  layoutTime: number;         // Layout calculation time (ms)
  serializeTime: number;      // Serialization time (ms)
  totalTime: number;          // Total time (ms)
  characterCount: number;     // Characters processed
  inputSize: number;          // Input HTML size (bytes)
  charsPerSecond: number;     // Processing speed
  memory: {
    totalFontMemory: number;
    fontCount: number;
    exceedsThreshold: boolean;
  };
}
```

## Error Types

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

## Environment Type

```typescript
type Environment = 'web' | 'worker' | 'node' | 'unknown';
```

## Type Helpers

### ParseResult

Result type based on output mode.

```typescript
type ParseResult<T extends OutputMode> = 
  T extends 'flat' ? CharLayout[] :
  T extends 'byRow' ? Row[] :
  T extends 'simple' ? SimpleOutput :
  T extends 'full' ? LayoutDocument :
  CharLayout[];
```
