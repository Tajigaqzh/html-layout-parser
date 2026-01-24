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

    // Try different loading strategies for worker environment
    const loadingStrategies = [
      // 1. Custom path provided by user
      wasmPath,
      // 2. Try to load from relative paths (for bundled scenarios)
      './html_layout_parser.mjs',
      './html_layout_parser.cjs',
      './html_layout_parser.js',
      // 3. Try absolute paths for development
      '/wasm/html_layout_parser.mjs',
      '/wasm/html_layout_parser.cjs',
    ].filter(Boolean) as string[];

    for (const jsPath of loadingStrategies) {
      try {
        // Try ES module import first (for module workers)
        const wasmModule = await import(/* @vite-ignore */ jsPath);
        const createModule: CreateHtmlLayoutParserModule = 
          wasmModule.default || wasmModule.createHtmlLayoutParserModule || wasmModule;

        if (typeof createModule === 'function') {
          // Set up WASM locator for worker environment
          this.setModuleLoader(async () => {
            return createModule({
              locateFile: (path: string) => {
                console.log('[Worker] locateFile called with path:', path);
                if (path.endsWith('.wasm')) {
                  // Check if we're in development with Vite plugin
                  if (jsPath.startsWith('/wasm/')) {
                    // Development mode with Vite plugin - use /wasm/ prefix
                    console.log('[Worker] Redirecting WASM to /wasm/ path');
                    return '/wasm/html_layout_parser.wasm';
                  } else {
                    // Production mode or bundled scenarios
                    const wasmPaths = [
                      './html_layout_parser.wasm',
                      '../html_layout_parser.wasm',
                      wasmPath?.replace(/\.(mjs|cjs|js)$/, '.wasm') || './html_layout_parser.wasm'
                    ];
                    console.log('[Worker] Using production WASM path:', wasmPaths[0]);
                    return wasmPaths[0];
                  }
                }
                console.log('[Worker] locateFile returning original path:', path);
                return path;
              }
            });
          });
          await super.init();
          return;
        }
      } catch (error) {
        console.debug(`[Worker] Failed to load WASM from ${jsPath}:`, error);
        // Continue to next strategy
      }
    }

    // Try importScripts for classic workers
    if (typeof self !== 'undefined' && typeof (self as any).importScripts === 'function') {
      for (const jsPath of loadingStrategies) {
        try {
          (self as any).importScripts(jsPath);

          const globalCreateModule = (self as any).createHtmlLayoutParserModule;
          if (typeof globalCreateModule === 'function') {
            this.setModuleLoader(async () => globalCreateModule());
            await super.init();
            return;
          }
        } catch (error) {
          console.debug(`[Worker] importScripts failed for ${jsPath}:`, error);
          // Continue to next strategy
        }
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
