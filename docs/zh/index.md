---
layout: home

hero:
  name: HTML Layout Parser
  text: WebAssembly 驱动的 HTML/CSS 布局引擎
  tagline: 提取字符级布局数据，用于 Canvas 文本渲染，支持多字体管理
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/guide/getting-started
    - theme: alt
      text: 在 GitHub 上查看
      link: https://github.com/Tajigaqzh/html-layout-parser

features:
  - icon: 🚀
    title: 高性能
    details: WebAssembly 驱动，解析速度最高 103,000+ 字符/秒，智能字体指标缓存
  - icon: 🔤
    title: 多字体支持
    details: 加载和管理多个字体，自动回退链，内存高效存储
  - icon: 🎨
    title: 丰富的文本属性
    details: 完整的 CSS 文本样式，包括装饰、变换和透明度
  - icon: 📦
    title: 多种输出模式
    details: 根据需求选择 flat、byRow、simple 或 full 层级输出
  - icon: 🎯
    title: Canvas 就绪
    details: 输出格式直接映射到 Canvas 2D API，无缝渲染
  - icon: 🌐
    title: 跨环境
    details: 支持 Web 浏览器、Web Worker 和 Node.js，统一 API
  - icon: 📝
    title: TypeScript 优先
    details: 完整的类型定义和 JSDoc 文档，出色的 IDE 支持
  - icon: 💾
    title: 内存高效
    details: 严格的内存管理，带监控、智能缓存和自动清理
---

## 关于本项目

::: info 设计初衷
本 WASM 方案的设计初衷是为了提供一种区别于 SVG foreignObject 等方案的跨平台能力，特别适用于以下场景：
- 在 Web Worker 中渲染（无法访问 DOM）
- Node.js 服务端渲染
- 需要精确控制文本布局和渲染
- 较大缩放级别下的像素级精确渲染

**对于主线程浏览器环境**，SVG foreignObject 方案仍然是更简单、更便捷的选择，因为它可以直接使用系统字体而无需手动加载。此外，WASM 方案本身会产生额外的内存开销（除字体文件外）。本库并非要取代作为浏览器标准的 SVG 方案，而是为特定场景提供一种补充选择，在这些场景中 WASM 的独特能力能够发挥作用。
:::

## 快速示例

::: tip 直接导入方案（推荐）
现在支持直接从 npm 包导入，无需手动复制文件：

```bash
npm install html-layout-parser
```

**Vite 用户需要配置**：
```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['html-layout-parser']
  }
})
```
:::

::: warning 字体文件路径建议
将字体文件放在 `public` 目录（而非 `src`）中，以防止打包工具重命名文件，导致 WASM 无法加载字体。

**推荐**: `/public/fonts/arial.ttf` → `fetch('/fonts/arial.ttf')`  
**不推荐**: `/src/assets/fonts/arial.ttf` (可能被重命名为 `arial.abc123.ttf`)
:::

```typescript
// 直接从 npm 包导入（web环境）
import { HtmlLayoutParser } from 'html-layout-parser/web';

const parser = new HtmlLayoutParser();
await parser.init(); // 使用全局加载的 WASM

// 从 public 目录加载字体
const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
const fontId = parser.loadFont(new Uint8Array(fontData), 'Arial');
parser.setDefaultFont(fontId);

// 解析带 CSS 的 HTML
const layouts = parser.parse('<div class="title">Hello World</div>', {
  viewportWidth: 800,
  css: '.title { color: blue; font-size: 24px; }'
});

// 渲染到 Canvas
const ctx = canvas.getContext('2d');
for (const char of layouts) {
  ctx.font = `${char.fontSize}px ${char.fontFamily}`;
  ctx.fillStyle = char.color;
  ctx.fillText(char.character, char.x, char.baseline);
}

parser.destroy();
```

## 性能指标

| 指标 | 结果 |
|------|------|
| 解析速度 | 9,442 - 129,121 字符/秒 |
| 内存占用 | 每字体约等于字体文件大小 |
| WASM 大小 | 2.25MB |
| 启动时间 | ~7ms（热启动），~17ms（冷启动） |
| 缓存命中率 | 91.2% |
