# CSS 分离

HTML Layout Parser 支持将 HTML 内容与 CSS 样式分离，提供更灵活的样式管理。

## 基本用法

### 内联样式
```typescript
const html = '<div style="color: red; font-size: 24px;">Hello</div>';
const layouts = parser.parse(html, { viewportWidth: 800 });
```

### 外部 CSS
```typescript
const html = '<div class="title">Hello</div>';
const css = '.title { color: red; font-size: 24px; }';

// 方法 1: 使用 css 选项
const layouts = parser.parse(html, {
  viewportWidth: 800,
  css: css
});

// 方法 2: 使用便捷方法
const layouts2 = parser.parseWithCSS(html, css, { viewportWidth: 800 });
```

## CSS 优先级

CSS 样式按以下优先级应用：

1. **内联样式** (`style` 属性) - 最高优先级
2. **外部 CSS** (`css` 选项)
3. **浏览器默认样式** - 最低优先级

```typescript
const html = `
  <div class="title" style="color: blue;">
    Hello World
  </div>
`;

const css = `
  .title {
    color: red;        /* 被内联样式覆盖 */
    font-size: 24px;   /* 生效 */
  }
`;

// 最终效果: color: blue, font-size: 24px
const layouts = parser.parse(html, { viewportWidth: 800, css });
```

## 多 CSS 源合并

### 组合多个 CSS 字符串
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

// 合并所有 CSS
const combinedCSS = [baseCSS, componentCSS, themeCSS].join('\n');

const layouts = parser.parse(html, {
  viewportWidth: 800,
  css: combinedCSS
});
```

### CSS 模块化示例
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

// 使用示例
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

## 主题切换

利用 CSS 分离实现动态主题切换：

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
    // 加载字体...
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

// 使用示例
const renderer = new ThemeRenderer();
await renderer.init();

const html = `
  <div class="container">
    <h1 class="title">标题</h1>
    <p class="content">内容文本</p>
  </div>
`;

// 切换主题
renderer.setTheme('dark');
const darkLayouts = renderer.render(html, 800);

renderer.setTheme('light');
const lightLayouts = renderer.render(html, 800);
```

## CSS 预处理

### CSS 变量支持
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

### 媒体查询
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

// 根据视口宽度应用不同样式
const mobileLayouts = parser.parse(html, { viewportWidth: 400, css });
const desktopLayouts = parser.parse(html, { viewportWidth: 1200, css });
```

## 样式缓存

对于频繁使用的 CSS，可以实现缓存机制：

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

// 缓存处理后的 CSS
const processedCSS = cssCache.getProcessedCSS('theme-light', () => {
  return combineAndMinifyCSS(baseCSS, lightThemeCSS);
});

const layouts = parser.parse(html, { viewportWidth: 800, css: processedCSS });
```

## 最佳实践

### 1. 结构与样式分离
```typescript
// ✅ 好的做法
const html = '<div class="card"><h1 class="title">标题</h1></div>';
const css = '.card { padding: 20px; } .title { font-size: 24px; }';

// ❌ 避免过多内联样式
const html2 = '<div style="padding: 20px;"><h1 style="font-size: 24px;">标题</h1></div>';
```

### 2. CSS 模块化
```typescript
// 按功能组织 CSS
const layoutCSS = '/* 布局相关样式 */';
const typographyCSS = '/* 字体相关样式 */';
const colorCSS = '/* 颜色相关样式 */';

const combinedCSS = [layoutCSS, typographyCSS, colorCSS].join('\n');
```

### 3. 主题系统
```typescript
// 使用 CSS 变量实现主题
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

### 4. 性能优化
```typescript
// 缓存常用的 CSS 组合
const cssCache = new Map<string, string>();

function getCachedCSS(key: string, css: string): string {
  if (!cssCache.has(key)) {
    cssCache.set(key, css);
  }
  return cssCache.get(key)!;
}
```

## 调试技巧

### CSS 验证
```typescript
function validateCSS(css: string): boolean {
  try {
    // 尝试解析 CSS
    const result = parser.parseWithDiagnostics(html, { 
      viewportWidth: 800, 
      css 
    });
    
    if (result.errors?.some(e => e.code === 'CssParseError')) {
      console.error('CSS 解析错误');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('CSS 验证失败:', error);
    return false;
  }
}
```

### 样式调试
```typescript
const result = parser.parseWithDiagnostics(html, {
  viewportWidth: 800,
  css: css,
  enableMetrics: true
});

if (result.warnings) {
  for (const warning of result.warnings) {
    console.warn('CSS 警告:', warning.message);
  }
}
```