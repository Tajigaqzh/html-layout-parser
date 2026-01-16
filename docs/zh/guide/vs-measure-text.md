# HTML Layout Parser vs Canvas measureText

在 Canvas 上渲染文本时，一个常见做法是调用 `ctx.measureText()` 再手写排版。它在简单标签场景下很快，但无法提供 DOM 级别的布局一致性，也难以保证跨平台结果一致。

## Canvas `measureText()` 的局限

### 1. DOM 一致性与布局覆盖不足

`measureText()` 只返回字符串的度量值，不负责排版。要对齐 HTML/CSS 仍需自己实现：

- 行内布局与换行（`line-height`、`white-space`、`word-break`、`letter-spacing`）
- 内联样式拆分与嵌套 span
- 字体回退与基线对齐
- 文本装饰与背景盒

一旦需要 DOM 级别布局，手写排版会变得复杂且容易与真实 DOM 结果偏离。

### 2. 跨浏览器与跨平台漂移

`measureText()` 依赖浏览器与系统字体渲染，同一文本在不同环境可能产生不同度量：

- Chrome vs Safari vs Firefox
- Windows vs macOS vs Linux
- 不同浏览器版本

这些偏差在长文本中会累积，导致换行或位置错位。

### 3. 规模化解析速度

单次调用很快，但 DOM 级布局通常需要：

- 按样式切分文本片段
- 按字或按词测量以决定换行
- 处理样式变化导致的重新排版

总体速度受大量调用与自定义布局逻辑影响。

### 4. 服务端限制

在 Node.js 中需要 Canvas 实现（如 node-canvas）与字体配置，结果仍可能与浏览器不一致。

## HTML Layout Parser 方案

解析器使用单一 WASM 布局引擎与内嵌字体度量，在任何环境产出一致结果：

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

const parser = new HtmlLayoutParser();
await parser.init();

const fontData = await loadFont('Arial.ttf');
parser.loadFont(fontData, 'Arial');

const layouts = parser.parse(
  '<div style="font-size: 16px;">Hello World</div>',
  { viewportWidth: 800 }
);
```

## 对比表

| 维度 | Canvas `measureText()` | HTML Layout Parser |
|------|------------------------|-------------------|
| **解析效果与 DOM 一致性** | ⚠️ 需手写排版，易偏离 | ✅ 可控引擎，结果一致 |
| **布局覆盖** | ❌ 无盒模型与行内布局 | ✅ CSS 级别布局 |
| **跨平台一致性** | ❌ 字体/渲染差异 | ✅ 平台无关 |
| **服务端支持** | ⚠️ 需 node-canvas | ✅ 原生 Node.js 支持 |
| **解析速度** | ⚠️ 单次快，整体取决于排版实现 | ✅ 快速 WASM 执行 |
| **可预测测试** | ❌ 受平台影响 | ✅ 确定性测试 |

## 使用场景

### ✅ 何时使用 HTML Layout Parser

- 跨平台或服务端渲染
- Canvas 富文本或编辑器
- 需要像素级一致性与可预测测试

### ⚠️ 何时 `measureText()` 可能足够

- 单行标签、样式简单
- 仅浏览器端且无需 DOM 一致性
- 允许近似定位

## 迁移示例

### 之前：手写 `measureText()` 排版

```typescript
function layoutText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  let line = '';
  const lines: string[] = [];

  for (const ch of text) {
    const next = line + ch;
    if (ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = ch;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines;
}
```

### 之后：HTML Layout Parser

```typescript
const layouts = parser.parse(html, { viewportWidth: 800 });
```

## 总结

`measureText()` 是一个便捷的底层接口，但不提供 DOM 级布局，且度量会随浏览器与平台变化。HTML Layout Parser 提供一致、可预测的 CSS 布局结果，更适合需要精确与跨平台一致性的场景。

## 相关文档

- [对比 Range API](./vs-range-api.md)
- [对比 SVG foreignObject](./vs-svg-foreignobject.md)
