# Memory Management Examples

Examples demonstrating correct memory management patterns.

## Correct Load/Unload Patterns

### Basic Pattern: Load Once, Use Many Times

```typescript
import { HtmlLayoutParser, CharLayout } from '/html-layout-parser/index.js';

// ✅ CORRECT: Load font once, use for multiple parses
async function correctPattern() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load font ONCE
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    const fontId = parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(fontId);

    // Use for MANY parses
    const documents = ['<div>Doc 1</div>', '<div>Doc 2</div>', '<div>Doc 3</div>'];

    for (const html of documents) {
      const layouts = parser.parse(html, { viewportWidth: 800 });
      console.log(`Parsed ${layouts.length} characters`);
    }

  } finally {
    parser.destroy();
  }
}

// ❌ INCORRECT: Loading/unloading font for each parse
async function incorrectPattern() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    const documents = ['<div>Doc 1</div>', '<div>Doc 2</div>'];

    for (const html of documents) {
      // ❌ BAD: Loading font for each document
      const fontResponse = await fetch('/fonts/arial.ttf');
      const fontData = new Uint8Array(await fontResponse.arrayBuffer());
      const fontId = parser.loadFont(fontData, 'Arial');
      parser.setDefaultFont(fontId);

      const layouts = parser.parse(html, { viewportWidth: 800 });

      // ❌ BAD: Unloading immediately
      parser.unloadFont(fontId);
    }
  } finally {
    parser.destroy();
  }
}
```

## Memory Monitoring

### Basic Memory Monitoring

```typescript
import { HtmlLayoutParser, MemoryMetrics } from '/html-layout-parser/index.js';

function logMemoryMetrics(parser: HtmlLayoutParser): void {
  const metrics = parser.getMemoryMetrics();
  
  if (metrics) {
    const totalMB = (metrics.totalMemoryUsage / 1024 / 1024).toFixed(2);
    console.log(`Total Memory: ${totalMB} MB`);
    console.log(`Font Count: ${metrics.fontCount}`);
    
    for (const font of metrics.fonts) {
      const fontMB = (font.memoryUsage / 1024 / 1024).toFixed(2);
      console.log(`  - ${font.name} (ID: ${font.id}): ${fontMB} MB`);
    }
  }
}

async function memoryMonitoringExample() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    console.log('=== After Font Load ===');
    logMemoryMetrics(parser);

    for (let i = 0; i < 100; i++) {
      parser.parse(`<div>Document ${i}</div>`, { viewportWidth: 800 });
    }

    console.log('\n=== After Parsing 100 Documents ===');
    logMemoryMetrics(parser);

    if (parser.checkMemoryThreshold()) {
      console.warn('⚠️ Memory usage exceeds 50MB threshold!');
    }

  } finally {
    parser.destroy();
  }
}
```

### Continuous Memory Monitoring

```typescript
import { HtmlLayoutParser, MemoryMetrics } from '/html-layout-parser/index.js';

class MemoryMonitor {
  private parser: HtmlLayoutParser;
  private intervalId: NodeJS.Timeout | null = null;
  private warningThresholdMB: number;
  private criticalThresholdMB: number;
  private onWarning?: (metrics: MemoryMetrics) => void;
  private onCritical?: (metrics: MemoryMetrics) => void;

  constructor(
    parser: HtmlLayoutParser,
    options: {
      warningThresholdMB?: number;
      criticalThresholdMB?: number;
      onWarning?: (metrics: MemoryMetrics) => void;
      onCritical?: (metrics: MemoryMetrics) => void;
    } = {}
  ) {
    this.parser = parser;
    this.warningThresholdMB = options.warningThresholdMB || 40;
    this.criticalThresholdMB = options.criticalThresholdMB || 50;
    this.onWarning = options.onWarning;
    this.onCritical = options.onCritical;
  }

  start(intervalMs: number = 5000): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.check(), intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  check(): MemoryMetrics | null {
    const metrics = this.parser.getMemoryMetrics();
    if (!metrics) return null;

    const usageMB = metrics.totalMemoryUsage / 1024 / 1024;

    if (usageMB >= this.criticalThresholdMB) {
      console.error(`🔴 CRITICAL: ${usageMB.toFixed(2)} MB`);
      this.onCritical?.(metrics);
    } else if (usageMB >= this.warningThresholdMB) {
      console.warn(`🟡 WARNING: ${usageMB.toFixed(2)} MB`);
      this.onWarning?.(metrics);
    }

    return metrics;
  }

  getStatus(): { usageMB: number; status: 'ok' | 'warning' | 'critical' } {
    const metrics = this.parser.getMemoryMetrics();
    const usageMB = metrics ? metrics.totalMemoryUsage / 1024 / 1024 : 0;

    let status: 'ok' | 'warning' | 'critical' = 'ok';
    if (usageMB >= this.criticalThresholdMB) status = 'critical';
    else if (usageMB >= this.warningThresholdMB) status = 'warning';

    return { usageMB, status };
  }
}
```

## Resource Cleanup

### Using try/finally for Guaranteed Cleanup

```typescript
import { HtmlLayoutParser } from '/html-layout-parser/index.js';

// ✅ CORRECT: Always use try/finally for cleanup
async function guaranteedCleanup() {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();

    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });
    return layouts;

  } finally {
    // This ALWAYS runs, even if an error occurred
    parser.destroy();
  }
}

// Wrapper function that ensures cleanup
async function withParser<T>(
  fn: (parser: HtmlLayoutParser) => Promise<T>
): Promise<T> {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();
    return await fn(parser);
  } finally {
    parser.destroy();
  }
}

// Usage
async function cleanupWrapperExample() {
  const result = await withParser(async (parser) => {
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    return parser.parse('<div>Hello</div>', { viewportWidth: 800 });
  });

  console.log(`Parsed ${result.length} characters`);
}
```

### Cleanup in Class-Based Applications

```typescript
import { HtmlLayoutParser, CharLayout } from '/html-layout-parser/index.js';

class DocumentRenderer {
  private parser: HtmlLayoutParser | null = null;
  private initialized = false;
  private destroyed = false;

  async init(): Promise<void> {
    if (this.initialized || this.destroyed) return;

    this.parser = new HtmlLayoutParser();
    await this.parser.init();

    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    this.parser.loadFont(fontData, 'Arial');
    this.parser.setDefaultFont(1);

    this.initialized = true;
  }

  render(html: string, css?: string): CharLayout[] {
    if (!this.parser || this.destroyed) {
      throw new Error('Renderer not initialized or already destroyed');
    }

    return this.parser.parse(html, { viewportWidth: 800, css });
  }

  destroy(): void {
    if (this.destroyed) return;

    if (this.parser) {
      this.parser.destroy();
      this.parser = null;
    }

    this.initialized = false;
    this.destroyed = true;
  }
}

// Usage
async function classCleanupExample() {
  const renderer = new DocumentRenderer();

  try {
    await renderer.init();
    const layouts = renderer.render('<div>Hello</div>');
    console.log(`Rendered ${layouts.length} characters`);
  } finally {
    renderer.destroy();
  }
}
```

## Long-Running Applications

### Singleton Pattern

```typescript
import { HtmlLayoutParser, CharLayout, MemoryMetrics } from '/html-layout-parser/index.js';

class ParserSingleton {
  private static instance: ParserSingleton | null = null;
  private parser: HtmlLayoutParser;
  private initialized = false;
  private loadedFonts: Map<string, number> = new Map();

  private constructor() {
    this.parser = new HtmlLayoutParser();
  }

  static getInstance(): ParserSingleton {
    if (!ParserSingleton.instance) {
      ParserSingleton.instance = new ParserSingleton();
    }
    return ParserSingleton.instance;
  }

  async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    await this.parser.init();
    this.initialized = true;
  }

  async loadFont(fontData: Uint8Array, fontName: string): Promise<number> {
    await this.ensureInitialized();

    if (this.loadedFonts.has(fontName)) {
      return this.loadedFonts.get(fontName)!;
    }

    const fontId = this.parser.loadFont(fontData, fontName);
    if (fontId > 0) {
      this.loadedFonts.set(fontName, fontId);
    }
    return fontId;
  }

  setDefaultFont(fontName: string): boolean {
    const fontId = this.loadedFonts.get(fontName);
    if (fontId) {
      this.parser.setDefaultFont(fontId);
      return true;
    }
    return false;
  }

  parse(html: string, options: { viewportWidth: number; css?: string }): CharLayout[] {
    if (!this.initialized) throw new Error('Parser not initialized');
    return this.parser.parse(html, options);
  }

  performMaintenance(): void {
    if (this.parser.checkMemoryThreshold()) {
      console.warn('Memory threshold exceeded');
    }

    const metrics = this.parser.getMemoryMetrics();
    if (metrics) {
      console.log(`Maintenance: ${metrics.fontCount} fonts, ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
    }
  }

  static destroy(): void {
    if (ParserSingleton.instance) {
      ParserSingleton.instance.parser.destroy();
      ParserSingleton.instance.loadedFonts.clear();
      ParserSingleton.instance.initialized = false;
      ParserSingleton.instance = null;
    }
  }
}
```

## Common Mistakes to Avoid

```typescript
import { HtmlLayoutParser } from '/html-layout-parser/index.js';

// ❌ MISTAKE 1: Forgetting to destroy
async function mistake1() {
  const parser = new HtmlLayoutParser();
  await parser.init();
  const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });
  return layouts;
  // Parser never destroyed - MEMORY LEAK!
}

// ❌ MISTAKE 2: Loading same font multiple times
async function mistake2() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  const fontData = new Uint8Array(await (await fetch('/fonts/arial.ttf')).arrayBuffer());
  
  // Loading same font 3 times - wastes memory!
  parser.loadFont(fontData, 'Arial');
  parser.loadFont(fontData, 'Arial');
  parser.loadFont(fontData, 'Arial');

  parser.destroy();
}

// ❌ MISTAKE 3: Not handling errors
async function mistake3() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  // If fetch fails, parser is never destroyed
  const fontData = new Uint8Array(await (await fetch('/fonts/arial.ttf')).arrayBuffer());
  parser.loadFont(fontData, 'Arial');
  
  parser.destroy();
}

// ❌ MISTAKE 4: Using parser after destroy
async function mistake4() {
  const parser = new HtmlLayoutParser();
  await parser.init();
  
  parser.destroy();
  
  // This will fail!
  const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });
}

// ✅ CORRECT: All mistakes fixed
async function correct() {
  const parser = new HtmlLayoutParser();
  const loadedFonts = new Map<string, number>();

  try {
    await parser.init();

    try {
      const fontData = new Uint8Array(await (await fetch('/fonts/arial.ttf')).arrayBuffer());
      
      // Check if already loaded
      if (!loadedFonts.has('Arial')) {
        const fontId = parser.loadFont(fontData, 'Arial');
        if (fontId > 0) {
          loadedFonts.set('Arial', fontId);
          parser.setDefaultFont(fontId);
        }
      }
    } catch (error) {
      console.error('Failed to load font:', error);
    }

    const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });
    return layouts;

  } finally {
    parser.destroy();
  }
}
```
