# 什么是 HTML Layout Parser?

HTML Layout Parser 是一个高性能的 HTML/CSS 布局解析器，编译为 WebAssembly，专为 Canvas 文本渲染设计。

## 布局精度

解析器提供**高保真的布局计算**，与原生 HTML 渲染高度一致。基于 [litehtml](https://github.com/litehtml/litehtml) 这一成熟的 HTML/CSS 渲染引擎，准确处理：

- ✅ 文本换行和断行
- ✅ 字体度量和字符间距
- ✅ CSS 盒模型（边距、内边距、边框）
- ✅ 内联和块级元素定位
- ✅ 多行文本对齐
- ✅ 表格和浮动元素
- ✅ 绝对和相对定位

### 跨平台一致性

**相比浏览器 Range API、Canvas `measureText()` 和 SVG foreignObject 的关键优势**：解析器在**所有平台和浏览器上提供 100% 一致的结果**。

与基于浏览器的方法不同，后者在以下环境中会有差异：
- Chrome vs Safari vs Firefox
- Windows vs macOS vs Linux
- 不同浏览器版本
- 不同 WebView 实现

基于 WASM 的解析器在任何地方都产生**完全相同的字符位置**：

```typescript
// ❌ 浏览器 Range API - 结果不一致
const range = document.createRange();
range.selectNode(textNode);
const rect = range.getBoundingClientRect();
// Chrome 和 Safari 上结果不同！

// ❌ Canvas measureText - 无 DOM 排版，度量随平台变化
const width = ctx.measureText(text).width;

// ❌ SVG foreignObject - 小字体模糊，Android 上黑色背景
const svg = `<svg><foreignObject>${html}</foreignObject></svg>`;
// 缩放时模糊，移动端有瑕疵！

// ✅ HTML Layout Parser - 任何地方都一致
const layouts = parser.parse(html, { viewportWidth: 800 });
// 所有平台上结果相同！
```

这使其非常适合：
- **服务端渲染** - 在 Node.js 中生成与客户端匹配的布局
- **跨平台应用** - 桌面和移动端渲染一致
- **自动化测试** - 可预测的测试结果
- **Canvas 渲染** - 无需平台特定的调整
- **Web Workers** - 完全支持后台处理（不像 SVG foreignObject）
- **可缩放界面** - 缩放时文本质量更好（不像 SVG foreignObject）

::: tip 布局保真度
解析器在**文本为主的布局**中表现出色，精度至关重要。对于包含以下特性的复杂布局：
- 高级 CSS 特性（flexbox、grid、transforms）
- 亚像素渲染精度
- 平台特定的字体渲染

可能会出现细微的视觉差异。但对于主要用例**在 Canvas 上渲染文本**，布局高度准确且可用于生产环境。
:::

## 核心功能

### 🚀 WebAssembly 驱动
基于 litehtml C++ 库构建，通过 Emscripten 编译为 WebAssembly，提供接近原生的性能。

### 🔤 多字体管理
- 加载多个 TTF/OTF/WOFF 字体
- 自动字体回退链
- 内存高效的字体存储
- 字体指标缓存

### 📦 灵活的输出模式
- **flat**: 扁平字符数组，适合简单渲染
- **byRow**: 按行分组，适合逐行处理
- **simple**: 简化结构，包含基本文档信息
- **full**: 完整层级结构，包含页面、块、行、运行

### 🎨 丰富的文本属性
- 字体样式：family、size、weight、style
- 颜色：文本色、背景色、透明度
- 装饰：下划线、删除线、上划线
- 阴影：多重文本阴影
- 变换：缩放、倾斜、旋转

### 🌐 跨环境支持
- Web 浏览器
- Web Worker（支持 OffscreenCanvas）
- Node.js

## 工作原理

```
HTML + CSS → litehtml 解析 → 布局计算 → 字符布局数据 → Canvas 渲染
```

1. **输入**: HTML 字符串和可选的 CSS
2. **解析**: litehtml 解析 HTML 和 CSS
3. **布局**: 计算每个字符的精确位置
4. **输出**: 返回字符布局数组，包含位置、样式等信息
5. **渲染**: 使用布局数据在 Canvas 上绘制

## 使用场景

- **富文本编辑器**: 在 Canvas 上渲染格式化文本
- **游戏 UI**: 渲染游戏中的文本内容
- **图表标签**: 精确定位图表中的文本
- **PDF 生成**: 计算文本布局用于 PDF 生成
- **服务端渲染**: Node.js 中预计算文本布局

## 性能特点

| 指标 | 数值 |
|------|------|
| 解析速度 | 9,442 - 129,121 字符/秒 |
| 内存占用 | 每字体约等于字体文件大小 |
| WASM 大小 | 2.25MB |
| 启动时间 | ~7ms（热启动），~17ms（冷启动） |
| 缓存命中率 | 91.2% |

## 下一步

- [快速开始](/zh/guide/getting-started) - 5 分钟上手
- [安装](/zh/guide/installation) - 安装和配置
- [对比 Range API](/zh/guide/vs-range-api) - 为什么 Range API 不一致
- [对比 Canvas measureText](/zh/guide/vs-measure-text) - 为什么 measureText 容易偏离 DOM
- [对比 SVG foreignObject](/zh/guide/vs-svg-foreignobject) - 为什么缩放会模糊
- [CSS 支持](/zh/guide/css-support) - 了解支持哪些 CSS 属性
- [字体管理](/zh/guide/font-management) - 多字体支持
