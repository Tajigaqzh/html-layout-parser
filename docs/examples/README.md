# HTML Layout Parser v0.0.1 - Usage Examples

This directory contains comprehensive usage examples for HTML Layout Parser v0.0.1.

## Example Categories

### 1. [Web Environment Examples](./web-examples.md)
- Basic HTML parsing
- Multi-font usage
- CSS separation
- Canvas rendering
- Theme switching

### 2. [Worker Environment Examples](./worker-examples.md)
- OffscreenCanvas rendering
- Background processing
- Message-based communication

### 3. [Node.js Environment Examples](./node-examples.md)
- File-based font loading
- Batch processing
- Server-side rendering

### 4. [Batch/Parallel Processing Examples](./batch-parallel-examples.md)
- Shared font processing
- Parallel document parsing
- High-throughput patterns

### 5. [Memory Management Examples](./memory-management-examples.md)
- Correct load/unload patterns
- Memory monitoring
- Resource cleanup
- Long-running applications

## Quick Reference

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

// Initialize
const parser = new HtmlLayoutParser();
await parser.init();

// Load font
const fontId = parser.loadFont(fontData, 'Arial');
parser.setDefaultFont(fontId);

// Parse HTML
const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });

// Clean up
parser.destroy();
```

## Requirements Coverage

These examples cover the following requirements:
- **14.2**: Web environment examples
- **14.3**: Worker environment examples
- **14.4**: Node.js environment examples
- **14.7**: Interactive examples
- **1.8**: Font reuse patterns
- **1.9**: Batch/parallel parsing with shared fonts
