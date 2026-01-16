# Acknowledgments

This project is built upon the excellent work of several open-source libraries. We are deeply grateful to the maintainers and contributors of these projects.

## Core Libraries

### litehtml

**HTML Layout Parser** is powered by [litehtml](https://github.com/litehtml/litehtml), a lightweight HTML rendering engine with CSS2/CSS3 support.

- **Repository**: [github.com/litehtml/litehtml](https://github.com/litehtml/litehtml)
- **License**: BSD-3-Clause
- **Website**: [litehtml.com](http://www.litehtml.com/)
- **What it does**: Provides the core HTML/CSS parsing and layout calculation engine
- **Why we chose it**: Lightweight, well-maintained, and designed for embedding in applications

litehtml parses HTML/CSS and calculates element positions without depending on any specific graphics library, making it perfect for our WebAssembly-based layout parser.

### gumbo-parser

The HTML parsing is handled by [gumbo-parser](https://codeberg.org/gumbo-parser/gumbo-parser), a pure C99 implementation of the HTML5 parsing algorithm.

- **Repository**: [codeberg.org/gumbo-parser/gumbo-parser](https://codeberg.org/gumbo-parser/gumbo-parser)
- **License**: Apache License 2.0
- **What it does**: Parses HTML according to the HTML5 specification
- **Why we chose it**: Standards-compliant, no external dependencies, and designed as a building block for other tools

gumbo-parser is used internally by litehtml to parse HTML documents into a DOM tree.

## Build Tools

### Emscripten

This project is compiled to WebAssembly using [Emscripten](https://emscripten.org/), the LLVM-based compiler toolchain.

- **Website**: [emscripten.org](https://emscripten.org/)
- **License**: MIT / LLVM License
- **What it does**: Compiles C++ code to WebAssembly and JavaScript
- **Why we chose it**: Industry-standard toolchain for WebAssembly with excellent C++ support

## Development Tools

- **TypeScript**: Type-safe JavaScript development
- **Vitest**: Fast unit testing framework
- **VitePress**: Documentation site generator
- **pnpm**: Fast, disk space efficient package manager

## Special Thanks

- To the **litehtml** team for creating and maintaining such a robust HTML rendering engine
- To the **gumbo-parser** maintainers for their standards-compliant HTML5 parser
- To the **Emscripten** team for making WebAssembly accessible to C++ developers
- To all open-source contributors who make projects like this possible

## Learn More

If you're interested in HTML rendering, CSS layout, or WebAssembly development, we encourage you to explore these projects:

- [litehtml Documentation](https://github.com/litehtml/litehtml/wiki)
- [gumbo-parser Documentation](https://codeberg.org/gumbo-parser/gumbo-parser)
- [Emscripten Documentation](https://emscripten.org/docs/)
- [WebAssembly Specification](https://webassembly.github.io/spec/)

## License

This project is released under the MIT License. The underlying libraries maintain their respective licenses:

- **litehtml**: BSD-3-Clause License
- **gumbo-parser**: Apache License 2.0
- **Emscripten**: MIT / LLVM License

See the [LICENSE](https://github.com/Tajigaqzh/html-layout-parser/blob/main/LICENSE) file for details.
