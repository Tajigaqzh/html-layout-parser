# 类型与接口

HTML Layout Parser 提供了完整的 TypeScript 类型定义，确保类型安全和良好的开发体验。

## 核心类型

### OutputMode

输出模式枚举，决定解析结果的数据结构。

```typescript
type OutputMode = 'flat' | 'byRow' | 'simple' | 'full';
```

- `'flat'` - 扁平字符数组（默认，最快）
- `'byRow'` - 按行分组的字符数组
- `'simple'` - 简单的行和字符结构
- `'full'` - 完整的文档层次结构

### ParseResult

根据输出模式返回不同类型的解析结果。

```typescript
type ParseResult<T extends OutputMode> = 
  T extends 'flat' ? CharLayout[] :
  T extends 'byRow' ? Row[] :
  T extends 'simple' ? SimpleOutput :
  T extends 'full' ? LayoutDocument :
  never;
```

## 输入类型

### ParseOptions

解析选项接口，配置解析行为。

```typescript
interface ParseOptions {
  viewportWidth: number;      // 必需：视口宽度（像素）
  viewportHeight?: number;    // 可选：视口高度（像素）
  mode?: OutputMode;          // 可选：输出模式，默认 'flat'
  defaultFontId?: number;     // 可选：默认字体 ID
  enableMetrics?: boolean;    // 可选：启用性能指标
  maxCharacters?: number;     // 可选：最大字符数限制
  timeout?: number;           // 可选：超时时间（毫秒）
  css?: string;               // 可选：外部 CSS 字符串
  isDebug?: boolean;          // 可选：启用调试模式
}
```

**使用示例：**
```typescript
const options: ParseOptions = {
  viewportWidth: 800,
  viewportHeight: 600,
  mode: 'byRow',
  enableMetrics: true,
  maxCharacters: 50000,
  timeout: 10000,
  css: '.title { color: red; }',
  isDebug: true
};
```

## 输出类型

### CharLayout

字符布局信息，包含位置、样式和字体信息。

```typescript
interface CharLayout {
  // 基本信息
  character: string;          // 字符内容
  x: number;                  // X 坐标（像素）
  y: number;                  // Y 坐标（像素）
  width: number;              // 字符宽度（像素）
  height: number;             // 字符高度（像素）
  baseline: number;           // 基线 Y 坐标（像素）
  
  // 字体属性
  fontFamily: string;         // 字体族名
  fontSize: number;           // 字体大小（像素）
  fontWeight: number;         // 字体粗细 (100-900)
  fontStyle: string;          // 字体样式 ('normal' | 'italic' | 'oblique')
  fontId: number;             // 字体 ID
  
  // 颜色属性
  color: string;              // 文字颜色 (RGBA: #RRGGBBAA)
  backgroundColor: string;    // 背景颜色 (RGBA: #RRGGBBAA) - 始终透明（未提取）
  opacity: number;            // 透明度 (0-1) - 始终 1.0（未提取）
  
  // 文本装饰
  textDecoration: TextDecoration;
  
  // 间距
  letterSpacing: number;      // 字符间距（像素）- 始终 0（未提取）
  wordSpacing: number;        // 单词间距（像素）- 始终 0（未提取）
  
  // 变换（当前不支持）
  transform: TextTransform;   // 始终为默认值 - 不支持 transform
  
  // 文本方向
  direction: 'ltr' | 'rtl';   // 文本方向 - 始终 'ltr'（未提取）
}
```

::: warning 属性提取限制
由于底层渲染引擎的架构限制，某些 CSS 属性无法在字符级别提取：
- `backgroundColor` - 不提取字符背景色（始终透明）
- `opacity` - 不提取透明度（始终 1.0）
- `letterSpacing` / `wordSpacing` - 不提取间距（始终 0）
- `transform` - 不提取 CSS 变换（始终默认值）
- `direction` - 不提取文本方向（始终 'ltr'）

**支持的属性**：字符位置、尺寸、字体属性（字体族、大小、粗细、样式）、文字颜色、文本装饰（下划线、删除线、上划线）。

**不支持的属性**：某些 CSS 属性（如 `text-shadow`）不被底层 [litehtml](http://www.litehtml.com/) 渲染引擎支持。完整的支持属性列表请参考 [litehtml 文档](https://github.com/litehtml/litehtml)。
:::

**使用示例：**
```typescript
function renderCharacter(ctx: CanvasRenderingContext2D, char: CharLayout) {
  ctx.font = `${char.fontStyle} ${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
  ctx.fillStyle = char.color;
  ctx.globalAlpha = char.opacity;
  ctx.fillText(char.character, char.x, char.baseline);
}
```

### TextDecoration

文本装饰信息。

```typescript
interface TextDecoration {
  underline: boolean;         // 下划线
  overline: boolean;          // 上划线
  lineThrough: boolean;       // 删除线
  color: string;              // 装饰线颜色 (RGBA)
  style: DecorationStyle;     // 装饰线样式
  thickness: number;          // 装饰线粗细（像素）
}

type DecorationStyle = 'solid' | 'double' | 'dotted' | 'dashed' | 'wavy';
```

**使用示例：**
```typescript
function drawTextDecoration(ctx: CanvasRenderingContext2D, char: CharLayout) {
  const decoration = char.textDecoration;
  
  if (decoration.underline) {
    ctx.strokeStyle = decoration.color;
    ctx.lineWidth = decoration.thickness;
    ctx.setLineDash(decoration.style === 'dashed' ? [5, 5] : []);
    
    ctx.beginPath();
    ctx.moveTo(char.x, char.baseline + 2);
    ctx.lineTo(char.x + char.width, char.baseline + 2);
    ctx.stroke();
  }
}
```

### TextTransform

文本变换信息。

```typescript
interface TextTransform {
  scaleX: number;             // X 轴缩放
  scaleY: number;             // Y 轴缩放
  skewX: number;              // X 轴倾斜（度）
  skewY: number;              // Y 轴倾斜（度）
  rotate: number;             // 旋转角度（度）
}
```

### Row

按行分组的字符布局（`byRow` 模式）。

```typescript
interface Row {
  y: number;                  // 行的 Y 坐标
  height: number;             // 行高
  baseline: number;           // 行基线
  characters: CharLayout[];   // 该行的字符
}
```

**使用示例：**
```typescript
const rows = parser.parse<'byRow'>(html, { 
  viewportWidth: 800, 
  mode: 'byRow' 
});

rows.forEach(row => {
  console.log(`行 Y=${row.y}, 高度=${row.height}, 字符数=${row.characters.length}`);
});
```

### SimpleOutput

简单输出结构（`simple` 模式）。

```typescript
interface SimpleOutput {
  lines: Line[];              // 文本行数组
  totalWidth: number;         // 总宽度
  totalHeight: number;        // 总高度
}

interface Line {
  y: number;                  // 行 Y 坐标
  height: number;             // 行高
  baseline: number;           // 基线
  width: number;              // 行宽度
  characters: CharLayout[];   // 字符数组
}
```

**使用示例：**
```typescript
const simple = parser.parse<'simple'>(html, { 
  viewportWidth: 800, 
  mode: 'simple' 
});

console.log(`文档尺寸: ${simple.totalWidth}x${simple.totalHeight}`);
console.log(`行数: ${simple.lines.length}`);
```

### LayoutDocument

完整文档结构（`full` 模式）。

```typescript
interface LayoutDocument {
  root: LayoutElement;        // 根元素
  totalWidth: number;         // 文档总宽度
  totalHeight: number;        // 文档总高度
  metadata: DocumentMetadata; // 文档元数据
}

interface LayoutElement {
  tagName: string;            // 标签名
  x: number;                  // X 坐标
  y: number;                  // Y 坐标
  width: number;              // 宽度
  height: number;             // 高度
  styles: ComputedStyles;     // 计算后的样式
  children: LayoutElement[];  // 子元素
  characters: CharLayout[];   // 直接包含的字符
}

interface DocumentMetadata {
  parseTime: number;          // 解析时间（毫秒）
  elementCount: number;       // 元素数量
  characterCount: number;     // 字符数量
}
```

## 诊断类型

### DiagnosticResult

诊断结果，包含成功状态和详细信息。

```typescript
interface DiagnosticResult<T extends OutputMode = 'flat'> {
  success: boolean;           // 是否成功
  data?: ParseResult<T>;      // 解析结果数据
  errors?: ParseError[];      // 错误列表
  warnings?: ParseWarning[];  // 警告列表
  metrics?: PerformanceMetrics; // 性能指标
}
```

**使用示例：**
```typescript
const result = parser.parseWithDiagnostics(html, { viewportWidth: 800 });

if (result.success) {
  console.log('解析成功');
  processLayouts(result.data!);
} else {
  console.error('解析失败');
  result.errors?.forEach(error => {
    console.error(`错误: ${error.message}`);
  });
}
```

### ParseError

解析错误信息。

```typescript
interface ParseError {
  code: number;               // 错误代码
  message: string;            // 错误消息
  line?: number;              // 错误行号
  column?: number;            // 错误列号
  suggestion?: string;        // 修复建议
}
```

### ParseWarning

解析警告信息。

```typescript
interface ParseWarning {
  code: number;               // 警告代码
  message: string;            // 警告消息
  line?: number;              // 警告行号
  column?: number;            // 警告列号
}
```

### PerformanceMetrics

性能指标信息。

```typescript
interface PerformanceMetrics {
  parseTime: number;          // HTML 解析时间（毫秒）
  layoutTime: number;         // 布局计算时间（毫秒）
  serializationTime: number;  // 序列化时间（毫秒）
  totalTime: number;          // 总时间（毫秒）
  characterCount: number;     // 字符数量
  charsPerSecond: number;     // 解析速度（字符/秒）
}
```

**使用示例：**
```typescript
const result = parser.parseWithDiagnostics(html, {
  viewportWidth: 800,
  enableMetrics: true
});

if (result.metrics) {
  console.log(`解析速度: ${result.metrics.charsPerSecond} 字符/秒`);
  console.log(`总时间: ${result.metrics.totalTime}ms`);
}
```

## 内存管理类型

### MemoryMetrics

内存使用指标。

```typescript
interface MemoryMetrics {
  totalMemoryUsage: number;   // 总内存使用（字节）
  fontCount: number;          // 字体数量
  fonts: FontMemoryInfo[];    // 字体内存信息
}

interface FontMemoryInfo {
  id: number;                 // 字体 ID
  name: string;               // 字体名称
  memoryUsage: number;        // 内存使用（字节）
}
```

**使用示例：**
```typescript
const metrics = parser.getMemoryMetrics();
if (metrics) {
  console.log(`总内存: ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
  
  metrics.fonts.forEach(font => {
    console.log(`${font.name}: ${(font.memoryUsage / 1024).toFixed(1)} KB`);
  });
}
```

### CacheStats

缓存统计信息。

```typescript
interface CacheStats {
  hits: number;               // 缓存命中次数
  misses: number;             // 缓存未命中次数
  entries: number;            // 缓存条目数
  hitRate: number;            // 命中率 (0-1)
  memoryUsage: number;        // 缓存内存使用（字节）
}
```

**使用示例：**
```typescript
const stats = parser.getCacheStats();
console.log(`缓存命中率: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`缓存条目: ${stats.entries}`);
```

### DetailedMetrics

详细指标信息。

```typescript
interface DetailedMetrics {
  memory: MemoryMetrics;      // 内存指标
  cache: CacheStats;          // 缓存统计
  performance?: PerformanceMetrics; // 性能指标
}
```

## 字体类型

### FontInfo

字体信息。

```typescript
interface FontInfo {
  id: number;                 // 字体 ID
  name: string;               // 字体名称
  memoryUsage: number;        // 内存使用（字节）
}
```

## 样式类型

### ComputedStyles

计算后的样式（仅在 `full` 模式中使用）。

```typescript
interface ComputedStyles {
  // 字体样式
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: string;
  
  // 颜色样式
  color: string;
  backgroundColor: string;
  
  // 布局样式
  display: string;
  position: string;
  width: string;
  height: string;
  
  // 间距样式
  margin: Spacing;
  padding: Spacing;
  
  // 边框样式
  border: BorderStyles;
  
  // 其他样式
  [key: string]: any;
}

interface Spacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface BorderStyles {
  top: BorderStyle;
  right: BorderStyle;
  bottom: BorderStyle;
  left: BorderStyle;
}

interface BorderStyle {
  width: number;
  style: string;
  color: string;
}
```

## 类型守卫

### 输出模式类型守卫

```typescript
function isCharLayoutArray(result: any): result is CharLayout[] {
  return Array.isArray(result) && 
         result.length > 0 && 
         'character' in result[0];
}

function isRowArray(result: any): result is Row[] {
  return Array.isArray(result) && 
         result.length > 0 && 
         'characters' in result[0];
}

function isSimpleOutput(result: any): result is SimpleOutput {
  return result && 
         'lines' in result && 
         'totalWidth' in result && 
         'totalHeight' in result;
}

function isLayoutDocument(result: any): result is LayoutDocument {
  return result && 
         'root' in result && 
         'metadata' in result;
}
```

**使用示例：**
```typescript
const result = parser.parse(html, { viewportWidth: 800, mode: 'byRow' });

if (isRowArray(result)) {
  // TypeScript 现在知道 result 是 Row[]
  result.forEach(row => {
    console.log(`行高: ${row.height}`);
  });
}
```

## 工具类型

### 条件类型助手

```typescript
// 根据模式获取结果类型
type GetResultType<T extends OutputMode> = ParseResult<T>;

// 示例
type FlatResult = GetResultType<'flat'>;      // CharLayout[]
type RowResult = GetResultType<'byRow'>;      // Row[]
type SimpleResult = GetResultType<'simple'>;  // SimpleOutput
type FullResult = GetResultType<'full'>;      // LayoutDocument
```

### 部分选项类型

```typescript
// 不包含某些字段的选项
type ParseOptionsWithoutCSS = Omit<ParseOptions, 'css'>;
type RequiredParseOptions = Required<Pick<ParseOptions, 'viewportWidth'>>;
```

## 类型使用示例

### 完整的类型化解析函数

```typescript
async function typedParse<T extends OutputMode>(
  parser: HtmlLayoutParser,
  html: string,
  options: ParseOptions & { mode: T }
): Promise<ParseResult<T> | null> {
  try {
    const result = parser.parseWithDiagnostics<T>(html, options);
    
    if (result.success) {
      return result.data!;
    } else {
      console.error('解析失败:', result.errors);
      return null;
    }
  } catch (error) {
    console.error('解析异常:', error);
    return null;
  }
}

// 使用示例
const flatResult = await typedParse(parser, html, {
  viewportWidth: 800,
  mode: 'flat'
}); // 类型: CharLayout[] | null

const rowResult = await typedParse(parser, html, {
  viewportWidth: 800,
  mode: 'byRow'
}); // 类型: Row[] | null
```

### 类型安全的渲染函数

```typescript
function renderLayouts(
  ctx: CanvasRenderingContext2D,
  layouts: CharLayout[]
): void {
  for (const char of layouts) {
    // 设置字体
    ctx.font = `${char.fontStyle} ${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
    
    // 设置颜色和透明度
    ctx.fillStyle = char.color;
    ctx.globalAlpha = char.opacity;
    
    // 绘制字符
    ctx.fillText(char.character, char.x, char.baseline);
  }
}
```