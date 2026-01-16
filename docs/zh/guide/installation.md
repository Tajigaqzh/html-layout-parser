# 安装

## 包管理器

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

## 环境特定包

为了优化包大小，可以使用环境特定的入口点：

```typescript
// Web 浏览器
import { HtmlLayoutParser } from 'html-layout-parser/web';

// Web Worker
import { HtmlLayoutParser } from 'html-layout-parser/worker';

// Node.js
import { HtmlLayoutParser } from 'html-layout-parser/node';

// 自动检测环境
import { HtmlLayoutParser } from 'html-layout-parser';
```

## WASM 文件

包含以下文件：
- `html_layout_parser.wasm` - WebAssembly 二进制文件 (2.25MB)
- `html_layout_parser.js` - JavaScript 加载器

### 自动加载

默认情况下，WASM 文件会自动从包目录加载。

### 自定义路径

如果需要从自定义路径加载：

```typescript
const parser = new HtmlLayoutParser();
await parser.init('/custom/path/html_layout_parser.js');
```

### Vite 配置

```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['html-layout-parser']
  }
});
```

### Webpack 配置

```javascript
// webpack.config.js
module.exports = {
  experiments: {
    asyncWebAssembly: true
  }
};
```

## 字体文件

解析器需要字体文件来计算字符布局。支持的格式：
- TTF (TrueType)
- OTF (OpenType)
- WOFF (Web Open Font Format)

### 字体加载示例

```typescript
// Web 环境
const response = await fetch('/fonts/arial.ttf');
const fontData = new Uint8Array(await response.arrayBuffer());
const fontId = parser.loadFont(fontData, 'Arial');

// Node.js 环境
const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
```

## TypeScript 支持

包含完整的 TypeScript 类型定义：

```typescript
import { 
  HtmlLayoutParser,
  CharLayout,
  ParseOptions,
  FontInfo,
  MemoryMetrics
} from 'html-layout-parser';
```

## 浏览器兼容性

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 57+ |
| Firefox | 52+ |
| Safari | 11+ |
| Edge | 16+ |

## Node.js 兼容性

- Node.js 16+
- 需要支持 WebAssembly

## 验证安装

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

const parser = new HtmlLayoutParser();
await parser.init();

console.log('版本:', parser.getVersion());
console.log('环境:', parser.getEnvironment());

parser.destroy();
```
