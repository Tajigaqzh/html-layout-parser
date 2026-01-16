# CSS 支持与限制

HTML Layout Parser 基于 [litehtml](https://github.com/litehtml/litehtml) 构建，这是一个轻量级的 HTML/CSS 渲染引擎。虽然 litehtml 支持许多常见的 CSS 属性，但它**不支持**所有现代 CSS 特性。本指南记录了支持和不支持的 CSS 属性和功能。

::: warning 重要提示
HTML Layout Parser 专为**布局计算和文本测量**而设计，而非完整的 Web 渲染。许多现代 CSS 特性（尤其是动画、变换和高级选择器）不受支持。
:::

## 支持的 CSS 属性

### 布局属性

litehtml 支持以下与布局相关的属性：

- **Display**：`display`（block、inline、inline-block、flex、inline-flex、table、list-item、none 等）
- **Position**：`position`（static、relative、absolute、fixed）
- **Float & Clear**：`float`（left、right、none）、`clear`（left、right、both、none）
- **盒模型**：
  - `width`、`height`、`min-width`、`min-height`、`max-width`、`max-height`
  - `margin`、`margin-top`、`margin-right`、`margin-bottom`、`margin-left`
  - `padding`、`padding-top`、`padding-right`、`padding-bottom`、`padding-left`
  - `box-sizing`（content-box、border-box）
- **定位**：`top`、`right`、`bottom`、`left`、`z-index`
- **溢出**：`overflow`（visible、hidden、scroll、auto）

### Flexbox 属性

litehtml 具有**基本的 flexbox 支持**：

- **容器**：`flex-direction`、`flex-wrap`、`justify-content`、`align-items`、`align-content`
- **项目**：`flex-grow`、`flex-shrink`、`flex-basis`、`align-self`、`order`

::: tip 提示
Flexbox 支持是功能性的，但可能无法处理所有边缘情况。请彻底测试您的布局。
:::

### 文本属性

- **字体**：`font-family`、`font-size`、`font-weight`、`font-style`、`font-variant`
- **文本样式**：
  - `color`
  - `text-align`（left、right、center、justify）
  - `text-decoration`、`text-decoration-line`、`text-decoration-style`、`text-decoration-color`、`text-decoration-thickness`
  - `text-emphasis`、`text-emphasis-style`、`text-emphasis-color`、`text-emphasis-position`
  - `text-transform`（uppercase、lowercase、capitalize、none）
  - `text-indent`
  - `line-height`
  - `vertical-align`
  - `white-space`（normal、nowrap、pre、pre-line、pre-wrap）

### 边框属性

- **边框宽度**：`border-width`、`border-top-width`、`border-right-width`、`border-bottom-width`、`border-left-width`
- **边框样式**：`border-style`、`border-top-style`、`border-right-style`、`border-bottom-style`、`border-left-style`
- **边框颜色**：`border-color`、`border-top-color`、`border-right-color`、`border-bottom-color`、`border-left-color`
- **边框圆角**：`border-radius`、`border-top-left-radius`、`border-top-right-radius`、`border-bottom-right-radius`、`border-bottom-left-radius`
- **边框合并**：`border-collapse`、`border-spacing`

### 背景属性

- `background-color`
- `background-image`
- `background-repeat`
- `background-position`、`background-position-x`、`background-position-y`
- `background-size`
- `background-attachment`
- `background-origin`、`background-clip`
- **渐变**：`linear-gradient`、`radial-gradient`、`conic-gradient`（及其重复变体）

### 列表属性

- `list-style-type`
- `list-style-position`
- `list-style-image`

### 表格属性

- `border-collapse`
- `border-spacing`
- `caption-side`

### 其他属性

- `visibility`（visible、hidden、collapse）
- `cursor`
- `content`（用于 `::before` 和 `::after` 伪元素）
- `appearance`

## 不支持的 CSS 特性

以下现代 CSS 特性**不受** litehtml 支持：

### ❌ CSS Grid

```css
/* 不支持 */
.container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: 20px;
}
```

**替代方案**：使用 flexbox 或表格布局。

### ❌ CSS 变换

```css
/* 不支持 */
.element {
  transform: rotate(45deg);
  transform: scale(1.5);
  transform: translate(10px, 20px);
}
```

### ❌ CSS 动画与过渡

```css
/* 不支持 */
@keyframes slide {
  from { left: 0; }
  to { left: 100px; }
}

.element {
  animation: slide 2s;
  transition: all 0.3s ease;
}
```

### ❌ CSS 变量（自定义属性）

```css
/* 不支持 */
:root {
  --primary-color: #3498db;
}

.element {
  color: var(--primary-color);
}
```

### ❌ 现代选择器

```css
/* 不支持 */
.parent:has(.child) { }
.element:is(.class1, .class2) { }
.element:where(.class1, .class2) { }
```

**支持的选择器**：基本选择器（类、ID、元素、后代、子、相邻兄弟）、伪类（`:hover`、`:active`、`:first-child`、`:last-child`、`:nth-child()`、`:not()`）和伪元素（`::before`、`::after`）。

### ❌ 现代颜色函数

```css
/* 不支持 */
.element {
  color: oklch(60% 0.15 180);
  background: color-mix(in srgb, red 50%, blue);
}
```

**支持的**：命名颜色、十六进制颜色（`#fff`）、`rgb()`、`rgba()`、`hsl()`、`hsla()`。

### ❌ 容器查询

```css
/* 不支持 */
@container (min-width: 400px) {
  .element { font-size: 2rem; }
}
```

### ❌ 滚动驱动动画

```css
/* 不支持 */
@scroll-timeline {
  source: selector(#scroller);
}
```

### ❌ CSS 滤镜

```css
/* 不支持 */
.element {
  filter: blur(5px);
  backdrop-filter: blur(10px);
}
```

### ❌ CSS Clip-path 与遮罩

```css
/* 不支持 */
.element {
  clip-path: circle(50%);
  mask-image: url(mask.png);
}
```

### ❌ 多列布局

```css
/* 不支持 */
.element {
  column-count: 3;
  column-gap: 20px;
}
```

### ❌ CSS 形状

```css
/* 不支持 */
.element {
  shape-outside: circle(50%);
}
```

### ❌ 书写模式（有限支持）

```css
/* 有限或不支持 */
.element {
  writing-mode: vertical-rl;
  text-orientation: upright;
}
```

### ❌ 高级 Flexbox 特性

虽然支持基本的 flexbox，但某些高级特性可能无法正常工作：

```css
/* 可能无法按预期工作 */
.element {
  flex: 1 1 auto; /* 复杂的 flex 简写可能有问题 */
  gap: 20px; /* gap 属性可能不受支持 */
}
```

### ❌ Subgrid

```css
/* 不支持 */
.element {
  display: grid;
  grid-template-columns: subgrid;
}
```

### ❌ 宽高比

```css
/* 不支持 */
.element {
  aspect-ratio: 16 / 9;
}
```

### ❌ Object-fit 与 Object-position

```css
/* 不支持 */
img {
  object-fit: cover;
  object-position: center;
}
```

## 最佳实践

### 1. 保持 CSS 简单

使用基本的、受良好支持的 CSS 属性。避免使用前沿特性。

```css
/* ✅ 好 - 简单、受支持的属性 */
.container {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: #f0f0f0;
}

/* ❌ 差 - 现代、不受支持的特性 */
.container {
  display: grid;
  gap: 20px;
  background: color-mix(in srgb, red, blue);
}
```

### 2. 测试您的布局

始终使用 HTML Layout Parser 测试您的 HTML/CSS，以确保其正确渲染：

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

const parser = new HtmlLayoutParser();
await parser.initFont('/fonts/arial.ttf');

const html = `
  <div style="display: flex; padding: 20px;">
    <div style="flex: 1;">列 1</div>
    <div style="flex: 1;">列 2</div>
  </div>
`;

const result = await parser.parseHtml(html);
console.log(result.charLayouts); // 验证布局是否正确
```

### 3. 使用回退方案

如果您需要高级特性，请考虑预处理您的 HTML/CSS 或使用回退样式：

```css
/* 为不受支持的特性提供回退 */
.element {
  /* 不支持 grid 的浏览器的回退 */
  display: flex;
  flex-wrap: wrap;
  
  /* Grid 布局（litehtml 不支持） */
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
```

### 4. 避免复杂选择器

坚持使用简单的、受良好支持的选择器：

```css
/* ✅ 好 */
.container .item { }
.container > .item { }
.item:first-child { }
.item:nth-child(2) { }

/* ❌ 避免 */
.container:has(.item) { }
.item:is(.active, .selected) { }
```

## 媒体查询

litehtml 支持**基本的媒体查询**：

```css
@media screen and (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}

@media print {
  .no-print {
    display: none;
  }
}
```

**支持的媒体特性**：
- `width`、`height`、`min-width`、`max-width`、`min-height`、`max-height`
- `device-width`、`device-height`
- `orientation`（portrait、landscape）
- `aspect-ratio`、`device-aspect-ratio`
- `color`、`color-index`、`monochrome`
- `resolution`

## 伪元素与伪类

### 支持的伪元素

- `::before`
- `::after`

### 支持的伪类

- `:hover`
- `:active`
- `:first-child`
- `:last-child`
- `:nth-child()`
- `:nth-of-type()`
- `:first-of-type`
- `:last-of-type`
- `:only-child`
- `:only-of-type`
- `:not()`
- `:lang()`
- `:root`

### 不支持的伪类

- `:has()`
- `:is()`
- `:where()`
- `:focus-visible`
- `:focus-within`
- `:target`
- `:checked`
- `:disabled`
- `:enabled`

## 总结

HTML Layout Parser（通过 litehtml）为**核心 CSS 布局和样式属性**提供了可靠的支持，包括：

✅ 盒模型、定位、浮动  
✅ 基本 flexbox  
✅ 文本样式和字体  
✅ 边框和背景  
✅ 表格和列表  
✅ 基本媒体查询  

但是，它**不支持**许多现代 CSS 特性：

❌ CSS Grid  
❌ 变换、动画、过渡  
❌ CSS 变量  
❌ 高级选择器（`:has()`、`:is()`、`:where()`）  
❌ 现代颜色函数  
❌ 容器查询  
❌ 滤镜、clip-path、遮罩  

为了获得最佳结果，**保持您的 CSS 简单并使用 HTML Layout Parser 进行彻底测试**。

## 相关资源

- [litehtml GitHub 仓库](https://github.com/litehtml/litehtml)
- [litehtml 文档](http://www.litehtml.com/)
- [入门指南](./getting-started.md)
- [性能优化](./performance.md)
