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
import { loadWasmModule, detectEnvironment as detectEnv } from './wasm-loader';
import type { Environment, CreateHtmlLayoutParserModule } from './types';

// Re-export all types
export * from './types';
export { BaseParser as HtmlLayoutParserBase };
export { isESMSupported, isCJSSupported } from './wasm-loader';

/**
 * Detect the current runtime environment
 */
export function detectEnvironment(): Environment {
  return detectEnv();
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

    try {
      // Use the new WASM loader that handles both ESM and CJS
      const wasmModule = await loadWasmModule(wasmPath);
      this.setModuleLoader(async () => wasmModule);
      await super.init();
    } catch (error) {
      throw new Error(`Failed to initialize WASM module: ${error}`);
    }
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
