# Memory Management

HTML Layout Parser uses WebAssembly and requires proper memory management to avoid memory leaks.

## Basic Principles

### 1. Always Destroy the Parser
```typescript
// ✅ Correct approach
async function correctUsage() {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();
    // Use parser...
  } finally {
    parser.destroy(); // Must call
  }
}

// ❌ Wrong approach - Memory leak
async function incorrectUsage() {
  const parser = new HtmlLayoutParser();
  await parser.init();
  // Use parser...
  // Forgot to call destroy() - Memory leak!
}
```

### 2. Use try/finally to Ensure Cleanup
```typescript
async function guaranteedCleanup() {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();
    
    // Even if an exception is thrown here...
    const layouts = parser.parse(html, { viewportWidth: 800 });
    
  } finally {
    // This always executes
    parser.destroy();
  }
}
```

## Font Memory Management

### Font Loading Patterns

```typescript
// ✅ Correct: Load once, use many times
async function efficientFontUsage() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load font once
    const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
    const fontId = parser.loadFont(new Uint8Array(fontData), 'Arial');
    parser.setDefaultFont(fontId);

    // Parse multiple documents
    const documents = ['<div>Doc 1</div>', '<div>Doc 2</div>', '<div>Doc 3</div>'];
    
    for (const html of documents) {
      const layouts = parser.parse(html, { viewportWidth: 800 });
      // Process results...
    }

  } finally {
    parser.destroy();
  }
}

// ❌ Wrong: Reload font each time
async function inefficientFontUsage() {
  const documents = ['<div>Doc 1</div>', '<div>Doc 2</div>'];

  for (const html of documents) {
    const parser = new HtmlLayoutParser();
    await parser.init();

    // Reload font each time - Wastes memory and time
    const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
    parser.loadFont(new Uint8Array(fontData), 'Arial');
    parser.setDefaultFont(1);

    const layouts = parser.parse(html, { viewportWidth: 800 });
    parser.destroy();
  }
}
```

### Font Lifecycle Management

```typescript
class FontManager {
  private parser: HtmlLayoutParser;
  private loadedFonts: Map<string, number> = new Map();
  private fontUsageCount: Map<string, number> = new Map();

  constructor(parser: HtmlLayoutParser) {
    this.parser = parser;
  }

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
    }

    return fontId;
  }

  releaseFont(fontName: string): void {
    const count = this.fontUsageCount.get(fontName) || 0;
    
    if (count > 1) {
      // Decrement usage count
      this.fontUsageCount.set(fontName, count - 1);
      return;
    }

    // Usage count is 0, actually unload font
    const fontId = this.loadedFonts.get(fontName);
    if (fontId) {
      this.parser.unloadFont(fontId);
      this.loadedFonts.delete(fontName);
      this.fontUsageCount.delete(fontName);
    }
  }

  clearAll(): void {
    this.parser.clearAllFonts();
    this.loadedFonts.clear();
    this.fontUsageCount.clear();
  }
}
```

## Memory Monitoring

### Basic Memory Monitoring

```typescript
function logMemoryMetrics(parser: HtmlLayoutParser): void {
  const metrics = parser.getMemoryMetrics();
  
  if (metrics) {
    const totalMB = (metrics.totalMemoryUsage / 1024 / 1024).toFixed(2);
    console.log(`Total memory: ${totalMB} MB`);
    console.log(`Font count: ${metrics.fontCount}`);
    
    for (const font of metrics.fonts) {
      const fontMB = (font.memoryUsage / 1024 / 1024).toFixed(2);
      console.log(`  - ${font.name} (ID: ${font.id}): ${fontMB} MB`);
    }
  }
}

// Usage example
const parser = new HtmlLayoutParser();
await parser.init();

// Check memory after loading font
const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
parser.loadFont(new Uint8Array(fontData), 'Arial');

console.log('=== After Font Load ===');
logMemoryMetrics(parser);

// Check memory after parsing documents
for (let i = 0; i < 100; i++) {
  parser.parse(`<div>Document ${i}</div>`, { viewportWidth: 800 });
}

console.log('=== After Parsing 100 Documents ===');
logMemoryMetrics(parser);

// Check if threshold exceeded
if (parser.checkMemoryThreshold()) {
  console.warn('⚠️ Memory usage exceeds 50MB threshold!');
}

parser.destroy();
```

### Continuous Memory Monitoring

```typescript
class MemoryMonitor {
  private parser: HtmlLayoutParser;
  private intervalId: NodeJS.Timeout | null = null;
  private warningThresholdMB: number;
  private criticalThresholdMB: number;

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
  }

  start(intervalMs: number = 5000): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.check();
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private check(): void {
    const metrics = this.parser.getMemoryMetrics();
    if (!metrics) return;

    const usageMB = metrics.totalMemoryUsage / 1024 / 1024;

    if (usageMB >= this.criticalThresholdMB) {
      console.error(`🔴 Critical: Memory usage ${usageMB.toFixed(2)} MB exceeds ${this.criticalThresholdMB} MB`);
      // Can perform cleanup here
      this.parser.clearAllFonts();
    } else if (usageMB >= this.warningThresholdMB) {
      console.warn(`🟡 Warning: Memory usage ${usageMB.toFixed(2)} MB exceeds ${this.warningThresholdMB} MB`);
    }
  }
}

// Usage example
const parser = new HtmlLayoutParser();
await parser.init();

const monitor = new MemoryMonitor(parser, {
  warningThresholdMB: 30,
  criticalThresholdMB: 45
});

monitor.start(2000); // Check every 2 seconds

// Simulate workload
// ...

monitor.stop();
parser.destroy();
```

## Long-Running Applications

### Singleton Pattern

```typescript
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

  parse(html: string, options: { viewportWidth: number; css?: string }): CharLayout[] {
    if (!this.initialized) {
      throw new Error('Parser not initialized');
    }
    return this.parser.parse(html, options);
  }

  // Periodic maintenance - Call in long-running applications
  performMaintenance(): void {
    if (this.parser.checkMemoryThreshold()) {
      console.warn('Memory threshold exceeded, consider cleaning unused fonts');
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

// Use in long-running application
const parser = ParserSingleton.getInstance();

// Set up periodic maintenance
setInterval(() => {
  parser.performMaintenance();
}, 60000); // Every minute

// Cleanup on application shutdown
process.on('SIGTERM', () => {
  ParserSingleton.destroy();
  process.exit(0);
});
```

## Common Mistakes

### 1. Forgetting to Destroy Parser
```typescript
// ❌ Wrong
async function memoryLeak() {
  const parser = new HtmlLayoutParser();
  await parser.init();
  const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });
  return layouts;
  // Parser never destroyed - Memory leak!
}

// ✅ Correct
async function noMemoryLeak() {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();
    const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });
    return layouts;
  } finally {
    parser.destroy();
  }
}
```

### 2. Loading Same Font Multiple Times
```typescript
// ❌ Wrong
const parser = new HtmlLayoutParser();
await parser.init();

const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());

// Loading same font multiple times - Wastes memory
parser.loadFont(new Uint8Array(fontData), 'Arial');
parser.loadFont(new Uint8Array(fontData), 'Arial');
parser.loadFont(new Uint8Array(fontData), 'Arial');

// ✅ Correct
const loadedFonts = new Map<string, number>();

if (!loadedFonts.has('Arial')) {
  const fontId = parser.loadFont(new Uint8Array(fontData), 'Arial');
  if (fontId > 0) {
    loadedFonts.set('Arial', fontId);
  }
}
```

### 3. Using After Destroy
```typescript
// ❌ Wrong
const parser = new HtmlLayoutParser();
await parser.init();

parser.destroy();

// Using after destroy - Will cause error
const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });
```

## Memory Optimization Tips

### 1. Batch Processing
```typescript
// ✅ Efficient: Load font once, process multiple documents
async function batchProcessing(documents: string[]) {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();
    
    // Load font once
    const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
    parser.loadFont(new Uint8Array(fontData), 'Arial');
    parser.setDefaultFont(1);

    // Process all documents
    const results = [];
    for (const html of documents) {
      results.push(parser.parse(html, { viewportWidth: 800 }));
    }
    
    return results;
  } finally {
    parser.destroy();
  }
}
```

### 2. Memory Threshold Checks
```typescript
function processWithMemoryCheck(parser: HtmlLayoutParser, html: string) {
  // Check memory before processing
  if (parser.checkMemoryThreshold()) {
    console.warn('Memory usage too high, clearing fonts');
    parser.clearAllFonts();
    // Reload necessary fonts
  }

  return parser.parse(html, { viewportWidth: 800 });
}
```

### 3. Timely Cleanup
```typescript
class DocumentProcessor {
  private parser: HtmlLayoutParser;
  private tempFonts: Set<number> = new Set();

  constructor() {
    this.parser = new HtmlLayoutParser();
  }

  async init(): Promise<void> {
    await this.parser.init();
  }

  async processDocument(html: string, fontData?: Uint8Array): Promise<CharLayout[]> {
    let tempFontId: number | null = null;

    try {
      // If temporary font needed
      if (fontData) {
        tempFontId = this.parser.loadFont(fontData, 'TempFont');
        this.tempFonts.add(tempFontId);
        this.parser.setDefaultFont(tempFontId);
      }

      return this.parser.parse(html, { viewportWidth: 800 });

    } finally {
      // Cleanup temporary font
      if (tempFontId && this.tempFonts.has(tempFontId)) {
        this.parser.unloadFont(tempFontId);
        this.tempFonts.delete(tempFontId);
      }
    }
  }

  destroy(): void {
    // Cleanup all temporary fonts
    for (const fontId of this.tempFonts) {
      this.parser.unloadFont(fontId);
    }
    this.tempFonts.clear();
    
    this.parser.destroy();
  }
}
```
