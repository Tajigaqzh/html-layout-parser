# Changelog

All notable changes to HTML Layout Parser will be documented in this file.

## [0.2.0] - 2026-01-16

### Added
- Complete VitePress documentation with bilingual support (English/Chinese)
- Comprehensive API reference documentation
- Multiple example categories: Web, Worker, Node.js, Batch, Memory Management
- Performance benchmarks and optimization guides
- Error code reference with solutions

### Changed
- Updated documentation structure for better navigation
- Improved getting started guide with step-by-step instructions

### Performance
- Parse speed: 9,442 - 129,121 chars/sec
- Memory usage: Per font ≈ font file size
- WASM size: 2.25MB
- Startup time: ~7ms (warm), ~17ms (cold)
- Cache hit rate: 91.2%

## [0.1.0] - 2026-01-15

### Added
- Initial release of HTML Layout Parser v2
- WebAssembly-powered HTML/CSS parsing engine
- Multi-font management with automatic fallback
- Four output modes: flat, byRow, simple, full
- CSS separation support
- Cross-environment support: Web, Worker, Node.js
- Complete TypeScript type definitions
- Memory management with monitoring
- Debug mode for development
- Comprehensive error handling

### Features
- Character-level layout extraction for Canvas rendering
- Rich text attributes: shadows, decorations, transforms, opacity
- Font metrics caching for performance
- Strict memory management with automatic cleanup

### Technical
- Built on litehtml C++ library
- FreeType for font rendering
- Emscripten for WebAssembly compilation
