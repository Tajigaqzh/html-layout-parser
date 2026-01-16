# Canvas Rendering

HTML Layout Parser's output format is designed specifically for the Canvas 2D API and can be used directly for rendering.

## Basic Rendering

### Simple Character Rendering
```typescript
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser';

async function basicCanvasRendering() {
  const parser = new HtmlLayoutParser();
  await parser.init();

  try {
    // Load font
    const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
    parser.loadFont(new Uint8Array(fontData), 'Arial');
    parser.setDefaultFont(1);

    // Parse HTML
    const html = '<div style="font-size: 24px; color: #FF0000FF;">Hello World</div>';
    const layouts = parser.parse(html, { viewportWidth: 800 });

    // Get Canvas
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;

    // Render each character
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

## Color Handling

### Color Format Conversion
HTML Layout Parser uses `#RRGGBBAA` format, which needs to be converted to Canvas-supported format:

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

// Usage example
for (const char of layouts) {
  ctx.fillStyle = parseColor(char.color);
  ctx.fillText(char.character, char.x, char.baseline);
}
```

## Complete Rendering Features

### Support All Text Attributes
```typescript
function renderCharacter(ctx: CanvasRenderingContext2D, char: CharLayout) {
  // 1. Draw background
  if (char.backgroundColor && char.backgroundColor !== '#00000000') {
    ctx.fillStyle = parseColor(char.backgroundColor);
    ctx.fillRect(char.x, char.y, char.width, char.height);
  }

  // 2. Set font
  const fontStyle = char.fontStyle === 'italic' ? 'italic' : 'normal';
  const fontWeight = char.fontWeight || 400;
  ctx.font = `${fontStyle} ${fontWeight} ${char.fontSize}px ${char.fontFamily}`;

  // 3. Apply opacity
  ctx.globalAlpha = char.opacity ?? 1;

  // 4. Draw text shadow
  if (char.textShadow && char.textShadow.length > 0) {
    const shadow = char.textShadow[0];
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;
    ctx.shadowBlur = shadow.blurRadius;
    ctx.shadowColor = parseColor(shadow.color);
  }

  // 5. Draw character
  ctx.fillStyle = parseColor(char.color);
  ctx.fillText(char.character, char.x, char.baseline);

  // 6. Reset shadow
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 0;

  // 7. Draw text decoration
  if (char.textDecoration) {
    drawTextDecoration(ctx, char);
  }

  // 8. Reset opacity
  ctx.globalAlpha = 1;
}

function drawTextDecoration(ctx: CanvasRenderingContext2D, char: CharLayout) {
  const decoration = char.textDecoration;
  if (!decoration) return;

  ctx.strokeStyle = parseColor(decoration.color || char.color);
  ctx.lineWidth = decoration.thickness || 1;

  // Underline
  if (decoration.underline) {
    ctx.beginPath();
    ctx.moveTo(char.x, char.baseline + 2);
    ctx.lineTo(char.x + char.width, char.baseline + 2);
    ctx.stroke();
  }

  // Line-through
  if (decoration.lineThrough) {
    const middleY = char.y + char.height / 2;
    ctx.beginPath();
    ctx.moveTo(char.x, middleY);
    ctx.lineTo(char.x + char.width, middleY);
    ctx.stroke();
  }

  // Overline
  if (decoration.overline) {
    ctx.beginPath();
    ctx.moveTo(char.x, char.y);
    ctx.lineTo(char.x + char.width, char.y);
    ctx.stroke();
  }
}
```

## Performance Optimization

### Batch Rendering Optimization
```typescript
function optimizedRender(ctx: CanvasRenderingContext2D, layouts: CharLayout[]) {
  // Group by style to reduce state changes
  const styleGroups = new Map<string, CharLayout[]>();

  for (const char of layouts) {
    const styleKey = `${char.fontFamily}-${char.fontSize}-${char.fontWeight}-${char.color}`;
    
    if (!styleGroups.has(styleKey)) {
      styleGroups.set(styleKey, []);
    }
    styleGroups.get(styleKey)!.push(char);
  }

  // Render by group
  for (const [styleKey, chars] of styleGroups) {
    const firstChar = chars[0];
    
    // Set style once
    ctx.font = `${firstChar.fontStyle} ${firstChar.fontWeight} ${firstChar.fontSize}px ${firstChar.fontFamily}`;
    ctx.fillStyle = parseColor(firstChar.color);

    // Render all characters with same style
    for (const char of chars) {
      ctx.fillText(char.character, char.x, char.baseline);
    }
  }
}
```

### Viewport Clipping
```typescript
function renderWithClipping(
  ctx: CanvasRenderingContext2D, 
  layouts: CharLayout[],
  viewport: { x: number; y: number; width: number; height: number }
) {
  // Only render characters within viewport
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

## Advanced Rendering Techniques

### Gradient Text
```typescript
function renderGradientText(ctx: CanvasRenderingContext2D, char: CharLayout) {
  // Create linear gradient
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

### Stroked Text
```typescript
function renderStrokedText(ctx: CanvasRenderingContext2D, char: CharLayout) {
  ctx.font = `${char.fontSize}px ${char.fontFamily}`;
  
  // Stroke
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeText(char.character, char.x, char.baseline);
  
  // Fill
  ctx.fillStyle = parseColor(char.color);
  ctx.fillText(char.character, char.x, char.baseline);
}
```

### Text Transforms
```typescript
function renderTransformedText(ctx: CanvasRenderingContext2D, char: CharLayout) {
  if (!char.transform) {
    renderCharacter(ctx, char);
    return;
  }

  ctx.save();

  // Move to character center
  const centerX = char.x + char.width / 2;
  const centerY = char.y + char.height / 2;
  ctx.translate(centerX, centerY);

  // Apply transform
  const t = char.transform;
  ctx.scale(t.scaleX, t.scaleY);
  ctx.rotate(t.rotate * Math.PI / 180);
  ctx.transform(1, t.skewY, t.skewX, 1, 0, 0);

  // Render character (relative to center)
  ctx.font = `${char.fontSize}px ${char.fontFamily}`;
  ctx.fillStyle = parseColor(char.color);
  ctx.fillText(char.character, -char.width / 2, char.fontSize / 2);

  ctx.restore();
}
```

## Renderer Utility Class

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
    enableShadows?: boolean;
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
    // Background
    if (char.backgroundColor && char.backgroundColor !== '#00000000') {
      this.ctx.fillStyle = parseColor(char.backgroundColor);
      this.ctx.fillRect(char.x, char.y, char.width, char.height);
    }

    // Transform
    if (options.enableTransforms && char.transform) {
      renderTransformedText(this.ctx, char);
      return;
    }

    // Font
    this.ctx.font = `${char.fontStyle} ${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
    this.ctx.globalAlpha = char.opacity ?? 1;

    // Shadow
    if (options.enableShadows && char.textShadow?.length > 0) {
      const shadow = char.textShadow[0];
      this.ctx.shadowOffsetX = shadow.offsetX;
      this.ctx.shadowOffsetY = shadow.offsetY;
      this.ctx.shadowBlur = shadow.blurRadius;
      this.ctx.shadowColor = parseColor(shadow.color);
    }

    // Text
    this.ctx.fillStyle = parseColor(char.color);
    this.ctx.fillText(char.character, char.x, char.baseline);

    // Reset
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1;

    // Decoration
    if (options.enableDecorations && char.textDecoration) {
      drawTextDecoration(this.ctx, char);
    }
  }
}

// Usage example
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const renderer = new CanvasRenderer(canvas);

const layouts = parser.parse(html, { viewportWidth: 800 });

renderer.render(layouts, {
  enableShadows: true,
  enableDecorations: true,
  enableTransforms: true
});
```

## Best Practices

1. **Batch Rendering**: Group by style to reduce state changes
2. **Viewport Clipping**: Only render visible characters
3. **Cache Fonts**: Avoid repeatedly setting the same font
4. **Use requestAnimationFrame**: For smooth animations
5. **Memory Management**: Clean up unused Canvas references promptly

```typescript
// High-performance rendering example
class HighPerformanceRenderer {
  private ctx: CanvasRenderingContext2D;
  private fontCache: Map<string, string> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  render(layouts: CharLayout[]): void {
    // Group by font
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
