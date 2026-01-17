# Canvas 渲染

HTML Layout Parser 的输出格式专为 Canvas 2D API 设计，可以直接用于渲染。

## 基本渲染

### 简单字符渲染
```typescript
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser';

async function basicCanvasRendering() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // 加载字体
    const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
    parser.loadFont(new Uint8Array(fontData), 'Arial');
    parser.setDefaultFont(1);

    // 解析 HTML
    const html = '<div style="font-size: 24px; color: #FF0000FF;">Hello World</div>';
    const layouts = parser.parse(html, { viewportWidth: 800 });

    // 获取 Canvas
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    // 渲染每个字符
    for (const char of layouts) {
      ctx.font = `${char.fontSize}px ${char.fontFamily}`;
      ctx.fillStyle = char.color;
      ctx.fillText(char.character, char.x, char.baseline);
    }

  } finally {
    parser.destroy();
  }
}
```

## 颜色处理

### 颜色格式转换
HTML Layout Parser 使用 `#RRGGBBAA` 格式，需要转换为 Canvas 支持的格式：

```typescript
function parseColor(color: string): string {
  if (!color || color === 'transparent' || color === '#00000000') {
    return 'transparent';
  }
  
  if (color.startsWith('#') && color.length === 9) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const a = parseInt(color.slice(7, 9), 16) / 255;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
  }
  
  return color;
}

// 使用示例
for (const char of layouts) {
  ctx.fillStyle = parseColor(char.color);
  ctx.fillText(char.character, char.x, char.baseline);
}
```

## 完整渲染功能

### 支持所有文本属性
```typescript
function renderCharacter(ctx: CanvasRenderingContext2D, char: CharLayout) {
  // 1. 设置字体
  const fontStyle = char.fontStyle === 'italic' ? 'italic' : 'normal';
  const fontWeight = char.fontWeight || 400;
  ctx.font = `${fontStyle} ${fontWeight} ${char.fontSize}px ${char.fontFamily}`;

  // 2. 应用透明度
  ctx.globalAlpha = char.opacity ?? 1;

  // 3. 绘制字符
  ctx.fillStyle = parseColor(char.color);
  ctx.fillText(char.character, char.x, char.baseline);

  // 4. 绘制文本装饰
  if (char.textDecoration) {
    drawTextDecoration(ctx, char);
  }

  // 5. 重置透明度
  ctx.globalAlpha = 1;
}

function drawTextDecoration(ctx: CanvasRenderingContext2D, char: CharLayout) {
  const decoration = char.textDecoration;
  if (!decoration) return;

  ctx.strokeStyle = parseColor(decoration.color || char.color);
  ctx.lineWidth = decoration.thickness || 1;

  // 下划线
  if (decoration.underline) {
    ctx.beginPath();
    ctx.moveTo(char.x, char.baseline + 2);
    ctx.lineTo(char.x + char.width, char.baseline + 2);
    ctx.stroke();
  }

  // 删除线
  if (decoration.lineThrough) {
    const middleY = char.y + char.height / 2;
    ctx.beginPath();
    ctx.moveTo(char.x, middleY);
    ctx.lineTo(char.x + char.width, middleY);
    ctx.stroke();
  }

  // 上划线
  if (decoration.overline) {
    ctx.beginPath();
    ctx.moveTo(char.x, char.y);
    ctx.lineTo(char.x + char.width, char.y);
    ctx.stroke();
  }
}
```

## 性能优化

### 批量渲染优化
```typescript
function optimizedRender(ctx: CanvasRenderingContext2D, layouts: CharLayout[]) {
  // 按样式分组以减少状态切换
  const styleGroups = new Map<string, CharLayout[]>();

  for (const char of layouts) {
    const styleKey = `${char.fontFamily}-${char.fontSize}-${char.fontWeight}-${char.color}`;
    
    if (!styleGroups.has(styleKey)) {
      styleGroups.set(styleKey, []);
    }
    styleGroups.get(styleKey)!.push(char);
  }

  // 按组渲染
  for (const [styleKey, chars] of styleGroups) {
    const firstChar = chars[0];
    
    // 设置一次样式
    ctx.font = `${firstChar.fontStyle} ${firstChar.fontWeight} ${firstChar.fontSize}px ${firstChar.fontFamily}`;
    ctx.fillStyle = parseColor(firstChar.color);

    // 渲染所有相同样式的字符
    for (const char of chars) {
      ctx.fillText(char.character, char.x, char.baseline);
    }
  }
}
```

### 视口裁剪
```typescript
function renderWithClipping(
  ctx: CanvasRenderingContext2D, 
  layouts: CharLayout[],
  viewport: { x: number; y: number; width: number; height: number }
) {
  // 只渲染视口内的字符
  const visibleChars = layouts.filter(char => 
    char.x + char.width >= viewport.x &&
    char.x <= viewport.x + viewport.width &&
    char.y + char.height >= viewport.y &&
    char.y <= viewport.y + viewport.height
  );

  for (const char of visibleChars) {
    renderCharacter(ctx, char);
  }
}
```

## 高级渲染技术

### 渐变文本
```typescript
function renderGradientText(ctx: CanvasRenderingContext2D, char: CharLayout) {
  // 创建线性渐变
  const gradient = ctx.createLinearGradient(
    char.x, char.y,
    char.x + char.width, char.y + char.height
  );
  gradient.addColorStop(0, '#ff0000');
  gradient.addColorStop(1, '#0000ff');

  ctx.fillStyle = gradient;
  ctx.font = `${char.fontSize}px ${char.fontFamily}`;
  ctx.fillText(char.character, char.x, char.baseline);
}
```

### 文本描边
```typescript
function renderStrokedText(ctx: CanvasRenderingContext2D, char: CharLayout) {
  ctx.font = `${char.fontSize}px ${char.fontFamily}`;
  
  // 描边
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeText(char.character, char.x, char.baseline);
  
  // 填充
  ctx.fillStyle = parseColor(char.color);
  ctx.fillText(char.character, char.x, char.baseline);
}
```

### 文本变换
```typescript
function renderTransformedText(ctx: CanvasRenderingContext2D, char: CharLayout) {
  if (!char.transform) {
    renderCharacter(ctx, char);
    return;
  }

  ctx.save();

  // 移动到字符中心
  const centerX = char.x + char.width / 2;
  const centerY = char.y + char.height / 2;
  ctx.translate(centerX, centerY);

  // 应用变换
  const t = char.transform;
  ctx.scale(t.scaleX, t.scaleY);
  ctx.rotate(t.rotate * Math.PI / 180);
  ctx.transform(1, t.skewY, t.skewX, 1, 0, 0);

  // 渲染字符（相对于中心）
  ctx.font = `${char.fontSize}px ${char.fontFamily}`;
  ctx.fillStyle = parseColor(char.color);
  ctx.fillText(char.character, -char.width / 2, char.fontSize / 2);

  ctx.restore();
}
```

## 渲染工具类

```typescript
class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  render(layouts: CharLayout[], options: {
    enableDecorations?: boolean;
    enableTransforms?: boolean;
    clipToViewport?: boolean;
  } = {}): void {
    this.clear();

    for (const char of layouts) {
      this.renderCharacter(char, options);
    }
  }

  private renderCharacter(char: CharLayout, options: any): void {
    // 变换
    if (options.enableTransforms && char.transform) {
      renderTransformedText(this.ctx, char);
      return;
    }

    // 字体
    this.ctx.font = `${char.fontStyle} ${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
    this.ctx.globalAlpha = char.opacity ?? 1;

    // 文本
    this.ctx.fillStyle = parseColor(char.color);
    this.ctx.fillText(char.character, char.x, char.baseline);

    // 重置
    this.ctx.globalAlpha = 1;

    // 装饰
    if (options.enableDecorations && char.textDecoration) {
      drawTextDecoration(this.ctx, char);
    }
  }
}

// 使用示例
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const renderer = new CanvasRenderer(canvas);

const layouts = parser.parse(html, { viewportWidth: 800 });

renderer.render(layouts, {
  enableDecorations: true,
  enableTransforms: true
});
```

## 最佳实践

1. **批量渲染**: 按样式分组减少状态切换
2. **视口裁剪**: 只渲染可见区域的字符
3. **缓存字体**: 避免重复设置相同字体
4. **使用 requestAnimationFrame**: 平滑动画
5. **内存管理**: 及时清理不用的 Canvas 引用

```typescript
// 高性能渲染示例
class HighPerformanceRenderer {
  private ctx: CanvasRenderingContext2D;
  private fontCache: Map<string, string> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  render(layouts: CharLayout[]): void {
    // 按字体分组
    const fontGroups = this.groupByFont(layouts);

    for (const [fontKey, chars] of fontGroups) {
      this.setFont(fontKey);
      
      for (const char of chars) {
        this.ctx.fillStyle = parseColor(char.color);
        this.ctx.fillText(char.character, char.x, char.baseline);
      }
    }
  }

  private groupByFont(layouts: CharLayout[]): Map<string, CharLayout[]> {
    const groups = new Map<string, CharLayout[]>();
    
    for (const char of layouts) {
      const key = `${char.fontStyle} ${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(char);
    }
    
    return groups;
  }

  private setFont(fontKey: string): void {
    if (this.fontCache.get('current') !== fontKey) {
      this.ctx.font = fontKey;
      this.fontCache.set('current', fontKey);
    }
  }
}
```