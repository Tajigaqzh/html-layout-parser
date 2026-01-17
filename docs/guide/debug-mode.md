# Debug Mode

HTML Layout Parser provides powerful debugging features to help you diagnose parsing issues and optimize performance.

## Enabling Debug Mode

### Basic Debugging

```typescript
// Enable debugging via parse options
const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: true
});

// Debug output example:
// [HtmlLayoutParser] HTML parsing started (length=1234)
// [HtmlLayoutParser] HTML parsing completed (time=5.2ms)
// [HtmlLayoutParser] Layout calculation started (viewport=800x600)
// [HtmlLayoutParser] Layout calculation completed (time=12.3ms, chars=456)
// [HtmlLayoutParser] Memory usage: 15.2MB (fonts=12MB, buffers=3.2MB)
```

### Detailed Diagnostics

```typescript
// Use parseWithDiagnostics for detailed information
const result = parser.parseWithDiagnostics(html, {
  viewportWidth: 800,
  isDebug: true,
  enableMetrics: true
});

if (result.success) {
  console.log('Parse successful');
  console.log('Layout data:', result.data);
  
  if (result.metrics) {
    console.log('Performance metrics:', result.metrics);
  }
  
  if (result.warnings?.length) {
    console.log('Warnings:', result.warnings);
  }
} else {
  console.error('Parse failed');
  console.error('Errors:', result.errors);
}
```

## Debug Output Types

### 1. Font-Related Logs

```typescript
const parser = new HtmlLayoutParser();
await parser.init();

// Font loading debug
const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
const fontId = parser.loadFont(new Uint8Array(fontData), 'Arial');

// Output:
// [HtmlLayoutParser] Font loading started (name=Arial, size=245760 bytes)
// [HtmlLayoutParser] Font loaded successfully (id=1, name=Arial)
// [HtmlLayoutParser] Memory usage after font load: 8.2MB

// Font unloading debug
parser.unloadFont(fontId);

// Output:
// [HtmlLayoutParser] Font unloading (id=1, name=Arial)
// [HtmlLayoutParser] Font unloaded successfully
// [HtmlLayoutParser] Memory usage after font unload: 0.5MB
```

### 1.1 Character Fallback Logs

When a character is not found in the loaded font, the parser uses **CSS font-family fallback strategy** (like browsers):

```typescript
// Parse with font-family: "MaoKenShiJinHei, aliBaBaFont65, Arial"
const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: true
});

// Output examples:
// [WASM] Character U+8005 (者) not found in font ID 2
// [HtmlLayoutParser] Found character U+8005 in font-family font: aliBaBaFont65 (ID 1)
// [HtmlLayoutParser] Char U+8005 metrics: horiAdvance=20, advanceX=20, width=18, fontSize=18, finalWidth=20, usedFont=1

// [WASM] Character U+ff1a (：) not found in font ID 2
// [HtmlLayoutParser] Character U+ff1a not found in primary font (ID 2), using intelligent fallback
// [HtmlLayoutParser] → Using half-width fallback: 9px for punctuation
```

**CSS font-family Fallback Strategy (Browser-Like!):**

The parser now implements the **exact same fallback mechanism as browsers**:

1. **Primary Font**: Try to find the character in the first font in `font-family`
2. **font-family Fallback**: If not found, try each font in `font-family` list **in order**
   - Example: `font-family: "MaoKenShiJinHei, aliBaBaFont65, Arial"`
   - Tries: MaoKenShiJinHei → aliBaBaFont65 → Arial
3. **Default Font**: If not found in any font-family font, try the default font
4. **Intelligent Fallback**: Last resort, use character-type-based estimation
   - **CJK Characters** (U+4E00-U+9FFF): Use '中' (U+4E2D) character width
   - **Punctuation** (CJK/Latin): Use half-width (fontSize / 2)
   - **Other Characters**: Try '0' or space character

**Key Improvements:**
- ✅ **Browser-Compatible**: Follows CSS font-family specification exactly
- ✅ **Accurate Width**: Uses actual character width from fallback fonts
- ✅ **Ordered Fallback**: Respects font-family order (not random search)
- ✅ **No Overlapping**: Characters use correct widths even when missing from primary font
- ✅ **Performance**: Results are cached to avoid repeated lookups

**Comparison with Browser Behavior:**

| Aspect | Browser | Our Implementation |
|--------|---------|-------------------|
| Fallback Order | font-family list order | ✅ Same |
| Per-Character | Yes, per character | ✅ Same |
| Actual Width | Uses fallback font width | ✅ Same |
| System Fonts | Falls back to system | ⚠️ Uses default font* |

**\*Note on System Font Fallback:**

Unlike browsers, WASM cannot directly access system fonts due to sandbox restrictions. Instead, we use a **default font** that you specify. To achieve browser-like behavior:

1. **Load a comprehensive fallback font** (e.g., Noto Sans, Noto Sans CJK)
2. **Set it as the default font** using `setDefaultFont()`
3. **Include it in font-family** as the last option

**Best Practice Example:**

```typescript
const parser = new HtmlLayoutParser();
await parser.init();

// Load fonts in order of preference
const arialId = parser.loadFont(arialData, 'Arial');
const helveticaId = parser.loadFont(helveticaData, 'Helvetica');

// Load a comprehensive fallback font with wide character coverage
const notoSansId = parser.loadFont(notoSansData, 'Noto Sans');

// Set the comprehensive font as default (acts like system font fallback)
parser.setDefaultFont(notoSansId);

// Use in CSS with proper fallback chain
const css = `
  body {
    font-family: 'Arial', 'Helvetica', 'Noto Sans', sans-serif;
  }
`;
```

**Recommended Fallback Fonts:**

For best cross-language support, consider loading one of these comprehensive fonts:

- **Noto Sans** - Covers Latin, Greek, Cyrillic
- **Noto Sans CJK** - Covers Chinese, Japanese, Korean
- **Roboto** - Good Latin coverage
- **Arial Unicode MS** - Wide character coverage (if available)

**Why This Approach:**

| Aspect | System Fonts (Browser) | Default Font (Our Approach) |
|--------|----------------------|---------------------------|
| Access | Direct OS access | User-loaded fonts only |
| Consistency | Varies by OS | ✅ Consistent across platforms |
| Control | Limited | ✅ Full control over fonts |
| Performance | Fast (cached) | ✅ Fast (pre-loaded) |
| Character Coverage | Depends on OS | ✅ Guaranteed (if you load it) |

**Debug Output Fields:**
- `horiAdvance`: Horizontal advance from font metrics
- `advanceX`: X-axis advance value
- `width`: Glyph width
- `fontSize`: Current font size
- `finalWidth`: Final calculated width used for layout
- `usedFont`: The font ID that was actually used (may differ from requested)
- `(fallback)`: Indicates this character used fallback strategy

### 2. Parse Stage Logs

```typescript
const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: true
});

// Output example:
// [HtmlLayoutParser] === Parse Started ===
// [HtmlLayoutParser] Input HTML length: 1,234 characters
// [HtmlLayoutParser] Viewport: 800x600
// [HtmlLayoutParser] Default font: Arial (ID: 1)
// 
// [HtmlLayoutParser] HTML parsing started
// [HtmlLayoutParser] HTML parsing completed (time=5.2ms, nodes=45)
// 
// [HtmlLayoutParser] CSS processing started
// [HtmlLayoutParser] CSS processing completed (time=2.1ms, rules=12)
// 
// [HtmlLayoutParser] Layout calculation started
// [HtmlLayoutParser] Layout calculation completed (time=12.3ms, chars=456)
// 
// [HtmlLayoutParser] Serialization started (mode=flat)
// [HtmlLayoutParser] Serialization completed (time=3.4ms, size=89KB)
// 
// [HtmlLayoutParser] === Parse Completed ===
// [HtmlLayoutParser] Total time: 23.0ms
// [HtmlLayoutParser] Parse speed: 53,652 chars/sec
```

### 3. Memory Usage Logs

```typescript
// Memory monitoring debug
const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: true
});

// Output:
// [HtmlLayoutParser] Memory before parse: 8.2MB
// [HtmlLayoutParser] Memory during parse: 12.5MB
// [HtmlLayoutParser] Memory after parse: 8.4MB
// [HtmlLayoutParser] Memory delta: +0.2MB
// [HtmlLayoutParser] Font memory: 8.0MB (1 fonts)
// [HtmlLayoutParser] Buffer memory: 0.4MB
```

## Environment-Specific Output

### Web Browser / Web Worker

Debug logs are output to `console.log`:

```typescript
// Logs appear in browser DevTools console
const layouts = parser.parse(html, { viewportWidth: 800, isDebug: true });
```

### Node.js

Debug logs are output to `process.stdout`:

```typescript
// Logs appear in terminal
const layouts = parser.parse(html, { viewportWidth: 800, isDebug: true });
```

## Use Cases

### Performance Analysis

```typescript
// Enable debug mode to see timing breakdown
const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: true
});

// Output shows:
// HTML parsing completed (time=5.20ms)
// Layout calculation completed (time=12.30ms)
// Serialization completed (time=3.40ms)
// Total: 23.00ms
```

### Memory Debugging

```typescript
// Track memory usage during operations
parser.setDebugMode(true);

const fontId = parser.loadFont(fontData, 'Arial');
// [HtmlLayoutParser] Font loaded successfully: Arial (id=1)
// [HtmlLayoutParser] Memory usage: 8.04MB (fonts=1)

const layouts = parser.parse(html, { viewportWidth: 800 });
// [HtmlLayoutParser] Memory usage: 8.04MB (fonts=1)

parser.unloadFont(fontId);
// [HtmlLayoutParser] Font unloaded: Arial (id=1)
// [HtmlLayoutParser] Memory usage: 0B (fonts=0)
```

### Troubleshooting

```typescript
// Debug mode helps identify issues
const layouts = parser.parse('', { viewportWidth: 800, isDebug: true });
// [HtmlLayoutParser] Error: HTML string is empty
```

## Disabling Debug Mode

Debug mode is disabled by default. To explicitly disable:

```typescript
const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: false  // Default
});
```

## Production Usage

::: warning
Debug mode adds overhead and should be disabled in production.
:::

```typescript
const isProduction = process.env.NODE_ENV === 'production';

const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: !isProduction
});
```

## Combining with Metrics

For detailed performance analysis, combine debug mode with metrics:

```typescript
const result = parser.parseWithDiagnostics(html, {
  viewportWidth: 800,
  enableMetrics: true,
  isDebug: true
});

// Debug logs show real-time progress
// Metrics provide structured data
if (result.metrics) {
  console.log('Structured metrics:', result.metrics);
}
```

## Custom Debuggers

### Debug Log Collector

```typescript
class DebugLogger {
  private logs: Array<{
    timestamp: number;
    level: 'info' | 'warn' | 'error';
    category: string;
    message: string;
    data?: any;
  }> = [];

  private originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error
  };

  startCapture(): void {
    console.log = (...args) => {
      this.capture('info', 'console', args.join(' '));
      this.originalConsole.log(...args);
    };

    console.warn = (...args) => {
      this.capture('warn', 'console', args.join(' '));
      this.originalConsole.warn(...args);
    };

    console.error = (...args) => {
      this.capture('error', 'console', args.join(' '));
      this.originalConsole.error(...args);
    };
  }

  stopCapture(): void {
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
  }

  private capture(level: 'info' | 'warn' | 'error', category: string, message: string, data?: any): void {
    this.logs.push({
      timestamp: Date.now(),
      level,
      category,
      message,
      data
    });
  }

  getLogs(): typeof this.logs {
    return [...this.logs];
  }

  getLogsByCategory(category: string): typeof this.logs {
    return this.logs.filter(log => log.category === category);
  }

  getLogsByLevel(level: 'info' | 'warn' | 'error'): typeof this.logs {
    return this.logs.filter(log => log.level === level);
  }

  clear(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  printSummary(): void {
    const summary = {
      total: this.logs.length,
      info: this.logs.filter(l => l.level === 'info').length,
      warn: this.logs.filter(l => l.level === 'warn').length,
      error: this.logs.filter(l => l.level === 'error').length
    };

    console.log('Debug log summary:', summary);
  }
}

// Usage example
const debugLogger = new DebugLogger();
debugLogger.startCapture();

// Execute parsing
const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: true
});

debugLogger.stopCapture();
debugLogger.printSummary();

// Export logs for analysis
const logs = debugLogger.exportLogs();
console.log('Detailed logs:', logs);
```

### Performance Profiler

```typescript
class PerformanceProfiler {
  private profiles: Map<string, {
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: any;
  }> = new Map();

  start(profileName: string, metadata?: any): void {
    this.profiles.set(profileName, {
      startTime: performance.now(),
      metadata
    });
  }

  end(profileName: string): number | null {
    const profile = this.profiles.get(profileName);
    if (!profile) {
      console.warn(`Profiler: Profile "${profileName}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - profile.startTime;

    profile.endTime = endTime;
    profile.duration = duration;

    console.log(`[Performance] ${profileName}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  getProfile(profileName: string) {
    return this.profiles.get(profileName);
  }

  getAllProfiles() {
    return Array.from(this.profiles.entries()).map(([name, profile]) => ({
      name,
      ...profile
    }));
  }

  clear(): void {
    this.profiles.clear();
  }

  generateReport(): string {
    const profiles = this.getAllProfiles()
      .filter(p => p.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));

    let report = 'Performance Analysis Report\n';
    report += '==========================\n\n';

    for (const profile of profiles) {
      report += `${profile.name}: ${profile.duration!.toFixed(2)}ms\n`;
      if (profile.metadata) {
        report += `  Metadata: ${JSON.stringify(profile.metadata)}\n`;
      }
    }

    const totalTime = profiles.reduce((sum, p) => sum + (p.duration || 0), 0);
    report += `\nTotal time: ${totalTime.toFixed(2)}ms\n`;

    return report;
  }
}

// Usage example
const profiler = new PerformanceProfiler();

// Profile parsing performance
profiler.start('total_parse', { htmlLength: html.length });
profiler.start('font_load');

const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
const fontId = parser.loadFont(new Uint8Array(fontData), 'Arial');

profiler.end('font_load');
profiler.start('html_parse');

const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: true
});

profiler.end('html_parse');
profiler.end('total_parse');

// Generate report
console.log(profiler.generateReport());
```

## Error Diagnostics

### Common Issue Diagnosis

```typescript
class DiagnosticHelper {
  static diagnoseParseFailure(
    parser: HtmlLayoutParser,
    html: string,
    options: { viewportWidth: number }
  ): void {
    console.log('=== Parse Failure Diagnosis ===');

    // 1. Check parser state
    if (!parser.isInitialized()) {
      console.error('❌ Parser not initialized');
      return;
    }
    console.log('✅ Parser initialized');

    // 2. Check fonts
    const fonts = parser.getLoadedFonts();
    if (fonts.length === 0) {
      console.warn('⚠️ No fonts loaded');
    } else {
      console.log(`✅ ${fonts.length} fonts loaded:`, fonts.map(f => f.name));
    }

    // 3. Check HTML size
    if (html.length === 0) {
      console.error('❌ HTML content is empty');
      return;
    }
    console.log(`✅ HTML length: ${html.length} characters`);

    // 4. Check viewport size
    if (options.viewportWidth <= 0) {
      console.error('❌ Invalid viewport width:', options.viewportWidth);
      return;
    }
    console.log(`✅ Viewport width: ${options.viewportWidth}px`);

    // 5. Check memory usage
    const memoryMetrics = parser.getMemoryMetrics();
    if (memoryMetrics) {
      const memoryMB = memoryMetrics.totalMemoryUsage / 1024 / 1024;
      if (memoryMB > 100) {
        console.warn(`⚠️ High memory usage: ${memoryMB.toFixed(2)}MB`);
      } else {
        console.log(`✅ Memory usage normal: ${memoryMB.toFixed(2)}MB`);
      }
    }

    // 6. Try simplified parse
    try {
      console.log('Attempting simplified HTML parse...');
      const simpleResult = parser.parse('<div>Test</div>', options);
      console.log('✅ Simplified parse successful, issue likely in HTML content');
    } catch (error) {
      console.error('❌ Simplified parse also failed, issue in parser configuration:', error);
    }
  }

  static validateHtml(html: string): Array<{ type: 'error' | 'warning'; message: string }> {
    const issues: Array<{ type: 'error' | 'warning'; message: string }> = [];

    // Check basic structure
    if (!html.trim()) {
      issues.push({ type: 'error', message: 'HTML content is empty' });
      return issues;
    }

    // Check tag balance
    const openTags = html.match(/<[^/][^>]*>/g) || [];
    const closeTags = html.match(/<\/[^>]*>/g) || [];
    
    if (openTags.length !== closeTags.length) {
      issues.push({ type: 'warning', message: 'Tags may be unbalanced' });
    }

    // Check size
    if (html.length > 100000) {
      issues.push({ type: 'warning', message: `HTML too large (${html.length} characters), may affect performance` });
    }

    // Check complex CSS
    const styleMatches = html.match(/style\s*=\s*"[^"]*"/g) || [];
    if (styleMatches.length > 100) {
      issues.push({ type: 'warning', message: 'Too many inline styles, consider using external CSS' });
    }

    return issues;
  }
}

// Usage example
try {
  const layouts = parser.parse(html, { viewportWidth: 800 });
} catch (error) {
  console.error('Parse failed:', error);
  
  // Run diagnostics
  DiagnosticHelper.diagnoseParseFailure(parser, html, { viewportWidth: 800 });
  
  // Validate HTML
  const issues = DiagnosticHelper.validateHtml(html);
  if (issues.length > 0) {
    console.log('HTML validation issues:');
    issues.forEach(issue => {
      console.log(`  ${issue.type === 'error' ? '❌' : '⚠️'} ${issue.message}`);
    });
  }
}
```

### Memory Leak Detection

```typescript
class MemoryLeakDetector {
  private parser: HtmlLayoutParser;
  private baselineMemory: number = 0;
  private samples: number[] = [];
  private sampleInterval: NodeJS.Timeout | null = null;

  constructor(parser: HtmlLayoutParser) {
    this.parser = parser;
  }

  startMonitoring(intervalMs: number = 1000): void {
    // Record baseline memory
    this.baselineMemory = this.getCurrentMemory();
    console.log(`Memory leak detection started, baseline: ${this.baselineMemory.toFixed(2)}MB`);

    this.sampleInterval = setInterval(() => {
      const currentMemory = this.getCurrentMemory();
      this.samples.push(currentMemory);
      
      // Keep last 100 samples
      if (this.samples.length > 100) {
        this.samples.shift();
      }
      
      this.checkForLeak();
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.sampleInterval) {
      clearInterval(this.sampleInterval);
      this.sampleInterval = null;
    }
  }

  private getCurrentMemory(): number {
    const metrics = this.parser.getMemoryMetrics();
    return metrics ? metrics.totalMemoryUsage / 1024 / 1024 : 0;
  }

  private checkForLeak(): void {
    if (this.samples.length < 10) return;

    const recent = this.samples.slice(-10);
    const average = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const growth = average - this.baselineMemory;

    if (growth > 10) { // Growth exceeds 10MB
      console.warn(`⚠️ Possible memory leak detected: +${growth.toFixed(2)}MB`);
      this.generateLeakReport();
    }
  }

  private generateLeakReport(): void {
    const currentMemory = this.getCurrentMemory();
    const growth = currentMemory - this.baselineMemory;
    
    console.log('=== Memory Leak Report ===');
    console.log(`Baseline memory: ${this.baselineMemory.toFixed(2)}MB`);
    console.log(`Current memory: ${currentMemory.toFixed(2)}MB`);
    console.log(`Memory growth: +${growth.toFixed(2)}MB`);
    
    const metrics = this.parser.getMemoryMetrics();
    if (metrics) {
      console.log(`Font count: ${metrics.fontCount}`);
      console.log('Font details:');
      metrics.fonts.forEach(font => {
        console.log(`  - ${font.name}: ${(font.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      });
    }
    
    // Recommendations
    console.log('Recommendations:');
    if (metrics && metrics.fontCount > 5) {
      console.log('  - Consider unloading unused fonts');
    }
    console.log('  - Check if destroy() is being called properly');
    console.log('  - Check for circular references');
  }

  getMemoryTrend(): 'stable' | 'growing' | 'shrinking' {
    if (this.samples.length < 5) return 'stable';

    const recent = this.samples.slice(-5);
    const older = this.samples.slice(-10, -5);
    
    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    
    if (diff > 1) return 'growing';
    if (diff < -1) return 'shrinking';
    return 'stable';
  }
}

// Usage example
const leakDetector = new MemoryLeakDetector(parser);
leakDetector.startMonitoring(2000); // Check every 2 seconds

// Simulate workload
for (let i = 0; i < 1000; i++) {
  const layouts = parser.parse(`<div>Document ${i}</div>`, { viewportWidth: 800 });
  
  // Check memory trend every 100 parses
  if (i % 100 === 0) {
    const trend = leakDetector.getMemoryTrend();
    console.log(`Parse ${i}, memory trend: ${trend}`);
  }
}

leakDetector.stopMonitoring();
```

## Debug Tool Integration

### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "Debug HTML Layout Parser",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/debug-script.js",
      "env": {
        "DEBUG": "html-layout-parser:*",
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Debug Script Example

Create `debug-script.js`:

```javascript
const { HtmlLayoutParser } = require('./src/lib/html-layout-parser/index.js');
const fs = require('fs');

async function debugParse() {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init('./src/lib/html-layout-parser/html_layout_parser.js');
    
    // Load test font
    const fontData = fs.readFileSync('./fonts/arial.ttf');
    const fontId = parser.loadFont(fontData, 'Arial');
    parser.setDefaultFont(fontId);
    
    // Test HTML
    const html = `
      <div style="color: red; font-size: 16px;">
        <h1>Title</h1>
        <p>This is a test paragraph.</p>
      </div>
    `;
    
    console.log('Starting debug parse...');
    
    const result = parser.parseWithDiagnostics(html, {
      viewportWidth: 800,
      isDebug: true,
      enableMetrics: true
    });
    
    if (result.success) {
      console.log('Parse successful!');
      console.log('Character count:', result.data.length);
      
      if (result.metrics) {
        console.log('Performance metrics:', result.metrics);
      }
    } else {
      console.error('Parse failed:', result.errors);
    }
    
  } catch (error) {
    console.error('Error during debugging:', error);
  } finally {
    parser.destroy();
  }
}

debugParse();
```

## Production Environment Debugging

### Conditional Debugging

```typescript
class ConditionalDebugger {
  private enabled: boolean;
  private logLevel: 'info' | 'warn' | 'error';

  constructor(enabled: boolean = false, logLevel: 'info' | 'warn' | 'error' = 'info') {
    this.enabled = enabled;
    this.logLevel = logLevel;
  }

  log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.enabled) return;
    
    const levels = { info: 0, warn: 1, error: 2 };
    if (levels[level] < levels[this.logLevel]) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, data || '');
        break;
      case 'error':
        console.error(`${prefix} ${message}`, data || '');
        break;
    }
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setLogLevel(level: 'info' | 'warn' | 'error'): void {
    this.logLevel = level;
  }
}

// Usage example
const debugger = new ConditionalDebugger(
  process.env.NODE_ENV === 'development',
  'warn'
);

// Use during parsing
debugger.info('Starting HTML parse', { length: html.length });

try {
  const layouts = parser.parse(html, {
    viewportWidth: 800,
    isDebug: debugger.enabled
  });
  
  debugger.info('Parse completed', { charCount: layouts.length });
} catch (error) {
  debugger.error('Parse failed', error);
}
```

### Remote Debugging

```typescript
class RemoteDebugger {
  private endpoint: string;
  private sessionId: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async sendDebugData(data: {
    type: 'parse' | 'error' | 'performance';
    timestamp: number;
    payload: any;
  }): Promise<void> {
    try {
      await fetch(`${this.endpoint}/debug`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          ...data
        })
      });
    } catch (error) {
      console.warn('Failed to send debug data:', error);
    }
  }

  async logParseEvent(html: string, options: any, result: any, duration: number): Promise<void> {
    await this.sendDebugData({
      type: 'parse',
      timestamp: Date.now(),
      payload: {
        htmlLength: html.length,
        options,
        resultLength: result.length,
        duration,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js'
      }
    });
  }

  async logError(error: Error, context: any): Promise<void> {
    await this.sendDebugData({
      type: 'error',
      timestamp: Date.now(),
      payload: {
        message: error.message,
        stack: error.stack,
        context
      }
    });
  }

  async logPerformance(metrics: any): Promise<void> {
    await this.sendDebugData({
      type: 'performance',
      timestamp: Date.now(),
      payload: metrics
    });
  }
}

// Usage example (development environment only)
const remoteDebugger = process.env.NODE_ENV === 'development' 
  ? new RemoteDebugger('https://debug-api.example.com')
  : null;

// Log during parsing
const start = performance.now();
try {
  const layouts = parser.parse(html, { viewportWidth: 800 });
  const duration = performance.now() - start;
  
  if (remoteDebugger) {
    await remoteDebugger.logParseEvent(html, { viewportWidth: 800 }, layouts, duration);
  }
} catch (error) {
  if (remoteDebugger) {
    await remoteDebugger.logError(error, { html: html.substring(0, 100) });
  }
  throw error;
}
```
