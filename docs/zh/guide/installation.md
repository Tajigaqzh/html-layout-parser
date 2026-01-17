# 安装

## 包安装

从 npm 安装 HTML Layout Parser：

```bash
npm install html-layout-parser
```

## 不同环境的设置

HTML Layout Parser 提供了针对不同环境的预编译产物。安装后，需要将对应的 bundle 复制到你的项目中。

### Web 浏览器

1. **复制 Web bundle 到项目中：**

```bash
# 将 web bundle 复制到 public 目录
cp -r node_modules/html-layout-parser/web public/html-layout-parser
```

2. **项目结构应如下：**

```
public/
  html-layout-parser/
    html_layout_parser.js    # WASM 加载器
    html_layout_parser.wasm  # WASM 二进制
    index.js                 # TypeScript 编译产物
    index.d.ts               # 类型定义
```

3. **在 HTML 中全局加载 WASM：**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Your App</title>
</head>
<body>
  <div id="app"></div>
  <!-- 全局加载 WASM 模块 -->
  <script src="/html-layout-parser/html_layout_parser.js"></script>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

4. **在代码中引入：**

```typescript
// 从复制后的文件中引入
import { HtmlLayoutParser } from '/html-layout-parser/index.js';

async function example() {
  const parser = new HtmlLayoutParser();
  await parser.init(); // 使用全局加载的 WASM
  
  // 加载字体并解析...
}
```

### Node.js

1. **复制 Node.js bundle：**

```bash
# 复制到项目的 lib 目录
cp -r node_modules/html-layout-parser/node ./src/lib/html-layout-parser
```

2. **在 Node.js 代码中引入：**

```typescript
import { HtmlLayoutParser } from './lib/html-layout-parser/index.js';

async function example() {
  const parser = new HtmlLayoutParser();
  await parser.init('./lib/html-layout-parser/html_layout_parser.js');
  
  // 加载字体并解析...
}
```

### Web Worker

1. **复制 worker bundle：**

```bash
# 复制到 workers 目录
cp -r node_modules/html-layout-parser/worker public/workers/html-layout-parser
```

2. **在 worker 中引入：**

```typescript
// 在 worker 文件中
import { HtmlLayoutParser } from '/workers/html-layout-parser/index.js';

async function example() {
  const parser = new HtmlLayoutParser();
  await parser.init('/workers/html-layout-parser/html_layout_parser.js');
  
  // 加载字体并解析...
}
```

## 为什么推荐手动复制？

我们推荐手动复制，因为：

- **🔒 可靠**：适配所有打包器和部署环境
- **📦 可预测**：WASM 文件以静态资源方式提供
- **⚡ 快速**：无需复杂的模块解析或动态导入
- **🌐 兼容**：适用于 CDN、静态托管和任何 Web 服务器
- **🎯 简单**：文件位置和导入路径清晰
