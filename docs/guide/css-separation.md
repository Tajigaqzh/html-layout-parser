# CSS Separation

HTML Layout Parser supports separating HTML content from CSS styles, providing more flexible style management.

## Basic Usage

### Inline Styles
```typescript
const html = '<div style="color: red; font-size: 24px;">Hello</div>';
const layouts = parser.parse(html, { viewportWidth: 800 });
```

### External CSS
```typescript
const html = '<div class="title">Hello</div>';
const css = '.title { color: red; font-size: 24px; }';

// Method 1: Use css option
const layouts = parser.parse(html, {
  viewportWidth: 800,
  css: css
});

// Method 2: Use convenience method
const layouts2 = parser.parseWithCSS(html, css, { viewportWidth: 800 });
```

## CSS Priority

CSS styles are applied in the following priority order:

1. **Inline styles** (`style` attribute) - Highest priority
2. **External CSS** (`css` option)
3. **Browser default styles** - Lowest priority

```typescript
const html = `
  <div class="title" style="color: blue;">
    Hello World
  </div>
`;

const css = `
  .title {
    color: red;        /* Overridden by inline style */
    font-size: 24px;   /* Takes effect */
  }
`;

// Final result: color: blue, font-size: 24px
const layouts = parser.parse(html, { viewportWidth: 800, css });
```

## Merging Multiple CSS Sources

### Combining Multiple CSS Strings
```typescript
const baseCSS = `
  * { margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; }
`;

const componentCSS = `
  .card { padding: 16px; border-radius: 8px; }
  .card-title { font-size: 18px; font-weight: bold; }
`;

const themeCSS = `
  .card { background-color: #f5f5f5; }
  .card-title { color: #333; }
`;

// Merge all CSS
const combinedCSS = [baseCSS, componentCSS, themeCSS].join('\n');

const layouts = parser.parse(html, {
  viewportWidth: 800,
  css: combinedCSS
});
```

### CSS Module Example
```typescript
class CSSManager {
  private cssModules: Map<string, string> = new Map();

  addModule(name: string, css: string): void {
    this.cssModules.set(name, css);
  }

  removeModule(name: string): void {
    this.cssModules.delete(name);
  }

  getCombinedCSS(): string {
    return Array.from(this.cssModules.values()).join('\n');
  }
}

// Usage example
const cssManager = new CSSManager();

cssManager.addModule('reset', `
  * { margin: 0; padding: 0; box-sizing: border-box; }
`);

cssManager.addModule('typography', `
  h1 { font-size: 32px; font-weight: bold; }
  p { font-size: 16px; line-height: 1.5; }
`);

cssManager.addModule('colors', `
  .primary { color: #007bff; }
  .secondary { color: #6c757d; }
`);

const layouts = parser.parse(html, {
  viewportWidth: 800,
  css: cssManager.getCombinedCSS()
});
```

## Theme Switching

Implement dynamic theme switching using CSS separation:

```typescript
const themes = {
  light: `
    .container { background-color: #ffffff; color: #333333; }
    .title { color: #1a1a1a; }
    .content { color: #666666; }
  `,
  dark: `
    .container { background-color: #1a1a1a; color: #cccccc; }
    .title { color: #ffffff; }
    .content { color: #999999; }
  `,
  sepia: `
    .container { background-color: #f4ecd8; color: #704214; }
    .title { color: #5c4033; }
    .content { color: #8b4513; }
  `
};

class ThemeRenderer {
  private parser: HtmlLayoutParser;
  private currentTheme: keyof typeof themes = 'light';

  constructor() {
    this.parser = new HtmlLayoutParser();
  }

  async init(): Promise<void> {
    await this.parser.init();
    // Load fonts...
  }

  setTheme(theme: keyof typeof themes): void {
    this.currentTheme = theme;
  }

  render(html: string, viewportWidth: number): CharLayout[] {
    const css = themes[this.currentTheme];
    return this.parser.parse(html, { viewportWidth, css });
  }

  destroy(): void {
    this.parser.destroy();
  }
}

// Usage example
const renderer = new ThemeRenderer();
await renderer.init();

const html = `
  <div class="container">
    <h1 class="title">Title</h1>
    <p class="content">Content text</p>
  </div>
`;

// Switch themes
renderer.setTheme('dark');
const darkLayouts = renderer.render(html, 800);

renderer.setTheme('light');
const lightLayouts = renderer.render(html, 800);
```

## CSS Preprocessing

### CSS Variables Support
```typescript
const css = `
  :root {
    --primary-color: #007bff;
    --font-size-large: 24px;
  }
  
  .title {
    color: var(--primary-color);
    font-size: var(--font-size-large);
  }
`;

const layouts = parser.parse(html, { viewportWidth: 800, css });
```

### Media Queries
```typescript
const css = `
  .title {
    font-size: 16px;
  }
  
  @media (min-width: 768px) {
    .title {
      font-size: 24px;
    }
  }
`;

// Apply different styles based on viewport width
const mobileLayouts = parser.parse(html, { viewportWidth: 400, css });
const desktopLayouts = parser.parse(html, { viewportWidth: 1200, css });
```

## Style Caching

Implement caching for frequently used CSS:

```typescript
class CSSCache {
  private cache: Map<string, string> = new Map();

  getProcessedCSS(key: string, cssProcessor: () => string): string {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const processedCSS = cssProcessor();
    this.cache.set(key, processedCSS);
    return processedCSS;
  }

  clear(): void {
    this.cache.clear();
  }
}

const cssCache = new CSSCache();

// Cache processed CSS
const processedCSS = cssCache.getProcessedCSS('theme-light', () => {
  return combineAndMinifyCSS(baseCSS, lightThemeCSS);
});

const layouts = parser.parse(html, { viewportWidth: 800, css: processedCSS });
```

## Best Practices

### 1. Separate Structure and Style
```typescript
// ✅ Good practice
const html = '<div class="card"><h1 class="title">Title</h1></div>';
const css = '.card { padding: 20px; } .title { font-size: 24px; }';

// ❌ Avoid excessive inline styles
const html2 = '<div style="padding: 20px;"><h1 style="font-size: 24px;">Title</h1></div>';
```

### 2. Modularize CSS
```typescript
// Organize CSS by function
const layoutCSS = '/* Layout-related styles */';
const typographyCSS = '/* Typography-related styles */';
const colorCSS = '/* Color-related styles */';

const combinedCSS = [layoutCSS, typographyCSS, colorCSS].join('\n');
```

### 3. Theme System
```typescript
// Use CSS variables for themes
const themeCSS = `
  :root {
    --bg-color: #ffffff;
    --text-color: #333333;
  }
  
  [data-theme="dark"] {
    --bg-color: #1a1a1a;
    --text-color: #cccccc;
  }
`;
```

### 4. Performance Optimization
```typescript
// Cache commonly used CSS combinations
const cssCache = new Map<string, string>();

function getCachedCSS(key: string, css: string): string {
  if (!cssCache.has(key)) {
    cssCache.set(key, css);
  }
  return cssCache.get(key)!;
}
```

## Debugging Tips

### CSS Validation
```typescript
function validateCSS(css: string): boolean {
  try {
    // Try parsing CSS
    const result = parser.parseWithDiagnostics(html, { 
      viewportWidth: 800, 
      css 
    });
    
    if (result.errors?.some(e => e.code === 'CssParseError')) {
      console.error('CSS parse error');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('CSS validation failed:', error);
    return false;
  }
}
```

### Style Debugging
```typescript
const result = parser.parseWithDiagnostics(html, {
  viewportWidth: 800,
  css: css,
  enableMetrics: true
});

if (result.warnings) {
  for (const warning of result.warnings) {
    console.warn('CSS warning:', warning.message);
  }
}
```
