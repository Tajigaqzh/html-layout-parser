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
import type { CreateHtmlLayoutParserModule } from './types';

// Re-export all types
export * from './types';
export { BaseParser as HtmlLayoutParserBase };

// Web Worker type declaration
declare const self: typeof globalThis & {
  importScripts: (...urls: string[]) => void;
  createHtmlLayoutParserModule?: CreateHtmlLayoutParserModule;
};

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

    const jsPath = wasmPath || './html_layout_parser.js';

    // Try ES module import first (for module workers)
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
      // Fall back to importScripts for classic workers
    }

    // Try importScripts for classic workers
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

    // Check global scope
    const globalCreateModule = (globalThis as any).createHtmlLayoutParserModule;
    if (typeof globalCreateModule === 'function') {
      this.setModuleLoader(async () => globalCreateModule());
      await super.init();
      return;
    }

    throw new Error('Failed to load WASM module in worker environment. Make sure html_layout_parser.js is accessible.');
  }
}

/**
 * Create a new HtmlLayoutParser instance for Web Worker
 */
export function createParser(): HtmlLayoutParser {
  return new HtmlLayoutParser();
}

export default HtmlLayoutParser;
