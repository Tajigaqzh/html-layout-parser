# Output Modes

HTML Layout Parser provides four output modes to suit different use cases.

## Mode Overview

| Mode | Description | Use Case |
|------|-------------|----------|
| `flat` | Flat character array | Simple rendering |
| `byRow` | Grouped by row | Line-by-line processing |
| `simple` | Simplified structure | Basic document analysis |
| `full` | Complete hierarchy | Complex layout analysis |

## flat Mode (Default)

Returns a flat array of characters, the simplest and most direct output format.

```typescript
const layouts = parser.parse(html, { 
  viewportWidth: 800,
  mode: 'flat' // Default mode, can be omitted
});

// Returns CharLayout[]
for (const char of layouts) {
  console.log(`Character '${char.character}' at (${char.x}, ${char.y})`);
}
```

### Use Cases
- Simple Canvas rendering
- Character-level processing
- Performance-critical scenarios

### Rendering Example
```typescript
const ctx = canvas.getContext('2d')!;

for (const char of layouts) {
  ctx.font = `${char.fontSize}px ${char.fontFamily}`;
  ctx.fillStyle = char.color;
  ctx.fillText(char.character, char.x, char.baseline);
}
```

## byRow Mode

Groups characters by row for line-by-line processing.

```typescript
const rows = parser.parse(html, { 
  viewportWidth: 800,
  mode: 'byRow'
});

// Returns Row[]
for (const row of rows) {
  console.log(`Row ${row.rowIndex}, Y: ${row.y}`);
  console.log(`Contains ${row.children.length} characters`);
  
  for (const char of row.children) {
    console.log(`  Character: ${char.character}`);
  }
}
```

### Row Structure
```typescript
interface Row {
  rowIndex: number;       // Row index
  y: number;             // Row Y coordinate
  children: CharLayout[]; // Characters in this row
}
```

### Use Cases
- Text editors
- Line-by-line animation effects
- Line-level processing logic

## simple Mode

Provides a simplified document structure with basic page and line information.

```typescript
const doc = parser.parse(html, { 
  viewportWidth: 800,
  mode: 'simple'
});

// Returns SimpleOutput
console.log(`Version: ${doc.version}`);
console.log(`Viewport: ${doc.viewport.width}x${doc.viewport.height}`);

for (const line of doc.lines) {
  console.log(`Line ${line.lineIndex}: ${line.characters?.length} characters`);
}
```

### SimpleOutput Structure
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

### Use Cases
- Document structure analysis
- Simple layout information extraction
- Balance between performance and complexity

## full Mode

Provides complete document hierarchy including pages, blocks, lines, and runs.

```typescript
const doc = parser.parse(html, { 
  viewportWidth: 800,
  mode: 'full'
});

// Returns LayoutDocument
console.log(`Parser version: ${doc.parserVersion}`);

for (const page of doc.pages) {
  console.log(`Page ${page.pageIndex}: ${page.width}x${page.height}`);
  
  for (const block of page.blocks) {
    console.log(`  Block ${block.blockIndex}: ${block.type}`);
    console.log(`  Position: (${block.x}, ${block.y})`);
    console.log(`  Background: ${block.backgroundColor}`);
    
    for (const line of block.lines) {
      console.log(`    Line ${line.lineIndex}: ${line.runs?.length} runs`);
      
      if (line.runs) {
        for (const run of line.runs) {
          console.log(`      Run ${run.runIndex}: ${run.characters.length} characters`);
          console.log(`      Font: ${run.fontSize}px ${run.fontFamily}`);
        }
      }
    }
  }
}
```

### LayoutDocument Structure
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

### Use Cases
- Complex document analysis
- Layout debugging and visualization
- Applications requiring complete document structure

## Mode Selection Guide

### Performance Considerations

| Mode | Parse Speed | Memory Usage | Data Size |
|------|-------------|--------------|-----------|
| `flat` | Fastest | Smallest | Smallest |
| `byRow` | Fast | Small | Small |
| `simple` | Medium | Medium | Medium |
| `full` | Slower | Larger | Largest |

### Usage Recommendations

```typescript
// Simple Canvas rendering
const layouts = parser.parse(html, { mode: 'flat' });

// Text editor, needs line information
const rows = parser.parse(html, { mode: 'byRow' });

// Document analysis, needs basic structure
const doc = parser.parse(html, { mode: 'simple' });

// Complex layout analysis, needs complete information
const fullDoc = parser.parse(html, { mode: 'full' });
```

## TypeScript Type Support

```typescript
// Type-safe mode specification
const flatResult = parser.parse<'flat'>(html, { mode: 'flat' });
// flatResult type is CharLayout[]

const fullResult = parser.parse<'full'>(html, { mode: 'full' });
// fullResult type is LayoutDocument

// Automatic type inference
const autoResult = parser.parse(html, { mode: 'byRow' });
// autoResult type is Row[]
```

## Rendering Examples

### flat Mode Rendering
```typescript
const layouts = parser.parse(html, { mode: 'flat' });
const ctx = canvas.getContext('2d')!;

for (const char of layouts) {
  ctx.font = `${char.fontSize}px ${char.fontFamily}`;
  ctx.fillStyle = char.color;
  ctx.fillText(char.character, char.x, char.baseline);
}
```

### full Mode Rendering
```typescript
const doc = parser.parse(html, { mode: 'full' });
const ctx = canvas.getContext('2d')!;

for (const page of doc.pages) {
  for (const block of page.blocks) {
    // Draw block background
    if (block.backgroundColor !== '#00000000') {
      ctx.fillStyle = block.backgroundColor;
      ctx.fillRect(block.x, block.y, block.width, block.height);
    }
    
    // Draw text
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
