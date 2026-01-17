# Node.js Environment Examples

Complete examples for using HTML Layout Parser v0.0.1 in Node.js environments.

## Table of Contents

1. [Basic Node.js Usage](#basic-nodejs-usage)
2. [File-Based Font Loading](#file-based-font-loading)
3. [Batch Processing](#batch-processing)
4. [Server-Side Rendering](#server-side-rendering)
5. [CLI Tool Example](#cli-tool-example)

---

## Basic Node.js Usage

Basic setup and usage in Node.js.

```typescript
// basic-node.ts

import { HtmlLayoutParser, CharLayout } from './lib/html-layout-parser/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';

async function basicNodeExample() {
  const parser = new HtmlLayoutParser();
  await parser.init('./lib/html-layout-parser/html_layout_parser.js');

  try {
    // Load font from file
    const fontPath = path.join(__dirname, 'fonts', 'arial.ttf');
    const fontData = new Uint8Array(await fs.readFile(fontPath));
    const fontId = parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(fontId);

    // Parse HTML
    const html = '<div style="font-size: 24px; color: #333333FF;">Hello from Node.js!</div>';
    const layouts: CharLayout[] = parser.parse(html, {
      viewportWidth: 800
    });

    console.log(`Parsed ${layouts.length} characters`);
    
    // Output character positions
    for (const char of layouts) {
      console.log(`'${char.character}' at (${char.x.toFixed(1)}, ${char.y.toFixed(1)})`);
    }

    return layouts;
  } finally {
    parser.destroy();
  }
}

basicNodeExample().catch(console.error);
```

---

## File-Based Font Loading

Using the Node.js-specific `loadFontFromFile` method.

```typescript
// file-font-loading.ts

import { HtmlLayoutParser } from './lib/html-layout-parser/index.js';
import * as path from 'path';

async function fileFontLoadingExample() {
  const parser = new HtmlLayoutParser();
  await parser.init('./lib/html-layout-parser/html_layout_parser.js');

  try {
    // Use the convenience method for Node.js
    const fontsDir = path.join(__dirname, 'fonts');

    // Load multiple fonts from files
    const fonts = [
      { file: 'arial.ttf', name: 'Arial' },
      { file: 'times.ttf', name: 'Times New Roman' },
      { file: 'courier.ttf', name: 'Courier New' }
    ];

    const fontIds: Map<string, number> = new Map();

    for (const font of fonts) {
      const fontPath = path.join(fontsDir, font.file);
      
      try {
        // loadFontFromFile is only available in Node.js
        const fontId = await parser.loadFontFromFile(fontPath, font.name);
        
        if (fontId > 0) {
          fontIds.set(font.name, fontId);
          console.log(`✓ Loaded ${font.name} (ID: ${fontId})`);
        }
      } catch (error) {
        console.warn(`✗ Failed to load ${font.name}:`, error);
      }
    }

    // Set default font
    const defaultId = fontIds.get('Arial');
    if (defaultId) {
      parser.setDefaultFont(defaultId);
    }

    // Parse HTML with multiple fonts
    const html = `
      <div style="font-family: Arial; font-size: 20px;">
        Arial text
      </div>
      <div style="font-family: 'Times New Roman'; font-size: 20px;">
        Times New Roman text
      </div>
      <div style="font-family: 'Courier New'; font-size: 16px;">
        Courier New text
      </div>
    `;

    const layouts = parser.parse(html, { viewportWidth: 600 });
    console.log(`\nParsed ${layouts.length} characters`);

    // Group by font
    const byFont = new Map<string, number>();
    for (const char of layouts) {
      const count = byFont.get(char.fontFamily) || 0;
      byFont.set(char.fontFamily, count + 1);
    }

    console.log('\nCharacters by font:');
    for (const [font, count] of byFont) {
      console.log(`  ${font}: ${count} characters`);
    }

    return layouts;
  } finally {
    parser.destroy();
  }
}

fileFontLoadingExample().catch(console.error);
```

---

## Batch Processing

Processing multiple HTML files efficiently.

```typescript
// batch-processing.ts

import { HtmlLayoutParser, CharLayout } from './lib/html-layout-parser/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ProcessingResult {
  file: string;
  characterCount: number;
  processingTime: number;
  success: boolean;
  error?: string;
}

async function batchProcessingExample() {
  const parser = new HtmlLayoutParser();
  await parser.init('./lib/html-layout-parser/html_layout_parser.js');

  try {
    // Load font once
    const fontPath = path.join(__dirname, 'fonts', 'arial.ttf');
    const fontId = await parser.loadFontFromFile(fontPath, 'Arial');
    parser.setDefaultFont(fontId);

    // Get all HTML files in directory
    const inputDir = path.join(__dirname, 'input');
    const outputDir = path.join(__dirname, 'output');

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Get HTML files
    const files = await fs.readdir(inputDir);
    const htmlFiles = files.filter(f => f.endsWith('.html'));

    console.log(`Processing ${htmlFiles.length} HTML files...`);

    const results: ProcessingResult[] = [];

    for (const file of htmlFiles) {
      const startTime = performance.now();
      const result: ProcessingResult = {
        file,
        characterCount: 0,
        processingTime: 0,
        success: false
      };

      try {
        // Read HTML file
        const htmlPath = path.join(inputDir, file);
        const html = await fs.readFile(htmlPath, 'utf-8');

        // Parse HTML
        const layouts = parser.parse(html, { viewportWidth: 800 });

        // Save result as JSON
        const outputPath = path.join(outputDir, file.replace('.html', '.json'));
        await fs.writeFile(outputPath, JSON.stringify(layouts, null, 2));

        result.characterCount = layouts.length;
        result.success = true;
      } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
      }

      result.processingTime = performance.now() - startTime;
      results.push(result);

      // Progress indicator
      const status = result.success ? '✓' : '✗';
      console.log(`${status} ${file} (${result.processingTime.toFixed(1)}ms)`);
    }

    // Summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const totalChars = successful.reduce((sum, r) => sum + r.characterCount, 0);
    const totalTime = results.reduce((sum, r) => sum + r.processingTime, 0);

    console.log('\n=== Summary ===');
    console.log(`Processed: ${successful.length}/${results.length} files`);
    console.log(`Total characters: ${totalChars}`);
    console.log(`Total time: ${totalTime.toFixed(1)}ms`);
    console.log(`Average: ${(totalTime / results.length).toFixed(1)}ms per file`);

    if (failed.length > 0) {
      console.log('\nFailed files:');
      for (const f of failed) {
        console.log(`  ${f.file}: ${f.error}`);
      }
    }

    return results;
  } finally {
    parser.destroy();
  }
}

batchProcessingExample().catch(console.error);
```

---

## Server-Side Rendering

Using the parser in an Express.js server.

```typescript
// server.ts

import express, { Request, Response } from 'express';
import { HtmlLayoutParser, CharLayout, LayoutDocument } from './lib/html-layout-parser/index.js';
import * as path from 'path';

// Parser singleton with lazy initialization
class ParserService {
  private parser: HtmlLayoutParser | null = null;
  private initPromise: Promise<void> | null = null;
  private loadedFonts: Map<string, number> = new Map();

  async ensureInitialized(): Promise<HtmlLayoutParser> {
    if (this.parser) {
      return this.parser;
    }

    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }

    await this.initPromise;
    return this.parser!;
  }

  private async initialize(): Promise<void> {
    this.parser = new HtmlLayoutParser();
    await this.parser.init('./lib/html-layout-parser/html_layout_parser.js');

    // Load default fonts
    const fontsDir = path.join(__dirname, 'fonts');
    const defaultFonts = [
      { file: 'arial.ttf', name: 'Arial' },
      { file: 'times.ttf', name: 'Times New Roman' }
    ];

    for (const font of defaultFonts) {
      try {
        const fontPath = path.join(fontsDir, font.file);
        const fontId = await this.parser.loadFontFromFile(fontPath, font.name);
        if (fontId > 0) {
          this.loadedFonts.set(font.name, fontId);
        }
      } catch (error) {
        console.warn(`Failed to load font ${font.name}:`, error);
      }
    }

    // Set default font
    const defaultId = this.loadedFonts.get('Arial');
    if (defaultId) {
      this.parser.setDefaultFont(defaultId);
    }

    console.log('Parser service initialized');
  }

  async parse(html: string, options: { viewportWidth: number; css?: string; mode?: string }): Promise<any> {
    const parser = await this.ensureInitialized();
    return parser.parse(html, options as any);
  }

  async parseWithDiagnostics(html: string, options: any): Promise<any> {
    const parser = await this.ensureInitialized();
    return parser.parseWithDiagnostics(html, options);
  }

  getLoadedFonts(): string[] {
    return Array.from(this.loadedFonts.keys());
  }

  async getMetrics(): Promise<any> {
    const parser = await this.ensureInitialized();
    return parser.getMemoryMetrics();
  }

  destroy(): void {
    if (this.parser) {
      this.parser.destroy();
      this.parser = null;
      this.initPromise = null;
      this.loadedFonts.clear();
    }
  }
}

// Create service instance
const parserService = new ParserService();

// Create Express app
const app = express();
app.use(express.json({ limit: '10mb' }));

// Parse HTML endpoint
app.post('/api/parse', async (req: Request, res: Response) => {
  try {
    const { html, css, viewportWidth = 800, mode = 'flat' } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    const result = await parserService.parse(html, {
      viewportWidth,
      css,
      mode
    });

    res.json({
      success: true,
      characterCount: Array.isArray(result) ? result.length : undefined,
      data: result
    });
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Parse with diagnostics endpoint
app.post('/api/parse/diagnostics', async (req: Request, res: Response) => {
  try {
    const { html, css, viewportWidth = 800, mode = 'flat' } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    const result = await parserService.parseWithDiagnostics(html, {
      viewportWidth,
      css,
      mode,
      enableMetrics: true
    });

    res.json(result);
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get loaded fonts
app.get('/api/fonts', async (_req: Request, res: Response) => {
  try {
    const fonts = parserService.getLoadedFonts();
    res.json({ fonts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get fonts' });
  }
});

// Get memory metrics
app.get('/api/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await parserService.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    parserService.destroy();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => {
    parserService.destroy();
    process.exit(0);
  });
});
```

### Client Usage

```typescript
// client.ts

async function parseHtml(html: string, css?: string): Promise<any> {
  const response = await fetch('http://localhost:3000/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html,
      css,
      viewportWidth: 800,
      mode: 'flat'
    })
  });

  return response.json();
}

// Usage
const result = await parseHtml(
  '<div class="title">Hello</div>',
  '.title { color: red; font-size: 24px; }'
);

console.log(result);
```

---

## CLI Tool Example

A command-line tool for parsing HTML files.

```typescript
#!/usr/bin/env node
// cli.ts

import { HtmlLayoutParser } from './lib/html-layout-parser/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';

interface CliOptions {
  input: string;
  output?: string;
  font?: string;
  width: number;
  mode: 'flat' | 'byRow' | 'simple' | 'full';
  css?: string;
  pretty: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    input: '',
    width: 800,
    mode: 'flat',
    pretty: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '-i':
      case '--input':
        options.input = args[++i];
        break;
      case '-o':
      case '--output':
        options.output = args[++i];
        break;
      case '-f':
      case '--font':
        options.font = args[++i];
        break;
      case '-w':
      case '--width':
        options.width = parseInt(args[++i], 10);
        break;
      case '-m':
      case '--mode':
        options.mode = args[++i] as any;
        break;
      case '-c':
      case '--css':
        options.css = args[++i];
        break;
      case '-p':
      case '--pretty':
        options.pretty = true;
        break;
      case '-h':
      case '--help':
        printHelp();
        process.exit(0);
      default:
        if (!options.input && !arg.startsWith('-')) {
          options.input = arg;
        }
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
HTML Layout Parser CLI

Usage: html-layout-parser [options] <input-file>

Options:
  -i, --input <file>    Input HTML file
  -o, --output <file>   Output JSON file (default: stdout)
  -f, --font <file>     Font file to use (TTF/OTF)
  -w, --width <number>  Viewport width (default: 800)
  -m, --mode <mode>     Output mode: flat, byRow, simple, full (default: flat)
  -c, --css <file>      External CSS file
  -p, --pretty          Pretty print JSON output
  -h, --help            Show this help message

Examples:
  html-layout-parser input.html
  html-layout-parser -i input.html -o output.json -w 1024
  html-layout-parser -i input.html -f arial.ttf -m full -p
  html-layout-parser -i input.html -c styles.css -o output.json
`);
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (!options.input) {
    console.error('Error: Input file is required');
    printHelp();
    process.exit(1);
  }

  const parser = new HtmlLayoutParser();

  try {
    await parser.init('./lib/html-layout-parser/html_layout_parser.js');

    // Load font
    if (options.font) {
      const fontPath = path.resolve(options.font);
      const fontName = path.basename(fontPath, path.extname(fontPath));
      const fontId = await parser.loadFontFromFile(fontPath, fontName);
      
      if (fontId > 0) {
        parser.setDefaultFont(fontId);
        console.error(`Loaded font: ${fontName}`);
      } else {
        console.error(`Warning: Failed to load font ${fontPath}`);
      }
    } else {
      // Try to load a default font
      const defaultFonts = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/System/Library/Fonts/Helvetica.ttc',
        'C:\\Windows\\Fonts\\arial.ttf'
      ];

      for (const fontPath of defaultFonts) {
        try {
          await fs.access(fontPath);
          const fontId = await parser.loadFontFromFile(fontPath, 'Default');
          if (fontId > 0) {
            parser.setDefaultFont(fontId);
            console.error(`Using default font: ${fontPath}`);
            break;
          }
        } catch {
          // Font not found, try next
        }
      }
    }

    // Read input HTML
    const inputPath = path.resolve(options.input);
    const html = await fs.readFile(inputPath, 'utf-8');

    // Read CSS if provided
    let css: string | undefined;
    if (options.css) {
      const cssPath = path.resolve(options.css);
      css = await fs.readFile(cssPath, 'utf-8');
    }

    // Parse HTML
    const result = parser.parse(html, {
      viewportWidth: options.width,
      mode: options.mode,
      css
    });

    // Format output
    const output = options.pretty
      ? JSON.stringify(result, null, 2)
      : JSON.stringify(result);

    // Write output
    if (options.output) {
      const outputPath = path.resolve(options.output);
      await fs.writeFile(outputPath, output);
      console.error(`Output written to: ${outputPath}`);
    } else {
      console.log(output);
    }

    // Print stats to stderr
    const charCount = Array.isArray(result) ? result.length : 'N/A';
    console.error(`Characters: ${charCount}`);

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    parser.destroy();
  }
}

main();
```

### Package.json for CLI

```json
{
  "name": "html-layout-parser-cli",
  "version": "0.0.1",
  "bin": {
    "html-layout-parser": "./dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/cli.js"
  },
  "dependencies": {
    "html-layout-parser": "^0.0.1"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Usage Examples

```bash
# Basic usage
html-layout-parser input.html

# With custom font and output file
html-layout-parser -i input.html -f ./fonts/arial.ttf -o output.json

# Full mode with pretty printing
html-layout-parser -i input.html -m full -p

# With external CSS
html-layout-parser -i input.html -c styles.css -w 1024 -o output.json

# Pipe to other tools
html-layout-parser input.html | jq '.[] | .character'
```
