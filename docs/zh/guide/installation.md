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

### 直接导入（推荐）

HTML Layout Parser 支持直接从 npm 包导入，无需手动复制文件。

```typescript
// 直接从 npm 包导入
import { HtmlLayoutParser } from 'html-layout-parser';

async function example() {
  const parser = new HtmlLayoutParser();
  await parser.init(); // 自动从 node_modules 加载 WASM
  
  // 加载字体并解析...
}
```

#### 可选环境入口

默认入口会自动检测环境。需要强制指定目标环境时，可以使用：

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/web';
import { HtmlLayoutParser } from 'html-layout-parser/node';
import { HtmlLayoutParser } from 'html-layout-parser/worker';
```

## 为什么推荐直接导入？

我们推荐直接导入，因为：

- **🚀 简单**：无需手动复制文件
- **🔄 自动**：WASM 文件自动从 node_modules 加载
- **📦 现代**：利用现代打包器的模块解析能力
- **🎯 便捷**：一行导入即可使用
- **🔧 智能**：自动处理不同环境的 WASM 加载策略
