/**
 * HTML Layout Parser v2.0 - Main Entry Point (Auto-detect Environment)
 * 
 * This entry point automatically detects the runtime environment and
 * provides the appropriate parser implementation.
 * 
 * For better tree-shaking and explicit environment targeting, consider
 * using the environment-specific entry points:
 * - `html-layout-parser/web` - Web browser main thread
 * - `html-layout-parser/worker` - Web Worker
 * - `html-layout-parser/node` - Node.js
 * 
 * @packageDocumentation
 * @module html-layout-parser
 * 
 * @example Auto-detect Environment
 * ```typescript
 * import { HtmlLayoutParser, detectEnvironment } from 'html-layout-parser';
 * 
 * console.log(`Running in ${detectEnvironment()} environment`);
 * 
 * const parser = new HtmlLayoutParser();
 * await parser.init();
 * 
 * const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });
 * parser.destroy();
 * ```
 * 
 * @example Explicit Environment Import
 * ```typescript
 * // For Web browser
 * import { HtmlLayoutParser } from 'html-layout-parser/web';
 * 
 * // For Web Worker
 * import { HtmlLayoutParser } from 'html-layout-parser/worker';
 * 
 * // For Node.js
 * import { HtmlLayoutParser } from 'html-layout-parser/node';
 * ```
 */

import { HtmlLayoutParser as BaseParser } from './HtmlLayoutParser';
import type { Environment, CreateHtmlLayoutParserModule } from './types';

// Re-export all types
export * from './types';
export { BaseParser as HtmlLayoutParserBase };

/**
 * Detect the current runtime environment
 */
export function detectEnvironment(): Environment {
  // Check Node.js first (most specific)
  if (
    typeof globalThis !== 'undefined' &&
    typeof (globalThis as any).process !== 'undefined' &&
    (globalThis as any).process.versions?.node !== undefined
  ) {
    return 'node';
  }

  // Check Worker before Web (Worker has self but no window.document)
  if (
    typeof self !== 'undefined' &&
    typeof (self as any).WorkerGlobalScope !== 'undefined' &&
    self instanceof (self as any).WorkerGlobalScope
  ) {
    return 'worker';
  }

  // Check Web browser
  if (
    typeof window !== 'undefined' &&
    typeof window.document !== 'undefined'
  ) {
    return 'web';
  }

  return 'unknown';
}

/**
 * HTML Layout Parser with auto-detected environment
 * 
 * Automatically detects the runtime environment and initializes accordingly.
 * For explicit environment targeting, use the environment-specific imports.
 */
export class HtmlLayoutParser extends BaseParser {
  constructor() {
    super();
    this.setEnvironment(detectEnvironment());
  }

  /**
   * Initialize the WASM module with auto-detected environment
   * @param wasmPath Optional path to the WASM JS file
   */
  async init(wasmPath?: string): Promise<void> {
    if (this.isInitialized()) {
      return;
    }

    const env = this.getEnvironment();
    const jsPath = wasmPath || './html_layout_parser.js';

    switch (env) {
      case 'node':
        await this.initNode(jsPath);
        break;
      case 'worker':
        await this.initWorker(jsPath);
        break;
      case 'web':
        await this.initWeb(jsPath);
        break;
      default:
        throw new Error(`Unsupported environment: ${env}`);
    }
  }

  private async initWeb(jsPath: string): Promise<void> {
    try {
      const wasmModule = await import(/* @vite-ignore */ jsPath);
      const createModule: CreateHtmlLayoutParserModule = 
        wasmModule.default || wasmModule.createModule || wasmModule;

      if (typeof createModule === 'function') {
        this.setModuleLoader(async () => createModule());
        await super.init();
        return;
      }
    } catch {
      // Fall back to global
    }

    const globalCreateModule = (globalThis as any).createHtmlLayoutParserModule;
    if (typeof globalCreateModule === 'function') {
      this.setModuleLoader(async () => globalCreateModule());
      await super.init();
      return;
    }

    throw new Error('Failed to load WASM module in web environment');
  }

  private async initWorker(jsPath: string): Promise<void> {
    try {
      const wasmModule = await import(/* @vite-ignore */ jsPath);
      const createModule: CreateHtmlLayoutParserModule = 
        wasmModule.default || wasmModule.createModule || wasmModule;

      if (typeof createModule === 'function') {
        this.setModuleLoader(async () => createModule());
        await super.init();
        return;
      }
    } catch {
      // Fall back to importScripts
    }

    if (typeof self !== 'undefined' && typeof (self as any).importScripts === 'function') {
      try {
        (self as any).importScripts(jsPath);
        const globalCreateModule = (self as any).createHtmlLayoutParserModule;
        if (typeof globalCreateModule === 'function') {
          this.setModuleLoader(async () => globalCreateModule());
          await super.init();
          return;
        }
      } catch {
        // importScripts failed
      }
    }

    throw new Error('Failed to load WASM module in worker environment');
  }

  private async initNode(jsPath: string): Promise<void> {
    try {
      const wasmModule = await import(/* @vite-ignore */ jsPath);
      const createModule: CreateHtmlLayoutParserModule = 
        wasmModule.default || wasmModule.createModule || wasmModule;

      if (typeof createModule === 'function') {
        this.setModuleLoader(async () => createModule());
        await super.init();
        return;
      }
    } catch (error) {
      throw new Error(`Failed to load WASM module in Node.js: ${error}`);
    }

    throw new Error('Failed to load WASM module factory function in Node.js');
  }

  /**
   * Load a font from a file path (Node.js only)
   * 
   * @param fontPath Path to the font file
   * @param fontName Font name for identification
   * @returns Font ID on success, 0 on failure
   * @throws Error if not in Node.js environment
   */
  async loadFontFromFile(fontPath: string, fontName: string): Promise<number> {
    if (this.getEnvironment() !== 'node') {
      throw new Error('loadFontFromFile is only available in Node.js environment');
    }

    try {
      const { readFile } = await import('fs/promises');
      const buffer = await readFile(fontPath);
      const fontData = new Uint8Array(buffer);
      return this.loadFont(fontData, fontName);
    } catch (error) {
      throw new Error(`Failed to load font from file '${fontPath}': ${error}`);
    }
  }
}

/**
 * Create a new HtmlLayoutParser instance with auto-detected environment
 */
export function createParser(): HtmlLayoutParser {
  return new HtmlLayoutParser();
}

export default HtmlLayoutParser;
