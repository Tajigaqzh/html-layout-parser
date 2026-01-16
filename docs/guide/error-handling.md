# Error Handling

HTML Layout Parser provides comprehensive error handling mechanisms to help you diagnose and handle various parsing issues.

## Error Types

### Error Code Classification

| Code Range | Category | Description |
|------------|----------|-------------|
| 0 | Success | Operation completed successfully |
| 1xxx | Input Validation | HTML, CSS, or parameter validation failures |
| 2xxx | Font Errors | Font loading, unloading, or usage errors |
| 3xxx | Parse Errors | Errors during HTML/CSS parsing |
| 4xxx | Memory Errors | Memory allocation or management errors |
| 5xxx | Internal Errors | System internal errors |

### Common Error Codes

```typescript
// Input Validation Errors (1xxx)
const INPUT_ERRORS = {
  1001: 'HTML content is empty',
  1002: 'Invalid viewport width',
  1003: 'CSS syntax error',
  1004: 'Parameter type error',
  1005: 'Document size exceeds limit'
};

// Font Errors (2xxx)
const FONT_ERRORS = {
  2001: 'Invalid font data',
  2002: 'Font loading failed',
  2003: 'Font ID does not exist',
  2004: 'Font format not supported',
  2005: 'Default font not set'
};

// Parse Errors (3xxx)
const PARSE_ERRORS = {
  3001: 'HTML parsing failed',
  3002: 'CSS parsing failed',
  3003: 'Layout calculation failed',
  3004: 'Parse timeout',
  3005: 'Unsupported CSS property'
};

// Memory Errors (4xxx)
const MEMORY_ERRORS = {
  4001: 'Memory allocation failed',
  4002: 'Memory usage exceeds limit',
  4003: 'Buffer overflow',
  4004: 'Memory leak detected'
};

// Internal Errors (5xxx)
const INTERNAL_ERRORS = {
  5001: 'WASM module not initialized',
  5002: 'Internal state error',
  5003: 'Insufficient system resources',
  5004: 'Unknown internal error'
};
```

## Basic Error Handling

### Using try-catch

```typescript
async function basicErrorHandling() {
  const parser = new HtmlLayoutParser();
  
  try {
    await parser.init();
    
    const fontData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
    const fontId = parser.loadFont(new Uint8Array(fontData), 'Arial');
    
    if (fontId <= 0) {
      throw new Error('Font loading failed');
    }
    
    parser.setDefaultFont(fontId);
    
    const layouts = parser.parse(html, { viewportWidth: 800 });
    return layouts;
    
  } catch (error) {
    console.error('Error during parsing:', error);
    
    // Handle based on error type
    if (error.message.includes('font')) {
      console.error('Font-related error, please check font file');
    } else if (error.message.includes('HTML')) {
      console.error('HTML parsing error, please check HTML format');
    } else {
      console.error('Unknown error:', error);
    }
    
    return null;
  } finally {
    parser.destroy();
  }
}
```

### Using Diagnostic Mode

```typescript
function diagnosticErrorHandling(html: string) {
  const parser = new HtmlLayoutParser();
  
  try {
    // Use diagnostic mode for detailed error information
    const result = parser.parseWithDiagnostics(html, {
      viewportWidth: 800,
      enableMetrics: true
    });
    
    if (result.success) {
      console.log('Parse successful');
      
      // Check warnings
      if (result.warnings && result.warnings.length > 0) {
        console.warn('Parse warnings:');
        result.warnings.forEach(warning => {
          console.warn(`  - ${warning.message}`);
          if (warning.line) {
            console.warn(`    Location: line ${warning.line}, column ${warning.column}`);
          }
        });
      }
      
      return result.data;
    } else {
      console.error('Parse failed');
      
      // Handle errors
      if (result.errors) {
        result.errors.forEach(error => {
          console.error(`Error [${error.code}]: ${error.message}`);
          
          if (error.line && error.column) {
            console.error(`  Location: line ${error.line}, column ${error.column}`);
          }
          
          if (error.suggestion) {
            console.error(`  Suggestion: ${error.suggestion}`);
          }
        });
      }
      
      return null;
    }
  } finally {
    parser.destroy();
  }
}
```

## Advanced Error Handling

### Error Classification Handler

```typescript
class ErrorHandler {
  private parser: HtmlLayoutParser;
  private retryCount: Map<string, number> = new Map();
  private maxRetries: number = 3;

  constructor(parser: HtmlLayoutParser, maxRetries: number = 3) {
    this.parser = parser;
    this.maxRetries = maxRetries;
  }

  async handleParseWithRetry(
    html: string, 
    options: { viewportWidth: number },
    retryKey?: string
  ): Promise<CharLayout[] | null> {
    const key = retryKey || this.generateRetryKey(html, options);
    const currentRetries = this.retryCount.get(key) || 0;

    try {
      const result = this.parser.parseWithDiagnostics(html, options);
      
      if (result.success) {
        // Reset retry count on success
        this.retryCount.delete(key);
        return result.data;
      } else {
        return this.handleParseErrors(result.errors || [], html, options, key);
      }
    } catch (error) {
      return this.handleException(error, html, options, key);
    }
  }

  private async handleParseErrors(
    errors: any[],
    html: string,
    options: { viewportWidth: number },
    retryKey: string
  ): Promise<CharLayout[] | null> {
    for (const error of errors) {
      const errorCode = error.code;
      
      switch (Math.floor(errorCode / 1000)) {
        case 1: // Input validation errors
          return this.handleInputError(error, html, options);
          
        case 2: // Font errors
          const fontFixed = await this.handleFontError(error);
          if (fontFixed) {
            return this.retryParse(html, options, retryKey);
          }
          break;
          
        case 3: // Parse errors
          const parseFixed = this.handleParseError(error, html);
          if (parseFixed) {
            return this.retryParse(parseFixed, options, retryKey);
          }
          break;
          
        case 4: // Memory errors
          const memoryFixed = await this.handleMemoryError(error);
          if (memoryFixed) {
            return this.retryParse(html, options, retryKey);
          }
          break;
          
        case 5: // Internal errors
          console.error('Internal error, cannot auto-fix:', error);
          break;
      }
    }
    
    return null;
  }

  private handleInputError(error: any, html: string, options: { viewportWidth: number }): CharLayout[] | null {
    switch (error.code) {
      case 1001: // HTML content is empty
        console.warn('HTML content is empty, returning empty result');
        return [];
        
      case 1002: // Invalid viewport width
        console.warn('Invalid viewport width, using default 800');
        return this.parser.parse(html, { ...options, viewportWidth: 800 });
        
      case 1005: // Document size exceeds limit
        console.warn('Document too large, attempting truncation');
        const truncatedHtml = html.substring(0, 50000);
        return this.parser.parse(truncatedHtml, options);
        
      default:
        console.error('Cannot handle input error:', error);
        return null;
    }
  }

  private async handleFontError(error: any): Promise<boolean> {
    switch (error.code) {
      case 2005: // Default font not set
        console.warn('Default font not set, attempting to load system font');
        try {
          // Try to load a basic font
          const response = await fetch('/fonts/arial.ttf');
          if (response.ok) {
            const fontData = new Uint8Array(await response.arrayBuffer());
            const fontId = this.parser.loadFont(fontData, 'Arial');
            if (fontId > 0) {
              this.parser.setDefaultFont(fontId);
              return true;
            }
          }
        } catch (e) {
          console.error('Failed to load default font:', e);
        }
        return false;
        
      case 2001: // Invalid font data
      case 2002: // Font loading failed
        console.warn('Font issue, clearing and reloading fonts');
        this.parser.clearAllFonts();
        // Can attempt to reload fonts here
        return false;
        
      default:
        return false;
    }
  }

  private handleParseError(error: any, html: string): string | null {
    switch (error.code) {
      case 3004: // Parse timeout
        console.warn('Parse timeout, attempting to simplify HTML');
        // Remove complex CSS
        return html.replace(/style\s*=\s*"[^"]*"/g, '');
        
      case 3005: // Unsupported CSS property
        console.warn('Contains unsupported CSS, attempting cleanup');
        // Remove all inline styles
        return html.replace(/style\s*=\s*"[^"]*"/g, '');
        
      default:
        return null;
    }
  }

  private async handleMemoryError(error: any): Promise<boolean> {
    switch (error.code) {
      case 4002: // Memory usage exceeds limit
        console.warn('High memory usage, clearing cache and fonts');
        this.parser.clearCache();
        
        // Keep only one default font
        const fonts = this.parser.getLoadedFonts();
        if (fonts.length > 1) {
          for (let i = 1; i < fonts.length; i++) {
            this.parser.unloadFont(fonts[i].id);
          }
        }
        return true;
        
      default:
        return false;
    }
  }

  private async retryParse(
    html: string,
    options: { viewportWidth: number },
    retryKey: string
  ): Promise<CharLayout[] | null> {
    const currentRetries = this.retryCount.get(retryKey) || 0;
    
    if (currentRetries >= this.maxRetries) {
      console.error(`Retry limit reached (${this.maxRetries}), giving up`);
      return null;
    }
    
    this.retryCount.set(retryKey, currentRetries + 1);
    console.log(`Retry attempt ${currentRetries + 1}...`);
    
    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 100 * (currentRetries + 1)));
    
    return this.handleParseWithRetry(html, options, retryKey);
  }

  private handleException(
    error: any,
    html: string,
    options: { viewportWidth: number },
    retryKey: string
  ): Promise<CharLayout[] | null> {
    console.error('Exception during parsing:', error);
    
    // Check if it's a memory-related exception
    if (error.message.includes('memory') || error.message.includes('allocation')) {
      console.warn('Detected memory-related exception, attempting cleanup');
      this.parser.clearCache();
      this.parser.clearAllFonts();
      
      return this.retryParse(html, options, retryKey);
    }
    
    // Check if it's an initialization-related exception
    if (error.message.includes('not initialized')) {
      console.warn('Parser not initialized, needs external reinitialization');
      // External reinitialization needed
      return Promise.resolve(null);
    }
    
    return Promise.resolve(null);
  }

  private generateRetryKey(html: string, options: { viewportWidth: number }): string {
    // Generate unique key based on content and options
    const contentHash = this.simpleHash(html);
    return `${contentHash}-${options.viewportWidth}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  clearRetryHistory(): void {
    this.retryCount.clear();
  }
}

// Usage example
const parser = new HtmlLayoutParser();
await parser.init();

const errorHandler = new ErrorHandler(parser, 3);

const layouts = await errorHandler.handleParseWithRetry(html, {
  viewportWidth: 800
});

if (layouts) {
  console.log('Parse successful, got', layouts.length, 'character layouts');
} else {
  console.error('Parse ultimately failed');
}
```

### Error Recovery Strategies

```typescript
class ErrorRecoveryManager {
  private parser: HtmlLayoutParser;
  private fallbackStrategies: Array<(html: string, options: any) => Promise<CharLayout[] | null>>;

  constructor(parser: HtmlLayoutParser) {
    this.parser = parser;
    this.fallbackStrategies = [
      this.strategySimplifyCSS.bind(this),
      this.strategyRemoveComplexElements.bind(this),
      this.strategyBasicTextOnly.bind(this),
      this.strategyEmergencyFallback.bind(this)
    ];
  }

  async parseWithRecovery(html: string, options: { viewportWidth: number }): Promise<{
    success: boolean;
    data: CharLayout[] | null;
    strategy: string;
    attempts: number;
  }> {
    // First try normal parsing
    try {
      const result = this.parser.parseWithDiagnostics(html, options);
      if (result.success) {
        return {
          success: true,
          data: result.data,
          strategy: 'normal',
          attempts: 1
        };
      }
    } catch (error) {
      console.warn('Normal parse failed, starting error recovery:', error.message);
    }

    // Try recovery strategies in sequence
    for (let i = 0; i < this.fallbackStrategies.length; i++) {
      const strategy = this.fallbackStrategies[i];
      const strategyName = this.getStrategyName(i);
      
      console.log(`Trying recovery strategy: ${strategyName}`);
      
      try {
        const result = await strategy(html, options);
        if (result && result.length > 0) {
          return {
            success: true,
            data: result,
            strategy: strategyName,
            attempts: i + 2
          };
        }
      } catch (error) {
        console.warn(`Recovery strategy ${strategyName} failed:`, error.message);
      }
    }

    return {
      success: false,
      data: null,
      strategy: 'all_failed',
      attempts: this.fallbackStrategies.length + 1
    };
  }

  private async strategySimplifyCSS(html: string, options: any): Promise<CharLayout[] | null> {
    // Strategy 1: Simplify CSS
    const simplifiedHtml = html
      .replace(/style\s*=\s*"[^"]*"/g, '') // Remove inline styles
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags
      .replace(/class\s*=\s*"[^"]*"/g, ''); // Remove class attributes

    return this.parser.parse(simplifiedHtml, options);
  }

  private async strategyRemoveComplexElements(html: string, options: any): Promise<CharLayout[] | null> {
    // Strategy 2: Remove complex elements
    const simplifiedHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script
      .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '') // Remove iframe
      .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '') // Remove object
      .replace(/<embed[^>]*>/gi, '') // Remove embed
      .replace(/<canvas[^>]*>[\s\S]*?<\/canvas>/gi, '') // Remove canvas
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, ''); // Remove svg

    return this.parser.parse(simplifiedHtml, options);
  }

  private async strategyBasicTextOnly(html: string, options: any): Promise<CharLayout[] | null> {
    // Strategy 3: Keep only basic text elements
    const textOnlyHtml = html
      .replace(/<(?!\/?(div|p|span|h[1-6]|br|strong|em|b|i)\b)[^>]*>/gi, '') // Keep only basic text tags
      .replace(/\s+/g, ' ') // Merge whitespace
      .trim();

    if (!textOnlyHtml) {
      return null;
    }

    return this.parser.parse(`<div>${textOnlyHtml}</div>`, options);
  }

  private async strategyEmergencyFallback(html: string, options: any): Promise<CharLayout[] | null> {
    // Strategy 4: Emergency fallback - extract plain text
    const textContent = html
      .replace(/<[^>]*>/g, ' ') // Remove all tags
      .replace(/\s+/g, ' ') // Merge whitespace
      .trim();

    if (!textContent) {
      return [];
    }

    // Create simplest HTML
    const emergencyHtml = `<div>${textContent}</div>`;
    
    try {
      return this.parser.parse(emergencyHtml, {
        ...options,
        maxCharacters: Math.min(textContent.length, 1000) // Limit length
      });
    } catch (error) {
      // Final fallback: return empty array instead of failure
      console.warn('All recovery strategies failed, returning empty result');
      return [];
    }
  }

  private getStrategyName(index: number): string {
    const names = [
      'simplify_css',
      'remove_complex_elements',
      'basic_text_only',
      'emergency_fallback'
    ];
    return names[index] || 'unknown';
  }
}

// Usage example
const parser = new HtmlLayoutParser();
await parser.init();

const recoveryManager = new ErrorRecoveryManager(parser);

const result = await recoveryManager.parseWithRecovery(html, {
  viewportWidth: 800
});

if (result.success) {
  console.log(`Parse successful (strategy: ${result.strategy}, attempts: ${result.attempts})`);
  console.log('Character count:', result.data?.length);
} else {
  console.error('All recovery strategies failed');
}
```

## Error Monitoring and Reporting

### Error Statistics Collector

```typescript
class ErrorStatistics {
  private stats: Map<number, {
    count: number;
    lastOccurrence: number;
    samples: string[];
  }> = new Map();

  recordError(errorCode: number, context?: string): void {
    const existing = this.stats.get(errorCode) || {
      count: 0,
      lastOccurrence: 0,
      samples: []
    };

    existing.count++;
    existing.lastOccurrence = Date.now();
    
    if (context && existing.samples.length < 5) {
      existing.samples.push(context);
    }

    this.stats.set(errorCode, existing);
  }

  getErrorReport(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    topErrors: Array<{ code: number; count: number; category: string }>;
    recentErrors: Array<{ code: number; timestamp: number }>;
  } {
    const totalErrors = Array.from(this.stats.values())
      .reduce((sum, stat) => sum + stat.count, 0);

    const errorsByCategory: Record<string, number> = {};
    const topErrors: Array<{ code: number; count: number; category: string }> = [];
    const recentErrors: Array<{ code: number; timestamp: number }> = [];

    for (const [code, stat] of this.stats) {
      const category = this.getCategoryName(code);
      errorsByCategory[category] = (errorsByCategory[category] || 0) + stat.count;
      
      topErrors.push({ code, count: stat.count, category });
      
      if (Date.now() - stat.lastOccurrence < 3600000) { // Last 1 hour
        recentErrors.push({ code, timestamp: stat.lastOccurrence });
      }
    }

    topErrors.sort((a, b) => b.count - a.count);
    recentErrors.sort((a, b) => b.timestamp - a.timestamp);

    return {
      totalErrors,
      errorsByCategory,
      topErrors: topErrors.slice(0, 10),
      recentErrors: recentErrors.slice(0, 20)
    };
  }

  private getCategoryName(errorCode: number): string {
    const category = Math.floor(errorCode / 1000);
    const categories: Record<number, string> = {
      1: 'Input Validation',
      2: 'Font Related',
      3: 'Parse Errors',
      4: 'Memory Errors',
      5: 'Internal Errors'
    };
    return categories[category] || 'Unknown';
  }

  clear(): void {
    this.stats.clear();
  }

  exportStats(): string {
    return JSON.stringify(Object.fromEntries(this.stats), null, 2);
  }
}

// Usage example
const errorStats = new ErrorStatistics();

// Record in error handling
try {
  const layouts = parser.parse(html, { viewportWidth: 800 });
} catch (error) {
  // Assuming we can extract error code from error
  const errorCode = extractErrorCode(error);
  errorStats.recordError(errorCode, html.substring(0, 100));
}

// Generate report periodically
setInterval(() => {
  const report = errorStats.getErrorReport();
  console.log('Error statistics report:', report);
}, 300000); // Every 5 minutes
```

### Error Reporting System

```typescript
class ErrorReporter {
  private endpoint: string;
  private apiKey: string;
  private batchSize: number;
  private errorQueue: Array<{
    timestamp: number;
    errorCode: number;
    message: string;
    context: any;
    userAgent: string;
    sessionId: string;
  }> = [];

  constructor(endpoint: string, apiKey: string, batchSize: number = 10) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.batchSize = batchSize;
  }

  reportError(
    errorCode: number,
    message: string,
    context: any = {},
    sessionId: string = 'unknown'
  ): void {
    this.errorQueue.push({
      timestamp: Date.now(),
      errorCode,
      message,
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
      sessionId
    });

    if (this.errorQueue.length >= this.batchSize) {
      this.flushErrors();
    }
  }

  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          errors,
          timestamp: Date.now(),
          version: '0.2.0'
        })
      });
    } catch (error) {
      console.warn('Error reporting failed:', error);
      // Re-add errors to queue
      this.errorQueue.unshift(...errors);
    }
  }

  async flush(): Promise<void> {
    await this.flushErrors();
  }
}

// Usage example
const errorReporter = new ErrorReporter(
  'https://api.example.com/errors',
  'your-api-key',
  5
);

// Use in error handling
try {
  const layouts = parser.parse(html, { viewportWidth: 800 });
} catch (error) {
  const errorCode = extractErrorCode(error);
  
  errorReporter.reportError(
    errorCode,
    error.message,
    {
      htmlLength: html.length,
      viewportWidth: 800,
      stackTrace: error.stack
    },
    generateSessionId()
  );
  
  // Continue error handling...
}

// Ensure all errors are reported before app closes
process.on('beforeExit', async () => {
  await errorReporter.flush();
});
```

## Production Environment Error Handling

### Graceful Degradation

```typescript
class GracefulDegradation {
  private parser: HtmlLayoutParser;
  private fallbackRenderer: (html: string) => CharLayout[];

  constructor(parser: HtmlLayoutParser) {
    this.parser = parser;
    this.fallbackRenderer = this.createFallbackRenderer();
  }

  async parseWithGracefulDegradation(
    html: string,
    options: { viewportWidth: number }
  ): Promise<{
    layouts: CharLayout[];
    degraded: boolean;
    reason?: string;
  }> {
    try {
      // Try normal parsing
      const layouts = this.parser.parse(html, options);
      return {
        layouts,
        degraded: false
      };
    } catch (error) {
      console.warn('Normal parse failed, enabling graceful degradation:', error.message);
      
      try {
        // Try simplified parsing
        const simplifiedLayouts = await this.trySimplifiedParse(html, options);
        if (simplifiedLayouts) {
          return {
            layouts: simplifiedLayouts,
            degraded: true,
            reason: 'simplified_parse'
          };
        }
      } catch (simplifiedError) {
        console.warn('Simplified parse also failed:', simplifiedError.message);
      }

      // Final fallback: use plain text rendering
      const fallbackLayouts = this.fallbackRenderer(html);
      return {
        layouts: fallbackLayouts,
        degraded: true,
        reason: 'fallback_renderer'
      };
    }
  }

  private async trySimplifiedParse(
    html: string,
    options: { viewportWidth: number }
  ): Promise<CharLayout[] | null> {
    // Remove complex CSS and elements
    const simplifiedHtml = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/style\s*=\s*"[^"]*"/g, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<(?!\/?(div|p|span|h[1-6]|br|strong|em|b|i|a)\b)[^>]*>/gi, '');

    return this.parser.parse(simplifiedHtml, {
      ...options,
      maxCharacters: 10000,
      timeout: 5000
    });
  }

  private createFallbackRenderer(): (html: string) => CharLayout[] {
    return (html: string) => {
      // Extract plain text
      const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
      // Create basic character layouts
      const layouts: CharLayout[] = [];
      let x = 0;
      const y = 20; // Baseline position
      const fontSize = 16;
      const charWidth = fontSize * 0.6; // Estimated character width

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (char === ' ') {
          x += charWidth;
          continue;
        }

        layouts.push({
          character: char,
          x,
          y,
          width: charWidth,
          height: fontSize,
          baseline: y,
          fontFamily: 'Arial',
          fontSize,
          fontWeight: 400,
          fontStyle: 'normal',
          fontId: 0,
          color: '#000000FF',
          backgroundColor: '#00000000',
          opacity: 1,
          textDecoration: {
            underline: false,
            overline: false,
            lineThrough: false,
            color: '#000000FF',
            style: 'solid',
            thickness: 1
          },
          letterSpacing: 0,
          wordSpacing: 0,
          textShadow: [],
          transform: {
            scaleX: 1,
            scaleY: 1,
            skewX: 0,
            skewY: 0,
            rotate: 0
          },
          direction: 'ltr'
        });

        x += charWidth;
      }

      return layouts;
    };
  }
}

// Usage example
const gracefulDegradation = new GracefulDegradation(parser);

const result = await gracefulDegradation.parseWithGracefulDegradation(html, {
  viewportWidth: 800
});

if (result.degraded) {
  console.warn(`Using degraded mode: ${result.reason}`);
  // May need to notify user or log
}

// Use result
renderToCanvas(ctx, result.layouts);
```

### Error Boundary Component

```typescript
class ParserErrorBoundary {
  private parser: HtmlLayoutParser;
  private errorCallback?: (error: Error, html: string) => void;
  private maxConsecutiveErrors: number;
  private consecutiveErrors: number = 0;
  private lastErrorTime: number = 0;

  constructor(
    parser: HtmlLayoutParser,
    options: {
      maxConsecutiveErrors?: number;
      errorCallback?: (error: Error, html: string) => void;
    } = {}
  ) {
    this.parser = parser;
    this.maxConsecutiveErrors = options.maxConsecutiveErrors || 5;
    this.errorCallback = options.errorCallback;
  }

  async safeParse(
    html: string,
    options: { viewportWidth: number }
  ): Promise<CharLayout[] | null> {
    // Check if parsing should be paused (too many consecutive errors)
    if (this.shouldPause()) {
      console.warn('Too many consecutive errors, pausing parsing');
      return null;
    }

    try {
      const layouts = this.parser.parse(html, options);
      
      // Reset error count on success
      this.consecutiveErrors = 0;
      return layouts;
      
    } catch (error) {
      this.handleError(error, html);
      return null;
    }
  }

  private shouldPause(): boolean {
    const now = Date.now();
    const timeSinceLastError = now - this.lastErrorTime;
    
    // Reset count if more than 1 minute since last error
    if (timeSinceLastError > 60000) {
      this.consecutiveErrors = 0;
      return false;
    }

    return this.consecutiveErrors >= this.maxConsecutiveErrors;
  }

  private handleError(error: Error, html: string): void {
    this.consecutiveErrors++;
    this.lastErrorTime = Date.now();

    console.error(`Parse error (consecutive #${this.consecutiveErrors}):`, error.message);

    if (this.errorCallback) {
      try {
        this.errorCallback(error, html);
      } catch (callbackError) {
        console.error('Error callback execution failed:', callbackError);
      }
    }

    // If too many consecutive errors, suggest parser restart
    if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
      console.error('Too many consecutive errors, recommend restarting parser');
    }
  }

  reset(): void {
    this.consecutiveErrors = 0;
    this.lastErrorTime = 0;
  }

  getErrorCount(): number {
    return this.consecutiveErrors;
  }
}

// Usage example
const errorBoundary = new ParserErrorBoundary(parser, {
  maxConsecutiveErrors: 3,
  errorCallback: (error, html) => {
    // Log error to monitoring system
    console.error('Parse error:', {
      message: error.message,
      htmlLength: html.length,
      timestamp: new Date().toISOString()
    });
  }
});

// Use in application
const layouts = await errorBoundary.safeParse(html, { viewportWidth: 800 });

if (layouts) {
  // Normal processing
  renderToCanvas(ctx, layouts);
} else {
  // Show error state or use fallback
  showErrorMessage('Parse failed, please try again later');
}
```
