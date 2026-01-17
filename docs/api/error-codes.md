# Error Codes

Complete reference of error codes returned by HTML Layout Parser.

## Error Code Enum

```typescript
enum ErrorCode {
  Success = 0,
  
  // Input validation (1xxx)
  InvalidInput = 1001,
  EmptyHtml = 1002,
  InvalidViewportWidth = 1003,
  InvalidMode = 1004,
  InvalidOptions = 1005,
  HtmlTooLarge = 1006,
  
  // Font errors (2xxx)
  FontNotLoaded = 2001,
  FontLoadFailed = 2002,
  FontDataInvalid = 2003,
  FontNameEmpty = 2004,
  FontIdNotFound = 2005,
  NoDefaultFont = 2006,
  FontMemoryExceeded = 2007,
  
  // Parse errors (3xxx)
  ParseFailed = 3001,
  DocumentCreationFailed = 3002,
  RenderFailed = 3003,
  LayoutFailed = 3004,
  CssParseError = 3005,
  
  // Memory errors (4xxx)
  MemoryAllocationFailed = 4001,
  MemoryLimitExceeded = 4002,
  
  // Internal errors (5xxx)
  InternalError = 5001,
  SerializationFailed = 5002,
  UnknownError = 5999
}
```

## Error Categories

### Input Validation Errors (1xxx)

| Code | Name | Description | Solution |
|------|------|-------------|----------|
| 1001 | InvalidInput | Input HTML is invalid | Check HTML syntax |
| 1002 | EmptyHtml | HTML string is empty | Provide non-empty HTML |
| 1003 | InvalidViewportWidth | Viewport width is invalid | Use positive number |
| 1004 | InvalidMode | Output mode is invalid | Use 'flat', 'byRow', 'simple', or 'full' |
| 1005 | InvalidOptions | Parse options are invalid | Check options object |
| 1006 | HtmlTooLarge | HTML exceeds size limit | Split into smaller chunks |

### Font Errors (2xxx)

| Code | Name | Description | Solution |
|------|------|-------------|----------|
| 2001 | FontNotLoaded | No fonts are loaded | Load at least one font |
| 2002 | FontLoadFailed | Font loading failed | Check font file format |
| 2003 | FontDataInvalid | Font data is corrupted | Use valid TTF/OTF |
| 2004 | FontNameEmpty | Font name is empty | Provide font name |
| 2005 | FontIdNotFound | Font ID doesn't exist | Check font ID |
| 2006 | NoDefaultFont | No default font set | Call setDefaultFont() |
| 2007 | FontMemoryExceeded | Font memory limit exceeded | Unload unused fonts |

### Parse Errors (3xxx)

| Code | Name | Description | Solution |
|------|------|-------------|----------|
| 3001 | ParseFailed | HTML parsing failed | Check HTML syntax |
| 3002 | DocumentCreationFailed | Document creation failed | Check HTML structure |
| 3003 | RenderFailed | Rendering failed | Check CSS and fonts |
| 3004 | LayoutFailed | Layout calculation failed | Simplify HTML/CSS |
| 3005 | CssParseError | CSS parsing error | Check CSS syntax |

### Memory Errors (4xxx)

| Code | Name | Description | Solution |
|------|------|-------------|----------|
| 4001 | MemoryAllocationFailed | Memory allocation failed | Free memory, reduce load |
| 4002 | MemoryLimitExceeded | Memory limit exceeded | Unload fonts, reduce batch size |

### Internal Errors (5xxx)

| Code | Name | Description | Solution |
|------|------|-------------|----------|
| 5001 | InternalError | Internal parser error | Report bug |
| 5002 | SerializationFailed | Output serialization failed | Check output mode |
| 5999 | UnknownError | Unknown error occurred | Check logs, report bug |

## Error Handling

### Basic Error Handling

```typescript
import { HtmlLayoutParser, ErrorCode } from 'html-layout-parser';

const parser = new HtmlLayoutParser();
await parser.init();

try {
  const result = parser.parseWithDiagnostics(html, { viewportWidth: 800 });
  
  if (!result.success) {
    for (const error of result.errors || []) {
      switch (error.code) {
        case ErrorCode.FontNotLoaded:
          console.error('Please load a font first');
          break;
        case ErrorCode.InvalidViewportWidth:
          console.error('Viewport width must be positive');
          break;
        default:
          console.error(`Error ${error.code}: ${error.message}`);
      }
    }
  }
} finally {
  parser.destroy();
}
```

### Handling Warnings

```typescript
const result = parser.parseWithDiagnostics(html, { viewportWidth: 800 });

if (result.warnings && result.warnings.length > 0) {
  for (const warning of result.warnings) {
    console.warn(`Warning: ${warning.message}`);
    
    if (warning.line && warning.column) {
      console.warn(`  at line ${warning.line}, column ${warning.column}`);
    }
  }
}
```

### Error Recovery

```typescript
async function parseWithRecovery(html: string): Promise<CharLayout[] | null> {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();
    
    // Try to load font
    try {
      const fontData = await loadFont('/fonts/arial.ttf');
      parser.loadFont(fontData, 'Arial');
      parser.setDefaultFont(1);
    } catch {
      // Try fallback font
      const fallbackData = await loadFont('/fonts/fallback.ttf');
      parser.loadFont(fallbackData, 'Fallback');
      parser.setDefaultFont(1);
    }
    
    const result = parser.parseWithDiagnostics(html, { viewportWidth: 800 });
    
    if (result.success) {
      return result.data as CharLayout[];
    }
    
    // Handle specific errors
    const fontError = result.errors?.find(e => 
      e.code === ErrorCode.FontNotLoaded || 
      e.code === ErrorCode.NoDefaultFont
    );
    
    if (fontError) {
      console.error('Font error - cannot recover');
      return null;
    }
    
    // For other errors, return partial result if available
    return result.data as CharLayout[] || null;
    
  } finally {
    parser.destroy();
  }
}
```

## Severity Levels

Errors have three severity levels:

| Severity | Description | Action |
|----------|-------------|--------|
| `error` | Critical error, parsing failed | Fix the issue |
| `warning` | Non-critical issue, parsing continued | Review and fix if needed |
| `info` | Informational message | No action required |

```typescript
const result = parser.parseWithDiagnostics(html, options);

// Filter by severity
const errors = result.errors?.filter(e => e.severity === 'error') || [];
const warnings = result.errors?.filter(e => e.severity === 'warning') || [];
const info = result.errors?.filter(e => e.severity === 'info') || [];
```
