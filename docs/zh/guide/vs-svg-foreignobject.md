# HTML Layout Parser vs SVG foreignObject

在 Canvas 上渲染 HTML 的另一种常见方法是使用 SVG `<foreignObject>` 包裹 HTML 内容，然后将 SVG 绘制到 Canvas。这在许多情况下是一个扎实、实用的方案，效果也往往很好。但在特定场景下仍有一些限制，HTML Layout Parser 可以解决这些问题。

## SVG foreignObject 方法

```typescript
// 常见的 SVG foreignObject 模式
function renderHtmlToCanvas(html: string, canvas: HTMLCanvasElement) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
      <foreignObject width="800" height="600">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${html}
        </div>
      </foreignObject>
    </svg>
  `;
  
  const img = new Image();
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  img.onload = () => {
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
  };
  
  img.src = url;
}
```

这种方法在某些场景下有**一些限制**。

## SVG foreignObject 的限制

### 1. 小号字体缩放后模糊

**问题**：小字体（< 14px）在 Canvas 缩放时会严重模糊。

```typescript
// SVG 方法 - 缩放后模糊
const svg = `
  <svg width="800" height="600">
    <foreignObject width="800" height="600">
      <div style="font-size: 12px;">小号文字</div>
    </foreignObject>
  </svg>
`;

// 当 canvas 缩放时（例如放大）
ctx.scale(2, 2);
ctx.drawImage(svgImage, 0, 0);
// 结果：模糊、像素化的文字 ❌
```

**原因？** 这是浏览器处理 SVG foreignObject 的基本限制：

1. **浏览器控制的光栅化**：浏览器在 **原始 SVG 尺寸**（本例中为 800x600）光栅化 foreignObject 内容
2. **固定位图创建**：这会创建一个固定分辨率的位图 - 你**无法控制**这个过程
3. **位图缩放**：当你缩放 canvas 时，你是在缩放这个预渲染的位图，而不是原始的矢量内容
4. **质量损失**：小字体（10-14px）失去清晰度，因为它们是从低分辨率源放大的

这**不是 bug** - 这是浏览器中 SVG foreignObject 的设计工作方式。浏览器必须将 HTML 内容光栅化为位图，然后才能用作图像源。

**WASM 解析器解决方案**：
```typescript
// WASM 方法 - 任何缩放级别都清晰
const layouts = parser.parse(html, { viewportWidth: 800 });

// 直接在缩放尺寸下渲染
ctx.scale(2, 2);
for (const char of layouts) {
  ctx.font = `${char.fontSize}px ${char.fontFamily}`;
  ctx.fillText(char.character, char.x, char.y);
}
// 结果：清晰锐利的文字 ✅
```

**关键优势**：使用 WASM 解析器，你可以使用 Canvas 原生文本渲染**直接在目标缩放级别渲染文本**。虽然小字体在大幅缩放时仍会显示一些模糊（这是基于位图的 Canvas 渲染的限制），但质量**明显优于 SVG foreignObject**，因为你在每个缩放级别都重新渲染文本，而不是缩放预渲染的位图。这对于 **小字体（10-14px）** 尤其重要，这些字体在 UI 文本、标签和注释中很常见。

### 2. 空标签出现黑色背景

**问题**：在 WebView 环境中（特别是 Android），某些空标签（`<br>`、`<hr>`、空 `<div>`）会渲染出意外的黑色背景。

```typescript
// SVG foreignObject
const html = `
  <div>第一行</div>
  <br>
  <div>第二行</div>
`;

// 在某些 Android WebView 上：
// ❌ <br> 位置出现黑色矩形
// ❌ 不同设备表现不一致
```

**受影响的标签**：
- `<br>` - 换行符
- `<hr>` - 水平线
- 空的 `<div>`、`<p>`、`<span>`
- 自闭合标签

**设备特定问题**：
- ❌ 某些 Android 设备上出现黑色背景
- ❌ 不同 WebView 版本表现不一致
- ⚠️ iOS WebView 也可能出现异常渲染
- ⚠️ 需要对特殊标签预处理并补充兼容代码

**WASM 解析器解决方案**：
```typescript
// WASM 方法 - 无渲染瑕疵
const layouts = parser.parse(html, { viewportWidth: 800 });

// 只渲染实际字符
// 空标签不会产生视觉瑕疵 ✅
for (const char of layouts) {
  if (char.character.trim()) {
    ctx.fillText(char.character, char.x, char.y);
  }
}
```

### 3. 不支持 Web Worker

**问题**：SVG foreignObject 需要 DOM 访问，而 **Web Worker 中不可用**。

```typescript
// ❌ 无法在 Web Worker 中使用
// Web Worker 上下文
self.onmessage = (e) => {
  const html = e.data.html;
  
  // 错误：document 未定义
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  // ❌ Worker 中无法使用 DOM API
};
```

**为什么这很重要**：
- Canvas 渲染是 CPU 密集型操作
- Worker 防止 UI 阻塞
- 对流畅的 60fps 动画至关重要
- 大文档必需

**WASM 解析器解决方案**：
```typescript
// ✅ 在 Web Worker 中完美工作
import { HtmlLayoutParser } from 'html-layout-parser/worker';

self.onmessage = async (e) => {
  const parser = new HtmlLayoutParser();
  await parser.init();
  
  // 加载字体
  const fontData = e.data.fontData;
  parser.loadFont(fontData, 'Arial');
  
  // 在 worker 中解析 - 无需 DOM
  const layouts = parser.parse(e.data.html, {
    viewportWidth: e.data.width
  });
  
  // 将布局发送回主线程
  self.postMessage({ layouts });
};
```

### 4. 安全限制

**问题**：SVG foreignObject 有严格的安全限制：

```typescript
// ❌ 外部资源被阻止
const svg = `
  <svg>
    <foreignObject>
      <div>
        <img src="https://example.com/image.png">
        <!-- 由于 CORS，图片不会加载 -->
      </div>
    </foreignObject>
  </svg>
`;

// ❌ 外部字体被阻止
const svg = `
  <svg>
    <foreignObject>
      <div style="font-family: 'Custom Font'">
        <!-- 字体不会加载 -->
      </div>
    </foreignObject>
  </svg>
`;
```

**WASM 解析器解决方案**：
```typescript
// ✅ 完全控制资源
const fontData = await fetch('/fonts/custom.ttf')
  .then(r => r.arrayBuffer());

parser.loadFont(new Uint8Array(fontData), 'Custom Font');

// 字体已嵌入，无 CORS 问题
const layouts = parser.parse(html, { viewportWidth: 800 });
```

### 5. 浏览器控制的渲染

**问题**：使用 SVG foreignObject，你**无法控制**浏览器如何光栅化内容。

浏览器决定：
- 何时光栅化（时机）
- 以什么分辨率（DPI）
- 如何处理亚像素渲染
- 字体微调和抗锯齿

这意味着：
- 你无法针对特定缩放级别优化
- 你无法以更高分辨率预渲染
- 你无法控制质量与性能的权衡

**WASM 解析器解决方案**：
```typescript
// ✅ 完全控制渲染
const layouts = parser.parse(html, { viewportWidth: 800 });

// 你决定何时以及如何渲染
// 为 Retina 显示器以 2x 渲染
const scale = window.devicePixelRatio;
ctx.scale(scale, scale);

// 使用自定义质量设置渲染
ctx.textRendering = 'optimizeLegibility';
ctx.font = `${char.fontSize}px ${char.fontFamily}`;
ctx.fillText(char.character, char.x, char.y);
```

## 对比表

| 特性 | SVG foreignObject | HTML Layout Parser |
|------|------------------|-------------------|
| **小字体清晰度（10-14px）** | ❌ 缩放后非常模糊 | ✅ 缩放后更清晰 |
| **空标签处理** | ⚠️ 部分 Android 有黑色背景 | ✅ 无瑕疵 |
| **Web Worker 支持** | ❌ 需要 DOM | ✅ 完全支持 |
| **外部资源** | ⚠️ CORS 限制 | ✅ 完全控制 |
| **渲染控制** | ❌ 浏览器控制 | ✅ 开发者控制 |
| **性能** | ⚠️ 大内容慢 | ✅ 快速 WASM 执行 |
| **缩放质量** | ❌ 缩放预渲染位图 | ✅ 在目标缩放重新渲染 |
| **适用场景** | 简单场景、大字体 | 复杂场景、小字体 |

## 实际问题

### 问题 1：小字体模糊

```typescript
// 用户放大 canvas
canvas.style.transform = 'scale(2)';

// SVG foreignObject 结果：
// 12px 字体 → 非常模糊、像素化 ❌
// 10px 字体 → 几乎无法阅读 ❌

// WASM 解析器结果：
// 直接在 2x 缩放下渲染
ctx.scale(2, 2);
ctx.font = '12px Arial';
ctx.fillText(char, x, y);
// 结果：更清晰，虽然极端缩放时仍有些模糊 ✅
// (Canvas 文本渲染是基于位图的，但重新渲染更清晰)
```

### 问题 2：Android WebView 黑色背景

```typescript
// 带换行的 HTML
const html = `
  <div>段落 1</div>
  <br>
  <br>
  <div>段落 2</div>
`;

// Android 上的 SVG foreignObject：
// [文本]
// [黑色方块] ← <br> 渲染为黑色
// [黑色方块] ← <br> 渲染为黑色
// [文本]

// WASM 解析器：
// [文本]
// [空白] ← 正确
// [空白] ← 正确
// [文本]
```

### 问题 3：Worker 性能

```typescript
// 渲染 10,000 个字符

// 主线程（阻塞 UI）：
// SVG foreignObject: 150ms + UI 冻结 ❌

// Web Worker（非阻塞）：
// WASM 解析器: 45ms，UI 保持响应 ✅
```

## 迁移示例

### 之前：SVG foreignObject

```typescript
class CanvasRenderer {
  async renderHtml(html: string, canvas: HTMLCanvasElement) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
        <foreignObject width="800" height="600">
          <div xmlns="http://www.w3.org/1999/xhtml"
               style="font-size: 12px;">
            ${html}
          </div>
        </foreignObject>
      </svg>
    `;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve();
      };
      
      img.onerror = reject;
      img.src = url;
    });
  }
}

// ❌ 问题：
// - 缩放时小字体模糊
// - Android 上黑色背景
// - 无法在 Web Worker 中使用
// - 不同设备表现不一致
```

### 之后：WASM 解析器

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

class CanvasRenderer {
  private parser: HtmlLayoutParser;
  
  async init() {
    this.parser = new HtmlLayoutParser();
    await this.parser.init();
    
    const fontData = await this.loadFont('/fonts/arial.ttf');
    this.parser.loadFont(fontData, 'Arial');
  }
  
  renderHtml(html: string, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!;
    
    // 解析 HTML
    const layouts = this.parser.parse(html, {
      viewportWidth: canvas.width
    });
    
    // 渲染每个字符
    for (const char of layouts) {
      ctx.font = `${char.fontSize}px ${char.fontFamily}`;
      ctx.fillStyle = char.color;
      ctx.fillText(char.character, char.x, char.y + char.fontSize);
    }
  }
  
  private async loadFont(url: string): Promise<Uint8Array> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }
}

// ✅ 优势：
// - 任何缩放级别都清晰
// - 无渲染瑕疵
// - 可在 Web Worker 中工作
// - 任何地方都一致
```

## SVG foreignObject 有限制的使用场景

### ⚠️ 移动应用（React Native、Capacitor）
- 某些 Android 设备上的黑色背景问题
- 不同 WebView 版本渲染不一致
- 小字体缩放质量差

### ⚠️ Electron 应用
- 某些版本可能有 SVG foreignObject 渲染问题
- 外部资源的安全限制

### ⚠️ 高 DPI 显示器
- 小字体缩放时变模糊
- Retina 显示器上可见像素化

### ⚠️ 可缩放界面
- 缩放时质量下降
- 不太适合图表编辑器、地图等

### ⚠️ Web Workers
- 无法在 worker 中使用 SVG foreignObject（需要 DOM）
- 大文档必须在主线程处理

## SVG foreignObject 适用的场景

SVG foreignObject 是一个不错的选择，当：
- ✅ 大字体（> 16px）且无缩放需求
- ✅ 静态、非交互内容
- ✅ 仅桌面应用
- ✅ 无空标签的简单布局
- ✅ 仅主线程渲染
- ✅ 快速原型和演示

## 何时考虑 HTML Layout Parser

HTML Layout Parser 更适合：
- ✅ 小字体（10-14px）且需要缩放支持
- ✅ 移动应用（React Native、Capacitor）
- ✅ 需要清晰文本的高 DPI 显示器
- ✅ 可缩放界面（图表编辑器、地图）
- ✅ 基于 Web Worker 的渲染
- ✅ 需要跨平台一致性

## 总结

SVG foreignObject 在许多情况下是不错的选择，尤其适合简单布局，但在**特定场景下有一些限制**：

1. ⚠️ **小字体模糊** - 缩放时，浏览器在原始尺寸光栅化
2. ⚠️ **黑色背景** - 某些 Android WebView 上空标签出现黑色背景
3. ⚠️ **不支持 Web Worker** - 需要 DOM 访问
4. ⚠️ **资源安全限制** - 外部资源受限
5. ⚠️ **无渲染控制** - 浏览器决定质量和时机

HTML Layout Parser 在以下需求时提供**优秀的替代方案**：

- ✅ **更好的小字体渲染** - 缩放时更清晰的 10-14px 文本（在目标缩放重新渲染）
- ✅ **无渲染瑕疵** - 任何设备
- ✅ **完全支持 Web Worker** - 性能优化
- ✅ **完全控制** - 字体和渲染
- ✅ **开发者控制质量** - 你决定何时以及如何渲染

**根据需求选择**：简单场景且使用大字体时选择 SVG foreignObject，需要**缩放时更好的小文本质量**或**可缩放界面**的应用选择 HTML Layout Parser。

## 相关文档

- [对比 Range API](./vs-range-api.md) - 与浏览器 Range API 的对比
- [对比 Canvas measureText](./vs-measure-text.md) - 与 Canvas measureText 的对比
- [Canvas 渲染](./canvas-rendering.md) - Canvas 2D 渲染指南
- [Web Worker 示例](../examples/worker.md) - 在 worker 中使用解析器
