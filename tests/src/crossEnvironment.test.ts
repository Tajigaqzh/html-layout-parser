/**
 * Tests for Cross-Environment Support
 * 
 * Validates Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 * 
 * Note: These tests run in Node.js environment, so we can only directly test
 * Node.js functionality. Web and Worker environments would need browser-based testing.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadWasmModule, WasmHelper, getTestFontPath } from './wasm-loader';
import type { HtmlLayoutParserModule, CharLayout, PerformanceMetrics } from './wasm-types';

// Import the HtmlLayoutParser class for testing
// Note: We need to use dynamic import since the demo module may not be built
const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Cross-Environment Support', () => {
  let module: HtmlLayoutParserModule;
  let helper: WasmHelper;

  beforeAll(async () => {
    module = await loadWasmModule();
    helper = new WasmHelper(module);
  });

  afterAll(() => {
    if (helper) {
      helper.clearAllFonts();
    }
  });

  describe('Environment Detection (Req 5.6)', () => {
    it('should detect Node.js environment correctly', async () => {
      // Import the detectEnvironment function
      const { detectEnvironment } = await import('../../packages/html-layout-parser/src/index');
      
      const env = detectEnvironment();
      expect(env).toBe('node');
    });

    it('should have globalThis.process defined in Node.js', () => {
      expect(typeof globalThis).toBe('object');
      expect(typeof (globalThis as any).process).toBe('object');
      expect((globalThis as any).process.versions?.node).toBeDefined();
    });
  });

  describe('Node.js Environment (Req 5.3, 5.5)', () => {
    it('should load WASM module in Node.js', async () => {
      expect(module).toBeDefined();
      expect(typeof module._loadFont).toBe('function');
      expect(typeof module._parseHTML).toBe('function');
    });

    it('should parse HTML in Node.js environment', async () => {
      const fontPath = getTestFontPath();
      const { readFileSync } = await import('fs');
      const fontData = new Uint8Array(readFileSync(fontPath));
      
      const fontId = helper.loadFont(fontData, 'TestFont');
      expect(fontId).toBeGreaterThan(0);
      helper.setDefaultFont(fontId);

      const html = '<div style="font-size: 16px;">Hello Node.js</div>';
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const text = result.map(c => c.character).join('');
      expect(text).toBe('Hello Node.js');
      
      helper.unloadFont(fontId);
    });

    it('should support loading fonts from file path', async () => {
      const fontPath = getTestFontPath();
      const { readFileSync, existsSync } = await import('fs');
      
      // Verify the font file exists
      expect(existsSync(fontPath)).toBe(true);
      
      // Load font using fs
      const fontData = new Uint8Array(readFileSync(fontPath));
      expect(fontData.length).toBeGreaterThan(0);
      
      const fontId = helper.loadFont(fontData, 'FileLoadedFont');
      expect(fontId).toBeGreaterThan(0);
      
      // Verify font is loaded
      const fonts = helper.getLoadedFonts();
      const loadedFont = fonts.find(f => f.name === 'FileLoadedFont');
      expect(loadedFont).toBeDefined();
      expect(loadedFont?.id).toBe(fontId);
      
      helper.unloadFont(fontId);
    });
  });

  describe('Unified API (Req 5.4)', () => {
    it('should provide consistent font management API', () => {
      // These functions should exist and work the same across environments
      expect(typeof module._loadFont).toBe('function');
      expect(typeof module._unloadFont).toBe('function');
      expect(typeof module._setDefaultFont).toBe('function');
      expect(typeof module._getLoadedFonts).toBe('function');
      expect(typeof module._clearAllFonts).toBe('function');
    });

    it('should provide consistent parsing API', () => {
      expect(typeof module._parseHTML).toBe('function');
      expect(typeof module._freeString).toBe('function');
    });

    it('should provide consistent utility API', () => {
      expect(typeof module._getVersion).toBe('function');
      expect(typeof module._getMetrics).toBe('function');
    });

    it('should return version string', () => {
      const version = helper.getVersion();
      expect(version).toBe('2.0.0');
    });

    it('should return memory metrics', () => {
      const metrics = helper.getMetrics() as PerformanceMetrics;
      expect(metrics).toBeDefined();
      expect(metrics?.memory?.totalFontMemory).toBeDefined();
      expect(metrics?.memory?.fontCount).toBeDefined();
    });
  });

  describe('HtmlLayoutParser Class (Req 5.1, 5.2, 5.3)', () => {
    it('should create parser instance', async () => {
      const { HtmlLayoutParser } = await import('../../packages/html-layout-parser/src/index');
      
      const parser = new HtmlLayoutParser();
      expect(parser).toBeDefined();
      expect(parser.getEnvironment()).toBe('node');
      expect(parser.isInitialized()).toBe(false);
    });

    it('should initialize in Node.js environment', async () => {
      const { HtmlLayoutParser } = await import('../../packages/html-layout-parser/src/index');
      const wasmPath = join(__dirname, '../../build/html_layout_parser.js');
      
      const parser = new HtmlLayoutParser();
      await parser.init(wasmPath);
      
      expect(parser.isInitialized()).toBe(true);
      expect(parser.getVersion()).toBe('2.0.0');
      
      parser.destroy();
    });

    it('should load font and parse HTML', async () => {
      const { HtmlLayoutParser } = await import('../../packages/html-layout-parser/src/index');
      const { readFileSync } = await import('fs');
      const wasmPath = join(__dirname, '../../build/html_layout_parser.js');
      
      const parser = new HtmlLayoutParser();
      await parser.init(wasmPath);
      
      // Load font
      const fontPath = getTestFontPath();
      const fontData = new Uint8Array(readFileSync(fontPath));
      const fontId = parser.loadFont(fontData, 'TestFont');
      expect(fontId).toBeGreaterThan(0);
      parser.setDefaultFont(fontId);
      
      // Parse HTML
      const result = parser.parse('<div>Test</div>', { viewportWidth: 800 });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4); // "Test" = 4 characters
      
      parser.destroy();
    });

    it('should support loadFontFromFile in Node.js', async () => {
      const { HtmlLayoutParser } = await import('../../packages/html-layout-parser/src/index');
      const wasmPath = join(__dirname, '../../build/html_layout_parser.js');
      
      const parser = new HtmlLayoutParser();
      await parser.init(wasmPath);
      
      // Load font from file path
      const fontPath = getTestFontPath();
      const fontId = await parser.loadFontFromFile(fontPath, 'FileFont');
      expect(fontId).toBeGreaterThan(0);
      
      // Verify font is loaded
      const fonts = parser.getLoadedFonts();
      const loadedFont = fonts.find(f => f.name === 'FileFont');
      expect(loadedFont).toBeDefined();
      
      parser.destroy();
    });

    it('should throw error for loadFontFromFile in non-Node environment', async () => {
      const { HtmlLayoutParser } = await import('../../packages/html-layout-parser/src/index');
      const wasmPath = join(__dirname, '../../build/html_layout_parser.js');
      
      const parser = new HtmlLayoutParser();
      await parser.init(wasmPath);
      
      // Mock the environment to simulate non-Node
      (parser as any).environment = 'web';
      
      await expect(parser.loadFontFromFile('/path/to/font.ttf', 'Font'))
        .rejects.toThrow('loadFontFromFile is only available in Node.js environment');
      
      parser.destroy();
    });
  });

  describe('createParser Factory Function', () => {
    it('should create parser instance via factory', async () => {
      const { createParser } = await import('../../packages/html-layout-parser/src/index');
      
      const parser = createParser();
      expect(parser).toBeDefined();
      expect(parser.getEnvironment()).toBe('node');
    });
  });
});
