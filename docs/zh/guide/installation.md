# 安装

## 包安装

从 npm 安装 HTML Layout Parser：

```bash
npm install html-layout-parser
```

### Vite 用户重要配置

如果您使用 **Vite**，请在 `vite.config.ts` 中添加以下配置：

```typescript
export default defineConfig({
  optimizeDeps: {
    exclude: ['html-layout-parser']
  }
})
```

**为什么？** Vite 的依赖预打包会破坏 WASM 模块。此配置可防止这种情况。

## 使用方法

### 方法 1：直接导入（推荐）

HTML Layout Parser 支持直接从 npm 包导入，无需手动复制文件。

#### Web 浏览器

```typescript
// 直接从 npm 包导入
import { HtmlLayoutParser } from 'html-layout-parser/web';

async function example() {
  const parser = new HtmlLayoutParser();
  await parser.init(); // 自动从 node_modules 加载 WASM
  
  // 加载字体并解析...
}
```

#### Node.js

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/node';

async function example() {
  const parser = new HtmlLayoutParser();
  await parser.init(); // 自动加载 WASM
  
  // 加载字体并解析...
}
```

#### Web Worker

```typescript
// 在 worker 文件中
import { HtmlLayoutParser } from 'html-layout-parser/worker';

async function example() {
  const parser = new HtmlLayoutParser();
  await parser.init(); // 自动加载 WASM
  
  // 加载字体并解析...
}
```

### 方法 2：手动复制（备选方案）

如果遇到打包器问题，可以手动复制文件：

#### Web 浏览器

```bash
# 将 web bundle 复制到 public 目录
cp -r node_modules/html-layout-parser/web public/html-layout-parser
```

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/web';

async function example() {
  const parser = new HtmlLayoutParser();
  await parser.init('/html-layout-parser/html_layout_parser.mjs'); // 自定义路径
  
  // 加载字体并解析...
}
```

#### Node.js

```bash
# 复制到项目的 lib 目录
cp -r node_modules/html-layout-parser/node ./src/lib/html-layout-parser
```

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/node';

async function example() {
  const parser = new HtmlLayoutParser();
  await parser.init('./lib/html-layout-parser/html_layout_parser.mjs');
  
  // 加载字体并解析...
}
```

#### Web Worker

```bash
# 复制到 workers 目录
cp -r node_modules/html-layout-parser/worker public/workers/html-layout-parser
```

```typescript
// 在 worker 文件中
import { HtmlLayoutParser } from 'html-layout-parser/worker';

async function example() {
  const parser = new HtmlLayoutParser();
  await parser.init('/workers/html-layout-parser/html_layout_parser.mjs');
  
  // 加载字体并解析...
}
```

## 为什么推荐直接导入？

我们推荐直接导入，因为：

- **🚀 简单**：无需手动复制文件
- **🔄 自动**：WASM 文件自动从 node_modules 加载
- **📦 现代**：利用现代打包器的模块解析能力
- **🎯 便捷**：一行导入即可使用
- **🔧 智能**：自动处理不同环境的 WASM 加载策略

手动复制仍然是可靠的备选方案，适用于特殊的部署环境或打包器兼容性问题。
