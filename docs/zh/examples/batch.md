# 批量处理示例

演示如何使用共享字体进行高效的批量和并行处理。

## 共享字体处理

高效批量处理的关键是加载一次字体并重复使用。

```typescript
// 从环境特定入口点导入
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser/web';

// ✅ 正确：加载一次字体，解析多个文档
async function efficientBatchProcessing(documents: string[]): Promise<CharLayout[][]> {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // 只加载一次字体
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    // 使用相同字体解析所有文档
    const results: CharLayout[][] = [];
    for (const html of documents) {
      const layouts = parser.parse(html, { viewportWidth: 800 });
      results.push(layouts);
    }

    return results;
  } finally {
    parser.destroy();
  }
}

// ❌ 低效：为每个文档加载字体
async function inefficientProcessing(documents: string[]): Promise<CharLayout[][]> {
  const results: CharLayout[][] = [];

  for (const html of documents) {
    const parser = new HtmlLayoutParser();
    await parser.init();

    // 为每个文档加载字体 - 浪费资源！
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    const layouts = parser.parse(html, { viewportWidth: 800 });
    results.push(layouts);

    parser.destroy();
  }

  return results;
}
```

## 顺序批量处理

```typescript
import { HtmlLayoutParser, CharLayout, MemoryMetrics } from 'html-layout-parser/web';

interface BatchResult {
  index: number;
  characterCount: number;
  processingTime: number;
  success: boolean;
  error?: string;
}

class SequentialBatchProcessor {
  private parser: HtmlLayoutParser;
  private initialized = false;
  private loadedFonts: Map<string, number> = new Map();

  constructor() {
    this.parser = new HtmlLayoutParser();
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await this.parser.init();
    this.initialized = true;
  }

  async loadFont(fontData: Uint8Array, fontName: string): Promise<number> {
    if (this.loadedFonts.has(fontName)) {
      return this.loadedFonts.get(fontName)!;
    }

    const fontId = this.parser.loadFont(fontData, fontName);
    if (fontId > 0) {
      this.loadedFonts.set(fontName, fontId);
      if (this.loadedFonts.size === 1) {
        this.parser.setDefaultFont(fontId);
      }
    }

    return fontId;
  }

  async processBatch(
    documents: Array<{ html: string; css?: string }>,
    options: { viewportWidth: number } = { viewportWidth: 800 },
    onProgress?: (index: number, total: number) => void
  ): Promise<BatchResult[]> {
    const results: BatchResult[] = [];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const startTime = performance.now();

      try {
        const layouts = this.parser.parse(doc.html, {
          viewportWidth: options.viewportWidth,
          css: doc.css
        });

        results.push({
          index: i,
          characterCount: layouts.length,
          processingTime: performance.now() - startTime,
          success: true
        });
      } catch (error) {
        results.push({
          index: i,
          characterCount: 0,
          processingTime: performance.now() - startTime,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }

      onProgress?.(i + 1, documents.length);
    }

    return results;
  }

  getMemoryMetrics(): MemoryMetrics | null {
    return this.parser.getMemoryMetrics();
  }

  destroy(): void {
    this.parser.destroy();
    this.loadedFonts.clear();
    this.initialized = false;
  }
}

// 使用示例
async function sequentialBatchExample() {
  const processor = new SequentialBatchProcessor();

  try {
    await processor.init();

    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    await processor.loadFont(fontData, 'Arial');

    const documents = Array.from({ length: 50 }, (_, i) => ({
      html: `<div class="item">项目 ${i + 1}</div>`,
      css: '.item { font-size: 16px; color: #333333FF; }'
    }));

    const results = await processor.processBatch(
      documents,
      { viewportWidth: 600 },
      (current, total) => {
        console.log(`进度: ${current}/${total}`);
      }
    );

    const successful = results.filter(r => r.success);
    const totalChars = successful.reduce((sum, r) => sum + r.characterCount, 0);
    console.log(`已处理: ${successful.length}/${results.length}, 总字符数: ${totalChars}`);

  } finally {
    processor.destroy();
  }
}
```

## 并行文档解析

```typescript
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser/web';

// 分块并行处理
async function chunkedParallelProcessing(
  documents: string[],
  chunkSize: number = 10
): Promise<CharLayout[][]> {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    const results: CharLayout[][] = [];

    for (let i = 0; i < documents.length; i += chunkSize) {
      const chunk = documents.slice(i, i + chunkSize);
      
      const chunkResults = await Promise.all(
        chunk.map(html => 
          Promise.resolve(parser.parse(html, { viewportWidth: 800 }))
        )
      );

      results.push(...chunkResults);
      console.log(`已处理 ${Math.min(i + chunkSize, documents.length)}/${documents.length}`);
    }

    return results;
  } finally {
    parser.destroy();
  }
}

// 每个文档使用不同 CSS 的并行处理
interface DocumentWithCSS {
  html: string;
  css?: string;
}

async function parallelWithCSS(documents: DocumentWithCSS[]): Promise<CharLayout[][]> {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    const results = await Promise.all(
      documents.map(doc => 
        Promise.resolve(parser.parse(doc.html, {
          viewportWidth: 800,
          css: doc.css
        }))
      )
    );

    return results;
  } finally {
    parser.destroy();
  }
}
```

## 高吞吐量模式

```typescript
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser/web';

class HighThroughputParser {
  private parser: HtmlLayoutParser;
  private initialized = false;
  private stats = {
    documentsProcessed: 0,
    charactersProcessed: 0,
    totalTime: 0
  };

  constructor() {
    this.parser = new HtmlLayoutParser();
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await this.parser.init();
    this.initialized = true;
  }

  async preloadFonts(fonts: Array<{ data: Uint8Array; name: string }>): Promise<void> {
    for (const font of fonts) {
      const fontId = this.parser.loadFont(font.data, font.name);
      if (fontId > 0 && fonts.indexOf(font) === 0) {
        this.parser.setDefaultFont(fontId);
      }
    }
  }

  parse(html: string, viewportWidth: number = 800, css?: string): CharLayout[] {
    const startTime = performance.now();
    
    const result = this.parser.parse(html, {
      viewportWidth,
      css,
      mode: 'flat'
    });

    this.stats.documentsProcessed++;
    this.stats.charactersProcessed += result.length;
    this.stats.totalTime += performance.now() - startTime;

    return result;
  }

  async processBatchParallel(
    documents: Array<{ html: string; css?: string }>,
    viewportWidth: number = 800,
    concurrency: number = 10
  ): Promise<CharLayout[][]> {
    const results: CharLayout[][] = [];

    for (let i = 0; i < documents.length; i += concurrency) {
      const batch = documents.slice(i, i + concurrency);
      
      const batchResults = await Promise.all(
        batch.map(doc => 
          Promise.resolve(this.parse(doc.html, viewportWidth, doc.css))
        )
      );

      results.push(...batchResults);
    }

    return results;
  }

  getStats() {
    return {
      ...this.stats,
      averageTimePerDocument: this.stats.documentsProcessed > 0 
        ? this.stats.totalTime / this.stats.documentsProcessed 
        : 0,
      throughput: this.stats.totalTime > 0
        ? (this.stats.charactersProcessed / (this.stats.totalTime / 1000))
        : 0
    };
  }

  resetStats(): void {
    this.stats = { documentsProcessed: 0, charactersProcessed: 0, totalTime: 0 };
  }

  destroy(): void {
    this.parser.destroy();
    this.initialized = false;
  }
}

// 使用示例
async function highThroughputExample() {
  const parser = new HighThroughputParser();

  try {
    await parser.init();

    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    await parser.preloadFonts([{ data: fontData, name: 'Arial' }]);

    const documents = Array.from({ length: 1000 }, (_, i) => ({
      html: `<div>文档 ${i + 1} 内容。</div>`
    }));

    console.log(`处理 ${documents.length} 个文档...`);
    const startTime = performance.now();

    await parser.processBatchParallel(documents, 800, 20);

    const stats = parser.getStats();
    console.log(`\n文档数: ${stats.documentsProcessed}`);
    console.log(`字符数: ${stats.charactersProcessed}`);
    console.log(`吞吐量: ${stats.throughput.toFixed(0)} 字符/秒`);

  } finally {
    parser.destroy();
  }
}
```

## 内存高效的批量处理

```typescript
import { HtmlLayoutParser, CharLayout, MemoryMetrics } from 'html-layout-parser/web';

class MemoryEfficientProcessor {
  private parser: HtmlLayoutParser;
  private maxMemoryMB: number;

  constructor(maxMemoryMB: number = 40) {
    this.parser = new HtmlLayoutParser();
    this.maxMemoryMB = maxMemoryMB;
  }

  async init(): Promise<void> {
    await this.parser.init();
  }

  async loadFont(fontData: Uint8Array, fontName: string): Promise<number> {
    const fontId = this.parser.loadFont(fontData, fontName);
    if (fontId > 0) this.parser.setDefaultFont(fontId);
    return fontId;
  }

  private checkMemory(): { usage: number; exceedsLimit: boolean } {
    const metrics = this.parser.getMemoryMetrics();
    const usageMB = metrics ? metrics.totalMemoryUsage / 1024 / 1024 : 0;
    return { usage: usageMB, exceedsLimit: usageMB > this.maxMemoryMB };
  }

  // 流式处理 - 立即处理和处理结果
  async streamProcess(
    documents: Array<{ html: string; css?: string }>,
    viewportWidth: number,
    onResult: (index: number, result: CharLayout[]) => void | Promise<void>
  ): Promise<{ processed: number; totalChars: number }> {
    let processed = 0;
    let totalChars = 0;

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];

      const layouts = this.parser.parse(doc.html, {
        viewportWidth,
        css: doc.css
      });

      await onResult(i, layouts);

      processed++;
      totalChars += layouts.length;

      if ((i + 1) % 100 === 0) {
        const mem = this.checkMemory();
        console.log(`已处理 ${i + 1}/${documents.length} (内存: ${mem.usage.toFixed(2)} MB)`);
      }
    }

    return { processed, totalChars };
  }

  destroy(): void {
    this.parser.destroy();
  }
}

// 使用示例
async function memoryEfficientExample() {
  const processor = new MemoryEfficientProcessor(40);

  try {
    await processor.init();

    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    await processor.loadFont(fontData, 'Arial');

    const documents = Array.from({ length: 500 }, (_, i) => ({
      html: `<div>文档 ${i + 1}</div>`
    }));

    const stats = await processor.streamProcess(
      documents,
      800,
      async (index, layouts) => {
        // 在这里保存到文件或数据库
        if (index % 100 === 0) {
          console.log(`已保存文档 ${index} (${layouts.length} 字符)`);
        }
      }
    );

    console.log(`已处理: ${stats.processed}, 总字符数: ${stats.totalChars}`);

  } finally {
    processor.destroy();
  }
}
```
