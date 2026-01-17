# 快速开始

本指南将帮助你在几分钟内上手 HTML Layout Parser。

## 安装

### 下载安装并手动复制（推荐）

HTML Layout Parser 使用 WebAssembly (WASM) 模块，现代构建工具对它的处理较复杂。为保证在各种环境下稳定加载，我们建议安装后手动复制文件到项目中。

1. **下载包：**

::: code-group

```bash [npm]
npm install html-layout-parser
```

```bash [yarn]
yarn add html-layout-parser
```

```bash [pnpm]
pnpm add html-layout-parser
```

:::

2. **复制文件到项目：**

安装完成后，将 `node_modules/html-layout-parser/` 下的对应 bundle 复制到项目中：

```bash
# Web 应用
cp -r node_modules/html-layout-parser/web/ public/html-layout-parser/

# Node.js 应用
cp -r node_modules/html-layout-parser/node/ src/html-layout-parser/

# Web Worker 应用
cp -r node_modules/html-layout-parser/worker/ public/html-layout-parser/
```

3. **项目结构应如下：**

::: code-group

```text [Web 项目]
project/
├── public/
│   ├── html-layout-parser/
│   │   ├── index.js
│   │   ├── html_layout_parser.wasm
│   │   └── canvas.js (可选)
│   └── fonts/
│       └── arial.ttf
└── src/
    └── main.ts
```

```text [Node.js 项目]
project/
├── src/
│   ├── html-layout-parser/
│   │   ├── index.js
│   │   └── html_layout_parser.wasm
│   └── main.ts
└── fonts/
    └── arial.ttf
```

:::

### 为什么推荐手动复制？

现代打包器（Vite、Webpack、Rollup）对 WASM 的处理较复杂，可能导致加载问题：

- **导入路径解析**：打包器可能重命名或移动 WASM 文件
- **模块加载方式**：不同环境需要不同的 WASM 加载策略
- **构建优化**：打包器可能对 WASM 做不兼容的优化

手动复制可以确保文件路径稳定、名称可预测。

## 按平台使用

### Web 浏览器

```typescript
// 从复制后的文件中引入
import { HtmlLayoutParser } from '/html-layout-parser/index.js';

const parser = new HtmlLayoutParser();
await parser.init();
```

### Node.js

```typescript
// 从复制后的文件中引入（按需调整路径）
import { HtmlLayoutParser } from './html-layout-parser/index.js';

const parser = new HtmlLayoutParser();
await parser.init();
```

### Web Worker

```typescript
// 从复制后的文件中引入
import { HtmlLayoutParser } from '/html-layout-parser/index.js';

const parser = new HtmlLayoutParser();
await parser.init();
```

## 字体文件设置

::: warning 重要：字体文件位置
始终将字体文件放在 `public` 目录（或等效的静态资源文件夹）中，以防止打包工具重命名文件。

**推荐的目录结构：**
```
project/
├── public/
│   └── fonts/
│       ├── arial.ttf
│       ├── times.ttf
│       └── helvetica.ttf
├── src/
│   └── main.ts
```

**为什么？** Vite、Webpack 或 Rollup 等打包工具可能会给 `src` 中的文件添加哈希后缀（例如 `arial.abc123.ttf`），导致 WASM 无法加载字体。
:::

## 基本用法

### 步骤 1：导入与初始化

```typescript
import { HtmlLayoutParser } from '/html-layout-parser/index.js';

const parser = new HtmlLayoutParser();
await parser.init();
```

### 步骤 2：加载字体

解析前必须加载字体。解析器需要字体数据来计算字符宽度和位置。

```typescript
// 从 public 目录获取字体文件
const response = await fetch('/fonts/arial.ttf');
const fontData = new Uint8Array(await response.arrayBuffer());

// 加载字体并获取 ID
const fontId = parser.loadFont(fontData, 'Arial');

// 设置为默认字体
parser.setDefaultFont(fontId);
```

### 步骤 3：解析 HTML

```typescript
const html = '<div style="color: red; font-size: 24px;">Hello World</div>';

const layouts = parser.parse(html, {
  viewportWidth: 800
});

// layouts 是 CharLayout 对象数组
for (const char of layouts) {
  console.log(`${char.character} 在 (${char.x}, ${char.y})`);
}
```

### 步骤 4：渲染到 Canvas

```typescript
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

for (const char of layouts) {
  ctx.font = `${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
  ctx.fillStyle = char.color;
  ctx.fillText(char.character, char.x, char.baseline);
}
```

### 步骤 5：清理资源

::: danger 关键：内存管理
使用完毕后务必销毁解析器以释放 WebAssembly 内存。
:::

```typescript
parser.destroy();
```

## 完整示例

```typescript
import { HtmlLayoutParser } from '/html-layout-parser/index.js';

async function main() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // 加载字体
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    const fontId = parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(fontId);

    // 解析 HTML
    const html = `
      <div style="font-size: 24px; color: blue;">
        Hello World
      </div>
    `;
    const layouts = parser.parse(html, { viewportWidth: 800 });

    // 渲染到 Canvas
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    for (const char of layouts) {
      ctx.font = `${char.fontSize}px ${char.fontFamily}`;
      ctx.fillStyle = char.color;
      ctx.fillText(char.character, char.x, char.baseline);
    }
  } finally {
    parser.destroy();
  }
}

main();
```

## 使用外部 CSS

将 HTML 内容与 CSS 样式分离：

```typescript
const html = '<div class="title">Hello World</div>';
const css = `
  .title {
    color: red;
    font-size: 24px;
    font-weight: bold;
  }
`;

const layouts = parser.parse(html, {
  viewportWidth: 800,
  css: css
});
```

或者使用便捷方法：

```typescript
const layouts = parser.parseWithCSS(html, css, { viewportWidth: 800 });
```

## 下一步

- [字体管理](/zh/guide/font-management) - 多字体支持
- [输出模式](/zh/guide/output-modes) - 选择合适的输出格式
- [内存管理](/zh/guide/memory-management) - 内存最佳实践
- [示例](/zh/examples/) - 更多使用示例
