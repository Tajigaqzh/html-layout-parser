# API 参考

HTML Layout Parser 提供了完整的 TypeScript API，支持多种环境和使用场景。

## 核心类

### HtmlLayoutParser

主要的解析器类，提供所有核心功能。

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

const parser = new HtmlLayoutParser();
```

## 快速导航

- [HtmlLayoutParser 类](./parser.md) - 主要解析器 API
- [类型与接口](./types.md) - 所有类型定义
- [错误代码](./error-codes.md) - 错误代码参考

## 基本使用流程

```typescript
// 1. 创建解析器实例
const parser = new HtmlLayoutParser();

// 2. 初始化 WASM 模块
await parser.init();

// 3. 加载字体
const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
const fontId = parser.loadFont(new Uint8Array(fontData), 'Arial');
parser.setDefaultFont(fontId);

// 4. 解析 HTML
const layouts = parser.parse('<div>Hello World</div>', {
  viewportWidth: 800
});

// 5. 使用结果
console.log(`解析得到 ${layouts.length} 个字符`);

// 6. 清理资源
parser.destroy();
```

## 环境特定导入

```typescript
// 自动检测环境
import { HtmlLayoutParser } from 'html-layout-parser';

// Web 浏览器
import { HtmlLayoutParser } from 'html-layout-parser/web';

// Web Worker
import { HtmlLayoutParser } from 'html-layout-parser/worker';

// Node.js
import { HtmlLayoutParser } from 'html-layout-parser/node';
```

## 主要功能分类

### 初始化和生命周期
- `init()` - 初始化 WASM 模块
- `isInitialized()` - 检查初始化状态
- `destroy()` - 销毁解析器并释放资源
- `getVersion()` - 获取版本信息
- `getEnvironment()` - 获取运行环境

### 字体管理
- `loadFont()` - 加载字体
- `loadFontFromFile()` - 从文件加载字体 (Node.js)
- `unloadFont()` - 卸载字体
- `clearAllFonts()` - 清除所有字体
- `setDefaultFont()` - 设置默认字体
- `getLoadedFonts()` - 获取已加载字体列表

### HTML 解析
- `parse()` - 基本解析方法
- `parseWithDiagnostics()` - 带诊断信息的解析
- `parseWithCSS()` - 分离 CSS 的解析

### 内存管理
- `getTotalMemoryUsage()` - 获取总内存使用量
- `getMemoryMetrics()` - 获取详细内存指标
- `checkMemoryThreshold()` - 检查内存阈值

### 缓存管理
- `getCacheStats()` - 获取缓存统计
- `clearCache()` - 清除缓存
- `resetCacheStats()` - 重置缓存统计

## 类型系统

HTML Layout Parser 使用完整的 TypeScript 类型系统：

```typescript
// 输入类型
interface ParseOptions {
  viewportWidth: number;
  viewportHeight?: number;
  mode?: OutputMode;
  defaultFontId?: number;
  enableMetrics?: boolean;
  maxCharacters?: number;
  timeout?: number;
  css?: string;
  isDebug?: boolean;
}

// 输出类型
type OutputMode = 'flat' | 'byRow' | 'simple' | 'full';

// 结果类型
interface CharLayout {
  character: string;
  x: number;
  y: number;
  width: number;
  height: number;
  // ... 更多属性
}
```

## 错误处理

```typescript
// 使用诊断模式
const result = parser.parseWithDiagnostics(html, { viewportWidth: 800 });

if (result.success) {
  console.log('解析成功:', result.data);
} else {
  console.error('解析失败:', result.errors);
}

// 异常处理
try {
  const layouts = parser.parse(html, { viewportWidth: 800 });
} catch (error) {
  console.error('解析异常:', error);
}
```

## 性能优化

```typescript
// 启用性能指标
const result = parser.parseWithDiagnostics(html, {
  viewportWidth: 800,
  enableMetrics: true
});

if (result.metrics) {
  console.log('解析时间:', result.metrics.parseTime);
  console.log('解析速度:', result.metrics.charsPerSecond);
}

// 缓存统计
const cacheStats = parser.getCacheStats();
console.log('缓存命中率:', cacheStats.hitRate);
```

## 平台特定功能

### Node.js 特有功能

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/node';

const parser = new HtmlLayoutParser();
await parser.init();

// 从文件路径加载字体
const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
```

### Web Worker 支持

```typescript
// 在 Worker 中使用
import { HtmlLayoutParser } from 'html-layout-parser/worker';

const parser = new HtmlLayoutParser();
await parser.init();

// 正常使用所有 API
const layouts = parser.parse(html, { viewportWidth: 800 });
```

## 最佳实践

### 1. 资源管理

```typescript
// ✅ 正确：使用 try-finally 确保清理
const parser = new HtmlLayoutParser();
try {
  await parser.init();
  // 使用解析器...
} finally {
  parser.destroy();
}
```

### 2. 字体重用

```typescript
// ✅ 正确：加载一次，多次使用
const fontId = parser.loadFont(fontData, 'Arial');
parser.setDefaultFont(fontId);

for (const html of documents) {
  const layouts = parser.parse(html, { viewportWidth: 800 });
}
```

### 3. 错误处理

```typescript
// ✅ 正确：使用诊断模式获取详细错误信息
const result = parser.parseWithDiagnostics(html, options);
if (!result.success) {
  for (const error of result.errors || []) {
    console.error(`错误 [${error.code}]: ${error.message}`);
  }
}
```

## 版本兼容性

当前版本：**0.2.0**

### 与 v1 的主要差异

| 功能 | v1 | v2 |
|------|----|----|
| 字体支持 | 单字体 | 多字体 + 回退 |
| 输出模式 | 2 种 | 4 种 |
| CSS 分离 | ❌ | ✅ |
| 内存管理 | 基础 | 严格监控 |
| TypeScript | 部分 | 完整 |
| 跨环境 | 有限 | 完整支持 |

### 迁移指南

从 v1 迁移到 v2：

```typescript
// v1 代码
const parser = new HtmlLayoutParser();
const layouts = parser.parse(html, 800);

// v2 代码
const parser = new HtmlLayoutParser();
await parser.init(); // 新增：需要初始化
const layouts = parser.parse(html, { viewportWidth: 800 }); // 新增：选项对象
parser.destroy(); // 新增：需要清理
```

## 相关链接

- [快速开始指南](../guide/getting-started.md)
- [字体管理指南](../guide/font-management.md)
- [内存管理指南](../guide/memory-management.md)
- [性能优化指南](../guide/performance.md)
- [错误处理指南](../guide/error-handling.md)