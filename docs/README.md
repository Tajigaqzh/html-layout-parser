# HTML Layout Parser 文档

欢迎来到 HTML Layout Parser v0.0.1 的官方文档！

## 📚 文档结构

### 🌐 在线文档

访问完整的在线文档：[https://Tajigaqzh.github.io/html-layout-parser/](https://Tajigaqzh.github.io/html-layout-parser/)

### 📖 文档内容

#### 指南 (Guide)
- [快速开始](./guide/getting-started.md) - 5分钟上手指南
- [安装](./guide/installation.md) - 详细安装说明
- [对比 Range API](./guide/vs-range-api.md) - 与浏览器 Range API 对比
- [对比 Canvas measureText](./guide/vs-measure-text.md) - 与 Canvas measureText 对比
- [对比 SVG foreignObject](./guide/vs-svg-foreignobject.md) - 与 SVG foreignObject 对比
- [字体管理](./guide/font-management.md) - 多字体加载和管理
- [输出模式](./guide/output-modes.md) - 4种输出模式详解
- [CSS 分离](./guide/css-separation.md) - HTML/CSS 分离和主题切换
- [Canvas 渲染](./guide/canvas-rendering.md) - Canvas 2D API 渲染
- [内存管理](./guide/memory-management.md) - 内存优化和监控
- [性能优化](./guide/performance.md) - 性能调优技巧
- [调试模式](./guide/debug-mode.md) - 调试和诊断
- [错误处理](./guide/error-handling.md) - 错误处理策略

#### API 参考 (API Reference)
- [API 概览](./api/) - API 总览
- [HtmlLayoutParser 类](./api/parser.md) - 核心 API 文档
- [类型与接口](./api/types.md) - TypeScript 类型定义
- [错误代码](./api/error-codes.md) - 完整错误代码参考

#### 示例 (Examples)
- [示例概览](./examples/) - 所有示例索引
- [Web 浏览器](./examples/web.md) - 浏览器环境使用
- [Web Worker](./examples/worker.md) - Worker 环境使用
- [Node.js](./examples/node.md) - 服务端使用
- [批量处理](./examples/batch.md) - 高效批量处理
- [内存管理](./examples/memory.md) - 内存优化实践

#### 其他
- [更新日志](./changelog.md) - 版本更新记录

### 🇨🇳 中文文档

完整的中文文档位于 [./zh/](./zh/) 目录：
- [中文指南](./zh/guide/)
- [中文 API 参考](./zh/api/)
- [中文示例](./zh/examples/)
- [中文更新日志](./zh/changelog.md)

## 🚀 本地开发

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:4000 查看文档。

### 构建文档

```bash
pnpm build
```

构建输出位于 `.vitepress/dist/` 目录。

### 预览构建结果

```bash
pnpm preview
```

## 📝 文档贡献

欢迎贡献文档！请遵循以下指南：

### 文档规范

1. **Markdown 格式**
   - 使用标准 Markdown 语法
   - 代码块指定语言类型
   - 使用相对链接引用其他文档

2. **代码示例**
   - 提供完整可运行的示例
   - 添加必要的注释
   - 包含错误处理

3. **双语支持**
   - 英文文档位于根目录
   - 中文文档位于 `zh/` 目录
   - 保持两种语言内容同步

### 提交流程

1. Fork 仓库
2. 创建功能分支
3. 编写/修改文档
4. 本地测试
5. 提交 Pull Request

## 🔧 技术栈

- **VitePress** - 文档生成器
- **Vue 3** - 组件框架
- **TypeScript** - 类型支持
- **Markdown** - 文档格式

## 📦 版本信息

- **当前版本**: v0.0.1
- **发布日期**: 2026-01-17
- **Node.js**: >= 16.0.0
- **pnpm**: >= 8.0.0

## 🔗 相关链接

- [GitHub 仓库](https://github.com/Tajigaqzh/html-layout-parser)
- [NPM 包](https://www.npmjs.com/package/html-layout-parser)
- [问题反馈](https://github.com/Tajigaqzh/html-layout-parser/issues)
- [讨论区](https://github.com/Tajigaqzh/html-layout-parser/discussions)

## 📄 许可证

MIT License - 详见 [LICENSE](https://github.com/Tajigaqzh/html-layout-parser/blob/main/LICENSE) 文件

## 💬 获取帮助

- 📖 查看[文档](https://Tajigaqzh.github.io/html-layout-parser/)
- 💡 提交 [Issue](https://github.com/Tajigaqzh/html-layout-parser/issues)
- 💬 参与 [Discussions](https://github.com/Tajigaqzh/html-layout-parser/discussions)
- 📧 联系作者: 201267151@qq.com

---

感谢使用 HTML Layout Parser！🎉
