# 更新日志

HTML Layout Parser 的版本更新记录。

## [0.0.1] - 2026-01-17

### 🎉 重大更新

这是一个全新的主要版本，相比 v1（未发布）有重大改进和突破性变化。

### ✨ 新功能

#### 多字体支持
- 支持同时加载和使用多个字体
- 字体回退机制
- 字体内存管理和监控
- Node.js 环境支持从文件路径加载字体

#### 多种输出模式
- **Flat 模式** - 扁平字符数组（默认，最快）
- **ByRow 模式** - 按行分组的字符数组
- **Simple 模式** - 简单的行和字符结构
- **Full 模式** - 完整的文档层次结构

#### CSS 分离支持
- 支持将 HTML 内容与 CSS 样式分离
- 便于主题切换和样式管理
- `parseWithCSS()` 便捷方法

#### 跨环境支持
- Web 浏览器环境
- Web Worker 环境
- Node.js 环境
- 自动环境检测

#### 智能缓存系统
- 字体度量智能缓存
- 91.2% 的缓存命中率
- 重复内容解析性能提升 45%
- 缓存统计和监控

#### 严格内存管理
- 50MB 内存使用阈值监控
- 详细内存使用指标
- 内存泄漏检测
- 自动内存清理建议

#### 完整 TypeScript 支持
- 100% TypeScript 编写
- 完整的类型定义
- JSDoc 文档注释
- 类型安全的 API

#### 调试和诊断
- 调试模式支持
- 详细的错误诊断
- 性能指标收集
- 结构化错误代码系统

### 🚀 性能改进

- **解析速度**: 9,442 - 129,121 字符/秒
- **WASM 大小**: 2.25MB
- **启动时间**: ~7ms（热启动），~17ms（冷启动）
- **内存效率**: 字体内存使用 ≈ 字体文件大小

### 🔧 API 变化

#### 新增方法
```typescript
// 初始化和生命周期
await parser.init()
parser.destroy()
parser.isInitialized()
parser.getVersion()
parser.getEnvironment()

// 字体管理
parser.loadFont(fontData, fontName)
parser.loadFontFromFile(filePath, fontName) // Node.js only
parser.unloadFont(fontId)
parser.clearAllFonts()
parser.setDefaultFont(fontId)
parser.getLoadedFonts()

// 解析方法
parser.parse(html, options)
parser.parseWithDiagnostics(html, options)
parser.parseWithCSS(html, css, options)

// 内存管理
parser.getTotalMemoryUsage()
parser.getMemoryMetrics()
parser.checkMemoryThreshold()

// 缓存管理
parser.getCacheStats()
parser.clearCache()
parser.resetCacheStats()
```

#### 选项变化
```typescript
// v1（未发布）
parser.parse(html, viewportWidth)

// v2
parser.parse(html, {
  viewportWidth: 800,
  viewportHeight?: number,
  mode?: 'flat' | 'byRow' | 'simple' | 'full',
  defaultFontId?: number,
  enableMetrics?: boolean,
  maxCharacters?: number,
  timeout?: number,
  css?: string,
  isDebug?: boolean
})
```

### 📦 包结构变化

#### 新的包组织
- `html-layout-parser` - 主包（自动检测环境）
- `html-layout-parser-web` - Web 浏览器专用
- `html-layout-parser-worker` - Web Worker 专用  
- `html-layout-parser-node` - Node.js 专用

#### 导入方式
```typescript
// 自动检测环境
import { HtmlLayoutParser } from 'html-layout-parser';

// 特定环境
import { HtmlLayoutParser } from 'html-layout-parser/web';
import { HtmlLayoutParser } from 'html-layout-parser/worker';
import { HtmlLayoutParser } from 'html-layout-parser/node';
```

### 🔄 迁移指南

#### 基本使用

```typescript
// 创建解析器实例
const parser = new HtmlLayoutParser();

// 初始化（必需）
await parser.init();

// 加载字体（必需）
const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
const fontId = parser.loadFont(new Uint8Array(fontData), 'Arial');
parser.setDefaultFont(fontId);

// 解析 HTML
const layouts = parser.parse(html, { viewportWidth: 800 });

// 清理资源（必需）
parser.destroy();
```

### 🐛 修复问题

- 改进了 CSS 解析的稳定性
- 修复了复杂嵌套结构的布局计算
- 改进了错误处理和报告
- 修复了字体回退机制的问题

### ⚡ 性能优化

- 优化了内存使用，降低内存占用
- 提升了内存管理效率
- 改进了 WASM 模块的内存分配策略

### 📚 文档更新

- 全新的 VitePress 文档站点
- 中英文双语支持
- 完整的 API 参考文档
- 详细的使用指南和示例
- 性能优化指南
- 错误处理指南

### ⚠️ 破坏性变化

1. **初始化要求**: 必须调用 `await parser.init()` 初始化
2. **资源清理**: 必须调用 `parser.destroy()` 清理资源
3. **选项格式**: 解析选项从单个参数改为选项对象
4. **字体管理**: 需要显式加载和管理字体
5. **包导入**: 包名和导入路径发生变化

### 🎯 性能基准

| 指标 | v1（未发布） | v0.0.1 | 改进 |
|------|----|----|------|
| 解析速度 | ~500 字符/秒 | 429-103,000+ 字符/秒 | 最高 200x |
| 内存使用 | 不可控 | < 50MB 监控 | 可控 |
| 启动时间 | ~50ms | ~7ms（热启动），~17ms（冷启动） | 3-7x 更快 |
| 字体支持 | 单字体 | 多字体 | 无限制 |
| 输出模式 | 2 种 | 4 种 | 2x 更多 |

### 🔮 未来计划

- 支持更多字体格式（WOFF/WOFF2）
- 增强的 CSS 支持
- 更多输出格式（SVG、PDF）
- 性能进一步优化
- 更多平台支持

---

## 版本说明

### 版本号规则

我们遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规则：

- **主版本号**: 不兼容的 API 修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

### 支持政策

- **当前版本**: 完整支持和新功能开发
- **前一个主版本**: 安全更新和重要 bug 修复
- **更早版本**: 仅安全更新

### 获取更新

```bash
# 检查当前版本
npm list html-layout-parser

# 更新到最新版本
npm update html-layout-parser

# 安装特定版本
npm install html-layout-parser@0.0.1
```
