# 内存管理示例

演示正确的内存管理模式。

## 正确的加载/卸载模式

### 基本模式：加载一次，多次使用

```typescript
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser';

// ✅ 正确：加载一次字体，用于多次解析
async function correctPattern() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // 只加载一次字体
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    const fontId = parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(fontId);

    // 用于多次解析
    const documents = ['<div>文档 1</div>', '<div>文档 2</div>', '<div>文档 3</div>'];

    for (const html of documents) {
      const layouts = parser.parse(html, { viewportWidth: 800 });
      console.log(`解析了 ${layouts.length} 个字符`);
    }

  } finally {
    parser.destroy();
  }
}

// ❌ 错误：为每次解析加载/卸载字体
async function incorrectPattern() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    const documents = ['<div>文档 1</div>', '<div>文档 2</div>'];

    for (const html of documents) {
      // ❌ 错误：为每个文档加载字体
      const fontResponse = await fetch('/fonts/arial.ttf');
      const fontData = new Uint8Array(await fontResponse.arrayBuffer());
      const fontId = parser.loadFont(fontData, 'Arial');
      parser.setDefaultFont(fontId);

      const layouts = parser.parse(html, { viewportWidth: 800 });

      // ❌ 错误：立即卸载
      parser.unloadFont(fontId);
    }
  } finally {
    parser.destroy();
  }
}
```

## 内存监控

### 基础内存监控

```typescript
import { HtmlLayoutParser, MemoryMetrics } from 'html-layout-parser';

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

async function memoryMonitoringExample() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    console.log('=== 加载字体后 ===');
    logMemoryMetrics(parser);

    for (let i = 0; i < 100; i++) {
      parser.parse(`<div>文档 ${i}</div>`, { viewportWidth: 800 });
    }

    console.log('\n=== 解析 100 个文档后 ===');
    logMemoryMetrics(parser);

    if (parser.checkMemoryThreshold()) {
      console.warn('⚠️ 内存使用超过 50MB 阈值！');
    }

  } finally {
    parser.destroy();
  }
}
```

### 持续内存监控

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
      console.error(`🔴 严重: ${usageMB.toFixed(2)} MB`);
      this.onCritical?.(metrics);
    } else if (usageMB >= this.warningThresholdMB) {
      console.warn(`🟡 警告: ${usageMB.toFixed(2)} MB`);
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

## 资源清理

### 使用 try/finally 保证清理

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

// ✅ 正确：始终使用 try/finally 进行清理
async function guaranteedCleanup() {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();

    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    const layouts = parser.parse('<div>你好</div>', { viewportWidth: 800 });
    return layouts;

  } finally {
    // 这总是会运行，即使发生错误
    parser.destroy();
  }
}

// 包装函数确保清理
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

// 使用示例
async function cleanupWrapperExample() {
  const result = await withParser(async (parser) => {
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    return parser.parse('<div>你好</div>', { viewportWidth: 800 });
  });

  console.log(`解析了 ${result.length} 个字符`);
}
```

### 基于类的应用中的清理

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

    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    this.parser.loadFont(fontData, 'Arial');
    this.parser.setDefaultFont(1);

    this.initialized = true;
  }

  render(html: string, css?: string): CharLayout[] {
    if (!this.parser || this.destroyed) {
      throw new Error('渲染器未初始化或已销毁');
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

// 使用示例
async function classCleanupExample() {
  const renderer = new DocumentRenderer();

  try {
    await renderer.init();
    const layouts = renderer.render('<div>你好</div>');
    console.log(`渲染了 ${layouts.length} 个字符`);
  } finally {
    renderer.destroy();
  }
}
```

## 长期运行的应用

### 单例模式

```typescript
import { HtmlLayoutParser, CharLayout, MemoryMetrics } from 'html-layout-parser';

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
    if (!this.initialized) throw new Error('解析器未初始化');
    return this.parser.parse(html, options);
  }

  performMaintenance(): void {
    if (this.parser.checkMemoryThreshold()) {
      console.warn('内存阈值已超过');
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
```

## 常见错误避免

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

// ❌ 错误 1：忘记销毁
async function mistake1() {
  const parser = new HtmlLayoutParser();
  await parser.init();
  const layouts = parser.parse('<div>你好</div>', { viewportWidth: 800 });
  return layouts;
  // 解析器从未销毁 - 内存泄漏！
}

// ❌ 错误 2：多次加载相同字体
async function mistake2() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  const fontData = new Uint8Array(await (await fetch('/fonts/arial.ttf')).arrayBuffer());
  
  // 加载相同字体 3 次 - 浪费内存！
  parser.loadFont(fontData, 'Arial');
  parser.loadFont(fontData, 'Arial');
  parser.loadFont(fontData, 'Arial');

  parser.destroy();
}

// ❌ 错误 3：不处理错误
async function mistake3() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  // 如果 fetch 失败，解析器永远不会被销毁
  const fontData = new Uint8Array(await (await fetch('/fonts/arial.ttf')).arrayBuffer());
  parser.loadFont(fontData, 'Arial');
  
  parser.destroy();
}

// ❌ 错误 4：销毁后使用解析器
async function mistake4() {
  const parser = new HtmlLayoutParser();
  await parser.init();
  
  parser.destroy();
  
  // 这会失败！
  const layouts = parser.parse('<div>你好</div>', { viewportWidth: 800 });
}

// ✅ 正确：所有错误已修复
async function correct() {
  const parser = new HtmlLayoutParser();
  const loadedFonts = new Map<string, number>();

  try {
    await parser.init();

    try {
      const fontData = new Uint8Array(await (await fetch('/fonts/arial.ttf')).arrayBuffer());
      
      // 检查是否已加载
      if (!loadedFonts.has('Arial')) {
        const fontId = parser.loadFont(fontData, 'Arial');
        if (fontId > 0) {
          loadedFonts.set('Arial', fontId);
          parser.setDefaultFont(fontId);
        }
      }
    } catch (error) {
      console.error('加载字体失败:', error);
    }

    const layouts = parser.parse('<div>你好</div>', { viewportWidth: 800 });
    return layouts;

  } finally {
    parser.destroy();
  }
}
```
