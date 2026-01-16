# Node.js Examples

Complete examples for using HTML Layout Parser in Node.js environments.

## Basic Node.js Usage

```typescript
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser/node';
import * as fs from 'fs/promises';
import * as path from 'path';

async function basicNodeExample() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load font from file
    const fontPath = path.join(__dirname, 'fonts', 'arial.ttf');
    const fontData = new Uint8Array(await fs.readFile(fontPath));
    const fontId = parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(fontId);

    // Parse HTML
    const html = '<div style="font-size: 24px; color: #333333FF;">Hello from Node.js!</div>';
    const layouts: CharLayout[] = parser.parse(html, { viewportWidth: 800 });

    console.log(`Parsed ${layouts.length} characters`);
    
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

## File-Based Font Loading

Using the Node.js-specific `loadFontFromFile` method.

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/node';
import * as path from 'path';

async function fileFontLoadingExample() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
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
      <div style="font-family: Arial; font-size: 20px;">Arial text</div>
      <div style="font-family: 'Times New Roman'; font-size: 20px;">Times text</div>
    `;

    const layouts = parser.parse(html, { viewportWidth: 600 });
    console.log(`\nParsed ${layouts.length} characters`);

    return layouts;
  } finally {
    parser.destroy();
  }
}
```

## Batch Processing

Processing multiple HTML files efficiently.

```typescript
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser/node';
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
  await parser.init();

  try {
    // Load font once
    const fontPath = path.join(__dirname, 'fonts', 'arial.ttf');
    const fontId = await parser.loadFontFromFile(fontPath, 'Arial');
    parser.setDefaultFont(fontId);

    const inputDir = path.join(__dirname, 'input');
    const outputDir = path.join(__dirname, 'output');

    await fs.mkdir(outputDir, { recursive: true });

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
        const htmlPath = path.join(inputDir, file);
        const html = await fs.readFile(htmlPath, 'utf-8');

        const layouts = parser.parse(html, { viewportWidth: 800 });

        const outputPath = path.join(outputDir, file.replace('.html', '.json'));
        await fs.writeFile(outputPath, JSON.stringify(layouts, null, 2));

        result.characterCount = layouts.length;
        result.success = true;
      } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
      }

      result.processingTime = performance.now() - startTime;
      results.push(result);

      const status = result.success ? '✓' : '✗';
      console.log(`${status} ${file} (${result.processingTime.toFixed(1)}ms)`);
    }

    // Summary
    const successful = results.filter(r => r.success);
    const totalChars = successful.reduce((sum, r) => sum + r.characterCount, 0);
    const totalTime = results.reduce((sum, r) => sum + r.processingTime, 0);

    console.log('\n=== Summary ===');
    console.log(`Processed: ${successful.length}/${results.length} files`);
    console.log(`Total characters: ${totalChars}`);
    console.log(`Total time: ${totalTime.toFixed(1)}ms`);

    return results;
  } finally {
    parser.destroy();
  }
}
```

## Server-Side Rendering (Express.js)

```typescript
import express, { Request, Response } from 'express';
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser/node';
import * as path from 'path';

// Parser singleton
class ParserService {
  private parser: HtmlLayoutParser | null = null;
  private initPromise: Promise<void> | null = null;

  async ensureInitialized(): Promise<HtmlLayoutParser> {
    if (this.parser) return this.parser;

    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }

    await this.initPromise;
    return this.parser!;
  }

  private async initialize(): Promise<void> {
    this.parser = new HtmlLayoutParser();
    await this.parser.init();

    const fontPath = path.join(__dirname, 'fonts', 'arial.ttf');
    const fontId = await this.parser.loadFontFromFile(fontPath, 'Arial');
    this.parser.setDefaultFont(fontId);

    console.log('Parser service initialized');
  }

  async parse(html: string, options: { viewportWidth: number; css?: string }): Promise<CharLayout[]> {
    const parser = await this.ensureInitialized();
    return parser.parse(html, options);
  }

  destroy(): void {
    if (this.parser) {
      this.parser.destroy();
      this.parser = null;
      this.initPromise = null;
    }
  }
}

const parserService = new ParserService();
const app = express();
app.use(express.json({ limit: '10mb' }));

// Parse HTML endpoint
app.post('/api/parse', async (req: Request, res: Response) => {
  try {
    const { html, css, viewportWidth = 800 } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    const result = await parserService.parse(html, { viewportWidth, css });

    res.json({
      success: true,
      characterCount: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    parserService.destroy();
    process.exit(0);
  });
});
```

## CLI Tool Example

```typescript
#!/usr/bin/env node
import { HtmlLayoutParser } from 'html-layout-parser/node';
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
    switch (args[i]) {
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
        if (!options.input && !args[i].startsWith('-')) {
          options.input = args[i];
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
  -m, --mode <mode>     Output mode: flat, byRow, simple, full
  -c, --css <file>      External CSS file
  -p, --pretty          Pretty print JSON output
  -h, --help            Show this help message

Examples:
  html-layout-parser input.html
  html-layout-parser -i input.html -o output.json -w 1024
  html-layout-parser -i input.html -f arial.ttf -m full -p
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
    await parser.init();

    // Load font
    if (options.font) {
      const fontPath = path.resolve(options.font);
      const fontName = path.basename(fontPath, path.extname(fontPath));
      const fontId = await parser.loadFontFromFile(fontPath, fontName);
      if (fontId > 0) parser.setDefaultFont(fontId);
    }

    // Read input HTML
    const inputPath = path.resolve(options.input);
    const html = await fs.readFile(inputPath, 'utf-8');

    // Read CSS if provided
    let css: string | undefined;
    if (options.css) {
      css = await fs.readFile(path.resolve(options.css), 'utf-8');
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
      await fs.writeFile(path.resolve(options.output), output);
      console.error(`Output written to: ${options.output}`);
    } else {
      console.log(output);
    }

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    parser.destroy();
  }
}

main();
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
```
