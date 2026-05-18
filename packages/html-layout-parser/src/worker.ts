/**
 * HTML Layout Parser v2.0 - Web Worker Entry Point
 * 
 * Use this entry point for Web Worker environments.
 * Supports both module workers and classic workers.
 * 
 * @packageDocumentation
 * @module html-layout-parser/worker
 * 
 * @example Module Worker
 * ```typescript
 * // worker.ts
 * import { HtmlLayoutParser } from 'html-layout-parser/worker';
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
 * import { HtmlLayoutParser } from 'html-layout-parser/worker';
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

import { HtmlLayoutParser as BaseParser } from './HtmlLayoutParser';
import { createWasmModule } from './module-loader';

// Re-export all types
export * from './types';
export { BaseParser as HtmlLayoutParserBase };

/**
 * HTML Layout Parser for Web Worker environment
 */
export class HtmlLayoutParser extends BaseParser {
  constructor() {
    super();
    this.setEnvironment('worker');
  }

  /**
   * Initialize the WASM module for Web Worker
   * @param wasmPath Optional path to the WASM JS file
   */
  async init(wasmPath?: string): Promise<void> {
    if (this.isInitialized()) {
      return;
    }

    const wasmModule = await createWasmModule(wasmPath, 'worker');
    this.setModuleLoader(async () => wasmModule);
    await super.init();
  }
}

/**
 * Create a new HtmlLayoutParser instance for Web Worker
 */
export function createParser(): HtmlLayoutParser {
  return new HtmlLayoutParser();
}

export default HtmlLayoutParser;
