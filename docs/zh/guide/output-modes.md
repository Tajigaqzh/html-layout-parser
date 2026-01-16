# 输出模式

HTML Layout Parser 提供四种输出模式，满足不同的使用场景。

## 模式概览

| 模式 | 描述 | 使用场景 |
|------|------|----------|
| `flat` | 扁平字符数组 | 简单渲染 |
| `byRow` | 按行分组 | 逐行处理 |
| `simple` | 简化结构 | 基本文档分析 |
| `full` | 完整层级 | 复杂布局分析 |

## flat 模式（默认）

返回扁平的字符数组，最简单直接的输出格式。

```typescript
const layouts = parser.parse(html, { 
  viewportWidth: 800,
  mode: 'flat' // 默认模式，可省略
});

// 返回 CharLayout[]
for (const char of layouts) {
  console.log(`字符 '${char.character}' 在 (${char.x}, ${char.y})`);
}
```

### 适用场景
- 简单的 Canvas 渲染
- 字符级别的处理
- 性能要求高的场景

### 渲染示例
```typescript
const ctx = canvas.getContext('2d')!;

for (const char of layouts) {
  ctx.font = `${char.fontSize}px ${char.fontFamily}`;
  ctx.fillStyle = char.color;
  ctx.fillText(char.character, char.x, char.baseline);
}
```

## byRow 模式

按行分组字符，便于逐行处理。

```typescript
const rows = parser.parse(html, { 
  viewportWidth: 800,
  mode: 'byRow'
});

// 返回 Row[]
for (const row of rows) {
  console.log(`第 ${row.rowIndex} 行，Y: ${row.y}`);
  console.log(`包含 ${row.children.length} 个字符`);
  
  for (const char of row.children) {
    console.log(`  字符: ${char.character}`);
  }
}
```

### Row 结构
```typescript
interface Row {
  rowIndex: number;    // 行索引
  y: number;          // 行的 Y 坐标
  children: CharLayout[]; // 该行的字符
}
```

### 适用场景
- 文本编辑器
- 逐行动画效果
- 行级别的处理逻辑

## simple 模式

提供简化的文档结构，包含基本的页面和行信息。

```typescript
const doc = parser.parse(html, { 
  viewportWidth: 800,
  mode: 'simple'
});

// 返回 SimpleOutput
console.log(`版本: ${doc.version}`);
console.log(`视口: ${doc.viewport.width}x${doc.viewport.height}`);

for (const line of doc.lines) {
  console.log(`行 ${line.lineIndex}: ${line.characters?.length} 个字符`);
}
```

### SimpleOutput 结构
```typescript
interface SimpleOutput {
  version: string;
  viewport: Viewport;
  lines: Line[];
}

interface Line {
  lineIndex: number;
  y: number;
  baseline: number;
  height: number;
  width: number;
  textAlign: string;
  characters?: CharLayout[];
}
```

### 适用场景
- 文档结构分析
- 简单的布局信息提取
- 性能和复杂度的平衡

## full 模式

提供完整的文档层级结构，包含页面、块、行、运行的完整信息。

```typescript
const doc = parser.parse(html, { 
  viewportWidth: 800,
  mode: 'full'
});

// 返回 LayoutDocument
console.log(`解析器版本: ${doc.parserVersion}`);

for (const page of doc.pages) {
  console.log(`页面 ${page.pageIndex}: ${page.width}x${page.height}`);
  
  for (const block of page.blocks) {
    console.log(`  块 ${block.blockIndex}: ${block.type}`);
    console.log(`  位置: (${block.x}, ${block.y})`);
    console.log(`  背景色: ${block.backgroundColor}`);
    
    for (const line of block.lines) {
      console.log(`    行 ${line.lineIndex}: ${line.runs?.length} 个运行`);
      
      if (line.runs) {
        for (const run of line.runs) {
          console.log(`      运行 ${run.runIndex}: ${run.characters.length} 个字符`);
          console.log(`      字体: ${run.fontSize}px ${run.fontFamily}`);
        }
      }
    }
  }
}
```

### LayoutDocument 结构
```typescript
interface LayoutDocument {
  version: string;
  parserVersion: string;
  viewport: Viewport;
  pages: Page[];
}

interface Page {
  pageIndex: number;
  width: number;
  height: number;
  blocks: Block[];
}

interface Block {
  blockIndex: number;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  margin: BoxSpacing;
  padding: BoxSpacing;
  backgroundColor: string;
  borderRadius: number;
  lines: Line[];
}

interface Run {
  runIndex: number;
  x: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: string;
  color: string;
  backgroundColor: string;
  textDecoration: TextDecoration;
  characters: CharLayout[];
}
```

### 适用场景
- 复杂的文档分析
- 布局调试和可视化
- 需要完整文档结构的应用

## 模式选择指南

### 性能考虑

| 模式 | 解析速度 | 内存占用 | 数据大小 |
|------|----------|----------|----------|
| `flat` | 最快 | 最小 | 最小 |
| `byRow` | 快 | 小 | 小 |
| `simple` | 中等 | 中等 | 中等 |
| `full` | 较慢 | 较大 | 最大 |

### 使用建议

```typescript
// 简单 Canvas 渲染
const layouts = parser.parse(html, { mode: 'flat' });

// 文本编辑器，需要行信息
const rows = parser.parse(html, { mode: 'byRow' });

// 文档分析，需要基本结构
const doc = parser.parse(html, { mode: 'simple' });

// 复杂布局分析，需要完整信息
const fullDoc = parser.parse(html, { mode: 'full' });
```

## TypeScript 类型支持

```typescript
// 类型安全的模式指定
const flatResult = parser.parse<'flat'>(html, { mode: 'flat' });
// flatResult 类型为 CharLayout[]

const fullResult = parser.parse<'full'>(html, { mode: 'full' });
// fullResult 类型为 LayoutDocument

// 自动推断类型
const autoResult = parser.parse(html, { mode: 'byRow' });
// autoResult 类型为 Row[]
```

## 渲染示例

### flat 模式渲染
```typescript
const layouts = parser.parse(html, { mode: 'flat' });
const ctx = canvas.getContext('2d')!;

for (const char of layouts) {
  ctx.font = `${char.fontSize}px ${char.fontFamily}`;
  ctx.fillStyle = char.color;
  ctx.fillText(char.character, char.x, char.baseline);
}
```

### full 模式渲染
```typescript
const doc = parser.parse(html, { mode: 'full' });
const ctx = canvas.getContext('2d')!;

for (const page of doc.pages) {
  for (const block of page.blocks) {
    // 绘制块背景
    if (block.backgroundColor !== '#00000000') {
      ctx.fillStyle = block.backgroundColor;
      ctx.fillRect(block.x, block.y, block.width, block.height);
    }
    
    // 绘制文本
    for (const line of block.lines) {
      if (line.runs) {
        for (const run of line.runs) {
          ctx.font = `${run.fontSize}px ${run.fontFamily}`;
          ctx.fillStyle = run.color;
          
          for (const char of run.characters) {
            ctx.fillText(char.character, char.x, char.baseline);
          }
        }
      }
    }
  }
}
```