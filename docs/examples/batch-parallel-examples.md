# Batch and Parallel Processing Examples

Examples demonstrating efficient batch and parallel processing with shared fonts.

## Table of Contents

1. [Shared Font Processing](#shared-font-processing)
2. [Sequential Batch Processing](#sequential-batch-processing)
3. [Parallel Document Parsing](#parallel-document-parsing)
4. [High-Throughput Patterns](#high-throughput-patterns)
5. [Memory-Efficient Batch Processing](#memory-efficient-batch-processing)

---

## Shared Font Processing

The key to efficient batch processing is loading fonts once and reusing them across multiple parse operations.

```typescript
import { HtmlLayoutParser, CharLayout, FontInfo } from 'html-layout-parser';

/**
 * Font Reuse Pattern
 * 
 * ✅ RECOMMENDED: Load fonts once, parse many documents
 * ❌ AVOID: Loading/unloading fonts for each document
 */

// ✅ CORRECT: Efficient font reuse
async function efficientBatchProcessing(documents: string[]): Promise<CharLayout[][]> {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load font ONCE
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    const fontId = parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(fontId);

    console.log('Font loaded once, processing all documents...');

    // Parse ALL documents with the same font
    const results: CharLayout[][] = [];
    for (const html of documents) {
      const layouts = parser.parse(html, { viewportWidth: 800 });
      results.push(layouts);
    }

    return results;
  } finally {
    // Clean up only after ALL processing is done
    parser.destroy();
  }
}

// ❌ INEFFICIENT: Loading font for each document
async function inefficientProcessing(documents: string[]): Promise<CharLayout[][]> {
  const results: CharLayout[][] = [];

  for (const html of documents) {
    const parser = new HtmlLayoutParser();
    await parser.init();

    // Loading font for EACH document - wasteful!
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

// Performance comparison
async function comparePerformance() {
  const documents = Array.from({ length: 100 }, (_, i) => 
    `<div style="font-size: 16px;">Document ${i + 1} content here.</div>`
  );

  // Efficient approach
  console.log('Testing efficient approach...');
  const startEfficient = performance.now();
  await efficientBatchProcessing(documents);
  const timeEfficient = performance.now() - startEfficient;

  // Inefficient approach (don't do this!)
  console.log('Testing inefficient approach...');
  const startInefficient = performance.now();
  await inefficientProcessing(documents);
  const timeInefficient = performance.now() - startInefficient;

  console.log(`\nResults for ${documents.length} documents:`);
  console.log(`Efficient (shared font): ${timeEfficient.toFixed(2)}ms`);
  console.log(`Inefficient (reload font): ${timeInefficient.toFixed(2)}ms`);
  console.log(`Speedup: ${(timeInefficient / timeEfficient).toFixed(1)}x faster`);
}
```

---

## Sequential Batch Processing

Processing documents one at a time with shared resources.

```typescript
import { HtmlLayoutParser, CharLayout, MemoryMetrics } from 'html-layout-parser';

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
    // Check if already loaded
    if (this.loadedFonts.has(fontName)) {
      return this.loadedFonts.get(fontName)!;
    }

    const fontId = this.parser.loadFont(fontData, fontName);
    if (fontId > 0) {
      this.loadedFonts.set(fontName, fontId);
      
      // Set as default if first font
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

// Usage
async function sequentialBatchExample() {
  const processor = new SequentialBatchProcessor();

  try {
    await processor.init();

    // Load fonts
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    await processor.loadFont(fontData, 'Arial');

    // Prepare documents
    const documents = Array.from({ length: 50 }, (_, i) => ({
      html: `<div class="item">Item ${i + 1}</div>`,
      css: '.item { font-size: 16px; color: #333333FF; }'
    }));

    // Process with progress callback
    console.log('Processing documents...');
    const results = await processor.processBatch(
      documents,
      { viewportWidth: 600 },
      (current, total) => {
        const percent = Math.round((current / total) * 100);
        process.stdout.write(`\rProgress: ${percent}% (${current}/${total})`);
      }
    );

    console.log('\n\nResults:');
    const successful = results.filter(r => r.success);
    const totalChars = successful.reduce((sum, r) => sum + r.characterCount, 0);
    const totalTime = results.reduce((sum, r) => sum + r.processingTime, 0);

    console.log(`Processed: ${successful.length}/${results.length} documents`);
    console.log(`Total characters: ${totalChars}`);
    console.log(`Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`Average: ${(totalTime / results.length).toFixed(2)}ms per document`);

    // Memory info
    const metrics = processor.getMemoryMetrics();
    if (metrics) {
      console.log(`Memory usage: ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
    }

  } finally {
    processor.destroy();
  }
}

sequentialBatchExample();
```

---

## Parallel Document Parsing

Processing multiple documents simultaneously using Promise.all.

```typescript
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser';

/**
 * Parallel Processing with Shared Parser
 * 
 * The parser is thread-safe for parsing operations when fonts are already loaded.
 * Multiple parse() calls can run concurrently.
 */

async function parallelProcessing(documents: string[]): Promise<CharLayout[][]> {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load font once
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    // Parse all documents in parallel
    const results = await Promise.all(
      documents.map(html => 
        Promise.resolve(parser.parse(html, { viewportWidth: 800 }))
      )
    );

    return results;
  } finally {
    parser.destroy();
  }
}

/**
 * Chunked Parallel Processing
 * 
 * Process documents in chunks to control memory usage and concurrency.
 */

async function chunkedParallelProcessing(
  documents: string[],
  chunkSize: number = 10
): Promise<CharLayout[][]> {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load font
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    const results: CharLayout[][] = [];

    // Process in chunks
    for (let i = 0; i < documents.length; i += chunkSize) {
      const chunk = documents.slice(i, i + chunkSize);
      
      const chunkResults = await Promise.all(
        chunk.map(html => 
          Promise.resolve(parser.parse(html, { viewportWidth: 800 }))
        )
      );

      results.push(...chunkResults);

      // Progress
      const processed = Math.min(i + chunkSize, documents.length);
      console.log(`Processed ${processed}/${documents.length} documents`);
    }

    return results;
  } finally {
    parser.destroy();
  }
}

/**
 * Parallel Processing with Different CSS
 * 
 * Each document can have its own CSS while sharing the same fonts.
 */

interface DocumentWithCSS {
  html: string;
  css?: string;
}

async function parallelWithCSS(documents: DocumentWithCSS[]): Promise<CharLayout[][]> {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load fonts
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    // Parse all with their respective CSS
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

// Usage example
async function parallelExample() {
  // Generate test documents
  const documents: DocumentWithCSS[] = Array.from({ length: 100 }, (_, i) => ({
    html: `<div class="item">Document ${i + 1}</div>`,
    css: `.item { 
      font-size: ${14 + (i % 4) * 2}px; 
      color: #${(333333 + i * 1000).toString(16).slice(0, 6)}FF; 
    }`
  }));

  console.log(`Processing ${documents.length} documents in parallel...`);
  const startTime = performance.now();

  const results = await parallelWithCSS(documents);

  const endTime = performance.now();
  const totalChars = results.reduce((sum, r) => sum + r.length, 0);

  console.log(`\nResults:`);
  console.log(`Documents: ${results.length}`);
  console.log(`Total characters: ${totalChars}`);
  console.log(`Total time: ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`Throughput: ${(totalChars / ((endTime - startTime) / 1000)).toFixed(0)} chars/sec`);
}

parallelExample();
```

---

## High-Throughput Patterns

Patterns optimized for maximum throughput.

```typescript
import { HtmlLayoutParser, CharLayout, FontInfo } from 'html-layout-parser';

/**
 * High-Throughput Parser
 * 
 * Optimized for processing large volumes of documents.
 */

class HighThroughputParser {
  private parser: HtmlLayoutParser;
  private initialized = false;
  private fontCache: Map<string, number> = new Map();
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
      if (!this.fontCache.has(font.name)) {
        const fontId = this.parser.loadFont(font.data, font.name);
        if (fontId > 0) {
          this.fontCache.set(font.name, fontId);
        }
      }
    }

    // Set first font as default
    const firstFontId = this.fontCache.values().next().value;
    if (firstFontId) {
      this.parser.setDefaultFont(firstFontId);
    }
  }

  parse(html: string, viewportWidth: number = 800, css?: string): CharLayout[] {
    const startTime = performance.now();
    
    const result = this.parser.parse(html, {
      viewportWidth,
      css,
      mode: 'flat' // Fastest mode
    });

    // Update stats
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

    // Process in batches with controlled concurrency
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
    this.stats = {
      documentsProcessed: 0,
      charactersProcessed: 0,
      totalTime: 0
    };
  }

  destroy(): void {
    this.parser.destroy();
    this.fontCache.clear();
    this.initialized = false;
  }
}

// Usage
async function highThroughputExample() {
  const parser = new HighThroughputParser();

  try {
    await parser.init();

    // Preload fonts
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    await parser.preloadFonts([{ data: fontData, name: 'Arial' }]);

    // Generate large batch of documents
    const documents = Array.from({ length: 1000 }, (_, i) => ({
      html: `<div>Document ${i + 1} with some content that needs to be parsed.</div>`,
      css: '.content { font-size: 16px; }'
    }));

    console.log(`Processing ${documents.length} documents...`);
    const startTime = performance.now();

    await parser.processBatchParallel(documents, 800, 20);

    const endTime = performance.now();
    const stats = parser.getStats();

    console.log('\n=== High-Throughput Results ===');
    console.log(`Documents: ${stats.documentsProcessed}`);
    console.log(`Characters: ${stats.charactersProcessed}`);
    console.log(`Total time: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`Avg per document: ${stats.averageTimePerDocument.toFixed(2)}ms`);
    console.log(`Throughput: ${stats.throughput.toFixed(0)} chars/sec`);

  } finally {
    parser.destroy();
  }
}

highThroughputExample();
```

---

## Memory-Efficient Batch Processing

Processing large batches while keeping memory usage under control.

```typescript
import { HtmlLayoutParser, CharLayout, MemoryMetrics } from 'html-layout-parser';

/**
 * Memory-Efficient Batch Processor
 * 
 * Monitors memory usage and processes documents in a memory-conscious way.
 */

class MemoryEfficientProcessor {
  private parser: HtmlLayoutParser;
  private maxMemoryMB: number;
  private initialized = false;

  constructor(maxMemoryMB: number = 40) {
    this.parser = new HtmlLayoutParser();
    this.maxMemoryMB = maxMemoryMB;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await this.parser.init();
    this.initialized = true;
  }

  async loadFont(fontData: Uint8Array, fontName: string): Promise<number> {
    const fontId = this.parser.loadFont(fontData, fontName);
    if (fontId > 0) {
      this.parser.setDefaultFont(fontId);
    }
    return fontId;
  }

  private checkMemory(): { usage: number; exceedsLimit: boolean } {
    const metrics = this.parser.getMemoryMetrics();
    const usageMB = metrics ? metrics.totalMemoryUsage / 1024 / 1024 : 0;
    return {
      usage: usageMB,
      exceedsLimit: usageMB > this.maxMemoryMB
    };
  }

  async processWithCallback<T>(
    documents: Array<{ html: string; css?: string }>,
    viewportWidth: number,
    onResult: (index: number, result: CharLayout[]) => T | Promise<T>
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];

      // Check memory before processing
      const memCheck = this.checkMemory();
      if (memCheck.exceedsLimit) {
        console.warn(`Memory usage (${memCheck.usage.toFixed(2)} MB) exceeds limit. Consider reducing batch size.`);
      }

      // Parse document
      const layouts = this.parser.parse(doc.html, {
        viewportWidth,
        css: doc.css
      });

      // Process result immediately (allows for streaming/saving)
      const processedResult = await onResult(i, layouts);
      results.push(processedResult);

      // Progress
      if ((i + 1) % 100 === 0) {
        const mem = this.checkMemory();
        console.log(`Processed ${i + 1}/${documents.length} (Memory: ${mem.usage.toFixed(2)} MB)`);
      }
    }

    return results;
  }

  /**
   * Stream processing - process and discard results immediately
   * Useful when you need to save results to disk/database
   */
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

      // Don't hold reference to layouts - let GC clean up
    }

    return { processed, totalChars };
  }

  getMemoryMetrics(): MemoryMetrics | null {
    return this.parser.getMemoryMetrics();
  }

  destroy(): void {
    this.parser.destroy();
    this.initialized = false;
  }
}

// Usage: Save results to files as they're processed
async function memoryEfficientExample() {
  const processor = new MemoryEfficientProcessor(40); // 40MB limit

  try {
    await processor.init();

    // Load font
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    await processor.loadFont(fontData, 'Arial');

    // Large batch of documents
    const documents = Array.from({ length: 500 }, (_, i) => ({
      html: `<div>Document ${i + 1} with content.</div>`,
      css: '.content { font-size: 16px; }'
    }));

    console.log(`Processing ${documents.length} documents with memory limit...`);

    // Stream process - results are saved immediately, not held in memory
    const stats = await processor.streamProcess(
      documents,
      800,
      async (index, layouts) => {
        // In real usage, save to file or database here
        // await fs.writeFile(`output/doc_${index}.json`, JSON.stringify(layouts));
        
        // For demo, just log
        if (index % 100 === 0) {
          console.log(`Saved document ${index} (${layouts.length} chars)`);
        }
      }
    );

    console.log('\n=== Results ===');
    console.log(`Processed: ${stats.processed} documents`);
    console.log(`Total characters: ${stats.totalChars}`);

    const metrics = processor.getMemoryMetrics();
    if (metrics) {
      console.log(`Final memory: ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
    }

  } finally {
    processor.destroy();
  }
}

memoryEfficientExample();
```
