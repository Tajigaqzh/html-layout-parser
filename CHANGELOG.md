# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-01-17

### Added

#### HTML Structure Wrapping
- 🔄 **Automatic HTML fragment wrapping**: Incomplete HTML fragments are now automatically wrapped in complete document structure
  - Fragments like `<div>Hello</div>` are wrapped with `<!DOCTYPE html><html><head>...</head><body>...</body></html>`
  - Complete documents (starting with `<!DOCTYPE` or `<html>`) are used as-is
  - Ensures accurate parsing by litehtml for all HTML inputs
  - No API changes required - existing code continues to work seamlessly
  - Handles edge cases: empty strings, whitespace, malformed HTML

#### Documentation
- ✨ Complete VitePress documentation site with bilingual support (English + Chinese)
- 📚 Comprehensive guides covering all features
- 📖 Full API reference documentation
- 💡 Practical examples for Web, Worker, and Node.js environments
- 🔧 Performance optimization guides
- 🐛 Error handling and debugging guides

#### GitHub Actions
- 🚀 Automatic documentation deployment to GitHub Pages
- ✅ CI workflow for testing and building
- 📦 Release workflow for version publishing
- 📝 Issue and PR templates

#### Features
- 🔤 Multi-font support with fallback chains
- 📦 Four output modes: flat, byRow, simple, full
- 🎨 CSS separation for flexible theming
- 💾 Strict memory management with monitoring
- ⚡ Smart caching system (91.2% hit rate)
- 🔍 Debug mode with detailed logging
- 🌐 Cross-environment support (Web/Worker/Node.js)

### Changed
- 📝 Updated all package versions to 0.0.1
- 🔄 Improved documentation structure
- 🎯 Enhanced API documentation with examples

### Fixed
- 🐛 Fixed VitePress ESM compatibility issues
- 🔧 Corrected version references in documentation

### Improved
- ⚡ Optimized memory usage and reduced memory footprint
- 🚀 Enhanced memory management efficiency
