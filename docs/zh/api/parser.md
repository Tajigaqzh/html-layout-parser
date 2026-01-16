# HtmlLayoutParser 类

`HtmlLayoutParser` 是 HTML Layout Parser 的核心类，提供所有解析和字体管理功能。

## 构造函数

```typescript
constructor()
```

创建一个新的解析器实例。

**示例：**
```typescript
const parser = new HtmlLayoutParser();
```

## 初始化方法

### init()

```typescript
async init(wasmPath?: string): Promise<void>
```

初始化 WASM 模块。必须在使用其他方法之前调用。

**参数：**
- `wasmPath` (可选) - 自定义 WASM 文件路径

**示例：**
```typescript
// 使用默认路径
await parser.init();

// 使用自定义路径
await parser.init('/custom/path/litehtml_wasm.js');
```

### isInitialized()

```typescript
isInitialized(): boolean
```

检查解析器是否已初始化。

**返回值：**
- `boolean` - 如果已初始化返回 `true`

**示例：**
```typescript
if (parser.isInitialized()) {
  console.log('解析器已准备就绪');
}
```

### destroy()

```typescript
destroy(): void
```

销毁解析器并释放所有资源。**必须在使用完毕后调用以避免内存泄漏。**

**示例：**
```typescript
try {
  await parser.init();
  // 使用解析器...
} finally {
  parser.destroy(); // 确保清理资源
}
```

## 信息方法

### getVersion()

```typescript
getVersion(): string
```

获取解析器版本号。

**返回值：**
- `string` - 版本号（如 "0.2.0"）

**示例：**
```typescript
console.log('版本:', parser.getVersion()); // "0.2.0"
```

### getEnvironment()

```typescript
getEnvironment(): 'web' | 'worker' | 'node' | 'unknown'
```

获取当前运行环境。

**返回值：**
- `'web'` - Web 浏览器环境
- `'worker'` - Web Worker 环境
- `'node'` - Node.js 环境
- `'unknown'` - 未知环境

**示例：**
```typescript
const env = parser.getEnvironment();
console.log('运行环境:', env);
```

## 字体管理方法

### loadFont()

```typescript
loadFont(fontData: Uint8Array, fontName: string): number
```

从二进制数据加载字体。

**参数：**
- `fontData` - 字体文件的二进制数据
- `fontName` - 字体名称

**返回值：**
- `number` - 字体 ID（> 0 表示成功，0 表示失败）

**示例：**
```typescript
const response = await fetch('/fonts/arial.ttf');
const fontData = new Uint8Array(await response.arrayBuffer());
const fontId = parser.loadFont(fontData, 'Arial');

if (fontId > 0) {
  console.log('字体加载成功，ID:', fontId);
} else {
  console.error('字体加载失败');
}
```

### loadFontFromFile() (Node.js 专用)

```typescript
async loadFontFromFile(filePath: string, fontName: string): Promise<number>
```

从文件路径加载字体。仅在 Node.js 环境中可用。

**参数：**
- `filePath` - 字体文件路径
- `fontName` - 字体名称

**返回值：**
- `Promise<number>` - 字体 ID

**示例：**
```typescript
// 仅在 Node.js 中
import { HtmlLayoutParser } from 'html-layout-parser/node';

const parser = new HtmlLayoutParser();
await parser.init();

const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
```

### unloadFont()

```typescript
unloadFont(fontId: number): void
```

卸载指定的字体。

**参数：**
- `fontId` - 要卸载的字体 ID

**示例：**
```typescript
parser.unloadFont(fontId);
console.log('字体已卸载');
```

### clearAllFonts()

```typescript
clearAllFonts(): void
```

清除所有已加载的字体。

**示例：**
```typescript
parser.clearAllFonts();
console.log('所有字体已清除');
```

### setDefaultFont()

```typescript
setDefaultFont(fontId: number): void
```

设置默认字体，用于没有指定字体的文本。

**参数：**
- `fontId` - 默认字体的 ID

**示例：**
```typescript
const fontId = parser.loadFont(fontData, 'Arial');
parser.setDefaultFont(fontId);
```

### getLoadedFonts()

```typescript
getLoadedFonts(): Array<{
  id: number;
  name: string;
  memoryUsage: number;
}>
```

获取所有已加载字体的信息。

**返回值：**
- 字体信息数组，包含 ID、名称和内存使用量

**示例：**
```typescript
const fonts = parser.getLoadedFonts();
fonts.forEach(font => {
  console.log(`字体: ${font.name} (ID: ${font.id})`);
  console.log(`内存使用: ${(font.memoryUsage / 1024).toFixed(1)} KB`);
});
```

## HTML 解析方法

### parse()

```typescript
parse<T extends OutputMode = 'flat'>(
  html: string,
  options: ParseOptions
): ParseResult<T>
```

解析 HTML 并返回布局数据。

**类型参数：**
- `T` - 输出模式类型

**参数：**
- `html` - 要解析的 HTML 字符串
- `options` - 解析选项

**返回值：**
- 根据输出模式返回不同类型的布局数据

**示例：**
```typescript
// 默认 flat 模式
const layouts = parser.parse('<div>Hello</div>', {
  viewportWidth: 800
});

// 指定输出模式
const rows = parser.parse<'byRow'>('<div>Hello</div>', {
  viewportWidth: 800,
  mode: 'byRow'
});

// 完整模式
const document = parser.parse<'full'>('<div>Hello</div>', {
  viewportWidth: 800,
  mode: 'full'
});
```

### parseWithDiagnostics()

```typescript
parseWithDiagnostics<T extends OutputMode = 'flat'>(
  html: string,
  options: ParseOptions
): DiagnosticResult<T>
```

解析 HTML 并返回详细的诊断信息。

**参数：**
- `html` - 要解析的 HTML 字符串
- `options` - 解析选项

**返回值：**
- 包含成功状态、数据、错误和警告的诊断结果

**示例：**
```typescript
const result = parser.parseWithDiagnostics('<div>Hello</div>', {
  viewportWidth: 800,
  enableMetrics: true
});

if (result.success) {
  console.log('解析成功');
  console.log('数据:', result.data);
  
  if (result.metrics) {
    console.log('性能指标:', result.metrics);
  }
  
  if (result.warnings?.length) {
    console.warn('警告:', result.warnings);
  }
} else {
  console.error('解析失败');
  result.errors?.forEach(error => {
    console.error(`错误 [${error.code}]: ${error.message}`);
  });
}
```

### parseWithCSS()

```typescript
parseWithCSS<T extends OutputMode = 'flat'>(
  html: string,
  css: string,
  options: Omit<ParseOptions, 'css'>
): ParseResult<T>
```

使用分离的 CSS 解析 HTML。

**参数：**
- `html` - HTML 内容（不包含内联样式）
- `css` - CSS 样式字符串
- `options` - 解析选项（不包含 css 字段）

**示例：**
```typescript
const html = `
  <div class="container">
    <h1 class="title">标题</h1>
    <p class="content">内容</p>
  </div>
`;

const css = `
  .title { color: red; font-size: 24px; }
  .content { color: blue; font-size: 16px; }
`;

const layouts = parser.parseWithCSS(html, css, {
  viewportWidth: 800
});
```

## 内存管理方法

### getTotalMemoryUsage()

```typescript
getTotalMemoryUsage(): number
```

获取总内存使用量（字节）。

**返回值：**
- `number` - 内存使用量（字节）

**示例：**
```typescript
const memoryBytes = parser.getTotalMemoryUsage();
const memoryMB = (memoryBytes / 1024 / 1024).toFixed(2);
console.log(`内存使用: ${memoryMB} MB`);
```

### getMemoryMetrics()

```typescript
getMemoryMetrics(): MemoryMetrics | null
```

获取详细的内存使用指标。

**返回值：**
- `MemoryMetrics` 对象或 `null`

**示例：**
```typescript
const metrics = parser.getMemoryMetrics();
if (metrics) {
  console.log(`总内存: ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
  console.log(`字体数量: ${metrics.fontCount}`);
  
  metrics.fonts.forEach(font => {
    console.log(`  ${font.name}: ${(font.memoryUsage / 1024).toFixed(1)} KB`);
  });
}
```

### checkMemoryThreshold()

```typescript
checkMemoryThreshold(): boolean
```

检查内存使用是否超过阈值（50MB）。

**返回值：**
- `boolean` - 如果超过阈值返回 `true`

**示例：**
```typescript
if (parser.checkMemoryThreshold()) {
  console.warn('内存使用过高，建议清理字体');
  parser.clearAllFonts();
}
```

## 缓存管理方法

### getCacheStats()

```typescript
getCacheStats(): CacheStats
```

获取缓存统计信息。

**返回值：**
- `CacheStats` 对象，包含命中率、条目数等信息

**示例：**
```typescript
const stats = parser.getCacheStats();
console.log(`缓存命中率: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`缓存条目: ${stats.entries}`);
console.log(`缓存内存: ${(stats.memoryUsage / 1024).toFixed(1)} KB`);
```

### clearCache()

```typescript
clearCache(): void
```

清除所有缓存数据。

**示例：**
```typescript
parser.clearCache();
console.log('缓存已清除');
```

### resetCacheStats()

```typescript
resetCacheStats(): void
```

重置缓存统计信息。

**示例：**
```typescript
parser.resetCacheStats();
console.log('缓存统计已重置');
```

### getDetailedMetrics()

```typescript
getDetailedMetrics(): DetailedMetrics | null
```

获取包含缓存信息的详细指标。

**返回值：**
- `DetailedMetrics` 对象或 `null`

**示例：**
```typescript
const metrics = parser.getDetailedMetrics();
if (metrics) {
  console.log('内存指标:', metrics.memory);
  console.log('缓存指标:', metrics.cache);
}
```

## 解析选项 (ParseOptions)

```typescript
interface ParseOptions {
  viewportWidth: number;      // 必需：视口宽度（像素）
  viewportHeight?: number;    // 可选：视口高度（像素）
  mode?: OutputMode;          // 可选：输出模式
  defaultFontId?: number;     // 可选：默认字体 ID
  enableMetrics?: boolean;    // 可选：启用性能指标
  maxCharacters?: number;     // 可选：最大字符数限制
  timeout?: number;           // 可选：超时时间（毫秒）
  css?: string;               // 可选：外部 CSS
  isDebug?: boolean;          // 可选：启用调试模式
}
```

### 选项详解

#### viewportWidth (必需)
视口宽度，影响文本换行和布局计算。

```typescript
const layouts = parser.parse(html, {
  viewportWidth: 800  // 800 像素宽度
});
```

#### viewportHeight (可选)
视口高度，用于某些布局计算。

```typescript
const layouts = parser.parse(html, {
  viewportWidth: 800,
  viewportHeight: 600
});
```

#### mode (可选)
输出模式，决定返回数据的结构。

```typescript
// 默认 flat 模式
const chars = parser.parse(html, { viewportWidth: 800 });

// 按行分组
const rows = parser.parse<'byRow'>(html, { 
  viewportWidth: 800, 
  mode: 'byRow' 
});

// 简单结构
const simple = parser.parse<'simple'>(html, { 
  viewportWidth: 800, 
  mode: 'simple' 
});

// 完整层次结构
const doc = parser.parse<'full'>(html, { 
  viewportWidth: 800, 
  mode: 'full' 
});
```

#### defaultFontId (可选)
指定默认字体 ID，覆盖全局默认字体。

```typescript
const layouts = parser.parse(html, {
  viewportWidth: 800,
  defaultFontId: fontId
});
```

#### enableMetrics (可选)
启用性能指标收集。

```typescript
const result = parser.parseWithDiagnostics(html, {
  viewportWidth: 800,
  enableMetrics: true
});

if (result.metrics) {
  console.log('解析时间:', result.metrics.parseTime);
  console.log('解析速度:', result.metrics.charsPerSecond);
}
```

#### maxCharacters (可选)
限制处理的最大字符数，防止处理过大的文档。

```typescript
const layouts = parser.parse(html, {
  viewportWidth: 800,
  maxCharacters: 10000  // 最多处理 10,000 字符
});
```

#### timeout (可选)
设置解析超时时间（毫秒）。

```typescript
const layouts = parser.parse(html, {
  viewportWidth: 800,
  timeout: 5000  // 5 秒超时
});
```

#### css (可选)
外部 CSS 字符串。

```typescript
const layouts = parser.parse(html, {
  viewportWidth: 800,
  css: '.title { color: red; font-size: 24px; }'
});
```

#### isDebug (可选)
启用调试模式，输出详细日志。

```typescript
const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: true
});

// 控制台会输出详细的解析过程信息
```

## 使用模式

### 基本使用

```typescript
const parser = new HtmlLayoutParser();

try {
  await parser.init();
  
  const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
  const fontId = parser.loadFont(new Uint8Array(fontData), 'Arial');
  parser.setDefaultFont(fontId);
  
  const layouts = parser.parse('<div>Hello World</div>', {
    viewportWidth: 800
  });
  
  console.log(`解析得到 ${layouts.length} 个字符`);
} finally {
  parser.destroy();
}
```

### 批量处理

```typescript
const parser = new HtmlLayoutParser();

try {
  await parser.init();
  
  // 加载字体一次
  const fontId = parser.loadFont(fontData, 'Arial');
  parser.setDefaultFont(fontId);
  
  // 处理多个文档
  const documents = ['<div>Doc 1</div>', '<div>Doc 2</div>', '<div>Doc 3</div>'];
  const results = documents.map(html => 
    parser.parse(html, { viewportWidth: 800 })
  );
  
  console.log(`处理了 ${results.length} 个文档`);
} finally {
  parser.destroy();
}
```

### 错误处理

```typescript
const parser = new HtmlLayoutParser();

try {
  await parser.init();
  
  const result = parser.parseWithDiagnostics(html, {
    viewportWidth: 800,
    enableMetrics: true
  });
  
  if (result.success) {
    // 处理成功结果
    processLayouts(result.data);
    
    // 检查性能
    if (result.metrics && result.metrics.parseTime > 100) {
      console.warn('解析时间较长:', result.metrics.parseTime);
    }
  } else {
    // 处理错误
    result.errors?.forEach(error => {
      console.error(`错误 [${error.code}]: ${error.message}`);
    });
  }
} catch (error) {
  console.error('解析异常:', error);
} finally {
  parser.destroy();
}
```

### 内存监控

```typescript
const parser = new HtmlLayoutParser();

try {
  await parser.init();
  
  // 定期检查内存使用
  const memoryCheck = setInterval(() => {
    if (parser.checkMemoryThreshold()) {
      console.warn('内存使用过高');
      parser.clearCache();
    }
    
    const metrics = parser.getMemoryMetrics();
    if (metrics) {
      console.log(`内存: ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
    }
  }, 10000);
  
  // 执行解析任务...
  
  clearInterval(memoryCheck);
} finally {
  parser.destroy();
}
```