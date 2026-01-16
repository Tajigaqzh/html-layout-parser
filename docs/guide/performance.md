# Performance Optimization

HTML Layout Parser is optimized for high-performance HTML layout parsing. This guide will help you maximize parsing performance.

## Performance Metrics

### Real-World Performance Data

Measured with `scripts/benchmark-performance.mjs` using a warmup phase and averaged runs
(defaults: warmup=5, iterations=30, mode=flat, viewport=800). The table below uses
warmup=10 and iterations=50. The font used is
`examples/font/aliBaBaFont65.ttf` and is loaded once before timing starts. Small documents are dominated by fixed costs
(HTML parsing, layout, serialization), so chars/sec appears lower.

Benchmark Environment (2026-01):
- macOS 26.2 (arm64)
- Apple M4
- 16 GB RAM
- Node v25.2.1
- pnpm 8.15.0
- WASM build: `wasm-output/html_layout_parser.js`

Run locally:
```bash
pnpm bench:performance -- --warmup=10 --iterations=50
```

| Document Size | Parse Speed | Total Time |
|---------------|-------------|------------|
| Simple (11 chars) | 9,442 chars/sec | 1.17ms |
| Medium (480 chars) | 105,588 chars/sec | 4.55ms |
| Large (7,200 chars) | 126,155 chars/sec | 57.07ms |
| Very Large (24,196 chars) | 129,121 chars/sec | 187.39ms |

### System Resources

| Metric | Target | Actual |
|--------|--------|--------|
| Parse Speed | > 1,000 chars/sec | 9,442 - 129,121 chars/sec ✅ |
| Memory Usage | < 50MB | ~8MB (1 font), ~40MB (5 fonts) ✅ |
| WASM Size | < 2.5MB | 2.25MB ✅ |
| Startup Time | < 100ms | ~7ms (warm), ~17ms (cold) ✅ |
| Cache Hit Rate | > 80% | 91.2% ✅ |

## Optimization Strategies

### 1. Reuse Parser Instances

```typescript
// ✅ Efficient: Reuse parser instance
async function efficientParsing(documents: string[]) {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();
    
    // Load font once
    const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
    const fontId = parser.loadFont(new Uint8Array(fontData), 'Arial');
    parser.setDefaultFont(fontId);

    // Parse multiple documents
    const results = [];
    for (const html of documents) {
      results.push(parser.parse(html, { viewportWidth: 800 }));
    }
    
    return results;
  } finally {
    parser.destroy();
  }
}

// ❌ Inefficient: Creating new instance each time
async function inefficientParsing(documents: string[]) {
  const results = [];
  
  for (const html of documents) {
    const parser = new HtmlLayoutParser(); // New instance each time
    await parser.init();
    
    const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
    parser.loadFont(new Uint8Array(fontData), 'Arial');
    
    results.push(parser.parse(html, { viewportWidth: 800 }));
    parser.destroy();
  }
  
  return results;
}
```

### 2. Choose Appropriate Output Mode

Different output modes have different performance characteristics:

```typescript
// Fastest: flat mode (default)
const chars = parser.parse(html, { 
  viewportWidth: 800,
  mode: 'flat' 
});

// Medium: byRow mode
const rows = parser.parse<'byRow'>(html, { 
  viewportWidth: 800,
  mode: 'byRow' 
});

// Slower: simple mode
const simple = parser.parse<'simple'>(html, { 
  viewportWidth: 800,
  mode: 'simple' 
});

// Slowest: full mode (only use when you need complete hierarchy)
const doc = parser.parse<'full'>(html, { 
  viewportWidth: 800,
  mode: 'full' 
});
```

### 3. Font Management Optimization

```typescript
class OptimizedFontManager {
  private parser: HtmlLayoutParser;
  private fontCache: Map<string, number> = new Map();
  private fontUsage: Map<number, number> = new Map();

  constructor(parser: HtmlLayoutParser) {
    this.parser = parser;
  }

  async loadFont(fontData: Uint8Array, fontName: string): Promise<number> {
    // Check cache
    if (this.fontCache.has(fontName)) {
      const fontId = this.fontCache.get(fontName)!;
      this.fontUsage.set(fontId, (this.fontUsage.get(fontId) || 0) + 1);
      return fontId;
    }

    // Load new font
    const fontId = this.parser.loadFont(fontData, fontName);
    
    if (fontId > 0) {
      this.fontCache.set(fontName, fontId);
      this.fontUsage.set(fontId, 1);
    }

    return fontId;
  }

  releaseFont(fontName: string): void {
    const fontId = this.fontCache.get(fontName);
    if (!fontId) return;

    const usage = this.fontUsage.get(fontId) || 0;
    
    if (usage > 1) {
      this.fontUsage.set(fontId, usage - 1);
    } else {
      // Usage count is 0, unload font
      this.parser.unloadFont(fontId);
      this.fontCache.delete(fontName);
      this.fontUsage.delete(fontId);
    }
  }

  // Clean up unused fonts
  cleanup(): void {
    const toRemove: string[] = [];
    
    for (const [fontName, fontId] of this.fontCache) {
      if ((this.fontUsage.get(fontId) || 0) === 0) {
        toRemove.push(fontName);
      }
    }

    for (const fontName of toRemove) {
      this.releaseFont(fontName);
    }
  }
}
```

### 4. Batch Processing Optimization

```typescript
class BatchProcessor {
  private parser: HtmlLayoutParser;
  private batchSize: number;

  constructor(batchSize: number = 100) {
    this.parser = new HtmlLayoutParser();
    this.batchSize = batchSize;
  }

  async init(): Promise<void> {
    await this.parser.init();
  }

  async processBatch(documents: string[]): Promise<CharLayout[][]> {
    const results: CharLayout[][] = [];
    
    // Process in batches
    for (let i = 0; i < documents.length; i += this.batchSize) {
      const batch = documents.slice(i, i + this.batchSize);
      
      // Process current batch
      const batchResults = batch.map(html => 
        this.parser.parse(html, { viewportWidth: 800 })
      );
      
      results.push(...batchResults);
      
      // Check memory usage
      if (this.parser.checkMemoryThreshold()) {
        console.warn(`Batch ${Math.floor(i / this.batchSize) + 1}: High memory usage`);
        // Can perform cleanup here
      }
    }

    return results;
  }

  destroy(): void {
    this.parser.destroy();
  }
}

// Usage example
const processor = new BatchProcessor(50); // 50 documents per batch
await processor.init();

const documents = Array.from({ length: 1000 }, (_, i) => `<div>Document ${i}</div>`);
const results = await processor.processBatch(documents);

processor.destroy();
```

## Smart Caching

v2.0 includes smart font metrics caching that significantly improves performance:

### Cache Performance

```typescript
// Get cache statistics
const stats = parser.getCacheStats();
console.log(`Cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`Cache entries: ${stats.entries}`);
console.log(`Memory usage: ${(stats.memoryUsage / 1024).toFixed(1)} KB`);

// Cache performance metrics
// - Repeated parsing hit rate: 91.2%
// - Large document hit rate: 100%
// - Performance improvement: 45% faster for repeated content
```

### Cache Optimization

```typescript
class CacheOptimizedParser {
  private parser: HtmlLayoutParser;
  private parseCount = 0;

  constructor() {
    this.parser = new HtmlLayoutParser();
  }

  async init(): Promise<void> {
    await this.parser.init();
  }

  parse(html: string, options: { viewportWidth: number }): CharLayout[] {
    this.parseCount++;
    
    // Check cache performance every 100 parses
    if (this.parseCount % 100 === 0) {
      const stats = this.parser.getCacheStats();
      
      if (stats.hitRate < 0.5) {
        console.warn(`Low cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
      }
      
      // If too many cache entries, consider cleanup
      if (stats.entries > 10000) {
        console.log('Too many cache entries, clearing cache');
        this.parser.clearCache();
        this.parser.resetCacheStats();
      }
    }

    return this.parser.parse(html, options);
  }

  destroy(): void {
    this.parser.destroy();
  }
}
```

## Performance Monitoring

### Basic Performance Monitoring

```typescript
function measurePerformance<T>(
  operation: () => T,
  operationName: string
): { result: T; duration: number } {
  const start = performance.now();
  const result = operation();
  const duration = performance.now() - start;
  
  console.log(`${operationName}: ${duration.toFixed(2)}ms`);
  
  return { result, duration };
}

// Usage example
const { result: layouts, duration } = measurePerformance(
  () => parser.parse(html, { viewportWidth: 800 }),
  'Parse HTML'
);

if (duration > 100) {
  console.warn(`Parse time too long: ${duration.toFixed(2)}ms`);
}
```

### Detailed Performance Analysis

```typescript
class PerformanceAnalyzer {
  private parser: HtmlLayoutParser;
  private metrics: Array<{
    timestamp: number;
    operation: string;
    duration: number;
    documentSize: number;
    charsPerSecond: number;
  }> = [];

  constructor(parser: HtmlLayoutParser) {
    this.parser = parser;
  }

  analyzeParsePerformance(html: string, options: { viewportWidth: number }): CharLayout[] {
    const start = performance.now();
    const documentSize = html.length;
    
    const result = this.parser.parse(html, options);
    
    const duration = performance.now() - start;
    const charsPerSecond = Math.round(documentSize / (duration / 1000));
    
    this.metrics.push({
      timestamp: Date.now(),
      operation: 'parse',
      duration,
      documentSize,
      charsPerSecond
    });

    return result;
  }

  getPerformanceReport(): {
    averageDuration: number;
    averageSpeed: number;
    totalOperations: number;
    slowestOperation: any;
    fastestOperation: any;
  } {
    if (this.metrics.length === 0) {
      return {
        averageDuration: 0,
        averageSpeed: 0,
        totalOperations: 0,
        slowestOperation: null,
        fastestOperation: null
      };
    }

    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const totalSpeed = this.metrics.reduce((sum, m) => sum + m.charsPerSecond, 0);
    
    const slowest = this.metrics.reduce((prev, curr) => 
      prev.duration > curr.duration ? prev : curr
    );
    
    const fastest = this.metrics.reduce((prev, curr) => 
      prev.charsPerSecond > curr.charsPerSecond ? prev : curr
    );

    return {
      averageDuration: totalDuration / this.metrics.length,
      averageSpeed: totalSpeed / this.metrics.length,
      totalOperations: this.metrics.length,
      slowestOperation: slowest,
      fastestOperation: fastest
    };
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

// Usage example
const analyzer = new PerformanceAnalyzer(parser);

// Analyze performance of multiple documents
const documents = [
  '<div>Simple document</div>',
  '<div style="color: red; font-size: 16px;">Medium complexity document</div>',
  // ... more documents
];

for (const html of documents) {
  analyzer.analyzeParsePerformance(html, { viewportWidth: 800 });
}

// Get performance report
const report = analyzer.getPerformanceReport();
console.log('Performance report:', report);
```

## Large Document Handling

### Document Size Limits

```typescript
// Set maximum character limit
const layouts = parser.parse(html, {
  viewportWidth: 800,
  maxCharacters: 50000  // Limit to 50,000 characters
});

// Set timeout limit
const layouts = parser.parse(html, {
  viewportWidth: 800,
  timeout: 10000  // 10 second timeout
});
```

### Chunked Processing

```typescript
function parseInChunks(
  parser: HtmlLayoutParser,
  html: string,
  chunkSize: number = 10000
): CharLayout[][] {
  const chunks: CharLayout[][] = [];
  let offset = 0;
  
  while (offset < html.length) {
    const chunk = html.slice(offset, offset + chunkSize);
    
    try {
      const layouts = parser.parse(chunk, {
        viewportWidth: 800,
        maxCharacters: chunkSize,
        timeout: 5000
      });
      
      chunks.push(layouts);
    } catch (error) {
      console.error(`Error processing chunk ${Math.floor(offset / chunkSize)}:`, error);
      // Can choose to skip this chunk or use default values
    }
    
    offset += chunkSize;
  }
  
  return chunks;
}
```

## Performance Best Practices

### 1. Preload Fonts

```typescript
class FontPreloader {
  private parser: HtmlLayoutParser;
  private preloadedFonts: Map<string, number> = new Map();

  constructor(parser: HtmlLayoutParser) {
    this.parser = parser;
  }

  async preloadCommonFonts(): Promise<void> {
    const commonFonts = [
      { url: '/fonts/arial.ttf', name: 'Arial' },
      { url: '/fonts/times.ttf', name: 'Times New Roman' },
      { url: '/fonts/helvetica.ttf', name: 'Helvetica' }
    ];

    const loadPromises = commonFonts.map(async ({ url, name }) => {
      try {
        const response = await fetch(url);
        const fontData = new Uint8Array(await response.arrayBuffer());
        const fontId = this.parser.loadFont(fontData, name);
        
        if (fontId > 0) {
          this.preloadedFonts.set(name, fontId);
          console.log(`Preloaded font: ${name} (ID: ${fontId})`);
        }
      } catch (error) {
        console.warn(`Failed to preload font ${name}:`, error);
      }
    });

    await Promise.all(loadPromises);
    
    // Set default font
    const arialId = this.preloadedFonts.get('Arial');
    if (arialId) {
      this.parser.setDefaultFont(arialId);
    }
  }

  getPreloadedFont(name: string): number | undefined {
    return this.preloadedFonts.get(name);
  }
}
```

### 2. Parser Pool Pattern

```typescript
class ParserPool {
  private parsers: HtmlLayoutParser[] = [];
  private available: HtmlLayoutParser[] = [];
  private busy: Set<HtmlLayoutParser> = new Set();
  private maxSize: number;

  constructor(maxSize: number = 5) {
    this.maxSize = maxSize;
  }

  async init(): Promise<void> {
    // Create initial parser pool
    for (let i = 0; i < this.maxSize; i++) {
      const parser = new HtmlLayoutParser();
      await parser.init();
      
      this.parsers.push(parser);
      this.available.push(parser);
    }
  }

  async acquire(): Promise<HtmlLayoutParser> {
    if (this.available.length === 0) {
      // Wait for available parser
      await new Promise(resolve => setTimeout(resolve, 10));
      return this.acquire();
    }

    const parser = this.available.pop()!;
    this.busy.add(parser);
    return parser;
  }

  release(parser: HtmlLayoutParser): void {
    if (this.busy.has(parser)) {
      this.busy.delete(parser);
      this.available.push(parser);
    }
  }

  async parse(html: string, options: { viewportWidth: number }): Promise<CharLayout[]> {
    const parser = await this.acquire();
    
    try {
      return parser.parse(html, options);
    } finally {
      this.release(parser);
    }
  }

  destroy(): void {
    for (const parser of this.parsers) {
      parser.destroy();
    }
    
    this.parsers = [];
    this.available = [];
    this.busy.clear();
  }
}

// Usage example
const pool = new ParserPool(3); // Pool of 3 parsers
await pool.init();

// Process multiple documents concurrently
const documents = ['<div>Doc 1</div>', '<div>Doc 2</div>', '<div>Doc 3</div>'];
const promises = documents.map(html => 
  pool.parse(html, { viewportWidth: 800 })
);

const results = await Promise.all(promises);
pool.destroy();
```

### 3. Result Caching

```typescript
class ResultCache {
  private cache: Map<string, CharLayout[]> = new Map();
  private maxSize: number;
  private accessCount: Map<string, number> = new Map();

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  private generateKey(html: string, options: { viewportWidth: number }): string {
    return `${html.length}-${options.viewportWidth}-${this.hashString(html)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  get(html: string, options: { viewportWidth: number }): CharLayout[] | null {
    const key = this.generateKey(html, options);
    const result = this.cache.get(key);
    
    if (result) {
      this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
    }
    
    return result || null;
  }

  set(html: string, options: { viewportWidth: number }, result: CharLayout[]): void {
    const key = this.generateKey(html, options);
    
    // If cache is full, evict least used entry
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }
    
    this.cache.set(key, result);
    this.accessCount.set(key, 1);
  }

  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let minCount = Infinity;
    
    for (const [key, count] of this.accessCount) {
      if (count < minCount) {
        minCount = count;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      this.accessCount.delete(leastUsedKey);
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessCount.clear();
  }

  getStats(): { size: number; hitRate: number } {
    const totalAccess = Array.from(this.accessCount.values()).reduce((sum, count) => sum + count, 0);
    const hits = Array.from(this.accessCount.values()).filter(count => count > 1).length;
    
    return {
      size: this.cache.size,
      hitRate: totalAccess > 0 ? hits / totalAccess : 0
    };
  }
}

// Usage example
class CachedParser {
  private parser: HtmlLayoutParser;
  private cache: ResultCache;

  constructor() {
    this.parser = new HtmlLayoutParser();
    this.cache = new ResultCache(500); // Cache 500 results
  }

  async init(): Promise<void> {
    await this.parser.init();
  }

  parse(html: string, options: { viewportWidth: number }): CharLayout[] {
    // Try to get from cache
    const cached = this.cache.get(html, options);
    if (cached) {
      return cached;
    }

    // Parse and cache result
    const result = this.parser.parse(html, options);
    this.cache.set(html, options, result);
    
    return result;
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  destroy(): void {
    this.parser.destroy();
    this.cache.clear();
  }
}
```

## Performance Debugging

### Enable Performance Metrics

```typescript
const result = parser.parseWithDiagnostics(html, {
  viewportWidth: 800,
  enableMetrics: true
});

if (result.metrics) {
  console.log('Performance metrics:');
  console.log(`  Parse time: ${result.metrics.parseTime}ms`);
  console.log(`  Layout time: ${result.metrics.layoutTime}ms`);
  console.log(`  Serialization time: ${result.metrics.serializationTime}ms`);
  console.log(`  Total time: ${result.metrics.totalTime}ms`);
  console.log(`  Parse speed: ${result.metrics.charsPerSecond} chars/sec`);
  console.log(`  Character count: ${result.metrics.characterCount}`);
}
```

### Performance Bottleneck Analysis

```typescript
function analyzeBottlenecks(metrics: any) {
  const { parseTime, layoutTime, serializationTime } = metrics;
  const total = parseTime + layoutTime + serializationTime;
  
  console.log('Performance bottleneck analysis:');
  console.log(`  HTML parsing: ${((parseTime / total) * 100).toFixed(1)}%`);
  console.log(`  Layout calculation: ${((layoutTime / total) * 100).toFixed(1)}%`);
  console.log(`  Result serialization: ${((serializationTime / total) * 100).toFixed(1)}%`);
  
  // Identify bottleneck
  if (parseTime > layoutTime && parseTime > serializationTime) {
    console.log('Bottleneck: HTML parsing - consider simplifying HTML structure');
  } else if (layoutTime > parseTime && layoutTime > serializationTime) {
    console.log('Bottleneck: Layout calculation - consider reducing CSS complexity');
  } else if (serializationTime > parseTime && serializationTime > layoutTime) {
    console.log('Bottleneck: Result serialization - consider using simpler output mode');
  }
}
```

## Web Worker Offloading

Move parsing to a Web Worker for better UI responsiveness:

```typescript
// worker.ts
import { HtmlLayoutParser } from 'html-layout-parser/worker';

let parser: HtmlLayoutParser;

self.onmessage = async (e) => {
  const { type, data } = e.data;
  
  switch (type) {
    case 'init':
      parser = new HtmlLayoutParser();
      await parser.init();
      self.postMessage({ type: 'ready' });
      break;
      
    case 'loadFont':
      const fontId = parser.loadFont(data.fontData, data.fontName);
      parser.setDefaultFont(fontId);
      self.postMessage({ type: 'fontLoaded', fontId });
      break;
      
    case 'parse':
      const layouts = parser.parse(data.html, data.options);
      self.postMessage({ type: 'parsed', layouts });
      break;
      
    case 'destroy':
      parser.destroy();
      break;
  }
};
```

```typescript
// main.ts
const worker = new Worker('worker.ts', { type: 'module' });

worker.postMessage({ type: 'init' });
worker.onmessage = (e) => {
  if (e.data.type === 'ready') {
    worker.postMessage({ 
      type: 'parse', 
      data: { html, options: { viewportWidth: 800 } }
    });
  }
  if (e.data.type === 'parsed') {
    renderToCanvas(ctx, e.data.layouts);
  }
};
```

## Performance Checklist

- [ ] Reuse parser instances
- [ ] Load fonts once, use many times
- [ ] Use `flat` mode unless you need hierarchy
- [ ] Set `maxCharacters` for user input
- [ ] Set `timeout` for untrusted content
- [ ] Monitor with `enableMetrics`
- [ ] Consider Web Worker for large documents
- [ ] Check cache hit rate with `getCacheStats()`
