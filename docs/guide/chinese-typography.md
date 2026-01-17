# Chinese Typography - Punctuation Handling

When rendering Chinese text, proper punctuation handling is crucial for professional typography. One important rule is **avoiding line-start punctuation** (避头标点) - certain punctuation marks should not appear at the beginning of a line.

## Understanding the Issue

The parser returns character positions as calculated by the layout engine. However, it doesn't automatically handle Chinese typography rules like punctuation avoidance. You'll need to implement these rules in post-processing to achieve proper Chinese typography.

### Forbidden Line-Start Punctuation

These punctuation marks should not appear at the start of a line:

**Chinese Punctuation:**
- `，` (comma)
- `。` (period)
- `、` (enumeration comma)
- `；` (semicolon)
- `：` (colon)
- `！` (exclamation)
- `？` (question mark)
- `）` (right parenthesis)
- `】` (right bracket)
- `》` (right angle bracket)
- `"` (right quotation)
- `'` (right single quotation)
- `…` (ellipsis)

**English Punctuation:**
- `,` `.` `;` `:` `!` `?` `)` `]` `>`

## Post-Processing Solution

Here's a complete implementation for handling line-start punctuation:

```typescript
interface CharInfo {
  char: string;
  x: number;
  y: number;
  width: number;
  height: number;
  lineIndex: number;
  // ... other properties
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
 * Check if a character is forbidden at line start
 */
function isLineStartForbiddenPunctuation(char: string): boolean {
  const forbiddenPunctuations = [
    // English punctuation
    ',', '.', ';', ':', '!', '?', ')', ']', '>',
    // Chinese punctuation
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
 * Move line-start punctuation to previous line end
 */
function handleLineStartPunctuation(result: MeasureResult): MeasureResult {
  const lines = result.lines;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.chars.length === 0) continue;
    
    const firstChar = line.chars[0];
    
    // Check if first character is forbidden punctuation
    if (isLineStartForbiddenPunctuation(firstChar.char)) {
      const prevLine = i > 0 ? lines[i - 1] : null;
      
      if (prevLine && prevLine.chars.length > 0) {
        // Move punctuation to previous line
        const lastCharOfPrevLine = prevLine.chars[prevLine.chars.length - 1];
        
        // Update punctuation position
        firstChar.x = lastCharOfPrevLine.x + lastCharOfPrevLine.width;
        firstChar.y = lastCharOfPrevLine.y;
        firstChar.lineIndex = prevLine.chars[0].lineIndex;
        
        // Add to previous line
        prevLine.chars.push(firstChar);
        
        // Remove from current line
        line.chars.shift();
        
        // Redistribute remaining characters on current line
        if (line.chars.length > 0) {
          redistributeLineSpacing(line, firstChar.width);
        }
      }
    }
  }
  
  // Remove empty lines
  result.lines = lines.filter(line => line.chars.length > 0);
  
  return result;
}

/**
 * Redistribute spacing after moving punctuation
 * Evenly distribute the gap left by moved punctuation
 */
function redistributeLineSpacing(line: LineInfo, movedWidth: number): void {
  if (line.chars.length === 0) return;
  
  // Calculate gap per character
  const gapPerChar = movedWidth / line.chars.length;
  
  // Shift all characters left and add even spacing
  for (let j = 0; j < line.chars.length; j++) {
    // Move left by the punctuation width
    line.chars[j].x -= movedWidth;
    // Add back even spacing
    line.chars[j].x += (j + 1) * gapPerChar;
  }
}
```

## Usage Example

```typescript
import { HtmlLayoutParser } from '/html-layout-parser/index.js';

// Initialize parser
const parser = new HtmlLayoutParser();
await parser.init();

// Load font
const fontData = await loadFontData();
const fontId = parser.loadFont(fontData, 'MyFont');
parser.setDefaultFont(fontId);

// Parse HTML
const html = '<div>这是一段测试文本，包含标点符号。</div>';
const layouts = parser.parse(html, { 
  viewportWidth: 800,
  mode: 'byRow' // Use row-based output for easier processing
});

// Convert to your format
const result: MeasureResult = convertToMeasureResult(layouts);

// Apply punctuation handling
const finalResult = handleLineStartPunctuation(result);

// Now render with proper Chinese typography
renderToCanvas(finalResult);
```

## Alternative: Prevent at Source

You can also prevent the issue by adjusting your HTML/CSS:

```html
<style>
  /* Use CSS to prevent line breaks before punctuation */
  .chinese-text {
    word-break: keep-all;
    overflow-wrap: break-word;
  }
  
  /* Or use non-breaking spaces before punctuation */
</style>

<div class="chinese-text">
  这是一段测试文本，包含标点符号。
</div>
```

However, CSS-based solutions may not work perfectly in all cases, so post-processing is the most reliable approach.

## Complete Example

Here's a full working example:

```typescript
import { HtmlLayoutParser } from '/html-layout-parser/index.js';

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
    // Parse with WASM
    const layouts = this.parser.parse(html, {
      viewportWidth: width,
      mode: 'byRow'
    });
    
    // Convert to MeasureResult format
    const result = this.convertLayouts(layouts, width);
    
    // Apply Chinese typography rules
    return handleLineStartPunctuation(result);
  }
  
  private convertLayouts(layouts: any, width: number): MeasureResult {
    // Convert parser output to your format
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

// Usage
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

## Key Points

1. **Parser Responsibility**: The parser provides accurate character positions based on layout calculation
2. **Your Responsibility**: Apply typography rules (like punctuation avoidance) in post-processing
3. **Flexibility**: Post-processing allows you to implement custom typography rules as needed
4. **Performance**: Post-processing is fast and doesn't impact parsing performance

## See Also

- [Canvas Rendering Guide](./canvas-rendering.md)
- [Performance Optimization](./performance.md)
- [API Reference](../api/parser.md)
