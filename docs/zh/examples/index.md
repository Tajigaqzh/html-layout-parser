# 示例

这里提供了 HTML Layout Parser 在不同环境和场景下的使用示例。

## 快速导航

- [Web 浏览器示例](./web.md) - 在浏览器中使用解析器
- [Web Worker 示例](./worker.md) - 在 Worker 中进行后台解析
- [Node.js 示例](./node.md) - 服务端解析和处理
- [批量处理示例](./batch.md) - 高效处理大量文档
- [内存管理示例](./memory.md) - 内存优化和监控

## 基础示例

### 最简单的使用

```typescript
import { HtmlLayoutParser } from '/html-layout-parser/index.js';

async function basicExample() {
  const parser = new HtmlLayoutParser();
  
  try {
    // 1. 初始化
    await parser.init();
    
    // 2. 加载字体
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    const fontId = parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(fontId);
    
    // 3. 解析 HTML
    const html = '<div style="color: blue; font-size: 16px;">Hello World</div>';
    const layouts = parser.parse(html, { viewportWidth: 800 });
    
    // 4. 使用结果
    console.log(`解析得到 ${layouts.length} 个字符`);
    layouts.forEach(char => {
      console.log(`字符 "${char.character}" 位于 (${char.x}, ${char.y})`);
    });
    
  } finally {
    // 5. 清理资源
    parser.destroy();
  }
}

basicExample();
```

### Canvas 渲染示例

```typescript
function renderToCanvas(canvas: HTMLCanvasElement, layouts: CharLayout[]) {
  const ctx = canvas.getContext('2d')!;
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  for (const char of layouts) {
    // 设置字体
    ctx.font = `${char.fontStyle} ${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
    
    // 设置颜色和透明度
    ctx.fillStyle = char.color;
    ctx.globalAlpha = char.opacity;
    
    // 绘制背景
    if (char.backgroundColor !== '#00000000') {
      ctx.fillStyle = char.backgroundColor;
      ctx.fillRect(char.x, char.y - char.fontSize, char.width, char.height);
    }
    
    // 绘制字符
    ctx.fillStyle = char.color;
    ctx.fillText(char.character, char.x, char.baseline);
    
    // 绘制文本装饰
    if (char.textDecoration.underline) {
      ctx.strokeStyle = char.textDecoration.color || char.color;
      ctx.lineWidth = char.textDecoration.thickness;
      ctx.beginPath();
      ctx.moveTo(char.x, char.baseline + 2);
      ctx.lineTo(char.x + char.width, char.baseline + 2);
      ctx.stroke();
    }
  }
}

// 使用示例
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const layouts = parser.parse(html, { viewportWidth: 800 });
renderToCanvas(canvas, layouts);
```

## 不同输出模式示例

### Flat 模式（默认）

```typescript
// 最简单的字符数组
const layouts = parser.parse(html, { viewportWidth: 800 });

// 直接遍历所有字符
layouts.forEach(char => {
  console.log(`${char.character} at (${char.x}, ${char.y})`);
});
```

### ByRow 模式

```typescript
// 按行分组的字符
const rows = parser.parse<'byRow'>(html, { 
  viewportWidth: 800, 
  mode: 'byRow' 
});

// 按行处理
rows.forEach((row, rowIndex) => {
  console.log(`第 ${rowIndex + 1} 行 (Y=${row.y}, 高度=${row.height}):`);
  
  row.characters.forEach(char => {
    console.log(`  ${char.character} at (${char.x}, ${char.y})`);
  });
});
```

### Simple 模式

```typescript
// 简单的行结构
const simple = parser.parse<'simple'>(html, { 
  viewportWidth: 800, 
  mode: 'simple' 
});

console.log(`文档尺寸: ${simple.totalWidth}x${simple.totalHeight}`);
console.log(`总行数: ${simple.lines.length}`);

simple.lines.forEach((line, index) => {
  console.log(`行 ${index + 1}: ${line.characters.length} 个字符`);
});
```

### Full 模式

```typescript
// 完整的文档结构
const doc = parser.parse<'full'>(html, { 
  viewportWidth: 800, 
  mode: 'full' 
});

console.log('文档信息:');
console.log(`  尺寸: ${doc.totalWidth}x${doc.totalHeight}`);
console.log(`  元素数: ${doc.metadata.elementCount}`);
console.log(`  字符数: ${doc.metadata.characterCount}`);
console.log(`  解析时间: ${doc.metadata.parseTime}ms`);

// 遍历元素树
function traverseElement(element: LayoutElement, depth: number = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}<${element.tagName}> (${element.width}x${element.height})`);
  
  // 处理直接包含的字符
  element.characters.forEach(char => {
    console.log(`${indent}  "${char.character}"`);
  });
  
  // 递归处理子元素
  element.children.forEach(child => {
    traverseElement(child, depth + 1);
  });
}

traverseElement(doc.root);
```

## CSS 分离示例

### 基本 CSS 分离

```typescript
// HTML 内容（无内联样式）
const html = `
  <div class="container">
    <h1 class="title">欢迎使用 HTML Layout Parser</h1>
    <p class="description">高性能的 HTML 布局解析器</p>
    <div class="features">
      <span class="feature">多字体支持</span>
      <span class="feature">Canvas 渲染</span>
      <span class="feature">TypeScript</span>
    </div>
  </div>
`;

// CSS 样式（分离）
const css = `
  .container {
    padding: 20px;
    background-color: #f5f5f5;
  }
  
  .title {
    color: #333;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
  }
  
  .description {
    color: #666;
    font-size: 16px;
    margin-bottom: 20px;
  }
  
  .features {
    display: flex;
    gap: 10px;
  }
  
  .feature {
    background-color: #007acc;
    color: white;
    padding: 5px 10px;
    border-radius: 3px;
    font-size: 14px;
  }
`;

// 解析
const layouts = parser.parseWithCSS(html, css, { viewportWidth: 800 });
```

### 主题切换示例

```typescript
const themes = {
  light: `
    .title { color: #1a1a1a; }
    .description { color: #333; }
    .feature { background-color: #007acc; color: white; }
  `,
  dark: `
    .title { color: #ffffff; }
    .description { color: #ccc; }
    .feature { background-color: #444; color: #fff; }
  `,
  colorful: `
    .title { color: #e74c3c; }
    .description { color: #2ecc71; }
    .feature { background-color: #f39c12; color: #fff; }
  `
};

// 切换主题
function switchTheme(themeName: keyof typeof themes) {
  const themeCSS = themes[themeName];
  const layouts = parser.parseWithCSS(html, themeCSS, { viewportWidth: 800 });
  renderToCanvas(canvas, layouts);
}

// 使用示例
switchTheme('dark');
```

## 多字体示例

```typescript
async function multiplefontsExample() {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();
    
    // 加载多个字体
    const fonts = [
      { url: '/fonts/arial.ttf', name: 'Arial' },
      { url: '/fonts/times.ttf', name: 'Times New Roman' },
      { url: '/fonts/courier.ttf', name: 'Courier New' }
    ];
    
    const fontIds: Record<string, number> = {};
    
    for (const font of fonts) {
      const response = await fetch(font.url);
      const fontData = new Uint8Array(await response.arrayBuffer());
      const fontId = parser.loadFont(fontData, font.name);
      
      if (fontId > 0) {
        fontIds[font.name] = fontId;
        console.log(`字体 ${font.name} 加载成功，ID: ${fontId}`);
      }
    }
    
    // 设置默认字体
    parser.setDefaultFont(fontIds['Arial']);
    
    // 使用不同字体的 HTML
    const html = `
      <div>
        <p style="font-family: Arial;">这是 Arial 字体</p>
        <p style="font-family: 'Times New Roman';">这是 Times New Roman 字体</p>
        <p style="font-family: 'Courier New';">这是 Courier New 字体</p>
        <p style="font-family: NonExistent;">这会使用默认字体 (Arial)</p>
      </div>
    `;
    
    const layouts = parser.parse(html, { viewportWidth: 800 });
    
    // 统计字体使用情况
    const fontUsage: Record<string, number> = {};
    layouts.forEach(char => {
      fontUsage[char.fontFamily] = (fontUsage[char.fontFamily] || 0) + 1;
    });
    
    console.log('字体使用统计:', fontUsage);
    
  } finally {
    parser.destroy();
  }
}
```

## 错误处理示例

### 基本错误处理

```typescript
async function errorHandlingExample() {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();
    
    // 尝试解析可能有问题的 HTML
    const problematicHTML = '<div><p>未闭合的标签<div>嵌套错误</p>';
    
    const result = parser.parseWithDiagnostics(problematicHTML, {
      viewportWidth: 800,
      enableMetrics: true
    });
    
    if (result.success) {
      console.log('解析成功');
      console.log('字符数:', result.data.length);
      
      // 检查警告
      if (result.warnings?.length) {
        console.warn('解析警告:');
        result.warnings.forEach(warning => {
          console.warn(`  [${warning.code}] ${warning.message}`);
        });
      }
      
      // 检查性能
      if (result.metrics) {
        console.log('性能指标:');
        console.log(`  解析时间: ${result.metrics.parseTime}ms`);
        console.log(`  解析速度: ${result.metrics.charsPerSecond} 字符/秒`);
      }
      
    } else {
      console.error('解析失败');
      
      if (result.errors) {
        result.errors.forEach(error => {
          console.error(`错误 [${error.code}]: ${error.message}`);
          if (error.line && error.column) {
            console.error(`  位置: 第 ${error.line} 行, 第 ${error.column} 列`);
          }
          if (error.suggestion) {
            console.error(`  建议: ${error.suggestion}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('解析异常:', error);
  } finally {
    parser.destroy();
  }
}
```

### 重试机制示例

```typescript
async function parseWithRetry(
  html: string, 
  options: { viewportWidth: number },
  maxRetries: number = 3
): Promise<CharLayout[] | null> {
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const parser = new HtmlLayoutParser();
    
    try {
      await parser.init();
      
      // 尝试加载默认字体
      try {
        const fontResponse = await fetch('/fonts/arial.ttf');
        const fontData = new Uint8Array(await fontResponse.arrayBuffer());
        const fontId = parser.loadFont(fontData, 'Arial');
        parser.setDefaultFont(fontId);
      } catch (fontError) {
        console.warn(`尝试 ${attempt}: 字体加载失败，使用系统默认字体`);
      }
      
      // 尝试解析
      const layouts = parser.parse(html, options);
      console.log(`尝试 ${attempt}: 解析成功`);
      return layouts;
      
    } catch (error) {
      console.warn(`尝试 ${attempt} 失败:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('所有重试都失败了');
        return null;
      }
      
      // 等待一段时间再重试
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      
    } finally {
      parser.destroy();
    }
  }
  
  return null;
}

// 使用示例
const layouts = await parseWithRetry(html, { viewportWidth: 800 });
if (layouts) {
  console.log('解析成功，字符数:', layouts.length);
} else {
  console.error('解析最终失败');
}
```

## 性能监控示例

```typescript
class PerformanceMonitor {
  private parser: HtmlLayoutParser;
  private metrics: Array<{
    timestamp: number;
    htmlLength: number;
    parseTime: number;
    charsPerSecond: number;
    memoryUsage: number;
  }> = [];

  constructor(parser: HtmlLayoutParser) {
    this.parser = parser;
  }

  async monitoredParse(html: string, options: { viewportWidth: number }): Promise<CharLayout[]> {
    const startTime = performance.now();
    const startMemory = this.parser.getTotalMemoryUsage();
    
    const result = this.parser.parseWithDiagnostics(html, {
      ...options,
      enableMetrics: true
    });
    
    if (result.success && result.metrics) {
      this.metrics.push({
        timestamp: Date.now(),
        htmlLength: html.length,
        parseTime: result.metrics.totalTime,
        charsPerSecond: result.metrics.charsPerSecond,
        memoryUsage: this.parser.getTotalMemoryUsage()
      });
      
      return result.data;
    } else {
      throw new Error('解析失败');
    }
  }

  getAveragePerformance(): {
    avgParseTime: number;
    avgSpeed: number;
    avgMemoryUsage: number;
  } {
    if (this.metrics.length === 0) {
      return { avgParseTime: 0, avgSpeed: 0, avgMemoryUsage: 0 };
    }

    const totals = this.metrics.reduce((acc, metric) => ({
      parseTime: acc.parseTime + metric.parseTime,
      speed: acc.speed + metric.charsPerSecond,
      memory: acc.memory + metric.memoryUsage
    }), { parseTime: 0, speed: 0, memory: 0 });

    return {
      avgParseTime: totals.parseTime / this.metrics.length,
      avgSpeed: totals.speed / this.metrics.length,
      avgMemoryUsage: totals.memory / this.metrics.length
    };
  }

  generateReport(): string {
    const avg = this.getAveragePerformance();
    const latest = this.metrics[this.metrics.length - 1];
    
    return `
性能监控报告
============
总解析次数: ${this.metrics.length}
平均解析时间: ${avg.avgParseTime.toFixed(2)}ms
平均解析速度: ${avg.avgSpeed.toFixed(0)} 字符/秒
平均内存使用: ${(avg.avgMemoryUsage / 1024 / 1024).toFixed(2)} MB

最新解析:
- 时间: ${latest?.parseTime.toFixed(2)}ms
- 速度: ${latest?.charsPerSecond.toFixed(0)} 字符/秒
- 内存: ${((latest?.memoryUsage || 0) / 1024 / 1024).toFixed(2)} MB
    `.trim();
  }
}

// 使用示例
const monitor = new PerformanceMonitor(parser);

// 监控多次解析
const documents = [
  '<div>简单文档</div>',
  '<div style="color: red;">带样式的文档</div>',
  // ... 更多文档
];

for (const html of documents) {
  try {
    const layouts = await monitor.monitoredParse(html, { viewportWidth: 800 });
    console.log(`解析完成: ${layouts.length} 个字符`);
  } catch (error) {
    console.error('解析失败:', error);
  }
}

// 生成报告
console.log(monitor.generateReport());
```

## 实用工具函数

### HTML 清理工具

```typescript
function sanitizeHTML(html: string): string {
  return html
    // 移除脚本和样式
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    
    // 移除注释
    .replace(/<!--[\s\S]*?-->/g, '')
    
    // 移除危险属性
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    
    // 合并空白字符
    .replace(/\s+/g, ' ')
    .trim();
}
```

### 字符统计工具

```typescript
function analyzeLayouts(layouts: CharLayout[]): {
  totalChars: number;
  uniqueChars: number;
  fontUsage: Record<string, number>;
  colorUsage: Record<string, number>;
  avgCharWidth: number;
  avgCharHeight: number;
} {
  const uniqueChars = new Set<string>();
  const fontUsage: Record<string, number> = {};
  const colorUsage: Record<string, number> = {};
  let totalWidth = 0;
  let totalHeight = 0;

  for (const char of layouts) {
    uniqueChars.add(char.character);
    
    fontUsage[char.fontFamily] = (fontUsage[char.fontFamily] || 0) + 1;
    colorUsage[char.color] = (colorUsage[char.color] || 0) + 1;
    
    totalWidth += char.width;
    totalHeight += char.height;
  }

  return {
    totalChars: layouts.length,
    uniqueChars: uniqueChars.size,
    fontUsage,
    colorUsage,
    avgCharWidth: totalWidth / layouts.length,
    avgCharHeight: totalHeight / layouts.length
  };
}
```

### 布局导出工具

```typescript
function exportToJSON(layouts: CharLayout[]): string {
  return JSON.stringify(layouts, null, 2);
}

function exportToCSV(layouts: CharLayout[]): string {
  const headers = [
    'character', 'x', 'y', 'width', 'height', 'baseline',
    'fontFamily', 'fontSize', 'fontWeight', 'color'
  ];
  
  const rows = layouts.map(char => [
    char.character,
    char.x,
    char.y,
    char.width,
    char.height,
    char.baseline,
    char.fontFamily,
    char.fontSize,
    char.fontWeight,
    char.color
  ]);
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}
```

这些示例涵盖了 HTML Layout Parser 的主要使用场景。更多特定环境的详细示例，请查看对应的专门页面。
