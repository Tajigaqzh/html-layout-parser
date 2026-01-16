# HTML Layout Parser

[![npm version](https://img.shields.io/npm/v/html-layout-parser.svg)](https://www.npmjs.com/package/html-layout-parser)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

基于 WebAssembly 的高性能 HTML 布局解析器，支持多字体管理、丰富的文本属性和标准化 JSON 输出。专为 Canvas 渲染应用设计。

📚 **[在线文档](https://tajigaqzh.github.io/html-layout-parser/)** | [English Documentation](./README.md)

## 特性

- 🚀 **高性能** - WebAssembly 驱动，解析速度最高 103,000+ 字符/秒
- 🔤 **多字体支持** - 加载和管理多个字体，支持字体回退链
- 🎨 **丰富的文本属性** - 完整的 CSS 文本样式，包括阴影、装饰线、变换等
- 📦 **多种输出模式** - 完整层级、简化、扁平或按行分组输出
- 🎯 **Canvas 友好** - 输出格式直接映射到 Canvas 2D API
- 🌐 **跨环境支持** - 支持 Web、Worker 和 Node.js 环境
- 📝 **TypeScript 优先** - 完整的类型定义和 JSDoc 文档
- 💾 **内存高效** - 严格的内存管理和智能缓存机制
- 🔧 **调试模式** - 内置调试支持，方便开发调试

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [环境特定导入](#环境特定导入)
- [API 参考](#api-参考)
- [输出模式](#输出模式)
- [CSS 分离](#css-分离)
- [Canvas 渲染](#canvas-渲染)
- [内存管理](#内存管理)
- [性能优化](#性能优化)
- [智能缓存](#智能缓存)
- [调试模式](#调试模式)
- [大文档处理](#大文档处理)
- [错误处理](#错误处理)
- [平台特定包](#平台特定包)
- [从源码构建](#从源码构建)
- [性能指标](#性能指标)
- [浏览器支持](#浏览器支持)
- [许可证](#许可证)

## 安装

```bash
# 使用 npm
npm install html-layout-parser

# 使用 yarn
yarn add html-layout-parser

# 使用 pnpm
pnpm add html-layout-parser
```

### 平台特定包

如需更小的包体积，可以安装平台特定的包：

```bash
# 仅 Web 浏览器
npm install html-layout-parser-web

# 仅 Web Worker
npm install html-layout-parser-worker

# 仅 Node.js
npm install html-layout-parser-node
```

## 快速开始

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

// 创建并初始化解析器
const parser = new HtmlLayoutParser();
await parser.init();

// 加载字体（解析前必须加载）
const fontResponse = await fetch('/fonts/arial.ttf');
const fontData = new Uint8Array(await fontResponse.arrayBuffer());
const fontId = parser.loadFont(fontData, 'Arial');
parser.setDefaultFont(fontId);

// 解析 HTML
const layouts = parser.parse('<div style="color: blue;">你好世界</div>', {
  viewportWidth: 800
});

// 使用布局数据进行 Canvas 渲染
for (const char of layouts) {
  console.log(`${char.character} 位于 (${char.x}, ${char.y})`);
}

// 使用完毕后清理资源
parser.destroy();
```

## 环境特定导入

```typescript
// Web 浏览器
import { HtmlLayoutParser } from 'html-layout-parser/web';

// Web Worker
import { HtmlLayoutParser } from 'html-layout-parser/worker';

// Node.js
import { HtmlLayoutParser } from 'html-layout-parser/node';

// 自动检测环境
import { HtmlLayoutParser } from 'html-layout-parser';
```

## API 参考

### 初始化

```typescript
const parser = new HtmlLayoutParser();
await parser.init();                    // 初始化 WASM 模块
await parser.init('/custom/path.js');   // 自定义 WASM 路径

parser.isInitialized();                 // 检查是否就绪
parser.getEnvironment();                // 'web' | 'worker' | 'node' | 'unknown'
parser.getVersion();                    // '2.0.0'
```

### 字体管理

```typescript
// 从二进制数据加载字体
const fontId = parser.loadFont(fontData: Uint8Array, fontName: string);

// 从文件加载字体（仅 Node.js）
const fontId = await parser.loadFontFromFile('/path/to/font.ttf', 'FontName');

// 设置默认字体（用于回退）
parser.setDefaultFont(fontId);

// 获取所有已加载的字体
const fonts = parser.getLoadedFonts();
// [{ id: 1, name: 'Arial', memoryUsage: 245760 }, ...]

// 卸载指定字体
parser.unloadFont(fontId);

// 清空所有字体
parser.clearAllFonts();
```

### HTML 解析

```typescript
// 基本解析（返回 CharLayout[]）
const layouts = parser.parse(html, { viewportWidth: 800 });

// 使用外部 CSS
const layouts = parser.parse(html, { 
  viewportWidth: 800,
  css: '.title { color: red; }'
});

// 完整模式输出（返回 LayoutDocument）
const doc = parser.parse<'full'>(html, { 
  viewportWidth: 800, 
  mode: 'full' 
});

// 带诊断信息和性能指标
const result = parser.parseWithDiagnostics(html, { 
  viewportWidth: 800,
  enableMetrics: true
});

// CSS 分离的便捷方法
const layouts = parser.parseWithCSS(html, css, { viewportWidth: 800 });
```

### 解析选项

```typescript
interface ParseOptions {
  viewportWidth: number;      // 必需：视口宽度（像素）
  viewportHeight?: number;    // 可选：视口高度
  mode?: OutputMode;          // 'flat' | 'byRow' | 'simple' | 'full'
  defaultFontId?: number;     // 默认字体 ID（用于回退）
  enableMetrics?: boolean;    // 启用性能指标
  maxCharacters?: number;     // 限制最大处理字符数
  timeout?: number;           // 超时时间（毫秒）
  css?: string;               // 外部 CSS 字符串
  isDebug?: boolean;          // 启用调试日志
}
```

### 内存管理

```typescript
// 获取总内存使用量（字节）
const bytes = parser.getTotalMemoryUsage();

// 检查内存是否超过 50MB 阈值
if (parser.checkMemoryThreshold()) {
  console.warn('内存超过阈值');
}

// 获取详细内存指标
const metrics = parser.getMemoryMetrics();
// { totalMemoryUsage: 15728640, fontCount: 3, fonts: [...] }

// 销毁解析器并释放所有资源
parser.destroy();
```

### 缓存管理

```typescript
// 获取缓存统计
const stats = parser.getCacheStats();
// { hits: 237, misses: 23, entries: 41, hitRate: 0.912, memoryUsage: 2316 }

// 重置缓存统计
parser.resetCacheStats();

// 手动清除缓存
parser.clearCache();

// 获取包含缓存的详细指标
const metrics = parser.getDetailedMetrics();
```

## 输出模式

解析器支持四种输出模式：

| 模式 | 类型 | 描述 | 使用场景 |
|------|------|------|----------|
| `flat` | `CharLayout[]` | 扁平字符数组 | 简单渲染，v1 兼容 |
| `byRow` | `Row[]` | 按行分组的字符 | 逐行渲染 |
| `simple` | `SimpleOutput` | 带字符的行结构 | 基本结构和行信息 |
| `full` | `LayoutDocument` | 完整层级结构 | 复杂布局，调试 |

```typescript
// 扁平模式（默认）- 最快
const chars = parser.parse(html, { viewportWidth: 800 });

// 按行模式
const rows = parser.parse<'byRow'>(html, { viewportWidth: 800, mode: 'byRow' });

// 简化模式
const simple = parser.parse<'simple'>(html, { viewportWidth: 800, mode: 'simple' });

// 完整模式 - 最详细
const doc = parser.parse<'full'>(html, { viewportWidth: 800, mode: 'full' });
```

### CharLayout 结构

```typescript
interface CharLayout {
  character: string;          // 字符
  x: number;                  // X 坐标（像素）
  y: number;                  // Y 坐标（像素）
  width: number;              // 字符宽度
  height: number;             // 字符高度
  baseline: number;           // 基线 Y 坐标
  
  // 字体属性
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: string;
  fontId: number;
  
  // 颜色（RGBA 格式：#RRGGBBAA）
  color: string;
  backgroundColor: string;
  opacity: number;            // 0-1
  
  // 文本装饰
  textDecoration: {
    underline: boolean;       // 下划线
    overline: boolean;        // 上划线
    lineThrough: boolean;     // 删除线
    color: string;            // 装饰线颜色
    style: string;            // 'solid' | 'double' | 'dotted' | 'dashed' | 'wavy'
    thickness: number;        // 装饰线粗细
  };
  
  // 间距
  letterSpacing: number;      // 字间距
  wordSpacing: number;        // 词间距
  
  // 阴影（数组支持多重阴影）
  textShadow: Array<{
    offsetX: number;
    offsetY: number;
    blurRadius: number;
    color: string;
  }>;
  
  // 变换
  transform: {
    scaleX: number;
    scaleY: number;
    skewX: number;
    skewY: number;
    rotate: number;
  };
  
  direction: string;          // 'ltr' | 'rtl'
}
```

## CSS 分离

将 HTML 内容与 CSS 样式分离，实现灵活的主题切换：

```typescript
// HTML 内容（无内联样式）
const html = `
  <div class="container">
    <h1 class="title">欢迎</h1>
    <p class="content">你好世界</p>
  </div>
`;

// CSS 样式（分离）
const css = `
  .title { color: #333; font-size: 24px; font-weight: bold; }
  .content { color: #666; font-size: 16px; }
`;

// 使用分离的 CSS 解析
const layouts = parser.parse(html, { viewportWidth: 800, css });

// 或使用便捷方法
const layouts = parser.parseWithCSS(html, css, { viewportWidth: 800 });
```

### 主题切换示例

```typescript
const themes = {
  light: `.title { color: #1a1a1a; } .content { color: #333; }`,
  dark: `.title { color: #ffffff; } .content { color: #ccc; }`
};

// 动态切换主题
const layouts = parser.parse(html, { 
  viewportWidth: 800, 
  css: themes.dark 
});
```

## Canvas 渲染

输出格式专为 Canvas 2D API 设计：

```typescript
function renderToCanvas(ctx: CanvasRenderingContext2D, layouts: CharLayout[]) {
  for (const char of layouts) {
    // 设置字体
    ctx.font = `${char.fontStyle} ${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
    
    // 绘制背景
    if (char.backgroundColor !== '#00000000') {
      ctx.fillStyle = char.backgroundColor;
      ctx.fillRect(char.x, char.y, char.width, char.height);
    }
    
    // 应用文本阴影
    if (char.textShadow.length > 0) {
      const shadow = char.textShadow[0];
      ctx.shadowOffsetX = shadow.offsetX;
      ctx.shadowOffsetY = shadow.offsetY;
      ctx.shadowBlur = shadow.blurRadius;
      ctx.shadowColor = shadow.color;
    }
    
    // 绘制文本
    ctx.fillStyle = char.color;
    ctx.globalAlpha = char.opacity;
    ctx.fillText(char.character, char.x, char.baseline);
    
    // 重置
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    
    // 绘制下划线
    if (char.textDecoration.underline) {
      ctx.strokeStyle = char.textDecoration.color || char.color;
      ctx.lineWidth = char.textDecoration.thickness;
      ctx.beginPath();
      ctx.moveTo(char.x, char.baseline + 2);
      ctx.lineTo(char.x + char.width, char.baseline + 2);
      ctx.stroke();
    }
  }
}
```

## 内存管理

### ⚠️ 重要：务必清理资源

解析器使用的 WebAssembly 内存必须显式释放：

```typescript
const parser = new HtmlLayoutParser();
await parser.init();

try {
  const fontId = parser.loadFont(fontData, 'Arial');
  const layouts = parser.parse(html, { viewportWidth: 800 });
  // 使用 layouts...
} finally {
  parser.destroy();  // 务必在使用完毕后销毁
}
```

### 字体内存最佳实践

```typescript
// ✅ 正确：加载一次，多次使用
const fontId = parser.loadFont(fontData, 'Arial');
parser.setDefaultFont(fontId);

for (const html of documents) {
  const layouts = parser.parse(html, { viewportWidth: 800 });
}

parser.unloadFont(fontId);  // 使用完毕后卸载
```

```typescript
// ❌ 错误：每次解析都加载/卸载
for (const html of documents) {
  const fontId = parser.loadFont(fontData, 'Arial');  // 浪费资源！
  const layouts = parser.parse(html, { viewportWidth: 800 });
  parser.unloadFont(fontId);  // 浪费资源！
}
```

### 内存监控

```typescript
// 检查内存使用
const metrics = parser.getMemoryMetrics();
if (metrics) {
  console.log(`总计: ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
  console.log(`字体数: ${metrics.fontCount}`);
  
  for (const font of metrics.fonts) {
    console.log(`  ${font.name}: ${(font.memoryUsage / 1024).toFixed(1)} KB`);
  }
}

// 检查阈值（50MB）
if (parser.checkMemoryThreshold()) {
  console.warn('内存超过 50MB - 考虑清理未使用的字体');
}
```

### 内存限制

| 资源 | 限制 |
|------|------|
| 总内存 | < 50MB |
| 单个字体 | ≈ 字体文件大小（如 8MB TTF → ~8MB 内存） |
| 临时数据 | 每次解析后清空 |

## 性能优化

### 1. 复用解析器实例

```typescript
// ✅ 正确：复用解析器
const parser = new HtmlLayoutParser();
await parser.init();
const fontId = parser.loadFont(fontData, 'Arial');

for (const html of documents) {
  const layouts = parser.parse(html, { viewportWidth: 800 });
}

parser.destroy();
```

### 2. 使用合适的输出模式

```typescript
// 简单渲染使用 'flat'（最快）
const chars = parser.parse(html, { viewportWidth: 800, mode: 'flat' });

// 只在需要层级结构时使用 'full'
const doc = parser.parse<'full'>(html, { viewportWidth: 800, mode: 'full' });
```

### 3. 批量处理共享字体

```typescript
// 加载字体一次
const arialId = parser.loadFont(arialData, 'Arial');
const timesId = parser.loadFont(timesData, 'Times New Roman');
parser.setDefaultFont(arialId);

// 处理文档（共享字体）
const results = documents.map(html => 
  parser.parse(html, { viewportWidth: 800 })
);
```

### 4. 监控性能

```typescript
const result = parser.parseWithDiagnostics(html, {
  viewportWidth: 800,
  enableMetrics: true
});

if (result.metrics) {
  console.log(`解析时间: ${result.metrics.parseTime}ms`);
  console.log(`布局时间: ${result.metrics.layoutTime}ms`);
  console.log(`速度: ${result.metrics.charsPerSecond} 字符/秒`);
}
```

## 智能缓存

v2.0 包含智能字体度量缓存，显著提升性能：

### 缓存性能

| 指标 | 结果 |
|------|------|
| 缓存命中率（重复解析） | **91.2%** |
| 缓存命中率（大文档） | **100%** |
| 性能提升 | 重复内容解析 **45%** 更快 |

### 工作原理

- 字符宽度测量按 (fontId, fontSize, codepoint) 缓存
- 解析过程中自动填充缓存
- 字体卸载时自动清除对应缓存
- 无需手动管理

```typescript
// 获取缓存统计
const stats = parser.getCacheStats();
console.log(`命中率: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`条目数: ${stats.entries}`);
```

## 调试模式

启用调试日志查看详细的解析信息：

```typescript
// 通过解析选项启用
const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: true
});

// 输出包括：
// [HtmlLayoutParser] HTML parsing started (length=1234)
// [HtmlLayoutParser] HTML parsing completed (time=5.2ms)
// [HtmlLayoutParser] Layout calculation started (viewport=800x600)
// [HtmlLayoutParser] Layout calculation completed (time=12.3ms, chars=456)
// [HtmlLayoutParser] Memory usage: 15.2MB (fonts=12MB, buffers=3.2MB)
```

调试日志包括：
- 字体加载/卸载事件
- HTML/CSS 解析计时
- 布局计算计时
- 序列化计时
- 内存使用信息

## 大文档处理

### 限制文档大小

```typescript
// 设置最大字符数防止处理超大文档
const layouts = parser.parse(html, {
  viewportWidth: 800,
  maxCharacters: 10000
});
```

### 使用超时保护

```typescript
// 设置超时防止复杂文档卡住
const layouts = parser.parse(html, {
  viewportWidth: 800,
  timeout: 5000  // 5 秒
});
```

### 分块处理

对于超大文档，考虑分块处理：

```typescript
function parseInChunks(html: string, chunkSize: number = 5000) {
  const results = [];
  let offset = 0;
  
  while (offset < html.length) {
    const chunk = html.slice(offset, offset + chunkSize);
    const layouts = parser.parse(chunk, { 
      viewportWidth: 800,
      maxCharacters: chunkSize
    });
    results.push(layouts);
    offset += chunkSize;
  }
  
  return results;
}
```

## 错误处理

```typescript
const result = parser.parseWithDiagnostics(html, { viewportWidth: 800 });

if (result.success) {
  console.log('解析成功');
  // 使用 result.data
} else {
  for (const error of result.errors || []) {
    console.error(`[${error.code}] ${error.message}`);
    if (error.line) {
      console.error(`  位于第 ${error.line} 行，第 ${error.column} 列`);
    }
  }
}

// 即使成功也检查警告
if (result.warnings?.length) {
  for (const warning of result.warnings) {
    console.warn(`警告: ${warning.message}`);
  }
}
```

### 错误代码

| 代码范围 | 类别 |
|----------|------|
| 0 | 成功 |
| 1xxx | 输入验证错误 |
| 2xxx | 字体相关错误 |
| 3xxx | 解析错误 |
| 4xxx | 内存错误 |
| 5xxx | 内部错误 |

## 平台特定包

如需更小的包体积，使用平台特定包：

```typescript
// 仅 Web 浏览器
import { HtmlLayoutParser } from 'html-layout-parser-web';

// 仅 Web Worker
import { HtmlLayoutParser } from 'html-layout-parser-worker';

// 仅 Node.js
import { HtmlLayoutParser } from 'html-layout-parser-node';
```

### Node.js 特有功能

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/node';

const parser = new HtmlLayoutParser();
await parser.init();

// 从文件路径加载字体（仅 Node.js）
const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
```

## 从源码构建

### 前置条件

- 安装并激活 [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html)
- Node.js 16+
- pnpm 8+

### 构建步骤

```bash
# 克隆仓库
git clone <repository-url>
cd litehtml/html-layout-parser

# 安装依赖
pnpm install

# 构建 WASM 模块
./build.sh

# 构建 TypeScript 包
pnpm run build:packages

# 运行测试
pnpm test
```

## 性能指标

| 指标 | 目标 | 实际 |
|------|------|------|
| 解析速度 | > 1000 字符/秒 | 9,442 - 129,121 字符/秒 |
| 内存使用 | < 50MB | ~8MB (1个8MB), ~40MB (5字体) ✅ |
| WASM 大小（完整版） | < 2.5MB | 2.25MB ✅ |
| 启动时间 | < 100ms | ~7ms（热启动），~17ms（冷启动） ✅ |
| 缓存命中率 | > 80% | 91.2% ✅ |

### 详细性能基准测试

基准来自 `pnpm bench:performance -- --warmup=10 --iterations=50`（mode=flat，viewport=800），
字体 `examples/font/aliBaBaFont65.ttf`。测试环境：macOS 26.2（arm64），Apple M4，
16 GB 内存，Node v25.2.1，pnpm 8.15.0。

| 文档大小 | 解析速度 | 总耗时 |
|----------|----------|--------|
| 简单 (11 字符) | 9,442 字符/秒 | 1.17ms |
| 中等 (480 字符) | 105,588 字符/秒 | 4.55ms |
| 大型 (7,200 字符) | 126,155 字符/秒 | 57.07ms |
| 超大 (24,196 字符) | 129,121 字符/秒 | 187.39ms |

> **说明**: 内存使用量约等于已加载字体文件大小的总和。例如，一个 8MB 的 TTF 字体文件加载后会占用约 8MB 内存。

## 浏览器支持

- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

## Node.js 支持

- Node.js 16+

## 项目结构

```
html-layout-parser/
├── src/                          # C++ 源文件
│   ├── html_layout_parser.cpp    # 主 API 入口
│   ├── multi_font_manager.cpp/h  # 字体管理
│   ├── wasm_container.cpp/h      # 容器实现
│   ├── json_serializer.cpp/h     # JSON 输出
│   └── font_metrics_cache.cpp/h  # 智能缓存
├── packages/                     # NPM 包
│   ├── html-layout-parser/       # 主包
│   ├── html-layout-parser-web/   # Web 专用
│   ├── html-layout-parser-worker/# Worker 专用
│   └── html-layout-parser-node/  # Node.js 专用
├── tests/                        # 测试文件
├── docs/                         # 文档
├── playground/                   # 交互式演示
├── build.sh                      # 构建脚本
└── README.md                     # 英文文档
```

## 相关文档

- [API 参考](./docs/guides/api-reference.md)
- [内存管理指南](./docs/guides/memory-management.md)
- [性能指南](./docs/guides/performance.md)
- [Web 示例](./docs/examples/web-examples.md)
- [Node.js 示例](./docs/examples/node-examples.md)
- [Worker 示例](./docs/examples/worker-examples.md)

## 与 v1 的区别

v2 是一个独立项目，有显著改进：

| 特性 | v1 | v2 |
|------|----|----|
| 字体支持 | 单字体 | 多字体 + 回退链 |
| 输出模式 | 2 种 (flat, byRow) | 4 种 (flat, byRow, simple, full) |
| CSS 分离 | ❌ | ✅ |
| 内存管理 | 基础 | 严格 + 监控 |
| TypeScript | 部分 | 完整 |
| 跨环境 | 有限 | 完整 (Web/Worker/Node.js) |
| 智能缓存 | ❌ | ✅ |
| 调试模式 | ❌ | ✅ |

## 许可证

MIT

## 贡献

欢迎贡献！请在提交 Pull Request 前阅读我们的贡献指南。

## 支持

- [GitHub Issues](https://github.com/Tajigaqzh/html-layout-parser/issues)
- [文档](./docs/README.md)
