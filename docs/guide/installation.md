# Installation

## Package Installation

Install the HTML Layout Parser package from npm:

```bash
npm install html-layout-parser
```

## Setup for Different Environments

HTML Layout Parser provides pre-compiled bundles for different environments. After installation, you need to copy the appropriate bundle to your project.

### Web Browser Setup

1. **Copy the web bundle to your project:**

```bash
# Copy web bundle to your public directory
cp -r node_modules/html-layout-parser/web public/html-layout-parser
```

2. **Your project structure should look like:**

```
public/
  html-layout-parser/
    html_layout_parser.js    # WASM loader
    html_layout_parser.wasm  # WASM binary
    index.js                 # TypeScript compiled code
    index.d.ts               # Type definitions
```

3. **Load WASM globally in your HTML:**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Your App</title>
</head>
<body>
  <div id="app"></div>
  <!-- Load WASM module globally -->
  <script src="/html-layout-parser/html_layout_parser.js"></script>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

4. **Import in your code:**

```typescript
// Import from the copied files
import { HtmlLayoutParser } from '/html-layout-parser/index.js';

async function example() {
  const parser = new HtmlLayoutParser();
  await parser.init(); // Will use globally loaded WASM module
  
  // Load font and parse...
}
```

### Node.js Setup

1. **Copy the Node.js bundle:**

```bash
# Copy to your project's lib directory
cp -r node_modules/html-layout-parser/node ./src/lib/html-layout-parser
```

2. **Import in your Node.js code:**

```typescript
import { HtmlLayoutParser } from './lib/html-layout-parser/index.js';

async function example() {
  const parser = new HtmlLayoutParser();
  await parser.init('./lib/html-layout-parser/html_layout_parser.js');
  
  // Load font and parse...
}
```

### Web Worker Setup

1. **Copy the worker bundle:**

```bash
# Copy to your workers directory
cp -r node_modules/html-layout-parser/worker public/workers/html-layout-parser
```

2. **Import in your worker:**

```typescript
// In your worker file
import { HtmlLayoutParser } from '/workers/html-layout-parser/index.js';

async function example() {
  const parser = new HtmlLayoutParser();
  await parser.init('/workers/html-layout-parser/html_layout_parser.js');
  
  // Load font and parse...
}
```

## Why Manual Copy?

We recommend manual copying because:

- **🔒 Reliable**: Works with all bundlers and deployment environments
- **📦 Predictable**: WASM files are served as static assets
- **⚡ Fast**: No complex module resolution or dynamic imports
- **🌐 Compatible**: Works with CDNs, static hosting, and any web server
- **🎯 Simple**: Clear file locations and import paths
