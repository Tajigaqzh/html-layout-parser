# Memory Management Examples

Examples demonstrating correct memory management patterns for HTML Layout Parser v0.0.1.

## Table of Contents

1. [Correct Load/Unload Patterns](#correct-loadunload-patterns)
2. [Memory Monitoring](#memory-monitoring)
3. [Resource Cleanup](#resource-cleanup)
4. [Long-Running Applications](#long-running-applications)
5. [Common Mistakes to Avoid](#common-mistakes-to-avoid)

---

## Correct Load/Unload Patterns

### Basic Pattern: Load Once, Use Many Times

```typescript
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser';

/**
 * ✅ CORRECT: Load font once, use for multiple parses
 */
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
    const documents = [
      '<div>Document 1</div>',
      '<div>Document 2</div>',
      '<div>Document 3</div>'
    ];

    for (const html of documents) {
      const layouts = parser.parse(html, { viewportWidth: 800 });
      console.log(`Parsed ${layouts.length} characters`);
    }

    // Unload font only when completely done
    parser.unloadFont(fontId);

  } finally {
    // Destroy parser at the very end
    parser.destroy();
  }
}

/**
 * ❌ INCORRECT: Loading/unloading font for each parse
 */
async function incorrectPattern() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    const documents = [
      '<div>Document 1</div>',
      '<div>Document 2</div>',
      '<div>Document 3</div>'
    ];

    for (const html of documents) {
      // ❌ BAD: Loading font for each document
      const fontResponse = await fetch('/fonts/arial.ttf');
      const fontData = new Uint8Array(await fontResponse.arrayBuffer());
      const fontId = parser.loadFont(fontData, 'Arial');
      parser.setDefaultFont(fontId);

      const layouts = parser.parse(html, { viewportWidth: 800 });
      console.log(`Parsed ${layouts.length} characters`);

      // ❌ BAD: Unloading immediately
      parser.unloadFont(fontId);
    }
  } finally {
    parser.destroy();
  }
}
```

### Font Lifecycle Management

```typescript
import { HtmlLayoutParser, FontInfo } from 'html-layout-parser';

/**
 * Font Manager with proper lifecycle management
 */
class FontManager {
  private parser: HtmlLayoutParser;
  private loadedFonts: Map<string, number> = new Map();
  private fontUsageCount: Map<string, number> = new Map();

  constructor(parser: HtmlLayoutParser) {
    this.parser = parser;
  }

  /**
   * Load a font if not already loaded
   * Returns the font ID
   */
  async loadFont(fontData: Uint8Array, fontName: string): Promise<number> {
    // Check if already loaded
    if (this.loadedFonts.has(fontName)) {
      const fontId = this.loadedFonts.get(fontName)!;
      // Increment usage count
      this.fontUsageCount.set(fontName, (this.fontUsageCount.get(fontName) || 0) + 1);
      return fontId;
    }

    // Load new font
    const fontId = this.parser.loadFont(fontData, fontName);
    
    if (fontId > 0) {
      this.loadedFonts.set(fontName, fontId);
      this.fontUsageCount.set(fontName, 1);
      console.log(`Loaded font '${fontName}' (ID: ${fontId})`);
    }

    return fontId;
  }

  /**
   * Release a font (decrements usage count)
   * Only unloads when usage count reaches 0
   */
  releaseFont(fontName: string): void {
    const count = this.fontUsageCount.get(fontName) || 0;
    
    if (count > 1) {
      this.fontUsageCount.set(fontName, count - 1);
      return;
    }

    // Usage count is 0 or 1, actually unload
    const fontId = this.loadedFonts.get(fontName);
    if (fontId) {
      this.parser.unloadFont(fontId);
      this.loadedFonts.delete(fontName);
      this.fontUsageCount.delete(fontName);
      console.log(`Unloaded font '${fontName}'`);
    }
  }

  /**
   * Force unload a font regardless of usage count
   */
  forceUnloadFont(fontName: string): void {
    const fontId = this.loadedFonts.get(fontName);
    if (fontId) {
      this.parser.unloadFont(fontId);
      this.loadedFonts.delete(fontName);
      this.fontUsageCount.delete(fontName);
      console.log(`Force unloaded font '${fontName}'`);
    }
  }

  /**
   * Get font ID by name
   */
  getFontId(fontName: string): number | undefined {
    return this.loadedFonts.get(fontName);
  }

  /**
   * Check if font is loaded
   */
  isLoaded(fontName: string): boolean {
    return this.loadedFonts.has(fontName);
  }

  /**
   * Get all loaded fonts
   */
  getLoadedFonts(): FontInfo[] {
    return this.parser.getLoadedFonts();
  }

  /**
   * Clear all fonts
   */
  clearAll(): void {
    this.parser.clearAllFonts();
    this.loadedFonts.clear();
    this.fontUsageCount.clear();
    console.log('Cleared all fonts');
  }
}

// Usage
async function fontManagerExample() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  const fontManager = new FontManager(parser);

  try {
    // Load fonts
    const arialData = new Uint8Array(await (await fetch('/fonts/arial.ttf')).arrayBuffer());
    const timesData = new Uint8Array(await (await fetch('/fonts/times.ttf')).arrayBuffer());

    const arialId = await fontManager.loadFont(arialData, 'Arial');
    const timesId = await fontManager.loadFont(timesData, 'Times New Roman');

    parser.setDefaultFont(arialId);

    // Use fonts...
    const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });

    // Release fonts when done with specific task
    fontManager.releaseFont('Times New Roman');

    // Arial still loaded for other tasks...

    // Finally release Arial
    fontManager.releaseFont('Arial');

  } finally {
    fontManager.clearAll();
    parser.destroy();
  }
}
```

---

## Memory Monitoring

### Basic Memory Monitoring

```typescript
import { HtmlLayoutParser, MemoryMetrics } from 'html-layout-parser';

async function memoryMonitoringExample() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load font
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    // Check memory after loading font
    console.log('=== After Font Load ===');
    logMemoryMetrics(parser);

    // Parse some documents
    for (let i = 0; i < 100; i++) {
      parser.parse(`<div>Document ${i}</div>`, { viewportWidth: 800 });
    }

    // Check memory after parsing
    console.log('\n=== After Parsing 100 Documents ===');
    logMemoryMetrics(parser);

    // Check threshold
    if (parser.checkMemoryThreshold()) {
      console.warn('⚠️ Memory usage exceeds 50MB threshold!');
    }

  } finally {
    parser.destroy();
  }
}

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
  } else {
    console.log('No metrics available');
  }
}
```

### Continuous Memory Monitoring

```typescript
import { HtmlLayoutParser, MemoryMetrics } from 'html-layout-parser';

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

    this.intervalId = setInterval(() => {
      this.check();
    }, intervalMs);

    console.log(`Memory monitor started (interval: ${intervalMs}ms)`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Memory monitor stopped');
    }
  }

  check(): MemoryMetrics | null {
    const metrics = this.parser.getMemoryMetrics();
    
    if (!metrics) return null;

    const usageMB = metrics.totalMemoryUsage / 1024 / 1024;

    if (usageMB >= this.criticalThresholdMB) {
      console.error(`🔴 CRITICAL: Memory usage ${usageMB.toFixed(2)} MB exceeds ${this.criticalThresholdMB} MB`);
      this.onCritical?.(metrics);
    } else if (usageMB >= this.warningThresholdMB) {
      console.warn(`🟡 WARNING: Memory usage ${usageMB.toFixed(2)} MB exceeds ${this.warningThresholdMB} MB`);
      this.onWarning?.(metrics);
    }

    return metrics;
  }

  getStatus(): { usageMB: number; status: 'ok' | 'warning' | 'critical' } {
    const metrics = this.parser.getMemoryMetrics();
    const usageMB = metrics ? metrics.totalMemoryUsage / 1024 / 1024 : 0;

    let status: 'ok' | 'warning' | 'critical' = 'ok';
    if (usageMB >= this.criticalThresholdMB) {
      status = 'critical';
    } else if (usageMB >= this.warningThresholdMB) {
      status = 'warning';
    }

    return { usageMB, status };
  }
}

// Usage
async function continuousMonitoringExample() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  const monitor = new MemoryMonitor(parser, {
    warningThresholdMB: 30,
    criticalThresholdMB: 45,
    onWarning: (metrics) => {
      console.log('Consider unloading unused fonts');
    },
    onCritical: (metrics) => {
      console.log('Clearing all fonts to free memory');
      parser.clearAllFonts();
    }
  });

  try {
    // Start monitoring
    monitor.start(2000);

    // Load fonts and process documents...
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    // Simulate work
    for (let i = 0; i < 1000; i++) {
      parser.parse(`<div>Document ${i}</div>`, { viewportWidth: 800 });
      
      // Check status periodically
      if (i % 100 === 0) {
        const status = monitor.getStatus();
        console.log(`Progress: ${i}/1000, Memory: ${status.usageMB.toFixed(2)} MB (${status.status})`);
      }
    }

  } finally {
    monitor.stop();
    parser.destroy();
  }
}
```

---

## Resource Cleanup

### Using try/finally for Guaranteed Cleanup

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

/**
 * ✅ CORRECT: Always use try/finally for cleanup
 */
async function guaranteedCleanup() {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();

    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    // This might throw an error
    const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });
    
    // Process layouts...
    return layouts;

  } finally {
    // This ALWAYS runs, even if an error occurred
    parser.destroy();
    console.log('Parser destroyed');
  }
}

/**
 * ❌ INCORRECT: No cleanup on error
 */
async function noCleanupOnError() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  const fontResponse = await fetch('/fonts/arial.ttf');
  const fontData = new Uint8Array(await fontResponse.arrayBuffer());
  parser.loadFont(fontData, 'Arial');
  parser.setDefaultFont(1);

  // If this throws, parser is never destroyed!
  const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });
  
  parser.destroy(); // Never reached if error above
  return layouts;
}
```

### Cleanup with Async/Await

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

/**
 * Wrapper function that ensures cleanup
 */
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
    // Load font
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    // Parse
    return parser.parse('<div>Hello</div>', { viewportWidth: 800 });
  });

  console.log(`Parsed ${result.length} characters`);
  // Parser is automatically destroyed
}
```

### Cleanup in Class-Based Applications

```typescript
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser';

class DocumentRenderer {
  private parser: HtmlLayoutParser | null = null;
  private initialized = false;
  private destroyed = false;

  async init(): Promise<void> {
    if (this.initialized || this.destroyed) return;

    this.parser = new HtmlLayoutParser();
    await this.parser.init();

    // Load default font
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

    return this.parser.parse(html, {
      viewportWidth: 800,
      css
    });
  }

  destroy(): void {
    if (this.destroyed) return;

    if (this.parser) {
      this.parser.destroy();
      this.parser = null;
    }

    this.initialized = false;
    this.destroyed = true;
    console.log('DocumentRenderer destroyed');
  }

  // Implement Symbol.dispose for using declaration (TypeScript 5.2+)
  [Symbol.dispose](): void {
    this.destroy();
  }
}

// Usage with explicit cleanup
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

// Usage with using declaration (TypeScript 5.2+)
async function usingDeclarationExample() {
  using renderer = new DocumentRenderer();
  await renderer.init();
  const layouts = renderer.render('<div>Hello</div>');
  console.log(`Rendered ${layouts.length} characters`);
  // Automatically destroyed when scope exits
}
```

---

## Long-Running Applications

### Singleton Pattern for Long-Running Apps

```typescript
import { HtmlLayoutParser, CharLayout, MemoryMetrics } from 'html-layout-parser';

/**
 * Singleton parser for long-running applications
 */
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
    if (!this.initialized) {
      throw new Error('Parser not initialized');
    }
    return this.parser.parse(html, options);
  }

  getMemoryMetrics(): MemoryMetrics | null {
    return this.parser.getMemoryMetrics();
  }

  /**
   * Periodic cleanup - call this periodically in long-running apps
   */
  performMaintenance(): void {
    // Check memory
    if (this.parser.checkMemoryThreshold()) {
      console.warn('Memory threshold exceeded, consider clearing unused fonts');
    }

    // Log status
    const metrics = this.getMemoryMetrics();
    if (metrics) {
      console.log(`Maintenance: ${metrics.fontCount} fonts, ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
    }
  }

  /**
   * Full cleanup - call on application shutdown
   */
  static destroy(): void {
    if (ParserSingleton.instance) {
      ParserSingleton.instance.parser.destroy();
      ParserSingleton.instance.loadedFonts.clear();
      ParserSingleton.instance.initialized = false;
      ParserSingleton.instance = null;
      console.log('ParserSingleton destroyed');
    }
  }
}

// Usage in long-running app
async function longRunningAppExample() {
  const parser = ParserSingleton.getInstance();

  // Initialize and load fonts once
  await parser.ensureInitialized();
  const fontResponse = await fetch('/fonts/arial.ttf');
  const fontData = new Uint8Array(await fontResponse.arrayBuffer());
  await parser.loadFont(fontData, 'Arial');
  parser.setDefaultFont('Arial');

  // Set up periodic maintenance
  const maintenanceInterval = setInterval(() => {
    parser.performMaintenance();
  }, 60000); // Every minute

  // Handle requests...
  // parser.parse(html, options);

  // On shutdown
  process.on('SIGTERM', () => {
    clearInterval(maintenanceInterval);
    ParserSingleton.destroy();
    process.exit(0);
  });
}
```

---

## Common Mistakes to Avoid

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

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
  
  // This will fail or cause undefined behavior!
  const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });
}

// ❌ MISTAKE 5: Not unloading unused fonts
async function mistake5() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  // Load many fonts but never unload
  for (let i = 0; i < 100; i++) {
    const fontData = new Uint8Array(await (await fetch(`/fonts/font${i}.ttf`)).arrayBuffer());
    parser.loadFont(fontData, `Font${i}`);
  }
  // Memory keeps growing!

  parser.destroy();
}

// ✅ CORRECT: All mistakes fixed
async function correct() {
  const parser = new HtmlLayoutParser();
  const loadedFonts = new Map<string, number>();

  try {
    await parser.init();

    // Load font with error handling
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
      // Continue without font or throw
    }

    // Parse
    const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });
    
    // Unload fonts when done with specific task
    for (const [name, id] of loadedFonts) {
      parser.unloadFont(id);
    }
    loadedFonts.clear();

    return layouts;

  } finally {
    // Always destroy
    parser.destroy();
  }
}
```
