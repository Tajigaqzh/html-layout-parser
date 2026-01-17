/**
 * WASM module loader utility for HTML Layout Parser v2.0
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { HtmlLayoutParserModule, CreateHtmlLayoutParserModule, CharLayout, FontInfo, MemoryMetrics, LayoutDocument, SimpleOutput, Row } from './wasm-types';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load the compiled WASM module
 * @returns Promise resolving to the WASM module instance
 */
export async function loadWasmModule(): Promise<HtmlLayoutParserModule> {
  const wasmCandidates = [
    join(__dirname, '../../wasm-output/html_layout_parser.js'),
    join(__dirname, '../../build/html_layout_parser.js')
  ];

  const wasmJsPath = wasmCandidates.find((candidate) => existsSync(candidate));

  if (!wasmJsPath) {
    throw new Error(
      `WASM module not found at ${wasmCandidates.join(' or ')}. ` +
      'Please run the build script first: cd html-layout-parser && ./build.sh'
    );
  }

  // Dynamic import of the compiled WASM module
  const wasmModule = await import(wasmJsPath);
  const createModule: CreateHtmlLayoutParserModule = wasmModule.default || wasmModule.createModule;
  
  if (typeof createModule !== 'function') {
    throw new Error('Failed to load WASM module factory function');
  }

  return await createModule();
}

/**
 * Load a font file as Uint8Array
 * @param fontPath Path to the font file
 * @returns Font data as Uint8Array
 */
export function loadFontFile(fontPath: string): Uint8Array {
  if (!existsSync(fontPath)) {
    throw new Error(`Font file not found: ${fontPath}`);
  }
  const buffer = readFileSync(fontPath);
  return new Uint8Array(buffer);
}

/**
 * Get the path to the test font file
 * Using the original full font file (not compressed) to ensure all characters are available
 */
export function getTestFontPath(): string {
  return join(__dirname, '../../examples/font/.font-spider/aliBaBaFont65.ttf');
}

/**
 * Helper class for interacting with the WASM module v2.0
 */
export class WasmHelper {
  constructor(private module: HtmlLayoutParserModule) {}

  /**
   * Load a font from Uint8Array data
   * @param fontData Font data as Uint8Array
   * @param fontName Font name for identification
   * @returns Font ID on success, 0 on failure
   */
  loadFont(fontData: Uint8Array, fontName: string): number {
    const dataPtr = this.module._malloc(fontData.length);
    if (dataPtr === 0) {
      return 0;
    }

    const nameBytes = this.module.lengthBytesUTF8(fontName) + 1;
    const namePtr = this.module._malloc(nameBytes);
    if (namePtr === 0) {
      this.module._free(dataPtr);
      return 0;
    }

    try {
      this.module.HEAPU8.set(fontData, dataPtr);
      this.module.stringToUTF8(fontName, namePtr, nameBytes);
      return this.module._loadFont(dataPtr, fontData.length, namePtr);
    } finally {
      this.module._free(dataPtr);
      this.module._free(namePtr);
    }
  }

  /**
   * Unload a font
   * @param fontId Font ID to unload
   */
  unloadFont(fontId: number): void {
    this.module._unloadFont(fontId);
  }

  /**
   * Set the default font
   * @param fontId Font ID to set as default
   */
  setDefaultFont(fontId: number): void {
    this.module._setDefaultFont(fontId);
  }

  /**
   * Get list of loaded fonts
   * @returns Array of font information
   */
  getLoadedFonts(): FontInfo[] {
    const resultPtr = this.module._getLoadedFonts();
    if (resultPtr === 0) {
      return [];
    }

    const result = this.module.UTF8ToString(resultPtr);
    this.module._freeString(resultPtr);
    
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
    this.module._clearAllFonts();
  }

  /**
   * Parse HTML and calculate character layouts
   * 
   * Memory safety: All allocated pointers are tracked and freed in finally block,
   * ensuring no memory leaks even if exceptions occur.
   * 
   * @param html HTML string
   * @param viewportWidth Viewport width in pixels
   * @param mode Output mode: "full", "simple", "flat", or "byRow"
   * @param css Optional external CSS string
   * @returns Parsed result based on mode
   */
  parseHTML<T = CharLayout[]>(
    html: string,
    viewportWidth: number,
    mode: 'full' | 'simple' | 'flat' | 'byRow' = 'flat',
    css?: string
  ): T {
    // Track all allocated pointers for cleanup
    let htmlPtr = 0;
    let modePtr = 0;
    let cssPtr = 0;

    try {
      // Allocate HTML string
      const htmlBytes = this.module.lengthBytesUTF8(html) + 1;
      htmlPtr = this.module._malloc(htmlBytes);
      if (htmlPtr === 0) {
        throw new Error('Failed to allocate memory for HTML string');
      }
      this.module.stringToUTF8(html, htmlPtr, htmlBytes);

      // Allocate mode string
      const modeBytes = this.module.lengthBytesUTF8(mode) + 1;
      modePtr = this.module._malloc(modeBytes);
      if (modePtr === 0) {
        throw new Error('Failed to allocate memory for mode string');
      }
      this.module.stringToUTF8(mode, modePtr, modeBytes);

      // Allocate CSS string if provided
      if (css) {
        const cssBytes = this.module.lengthBytesUTF8(css) + 1;
        cssPtr = this.module._malloc(cssBytes);
        if (cssPtr === 0) {
          throw new Error('Failed to allocate memory for CSS string');
        }
        this.module.stringToUTF8(css, cssPtr, cssBytes);
      }

      // Call WASM function
      const resultPtr = this.module._parseHTML(htmlPtr, cssPtr, viewportWidth, modePtr, 0);
      
      if (resultPtr === 0) {
        return [] as unknown as T;
      }

      // Read and free result string
      const result = this.module.UTF8ToString(resultPtr);
      this.module._freeString(resultPtr);
      
      try {
        return JSON.parse(result) as T;
      } catch {
        return [] as unknown as T;
      }
    } catch (error) {
      // Return empty array on error
      return [] as unknown as T;
    } finally {
      // Always free all allocated memory
      if (htmlPtr !== 0) {
        this.module._free(htmlPtr);
      }
      if (modePtr !== 0) {
        this.module._free(modePtr);
      }
      if (cssPtr !== 0) {
        this.module._free(cssPtr);
      }
    }
  }

  /**
   * Get parser version
   * @returns Version string
   */
  getVersion(): string {
    const resultPtr = this.module._getVersion();
    if (resultPtr === 0) {
      return '';
    }

    const result = this.module.UTF8ToString(resultPtr);
    this.module._freeString(resultPtr);
    return result;
  }

  /**
   * Get memory metrics
   * @returns Memory metrics object
   */
  getMetrics(): MemoryMetrics | null {
    const resultPtr = this.module._getMetrics();
    if (resultPtr === 0) {
      return null;
    }

    const result = this.module.UTF8ToString(resultPtr);
    this.module._freeString(resultPtr);
    
    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

  /**
   * Destroy the parser and release all resources
   * Call this when the parser is no longer needed
   */
  destroy(): void {
    this.module._destroy();
  }

  /**
   * Get total memory usage in bytes
   * @returns Total memory usage
   */
  getTotalMemoryUsage(): number {
    return this.module._getTotalMemoryUsage();
  }

  /**
   * Check if memory usage exceeds the threshold (50MB)
   * @returns true if memory exceeds threshold
   */
  checkMemoryThreshold(): boolean {
    return this.module._checkMemoryThreshold() !== 0;
  }

  /**
   * Get detailed memory metrics
   * @returns Memory metrics object with per-font details
   */
  getMemoryMetrics(): MemoryMetrics | null {
    const resultPtr = this.module._getMemoryMetrics();
    if (resultPtr === 0) {
      return null;
    }

    const result = this.module.UTF8ToString(resultPtr);
    this.module._freeString(resultPtr);
    
    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

  /**
   * Set debug mode on/off
   * @param isDebug true to enable debug logging, false to disable
   */
  setDebugMode(isDebug: boolean): void {
    if (typeof this.module._setDebugMode === 'function') {
      this.module._setDebugMode(isDebug);
    }
  }

  /**
   * Get current debug mode state
   * @returns true if debug mode is enabled
   */
  getDebugMode(): boolean {
    if (typeof this.module._getDebugMode === 'function') {
      // WASM returns 0/1, convert to boolean
      return this.module._getDebugMode() !== 0;
    }
    return false;
  }

  /**
   * Get cache statistics
   * @returns Cache statistics object
   */
  getCacheStats(): { hits: number; misses: number; entries: number; hitRate: number | null; memoryUsage: number } | null {
    if (typeof this.module._getCacheStats !== 'function') {
      return null;
    }
    
    const resultPtr = this.module._getCacheStats();
    if (resultPtr === 0) {
      return null;
    }

    const result = this.module.UTF8ToString(resultPtr);
    this.module._freeString(resultPtr);
    
    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

  /**
   * Reset cache statistics counters
   */
  resetCacheStats(): void {
    if (typeof this.module._resetCacheStats === 'function') {
      this.module._resetCacheStats();
    }
  }

  /**
   * Clear all font metrics caches
   */
  clearCache(): void {
    if (typeof this.module._clearCache === 'function') {
      this.module._clearCache();
    }
  }

  /**
   * Get detailed metrics including cache statistics
   * @returns Detailed metrics object
   */
  getDetailedMetrics(): any | null {
    if (typeof this.module._getDetailedMetrics !== 'function') {
      return null;
    }
    
    const resultPtr = this.module._getDetailedMetrics();
    if (resultPtr === 0) {
      return null;
    }

    const result = this.module.UTF8ToString(resultPtr);
    this.module._freeString(resultPtr);
    
    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  }
}
