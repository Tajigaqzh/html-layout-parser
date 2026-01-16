# 错误代码参考

HTML Layout Parser 使用结构化的错误代码系统，帮助您快速识别和解决问题。

## 错误代码结构

错误代码采用 4 位数字格式：`CXXX`

- `C` - 类别代码 (1-5)
- `XXX` - 具体错误编号 (001-999)

## 成功代码

| 代码 | 描述 |
|------|------|
| 0 | 操作成功完成 |

## 1xxx - 输入验证错误

这类错误表示输入参数或数据格式有问题。

### 1001 - HTML 内容为空

**描述：** 传入的 HTML 字符串为空或只包含空白字符。

**原因：**
- HTML 参数为空字符串
- HTML 参数为 null 或 undefined
- HTML 只包含空格、换行等空白字符

**解决方案：**
```typescript
// ❌ 错误
parser.parse('', { viewportWidth: 800 });
parser.parse('   \n\t   ', { viewportWidth: 800 });

// ✅ 正确
parser.parse('<div>Hello</div>', { viewportWidth: 800 });
```

### 1002 - 视口宽度无效

**描述：** 视口宽度参数无效。

**原因：**
- viewportWidth 为 0 或负数
- viewportWidth 为 NaN
- viewportWidth 未提供

**解决方案：**
```typescript
// ❌ 错误
parser.parse(html, { viewportWidth: 0 });
parser.parse(html, { viewportWidth: -100 });

// ✅ 正确
parser.parse(html, { viewportWidth: 800 });
parser.parse(html, { viewportWidth: 1200 });
```

### 1003 - CSS 语法错误

**描述：** CSS 字符串包含语法错误。

**原因：**
- CSS 选择器语法错误
- CSS 属性值格式错误
- CSS 规则不完整

**解决方案：**
```typescript
// ❌ 错误
const badCSS = '.title { color: ; }'; // 缺少值
const badCSS2 = '.title color: red; }'; // 缺少大括号

// ✅ 正确
const goodCSS = '.title { color: red; }';
parser.parse(html, { viewportWidth: 800, css: goodCSS });
```

### 1004 - 参数类型错误

**描述：** 传入参数的类型不正确。

**原因：**
- HTML 参数不是字符串
- 选项参数不是对象
- 数值参数传入了字符串

**解决方案：**
```typescript
// ❌ 错误
parser.parse(123, { viewportWidth: 800 }); // HTML 不是字符串
parser.parse(html, { viewportWidth: '800' }); // 宽度不是数字

// ✅ 正确
parser.parse(html, { viewportWidth: 800 });
```

### 1005 - 文档大小超过限制

**描述：** HTML 文档大小超过了设置的限制。

**原因：**
- HTML 字符串长度超过 maxCharacters 设置
- 文档过于复杂，超过内部处理限制

**解决方案：**
```typescript
// 增加字符限制
parser.parse(html, { 
  viewportWidth: 800,
  maxCharacters: 100000 // 增加到 100,000 字符
});

// 或者分块处理
function parseInChunks(html: string, chunkSize: number = 50000) {
  const chunks = [];
  for (let i = 0; i < html.length; i += chunkSize) {
    const chunk = html.slice(i, i + chunkSize);
    chunks.push(parser.parse(chunk, { viewportWidth: 800 }));
  }
  return chunks;
}
```

## 2xxx - 字体相关错误

这类错误与字体加载、管理相关。

### 2001 - 字体数据无效

**描述：** 字体文件数据格式无效或损坏。

**原因：**
- 字体文件不是有效的 TTF/OTF 格式
- 字体数据在传输过程中损坏
- 传入的不是字体数据

**解决方案：**
```typescript
// 验证字体数据
async function loadFontSafely(fontUrl: string, fontName: string) {
  try {
    const response = await fetch(fontUrl);
    if (!response.ok) {
      throw new Error(`字体下载失败: ${response.status}`);
    }
    
    const fontData = new Uint8Array(await response.arrayBuffer());
    
    // 检查字体文件头
    if (fontData.length < 4) {
      throw new Error('字体文件太小');
    }
    
    const fontId = parser.loadFont(fontData, fontName);
    if (fontId <= 0) {
      throw new Error('字体加载失败');
    }
    
    return fontId;
  } catch (error) {
    console.error('字体加载错误:', error);
    return null;
  }
}
```

### 2002 - 字体加载失败

**描述：** 字体加载过程中发生错误。

**原因：**
- 内存不足
- 字体格式不支持
- 系统资源限制

**解决方案：**
```typescript
// 重试机制
async function loadFontWithRetry(fontData: Uint8Array, fontName: string, maxRetries: number = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const fontId = parser.loadFont(fontData, fontName);
      if (fontId > 0) {
        return fontId;
      }
    } catch (error) {
      console.warn(`字体加载尝试 ${i + 1} 失败:`, error);
      
      if (i < maxRetries - 1) {
        // 清理内存后重试
        parser.clearCache();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  throw new Error(`字体加载失败，已重试 ${maxRetries} 次`);
}
```

### 2003 - 字体 ID 不存在

**描述：** 尝试使用不存在的字体 ID。

**原因：**
- 字体已被卸载
- 使用了错误的字体 ID
- 字体加载失败但仍尝试使用

**解决方案：**
```typescript
// 验证字体 ID
function validateFontId(fontId: number): boolean {
  const loadedFonts = parser.getLoadedFonts();
  return loadedFonts.some(font => font.id === fontId);
}

// 安全使用字体
function parseWithFont(html: string, fontId: number) {
  if (!validateFontId(fontId)) {
    console.warn(`字体 ID ${fontId} 不存在，使用默认字体`);
    return parser.parse(html, { viewportWidth: 800 });
  }
  
  return parser.parse(html, { 
    viewportWidth: 800,
    defaultFontId: fontId
  });
}
```

### 2004 - 字体格式不支持

**描述：** 字体文件格式不被支持。

**支持的格式：**
- TTF (TrueType Font)
- OTF (OpenType Font)

**不支持的格式：**
- WOFF/WOFF2
- EOT
- SVG 字体

**解决方案：**
```typescript
// 检查字体格式
function checkFontFormat(fontData: Uint8Array): string {
  if (fontData.length < 4) return 'unknown';
  
  const header = Array.from(fontData.slice(0, 4))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  switch (header) {
    case '00010000':
    case '74727565': // 'true'
      return 'ttf';
    case '4f54544f': // 'OTTO'
      return 'otf';
    case '774f4646': // 'wOFF'
      return 'woff';
    case '774f4632': // 'wOF2'
      return 'woff2';
    default:
      return 'unknown';
  }
}

// 使用示例
const format = checkFontFormat(fontData);
if (format !== 'ttf' && format !== 'otf') {
  console.error(`不支持的字体格式: ${format}`);
  // 尝试转换或使用备用字体
}
```

### 2005 - 默认字体未设置

**描述：** 尝试解析但没有设置默认字体。

**解决方案：**
```typescript
// 确保设置默认字体
async function ensureDefaultFont() {
  const loadedFonts = parser.getLoadedFonts();
  
  if (loadedFonts.length === 0) {
    // 加载默认字体
    const response = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await response.arrayBuffer());
    const fontId = parser.loadFont(fontData, 'Arial');
    
    if (fontId > 0) {
      parser.setDefaultFont(fontId);
    } else {
      throw new Error('无法加载默认字体');
    }
  } else {
    // 使用第一个已加载的字体作为默认字体
    parser.setDefaultFont(loadedFonts[0].id);
  }
}

// 解析前检查
await ensureDefaultFont();
const layouts = parser.parse(html, { viewportWidth: 800 });
```

## 3xxx - 解析错误

这类错误发生在 HTML/CSS 解析过程中。

### 3001 - HTML 解析失败

**描述：** HTML 文档解析过程中发生错误。

**原因：**
- HTML 结构严重错误
- 包含不支持的标签或属性
- 文档编码问题

**解决方案：**
```typescript
// 简化 HTML 结构
function simplifyHTML(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // 移除 script
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // 移除 style
    .replace(/<!--[\s\S]*?-->/g, '')                   // 移除注释
    .replace(/\s+/g, ' ')                              // 合并空白
    .trim();
}

// 尝试解析简化版本
try {
  const layouts = parser.parse(html, { viewportWidth: 800 });
} catch (error) {
  console.warn('原始 HTML 解析失败，尝试简化版本');
  const simplifiedHTML = simplifyHTML(html);
  const layouts = parser.parse(simplifiedHTML, { viewportWidth: 800 });
}
```

### 3002 - CSS 解析失败

**描述：** CSS 样式解析过程中发生错误。

**原因：**
- CSS 语法错误
- 使用了不支持的 CSS 属性
- CSS 规则过于复杂

**解决方案：**
```typescript
// CSS 清理函数
function sanitizeCSS(css: string): string {
  return css
    .replace(/@import[^;]+;/g, '')           // 移除 @import
    .replace(/@media[^{]+\{[^}]*\}/g, '')    // 移除 @media
    .replace(/\/\*[\s\S]*?\*\//g, '')        // 移除注释
    .replace(/\s+/g, ' ')                    // 合并空白
    .trim();
}

// 使用清理后的 CSS
const cleanCSS = sanitizeCSS(originalCSS);
const layouts = parser.parse(html, { 
  viewportWidth: 800,
  css: cleanCSS
});
```

### 3003 - 布局计算失败

**描述：** 布局计算过程中发生错误。

**原因：**
- 循环依赖的布局规则
- 数值溢出
- 复杂的嵌套结构

**解决方案：**
```typescript
// 限制嵌套深度
function limitNestingDepth(html: string, maxDepth: number = 10): string {
  // 简化实现：移除过深的嵌套
  let depth = 0;
  let result = '';
  let inTag = false;
  
  for (let i = 0; i < html.length; i++) {
    const char = html[i];
    
    if (char === '<') {
      inTag = true;
      if (html[i + 1] === '/') {
        depth--;
      } else {
        depth++;
      }
      
      if (depth <= maxDepth) {
        result += char;
      }
    } else if (char === '>') {
      inTag = false;
      if (depth <= maxDepth) {
        result += char;
      }
    } else if (!inTag && depth <= maxDepth) {
      result += char;
    }
  }
  
  return result;
}
```

### 3004 - 解析超时

**描述：** 解析过程超过了设置的时间限制。

**解决方案：**
```typescript
// 增加超时时间
const layouts = parser.parse(html, {
  viewportWidth: 800,
  timeout: 30000 // 30 秒
});

// 或者分块处理
async function parseWithTimeout(html: string, timeoutMs: number = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('解析超时'));
    }, timeoutMs);
    
    try {
      const result = parser.parse(html, { viewportWidth: 800 });
      clearTimeout(timer);
      resolve(result);
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
}
```

### 3005 - 不支持的 CSS 属性

**描述：** CSS 中包含不支持的属性。

**支持的主要属性：**
- 字体：font-family, font-size, font-weight, font-style
- 颜色：color, background-color
- 文本：text-decoration, text-shadow, letter-spacing
- 布局：display, position, width, height, margin, padding

**解决方案：**
```typescript
// 过滤不支持的 CSS 属性
function filterSupportedCSS(css: string): string {
  const supportedProperties = [
    'font-family', 'font-size', 'font-weight', 'font-style',
    'color', 'background-color', 'opacity',
    'text-decoration', 'text-shadow', 'letter-spacing', 'word-spacing',
    'display', 'position', 'width', 'height',
    'margin', 'padding', 'border'
  ];
  
  return css.replace(/([a-z-]+)\s*:\s*[^;]+;/g, (match, property) => {
    return supportedProperties.includes(property) ? match : '';
  });
}
```

## 4xxx - 内存错误

这类错误与内存分配和管理相关。

### 4001 - 内存分配失败

**描述：** 无法分配所需的内存。

**解决方案：**
```typescript
// 内存清理
function cleanupMemory() {
  parser.clearCache();
  parser.clearAllFonts();
  
  // 强制垃圾回收（如果可用）
  if (global.gc) {
    global.gc();
  }
}

// 在内存不足时清理
try {
  const layouts = parser.parse(html, { viewportWidth: 800 });
} catch (error) {
  if (error.message.includes('memory') || error.message.includes('allocation')) {
    console.warn('内存不足，清理后重试');
    cleanupMemory();
    
    // 重试一次
    const layouts = parser.parse(html, { viewportWidth: 800 });
  }
}
```

### 4002 - 内存使用超过限制

**描述：** 内存使用量超过了 50MB 的安全阈值。

**解决方案：**
```typescript
// 内存监控
function monitorMemory() {
  const metrics = parser.getMemoryMetrics();
  if (metrics) {
    const memoryMB = metrics.totalMemoryUsage / 1024 / 1024;
    
    if (memoryMB > 40) { // 40MB 警告阈值
      console.warn(`内存使用较高: ${memoryMB.toFixed(2)} MB`);
      
      // 清理不必要的字体
      const fonts = parser.getLoadedFonts();
      if (fonts.length > 3) {
        // 只保留前 3 个字体
        for (let i = 3; i < fonts.length; i++) {
          parser.unloadFont(fonts[i].id);
        }
      }
      
      // 清理缓存
      parser.clearCache();
    }
  }
}

// 定期检查
setInterval(monitorMemory, 10000); // 每 10 秒检查一次
```

### 4003 - 缓冲区溢出

**描述：** 内部缓冲区溢出。

**解决方案：**
```typescript
// 限制文档大小
const MAX_HTML_SIZE = 100000; // 100KB

function parseWithSizeLimit(html: string) {
  if (html.length > MAX_HTML_SIZE) {
    console.warn(`HTML 过大 (${html.length} 字符)，截断处理`);
    html = html.substring(0, MAX_HTML_SIZE);
  }
  
  return parser.parse(html, { 
    viewportWidth: 800,
    maxCharacters: MAX_HTML_SIZE
  });
}
```

### 4004 - 内存泄漏检测到

**描述：** 检测到可能的内存泄漏。

**解决方案：**
```typescript
// 内存泄漏检测
class MemoryLeakDetector {
  private baselineMemory: number = 0;
  private checkCount: number = 0;

  startMonitoring() {
    this.baselineMemory = parser.getTotalMemoryUsage();
    this.checkCount = 0;
  }

  checkForLeaks(): boolean {
    this.checkCount++;
    const currentMemory = parser.getTotalMemoryUsage();
    const growth = currentMemory - this.baselineMemory;
    
    // 如果内存增长超过 10MB 且检查次数超过 10 次
    if (growth > 10 * 1024 * 1024 && this.checkCount > 10) {
      console.error('检测到内存泄漏');
      return true;
    }
    
    return false;
  }

  cleanup() {
    parser.destroy();
    // 重新创建解析器
    // parser = new HtmlLayoutParser();
  }
}
```

## 5xxx - 内部错误

这类错误表示系统内部问题。

### 5001 - WASM 模块未初始化

**描述：** 尝试使用未初始化的 WASM 模块。

**解决方案：**
```typescript
// 确保初始化
async function ensureInitialized() {
  if (!parser.isInitialized()) {
    await parser.init();
  }
}

// 使用前检查
await ensureInitialized();
const layouts = parser.parse(html, { viewportWidth: 800 });
```

### 5002 - 内部状态错误

**描述：** 解析器内部状态不一致。

**解决方案：**
```typescript
// 重置解析器
function resetParser() {
  parser.destroy();
  parser = new HtmlLayoutParser();
  return parser.init();
}

// 在状态错误时重置
try {
  const layouts = parser.parse(html, { viewportWidth: 800 });
} catch (error) {
  if (error.message.includes('internal state')) {
    console.warn('内部状态错误，重置解析器');
    await resetParser();
    const layouts = parser.parse(html, { viewportWidth: 800 });
  }
}
```

### 5003 - 系统资源不足

**描述：** 系统资源（如文件句柄、线程等）不足。

**解决方案：**
```typescript
// 资源管理
class ResourceManager {
  private activeOperations: number = 0;
  private maxConcurrent: number = 5;

  async executeWithLimit<T>(operation: () => Promise<T>): Promise<T> {
    if (this.activeOperations >= this.maxConcurrent) {
      await this.waitForSlot();
    }

    this.activeOperations++;
    try {
      return await operation();
    } finally {
      this.activeOperations--;
    }
  }

  private async waitForSlot(): Promise<void> {
    return new Promise(resolve => {
      const check = () => {
        if (this.activeOperations < this.maxConcurrent) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }
}
```

### 5004 - 未知内部错误

**描述：** 未分类的内部错误。

**解决方案：**
```typescript
// 通用错误处理
function handleUnknownError(error: any) {
  console.error('未知内部错误:', error);
  
  // 收集诊断信息
  const diagnostics = {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    memory: parser.getTotalMemoryUsage(),
    fonts: parser.getLoadedFonts().length,
    environment: parser.getEnvironment(),
    version: parser.getVersion()
  };
  
  console.log('诊断信息:', diagnostics);
  
  // 可以发送到错误报告服务
  // sendErrorReport(diagnostics);
}
```

## 错误处理最佳实践

### 1. 分层错误处理

```typescript
class ErrorHandler {
  static handle(error: any, context: string): void {
    const errorCode = error.code || 5004;
    const category = Math.floor(errorCode / 1000);
    
    switch (category) {
      case 1:
        this.handleInputError(error, context);
        break;
      case 2:
        this.handleFontError(error, context);
        break;
      case 3:
        this.handleParseError(error, context);
        break;
      case 4:
        this.handleMemoryError(error, context);
        break;
      case 5:
        this.handleInternalError(error, context);
        break;
      default:
        this.handleUnknownError(error, context);
    }
  }
  
  private static handleInputError(error: any, context: string): void {
    console.warn(`输入错误 [${context}]:`, error.message);
    // 尝试修复输入
  }
  
  // ... 其他处理方法
}
```

### 2. 错误恢复策略

```typescript
async function parseWithRecovery(html: string): Promise<CharLayout[] | null> {
  const strategies = [
    () => parser.parse(html, { viewportWidth: 800 }),
    () => parser.parse(simplifyHTML(html), { viewportWidth: 800 }),
    () => parser.parse(extractTextOnly(html), { viewportWidth: 800 }),
    () => []
  ];
  
  for (const strategy of strategies) {
    try {
      return strategy();
    } catch (error) {
      console.warn('策略失败，尝试下一个:', error.message);
    }
  }
  
  return null;
}
```

### 3. 错误监控和报告

```typescript
class ErrorMonitor {
  private errorCounts: Map<number, number> = new Map();
  
  recordError(errorCode: number): void {
    const count = this.errorCounts.get(errorCode) || 0;
    this.errorCounts.set(errorCode, count + 1);
  }
  
  getTopErrors(): Array<{ code: number; count: number }> {
    return Array.from(this.errorCounts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
  
  generateReport(): string {
    const topErrors = this.getTopErrors();
    let report = '错误统计报告\n';
    report += '================\n';
    
    for (const { code, count } of topErrors) {
      report += `错误 ${code}: ${count} 次\n`;
    }
    
    return report;
  }
}
```