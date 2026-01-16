# 调试模式

HTML Layout Parser 提供了强大的调试功能，帮助您诊断解析问题和优化性能。

## 启用调试模式

### 基本调试

```typescript
// 通过解析选项启用调试
const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: true
});

// 调试输出示例:
// [HtmlLayoutParser] HTML parsing started (length=1234)
// [HtmlLayoutParser] HTML parsing completed (time=5.2ms)
// [HtmlLayoutParser] Layout calculation started (viewport=800x600)
// [HtmlLayoutParser] Layout calculation completed (time=12.3ms, chars=456)
// [HtmlLayoutParser] Memory usage: 15.2MB (fonts=12MB, buffers=3.2MB)
```

### 详细诊断

```typescript
// 使用 parseWithDiagnostics 获取详细信息
const result = parser.parseWithDiagnostics(html, {
  viewportWidth: 800,
  isDebug: true,
  enableMetrics: true
});

if (result.success) {
  console.log('解析成功');
  console.log('布局数据:', result.data);
  
  if (result.metrics) {
    console.log('性能指标:', result.metrics);
  }
  
  if (result.warnings?.length) {
    console.log('警告:', result.warnings);
  }
} else {
  console.error('解析失败');
  console.error('错误:', result.errors);
}
```

## 调试输出类型

### 1. 字体相关日志

```typescript
const parser = new HtmlLayoutParser();
await parser.init();

// 字体加载调试
const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
const fontId = parser.loadFont(new Uint8Array(fontData), 'Arial');

// 输出:
// [HtmlLayoutParser] Font loading started (name=Arial, size=245760 bytes)
// [HtmlLayoutParser] Font loaded successfully (id=1, name=Arial)
// [HtmlLayoutParser] Memory usage after font load: 8.2MB

// 字体卸载调试
parser.unloadFont(fontId);

// 输出:
// [HtmlLayoutParser] Font unloading (id=1, name=Arial)
// [HtmlLayoutParser] Font unloaded successfully
// [HtmlLayoutParser] Memory usage after font unload: 0.5MB
```

### 2. 解析阶段日志

```typescript
const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: true
});

// 输出示例:
// [HtmlLayoutParser] === Parse Started ===
// [HtmlLayoutParser] Input HTML length: 1,234 characters
// [HtmlLayoutParser] Viewport: 800x600
// [HtmlLayoutParser] Default font: Arial (ID: 1)
// 
// [HtmlLayoutParser] HTML parsing started
// [HtmlLayoutParser] HTML parsing completed (time=5.2ms, nodes=45)
// 
// [HtmlLayoutParser] CSS processing started
// [HtmlLayoutParser] CSS processing completed (time=2.1ms, rules=12)
// 
// [HtmlLayoutParser] Layout calculation started
// [HtmlLayoutParser] Layout calculation completed (time=12.3ms, chars=456)
// 
// [HtmlLayoutParser] Serialization started (mode=flat)
// [HtmlLayoutParser] Serialization completed (time=3.4ms, size=89KB)
// 
// [HtmlLayoutParser] === Parse Completed ===
// [HtmlLayoutParser] Total time: 23.0ms
// [HtmlLayoutParser] Parse speed: 53,652 chars/sec
```

### 3. 内存使用日志

```typescript
// 内存监控调试
const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: true
});

// 输出:
// [HtmlLayoutParser] Memory before parse: 8.2MB
// [HtmlLayoutParser] Memory during parse: 12.5MB
// [HtmlLayoutParser] Memory after parse: 8.4MB
// [HtmlLayoutParser] Memory delta: +0.2MB
// [HtmlLayoutParser] Font memory: 8.0MB (1 fonts)
// [HtmlLayoutParser] Buffer memory: 0.4MB
```

## 自定义调试器

### 调试日志收集器

```typescript
class DebugLogger {
  private logs: Array<{
    timestamp: number;
    level: 'info' | 'warn' | 'error';
    category: string;
    message: string;
    data?: any;
  }> = [];

  private originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error
  };

  startCapture(): void {
    console.log = (...args) => {
      this.capture('info', 'console', args.join(' '));
      this.originalConsole.log(...args);
    };

    console.warn = (...args) => {
      this.capture('warn', 'console', args.join(' '));
      this.originalConsole.warn(...args);
    };

    console.error = (...args) => {
      this.capture('error', 'console', args.join(' '));
      this.originalConsole.error(...args);
    };
  }

  stopCapture(): void {
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
  }

  private capture(level: 'info' | 'warn' | 'error', category: string, message: string, data?: any): void {
    this.logs.push({
      timestamp: Date.now(),
      level,
      category,
      message,
      data
    });
  }

  getLogs(): typeof this.logs {
    return [...this.logs];
  }

  getLogsByCategory(category: string): typeof this.logs {
    return this.logs.filter(log => log.category === category);
  }

  getLogsByLevel(level: 'info' | 'warn' | 'error'): typeof this.logs {
    return this.logs.filter(log => log.level === level);
  }

  clear(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  printSummary(): void {
    const summary = {
      total: this.logs.length,
      info: this.logs.filter(l => l.level === 'info').length,
      warn: this.logs.filter(l => l.level === 'warn').length,
      error: this.logs.filter(l => l.level === 'error').length
    };

    console.log('调试日志摘要:', summary);
  }
}

// 使用示例
const debugLogger = new DebugLogger();
debugLogger.startCapture();

// 执行解析
const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: true
});

debugLogger.stopCapture();
debugLogger.printSummary();

// 导出日志用于分析
const logs = debugLogger.exportLogs();
console.log('详细日志:', logs);
```

### 性能分析器

```typescript
class PerformanceProfiler {
  private profiles: Map<string, {
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: any;
  }> = new Map();

  start(profileName: string, metadata?: any): void {
    this.profiles.set(profileName, {
      startTime: performance.now(),
      metadata
    });
  }

  end(profileName: string): number | null {
    const profile = this.profiles.get(profileName);
    if (!profile) {
      console.warn(`性能分析器: 未找到配置文件 "${profileName}"`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - profile.startTime;

    profile.endTime = endTime;
    profile.duration = duration;

    console.log(`[性能] ${profileName}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  getProfile(profileName: string) {
    return this.profiles.get(profileName);
  }

  getAllProfiles() {
    return Array.from(this.profiles.entries()).map(([name, profile]) => ({
      name,
      ...profile
    }));
  }

  clear(): void {
    this.profiles.clear();
  }

  generateReport(): string {
    const profiles = this.getAllProfiles()
      .filter(p => p.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));

    let report = '性能分析报告\n';
    report += '================\n\n';

    for (const profile of profiles) {
      report += `${profile.name}: ${profile.duration!.toFixed(2)}ms\n`;
      if (profile.metadata) {
        report += `  元数据: ${JSON.stringify(profile.metadata)}\n`;
      }
    }

    const totalTime = profiles.reduce((sum, p) => sum + (p.duration || 0), 0);
    report += `\n总时间: ${totalTime.toFixed(2)}ms\n`;

    return report;
  }
}

// 使用示例
const profiler = new PerformanceProfiler();

// 分析解析性能
profiler.start('total_parse', { htmlLength: html.length });
profiler.start('font_load');

const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
const fontId = parser.loadFont(new Uint8Array(fontData), 'Arial');

profiler.end('font_load');
profiler.start('html_parse');

const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: true
});

profiler.end('html_parse');
profiler.end('total_parse');

// 生成报告
console.log(profiler.generateReport());
```

## 错误诊断

### 常见问题诊断

```typescript
class DiagnosticHelper {
  static diagnoseParseFailure(
    parser: HtmlLayoutParser,
    html: string,
    options: { viewportWidth: number }
  ): void {
    console.log('=== 解析失败诊断 ===');

    // 1. 检查解析器状态
    if (!parser.isInitialized()) {
      console.error('❌ 解析器未初始化');
      return;
    }
    console.log('✅ 解析器已初始化');

    // 2. 检查字体
    const fonts = parser.getLoadedFonts();
    if (fonts.length === 0) {
      console.warn('⚠️ 未加载任何字体');
    } else {
      console.log(`✅ 已加载 ${fonts.length} 个字体:`, fonts.map(f => f.name));
    }

    // 3. 检查 HTML 大小
    if (html.length === 0) {
      console.error('❌ HTML 内容为空');
      return;
    }
    console.log(`✅ HTML 长度: ${html.length} 字符`);

    // 4. 检查视口大小
    if (options.viewportWidth <= 0) {
      console.error('❌ 视口宽度无效:', options.viewportWidth);
      return;
    }
    console.log(`✅ 视口宽度: ${options.viewportWidth}px`);

    // 5. 检查内存使用
    const memoryMetrics = parser.getMemoryMetrics();
    if (memoryMetrics) {
      const memoryMB = memoryMetrics.totalMemoryUsage / 1024 / 1024;
      if (memoryMB > 100) {
        console.warn(`⚠️ 内存使用过高: ${memoryMB.toFixed(2)}MB`);
      } else {
        console.log(`✅ 内存使用正常: ${memoryMB.toFixed(2)}MB`);
      }
    }

    // 6. 尝试简化的解析
    try {
      console.log('尝试解析简化的 HTML...');
      const simpleResult = parser.parse('<div>测试</div>', options);
      console.log('✅ 简化解析成功，问题可能在 HTML 内容');
    } catch (error) {
      console.error('❌ 简化解析也失败，问题在解析器配置:', error);
    }
  }

  static validateHtml(html: string): Array<{ type: 'error' | 'warning'; message: string }> {
    const issues: Array<{ type: 'error' | 'warning'; message: string }> = [];

    // 检查基本结构
    if (!html.trim()) {
      issues.push({ type: 'error', message: 'HTML 内容为空' });
      return issues;
    }

    // 检查标签平衡
    const openTags = html.match(/<[^/][^>]*>/g) || [];
    const closeTags = html.match(/<\/[^>]*>/g) || [];
    
    if (openTags.length !== closeTags.length) {
      issues.push({ type: 'warning', message: '标签可能不平衡' });
    }

    // 检查大小
    if (html.length > 100000) {
      issues.push({ type: 'warning', message: `HTML 过大 (${html.length} 字符)，可能影响性能` });
    }

    // 检查复杂的 CSS
    const styleMatches = html.match(/style\s*=\s*"[^"]*"/g) || [];
    if (styleMatches.length > 100) {
      issues.push({ type: 'warning', message: '内联样式过多，考虑使用外部 CSS' });
    }

    return issues;
  }
}

// 使用示例
try {
  const layouts = parser.parse(html, { viewportWidth: 800 });
} catch (error) {
  console.error('解析失败:', error);
  
  // 运行诊断
  DiagnosticHelper.diagnoseParseFailure(parser, html, { viewportWidth: 800 });
  
  // 验证 HTML
  const issues = DiagnosticHelper.validateHtml(html);
  if (issues.length > 0) {
    console.log('HTML 验证问题:');
    issues.forEach(issue => {
      console.log(`  ${issue.type === 'error' ? '❌' : '⚠️'} ${issue.message}`);
    });
  }
}
```

### 内存泄漏检测

```typescript
class MemoryLeakDetector {
  private parser: HtmlLayoutParser;
  private baselineMemory: number = 0;
  private samples: number[] = [];
  private sampleInterval: NodeJS.Timeout | null = null;

  constructor(parser: HtmlLayoutParser) {
    this.parser = parser;
  }

  startMonitoring(intervalMs: number = 1000): void {
    // 记录基线内存
    this.baselineMemory = this.getCurrentMemory();
    console.log(`内存泄漏检测开始，基线内存: ${this.baselineMemory.toFixed(2)}MB`);

    this.sampleInterval = setInterval(() => {
      const currentMemory = this.getCurrentMemory();
      this.samples.push(currentMemory);
      
      // 保持最近 100 个样本
      if (this.samples.length > 100) {
        this.samples.shift();
      }
      
      this.checkForLeak();
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.sampleInterval) {
      clearInterval(this.sampleInterval);
      this.sampleInterval = null;
    }
  }

  private getCurrentMemory(): number {
    const metrics = this.parser.getMemoryMetrics();
    return metrics ? metrics.totalMemoryUsage / 1024 / 1024 : 0;
  }

  private checkForLeak(): void {
    if (this.samples.length < 10) return;

    const recent = this.samples.slice(-10);
    const average = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const growth = average - this.baselineMemory;

    if (growth > 10) { // 增长超过 10MB
      console.warn(`⚠️ 可能的内存泄漏检测到: +${growth.toFixed(2)}MB`);
      this.generateLeakReport();
    }
  }

  private generateLeakReport(): void {
    const currentMemory = this.getCurrentMemory();
    const growth = currentMemory - this.baselineMemory;
    
    console.log('=== 内存泄漏报告 ===');
    console.log(`基线内存: ${this.baselineMemory.toFixed(2)}MB`);
    console.log(`当前内存: ${currentMemory.toFixed(2)}MB`);
    console.log(`内存增长: +${growth.toFixed(2)}MB`);
    
    const metrics = this.parser.getMemoryMetrics();
    if (metrics) {
      console.log(`字体数量: ${metrics.fontCount}`);
      console.log('字体详情:');
      metrics.fonts.forEach(font => {
        console.log(`  - ${font.name}: ${(font.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      });
    }
    
    // 建议
    console.log('建议:');
    if (metrics && metrics.fontCount > 5) {
      console.log('  - 考虑卸载未使用的字体');
    }
    console.log('  - 检查是否正确调用了 destroy()');
    console.log('  - 检查是否有循环引用');
  }

  getMemoryTrend(): 'stable' | 'growing' | 'shrinking' {
    if (this.samples.length < 5) return 'stable';

    const recent = this.samples.slice(-5);
    const older = this.samples.slice(-10, -5);
    
    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    
    if (diff > 1) return 'growing';
    if (diff < -1) return 'shrinking';
    return 'stable';
  }
}

// 使用示例
const leakDetector = new MemoryLeakDetector(parser);
leakDetector.startMonitoring(2000); // 每 2 秒检查一次

// 模拟工作负载
for (let i = 0; i < 1000; i++) {
  const layouts = parser.parse(`<div>文档 ${i}</div>`, { viewportWidth: 800 });
  
  // 每 100 次检查内存趋势
  if (i % 100 === 0) {
    const trend = leakDetector.getMemoryTrend();
    console.log(`第 ${i} 次解析，内存趋势: ${trend}`);
  }
}

leakDetector.stopMonitoring();
```

## 调试工具集成

### VS Code 调试配置

创建 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "调试 HTML Layout Parser",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/debug-script.js",
      "env": {
        "DEBUG": "html-layout-parser:*",
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### 调试脚本示例

创建 `debug-script.js`:

```javascript
const { HtmlLayoutParser } = require('html-layout-parser/node');
const fs = require('fs');

async function debugParse() {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();
    
    // 加载测试字体
    const fontData = fs.readFileSync('./fonts/arial.ttf');
    const fontId = parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(fontId);
    
    // 测试 HTML
    const html = `
      <div style="color: red; font-size: 16px;">
        <h1>标题</h1>
        <p>这是一个测试段落。</p>
      </div>
    `;
    
    console.log('开始调试解析...');
    
    const result = parser.parseWithDiagnostics(html, {
      viewportWidth: 800,
      isDebug: true,
      enableMetrics: true
    });
    
    if (result.success) {
      console.log('解析成功!');
      console.log('字符数:', result.data.length);
      
      if (result.metrics) {
        console.log('性能指标:', result.metrics);
      }
    } else {
      console.error('解析失败:', result.errors);
    }
    
  } catch (error) {
    console.error('调试过程中出错:', error);
  } finally {
    parser.destroy();
  }
}

debugParse();
```

## 生产环境调试

### 条件调试

```typescript
class ConditionalDebugger {
  private enabled: boolean;
  private logLevel: 'info' | 'warn' | 'error';

  constructor(enabled: boolean = false, logLevel: 'info' | 'warn' | 'error' = 'info') {
    this.enabled = enabled;
    this.logLevel = logLevel;
  }

  log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.enabled) return;
    
    const levels = { info: 0, warn: 1, error: 2 };
    if (levels[level] < levels[this.logLevel]) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, data || '');
        break;
      case 'error':
        console.error(`${prefix} ${message}`, data || '');
        break;
    }
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setLogLevel(level: 'info' | 'warn' | 'error'): void {
    this.logLevel = level;
  }
}

// 使用示例
const debugger = new ConditionalDebugger(
  process.env.NODE_ENV === 'development',
  'warn'
);

// 在解析过程中使用
debugger.info('开始解析 HTML', { length: html.length });

try {
  const layouts = parser.parse(html, {
    viewportWidth: 800,
    isDebug: debugger.enabled
  });
  
  debugger.info('解析完成', { charCount: layouts.length });
} catch (error) {
  debugger.error('解析失败', error);
}
```

### 远程调试

```typescript
class RemoteDebugger {
  private endpoint: string;
  private sessionId: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async sendDebugData(data: {
    type: 'parse' | 'error' | 'performance';
    timestamp: number;
    payload: any;
  }): Promise<void> {
    try {
      await fetch(`${this.endpoint}/debug`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          ...data
        })
      });
    } catch (error) {
      console.warn('发送调试数据失败:', error);
    }
  }

  async logParseEvent(html: string, options: any, result: any, duration: number): Promise<void> {
    await this.sendDebugData({
      type: 'parse',
      timestamp: Date.now(),
      payload: {
        htmlLength: html.length,
        options,
        resultLength: result.length,
        duration,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js'
      }
    });
  }

  async logError(error: Error, context: any): Promise<void> {
    await this.sendDebugData({
      type: 'error',
      timestamp: Date.now(),
      payload: {
        message: error.message,
        stack: error.stack,
        context
      }
    });
  }

  async logPerformance(metrics: any): Promise<void> {
    await this.sendDebugData({
      type: 'performance',
      timestamp: Date.now(),
      payload: metrics
    });
  }
}

// 使用示例（仅在开发环境）
const remoteDebugger = process.env.NODE_ENV === 'development' 
  ? new RemoteDebugger('https://debug-api.example.com')
  : null;

// 在解析时记录
const start = performance.now();
try {
  const layouts = parser.parse(html, { viewportWidth: 800 });
  const duration = performance.now() - start;
  
  if (remoteDebugger) {
    await remoteDebugger.logParseEvent(html, { viewportWidth: 800 }, layouts, duration);
  }
} catch (error) {
  if (remoteDebugger) {
    await remoteDebugger.logError(error, { html: html.substring(0, 100) });
  }
  throw error;
}
```