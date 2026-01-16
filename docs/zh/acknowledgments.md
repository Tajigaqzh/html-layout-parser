# 鸣谢

本项目基于多个优秀的开源库构建。我们深深感谢这些项目的维护者和贡献者。

## 核心库

### litehtml

**HTML Layout Parser** 由 [litehtml](https://github.com/litehtml/litehtml) 驱动，这是一个支持 CSS2/CSS3 的轻量级 HTML 渲染引擎。

- **仓库地址**: [github.com/litehtml/litehtml](https://github.com/litehtml/litehtml)
- **开源协议**: BSD-3-Clause
- **官方网站**: [litehtml.com](http://www.litehtml.com/)
- **功能**: 提供核心的 HTML/CSS 解析和布局计算引擎
- **选择理由**: 轻量级、维护良好，专为嵌入应用程序设计

litehtml 解析 HTML/CSS 并计算元素位置，不依赖任何特定的图形库，非常适合我们基于 WebAssembly 的布局解析器。

### gumbo-parser

HTML 解析由 [gumbo-parser](https://codeberg.org/gumbo-parser/gumbo-parser) 处理，这是一个纯 C99 实现的 HTML5 解析算法。

- **仓库地址**: [codeberg.org/gumbo-parser/gumbo-parser](https://codeberg.org/gumbo-parser/gumbo-parser)
- **开源协议**: Apache License 2.0
- **功能**: 按照 HTML5 规范解析 HTML
- **选择理由**: 符合标准、无外部依赖，专为作为其他工具的构建块而设计

gumbo-parser 在 litehtml 内部使用，将 HTML 文档解析为 DOM 树。

## 构建工具

### Emscripten

本项目使用 [Emscripten](https://emscripten.org/) 编译为 WebAssembly，这是一个基于 LLVM 的编译器工具链。

- **官方网站**: [emscripten.org](https://emscripten.org/)
- **开源协议**: MIT / LLVM License
- **功能**: 将 C++ 代码编译为 WebAssembly 和 JavaScript
- **选择理由**: 业界标准的 WebAssembly 工具链，对 C++ 支持出色

## 开发工具

- **TypeScript**: 类型安全的 JavaScript 开发
- **Vitest**: 快速的单元测试框架
- **VitePress**: 文档站点生成器
- **pnpm**: 快速、节省磁盘空间的包管理器

## 特别感谢

- 感谢 **litehtml** 团队创建并维护如此强大的 HTML 渲染引擎
- 感谢 **gumbo-parser** 维护者提供符合标准的 HTML5 解析器
- 感谢 **Emscripten** 团队让 C++ 开发者能够轻松使用 WebAssembly
- 感谢所有让这样的项目成为可能的开源贡献者

## 了解更多

如果你对 HTML 渲染、CSS 布局或 WebAssembly 开发感兴趣，我们鼓励你探索这些项目：

- [litehtml 文档](https://github.com/litehtml/litehtml/wiki)
- [gumbo-parser 文档](https://codeberg.org/gumbo-parser/gumbo-parser)
- [Emscripten 文档](https://emscripten.org/docs/)
- [WebAssembly 规范](https://webassembly.github.io/spec/)

## 开源协议

本项目采用 MIT 协议发布。底层库保持各自的协议：

- **litehtml**: BSD-3-Clause 协议
- **gumbo-parser**: Apache License 2.0
- **Emscripten**: MIT / LLVM 协议

详见 [LICENSE](https://github.com/Tajigaqzh/html-layout-parser/blob/main/LICENSE) 文件。
