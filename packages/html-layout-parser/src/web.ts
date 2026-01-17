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
import type { CreateHtmlLayoutParserModule } from './types';

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

    // Try different loading strategies
    const loadingStrategies = [
      // 1. Custom path provided by user
      wasmPath,
      // 2. Try npm package exports (for bundlers that support it)
      'html-layout-parser/wasm-js',
    ].filter(Boolean) as string[];

    for (const jsPath of loadingStrategies) {
      try {
        // Try ES module import first
        const wasmModule = await import(/* @vite-ignore */ jsPath);
        const createModule: CreateHtmlLayoutParserModule = 
          wasmModule.default || wasmModule.createModule || wasmModule;

        if (typeof createModule === 'function') {
          // Set up WASM locator for npm package
          this.setModuleLoader(async () => {
            return createModule({
              locateFile: (path: string) => {
                if (path.endsWith('.wasm')) {
                  // Try to resolve WASM file from npm package
                  try {
                    return new URL('html-layout-parser/wasm', import.meta.url).href;
                  } catch {
                    // Fallback to relative path
                    return './html_layout_parser.wasm';
                  }
                }
                return path;
              }
            });
          });
          await super.init();
          return;
        }
      } catch (error) {
        // Continue to next strategy
        console.debug(`Failed to load WASM from ${jsPath}:`, error);
      }
    }

    // Check if already loaded as global
    const globalCreateModule = (globalThis as any).createHtmlLayoutParserModule;
    if (typeof globalCreateModule === 'function') {
      this.setModuleLoader(async () => globalCreateModule());
      await super.init();
      return;
    }

    throw new Error('Failed to load WASM module in web environment. Please provide a custom path or ensure WASM files are accessible.');
  }
}

/**
 * Create a new HtmlLayoutParser instance for Web browser
 */
export function createParser(): HtmlLayoutParser {
  return new HtmlLayoutParser();
}

export default HtmlLayoutParser;
