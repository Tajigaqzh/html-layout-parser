# 中文排版 - 标点符号处理

在渲染中文文本时，正确的标点符号处理对于专业排版至关重要。其中一个重要规则是**避头标点** - 某些标点符号不应出现在行首。

## 理解问题

解析器返回的字符位置是由布局引擎计算得出的。但是，它不会自动处理中文排版规则（如避头标点）。你需要在后处理中实现这些规则来实现正确的中文排版。

### 禁止出现在行首的标点

以下标点符号不应出现在行首：

**中文标点：**
- `，` (逗号)
- `。` (句号)
- `、` (顿号)
- `；` (分号)
- `：` (冒号)
- `！` (感叹号)
- `？` (问号)
- `）` (右括号)
- `】` (右方括号)
- `》` (右书名号)
- `"` (右双引号)
- `'` (右单引号)
- `…` (省略号)

**英文标点：**
- `,` `.` `;` `:` `!` `?` `)` `]` `>`

## 后处理解决方案

以下是处理行首标点的完整实现：

```typescript
interface CharInfo {
  char: string;
  x: number;
  y: number;
  width: number;
  height: number;
  lineIndex: number;
  // ... 其他属性
}

interface LineInfo {
  y: number;
  height: number;
  chars: CharInfo[];
}

interface MeasureResult {
  lines: LineInfo[];
  totalHeight: number;
  containerWidth: number;
}

/**
 * 检查字符是否为禁止出现在行首的标点
 */
function isLineStartForbiddenPunctuation(char: string): boolean {
  const forbiddenPunctuations = [
    // 英文标点
    ',', '.', ';', ':', '!', '?', ')', ']', '>',
    // 中文标点
    '\uFF0C', // ，
    '\u3002', // 。
    '\u3001', // 、
    '\uFF1B', // ；
    '\uFF1A', // ：
    '\uFF01', // ！
    '\uFF1F', // ？
    '\uFF09', // ）
    '\u3011', // 】
    '\u300B', // 》
    '\u201D', // "
    '\u2019', // '
    '\u2026'  // …
  ];
  
  return forbiddenPunctuations.includes(char);
}

/**
 * 将行首标点移到上一行末尾
 */
function handleLineStartPunctuation(result: MeasureResult): MeasureResult {
  const lines = result.lines;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.chars.length === 0) continue;
    
    const firstChar = line.chars[0];
    
    // 检查首字符是否为禁止标点
    if (isLineStartForbiddenPunctuation(firstChar.char)) {
      const prevLine = i > 0 ? lines[i - 1] : null;
      
      if (prevLine && prevLine.chars.length > 0) {
        // 将标点移到上一行
        const lastCharOfPrevLine = prevLine.chars[prevLine.chars.length - 1];
        
        // 更新标点位置
        firstChar.x = lastCharOfPrevLine.x + lastCharOfPrevLine.width;
        firstChar.y = lastCharOfPrevLine.y;
        firstChar.lineIndex = prevLine.chars[0].lineIndex;
        
        // 添加到上一行
        prevLine.chars.push(firstChar);
        
        // 从当前行移除
        line.chars.shift();
        
        // 重新分配当前行剩余字符的间距
        if (line.chars.length > 0) {
          redistributeLineSpacing(line, firstChar.width);
        }
      }
    }
  }
  
  // 移除空行
  result.lines = lines.filter(line => line.chars.length > 0);
  
  return result;
}

/**
 * 移动标点后重新分配间距
 * 将标点留下的空隙均匀分配到整行
 */
function redistributeLineSpacing(line: LineInfo, movedWidth: number): void {
  if (line.chars.length === 0) return;
  
  // 计算每个字符应分配的间隙
  const gapPerChar = movedWidth / line.chars.length;
  
  // 将所有字符左移，然后添加均匀间距
  for (let j = 0; j < line.chars.length; j++) {
    // 左移标点宽度
    line.chars[j].x -= movedWidth;
    // 添加均匀间距
    line.chars[j].x += (j + 1) * gapPerChar;
  }
}
```

## 使用示例

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

// 初始化解析器
const parser = new HtmlLayoutParser();
await parser.init();

// 加载字体
const fontData = await loadFontData();
const fontId = parser.loadFont(fontData, 'MyFont');
parser.setDefaultFont(fontId);

// 解析 HTML
const html = '<div>这是一段测试文本，包含标点符号。</div>';
const layouts = parser.parse(html, { 
  viewportWidth: 800,
  mode: 'byRow' // 使用按行输出模式，便于处理
});

// 转换为你的格式
const result: MeasureResult = convertToMeasureResult(layouts);

// 应用标点处理
const finalResult = handleLineStartPunctuation(result);

// 现在可以用正确的中文排版渲染了
renderToCanvas(finalResult);
```

## 替代方案：从源头预防

你也可以通过调整 HTML/CSS 来预防这个问题：

```html
<style>
  /* 使用 CSS 防止标点前换行 */
  .chinese-text {
    word-break: keep-all;
    overflow-wrap: break-word;
  }
  
  /* 或在标点前使用不换行空格 */
</style>

<div class="chinese-text">
  这是一段测试文本，包含标点符号。
</div>
```

但是，基于 CSS 的解决方案可能无法在所有情况下完美工作，因此后处理是最可靠的方法。

## 完整示例

以下是一个完整的工作示例：

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

class ChineseTextRenderer {
  private parser: HtmlLayoutParser;
  
  constructor() {
    this.parser = new HtmlLayoutParser();
  }
  
  async init(fontPath: string): Promise<void> {
    await this.parser.init();
    
    const response = await fetch(fontPath);
    const fontData = new Uint8Array(await response.arrayBuffer());
    const fontId = this.parser.loadFont(fontData, 'ChineseFont');
    this.parser.setDefaultFont(fontId);
  }
  
  async measure(html: string, width: number): Promise<MeasureResult> {
    // 使用 WASM 解析
    const layouts = this.parser.parse(html, {
      viewportWidth: width,
      mode: 'byRow'
    });
    
    // 转换为 MeasureResult 格式
    const result = this.convertLayouts(layouts, width);
    
    // 应用中文排版规则
    return handleLineStartPunctuation(result);
  }
  
  private convertLayouts(layouts: any, width: number): MeasureResult {
    // 将解析器输出转换为你的格式
    const lines: LineInfo[] = [];
    let totalHeight = 0;
    
    for (const row of layouts) {
      const chars: CharInfo[] = row.children.map((char: any, index: number) => ({
        char: char.character,
        x: char.x,
        y: char.y,
        width: char.width,
        height: char.height,
        fontSize: char.fontSize,
        fontFamily: char.fontFamily,
        fontWeight: String(char.fontWeight),
        color: char.color,
        italic: char.italic,
        lineIndex: row.rowIndex,
        originalIndex: index
      }));
      
      if (chars.length > 0) {
        const lineY = Math.min(...chars.map(c => c.y));
        const lineHeight = Math.max(...chars.map(c => c.height));
        
        lines.push({
          y: lineY,
          height: lineHeight,
          chars
        });
        
        totalHeight = Math.max(totalHeight, lineY + lineHeight);
      }
    }
    
    return { lines, totalHeight, containerWidth: width };
  }
  
  renderToCanvas(ctx: CanvasRenderingContext2D, result: MeasureResult): void {
    for (const line of result.lines) {
      for (const char of line.chars) {
        ctx.font = `${char.italic ? 'italic ' : ''}${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
        ctx.fillStyle = char.color;
        ctx.fillText(char.char, char.x, char.y + char.fontSize);
      }
    }
  }
}

// 使用方法
const renderer = new ChineseTextRenderer();
await renderer.init('/fonts/chinese-font.ttf');

const result = await renderer.measure(
  '<div>这是一段中文文本，包含各种标点符号。</div>',
  800
);

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
renderer.renderToCanvas(ctx, result);
```

## 要点总结

1. **解析器职责**：解析器提供基于布局计算的准确字符位置
2. **你的职责**：在后处理中应用排版规则（如避头标点）
3. **灵活性**：后处理允许你根据需要实现自定义排版规则
4. **性能**：后处理速度快，不影响解析性能

## 相关文档

- [Canvas 渲染指南](./canvas-rendering.md)
- [性能优化](./performance.md)
- [API 参考](../api/parser.md)
