# Node.js 示例

在 Node.js 环境中使用 HTML Layout Parser 的完整示例。

## 基础 Node.js 用法

```typescript
// 从环境特定入口点导入
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser/node';
import * as fs from 'fs/promises';
import * as path from 'path';

async function basicNodeExample() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // 从文件加载字体
    const fontPath = path.join(__dirname, 'fonts', 'arial.ttf');
    const fontData = new Uint8Array(await fs.readFile(fontPath));
    const fontId = parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(fontId);

    // 解析 HTML
    const html = '<div style="font-size: 24px; color: #333333FF;">来自 Node.js 的问候！</div>';
    const layouts: CharLayout[] = parser.parse(html, { viewportWidth: 800 });

    console.log(`解析了 ${layouts.length} 个字符`);
    
    for (const char of layouts) {
      console.log(`'${char.character}' 位于 (${char.x.toFixed(1)}, ${char.y.toFixed(1)})`);
    }

    return layouts;
  } finally {
    parser.destroy();
  }
}

basicNodeExample().catch(console.error);
```

## 基于文件的字体加载

使用 Node.js 特有的 `loadFontFromFile` 方法。

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/node';
import * as path from 'path';

async function fileFontLoadingExample() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    const fontsDir = path.join(__dirname, 'fonts');

    // 从文件加载多个字体
    const fonts = [
      { file: 'arial.ttf', name: 'Arial' },
      { file: 'times.ttf', name: 'Times New Roman' },
      { file: 'courier.ttf', name: 'Courier New' }
    ];

    const fontIds: Map<string, number> = new Map();

    for (const font of fonts) {
      const fontPath = path.join(fontsDir, font.file);
      
      try {
        // loadFontFromFile 仅在 Node.js 中可用
        const fontId = await parser.loadFontFromFile(fontPath, font.name);
        
        if (fontId > 0) {
          fontIds.set(font.name, fontId);
          console.log(`✓ 已加载 ${font.name} (ID: ${fontId})`);
        }
      } catch (error) {
        console.warn(`✗ 加载 ${font.name} 失败:`, error);
      }
    }

    // 设置默认字体
    const defaultId = fontIds.get('Arial');
    if (defaultId) {
      parser.setDefaultFont(defaultId);
    }

    // 解析包含多种字体的 HTML
    const html = `
      <div style="font-family: Arial; font-size: 20px;">Arial 文本</div>
      <div style="font-family: 'Times New Roman'; font-size: 20px;">Times 文本</div>
    `;

    const layouts = parser.parse(html, { viewportWidth: 600 });
    console.log(`\n解析了 ${layouts.length} 个字符`);

    return layouts;
  } finally {
    parser.destroy();
  }
}
```

## 批量处理

高效处理多个 HTML 文件。

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
    // 只加载一次字体
    const fontPath = path.join(__dirname, 'fonts', 'arial.ttf');
    const fontId = await parser.loadFontFromFile(fontPath, 'Arial');
    parser.setDefaultFont(fontId);

    const inputDir = path.join(__dirname, 'input');
    const outputDir = path.join(__dirname, 'output');

    await fs.mkdir(outputDir, { recursive: true });

    const files = await fs.readdir(inputDir);
    const htmlFiles = files.filter(f => f.endsWith('.html'));

    console.log(`处理 ${htmlFiles.length} 个 HTML 文件...`);

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

    // 摘要
    const successful = results.filter(r => r.success);
    const totalChars = successful.reduce((sum, r) => sum + r.characterCount, 0);
    const totalTime = results.reduce((sum, r) => sum + r.processingTime, 0);

    console.log('\n=== 摘要 ===');
    console.log(`已处理: ${successful.length}/${results.length} 个文件`);
    console.log(`总字符数: ${totalChars}`);
    console.log(`总耗时: ${totalTime.toFixed(1)}ms`);

    return results;
  } finally {
    parser.destroy();
  }
}
```

## 服务端渲染 (Express.js)

```typescript
import express, { Request, Response } from 'express';
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser/node';
import * as path from 'path';

// 解析器单例
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

    console.log('解析器服务已初始化');
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

// 解析 HTML 端点
app.post('/api/parse', async (req: Request, res: Response) => {
  try {
    const { html, css, viewportWidth = 800 } = req.body;

    if (!html) {
      return res.status(400).json({ error: '需要 HTML 内容' });
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
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 健康检查
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  server.close(() => {
    parserService.destroy();
    process.exit(0);
  });
});
```

## CLI 工具示例

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

用法: html-layout-parser [选项] <输入文件>

选项:
  -i, --input <文件>    输入 HTML 文件
  -o, --output <文件>   输出 JSON 文件 (默认: stdout)
  -f, --font <文件>     要使用的字体文件 (TTF/OTF)
  -w, --width <数字>    视口宽度 (默认: 800)
  -m, --mode <模式>     输出模式: flat, byRow, simple, full
  -c, --css <文件>      外部 CSS 文件
  -p, --pretty          美化 JSON 输出
  -h, --help            显示此帮助信息

示例:
  html-layout-parser input.html
  html-layout-parser -i input.html -o output.json -w 1024
  html-layout-parser -i input.html -f arial.ttf -m full -p
`);
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (!options.input) {
    console.error('错误: 需要输入文件');
    printHelp();
    process.exit(1);
  }

  const parser = new HtmlLayoutParser();

  try {
    await parser.init();

    // 加载字体
    if (options.font) {
      const fontPath = path.resolve(options.font);
      const fontName = path.basename(fontPath, path.extname(fontPath));
      const fontId = await parser.loadFontFromFile(fontPath, fontName);
      if (fontId > 0) parser.setDefaultFont(fontId);
    }

    // 读取输入 HTML
    const inputPath = path.resolve(options.input);
    const html = await fs.readFile(inputPath, 'utf-8');

    // 读取 CSS（如果提供）
    let css: string | undefined;
    if (options.css) {
      css = await fs.readFile(path.resolve(options.css), 'utf-8');
    }

    // 解析 HTML
    const result = parser.parse(html, {
      viewportWidth: options.width,
      mode: options.mode,
      css
    });

    // 格式化输出
    const output = options.pretty
      ? JSON.stringify(result, null, 2)
      : JSON.stringify(result);

    // 写入输出
    if (options.output) {
      await fs.writeFile(path.resolve(options.output), output);
      console.error(`输出已写入: ${options.output}`);
    } else {
      console.log(output);
    }

  } catch (error) {
    console.error('错误:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    parser.destroy();
  }
}

main();
```

### 使用示例

```bash
# 基础用法
html-layout-parser input.html

# 使用自定义字体和输出文件
html-layout-parser -i input.html -f ./fonts/arial.ttf -o output.json

# 完整模式并美化输出
html-layout-parser -i input.html -m full -p

# 使用外部 CSS
html-layout-parser -i input.html -c styles.css -w 1024 -o output.json
```
