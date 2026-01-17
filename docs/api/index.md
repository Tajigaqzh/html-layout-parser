# API Reference

Complete API reference for HTML Layout Parser v0.0.1.

## Overview

HTML Layout Parser provides a simple yet powerful API for parsing HTML/CSS and extracting character-level layout information.

## Main Class

### HtmlLayoutParser

The main parser class. See [HtmlLayoutParser](/api/parser) for full documentation.

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

const parser = new HtmlLayoutParser();
await parser.init();

// Load font
const fontId = parser.loadFont(fontData, 'Arial');
parser.setDefaultFont(fontId);

// Parse HTML
const layouts = parser.parse(html, { viewportWidth: 800 });

// Clean up
parser.destroy();
```

## Quick Reference

### Initialization

| Method | Description |
|--------|-------------|
| `init(wasmPath?)` | Initialize the WASM module |
| `isInitialized()` | Check if parser is ready |
| `getEnvironment()` | Get runtime environment |
| `getVersion()` | Get parser version |

### Font Management

| Method | Description |
|--------|-------------|
| `loadFont(data, name)` | Load font from binary data |
| `loadFontFromFile(path, name)` | Load font from file (Node.js) |
| `unloadFont(fontId)` | Unload a specific font |
| `setDefaultFont(fontId)` | Set default fallback font |
| `getLoadedFonts()` | List all loaded fonts |
| `clearAllFonts()` | Remove all fonts |

### Parsing

| Method | Description |
|--------|-------------|
| `parse(html, options)` | Parse HTML and get layouts |
| `parseWithCSS(html, css, options)` | Parse with external CSS |
| `parseWithDiagnostics(html, options)` | Parse with full diagnostics |
| `getLastParseResult()` | Get last parse diagnostics |

### Memory Management

| Method | Description |
|--------|-------------|
| `getMetrics()` | Get memory metrics |
| `getTotalMemoryUsage()` | Get total memory in bytes |
| `checkMemoryThreshold()` | Check if exceeds 50MB |
| `getMemoryMetrics()` | Get detailed metrics |
| `destroy()` | Release all resources |

## Factory Function

```typescript
import { createParser } from 'html-layout-parser';

const parser = createParser();
await parser.init();
```

## Environment Detection

```typescript
import { detectEnvironment } from 'html-layout-parser';

const env = detectEnvironment(); // 'web' | 'worker' | 'node' | 'unknown'
```

## Environment-Specific Imports

::: code-group

```typescript [Web Browser]
import { HtmlLayoutParser } from 'html-layout-parser/web';
```

```typescript [Web Worker]
import { HtmlLayoutParser } from 'html-layout-parser/worker';
```

```typescript [Node.js]
import { HtmlLayoutParser } from 'html-layout-parser/node';
```

```typescript [Auto-detect]
import { HtmlLayoutParser } from 'html-layout-parser';
```

:::

## Related Pages

- [HtmlLayoutParser Class](/api/parser) - Full class documentation
- [Types & Interfaces](/api/types) - All type definitions
- [Error Codes](/api/error-codes) - Error code reference
