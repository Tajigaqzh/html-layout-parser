# Web Browser Examples

Complete examples for using HTML Layout Parser in web browser environments.

## Basic HTML Parsing

The simplest example of parsing HTML and getting character layouts.

```typescript
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser/web';

async function basicParsing() {
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
    parser.destroy();
  }
}
```

## Multi-Font Usage

Loading and using multiple fonts with font-family fallback.

```typescript
import { HtmlLayoutParser, FontInfo } from 'html-layout-parser/web';

async function multiFontExample() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load multiple fonts
    const fonts = [
      { url: '/fonts/arial.ttf', name: 'Arial' },
      { url: '/fonts/times.ttf', name: 'Times New Roman' },
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
      }
    }

    // Set default font
    const defaultFontId = fontIds.get('Arial');
    if (defaultFontId) {
      parser.setDefaultFont(defaultFontId);
    }

    // Parse HTML with font-family fallback
    const html = `
      <div style="font-family: 'Times New Roman', Georgia, Arial; font-size: 20px;">
        This text uses Times New Roman
      </div>
      <div style="font-family: 'Courier New', monospace; font-size: 16px;">
        This text uses Courier New
      </div>
    `;

    const layouts = parser.parse(html, { viewportWidth: 800 });
    
    // Check which fonts were used
    const usedFonts = new Set(layouts.map(c => c.fontFamily));
    console.log('Fonts used:', Array.from(usedFonts));

    return layouts;
  } finally {
    parser.destroy();
  }
}
```

## CSS Separation

Separating HTML content from CSS styles.

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/web';

async function cssSeparationExample() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load font
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(1);

    // HTML content (no inline styles)
    const html = `
      <div class="container">
        <h1 class="title">Welcome</h1>
        <p class="content">This is the main content.</p>
      </div>
    `;

    // CSS styles (separate from HTML)
    const css = `
      .title {
        font-size: 32px;
        font-weight: bold;
        color: #333333FF;
      }
      .content {
        font-size: 16px;
        color: #666666FF;
      }
    `;

    // Method 1: Using css option
    const layouts1 = parser.parse(html, {
      viewportWidth: 800,
      css: css
    });

    // Method 2: Using parseWithCSS
    const layouts2 = parser.parseWithCSS(html, css, {
      viewportWidth: 800
    });

    return layouts1;
  } finally {
    parser.destroy();
  }
}
```

## Canvas Rendering

Rendering parsed layouts to HTML Canvas.

```typescript
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser/web';

function parseColor(color: string): string {
  if (!color || color === '#00000000') return 'transparent';
  if (color.startsWith('#') && color.length === 9) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const a = parseInt(color.slice(7, 9), 16) / 255;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
  }
  return color;
}

async function canvasRenderingExample() {
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
    const ctx = canvas.getContext('2d')!;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render each character
    for (const char of layouts) {
      // Draw background
      if (char.backgroundColor && char.backgroundColor !== '#00000000') {
        ctx.fillStyle = parseColor(char.backgroundColor);
        ctx.fillRect(char.x, char.y, char.width, char.height);
      }

      // Set font
      ctx.font = `${char.fontStyle} ${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
      ctx.globalAlpha = char.opacity ?? 1;

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

      ctx.globalAlpha = 1;
    }

    return layouts;
  } finally {
    parser.destroy();
  }
}
```

## Theme Switching

Dynamic theme switching using CSS separation.

```typescript
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser/web';

const themes = {
  light: `
    .container { background-color: #FFFFFFFF; }
    .title { color: #1A1A1AFF; font-size: 24px; }
    .content { color: #333333FF; font-size: 16px; }
  `,
  dark: `
    .container { background-color: #1A1A1AFF; }
    .title { color: #FFFFFFFF; font-size: 24px; }
    .content { color: #CCCCCCFF; font-size: 16px; }
  `
};

class ThemeableRenderer {
  private parser: HtmlLayoutParser;
  private canvas: HTMLCanvasElement;
  private currentTheme: keyof typeof themes = 'light';
  private html: string = '';

  constructor(canvas: HTMLCanvasElement) {
    this.parser = new HtmlLayoutParser();
    this.canvas = canvas;
  }

  async init() {
    await this.parser.init();
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    this.parser.loadFont(fontData, 'Arial');
    this.parser.setDefaultFont(1);
  }

  setContent(html: string) {
    this.html = html;
    this.render();
  }

  setTheme(theme: keyof typeof themes) {
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

    // Render to canvas...
    this.renderToCanvas(layouts);
  }

  private renderToCanvas(layouts: CharLayout[]) {
    const ctx = this.canvas.getContext('2d')!;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (const char of layouts) {
      ctx.font = `${char.fontSize}px ${char.fontFamily}`;
      ctx.fillStyle = char.color;
      ctx.fillText(char.character, char.x, char.baseline);
    }
  }

  destroy() {
    this.parser.destroy();
  }
}

// Usage
async function themeSwitchingExample() {
  const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
  const renderer = new ThemeableRenderer(canvas);
  await renderer.init();

  renderer.setContent(`
    <div class="container">
      <h1 class="title">Welcome</h1>
      <p class="content">Theme-aware content</p>
    </div>
  `);

  // Switch themes
  document.getElementById('lightBtn')?.addEventListener('click', () => {
    renderer.setTheme('light');
  });

  document.getElementById('darkBtn')?.addEventListener('click', () => {
    renderer.setTheme('dark');
  });

  window.addEventListener('beforeunload', () => {
    renderer.destroy();
  });
}
```

## Complete Web Application

A complete example combining all features.

```typescript
import { 
  HtmlLayoutParser, 
  CharLayout, 
  FontInfo,
  ParseResultWithDiagnostics 
} from 'html-layout-parser/web';

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
    this.initialized = true;
  }

  async loadFont(url: string, name: string): Promise<number> {
    if (this.loadedFonts.has(name)) {
      return this.loadedFonts.get(name)!;
    }

    const response = await fetch(url);
    const data = new Uint8Array(await response.arrayBuffer());
    const fontId = this.parser.loadFont(data, name);

    if (fontId > 0) {
      this.loadedFonts.set(name, fontId);
    }
    return fontId;
  }

  setDefaultFont(fontName: string): boolean {
    const fontId = this.loadedFonts.get(fontName);
    if (fontId) {
      this.parser.setDefaultFont(fontId);
      return true;
    }
    return false;
  }

  renderWithDiagnostics(html: string, css?: string): ParseResultWithDiagnostics<CharLayout[]> {
    const result = this.parser.parseWithDiagnostics(html, {
      viewportWidth: this.canvas.width,
      css: css,
      enableMetrics: true
    });

    if (result.success && result.data) {
      this.renderToCanvas(result.data);
    }

    return result;
  }

  private renderToCanvas(layouts: CharLayout[]): void {
    const ctx = this.canvas.getContext('2d')!;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const char of layouts) {
      ctx.font = `${char.fontStyle} ${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
      ctx.fillStyle = char.color;
      ctx.fillText(char.character, char.x, char.baseline);
    }
  }

  checkMemory(): void {
    const metrics = this.parser.getMemoryMetrics();
    if (metrics) {
      const mb = (metrics.totalMemoryUsage / 1024 / 1024).toFixed(2);
      console.log(`Memory: ${mb} MB, Fonts: ${metrics.fontCount}`);
    }
  }

  destroy(): void {
    this.parser.destroy();
    this.loadedFonts.clear();
    this.initialized = false;
  }
}

// Usage
async function main() {
  const app = new HtmlLayoutApp('renderCanvas');
  
  try {
    await app.init();
    await app.loadFont('/fonts/arial.ttf', 'Arial');
    app.setDefaultFont('Arial');

    const result = app.renderWithDiagnostics(
      '<div class="title">Hello World</div>',
      '.title { font-size: 28px; color: #1A1A1AFF; }'
    );

    if (result.success) {
      console.log(`✅ Rendered ${result.metrics?.characterCount} characters`);
      console.log(`⏱️ Time: ${result.metrics?.totalTime}ms`);
    }

    app.checkMemory();
  } catch (error) {
    console.error('Error:', error);
  }

  window.addEventListener('beforeunload', () => {
    app.destroy();
  });
}

main();
```
