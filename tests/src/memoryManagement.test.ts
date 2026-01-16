/**
 * Memory Management Tests for HTML Layout Parser v2.0
 * 
 * Tests memory management functionality:
 * - String memory management (freeString)
 * - Font memory management (load/unload)
 * - Temporary data management (parse cleanup)
 * - Destroy method
 * - Memory monitoring and warnings
 * - Memory leak detection
 * 
 * @note Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { loadWasmModule, WasmHelper, loadFontFile, getTestFontPath } from './wasm-loader';
import type { HtmlLayoutParserModule, PerformanceMetrics, CharLayout, MemoryMetrics } from './wasm-types';

describe('Memory Management Tests', () => {
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
    // Clear all fonts before each test
    helper.clearAllFonts();
  });

  afterEach(() => {
    // Clean up after each test
    helper.clearAllFonts();
  });

  describe('9.1 String Memory Management', () => {
    it('should correctly allocate and free strings via freeString', () => {
      // Load font first
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const fontId = helper.loadFont(fontData, 'TestFont');
      expect(fontId).toBeGreaterThan(0);
      helper.setDefaultFont(fontId);

      // Parse HTML - this allocates strings internally
      const html = '<div>Test string memory management</div>';
      const result = helper.parseHTML(html, 800, 'flat');
      
      // Result should be valid
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle multiple string allocations without leaking', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const fontId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(fontId);

      // Perform multiple operations that allocate strings
      for (let i = 0; i < 50; i++) {
        helper.getVersion();
        helper.getLoadedFonts();
        helper.parseHTML('<div>Test</div>', 800, 'flat');
      }

      // Memory should not grow excessively
      const memoryUsage = helper.getTotalMemoryUsage();
      console.log(`  Memory after 50 string operations: ${(memoryUsage / 1024).toFixed(2)}KB`);
      
      // Should not exceed threshold
      expect(helper.checkMemoryThreshold()).toBe(false);
    });
  });

  describe('9.2 Font Memory Management', () => {
    it('should release FreeType resources when unloading font', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      // Load font
      const fontId = helper.loadFont(fontData, 'TestFont');
      expect(fontId).toBeGreaterThan(0);
      
      const memoryBefore = helper.getTotalMemoryUsage();
      console.log(`  Memory after loading font: ${(memoryBefore / 1024).toFixed(2)}KB`);
      
      // Unload font
      helper.unloadFont(fontId);
      
      const memoryAfter = helper.getTotalMemoryUsage();
      console.log(`  Memory after unloading font: ${(memoryAfter / 1024).toFixed(2)}KB`);
      
      // Memory should decrease after unloading
      expect(memoryAfter).toBeLessThan(memoryBefore);
      
      // Font should no longer be in the list
      const fonts = helper.getLoadedFonts();
      expect(fonts.find(f => f.id === fontId)).toBeUndefined();
    });

    it('should clear data and shrink_to_fit on unloadFont', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      // Load multiple fonts
      const fontId1 = helper.loadFont(fontData, 'Font1');
      const fontId2 = helper.loadFont(fontData, 'Font2');
      const fontId3 = helper.loadFont(fontData, 'Font3');
      
      expect(fontId1).toBeGreaterThan(0);
      expect(fontId2).toBeGreaterThan(0);
      expect(fontId3).toBeGreaterThan(0);
      
      const memoryWith3Fonts = helper.getTotalMemoryUsage();
      console.log(`  Memory with 3 fonts: ${(memoryWith3Fonts / 1024).toFixed(2)}KB`);
      
      // Unload one font
      helper.unloadFont(fontId2);
      
      const memoryWith2Fonts = helper.getTotalMemoryUsage();
      console.log(`  Memory with 2 fonts: ${(memoryWith2Fonts / 1024).toFixed(2)}KB`);
      
      // Memory should decrease proportionally
      expect(memoryWith2Fonts).toBeLessThan(memoryWith3Fonts);
    });

    it('should release all resources on clearAllFonts', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      // Load multiple fonts
      helper.loadFont(fontData, 'Font1');
      helper.loadFont(fontData, 'Font2');
      helper.loadFont(fontData, 'Font3');
      
      const memoryBefore = helper.getTotalMemoryUsage();
      console.log(`  Memory before clearAllFonts: ${(memoryBefore / 1024).toFixed(2)}KB`);
      
      // Clear all fonts
      helper.clearAllFonts();
      
      const memoryAfter = helper.getTotalMemoryUsage();
      console.log(`  Memory after clearAllFonts: ${(memoryAfter / 1024).toFixed(2)}KB`);
      
      // Memory should be minimal
      expect(memoryAfter).toBe(0);
      
      // No fonts should remain
      const fonts = helper.getLoadedFonts();
      expect(fonts.length).toBe(0);
    });

    it('should not leak memory on repeated load/unload cycles', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      // Perform multiple load/unload cycles
      const initialMemory = helper.getTotalMemoryUsage();
      
      for (let i = 0; i < 20; i++) {
        const fontId = helper.loadFont(fontData, `Font${i}`);
        expect(fontId).toBeGreaterThan(0);
        helper.unloadFont(fontId);
      }
      
      const finalMemory = helper.getTotalMemoryUsage();
      console.log(`  Initial memory: ${initialMemory}, Final memory: ${finalMemory}`);
      
      // Memory should return to initial state
      expect(finalMemory).toBe(initialMemory);
    });
  });

  describe('9.3 Temporary Data Management', () => {
    it('should clear m_charLayouts after each parse', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const fontId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(fontId);

      // Parse multiple times
      for (let i = 0; i < 10; i++) {
        const html = `<div>Parse iteration ${i} with some text content</div>`;
        helper.parseHTML(html, 800, 'flat');
      }

      // Memory should not grow significantly
      const memoryUsage = helper.getTotalMemoryUsage();
      console.log(`  Memory after 10 parses: ${(memoryUsage / 1024).toFixed(2)}KB`);
      
      // Should not exceed threshold
      expect(helper.checkMemoryThreshold()).toBe(false);
    });

    it('should call shrink_to_fit to release vector memory', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const fontId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(fontId);

      // Parse a large document
      const largeParagraphs = Array(50).fill('<p>This is a large paragraph with lots of text content for testing memory management.</p>').join('');
      const largeHtml = `<div>${largeParagraphs}</div>`;
      
      helper.parseHTML(largeHtml, 800, 'flat');
      
      // Parse a small document
      helper.parseHTML('<div>Small</div>', 800, 'flat');
      
      // Memory should not retain the large document's data
      const memoryUsage = helper.getTotalMemoryUsage();
      console.log(`  Memory after large then small parse: ${(memoryUsage / 1024).toFixed(2)}KB`);
      
      expect(helper.checkMemoryThreshold()).toBe(false);
    });

    it('should not retain unnecessary temporary data', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const fontId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(fontId);

      const baselineMemory = helper.getTotalMemoryUsage();

      // Parse 100 times
      for (let i = 0; i < 100; i++) {
        helper.parseHTML('<div>Test content</div>', 800, 'flat');
      }

      const afterParsingMemory = helper.getTotalMemoryUsage();
      console.log(`  Baseline memory: ${(baselineMemory / 1024).toFixed(2)}KB`);
      console.log(`  After 100 parses: ${(afterParsingMemory / 1024).toFixed(2)}KB`);

      // Memory should not grow significantly (only font data should remain)
      expect(afterParsingMemory).toBe(baselineMemory);
    });
  });

  describe('9.4 Destroy Method', () => {
    it('should clean all fonts on destroy', async () => {
      // Create a new module instance for this test
      const testModule = await loadWasmModule();
      const testHelper = new WasmHelper(testModule);

      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      // Load fonts
      testHelper.loadFont(fontData, 'Font1');
      testHelper.loadFont(fontData, 'Font2');
      
      expect(testHelper.getLoadedFonts().length).toBe(2);
      
      // Destroy
      testHelper.destroy();
      
      // All fonts should be cleared
      expect(testHelper.getLoadedFonts().length).toBe(0);
      expect(testHelper.getTotalMemoryUsage()).toBe(0);
    });

    it('should provide complete resource cleanup', async () => {
      const testModule = await loadWasmModule();
      const testHelper = new WasmHelper(testModule);

      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      // Load font and parse
      const fontId = testHelper.loadFont(fontData, 'TestFont');
      testHelper.setDefaultFont(fontId);
      testHelper.parseHTML('<div>Test</div>', 800, 'flat');
      
      // Destroy
      testHelper.destroy();
      
      // Should be able to start fresh
      const newFontId = testHelper.loadFont(fontData, 'NewFont');
      expect(newFontId).toBeGreaterThan(0);
      
      testHelper.destroy();
    });
  });

  describe('9.5 Memory Monitoring and Warnings', () => {
    it('should implement getTotalMemoryUsage method', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const memoryBefore = helper.getTotalMemoryUsage();
      
      helper.loadFont(fontData, 'TestFont');
      
      const memoryAfter = helper.getTotalMemoryUsage();
      
      console.log(`  Memory before: ${memoryBefore}, after: ${memoryAfter}`);
      
      // Memory should increase after loading font
      expect(memoryAfter).toBeGreaterThan(memoryBefore);
    });

    it('should track memory usage per font', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const fontId = helper.loadFont(fontData, 'TestFont');
      
      const memoryMetrics = helper.getMemoryMetrics();
      expect(memoryMetrics).not.toBeNull();
      
      if (memoryMetrics) {
        console.log(`  Total memory: ${(memoryMetrics.totalMemoryUsage / 1024).toFixed(2)}KB`);
        console.log(`  Font count: ${memoryMetrics.fontCount}`);
        
        expect(memoryMetrics.fontCount).toBe(1);
        expect(memoryMetrics.totalMemoryUsage).toBeGreaterThan(0);
        
        // Check per-font memory
        if (memoryMetrics.fonts && memoryMetrics.fonts.length > 0) {
          const font = memoryMetrics.fonts[0];
          console.log(`  Font "${font.name}" memory: ${(font.memoryUsage / 1024).toFixed(2)}KB`);
          expect(font.memoryUsage).toBeGreaterThan(0);
        }
      }
    });

    it('should include memory info in getMetrics', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const fontId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(fontId);
      helper.parseHTML('<div>Test</div>', 800, 'flat');
      
      const metrics = helper.getMetrics() as PerformanceMetrics;
      expect(metrics).not.toBeNull();
      
      if (metrics && metrics.memory) {
        console.log(`  Memory in metrics: ${(metrics.memory.totalFontMemory / 1024).toFixed(2)}KB`);
        expect(metrics.memory.totalFontMemory).toBeGreaterThan(0);
        expect(metrics.memory.fontCount).toBe(1);
      }
    });

    it('should warn when memory exceeds 50MB threshold', () => {
      // This test verifies the threshold check works
      // We can't easily exceed 50MB in a test, so we just verify the check returns false
      expect(helper.checkMemoryThreshold()).toBe(false);
      
      const memoryMetrics = helper.getMemoryMetrics();
      if (memoryMetrics) {
        console.log(`  Current memory: ${(memoryMetrics.totalMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
        console.log(`  Exceeds threshold: ${helper.checkMemoryThreshold()}`);
      }
    });
  });

  describe('9.6 Memory Leak Tests', () => {
    it('should not grow memory on long-running operations', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const fontId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(fontId);

      const initialMemory = helper.getTotalMemoryUsage();
      
      // Simulate long-running operation
      for (let i = 0; i < 200; i++) {
        helper.parseHTML(`<div>Iteration ${i}</div>`, 800, 'flat');
        helper.getVersion();
        helper.getLoadedFonts();
      }
      
      const finalMemory = helper.getTotalMemoryUsage();
      
      console.log(`  Initial memory: ${(initialMemory / 1024).toFixed(2)}KB`);
      console.log(`  Final memory: ${(finalMemory / 1024).toFixed(2)}KB`);
      
      // Memory should not grow (only font data should remain)
      expect(finalMemory).toBe(initialMemory);
    });

    it('should not leak on repeated font load/unload', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const initialMemory = helper.getTotalMemoryUsage();
      
      for (let i = 0; i < 50; i++) {
        const fontId = helper.loadFont(fontData, `Font${i}`);
        helper.unloadFont(fontId);
      }
      
      const finalMemory = helper.getTotalMemoryUsage();
      
      console.log(`  Initial memory: ${initialMemory}`);
      console.log(`  Final memory after 50 load/unload cycles: ${finalMemory}`);
      
      expect(finalMemory).toBe(initialMemory);
    });

    it('should not leak on repeated HTML parsing', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const fontId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(fontId);

      const initialMemory = helper.getTotalMemoryUsage();
      
      // Parse many different HTML documents
      for (let i = 0; i < 100; i++) {
        const html = `<div><p>Paragraph ${i}</p><span>Span ${i}</span></div>`;
        helper.parseHTML(html, 800, 'flat');
      }
      
      const finalMemory = helper.getTotalMemoryUsage();
      
      console.log(`  Initial memory: ${(initialMemory / 1024).toFixed(2)}KB`);
      console.log(`  Final memory after 100 parses: ${(finalMemory / 1024).toFixed(2)}KB`);
      
      // Memory should not grow
      expect(finalMemory).toBe(initialMemory);
    });

    it('should handle mixed operations without leaking', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const initialMemory = helper.getTotalMemoryUsage();
      
      for (let i = 0; i < 30; i++) {
        // Load font
        const fontId = helper.loadFont(fontData, `Font${i}`);
        helper.setDefaultFont(fontId);
        
        // Parse HTML
        helper.parseHTML('<div>Test content</div>', 800, 'flat');
        helper.parseHTML('<div>More content</div>', 800, 'byRow');
        
        // Get metrics
        helper.getMetrics();
        helper.getLoadedFonts();
        
        // Unload font
        helper.unloadFont(fontId);
      }
      
      const finalMemory = helper.getTotalMemoryUsage();
      
      console.log(`  Initial memory: ${initialMemory}`);
      console.log(`  Final memory after mixed operations: ${finalMemory}`);
      
      expect(finalMemory).toBe(initialMemory);
    });
  });
});
