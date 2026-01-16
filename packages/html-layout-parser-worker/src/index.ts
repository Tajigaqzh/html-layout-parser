/**
 * HTML Layout Parser v2.0 - Web Worker Package
 * 
 * Standalone package for Web Worker environments.
 * Supports both module workers and classic workers.
 * 
 * @packageDocumentation
 * @module html-layout-parser-worker
 * 
 * @example Module Worker
 * ```typescript
 * // worker.ts
 * import { HtmlLayoutParser } from 'html-layout-parser-worker';
 * 
 * const parser = new HtmlLayoutParser();
 * await parser.init();
 * 
 * self.onmessage = async (e) => {
 *   const { html, options } = e.data;
 *   const result = parser.parse(html, options);
 *   self.postMessage(result);
 * };
 * ```
 * 
 * @example With OffscreenCanvas
 * ```typescript
 * // worker.ts
 * import { HtmlLayoutParser } from 'html-layout-parser-worker';
 * 
 * const parser = new HtmlLayoutParser();
 * await parser.init();
 * 
 * self.onmessage = async (e) => {
 *   const { html, canvas } = e.data;
 *   const layouts = parser.parse(html, { viewportWidth: canvas.width });
 *   
 *   const ctx = canvas.getContext('2d');
 *   // Render layouts to OffscreenCanvas...
 *   
 *   const bitmap = canvas.transferToImageBitmap();
 *   self.postMessage({ bitmap }, [bitmap]);
 * };
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

declare const self: WorkerGlobalScope & typeof globalThis;

/**
 * HTML Layout Parser for Web Worker environment
 * 
 * High-level TypeScript API for parsing HTML and calculating character layouts.
 * Supports multi-font management, CSS separation, and multiple output modes.
 * Works with both module workers and classic workers.
 */
export class HtmlLayoutParser {
  protected module: HtmlLayoutParserModule | null = null;
  protected initialized = false;

  constructor() {}

  /**
   * Initialize the WASM module for Web Worker
   * @param wasmPath Optional path to the WASM JS file
   */
  async init(wasmPath?: string): Promise<void> {
    if (this.initialized) {
      return;
    }

    const jsPath = wasmPath || './html_layout_parser.js';

    // Try ES module import first (for module workers)
    try {
      const wasmModule = await import(/* @vite-ignore */ jsPath);
      const createModule: CreateHtmlLayoutParserModule = 
        wasmModule.default || wasmModule.createModule || wasmModule;

      if (typeof createModule === 'function') {
        this.module = await createModule();
        this.initialized = true;
        return;
      }
    } catch {
      // Fall back to importScripts for classic workers
    }

    // Try importScripts for classic workers
    if (typeof self !== 'undefined' && typeof (self as any).importScripts === 'function') {
      try {
        (self as any).importScripts(jsPath);

        const globalCreateModule = (self as any).createHtmlLayoutParserModule;
        if (typeof globalCreateModule === 'function') {
          this.module = await globalCreateModule();
          this.initialized = true;
          return;
        }
      } catch {
        // importScripts failed
      }
    }

    // Check global scope
    const globalCreateModule = (globalThis as any).createHtmlLayoutParserModule;
    if (typeof globalCreateModule === 'function') {
      this.module = await globalCreateModule();
      this.initialized = true;
      return;
    }

    throw new Error('Failed to load WASM module in worker environment. Make sure html_layout_parser.js is accessible.');
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
      console.log(`[${new Date().toISOString()}] [HtmlLayoutParser] Debug mode enabled`);
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
 * Create a new HtmlLayoutParser instance for Web Worker
 */
export function createParser(): HtmlLayoutParser {
  return new HtmlLayoutParser();
}

export default HtmlLayoutParser;
