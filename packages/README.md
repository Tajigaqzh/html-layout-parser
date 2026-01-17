# HTML Layout Parser Packages

This directory contains all publishable packages for the HTML Layout Parser.

## Packages

| Package | Description | NPM |
|---------|-------------|-----|
| `html-layout-parser` | Unified package with auto-detection (recommended) | [![npm](https://img.shields.io/npm/v/html-layout-parser)](https://www.npmjs.com/package/html-layout-parser) |
| `html-layout-parser-web` | Web browser environment only | [![npm](https://img.shields.io/npm/v/html-layout-parser-web)](https://www.npmjs.com/package/html-layout-parser-web) |
| `html-layout-parser-worker` | Web Worker environment only | [![npm](https://img.shields.io/npm/v/html-layout-parser-worker)](https://www.npmjs.com/package/html-layout-parser-worker) |
| `html-layout-parser-node` | Node.js environment only | [![npm](https://img.shields.io/npm/v/html-layout-parser-node)](https://www.npmjs.com/package/html-layout-parser-node) |

## Which Package to Use?

### Unified Package (Recommended)

Use `html-layout-parser` for most projects:

```bash
pnpm add html-layout-parser
```

```typescript
// Auto-detect environment
import { HtmlLayoutParser } from 'html-layout-parser';

// Or use environment-specific imports
import { HtmlLayoutParser } from 'html-layout-parser/web';
import { HtmlLayoutParser } from 'html-layout-parser/worker';
import { HtmlLayoutParser } from 'html-layout-parser/node';
```

### Environment-Specific Packages

Use these for minimal bundle size when you only target one environment:

```bash
# Web browser only
pnpm add html-layout-parser-web

# Web Worker only
pnpm add html-layout-parser-worker

# Node.js only
pnpm add html-layout-parser-node
```

## Development

### Build All Packages

```bash
# From the wasm-v2 root directory
pnpm run build
```

### Build Individual Package

```bash
# Build specific package
cd packages/html-layout-parser
pnpm run build
```

### Run Type Checks

```bash
pnpm run typecheck
```

## Publishing

### Dry Run (Test)

```bash
./scripts/publish-all.sh --dry-run
```

### Publish All Packages

```bash
./scripts/publish-all.sh
```

### Version Bump

```bash
# Patch version (0.0.1 -> 0.0.2)
./scripts/version-bump.sh patch

# Minor version (0.0.1 -> 0.1.0)
./scripts/version-bump.sh minor

# Major version (0.0.1 -> 1.0.0)
./scripts/version-bump.sh major
```

## Package Structure

```
packages/
├── html-layout-parser/          # Unified package
│   ├── src/
│   │   ├── index.ts            # Auto-detect entry
│   │   ├── web.ts              # Web entry
│   │   ├── worker.ts           # Worker entry
│   │   ├── node.ts             # Node.js entry
│   │   ├── types.ts            # Type definitions
│   │   └── HtmlLayoutParser.ts # Core class
│   ├── dist/                   # Build output
│   ├── package.json
│   ├── tsconfig.json
│   └── tsup.config.ts
├── html-layout-parser-web/      # Web-only package
├── html-layout-parser-worker/   # Worker-only package
└── html-layout-parser-node/     # Node.js-only package
```

## Comparison

| Feature | Unified | Web | Worker | Node |
|---------|---------|-----|--------|------|
| Auto-detect environment | ✅ | ❌ | ❌ | ❌ |
| Web browser support | ✅ | ✅ | ❌ | ❌ |
| Web Worker support | ✅ | ❌ | ✅ | ❌ |
| Node.js support | ✅ | ❌ | ❌ | ✅ |
| File-based font loading | ✅ | ❌ | ❌ | ✅ |
| Bundle size | ~20KB | ~13KB | ~14KB | ~16KB |
| Tree-shaking | ✅* | N/A | N/A | N/A |

> *Tree-shaking: 统一包支持 tree-shaking，使用子路径导入（如 `html-layout-parser/web`）时可以排除其他环境的代码。独立包本身就是最小化的，不需要 tree-shaking。
