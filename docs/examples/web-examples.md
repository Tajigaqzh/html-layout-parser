# Web Environment Examples

Complete examples for using HTML Layout Parser v0.0.1 in web browser environments.

## Table of Contents

1. [Basic HTML Parsing](#basic-html-parsing)
2. [Multi-Font Usage](#multi-font-usage)
3. [CSS Separation](#css-separation)
4. [Canvas Rendering](#canvas-rendering)
5. [Theme Switching](#theme-switching)
6. [Complete Web Application](#complete-web-application)

---

## Basic HTML Parsing

The simplest example of parsing HTML and getting character layouts.

```typescript
import { HtmlLayoutParser, CharLayout } from '/html-layout-parser/index.js';

async function basicParsing() {
  // Create and initialize parser
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load a font (required before parsing)
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    const fontId = parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(fontId);

    // Parse HTML
    const html = '<div style="font-size: 24px; color: blue;">Hello World</div>';
    const layouts: CharLayout[] = parser.parse(html, {
      viewportWidth: 800
    });

    // Process results
    console.log(`Parsed ${layouts.length} characters`);
    for (const char of layouts) {
      console.log(`'${char.character}' at (${char.x}, ${char.y})`);
    }

    return layouts;
  } finally {
    // Always clean up
    parser.destroy();
  }
}
```

---

## Multi-Font Usage

Loading and using multiple fonts with font-family fallback.

```typescript
import { HtmlLayoutParser, FontInfo } from '/html-layout-parser/index.js';

async function multiFontExample() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load multiple fonts
    const fonts = [
      { url: '/fonts/arial.ttf', name: 'Arial' },
      { url: '/fonts/times.ttf', name: 'Times New Roman' },
      { url: '/fonts/georgia.ttf', name: 'Georgia' },
      { url: '/fonts/courier.ttf', name: 'Courier New' }
    ];

    const fontIds: Map<string, number> = new Map();

    for (const font of fonts) {
      const response = await fetch(font.url);
      const data = new Uint8Array(await response.arrayBuffer());
      const fontId = parser.loadFont(data, font.name);
      
      if (fontId > 0) {
        fontIds.set(font.name, fontId);
        console.log(`Loaded ${font.name} with ID ${fontId}`);
      } else {
        console.warn(`Failed to load ${font.name}`);
      }
    }

    // Set default font
    const defaultFontId = fontIds.get('Arial');
    if (defaultFontId) {
      parser.setDefaultFont(defaultFontId);
    }

    // List loaded fonts
    const loadedFonts: FontInfo[] = parser.getLoadedFonts();
    console.log('Loaded fonts:', loadedFonts);

    // Parse HTML with font-family fallback
    const html = `
      <div style="font-family: 'Times New Roman', Georgia, Arial; font-size: 20px;">
        This text uses Times New Roman
      </div>
      <div style="font-family: 'Courier New', monospace; font-size: 16px;">
        This text uses Courier New
      </div>
      <div style="font-family: 'Unknown Font', Arial; font-size: 18px;">
        This falls back to Arial
      </div>
    `;

    const layouts = parser.parse(html, { viewportWidth: 800 });
    console.log(`Parsed ${layouts.length} characters`);

    // Check which fonts were used
    const usedFonts = new Set(layouts.map(c => c.fontFamily));
    console.log('Fonts used:', Array.from(usedFonts));

    return layouts;
  } finally {
    parser.destroy();
  }
}
```

---

## CSS Separation

Separating HTML content from CSS styles for flexible theming.

```typescript
import { HtmlLayoutParser } from '/html-layout-parser/index.js';

async function cssSeparationExample() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load font
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    const fontId = parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(fontId);

    // HTML content (no inline styles)
    const html = `
      <div class="container">
        <h1 class="title">Welcome</h1>
        <p class="content">This is the main content.</p>
        <button class="btn">Click Me</button>
      </div>
    `;

    // CSS styles (separate from HTML)
    const css = `
      .container {
        padding: 20px;
      }
      .title {
        font-size: 32px;
        font-weight: bold;
        color: #333333FF;
      }
      .content {
        font-size: 16px;
        line-height: 1.5;
        color: #666666FF;
      }
      .btn {
        font-size: 14px;
        color: #FFFFFFFF;
        background-color: #007BFFFF;
        padding: 10px 20px;
      }
    `;

    // Method 1: Using css option
    const layouts1 = parser.parse(html, {
      viewportWidth: 800,
      css: css
    });

    // Method 2: Using parseWithCSS convenience method
    const layouts2 = parser.parseWithCSS(html, css, {
      viewportWidth: 800
    });

    console.log(`Method 1: ${layouts1.length} characters`);
    console.log(`Method 2: ${layouts2.length} characters`);

    return layouts1;
  } finally {
    parser.destroy();
  }
}

// CSS Modules example - combining multiple CSS sources
async function cssModulesExample() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load font
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    // Base CSS (reset/normalize)
    const baseCSS = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; }
    `;

    // Component CSS
    const componentCSS = `
      .card {
        padding: 16px;
        border-radius: 8px;
      }
      .card-title {
        font-size: 18px;
        font-weight: bold;
      }
      .card-body {
        font-size: 14px;
      }
    `;

    // Theme CSS
    const themeCSS = `
      .card {
        background-color: #FFFFFFFF;
        color: #333333FF;
      }
      .card-title {
        color: #1A1A1AFF;
      }
    `;

    // Combine all CSS
    const combinedCSS = [baseCSS, componentCSS, themeCSS].join('\n');

    const html = `
      <div class="card">
        <div class="card-title">Card Title</div>
        <div class="card-body">Card content goes here.</div>
      </div>
    `;

    const layouts = parser.parse(html, {
      viewportWidth: 400,
      css: combinedCSS
    });

    return layouts;
  } finally {
    parser.destroy();
  }
}
```

---

## Canvas Rendering

Rendering parsed layouts to HTML Canvas.

```typescript
import { 
  HtmlLayoutParser, 
  CharLayout,
  LayoutDocument 
} from '/html-layout-parser/index.js';
import { 
  renderToCanvas, 
  renderCharacters,
  parseColor,
  buildFontString 
} from '/html-layout-parser/canvas.js';

// Basic Canvas rendering
async function basicCanvasRendering() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load font
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    // Parse HTML
    const html = `
      <div style="font-size: 24px; color: #FF0000FF;">
        Hello <span style="color: #0000FFFF; font-weight: bold;">World</span>!
      </div>
    `;

    const layouts = parser.parse(html, { viewportWidth: 800 });

    // Get canvas
    const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
    canvas.width = 800;
    canvas.height = 200;

    // Render using helper function
    renderCharacters(canvas, layouts, {
      scale: 1,
      renderBackgrounds: true,
      renderDecorations: true
    });

    return layouts;
  } finally {
    parser.destroy();
  }
}

// Manual Canvas rendering for more control
async function manualCanvasRendering() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load font
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    const html = `
      <div style="font-size: 20px; color: #333333FF; background-color: #F0F0F0FF;">
        Styled Text with <span style="text-decoration: underline; color: #0066CCFF;">underline</span>
      </div>
    `;

    const layouts = parser.parse(html, { viewportWidth: 600 });

    const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    canvas.width = 600;
    canvas.height = 100;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render each character manually
    for (const char of layouts) {
      // Draw background
      if (char.backgroundColor && char.backgroundColor !== '#00000000') {
        ctx.fillStyle = parseColor(char.backgroundColor);
        ctx.fillRect(char.x, char.y, char.width, char.height);
      }

      // Set font
      ctx.font = buildFontString(char);
      
      // Apply opacity
      ctx.globalAlpha = char.opacity;

      // Draw character
      ctx.fillStyle = parseColor(char.color);
      ctx.fillText(char.character, char.x, char.baseline);

      // Draw underline
      if (char.textDecoration?.underline) {
        ctx.strokeStyle = parseColor(char.textDecoration.color || char.color);
        ctx.lineWidth = char.textDecoration.thickness || 1;
        ctx.beginPath();
        ctx.moveTo(char.x, char.baseline + 2);
        ctx.lineTo(char.x + char.width, char.baseline + 2);
        ctx.stroke();
      }

      // Reset opacity
      ctx.globalAlpha = 1;
    }

    return layouts;
  } finally {
    parser.destroy();
  }
}

// Full mode rendering with blocks and lines
async function fullModeCanvasRendering() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load font
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    const html = `
      <div style="background-color: #E8E8E8FF; padding: 10px;">
        <h1 style="font-size: 28px; color: #222222FF;">Title</h1>
        <p style="font-size: 16px; color: #444444FF;">Paragraph text here.</p>
      </div>
    `;

    // Parse in full mode
    const doc = parser.parse<'full'>(html, {
      viewportWidth: 600,
      mode: 'full'
    });

    const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    canvas.width = 600;
    canvas.height = 300;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render using full document structure
    for (const page of doc.pages) {
      for (const block of page.blocks) {
        // Draw block background
        if (block.backgroundColor && block.backgroundColor !== '#00000000') {
          ctx.fillStyle = parseColor(block.backgroundColor);
          
          if (block.borderRadius > 0) {
            // Rounded rectangle
            roundRect(ctx, block.x, block.y, block.width, block.height, block.borderRadius);
            ctx.fill();
          } else {
            ctx.fillRect(block.x, block.y, block.width, block.height);
          }
        }

        // Render lines
        for (const line of block.lines) {
          if (line.runs) {
            for (const run of line.runs) {
              // Set run-level styles once
              ctx.font = `${run.fontStyle} ${run.fontWeight} ${run.fontSize}px ${run.fontFamily}`;
              ctx.fillStyle = parseColor(run.color);

              // Render all characters in run
              for (const char of run.characters) {
                ctx.fillText(char.character, char.x, char.baseline);
              }
            }
          }
        }
      }
    }

    return doc;
  } finally {
    parser.destroy();
  }
}

// Helper function for rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
```

---

## Theme Switching

Dynamic theme switching using CSS separation.

```typescript
import { HtmlLayoutParser, CharLayout } from '/html-layout-parser/index.js';
import { renderCharacters } from '/html-layout-parser/canvas.js';

// Theme definitions
const themes = {
  light: `
    .container { background-color: #FFFFFFFF; }
    .title { color: #1A1A1AFF; font-size: 24px; font-weight: bold; }
    .content { color: #333333FF; font-size: 16px; }
    .link { color: #0066CCFF; text-decoration: underline; }
    .button { 
      color: #FFFFFFFF; 
      background-color: #007BFFFF;
      font-size: 14px;
    }
  `,
  dark: `
    .container { background-color: #1A1A1AFF; }
    .title { color: #FFFFFFFF; font-size: 24px; font-weight: bold; }
    .content { color: #CCCCCCFF; font-size: 16px; }
    .link { color: #66B3FFFF; text-decoration: underline; }
    .button { 
      color: #FFFFFFFF; 
      background-color: #0056B3FF;
      font-size: 14px;
    }
  `,
  sepia: `
    .container { background-color: #F4ECD8FF; }
    .title { color: #5C4033FF; font-size: 24px; font-weight: bold; }
    .content { color: #704214FF; font-size: 16px; }
    .link { color: #8B4513FF; text-decoration: underline; }
    .button { 
      color: #FFFFFFFF; 
      background-color: #8B4513FF;
      font-size: 14px;
    }
  `
};

type ThemeName = keyof typeof themes;

class ThemeableRenderer {
  private parser: HtmlLayoutParser;
  private canvas: HTMLCanvasElement;
  private currentTheme: ThemeName = 'light';
  private html: string;

  constructor(canvas: HTMLCanvasElement) {
    this.parser = new HtmlLayoutParser();
    this.canvas = canvas;
    this.html = '';
  }

  async init() {
    await this.parser.init();

    // Load font
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    this.parser.loadFont(fontData, 'Arial');
    this.parser.setDefaultFont(1);
  }

  setContent(html: string) {
    this.html = html;
    this.render();
  }

  setTheme(theme: ThemeName) {
    this.currentTheme = theme;
    this.render();
  }

  private render() {
    if (!this.html) return;

    const css = themes[this.currentTheme];
    const layouts = this.parser.parse(this.html, {
      viewportWidth: this.canvas.width,
      css: css
    });

    renderCharacters(this.canvas, layouts);
  }

  destroy() {
    this.parser.destroy();
  }
}

// Usage example
async function themeSwitchingExample() {
  const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
  canvas.width = 600;
  canvas.height = 400;

  const renderer = new ThemeableRenderer(canvas);
  await renderer.init();

  // Set content
  const html = `
    <div class="container">
      <h1 class="title">Welcome to Our App</h1>
      <p class="content">
        This is some content that will change appearance based on the theme.
        Check out our <span class="link">documentation</span> for more info.
      </p>
      <span class="button">Get Started</span>
    </div>
  `;

  renderer.setContent(html);

  // Theme switching buttons
  document.getElementById('lightBtn')?.addEventListener('click', () => {
    renderer.setTheme('light');
  });

  document.getElementById('darkBtn')?.addEventListener('click', () => {
    renderer.setTheme('dark');
  });

  document.getElementById('sepiaBtn')?.addEventListener('click', () => {
    renderer.setTheme('sepia');
  });

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    renderer.destroy();
  });
}
```

---

## Complete Web Application

A complete example combining all features.

```typescript
import { 
  HtmlLayoutParser, 
  CharLayout, 
  FontInfo,
  MemoryMetrics,
  ParseResultWithDiagnostics 
} from '/html-layout-parser/index.js';
import { renderToCanvas } from '/html-layout-parser/canvas.js';

class HtmlLayoutApp {
  private parser: HtmlLayoutParser;
  private canvas: HTMLCanvasElement;
  private loadedFonts: Map<string, number> = new Map();
  private initialized = false;

  constructor(canvasId: string) {
    this.parser = new HtmlLayoutParser();
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    await this.parser.init();
    console.log(`Parser version: ${this.parser.getVersion()}`);
    console.log(`Environment: ${this.parser.getEnvironment()}`);

    this.initialized = true;
  }

  async loadFont(url: string, name: string): Promise<number> {
    // Check if already loaded
    if (this.loadedFonts.has(name)) {
      return this.loadedFonts.get(name)!;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch font: ${response.statusText}`);
      }

      const data = new Uint8Array(await response.arrayBuffer());
      const fontId = this.parser.loadFont(data, name);

      if (fontId > 0) {
        this.loadedFonts.set(name, fontId);
        console.log(`Loaded font '${name}' with ID ${fontId}`);
        return fontId;
      } else {
        throw new Error('Font loading returned invalid ID');
      }
    } catch (error) {
      console.error(`Failed to load font '${name}':`, error);
      return 0;
    }
  }

  setDefaultFont(fontName: string): boolean {
    const fontId = this.loadedFonts.get(fontName);
    if (fontId) {
      this.parser.setDefaultFont(fontId);
      return true;
    }
    return false;
  }

  parse(html: string, css?: string): CharLayout[] {
    return this.parser.parse(html, {
      viewportWidth: this.canvas.width,
      css: css
    });
  }

  parseWithDiagnostics(
    html: string, 
    css?: string
  ): ParseResultWithDiagnostics<CharLayout[]> {
    return this.parser.parseWithDiagnostics(html, {
      viewportWidth: this.canvas.width,
      css: css,
      enableMetrics: true
    });
  }

  render(html: string, css?: string): void {
    const layouts = this.parse(html, css);
    renderToCanvas(this.canvas, layouts);
  }

  renderWithDiagnostics(html: string, css?: string): ParseResultWithDiagnostics<CharLayout[]> {
    const result = this.parseWithDiagnostics(html, css);

    if (result.success && result.data) {
      renderToCanvas(this.canvas, result.data);
    }

    return result;
  }

  getLoadedFonts(): FontInfo[] {
    return this.parser.getLoadedFonts();
  }

  getMemoryMetrics(): MemoryMetrics | null {
    return this.parser.getMemoryMetrics();
  }

  checkMemory(): void {
    const metrics = this.getMemoryMetrics();
    if (metrics) {
      const mb = (metrics.totalMemoryUsage / 1024 / 1024).toFixed(2);
      console.log(`Memory usage: ${mb} MB`);
      console.log(`Loaded fonts: ${metrics.fontCount}`);

      if (this.parser.checkMemoryThreshold()) {
        console.warn('⚠️ Memory usage exceeds 50MB threshold!');
      }
    }
  }

  unloadFont(fontName: string): void {
    const fontId = this.loadedFonts.get(fontName);
    if (fontId) {
      this.parser.unloadFont(fontId);
      this.loadedFonts.delete(fontName);
      console.log(`Unloaded font '${fontName}'`);
    }
  }

  destroy(): void {
    this.parser.destroy();
    this.loadedFonts.clear();
    this.initialized = false;
    console.log('Parser destroyed');
  }
}

// Usage
async function main() {
  const app = new HtmlLayoutApp('renderCanvas');
  
  try {
    await app.init();

    // Load fonts
    await app.loadFont('/fonts/arial.ttf', 'Arial');
    await app.loadFont('/fonts/times.ttf', 'Times New Roman');
    app.setDefaultFont('Arial');

    // Render with diagnostics
    const html = `
      <div class="article">
        <h1 class="title">Article Title</h1>
        <p class="body">This is the article body with some text.</p>
      </div>
    `;

    const css = `
      .article { padding: 20px; }
      .title { font-size: 28px; color: #1A1A1AFF; font-weight: bold; }
      .body { font-size: 16px; color: #333333FF; line-height: 1.6; }
    `;

    const result = app.renderWithDiagnostics(html, css);

    if (result.success) {
      console.log(`✅ Rendered ${result.metrics?.characterCount} characters`);
      console.log(`⏱️ Total time: ${result.metrics?.totalTime}ms`);
      console.log(`🚀 Speed: ${result.metrics?.charsPerSecond} chars/sec`);
    } else {
      console.error('❌ Render failed:', result.errors);
    }

    // Check memory
    app.checkMemory();

  } catch (error) {
    console.error('Application error:', error);
  }

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    app.destroy();
  });
}

main();
```
