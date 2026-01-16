/**
 * HTML Layout Parser v2.0 - Node.js Entry Point
 * 
 * Use this entry point for Node.js environments.
 * Includes additional support for loading fonts from file paths.
 * 
 * @packageDocumentation
 * @module html-layout-parser/node
 * 
 * @example Basic Usage
 * ```typescript
 * import { HtmlLayoutParser } from 'html-layout-parser/node';
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
 * import { HtmlLayoutParser } from 'html-layout-parser/node';
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

import { HtmlLayoutParser as BaseParser } from './HtmlLayoutParser';
import type { CreateHtmlLayoutParserModule } from './types';

// Re-export all types
export * from './types';
export { BaseParser as HtmlLayoutParserBase };

/**
 * HTML Layout Parser for Node.js environment
 */
export class HtmlLayoutParser extends BaseParser {
  constructor() {
    super();
    this.setEnvironment('node');
  }

  /**
   * Initialize the WASM module for Node.js
   * @param wasmPath Optional path to the WASM JS file
   */
  async init(wasmPath?: string): Promise<void> {
    if (this.isInitialized()) {
      return;
    }

    const jsPath = wasmPath || './html_layout_parser.js';

    try {
      // In Node.js, use dynamic import
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
}

/**
 * Create a new HtmlLayoutParser instance for Node.js
 */
export function createParser(): HtmlLayoutParser {
  return new HtmlLayoutParser();
}

export default HtmlLayoutParser;
