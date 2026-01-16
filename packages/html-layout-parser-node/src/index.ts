/**
 * HTML Layout Parser v2.0 - Node.js Package
 * 
 * Standalone package for Node.js environments.
 * Includes additional support for loading fonts from file paths.
 * 
 * @packageDocumentation
 * @module html-layout-parser-node
 * 
 * @example Basic Usage
 * ```typescript
 * import { HtmlLayoutParser } from 'html-layout-parser-node';
 * 
 * const parser = new HtmlLayoutParser();
 * await parser.init();
 * 
 * // Load font from file
 * const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
 * parser.setDefaultFont(fontId);
 * 
 * const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });
 * parser.destroy();
 * ```
 * 
 * @example Batch Processing
 * ```typescript
 * import { HtmlLayoutParser } from 'html-layout-parser-node';
 * import { readFile } from 'fs/promises';
 * 
 * const parser = new HtmlLayoutParser();
 * await parser.init();
 * 
 * // Load font once
 * const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
 * parser.setDefaultFont(fontId);
 * 
 * // Process multiple HTML files
 * const htmlFiles = ['page1.html', 'page2.html', 'page3.html'];
 * const results = await Promise.all(
 *   htmlFiles.map(async (file) => {
 *     const html = await readFile(file, 'utf-8');
 *     return parser.parse(html, { viewportWidth: 800 });
 *   })
 * );
 * 
 * parser.destroy();
 * ```
 */

import type {
  HtmlLayoutParserModule,
  CharLayout,
  FontInfo,
  MemoryMetrics,
  ParseOptions,
  OutputMode,
  LayoutDocument,
  SimpleOutput,
  Row,
  ParseResultWithDiagnostics,
  CreateHtmlLayoutParserModule
} from './types';
import { ErrorCode } from './types';

// Re-export all types
export * from './types';

/**
 * HTML Layout Parser for Node.js environment
 * 
 * High-level TypeScript API for parsing HTML and calculating character layouts.
 * Supports multi-font management, CSS separation, and multiple output modes.
 * Includes Node.js-specific features like loading fonts from file paths.
 */
export class HtmlLayoutParser {
  protected module: HtmlLayoutParserModule | null = null;
  protected initialized = false;

  constructor() {}

  /**
   * Initialize the WASM module for Node.js
   * @param wasmPath Optional path to the WASM JS file
   */
  async init(wasmPath?: string): Promise<void> {
    if (this.initialized) {
      return;
    }

    const jsPath = wasmPath || './html_layout_parser.js';

    try {
      // In Node.js, use dynamic import
      const wasmModule = await import(/* @vite-ignore */ jsPath);
      const createModule: CreateHtmlLayoutParserModule = 
        wasmModule.default || wasmModule.createModule || wasmModule;

      if (typeof createModule === 'function') {
        this.module = await createModule();
        this.initialized = true;
        return;
      }
    } catch (error) {
      throw new Error(`Failed to load WASM module in Node.js: ${error}`);
    }

    throw new Error('Failed to load WASM module factory function in Node.js');
  }

  /**
   * Ensure the module is initialized
   */
  protected ensureInitialized(): HtmlLayoutParserModule {
    if (!this.module) {
      throw new Error('WASM module not initialized. Call init() first.');
    }
    return this.module;
  }

  // ============================================================================
  // Debug Mode API
  // ============================================================================

  /**
   * Set debug mode on/off
   * @param isDebug true to enable debug logging, false to disable
   */
  setDebugMode(isDebug: boolean): void {
    const module = this.ensureInitialized();
    if (typeof module._setDebugMode === 'function') {
      module._setDebugMode(isDebug);
    }
    if (isDebug) {
      const timestamp = new Date().toISOString();
      if (typeof process !== 'undefined' && process.stdout) {
        process.stdout.write(`[${timestamp}] [HtmlLayoutParser] Debug mode enabled\n`);
      } else {
        console.log(`[${timestamp}] [HtmlLayoutParser] Debug mode enabled`);
      }
    }
  }

  /**
   * Get current debug mode state
   * @returns true if debug mode is enabled
   */
  getDebugMode(): boolean {
    const module = this.ensureInitialized();
    if (typeof module._getDebugMode === 'function') {
      return module._getDebugMode() !== 0;
    }
    return false;
  }

  // ============================================================================
  // Font Management API
  // ============================================================================

  /**
   * Load a font from binary data
   * @param fontData Font data as Uint8Array
   * @param fontName Font name for identification
   * @returns Font ID on success, 0 on failure
   */
  loadFont(fontData: Uint8Array, fontName: string): number {
    const module = this.ensureInitialized();

    const dataPtr = module._malloc(fontData.length);
    if (dataPtr === 0) return 0;

    const nameBytes = module.lengthBytesUTF8(fontName) + 1;
    const namePtr = module._malloc(nameBytes);
    if (namePtr === 0) {
      module._free(dataPtr);
      return 0;
    }

    try {
      module.HEAPU8.set(fontData, dataPtr);
      module.stringToUTF8(fontName, namePtr, nameBytes);
      return module._loadFont(dataPtr, fontData.length, namePtr);
    } finally {
      module._free(dataPtr);
      module._free(namePtr);
    }
  }

  /**
   * Load a font from a file path (Node.js only)
   * 
   * @param fontPath Path to the font file
   * @param fontName Font name for identification
   * @returns Font ID on success, 0 on failure
   * 
   * @example
   * ```typescript
   * const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
   * if (fontId > 0) {
   *   parser.setDefaultFont(fontId);
   * }
   * ```
   */
  async loadFontFromFile(fontPath: string, fontName: string): Promise<number> {
    try {
      // Dynamic import for fs/promises
      const { readFile } = await import('fs/promises');
      const buffer = await readFile(fontPath);
      const fontData = new Uint8Array(buffer);
      return this.loadFont(fontData, fontName);
    } catch (error) {
      throw new Error(`Failed to load font from file '${fontPath}': ${error}`);
    }
  }

  /**
   * Load multiple fonts from file paths
   * 
   * @param fonts Array of { path, name } objects
   * @returns Array of font IDs (0 for failed loads)
   * 
   * @example
   * ```typescript
   * const fontIds = await parser.loadFontsFromFiles([
   *   { path: './fonts/arial.ttf', name: 'Arial' },
   *   { path: './fonts/times.ttf', name: 'Times New Roman' }
   * ]);
   * ```
   */
  async loadFontsFromFiles(fonts: Array<{ path: string; name: string }>): Promise<number[]> {
    const results: number[] = [];
    for (const font of fonts) {
      try {
        const fontId = await this.loadFontFromFile(font.path, font.name);
        results.push(fontId);
      } catch {
        results.push(0);
      }
    }
    return results;
  }

  /**
   * Unload a font and free its memory
   * @param fontId Font ID to unload
   */
  unloadFont(fontId: number): void {
    const module = this.ensureInitialized();
    module._unloadFont(fontId);
  }

  /**
   * Set the default font for fallback
   * @param fontId Font ID to set as default
   */
  setDefaultFont(fontId: number): void {
    const module = this.ensureInitialized();
    module._setDefaultFont(fontId);
  }

  /**
   * Get list of loaded fonts
   * @returns Array of font information
   */
  getLoadedFonts(): FontInfo[] {
    const module = this.ensureInitialized();
    const resultPtr = module._getLoadedFonts();
    if (resultPtr === 0) return [];

    const result = module.UTF8ToString(resultPtr);
    module._freeString(resultPtr);

    try {
      return JSON.parse(result);
    } catch {
      return [];
    }
  }

  /**
   * Clear all loaded fonts
   */
  clearAllFonts(): void {
    const module = this.ensureInitialized();
    module._clearAllFonts();
  }

  // ============================================================================
  // HTML Parsing API
  // ============================================================================

  /**
   * Parse HTML and calculate character layouts
   */
  parse<T extends OutputMode = 'flat'>(
    html: string,
    options: ParseOptions
  ): T extends 'full' ? LayoutDocument :
     T extends 'simple' ? SimpleOutput :
     T extends 'byRow' ? Row[] :
     CharLayout[] {
    const module = this.ensureInitialized();
    const mode = options.mode || 'flat';
    
    if (options.isDebug !== undefined) {
      this.setDebugMode(options.isDebug);
    }

    let htmlPtr = 0;
    let modePtr = 0;
    let cssPtr = 0;

    try {
      const htmlBytes = module.lengthBytesUTF8(html) + 1;
      htmlPtr = module._malloc(htmlBytes);
      if (htmlPtr === 0) throw new Error('Failed to allocate memory for HTML string');
      module.stringToUTF8(html, htmlPtr, htmlBytes);

      const modeBytes = module.lengthBytesUTF8(mode) + 1;
      modePtr = module._malloc(modeBytes);
      if (modePtr === 0) throw new Error('Failed to allocate memory for mode string');
      module.stringToUTF8(mode, modePtr, modeBytes);

      if (options.css) {
        const cssBytes = module.lengthBytesUTF8(options.css) + 1;
        cssPtr = module._malloc(cssBytes);
        if (cssPtr === 0) throw new Error('Failed to allocate memory for CSS string');
        module.stringToUTF8(options.css, cssPtr, cssBytes);
      }

      const resultPtr = module._parseHTML(htmlPtr, cssPtr, options.viewportWidth, modePtr, 0);
      if (resultPtr === 0) return [] as any;

      const result = module.UTF8ToString(resultPtr);
      module._freeString(resultPtr);

      try {
        return JSON.parse(result);
      } catch {
        return [] as any;
      }
    } finally {
      if (htmlPtr !== 0) module._free(htmlPtr);
      if (modePtr !== 0) module._free(modePtr);
      if (cssPtr !== 0) module._free(cssPtr);
    }
  }

  /**
   * Parse HTML with external CSS (convenience method)
   */
  parseWithCSS<T extends OutputMode = 'flat'>(
    html: string,
    css: string,
    options: Omit<ParseOptions, 'css'>
  ): T extends 'full' ? LayoutDocument :
     T extends 'simple' ? SimpleOutput :
     T extends 'byRow' ? Row[] :
     CharLayout[] {
    return this.parse<T>(html, { ...options, css });
  }

  /**
   * Parse HTML and return result with full diagnostics
   */
  parseWithDiagnostics<T extends OutputMode = 'flat'>(
    html: string,
    options: ParseOptions
  ): ParseResultWithDiagnostics<
    T extends 'full' ? LayoutDocument :
    T extends 'simple' ? SimpleOutput :
    T extends 'byRow' ? Row[] :
    CharLayout[]
  > {
    const module = this.ensureInitialized();
    const mode = options.mode || 'flat';
    
    if (options.isDebug !== undefined) {
      this.setDebugMode(options.isDebug);
    }

    let htmlPtr = 0;
    let modePtr = 0;
    let cssPtr = 0;

    try {
      const htmlBytes = module.lengthBytesUTF8(html) + 1;
      htmlPtr = module._malloc(htmlBytes);
      if (htmlPtr === 0) {
        return {
          success: false,
          errors: [{ code: ErrorCode.MemoryAllocationFailed, message: 'Failed to allocate memory for HTML string', severity: 'error' }]
        };
      }
      module.stringToUTF8(html, htmlPtr, htmlBytes);

      const modeBytes = module.lengthBytesUTF8(mode) + 1;
      modePtr = module._malloc(modeBytes);
      if (modePtr === 0) {
        return {
          success: false,
          errors: [{ code: ErrorCode.MemoryAllocationFailed, message: 'Failed to allocate memory for mode string', severity: 'error' }]
        };
      }
      module.stringToUTF8(mode, modePtr, modeBytes);

      if (options.css) {
        const cssBytes = module.lengthBytesUTF8(options.css) + 1;
        cssPtr = module._malloc(cssBytes);
        if (cssPtr === 0) {
          return {
            success: false,
            errors: [{ code: ErrorCode.MemoryAllocationFailed, message: 'Failed to allocate memory for CSS string', severity: 'error' }]
          };
        }
        module.stringToUTF8(options.css, cssPtr, cssBytes);
      }

      const resultPtr = module._parseHTMLWithDiagnostics(htmlPtr, cssPtr, options.viewportWidth, modePtr, 0);
      if (resultPtr === 0) {
        return {
          success: false,
          errors: [{ code: ErrorCode.InternalError, message: 'parseHTMLWithDiagnostics returned null pointer', severity: 'error' }]
        };
      }

      const resultJson = module.UTF8ToString(resultPtr);
      module._freeString(resultPtr);

      try {
        return JSON.parse(resultJson);
      } catch {
        return {
          success: false,
          errors: [{ code: ErrorCode.SerializationFailed, message: 'Failed to parse result JSON', severity: 'error' }]
        };
      }
    } finally {
      if (htmlPtr !== 0) module._free(htmlPtr);
      if (modePtr !== 0) module._free(modePtr);
      if (cssPtr !== 0) module._free(cssPtr);
    }
  }

  // ============================================================================
  // Utility API
  // ============================================================================

  /**
   * Get parser version
   */
  getVersion(): string {
    const module = this.ensureInitialized();
    const resultPtr = module._getVersion();
    if (resultPtr === 0) return '';
    const result = module.UTF8ToString(resultPtr);
    module._freeString(resultPtr);
    return result;
  }

  /**
   * Get memory metrics
   */
  getMetrics(): MemoryMetrics | null {
    const module = this.ensureInitialized();
    const resultPtr = module._getMetrics();
    if (resultPtr === 0) return null;
    const result = module.UTF8ToString(resultPtr);
    module._freeString(resultPtr);
    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

  /**
   * Check if the module is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get total memory usage in bytes
   */
  getTotalMemoryUsage(): number {
    const module = this.ensureInitialized();
    if (typeof module._getTotalMemoryUsage === 'function') {
      return module._getTotalMemoryUsage();
    }
    return 0;
  }

  /**
   * Check if memory usage exceeds the threshold (50MB)
   */
  checkMemoryThreshold(): boolean {
    const module = this.ensureInitialized();
    if (typeof module._checkMemoryThreshold === 'function') {
      return module._checkMemoryThreshold() !== 0;
    }
    return false;
  }

  /**
   * Get detailed memory metrics
   */
  getMemoryMetrics(): MemoryMetrics | null {
    const module = this.ensureInitialized();
    if (typeof module._getMemoryMetrics !== 'function') return null;
    const resultPtr = module._getMemoryMetrics();
    if (resultPtr === 0) return null;
    const result = module.UTF8ToString(resultPtr);
    module._freeString(resultPtr);
    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

  /**
   * Destroy the parser and release all resources
   */
  destroy(): void {
    if (this.module) {
      if (typeof this.module._destroy === 'function') {
        this.module._destroy();
      } else {
        this.clearAllFonts();
      }
      this.module = null;
      this.initialized = false;
    }
  }
}

/**
 * Create a new HtmlLayoutParser instance for Node.js
 */
export function createParser(): HtmlLayoutParser {
  return new HtmlLayoutParser();
}

export default HtmlLayoutParser;
