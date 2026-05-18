/**
 * HTML Layout Parser v2.0 - Web Browser Entry Point
 * 
 * Use this entry point for Web browser main thread environments.
 * 
 * @packageDocumentation
 * @module html-layout-parser/web
 * 
 * @example
 * ```typescript
 * import { HtmlLayoutParser } from 'html-layout-parser/web';
 * 
 * const parser = new HtmlLayoutParser();
 * await parser.init();
 * 
 * const fontId = parser.loadFont(fontData, 'MyFont');
 * parser.setDefaultFont(fontId);
 * 
 * const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });
 * parser.destroy();
 * ```
 */

import { HtmlLayoutParser as BaseParser } from './HtmlLayoutParser';
import { createWasmModule } from './module-loader';

// Re-export all types
export * from './types';
export { BaseParser as HtmlLayoutParserBase };

/**
 * HTML Layout Parser for Web browser environment
 */
export class HtmlLayoutParser extends BaseParser {
  constructor() {
    super();
    this.setEnvironment('web');
  }

  /**
   * Initialize the WASM module for Web browser
   * @param wasmPath Optional path to the WASM JS file
   */
  async init(wasmPath?: string): Promise<void> {
    if (this.isInitialized()) {
      return;
    }

    const wasmModule = await createWasmModule(wasmPath, 'web');
    this.setModuleLoader(async () => wasmModule);
    await super.init();
  }
}

/**
 * Create a new HtmlLayoutParser instance for Web browser
 */
export function createParser(): HtmlLayoutParser {
  return new HtmlLayoutParser();
}

export default HtmlLayoutParser;
