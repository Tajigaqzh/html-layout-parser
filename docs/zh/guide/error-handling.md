# 错误处理

HTML Layout Parser 提供了完善的错误处理机制，帮助您诊断和处理各种解析问题。

## 错误类型

### 错误代码分类

| 代码范围 | 类别 | 描述 |
|----------|------|------|
| 0 | 成功 | 操作成功完成 |
| 1xxx | 输入验证错误 | HTML、CSS 或参数验证失败 |
| 2xxx | 字体相关错误 | 字体加载、卸载或使用错误 |
| 3xxx | 解析错误 | HTML/CSS 解析过程中的错误 |
| 4xxx | 内存错误 | 内存分配或管理错误 |
| 5xxx | 内部错误 | 系统内部错误 |

### 常见错误代码

```typescript
// 输入验证错误 (1xxx)
const INPUT_ERRORS = {
  1001: 'HTML 内容为空',
  1002: '视口宽度无效',
  1003: 'CSS 语法错误',
  1004: '参数类型错误',
  1005: '文档大小超过限制'
};

// 字体错误 (2xxx)
const FONT_ERRORS = {
  2001: '字体数据无效',
  2002: '字体加载失败',
  2003: '字体 ID 不存在',
  2004: '字体格式不支持',
  2005: '默认字体未设置'
};

// 解析错误 (3xxx)
const PARSE_ERRORS = {
  3001: 'HTML 解析失败',
  3002: 'CSS 解析失败',
  3003: '布局计算失败',
  3004: '解析超时',
  3005: '不支持的 CSS 属性'
};

// 内存错误 (4xxx)
const MEMORY_ERRORS = {
  4001: '内存分配失败',
  4002: '内存使用超过限制',
  4003: '缓冲区溢出',
  4004: '内存泄漏检测到'
};

// 内部错误 (5xxx)
const INTERNAL_ERRORS = {
  5001: 'WASM 模块未初始化',
  5002: '内部状态错误',
  5003: '系统资源不足',
  5004: '未知内部错误'
};
```

## 基本错误处理

### 使用 try-catch

```typescript
async function basicErrorHandling() {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();
    
    const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
    const fontId = parser.loadFont(new Uint8Array(fontData), 'Arial');
    
    if (fontId <= 0) {
      throw new Error('字体加载失败');
    }
    
    parser.setDefaultFont(fontId);
    
    const layouts = parser.parse(html, { viewportWidth: 800 });
    return layouts;
    
  } catch (error) {
    console.error('解析过程中出错:', error);
    
    // 根据错误类型进行处理
    if (error.message.includes('字体')) {
      console.error('字体相关错误，请检查字体文件');
    } else if (error.message.includes('HTML')) {
      console.error('HTML 解析错误，请检查 HTML 格式');
    } else {
      console.error('未知错误:', error);
    }
    
    return null;
  } finally {
    parser.destroy();
  }
}
```

### 使用诊断模式

```typescript
function diagnosticErrorHandling(html: string) {
  const parser = new HtmlLayoutParser();
  
  try {
    // 使用诊断模式获取详细错误信息
    const result = parser.parseWithDiagnostics(html, {
      viewportWidth: 800,
      enableMetrics: true
    });
    
    if (result.success) {
      console.log('解析成功');
      
      // 检查警告
      if (result.warnings && result.warnings.length > 0) {
        console.warn('解析警告:');
        result.warnings.forEach(warning => {
          console.warn(`  - ${warning.message}`);
          if (warning.line) {
            console.warn(`    位置: 第 ${warning.line} 行, 第 ${warning.column} 列`);
          }
        });
      }
      
      return result.data;
    } else {
      console.error('解析失败');
      
      // 处理错误
      if (result.errors) {
        result.errors.forEach(error => {
          console.error(`错误 [${error.code}]: ${error.message}`);
          
          if (error.line && error.column) {
            console.error(`  位置: 第 ${error.line} 行, 第 ${error.column} 列`);
          }
          
          if (error.suggestion) {
            console.error(`  建议: ${error.suggestion}`);
          }
        });
      }
      
      return null;
    }
  } finally {
    parser.destroy();
  }
}
```

## 高级错误处理

### 错误分类处理器

```typescript
class ErrorHandler {
  private parser: HtmlLayoutParser;
  private retryCount: Map<string, number> = new Map();
  private maxRetries: number = 3;

  constructor(parser: HtmlLayoutParser, maxRetries: number = 3) {
    this.parser = parser;
    this.maxRetries = maxRetries;
  }

  async handleParseWithRetry(
    html: string, 
    options: { viewportWidth: number },
    retryKey?: string
  ): Promise<CharLayout[] | null> {
    const key = retryKey || this.generateRetryKey(html, options);
    const currentRetries = this.retryCount.get(key) || 0;

    try {
      const result = this.parser.parseWithDiagnostics(html, options);
      
      if (result.success) {
        // 成功时重置重试计数
        this.retryCount.delete(key);
        return result.data;
      } else {
        return this.handleParseErrors(result.errors || [], html, options, key);
      }
    } catch (error) {
      return this.handleException(error, html, options, key);
    }
  }

  private async handleParseErrors(
    errors: any[],
    html: string,
    options: { viewportWidth: number },
    retryKey: string
  ): Promise<CharLayout[] | null> {
    for (const error of errors) {
      const errorCode = error.code;
      
      switch (Math.floor(errorCode / 1000)) {
        case 1: // 输入验证错误
          return this.handleInputError(error, html, options);
          
        case 2: // 字体错误
          const fontFixed = await this.handleFontError(error);
          if (fontFixed) {
            return this.retryParse(html, options, retryKey);
          }
          break;
          
        case 3: // 解析错误
          const parseFixed = this.handleParseError(error, html);
          if (parseFixed) {
            return this.retryParse(parseFixed, options, retryKey);
          }
          break;
          
        case 4: // 内存错误
          const memoryFixed = await this.handleMemoryError(error);
          if (memoryFixed) {
            return this.retryParse(html, options, retryKey);
          }
          break;
          
        case 5: // 内部错误
          console.error('内部错误，无法自动修复:', error);
          break;
      }
    }
    
    return null;
  }

  private handleInputError(error: any, html: string, options: { viewportWidth: number }): CharLayout[] | null {
    switch (error.code) {
      case 1001: // HTML 内容为空
        console.warn('HTML 内容为空，返回空结果');
        return [];
        
      case 1002: // 视口宽度无效
        console.warn('视口宽度无效，使用默认值 800');
        return this.parser.parse(html, { ...options, viewportWidth: 800 });
        
      case 1005: // 文档大小超过限制
        console.warn('文档过大，尝试截断处理');
        const truncatedHtml = html.substring(0, 50000);
        return this.parser.parse(truncatedHtml, options);
        
      default:
        console.error('无法处理的输入错误:', error);
        return null;
    }
  }

  private async handleFontError(error: any): Promise<boolean> {
    switch (error.code) {
      case 2005: // 默认字体未设置
        console.warn('默认字体未设置，尝试加载系统字体');
        try {
          // 尝试加载一个基本字体
          const response = await fetch('/fonts/arial.ttf');
          if (response.ok) {
            const fontData = new Uint8Array(await response.arrayBuffer());
            const fontId = this.parser.loadFont(fontData, 'Arial');
            if (fontId > 0) {
              this.parser.setDefaultFont(fontId);
              return true;
            }
          }
        } catch (e) {
          console.error('加载默认字体失败:', e);
        }
        return false;
        
      case 2001: // 字体数据无效
      case 2002: // 字体加载失败
        console.warn('字体问题，清理并重新加载字体');
        this.parser.clearAllFonts();
        // 这里可以尝试重新加载字体
        return false;
        
      default:
        return false;
    }
  }

  private handleParseError(error: any, html: string): string | null {
    switch (error.code) {
      case 3004: // 解析超时
        console.warn('解析超时，尝试简化 HTML');
        // 移除复杂的 CSS
        return html.replace(/style\s*=\s*"[^"]*"/g, '');
        
      case 3005: // 不支持的 CSS 属性
        console.warn('包含不支持的 CSS，尝试清理');
        // 移除所有内联样式
        return html.replace(/style\s*=\s*"[^"]*"/g, '');
        
      default:
        return null;
    }
  }

  private async handleMemoryError(error: any): Promise<boolean> {
    switch (error.code) {
      case 4002: // 内存使用超过限制
        console.warn('内存使用过高，清理缓存和字体');
        this.parser.clearCache();
        
        // 只保留一个默认字体
        const fonts = this.parser.getLoadedFonts();
        if (fonts.length > 1) {
          for (let i = 1; i < fonts.length; i++) {
            this.parser.unloadFont(fonts[i].id);
          }
        }
        return true;
        
      default:
        return false;
    }
  }

  private async retryParse(
    html: string,
    options: { viewportWidth: number },
    retryKey: string
  ): Promise<CharLayout[] | null> {
    const currentRetries = this.retryCount.get(retryKey) || 0;
    
    if (currentRetries >= this.maxRetries) {
      console.error(`重试次数已达上限 (${this.maxRetries})，放弃解析`);
      return null;
    }
    
    this.retryCount.set(retryKey, currentRetries + 1);
    console.log(`第 ${currentRetries + 1} 次重试解析...`);
    
    // 等待一小段时间再重试
    await new Promise(resolve => setTimeout(resolve, 100 * (currentRetries + 1)));
    
    return this.handleParseWithRetry(html, options, retryKey);
  }

  private handleException(
    error: any,
    html: string,
    options: { viewportWidth: number },
    retryKey: string
  ): Promise<CharLayout[] | null> {
    console.error('解析过程中发生异常:', error);
    
    // 检查是否是内存相关的异常
    if (error.message.includes('memory') || error.message.includes('allocation')) {
      console.warn('检测到内存相关异常，尝试清理内存');
      this.parser.clearCache();
      this.parser.clearAllFonts();
      
      return this.retryParse(html, options, retryKey);
    }
    
    // 检查是否是初始化相关的异常
    if (error.message.includes('not initialized')) {
      console.warn('解析器未初始化，尝试重新初始化');
      // 这里需要外部重新初始化解析器
      return Promise.resolve(null);
    }
    
    return Promise.resolve(null);
  }

  private generateRetryKey(html: string, options: { viewportWidth: number }): string {
    // 生成基于内容和选项的唯一键
    const contentHash = this.simpleHash(html);
    return `${contentHash}-${options.viewportWidth}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为 32 位整数
    }
    return hash.toString();
  }

  clearRetryHistory(): void {
    this.retryCount.clear();
  }
}

// 使用示例
const parser = new HtmlLayoutParser();
await parser.init();

const errorHandler = new ErrorHandler(parser, 3);

const layouts = await errorHandler.handleParseWithRetry(html, {
  viewportWidth: 800
});

if (layouts) {
  console.log('解析成功，获得', layouts.length, '个字符布局');
} else {
  console.error('解析最终失败');
}
```

### 错误恢复策略

```typescript
class ErrorRecoveryManager {
  private parser: HtmlLayoutParser;
  private fallbackStrategies: Array<(html: string, options: any) => Promise<CharLayout[] | null>>;

  constructor(parser: HtmlLayoutParser) {
    this.parser = parser;
    this.fallbackStrategies = [
      this.strategySimplifyCSS.bind(this),
      this.strategyRemoveComplexElements.bind(this),
      this.strategyBasicTextOnly.bind(this),
      this.strategyEmergencyFallback.bind(this)
    ];
  }

  async parseWithRecovery(html: string, options: { viewportWidth: number }): Promise<{
    success: boolean;
    data: CharLayout[] | null;
    strategy: string;
    attempts: number;
  }> {
    // 首先尝试正常解析
    try {
      const result = this.parser.parseWithDiagnostics(html, options);
      if (result.success) {
        return {
          success: true,
          data: result.data,
          strategy: 'normal',
          attempts: 1
        };
      }
    } catch (error) {
      console.warn('正常解析失败，开始错误恢复:', error.message);
    }

    // 依次尝试恢复策略
    for (let i = 0; i < this.fallbackStrategies.length; i++) {
      const strategy = this.fallbackStrategies[i];
      const strategyName = this.getStrategyName(i);
      
      console.log(`尝试恢复策略: ${strategyName}`);
      
      try {
        const result = await strategy(html, options);
        if (result && result.length > 0) {
          return {
            success: true,
            data: result,
            strategy: strategyName,
            attempts: i + 2
          };
        }
      } catch (error) {
        console.warn(`恢复策略 ${strategyName} 失败:`, error.message);
      }
    }

    return {
      success: false,
      data: null,
      strategy: 'all_failed',
      attempts: this.fallbackStrategies.length + 1
    };
  }

  private async strategySimplifyCSS(html: string, options: any): Promise<CharLayout[] | null> {
    // 策略 1: 简化 CSS
    const simplifiedHtml = html
      .replace(/style\s*=\s*"[^"]*"/g, '') // 移除内联样式
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // 移除 style 标签
      .replace(/class\s*=\s*"[^"]*"/g, ''); // 移除 class 属性

    return this.parser.parse(simplifiedHtml, options);
  }

  private async strategyRemoveComplexElements(html: string, options: any): Promise<CharLayout[] | null> {
    // 策略 2: 移除复杂元素
    const simplifiedHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // 移除 script
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '') // 移除 iframe
      .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '') // 移除 object
      .replace(/<embed[^>]*>/gi, '') // 移除 embed
      .replace(/<canvas[^>]*>[\s\S]*?<\/canvas>/gi, '') // 移除 canvas
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, ''); // 移除 svg

    return this.parser.parse(simplifiedHtml, options);
  }

  private async strategyBasicTextOnly(html: string, options: any): Promise<CharLayout[] | null> {
    // 策略 3: 只保留基本文本元素
    const textOnlyHtml = html
      .replace(/<(?!\/?(div|p|span|h[1-6]|br|strong|em|b|i)\b)[^>]*>/gi, '') // 只保留基本文本标签
      .replace(/\s+/g, ' ') // 合并空白字符
      .trim();

    if (!textOnlyHtml) {
      return null;
    }

    return this.parser.parse(`<div>${textOnlyHtml}</div>`, options);
  }

  private async strategyEmergencyFallback(html: string, options: any): Promise<CharLayout[] | null> {
    // 策略 4: 紧急回退 - 提取纯文本
    const textContent = html
      .replace(/<[^>]*>/g, ' ') // 移除所有标签
      .replace(/\s+/g, ' ') // 合并空白字符
      .trim();

    if (!textContent) {
      return [];
    }

    // 创建最简单的 HTML
    const emergencyHtml = `<div>${textContent}</div>`;
    
    try {
      return this.parser.parse(emergencyHtml, {
        ...options,
        maxCharacters: Math.min(textContent.length, 1000) // 限制长度
      });
    } catch (error) {
      // 最后的回退：返回空数组而不是失败
      console.warn('所有恢复策略都失败，返回空结果');
      return [];
    }
  }

  private getStrategyName(index: number): string {
    const names = [
      'simplify_css',
      'remove_complex_elements',
      'basic_text_only',
      'emergency_fallback'
    ];
    return names[index] || 'unknown';
  }
}

// 使用示例
const parser = new HtmlLayoutParser();
await parser.init();

const recoveryManager = new ErrorRecoveryManager(parser);

const result = await recoveryManager.parseWithRecovery(html, {
  viewportWidth: 800
});

if (result.success) {
  console.log(`解析成功 (策略: ${result.strategy}, 尝试次数: ${result.attempts})`);
  console.log('字符数:', result.data?.length);
} else {
  console.error('所有恢复策略都失败了');
}
```

## 错误监控和报告

### 错误统计收集器

```typescript
class ErrorStatistics {
  private stats: Map<number, {
    count: number;
    lastOccurrence: number;
    samples: string[];
  }> = new Map();

  recordError(errorCode: number, context?: string): void {
    const existing = this.stats.get(errorCode) || {
      count: 0,
      lastOccurrence: 0,
      samples: []
    };

    existing.count++;
    existing.lastOccurrence = Date.now();
    
    if (context && existing.samples.length < 5) {
      existing.samples.push(context);
    }

    this.stats.set(errorCode, existing);
  }

  getErrorReport(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    topErrors: Array<{ code: number; count: number; category: string }>;
    recentErrors: Array<{ code: number; timestamp: number }>;
  } {
    const totalErrors = Array.from(this.stats.values())
      .reduce((sum, stat) => sum + stat.count, 0);

    const errorsByCategory: Record<string, number> = {};
    const topErrors: Array<{ code: number; count: number; category: string }> = [];
    const recentErrors: Array<{ code: number; timestamp: number }> = [];

    for (const [code, stat] of this.stats) {
      const category = this.getCategoryName(code);
      errorsByCategory[category] = (errorsByCategory[category] || 0) + stat.count;
      
      topErrors.push({ code, count: stat.count, category });
      
      if (Date.now() - stat.lastOccurrence < 3600000) { // 最近 1 小时
        recentErrors.push({ code, timestamp: stat.lastOccurrence });
      }
    }

    topErrors.sort((a, b) => b.count - a.count);
    recentErrors.sort((a, b) => b.timestamp - a.timestamp);

    return {
      totalErrors,
      errorsByCategory,
      topErrors: topErrors.slice(0, 10),
      recentErrors: recentErrors.slice(0, 20)
    };
  }

  private getCategoryName(errorCode: number): string {
    const category = Math.floor(errorCode / 1000);
    const categories: Record<number, string> = {
      1: '输入验证',
      2: '字体相关',
      3: '解析错误',
      4: '内存错误',
      5: '内部错误'
    };
    return categories[category] || '未知';
  }

  clear(): void {
    this.stats.clear();
  }

  exportStats(): string {
    return JSON.stringify(Object.fromEntries(this.stats), null, 2);
  }
}

// 使用示例
const errorStats = new ErrorStatistics();

// 在错误处理中记录
try {
  const layouts = parser.parse(html, { viewportWidth: 800 });
} catch (error) {
  // 假设我们能从错误中提取错误代码
  const errorCode = extractErrorCode(error);
  errorStats.recordError(errorCode, html.substring(0, 100));
}

// 定期生成报告
setInterval(() => {
  const report = errorStats.getErrorReport();
  console.log('错误统计报告:', report);
}, 300000); // 每 5 分钟
```

### 错误上报系统

```typescript
class ErrorReporter {
  private endpoint: string;
  private apiKey: string;
  private batchSize: number;
  private errorQueue: Array<{
    timestamp: number;
    errorCode: number;
    message: string;
    context: any;
    userAgent: string;
    sessionId: string;
  }> = [];

  constructor(endpoint: string, apiKey: string, batchSize: number = 10) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.batchSize = batchSize;
  }

  reportError(
    errorCode: number,
    message: string,
    context: any = {},
    sessionId: string = 'unknown'
  ): void {
    this.errorQueue.push({
      timestamp: Date.now(),
      errorCode,
      message,
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
      sessionId
    });

    if (this.errorQueue.length >= this.batchSize) {
      this.flushErrors();
    }
  }

  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          errors,
          timestamp: Date.now(),
          version: '0.2.0'
        })
      });
    } catch (error) {
      console.warn('错误上报失败:', error);
      // 将错误重新加入队列
      this.errorQueue.unshift(...errors);
    }
  }

  async flush(): Promise<void> {
    await this.flushErrors();
  }
}

// 使用示例
const errorReporter = new ErrorReporter(
  'https://api.example.com/errors',
  'your-api-key',
  5
);

// 在错误处理中使用
try {
  const layouts = parser.parse(html, { viewportWidth: 800 });
} catch (error) {
  const errorCode = extractErrorCode(error);
  
  errorReporter.reportError(
    errorCode,
    error.message,
    {
      htmlLength: html.length,
      viewportWidth: 800,
      stackTrace: error.stack
    },
    generateSessionId()
  );
  
  // 继续处理错误...
}

// 应用关闭时确保所有错误都已上报
process.on('beforeExit', async () => {
  await errorReporter.flush();
});
```

## 生产环境错误处理

### 优雅降级

```typescript
class GracefulDegradation {
  private parser: HtmlLayoutParser;
  private fallbackRenderer: (html: string) => CharLayout[];

  constructor(parser: HtmlLayoutParser) {
    this.parser = parser;
    this.fallbackRenderer = this.createFallbackRenderer();
  }

  async parseWithGracefulDegradation(
    html: string,
    options: { viewportWidth: number }
  ): Promise<{
    layouts: CharLayout[];
    degraded: boolean;
    reason?: string;
  }> {
    try {
      // 尝试正常解析
      const layouts = this.parser.parse(html, options);
      return {
        layouts,
        degraded: false
      };
    } catch (error) {
      console.warn('正常解析失败，启用优雅降级:', error.message);
      
      try {
        // 尝试简化解析
        const simplifiedLayouts = await this.trySimplifiedParse(html, options);
        if (simplifiedLayouts) {
          return {
            layouts: simplifiedLayouts,
            degraded: true,
            reason: 'simplified_parse'
          };
        }
      } catch (simplifiedError) {
        console.warn('简化解析也失败:', simplifiedError.message);
      }

      // 最后的回退：使用纯文本渲染
      const fallbackLayouts = this.fallbackRenderer(html);
      return {
        layouts: fallbackLayouts,
        degraded: true,
        reason: 'fallback_renderer'
      };
    }
  }

  private async trySimplifiedParse(
    html: string,
    options: { viewportWidth: number }
  ): Promise<CharLayout[] | null> {
    // 移除复杂的 CSS 和元素
    const simplifiedHtml = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/style\s*=\s*"[^"]*"/g, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<(?!\/?(div|p|span|h[1-6]|br|strong|em|b|i|a)\b)[^>]*>/gi, '');

    return this.parser.parse(simplifiedHtml, {
      ...options,
      maxCharacters: 10000,
      timeout: 5000
    });
  }

  private createFallbackRenderer(): (html: string) => CharLayout[] {
    return (html: string) => {
      // 提取纯文本
      const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
      // 创建基本的字符布局
      const layouts: CharLayout[] = [];
      let x = 0;
      const y = 20; // 基线位置
      const fontSize = 16;
      const charWidth = fontSize * 0.6; // 估算字符宽度

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (char === ' ') {
          x += charWidth;
          continue;
        }

        layouts.push({
          character: char,
          x,
          y,
          width: charWidth,
          height: fontSize,
          baseline: y,
          fontFamily: 'Arial',
          fontSize,
          fontWeight: 400,
          fontStyle: 'normal',
          fontId: 0,
          color: '#000000FF',
          backgroundColor: '#00000000',
          opacity: 1,
          textDecoration: {
            underline: false,
            overline: false,
            lineThrough: false,
            color: '#000000FF',
            style: 'solid',
            thickness: 1
          },
          letterSpacing: 0,
          wordSpacing: 0,
          textShadow: [],
          transform: {
            scaleX: 1,
            scaleY: 1,
            skewX: 0,
            skewY: 0,
            rotate: 0
          },
          direction: 'ltr'
        });

        x += charWidth;
      }

      return layouts;
    };
  }
}

// 使用示例
const gracefulDegradation = new GracefulDegradation(parser);

const result = await gracefulDegradation.parseWithGracefulDegradation(html, {
  viewportWidth: 800
});

if (result.degraded) {
  console.warn(`使用降级模式: ${result.reason}`);
  // 可能需要通知用户或记录日志
}

// 使用结果
renderToCanvas(ctx, result.layouts);
```

### 错误边界组件

```typescript
class ParserErrorBoundary {
  private parser: HtmlLayoutParser;
  private errorCallback?: (error: Error, html: string) => void;
  private maxConsecutiveErrors: number;
  private consecutiveErrors: number = 0;
  private lastErrorTime: number = 0;

  constructor(
    parser: HtmlLayoutParser,
    options: {
      maxConsecutiveErrors?: number;
      errorCallback?: (error: Error, html: string) => void;
    } = {}
  ) {
    this.parser = parser;
    this.maxConsecutiveErrors = options.maxConsecutiveErrors || 5;
    this.errorCallback = options.errorCallback;
  }

  async safeParse(
    html: string,
    options: { viewportWidth: number }
  ): Promise<CharLayout[] | null> {
    // 检查是否应该暂停解析（连续错误过多）
    if (this.shouldPause()) {
      console.warn('连续错误过多，暂停解析');
      return null;
    }

    try {
      const layouts = this.parser.parse(html, options);
      
      // 成功时重置错误计数
      this.consecutiveErrors = 0;
      return layouts;
      
    } catch (error) {
      this.handleError(error, html);
      return null;
    }
  }

  private shouldPause(): boolean {
    const now = Date.now();
    const timeSinceLastError = now - this.lastErrorTime;
    
    // 如果距离上次错误超过 1 分钟，重置计数
    if (timeSinceLastError > 60000) {
      this.consecutiveErrors = 0;
      return false;
    }

    return this.consecutiveErrors >= this.maxConsecutiveErrors;
  }

  private handleError(error: Error, html: string): void {
    this.consecutiveErrors++;
    this.lastErrorTime = Date.now();

    console.error(`解析错误 (连续第 ${this.consecutiveErrors} 次):`, error.message);

    if (this.errorCallback) {
      try {
        this.errorCallback(error, html);
      } catch (callbackError) {
        console.error('错误回调函数执行失败:', callbackError);
      }
    }

    // 如果连续错误过多，建议重启解析器
    if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
      console.error('连续错误过多，建议重启解析器');
    }
  }

  reset(): void {
    this.consecutiveErrors = 0;
    this.lastErrorTime = 0;
  }

  getErrorCount(): number {
    return this.consecutiveErrors;
  }
}

// 使用示例
const errorBoundary = new ParserErrorBoundary(parser, {
  maxConsecutiveErrors: 3,
  errorCallback: (error, html) => {
    // 记录错误到监控系统
    console.error('解析错误:', {
      message: error.message,
      htmlLength: html.length,
      timestamp: new Date().toISOString()
    });
  }
});

// 在应用中使用
const layouts = await errorBoundary.safeParse(html, { viewportWidth: 800 });

if (layouts) {
  // 正常处理
  renderToCanvas(ctx, layouts);
} else {
  // 显示错误状态或使用备用方案
  showErrorMessage('解析失败，请稍后重试');
}
```