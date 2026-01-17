# Performance Optimization Guide

This guide covers techniques for optimizing HTML Layout Parser v0.0.1 performance.

## Performance Targets

| Metric | Target | Description |
|--------|--------|-------------|
| Parse speed | > 1000 chars/sec | Characters processed per second |
| Memory usage | < 50MB | Total including fonts |
| WASM size (full) | < 2.5MB | Complete module |
| WASM size (minimal) | < 2.5MB | Stripped module |
| Startup time | < 100ms | Time to initialize |

## Optimization Techniques

### 1. Reuse Parser Instances

Creating a new parser instance involves loading the WASM module, which is expensive.

```typescript
// ❌ SLOW: New parser for each document
for (const html of documents) {
  const parser = new HtmlLayoutParser();
  await parser.init();
  const fontId = parser.loadFont(fontData, 'Arial');
  const layouts = parser.parse(html, { viewportWidth: 800 });
  parser.destroy();
}
```

```typescript
// ✅ FAST: Reuse parser
const parser = new HtmlLayoutParser();
await parser.init();
const fontId = parser.loadFont(fontData, 'Arial');

for (const html of documents) {
  const layouts = parser.parse(html, { viewportWidth: 800 });
}

parser.destroy();
```

**Impact**: 10-100x faster for batch processing

### 2. Reuse Fonts

Font loading involves parsing font files and creating FreeType structures.

```typescript
// ❌ SLOW: Load font for each parse
for (const html of documents) {
  const fontId = parser.loadFont(fontData, 'Arial');
  const layouts = parser.parse(html, { viewportWidth: 800 });
  parser.unloadFont(fontId);
}
```

```typescript
// ✅ FAST: Load once, use many times
const fontId = parser.loadFont(fontData, 'Arial');
parser.setDefaultFont(fontId);

for (const html of documents) {
  const layouts = parser.parse(html, { viewportWidth: 800 });
}

parser.unloadFont(fontId);
```

**Impact**: 5-20x faster for batch processing

### 3. Choose the Right Output Mode

Different output modes have different performance characteristics:

| Mode | Speed | Memory | Use Case |
|------|-------|--------|----------|
| `flat` | Fastest | Lowest | Simple rendering |
| `byRow` | Fast | Low | Line-by-line rendering |
| `simple` | Medium | Medium | Basic structure |
| `full` | Slowest | Highest | Complex layouts |

```typescript
// ✅ Use flat mode for simple rendering
const chars = parser.parse(html, { viewportWidth: 800, mode: 'flat' });

// Only use full mode when you need the hierarchy
const doc = parser.parse<'full'>(html, { viewportWidth: 800, mode: 'full' });
```

**Impact**: 2-5x faster with flat mode vs full mode

### 4. Limit Document Size

Large documents take longer to process. Set limits to prevent performance issues:

```typescript
const layouts = parser.parse(html, {
  viewportWidth: 800,
  maxCharacters: 10000 // Limit to 10K characters
});
```

For very large documents, consider chunking:

```typescript
function parseInChunks(html: string, chunkSize: number = 5000) {
  const results = [];
  let offset = 0;
  
  while (offset < html.length) {
    const chunk = html.slice(offset, offset + chunkSize);
    const layouts = parser.parse(chunk, { viewportWidth: 800 });
    results.push(layouts);
    offset += chunkSize;
  }
  
  return results;
}
```

### 5. Use Timeout for Safety

Prevent hanging on complex documents:

```typescript
const layouts = parser.parse(html, {
  viewportWidth: 800,
  timeout: 5000 // 5 second timeout
});
```

### 6. Parallel Processing

For batch processing, use parallel execution:

```typescript
// Process documents in parallel
const results = await Promise.all(
  documents.map(html => 
    parser.parse(html, { viewportWidth: 800 })
  )
);
```

Note: The parser is thread-safe for parsing operations when fonts are already loaded.

### 7. Minimize CSS Complexity

Complex CSS selectors and rules slow down parsing:

```css
/* ❌ SLOW: Complex selectors */
div.container > ul.list > li.item:nth-child(odd) > span.text { }

/* ✅ FAST: Simple selectors */
.item-text { }
```

### 8. Preload Fonts

Load fonts before they're needed:

```typescript
// Preload fonts during app initialization
async function preloadFonts(parser: HtmlLayoutParser) {
  const fontUrls = ['/fonts/arial.ttf', '/fonts/times.ttf'];
  
  await Promise.all(fontUrls.map(async (url) => {
    const response = await fetch(url);
    const data = new Uint8Array(await response.arrayBuffer());
    const name = url.split('/').pop()!.replace('.ttf', '');
    return parser.loadFont(data, name);
  }));
}
```

## Measuring Performance

### Enable Metrics

```typescript
const result = parser.parseWithDiagnostics(html, {
  viewportWidth: 800,
  enableMetrics: true
});

if (result.metrics) {
  console.log(`Parse time: ${result.metrics.parseTime}ms`);
  console.log(`Layout time: ${result.metrics.layoutTime}ms`);
  console.log(`Serialize time: ${result.metrics.serializeTime}ms`);
  console.log(`Total time: ${result.metrics.totalTime}ms`);
  console.log(`Characters: ${result.metrics.characterCount}`);
  console.log(`Speed: ${result.metrics.charsPerSecond} chars/sec`);
}
```

### Benchmark Function

```typescript
async function benchmark(
  parser: HtmlLayoutParser,
  html: string,
  iterations: number = 100
) {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    parser.parse(html, { viewportWidth: 800 });
    times.push(performance.now() - start);
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  console.log(`Average: ${avg.toFixed(2)}ms`);
  console.log(`Min: ${min.toFixed(2)}ms`);
  console.log(`Max: ${max.toFixed(2)}ms`);
  
  return { avg, min, max };
}
```

### Memory Profiling

```typescript
function profileMemory(parser: HtmlLayoutParser) {
  const metrics = parser.getMemoryMetrics();
  
  if (metrics) {
    console.log('=== Memory Profile ===');
    console.log(`Total: ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Fonts: ${metrics.fontCount}`);
    
    for (const font of metrics.fonts) {
      const mb = (font.memoryUsage / 1024 / 1024).toFixed(2);
      console.log(`  ${font.name}: ${mb} MB`);
    }
  }
}
```

## Performance Patterns

### Pattern 1: High-Throughput Processing

```typescript
class HighThroughputParser {
  private parser: HtmlLayoutParser;
  private initialized = false;

  async init() {
    this.parser = new HtmlLayoutParser();
    await this.parser.init();
    this.initialized = true;
  }

  async loadFonts(fonts: Array<{ data: Uint8Array; name: string }>) {
    for (const font of fonts) {
      const fontId = this.parser.loadFont(font.data, font.name);
      if (fontId === 1) {
        this.parser.setDefaultFont(fontId);
      }
    }
  }

  parse(html: string, viewportWidth: number) {
    if (!this.initialized) {
      throw new Error('Parser not initialized');
    }
    return this.parser.parse(html, { viewportWidth, mode: 'flat' });
  }

  async processBatch(documents: string[], viewportWidth: number) {
    return documents.map(html => this.parse(html, viewportWidth));
  }

  destroy() {
    this.parser.destroy();
    this.initialized = false;
  }
}
```

### Pattern 2: Lazy Initialization

```typescript
class LazyParser {
  private parser: HtmlLayoutParser | null = null;
  private initPromise: Promise<void> | null = null;

  private async ensureInitialized() {
    if (this.parser) return;
    
    if (!this.initPromise) {
      this.initPromise = this.doInit();
    }
    
    await this.initPromise;
  }

  private async doInit() {
    this.parser = new HtmlLayoutParser();
    await this.parser.init();
  }

  async parse(html: string, options: ParseOptions) {
    await this.ensureInitialized();
    return this.parser!.parse(html, options);
  }

  destroy() {
    this.parser?.destroy();
    this.parser = null;
    this.initPromise = null;
  }
}
```

### Pattern 3: Worker Pool

```typescript
// main.ts
class ParserPool {
  private workers: Worker[] = [];
  private queue: Array<{ html: string; resolve: Function }> = [];
  private busy: Set<Worker> = new Set();

  constructor(size: number = navigator.hardwareConcurrency || 4) {
    for (let i = 0; i < size; i++) {
      const worker = new Worker('parser-worker.js');
      worker.onmessage = (e) => this.handleResult(worker, e.data);
      this.workers.push(worker);
    }
  }

  parse(html: string): Promise<CharLayout[]> {
    return new Promise((resolve) => {
      const freeWorker = this.workers.find(w => !this.busy.has(w));
      
      if (freeWorker) {
        this.busy.add(freeWorker);
        freeWorker.postMessage({ html });
        // Store resolve for this worker
      } else {
        this.queue.push({ html, resolve });
      }
    });
  }

  private handleResult(worker: Worker, result: CharLayout[]) {
    this.busy.delete(worker);
    
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      this.busy.add(worker);
      worker.postMessage({ html: next.html });
    }
  }

  destroy() {
    this.workers.forEach(w => w.terminate());
  }
}
```

## Common Performance Issues

### Issue 1: Slow Startup

**Cause**: WASM module loading is slow

**Solution**: Preload and cache the module

```typescript
// Preload during app startup
const parserPromise = (async () => {
  const parser = new HtmlLayoutParser();
  await parser.init();
  return parser;
})();

// Use later
const parser = await parserPromise;
```

### Issue 2: Memory Pressure

**Cause**: Too many fonts loaded

**Solution**: Implement font caching with LRU eviction

```typescript
class FontCache {
  private cache = new Map<string, number>();
  private maxFonts = 5;

  load(parser: HtmlLayoutParser, data: Uint8Array, name: string): number {
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxFonts) {
      const oldest = this.cache.keys().next().value;
      parser.unloadFont(this.cache.get(oldest)!);
      this.cache.delete(oldest);
    }

    const fontId = parser.loadFont(data, name);
    this.cache.set(name, fontId);
    return fontId;
  }
}
```

### Issue 3: Large Document Slowdown

**Cause**: Processing too many characters

**Solution**: Implement pagination or virtualization

```typescript
function parseWithPagination(
  parser: HtmlLayoutParser,
  html: string,
  pageSize: number = 1000
) {
  const layouts = parser.parse(html, { 
    viewportWidth: 800,
    maxCharacters: pageSize
  });
  
  return {
    layouts,
    hasMore: layouts.length === pageSize
  };
}
```

## Summary

1. **Reuse parser instances** - Don't create new parsers for each document
2. **Reuse fonts** - Load once, use many times
3. **Choose appropriate output mode** - Use `flat` for simple cases
4. **Limit document size** - Set `maxCharacters` for large documents
5. **Use timeouts** - Prevent hanging on complex documents
6. **Measure performance** - Use `enableMetrics` to identify bottlenecks
7. **Consider parallel processing** - Use workers for batch processing
