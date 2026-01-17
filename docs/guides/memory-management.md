# Memory Management Guide

This guide covers best practices for managing memory when using HTML Layout Parser v0.0.1.

## Overview

HTML Layout Parser uses WebAssembly, which has its own memory space separate from JavaScript. Proper memory management is crucial to prevent memory leaks and ensure optimal performance.

## Key Principles

### 1. Always Destroy the Parser

The parser allocates resources that must be explicitly released:

```typescript
const parser = new HtmlLayoutParser();
await parser.init();

try {
  // Use the parser...
} finally {
  // Always destroy when done
  parser.destroy();
}
```

### 2. Font Memory is Significant

Fonts are the largest memory consumers. A typical font file is 1-5MB.

```typescript
// Check font memory usage
const fonts = parser.getLoadedFonts();
for (const font of fonts) {
  console.log(`${font.name}: ${font.memoryUsage} bytes`);
}
```

### 3. Reuse Fonts Across Parses

Load fonts once and reuse them:

```typescript
// ✅ GOOD: Load once, use many times
const fontId = parser.loadFont(fontData, 'Arial');

for (const html of documents) {
  const layouts = parser.parse(html, { viewportWidth: 800 });
}

parser.unloadFont(fontId);
```

```typescript
// ❌ BAD: Load/unload for each parse
for (const html of documents) {
  const fontId = parser.loadFont(fontData, 'Arial');
  const layouts = parser.parse(html, { viewportWidth: 800 });
  parser.unloadFont(fontId);
}
```

## Memory Monitoring

### Check Total Memory Usage

```typescript
const totalBytes = parser.getTotalMemoryUsage();
console.log(`Total memory: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
```

### Check Memory Threshold

The parser warns when memory exceeds 50MB:

```typescript
if (parser.checkMemoryThreshold()) {
  console.warn('Memory usage exceeds 50MB threshold');
  // Consider clearing unused fonts
}
```

### Get Detailed Metrics

```typescript
const metrics = parser.getMemoryMetrics();
if (metrics) {
  console.log(`Total: ${metrics.totalMemoryUsage} bytes`);
  console.log(`Fonts: ${metrics.fontCount}`);
  
  for (const font of metrics.fonts) {
    console.log(`  ${font.name} (ID: ${font.id}): ${font.memoryUsage} bytes`);
  }
}
```

## Memory Limits

| Resource | Limit |
|----------|-------|
| Total memory | < 50MB |
| Per font | 1-5MB typical |
| Temporary data | Cleared after each parse |

## Font Management Patterns

### Pattern 1: Long-Running Application

```typescript
class DocumentRenderer {
  private parser: HtmlLayoutParser;
  private loadedFonts: Map<string, number> = new Map();

  async init() {
    this.parser = new HtmlLayoutParser();
    await this.parser.init();
  }

  async loadFont(name: string, url: string): Promise<number> {
    // Check if already loaded
    if (this.loadedFonts.has(name)) {
      return this.loadedFonts.get(name)!;
    }

    // Load font
    const response = await fetch(url);
    const data = new Uint8Array(await response.arrayBuffer());
    const fontId = this.parser.loadFont(data, name);
    
    if (fontId > 0) {
      this.loadedFonts.set(name, fontId);
    }
    
    return fontId;
  }

  unloadFont(name: string) {
    const fontId = this.loadedFonts.get(name);
    if (fontId) {
      this.parser.unloadFont(fontId);
      this.loadedFonts.delete(name);
    }
  }

  render(html: string, options: ParseOptions) {
    return this.parser.parse(html, options);
  }

  destroy() {
    this.parser.destroy();
    this.loadedFonts.clear();
  }
}
```

### Pattern 2: Batch Processing

```typescript
async function processBatch(documents: string[], fontData: Uint8Array) {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load font once
    const fontId = parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(fontId);

    // Process all documents
    const results = [];
    for (const html of documents) {
      const layouts = parser.parse(html, { viewportWidth: 800 });
      results.push(layouts);
    }

    return results;
  } finally {
    parser.destroy();
  }
}
```

### Pattern 3: Memory-Constrained Environment

```typescript
async function processWithMemoryLimit(
  documents: string[],
  fontData: Uint8Array,
  maxMemoryMB: number = 40
) {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    const fontId = parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(fontId);

    const results = [];
    
    for (const html of documents) {
      // Check memory before processing
      const memoryMB = parser.getTotalMemoryUsage() / 1024 / 1024;
      
      if (memoryMB > maxMemoryMB) {
        console.warn(`Memory limit reached: ${memoryMB.toFixed(2)} MB`);
        // Could implement cleanup or batching here
      }

      const layouts = parser.parse(html, { viewportWidth: 800 });
      results.push(layouts);
    }

    return results;
  } finally {
    parser.destroy();
  }
}
```

## Common Memory Issues

### Issue 1: Forgetting to Destroy

```typescript
// ❌ Memory leak!
async function parseDocument(html: string) {
  const parser = new HtmlLayoutParser();
  await parser.init();
  const fontId = parser.loadFont(fontData, 'Arial');
  return parser.parse(html, { viewportWidth: 800 });
  // Parser never destroyed!
}
```

**Solution**: Always destroy in a finally block:

```typescript
// ✅ Correct
async function parseDocument(html: string) {
  const parser = new HtmlLayoutParser();
  await parser.init();
  
  try {
    const fontId = parser.loadFont(fontData, 'Arial');
    return parser.parse(html, { viewportWidth: 800 });
  } finally {
    parser.destroy();
  }
}
```

### Issue 2: Loading Same Font Multiple Times

```typescript
// ❌ Wastes memory
const font1 = parser.loadFont(arialData, 'Arial');
const font2 = parser.loadFont(arialData, 'Arial'); // Duplicate!
```

**Solution**: Track loaded fonts:

```typescript
// ✅ Correct
const loadedFonts = new Map<string, number>();

function loadFontOnce(data: Uint8Array, name: string): number {
  if (loadedFonts.has(name)) {
    return loadedFonts.get(name)!;
  }
  const fontId = parser.loadFont(data, name);
  loadedFonts.set(name, fontId);
  return fontId;
}
```

### Issue 3: Not Unloading Unused Fonts

```typescript
// ❌ Fonts accumulate
for (const fontUrl of fontUrls) {
  const data = await fetchFont(fontUrl);
  parser.loadFont(data, fontUrl);
}
// All fonts stay in memory!
```

**Solution**: Unload when no longer needed:

```typescript
// ✅ Correct
const fontId = parser.loadFont(data, 'TempFont');
// Use font...
parser.unloadFont(fontId); // Free memory
```

## Debugging Memory Issues

### Enable Metrics

```typescript
const result = parser.parseWithDiagnostics(html, {
  viewportWidth: 800,
  enableMetrics: true
});

if (result.metrics) {
  console.log('Memory:', result.metrics.memory);
}
```

### Log Memory Periodically

```typescript
setInterval(() => {
  const metrics = parser.getMemoryMetrics();
  if (metrics) {
    console.log(`Memory: ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Fonts: ${metrics.fontCount}`);
  }
}, 10000);
```

### Check for Threshold Warnings

```typescript
if (parser.checkMemoryThreshold()) {
  console.warn('Memory threshold exceeded!');
  console.log('Loaded fonts:', parser.getLoadedFonts());
}
```

## Summary

1. **Always call `destroy()`** when done with the parser
2. **Load fonts once**, reuse across multiple parses
3. **Monitor memory** using `getMemoryMetrics()` and `checkMemoryThreshold()`
4. **Unload unused fonts** to free memory
5. **Use try/finally** to ensure cleanup on errors
