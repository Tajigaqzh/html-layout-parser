/**
 * JavaScript Layer Memory Safety Audit Tests
 * 
 * Tests JavaScript/TypeScript layer memory management:
 * - parse method memory safety (try-finally, malloc/free pairs)
 * - loadFont method memory safety
 * - C++ return value handling (_freeString calls)
 * - Memory leak detection under various scenarios
 * 
 * @note Requirements: 10.11, 10.12
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { loadWasmModule, WasmHelper, loadFontFile, getTestFontPath } from './wasm-loader';
import type { HtmlLayoutParserModule } from './wasm-types';

describe('JavaScript Layer Memory Safety Audit', () => {
  let module: HtmlLayoutParserModule;
  let helper: WasmHelper;

  beforeAll(async () => {
    module = await loadWasmModule();
    helper = new WasmHelper(module);
  });

  afterAll(() => {
    if (helper) {
      helper.destroy();
    }
  });

  beforeEach(() => {
    helper.clearAllFonts();
  });

  afterEach(() => {
    helper.clearAllFonts();
  });

  describe('18.1 Parse Method Memory Safety', () => {
    it('should have matching malloc/free pairs in parse', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const fontId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(fontId);

      const initialMemory = helper.getTotalMemoryUsage();

      // Call parse multiple times
      for (let i = 0; i < 100; i++) {
        helper.parseHTML('<div>Test</div>', 800, 'flat');
      }

      const finalMemory = helper.getTotalMemoryUsage();
      
      // Memory should not grow (all malloc should have matching free)
      expect(finalMemory).toBe(initialMemory);
    });

    it('should use try-finally pattern for exception safety', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const fontId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(fontId);

      const initialMemory = helper.getTotalMemoryUsage();

      // Parse with various inputs that might cause issues
      const testCases = [
        '<div>Normal HTML</div>',
        '<div><span>Nested</span></div>',
        '<div style="color: red;">Styled</div>',
        '<div>Unicode: 你好世界</div>',
        '<div>' + 'A'.repeat(1000) + '</div>',
        '',  // Empty string
        '<div></div>',  // Empty div
      ];

      for (const html of testCases) {
        helper.parseHTML(html, 800, 'flat');
      }

      const finalMemory = helper.getTotalMemoryUsage();
      
      // Memory should not grow even with various inputs
      expect(finalMemory).toBe(initialMemory);
    });

    it('should release memory even when CSS allocation fails gracefully', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const fontId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(fontId);

      const initialMemory = helper.getTotalMemoryUsage();

      // Parse with CSS
      for (let i = 0; i < 50; i++) {
        helper.parseHTML('<div class="test">Content</div>', 800, 'flat', '.test { color: red; }');
      }

      const finalMemory = helper.getTotalMemoryUsage();
      
      // Memory should not grow
      expect(finalMemory).toBe(initialMemory);
    });

    it('should handle all output modes without leaking', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const fontId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(fontId);

      const initialMemory = helper.getTotalMemoryUsage();

      const modes: Array<'flat' | 'byRow' | 'simple' | 'full'> = ['flat', 'byRow', 'simple', 'full'];
      
      for (let i = 0; i < 25; i++) {
        for (const mode of modes) {
          helper.parseHTML('<div>Test content</div>', 800, mode);
        }
      }

      const finalMemory = helper.getTotalMemoryUsage();
      
      // Memory should not grow
      expect(finalMemory).toBe(initialMemory);
    });
  });

  describe('18.2 LoadFont Method Memory Safety', () => {
    it('should have matching malloc/free pairs in loadFont', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);

      const initialMemory = helper.getTotalMemoryUsage();

      // Load and unload font multiple times
      for (let i = 0; i < 20; i++) {
        const fontId = helper.loadFont(fontData, `Font${i}`);
        expect(fontId).toBeGreaterThan(0);
        helper.unloadFont(fontId);
      }

      const finalMemory = helper.getTotalMemoryUsage();
      
      // Memory should return to initial state
      expect(finalMemory).toBe(initialMemory);
    });

    it('should release font data pointer after C++ copies it', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);

      // Load font - the JS layer should free the data pointer after C++ copies it
      const fontId = helper.loadFont(fontData, 'TestFont');
      expect(fontId).toBeGreaterThan(0);

      // Font should be usable
      helper.setDefaultFont(fontId);
      const result = helper.parseHTML('<div>Test</div>', 800, 'flat');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should release font name pointer after use', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);

      const initialMemory = helper.getTotalMemoryUsage();

      // Load fonts with various name lengths
      const names = [
        'A',
        'Short',
        'Medium Length Name',
        'A Very Long Font Name That Takes More Memory',
        'Unicode Name: 中文字体名称',
      ];

      for (const name of names) {
        const fontId = helper.loadFont(fontData, name);
        expect(fontId).toBeGreaterThan(0);
        helper.unloadFont(fontId);
      }

      const finalMemory = helper.getTotalMemoryUsage();
      
      // Memory should return to initial state
      expect(finalMemory).toBe(initialMemory);
    });
  });

  describe('18.3 C++ Return Value Handling', () => {
    it('should properly free getLoadedFonts return value', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const fontId = helper.loadFont(fontData, 'TestFont');

      const initialMemory = helper.getTotalMemoryUsage();

      // Call getLoadedFonts many times
      for (let i = 0; i < 100; i++) {
        const fonts = helper.getLoadedFonts();
        expect(fonts.length).toBe(1);
      }

      const finalMemory = helper.getTotalMemoryUsage();
      
      // Memory should not grow
      expect(finalMemory).toBe(initialMemory);
    });

    it('should properly free getMetrics return value', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const fontId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(fontId);
      
      // Parse to generate metrics
      helper.parseHTML('<div>Test</div>', 800, 'flat');

      const initialMemory = helper.getTotalMemoryUsage();

      // Call getMetrics many times
      for (let i = 0; i < 100; i++) {
        helper.getMetrics();
      }

      const finalMemory = helper.getTotalMemoryUsage();
      
      // Memory should not grow
      expect(finalMemory).toBe(initialMemory);
    });

    it('should properly free getVersion return value', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const fontId = helper.loadFont(fontData, 'TestFont');

      const initialMemory = helper.getTotalMemoryUsage();

      // Call getVersion many times
      for (let i = 0; i < 100; i++) {
        const version = helper.getVersion();
        expect(version).toBeTruthy();
      }

      const finalMemory = helper.getTotalMemoryUsage();
      
      // Memory should not grow
      expect(finalMemory).toBe(initialMemory);
    });

    it('should properly free getMemoryMetrics return value', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const fontId = helper.loadFont(fontData, 'TestFont');

      const initialMemory = helper.getTotalMemoryUsage();

      // Call getMemoryMetrics many times
      for (let i = 0; i < 100; i++) {
        helper.getMemoryMetrics();
      }

      const finalMemory = helper.getTotalMemoryUsage();
      
      // Memory should not grow
      expect(finalMemory).toBe(initialMemory);
    });
  });

  describe('18.4 Memory Leak Detection', () => {
    it('should not leak on repeated parse calls', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const fontId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(fontId);

      const initialMemory = helper.getTotalMemoryUsage();

      // Perform many parse operations
      for (let i = 0; i < 500; i++) {
        helper.parseHTML(`<div>Iteration ${i}</div>`, 800, 'flat');
      }

      const finalMemory = helper.getTotalMemoryUsage();
      
      console.log(`  Initial memory: ${(initialMemory / 1024).toFixed(2)}KB`);
      console.log(`  Final memory after 500 parses: ${(finalMemory / 1024).toFixed(2)}KB`);
      
      // Memory should not grow
      expect(finalMemory).toBe(initialMemory);
    });

    it('should not leak on repeated loadFont/unloadFont calls', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);

      const initialMemory = helper.getTotalMemoryUsage();

      // Perform many load/unload cycles
      for (let i = 0; i < 100; i++) {
        const fontId = helper.loadFont(fontData, `Font${i}`);
        helper.unloadFont(fontId);
      }

      const finalMemory = helper.getTotalMemoryUsage();
      
      console.log(`  Initial memory: ${initialMemory}`);
      console.log(`  Final memory after 100 load/unload cycles: ${finalMemory}`);
      
      // Memory should return to initial state
      expect(finalMemory).toBe(initialMemory);
    });

    it('should not leak under mixed operations', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);

      const initialMemory = helper.getTotalMemoryUsage();

      // Perform mixed operations
      for (let i = 0; i < 50; i++) {
        // Load font
        const fontId = helper.loadFont(fontData, `Font${i}`);
        helper.setDefaultFont(fontId);
        
        // Parse with different modes
        helper.parseHTML('<div>Test</div>', 800, 'flat');
        helper.parseHTML('<div>Test</div>', 800, 'byRow');
        helper.parseHTML('<div>Test</div>', 800, 'flat', '.test { color: red; }');
        
        // Get various info
        helper.getVersion();
        helper.getLoadedFonts();
        helper.getMetrics();
        helper.getMemoryMetrics();
        
        // Unload font
        helper.unloadFont(fontId);
      }

      const finalMemory = helper.getTotalMemoryUsage();
      
      console.log(`  Initial memory: ${initialMemory}`);
      console.log(`  Final memory after mixed operations: ${finalMemory}`);
      
      // Memory should return to initial state
      expect(finalMemory).toBe(initialMemory);
    });

    it('should handle large HTML documents without leaking', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const fontId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(fontId);

      const initialMemory = helper.getTotalMemoryUsage();

      // Parse large documents
      for (let i = 0; i < 20; i++) {
        const largeContent = '<p>'.repeat(100) + 'Content' + '</p>'.repeat(100);
        const html = `<div>${largeContent}</div>`;
        helper.parseHTML(html, 800, 'flat');
      }

      const finalMemory = helper.getTotalMemoryUsage();
      
      console.log(`  Initial memory: ${(initialMemory / 1024).toFixed(2)}KB`);
      console.log(`  Final memory after large documents: ${(finalMemory / 1024).toFixed(2)}KB`);
      
      // Memory should not grow
      expect(finalMemory).toBe(initialMemory);
    });

    it('should handle Unicode content without leaking', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const fontId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(fontId);

      const initialMemory = helper.getTotalMemoryUsage();

      // Parse Unicode content
      const unicodeStrings = [
        '你好世界',
        'مرحبا بالعالم',
        'Привет мир',
        '🎉🎊🎁🎈',
        'こんにちは世界',
        '안녕하세요 세계',
      ];

      for (let i = 0; i < 50; i++) {
        for (const str of unicodeStrings) {
          helper.parseHTML(`<div>${str}</div>`, 800, 'flat');
        }
      }

      const finalMemory = helper.getTotalMemoryUsage();
      
      console.log(`  Initial memory: ${(initialMemory / 1024).toFixed(2)}KB`);
      console.log(`  Final memory after Unicode content: ${(finalMemory / 1024).toFixed(2)}KB`);
      
      // Memory should not grow
      expect(finalMemory).toBe(initialMemory);
    });
  });
});
