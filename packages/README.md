# HTML Layout Parser Packages

This directory contains the main HTML Layout Parser package.

## Package Structure

- `html-layout-parser/` - Main package with all environments (web, node, worker)

## Building

```bash
# Build the main package
cd html-layout-parser
pnpm run build
```

## Publishing

```bash
# Publish the main package
cd html-layout-parser
npm publish
```

The main package publishes a single `dist/` directory with all JavaScript
entry points and one shared WASM file.

## Usage

After installing the package, import it directly:

```typescript
import { HtmlLayoutParser } from 'html-layout-parser'

const parser = new HtmlLayoutParser()
await parser.init()
```

Optional explicit entry points are still available:

- `html-layout-parser/web`
- `html-layout-parser/node`
- `html-layout-parser/worker`
