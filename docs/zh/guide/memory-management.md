# 内存管理

HTML Layout Parser 使用 WebAssembly，需要正确的内存管理以避免内存泄漏。

## 基本原则

### 1. 始终销毁解析器
```typescript
// ✅ 正确做法
async function correctUsage() {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();
    // 使用解析器...
  } finally {
    parser.destroy(); // 必须调用
  }
}

// ❌ 错误做法 - 内存泄漏
async function incorrectUsage() {
  const parser = new HtmlLayoutParser();
  await parser.init();
  // 使用解析器...
  // 忘记调用 destroy() - 内存泄漏！
}
```

### 2. 使用 try/finally 确保清理
```typescript
async function guaranteedCleanup() {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();
    
    // 即使这里抛出异常...
    const layouts = parser.parse(html, { viewportWidth: 800 });
    
  } finally {
    // 这里总是会执行
    parser.destroy();
  }
}
```

## 字体内存管理

### 字体加载模式

```typescript
// ✅ 正确：加载一次，多次使用
async function efficientFontUsage() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // 加载字体一次
    const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
    const fontId = parser.loadFont(new Uint8Array(fontData), 'Arial');
    parser.setDefaultFont(fontId);

    // 解析多个文档
    const documents = ['<div>Doc 1</div>', '<div>Doc 2</div>', '<div>Doc 3</div>'];
    
    for (const html of documents) {
      const layouts = parser.parse(html, { viewportWidth: 800 });
      // 处理结果...
    }

  } finally {
    parser.destroy();
  }
}

// ❌ 错误：每次都重新加载字体
async function inefficientFontUsage() {
  const documents = ['<div>Doc 1</div>', '<div>Doc 2</div>'];

  for (const html of documents) {
    const parser = new HtmlLayoutParser();
    await parser.init();

    // 每次都重新加载字体 - 浪费内存和时间
    const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
    parser.loadFont(new Uint8Array(fontData), 'Arial');
    parser.setDefaultFont(1);

    const layouts = parser.parse(html, { viewportWidth: 800 });
    parser.destroy();
  }
}
```

### 字体生命周期管理

```typescript
class FontManager {
  private parser: HtmlLayoutParser;
  private loadedFonts: Map<string, number> = new Map();
  private fontUsageCount: Map<string, number> = new Map();

  constructor(parser: HtmlLayoutParser) {
    this.parser = parser;
  }

  async loadFont(fontData: Uint8Array, fontName: string): Promise<number> {
    // 检查是否已加载
    if (this.loadedFonts.has(fontName)) {
      const fontId = this.loadedFonts.get(fontName)!;
      // 增加使用计数
      this.fontUsageCount.set(fontName, (this.fontUsageCount.get(fontName) || 0) + 1);
      return fontId;
    }

    // 加载新字体
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
      // 减少使用计数
      this.fontUsageCount.set(fontName, count - 1);
      return;
    }

    // 使用计数为 0，实际卸载字体
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

## 内存监控

### 基本内存监控

```typescript
function logMemoryMetrics(parser: HtmlLayoutParser): void {
  const metrics = parser.getMemoryMetrics();
  
  if (metrics) {
    const totalMB = (metrics.totalMemoryUsage / 1024 / 1024).toFixed(2);
    console.log(`总内存: ${totalMB} MB`);
    console.log(`字体数量: ${metrics.fontCount}`);
    
    for (const font of metrics.fonts) {
      const fontMB = (font.memoryUsage / 1024 / 1024).toFixed(2);
      console.log(`  - ${font.name} (ID: ${font.id}): ${fontMB} MB`);
    }
  }
}

// 使用示例
const parser = new HtmlLayoutParser();
await parser.init();

// 加载字体后检查内存
const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
parser.loadFont(new Uint8Array(fontData), 'Arial');

console.log('=== 字体加载后 ===');
logMemoryMetrics(parser);

// 解析文档后检查内存
for (let i = 0; i < 100; i++) {
  parser.parse(`<div>文档 ${i}</div>`, { viewportWidth: 800 });
}

console.log('=== 解析 100 个文档后 ===');
logMemoryMetrics(parser);

// 检查是否超过阈值
if (parser.checkMemoryThreshold()) {
  console.warn('⚠️ 内存使用超过 50MB 阈值！');
}

parser.destroy();
```

### 连续内存监控

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
      console.error(`🔴 严重: 内存使用 ${usageMB.toFixed(2)} MB 超过 ${this.criticalThresholdMB} MB`);
      // 可以在这里执行清理操作
      this.parser.clearAllFonts();
    } else if (usageMB >= this.warningThresholdMB) {
      console.warn(`🟡 警告: 内存使用 ${usageMB.toFixed(2)} MB 超过 ${this.warningThresholdMB} MB`);
    }
  }
}

// 使用示例
const parser = new HtmlLayoutParser();
await parser.init();

const monitor = new MemoryMonitor(parser, {
  warningThresholdMB: 30,
  criticalThresholdMB: 45
});

monitor.start(2000); // 每 2 秒检查一次

// 模拟工作负载
// ...

monitor.stop();
parser.destroy();
```

## 长期运行应用

### 单例模式

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
      throw new Error('解析器未初始化');
    }
    return this.parser.parse(html, options);
  }

  // 定期维护 - 在长期运行的应用中调用
  performMaintenance(): void {
    if (this.parser.checkMemoryThreshold()) {
      console.warn('内存阈值超标，考虑清理未使用的字体');
    }

    const metrics = this.parser.getMemoryMetrics();
    if (metrics) {
      console.log(`维护: ${metrics.fontCount} 个字体, ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
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

// 在长期运行的应用中使用
const parser = ParserSingleton.getInstance();

// 设置定期维护
setInterval(() => {
  parser.performMaintenance();
}, 60000); // 每分钟

// 应用关闭时清理
process.on('SIGTERM', () => {
  ParserSingleton.destroy();
  process.exit(0);
});
```

## 常见错误

### 1. 忘记销毁解析器
```typescript
// ❌ 错误
async function memoryLeak() {
  const parser = new HtmlLayoutParser();
  await parser.init();
  const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });
  return layouts;
  // 解析器从未销毁 - 内存泄漏！
}

// ✅ 正确
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

### 2. 重复加载相同字体
```typescript
// ❌ 错误
const parser = new HtmlLayoutParser();
await parser.init();

const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());

// 重复加载相同字体 - 浪费内存
parser.loadFont(new Uint8Array(fontData), 'Arial');
parser.loadFont(new Uint8Array(fontData), 'Arial');
parser.loadFont(new Uint8Array(fontData), 'Arial');

// ✅ 正确
const loadedFonts = new Map<string, number>();

if (!loadedFonts.has('Arial')) {
  const fontId = parser.loadFont(new Uint8Array(fontData), 'Arial');
  if (fontId > 0) {
    loadedFonts.set('Arial', fontId);
  }
}
```

### 3. 销毁后继续使用
```typescript
// ❌ 错误
const parser = new HtmlLayoutParser();
await parser.init();

parser.destroy();

// 销毁后继续使用 - 会导致错误
const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });
```

## 内存优化建议

### 1. 批量处理
```typescript
// ✅ 高效：一次加载字体，处理多个文档
async function batchProcessing(documents: string[]) {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();
    
    // 加载字体一次
    const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
    parser.loadFont(new Uint8Array(fontData), 'Arial');
    parser.setDefaultFont(1);

    // 处理所有文档
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

### 2. 内存阈值检查
```typescript
function processWithMemoryCheck(parser: HtmlLayoutParser, html: string) {
  // 处理前检查内存
  if (parser.checkMemoryThreshold()) {
    console.warn('内存使用过高，清理字体');
    parser.clearAllFonts();
    // 重新加载必要的字体
  }

  return parser.parse(html, { viewportWidth: 800 });
}
```

### 3. 及时清理
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
      // 如果需要临时字体
      if (fontData) {
        tempFontId = this.parser.loadFont(fontData, 'TempFont');
        this.tempFonts.add(tempFontId);
        this.parser.setDefaultFont(tempFontId);
      }

      return this.parser.parse(html, { viewportWidth: 800 });

    } finally {
      // 清理临时字体
      if (tempFontId && this.tempFonts.has(tempFontId)) {
        this.parser.unloadFont(tempFontId);
        this.tempFonts.delete(tempFontId);
      }
    }
  }

  destroy(): void {
    // 清理所有临时字体
    for (const fontId of this.tempFonts) {
      this.parser.unloadFont(fontId);
    }
    this.tempFonts.clear();
    
    this.parser.destroy();
  }
}
```