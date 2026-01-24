# 快速开始

本指南将帮助你在几分钟内上手 HTML Layout Parser。

## 安装

### 直接导入（推荐）

现在支持直接从 npm 包导入，无需手动复制文件：

1. **安装包：**

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

2. **Vite 用户配置**（必需）：

如果使用 **Vite**，需要在 `vite.config.ts` 中添加配置：

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    exclude: ['html-layout-parser']
  }
})
```

**为什么需要这个配置？** Vite 的依赖预构建会破坏 WASM 模块，此配置可以防止这种情况。

## 基本用法

### 第1步：导入并初始化

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/web';

const parser = new HtmlLayoutParser();
await parser.init(); // 自动从 node_modules 加载 WASM
```

### 第2步：加载字体

解析 HTML 前必须先加载字体：

```typescript
// 获取字体文件
const response = await fetch('/fonts/arial.ttf');
const fontData = new Uint8Array(await response.arrayBuffer());

// 加载字体并获取 ID
const fontId = parser.loadFont(fontData, 'Arial');

// 设置为默认字体
parser.setDefaultFont(fontId);
```

### 第3步：解析 HTML

```typescript
const html = '<div style="color: red; font-size: 24px;">你好世界</div>';

const layouts = parser.parse(html, {
  viewportWidth: 800
});

// layouts 是 CharLayout 对象数组
for (const char of layouts) {
  console.log(`${char.character} 位于 (${char.x}, ${char.y})`);
}
```

### 第4步：清理资源

```typescript
// 使用完毕后务必清理
parser.destroy();
```

## 完整示例

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/web';

async function main() {
  const parser = new HtmlLayoutParser();
  
  try {
    // 初始化解析器
    await parser.init();
    
    // 加载字体
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    const fontId = parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(fontId);
    
    // 解析 HTML
    const html = `
      <div style="font-size: 24px; color: #333;">
        <h1>你好世界</h1>
        <p>这是一段包含<span style="color: red;">红色文字</span>的段落。</p>
      </div>
    `;
    
    const layouts = parser.parse(html, { viewportWidth: 800 });
    
    console.log(`解析了 ${layouts.length} 个字符`);
    
    // 使用 layouts 进行 Canvas 渲染或其他用途
    layouts.forEach(char => {
      console.log(`'${char.character}' 位于 (${char.x}, ${char.y})`);
    });
    
  } finally {
    // 务必清理资源
    parser.destroy();
  }
}

main().catch(console.error);
```

## 环境特定用法

### 自动检测（推荐）
```typescript
import { HtmlLayoutParser, detectEnvironment } from 'html-layout-parser';

console.log(`运行在 ${detectEnvironment()} 环境`);
const parser = new HtmlLayoutParser();
await parser.init();
```

### 明确指定环境
```typescript
// Web 浏览器
import { HtmlLayoutParser } from 'html-layout-parser/web';

// Node.js
import { HtmlLayoutParser } from 'html-layout-parser/node';

// Web Worker
import { HtmlLayoutParser } from 'html-layout-parser/worker';
```

### Node.js 文件加载
```typescript
import { HtmlLayoutParser } from 'html-layout-parser/node';

const parser = new HtmlLayoutParser();
await parser.init();

// 从文件加载字体（仅 Node.js）
const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
parser.setDefaultFont(fontId);
```

## 故障排除：手动复制设置

⚠️ **仅在直接导入失败时使用此方法。**

推荐方法是直接导入（如上所示）。手动复制是备用解决方案。

### Web 应用

```bash
# 仅在直接导入不工作时
cp -r node_modules/html-layout-parser/web public/html-layout-parser
```

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/web';

const parser = new HtmlLayoutParser();
await parser.init('/html-layout-parser/html_layout_parser.mjs');
```

### Node.js 应用

```bash
# 仅在直接导入不工作时
cp -r node_modules/html-layout-parser/node ./lib/html-layout-parser
```

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/node';

const parser = new HtmlLayoutParser();
await parser.init('./lib/html-layout-parser/html_layout_parser.mjs');
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
import { HtmlLayoutParser } from 'html-layout-parser';

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
import { HtmlLayoutParser } from 'html-layout-parser';

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
