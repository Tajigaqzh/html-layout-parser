# 快速开始

本指南帮助你在几分钟内上手 HTML Layout Parser。

## 安装

### 主包（推荐）

主包会自动检测运行环境并加载相应的代码：

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

### 环境特定包

为了更好地服务不同的使用场景，我们除了发布 `html-layout-parser` 完整包外，还为特定环境单独打了包。如果你只需要特定环境的支持，可以安装对应的单独包来减小打包体积：

::: code-group

```bash [Web 浏览器]
npm install html-layout-parser-web
```

```bash [Node.js]
npm install html-layout-parser-node
```

```bash [Web Worker]
npm install html-layout-parser-worker
```

:::

::: info 包发布策略说明
我们采用了多包发布策略：
- **主包** (`html-layout-parser`)：包含所有环境的代码，自动检测运行环境
- **环境特定包**：每个包都是独立发布到 npm 的单独包，只包含特定环境的代码

这样设计的好处：
- 🎯 **按需选择**：根据项目需求选择合适的包
- 📦 **体积优化**：环境特定包体积更小
- 🔄 **向后兼容**：主包提供完整功能和自动检测
:::

::: tip 包大小对比
- `html-layout-parser`: ~2.5MB（包含所有环境）
- `html-layout-parser-web`: ~2.2MB（单独 npm 包，仅 Web 浏览器）
- `html-layout-parser-node`: ~2.2MB（单独 npm 包，仅 Node.js）
- `html-layout-parser-worker`: ~2.2MB（单独 npm 包，仅 Web Worker）
:::

## 按平台单独引入

### 使用主包

::: tip 自动环境检测
主包会自动检测运行环境并加载相应的代码：

```typescript
// 自动检测（推荐）- 自动检测运行环境
import { HtmlLayoutParser } from 'html-layout-parser';

// 也可以显式指定环境
import { HtmlLayoutParser } from 'html-layout-parser/web';
import { HtmlLayoutParser } from 'html-layout-parser/worker';
import { HtmlLayoutParser } from 'html-layout-parser/node';
```
:::

### 使用环境特定包

```typescript
// Web 浏览器专用包
import { HtmlLayoutParser } from 'html-layout-parser-web';

// Node.js 专用包
import { HtmlLayoutParser } from 'html-layout-parser-node';

// Web Worker 专用包
import { HtmlLayoutParser } from 'html-layout-parser-worker';
```

::: warning 注意
环境特定包只能在对应的环境中使用。例如，`html-layout-parser-node` 只能在 Node.js 环境中使用，在浏览器中会报错。
:::

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

### 步骤 1: 导入和初始化

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

const parser = new HtmlLayoutParser();
await parser.init();
```

### 步骤 2: 加载字体

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

### 步骤 3: 解析 HTML

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

### 步骤 4: 渲染到 Canvas

```typescript
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

for (const char of layouts) {
  ctx.font = `${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
  ctx.fillStyle = char.color;
  ctx.fillText(char.character, char.x, char.baseline);
}
```

### 步骤 5: 清理资源

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

或使用便捷方法：

```typescript
const layouts = parser.parseWithCSS(html, css, { viewportWidth: 800 });
```

## 下一步

- [字体管理](/zh/guide/font-management) - 了解多字体支持
- [输出模式](/zh/guide/output-modes) - 选择合适的输出格式
- [内存管理](/zh/guide/memory-management) - 内存管理最佳实践
- [示例](/zh/examples/) - 查看更多使用示例
