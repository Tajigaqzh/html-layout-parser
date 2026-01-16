# 性能优化

HTML Layout Parser 经过优化，可以实现高性能的 HTML 布局解析。本指南将帮助您最大化解析性能。

## 性能指标

### 实际性能数据

使用 `scripts/benchmark-performance.mjs` 测得，包含热身后多次平均
（默认：warmup=5，iterations=30，mode=flat，viewport=800）。下表使用
warmup=10、iterations=50。字体使用
`examples/font/aliBaBaFont65.ttf`，字体在计时前加载完成。小文档受固定开销影响较大
（HTML 解析、布局、序列化），字符/秒会偏低。

测试环境（2026-01）：
- macOS 26.2（arm64）
- Apple M4
- 16 GB 内存
- Node v25.2.1
- pnpm 8.15.0
- WASM 构建：`wasm-output/html_layout_parser.js`

本地运行：
```bash
pnpm bench:performance -- --warmup=10 --iterations=50
```

| 文档大小 | 解析速度 | 总时间 |
|----------|----------|--------|
| 简单 (11 字符) | 9,442 字符/秒 | 1.17ms |
| 中等 (480 字符) | 105,588 字符/秒 | 4.55ms |
| 大型 (7,200 字符) | 126,155 字符/秒 | 57.07ms |
| 超大 (24,196 字符) | 129,121 字符/秒 | 187.39ms |

### 系统资源

| 指标 | 目标 | 实际 |
|------|------|------|
| 解析速度 | > 1,000 字符/秒 | 9,442 - 129,121 字符/秒 ✅ |
| 内存使用 | < 50MB | ~8MB (1个字体), ~40MB (5个字体) ✅ |
| WASM 大小 | < 2.5MB | 2.25MB ✅ |
| 启动时间 | < 100ms | ~7ms（热启动），~17ms（冷启动） ✅ |
| 缓存命中率 | > 80% | 91.2% ✅ |

## 优化策略

### 1. 重用解析器实例

```typescript
// ✅ 高效：重用解析器实例
async function efficientParsing(documents: string[]) {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();
    
    // 加载字体一次
    const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
    const fontId = parser.loadFont(new Uint8Array(fontData), 'Arial');
    parser.setDefaultFont(fontId);

    // 解析多个文档
    const results = [];
    for (const html of documents) {
      results.push(parser.parse(html, { viewportWidth: 800 }));
    }
    
    return results;
  } finally {
    parser.destroy();
  }
}

// ❌ 低效：每次创建新实例
async function inefficientParsing(documents: string[]) {
  const results = [];
  
  for (const html of documents) {
    const parser = new HtmlLayoutParser(); // 每次都创建新实例
    await parser.init();
    
    const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
    parser.loadFont(new Uint8Array(fontData), 'Arial');
    
    results.push(parser.parse(html, { viewportWidth: 800 }));
    parser.destroy();
  }
  
  return results;
}
```

### 2. 选择合适的输出模式

不同的输出模式有不同的性能特征：

```typescript
// 最快：flat 模式（默认）
const chars = parser.parse(html, { 
  viewportWidth: 800,
  mode: 'flat' 
});

// 中等：byRow 模式
const rows = parser.parse<'byRow'>(html, { 
  viewportWidth: 800,
  mode: 'byRow' 
});

// 较慢：simple 模式
const simple = parser.parse<'simple'>(html, { 
  viewportWidth: 800,
  mode: 'simple' 
});

// 最慢：full 模式（仅在需要完整层次结构时使用）
const doc = parser.parse<'full'>(html, { 
  viewportWidth: 800,
  mode: 'full' 
});
```

### 3. 字体管理优化

```typescript
class OptimizedFontManager {
  private parser: HtmlLayoutParser;
  private fontCache: Map<string, number> = new Map();
  private fontUsage: Map<number, number> = new Map();

  constructor(parser: HtmlLayoutParser) {
    this.parser = parser;
  }

  async loadFont(fontData: Uint8Array, fontName: string): Promise<number> {
    // 检查缓存
    if (this.fontCache.has(fontName)) {
      const fontId = this.fontCache.get(fontName)!;
      this.fontUsage.set(fontId, (this.fontUsage.get(fontId) || 0) + 1);
      return fontId;
    }

    // 加载新字体
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
      // 使用计数为 0，卸载字体
      this.parser.unloadFont(fontId);
      this.fontCache.delete(fontName);
      this.fontUsage.delete(fontId);
    }
  }

  // 清理未使用的字体
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

### 4. 批量处理优化

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
    
    // 分批处理
    for (let i = 0; i < documents.length; i += this.batchSize) {
      const batch = documents.slice(i, i + this.batchSize);
      
      // 处理当前批次
      const batchResults = batch.map(html => 
        this.parser.parse(html, { viewportWidth: 800 })
      );
      
      results.push(...batchResults);
      
      // 检查内存使用
      if (this.parser.checkMemoryThreshold()) {
        console.warn(`批次 ${Math.floor(i / this.batchSize) + 1}: 内存使用过高`);
        // 可以在这里执行清理操作
      }
    }

    return results;
  }

  destroy(): void {
    this.parser.destroy();
  }
}

// 使用示例
const processor = new BatchProcessor(50); // 每批 50 个文档
await processor.init();

const documents = Array.from({ length: 1000 }, (_, i) => `<div>文档 ${i}</div>`);
const results = await processor.processBatch(documents);

processor.destroy();
```

## 智能缓存

v2.0 包含智能字体度量缓存，显著提升性能：

### 缓存性能

```typescript
// 获取缓存统计
const stats = parser.getCacheStats();
console.log(`缓存命中率: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`缓存条目: ${stats.entries}`);
console.log(`内存使用: ${(stats.memoryUsage / 1024).toFixed(1)} KB`);

// 缓存性能指标
// - 重复解析的命中率: 91.2%
// - 大文档的命中率: 100%
// - 性能提升: 重复内容快 45%
```

### 缓存优化

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
    
    // 每 100 次解析检查缓存性能
    if (this.parseCount % 100 === 0) {
      const stats = this.parser.getCacheStats();
      
      if (stats.hitRate < 0.5) {
        console.warn(`缓存命中率较低: ${(stats.hitRate * 100).toFixed(1)}%`);
      }
      
      // 如果缓存条目过多，可以考虑清理
      if (stats.entries > 10000) {
        console.log('缓存条目过多，清理缓存');
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

## 性能监控

### 基本性能监控

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

// 使用示例
const { result: layouts, duration } = measurePerformance(
  () => parser.parse(html, { viewportWidth: 800 }),
  '解析 HTML'
);

if (duration > 100) {
  console.warn(`解析时间过长: ${duration.toFixed(2)}ms`);
}
```

### 详细性能分析

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

// 使用示例
const analyzer = new PerformanceAnalyzer(parser);

// 分析多个文档的性能
const documents = [
  '<div>简单文档</div>',
  '<div style="color: red; font-size: 16px;">中等复杂度文档</div>',
  // ... 更多文档
];

for (const html of documents) {
  analyzer.analyzeParsePerformance(html, { viewportWidth: 800 });
}

// 获取性能报告
const report = analyzer.getPerformanceReport();
console.log('性能报告:', report);
```

## 大文档处理

### 文档大小限制

```typescript
// 设置最大字符数限制
const layouts = parser.parse(html, {
  viewportWidth: 800,
  maxCharacters: 50000  // 限制最大 50,000 字符
});

// 设置超时限制
const layouts = parser.parse(html, {
  viewportWidth: 800,
  timeout: 10000  // 10 秒超时
});
```

### 分块处理

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
      console.error(`处理块 ${Math.floor(offset / chunkSize)} 时出错:`, error);
      // 可以选择跳过这个块或使用默认值
    }
    
    offset += chunkSize;
  }
  
  return chunks;
}
```

## 性能最佳实践

### 1. 预加载字体

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
          console.log(`预加载字体: ${name} (ID: ${fontId})`);
        }
      } catch (error) {
        console.warn(`预加载字体 ${name} 失败:`, error);
      }
    });

    await Promise.all(loadPromises);
    
    // 设置默认字体
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

### 2. 连接池模式

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
    // 创建初始解析器池
    for (let i = 0; i < this.maxSize; i++) {
      const parser = new HtmlLayoutParser();
      await parser.init();
      
      this.parsers.push(parser);
      this.available.push(parser);
    }
  }

  async acquire(): Promise<HtmlLayoutParser> {
    if (this.available.length === 0) {
      // 等待可用的解析器
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

// 使用示例
const pool = new ParserPool(3); // 3 个解析器的池
await pool.init();

// 并发处理多个文档
const documents = ['<div>Doc 1</div>', '<div>Doc 2</div>', '<div>Doc 3</div>'];
const promises = documents.map(html => 
  pool.parse(html, { viewportWidth: 800 })
);

const results = await Promise.all(promises);
pool.destroy();
```

### 3. 结果缓存

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
      hash = hash & hash; // 转换为 32 位整数
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
    
    // 如果缓存已满，移除最少使用的条目
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

// 使用示例
class CachedParser {
  private parser: HtmlLayoutParser;
  private cache: ResultCache;

  constructor() {
    this.parser = new HtmlLayoutParser();
    this.cache = new ResultCache(500); // 缓存 500 个结果
  }

  async init(): Promise<void> {
    await this.parser.init();
  }

  parse(html: string, options: { viewportWidth: number }): CharLayout[] {
    // 尝试从缓存获取
    const cached = this.cache.get(html, options);
    if (cached) {
      return cached;
    }

    // 解析并缓存结果
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

## 性能调试

### 启用性能指标

```typescript
const result = parser.parseWithDiagnostics(html, {
  viewportWidth: 800,
  enableMetrics: true
});

if (result.metrics) {
  console.log('性能指标:');
  console.log(`  解析时间: ${result.metrics.parseTime}ms`);
  console.log(`  布局时间: ${result.metrics.layoutTime}ms`);
  console.log(`  序列化时间: ${result.metrics.serializationTime}ms`);
  console.log(`  总时间: ${result.metrics.totalTime}ms`);
  console.log(`  解析速度: ${result.metrics.charsPerSecond} 字符/秒`);
  console.log(`  字符数: ${result.metrics.characterCount}`);
}
```

### 性能瓶颈分析

```typescript
function analyzeBottlenecks(metrics: any) {
  const { parseTime, layoutTime, serializationTime } = metrics;
  const total = parseTime + layoutTime + serializationTime;
  
  console.log('性能瓶颈分析:');
  console.log(`  HTML 解析: ${((parseTime / total) * 100).toFixed(1)}%`);
  console.log(`  布局计算: ${((layoutTime / total) * 100).toFixed(1)}%`);
  console.log(`  结果序列化: ${((serializationTime / total) * 100).toFixed(1)}%`);
  
  // 识别瓶颈
  if (parseTime > layoutTime && parseTime > serializationTime) {
    console.log('瓶颈: HTML 解析 - 考虑简化 HTML 结构');
  } else if (layoutTime > parseTime && layoutTime > serializationTime) {
    console.log('瓶颈: 布局计算 - 考虑减少 CSS 复杂度');
  } else if (serializationTime > parseTime && serializationTime > layoutTime) {
    console.log('瓶颈: 结果序列化 - 考虑使用更简单的输出模式');
  }
}
```
