/**
 * Multi-Font Management Unit Tests
 * 
 * Tests for multi-font management functionality:
 * - Font loading and unloading
 * - Font fallback mechanism
 * - Font reuse and sharing
 * - Font ID management
 * - Default font handling
 * 
 * @note Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { loadWasmModule, WasmHelper, loadFontFile, getTestFontPath } from './wasm-loader';
import type { HtmlLayoutParserModule, CharLayout, FontInfo } from './wasm-types';

describe('Multi-Font Management Tests', () => {
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

  describe('1.1 Font Loading (Req 1.1)', () => {
    it('should load font from binary data and return unique ID', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const fontId = helper.loadFont(fontData, 'TestFont');
      
      expect(fontId).toBeGreaterThan(0);
    });

    it('should return different IDs for different fonts', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const fontId1 = helper.loadFont(fontData, 'Font1');
      const fontId2 = helper.loadFont(fontData, 'Font2');
      const fontId3 = helper.loadFont(fontData, 'Font3');
      
      expect(fontId1).toBeGreaterThan(0);
      expect(fontId2).toBeGreaterThan(0);
      expect(fontId3).toBeGreaterThan(0);
      
      // All IDs should be unique
      expect(fontId1).not.toBe(fontId2);
      expect(fontId2).not.toBe(fontId3);
      expect(fontId1).not.toBe(fontId3);
    });

    it('should handle loading same font with different names', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const fontId1 = helper.loadFont(fontData, 'Arial');
      const fontId2 = helper.loadFont(fontData, 'Helvetica');
      
      expect(fontId1).toBeGreaterThan(0);
      expect(fontId2).toBeGreaterThan(0);
      expect(fontId1).not.toBe(fontId2);
    });

    it('should track memory usage for loaded fonts', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const memoryBefore = helper.getTotalMemoryUsage();
      
      const fontId = helper.loadFont(fontData, 'TestFont');
      expect(fontId).toBeGreaterThan(0);
      
      const memoryAfter = helper.getTotalMemoryUsage();
      
      // Memory should increase after loading font
      expect(memoryAfter).toBeGreaterThan(memoryBefore);
    });
  });

  describe('1.2 Font Unloading (Req 1.2, 1.6)', () => {
    it('should unload font and release memory', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const fontId = helper.loadFont(fontData, 'TestFont');
      expect(fontId).toBeGreaterThan(0);
      
      const memoryBefore = helper.getTotalMemoryUsage();
      
      helper.unloadFont(fontId);
      
      const memoryAfter = helper.getTotalMemoryUsage();
      
      // Memory should decrease after unloading
      expect(memoryAfter).toBeLessThan(memoryBefore);
    });

    it('should not affect other fonts when unloading one', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const fontId1 = helper.loadFont(fontData, 'Font1');
      const fontId2 = helper.loadFont(fontData, 'Font2');
      const fontId3 = helper.loadFont(fontData, 'Font3');
      
      // Unload the middle font
      helper.unloadFont(fontId2);
      
      // Other fonts should still be loaded
      const fonts = helper.getLoadedFonts();
      expect(fonts.find(f => f.id === fontId1)).toBeDefined();
      expect(fonts.find(f => f.id === fontId2)).toBeUndefined();
      expect(fonts.find(f => f.id === fontId3)).toBeDefined();
    });

    it('should handle unloading non-existent font gracefully', () => {
      // Should not throw
      expect(() => helper.unloadFont(9999)).not.toThrow();
    });

    it('should handle double unload gracefully', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const fontId = helper.loadFont(fontData, 'TestFont');
      
      helper.unloadFont(fontId);
      // Second unload should not throw
      expect(() => helper.unloadFont(fontId)).not.toThrow();
    });
  });

  describe('1.3 Default Font (Req 1.3)', () => {
    it('should set default font for fallback', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const fontId = helper.loadFont(fontData, 'DefaultFont');
      
      // Should not throw
      expect(() => helper.setDefaultFont(fontId)).not.toThrow();
    });

    it('should use default font when parsing HTML', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const fontId = helper.loadFont(fontData, 'DefaultFont');
      helper.setDefaultFont(fontId);
      
      const html = '<div>Hello World</div>';
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      expect(result.length).toBeGreaterThan(0);
      // All characters should use the default font
      for (const char of result) {
        expect(char.fontId).toBe(fontId);
      }
    });
  });

  describe('1.4 Font Listing (Req 1.4)', () => {
    it('should list all loaded fonts with IDs and names', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const fontId1 = helper.loadFont(fontData, 'Arial');
      const fontId2 = helper.loadFont(fontData, 'Helvetica');
      const fontId3 = helper.loadFont(fontData, 'Times');
      
      const fonts = helper.getLoadedFonts();
      
      expect(fonts.length).toBe(3);
      
      // Check all fonts are listed with correct info
      const font1 = fonts.find(f => f.id === fontId1);
      const font2 = fonts.find(f => f.id === fontId2);
      const font3 = fonts.find(f => f.id === fontId3);
      
      expect(font1).toBeDefined();
      expect(font1?.name).toBe('Arial');
      expect(font1?.memoryUsage).toBeGreaterThan(0);
      
      expect(font2).toBeDefined();
      expect(font2?.name).toBe('Helvetica');
      
      expect(font3).toBeDefined();
      expect(font3?.name).toBe('Times');
    });

    it('should return empty array when no fonts loaded', () => {
      const fonts = helper.getLoadedFonts();
      expect(fonts).toEqual([]);
    });

    it('should update list after unloading font', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const fontId1 = helper.loadFont(fontData, 'Font1');
      const fontId2 = helper.loadFont(fontData, 'Font2');
      
      expect(helper.getLoadedFonts().length).toBe(2);
      
      helper.unloadFont(fontId1);
      
      const fonts = helper.getLoadedFonts();
      expect(fonts.length).toBe(1);
      expect(fonts[0].id).toBe(fontId2);
    });
  });

  describe('1.5 Font Fallback Chain (Req 1.5)', () => {
    it('should use font-family fallback when primary font not available', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      // Load only one font
      const fontId = helper.loadFont(fontData, 'Helvetica');
      helper.setDefaultFont(fontId);
      
      // HTML requests Arial first, then Helvetica
      const html = '<div style="font-family: Arial, Helvetica, sans-serif;">Test</div>';
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      expect(result.length).toBeGreaterThan(0);
      // Should fall back to Helvetica since Arial is not loaded
      expect(result[0].fontFamily).toBe('Helvetica');
    });

    it('should fall back to default font when no fonts in chain are available', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const fontId = helper.loadFont(fontData, 'DefaultFont');
      helper.setDefaultFont(fontId);
      
      // HTML requests fonts that are not loaded
      const html = '<div style="font-family: Arial, Helvetica, sans-serif;">Test</div>';
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      expect(result.length).toBeGreaterThan(0);
      // Should fall back to default font
      expect(result[0].fontId).toBe(fontId);
    });
  });

  describe('1.6 Clear All Fonts (Req 1.7)', () => {
    it('should clear all loaded fonts at once', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      helper.loadFont(fontData, 'Font1');
      helper.loadFont(fontData, 'Font2');
      helper.loadFont(fontData, 'Font3');
      
      expect(helper.getLoadedFonts().length).toBe(3);
      
      helper.clearAllFonts();
      
      expect(helper.getLoadedFonts().length).toBe(0);
    });

    it('should release all memory when clearing fonts', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      helper.loadFont(fontData, 'Font1');
      helper.loadFont(fontData, 'Font2');
      helper.loadFont(fontData, 'Font3');
      
      const memoryBefore = helper.getTotalMemoryUsage();
      expect(memoryBefore).toBeGreaterThan(0);
      
      helper.clearAllFonts();
      
      const memoryAfter = helper.getTotalMemoryUsage();
      expect(memoryAfter).toBe(0);
    });
  });

  describe('1.7 Font Reuse (Req 1.8)', () => {
    it('should allow reusing loaded font for multiple parses', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const fontId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(fontId);
      
      // Parse multiple times with same font
      const result1 = helper.parseHTML<CharLayout[]>('<div>First</div>', 800, 'flat');
      const result2 = helper.parseHTML<CharLayout[]>('<div>Second</div>', 800, 'flat');
      const result3 = helper.parseHTML<CharLayout[]>('<div>Third</div>', 800, 'flat');
      
      expect(result1.length).toBeGreaterThan(0);
      expect(result2.length).toBeGreaterThan(0);
      expect(result3.length).toBeGreaterThan(0);
      
      // All should use the same font
      expect(result1[0].fontId).toBe(fontId);
      expect(result2[0].fontId).toBe(fontId);
      expect(result3[0].fontId).toBe(fontId);
    });

    it('should not require reloading font between parses', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const fontId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(fontId);
      
      const memoryAfterLoad = helper.getTotalMemoryUsage();
      
      // Parse multiple times
      for (let i = 0; i < 10; i++) {
        helper.parseHTML<CharLayout[]>(`<div>Parse ${i}</div>`, 800, 'flat');
      }
      
      const memoryAfterParses = helper.getTotalMemoryUsage();
      
      // Memory should not grow significantly (font data should be reused)
      expect(memoryAfterParses).toBe(memoryAfterLoad);
    });
  });

  describe('1.8 Batch/Parallel Parsing (Req 1.9)', () => {
    it('should support parsing multiple HTML documents with shared fonts', async () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const fontId = helper.loadFont(fontData, 'SharedFont');
      helper.setDefaultFont(fontId);
      
      // Parse multiple documents
      const htmlDocs = [
        '<div>Document 1</div>',
        '<div>Document 2</div>',
        '<div>Document 3</div>',
        '<div>Document 4</div>',
        '<div>Document 5</div>'
      ];
      
      const results = htmlDocs.map(html => 
        helper.parseHTML<CharLayout[]>(html, 800, 'flat')
      );
      
      // All should succeed
      for (const result of results) {
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].fontId).toBe(fontId);
      }
    });

    it('should maintain font state across multiple parses', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const fontId1 = helper.loadFont(fontData, 'Font1');
      const fontId2 = helper.loadFont(fontData, 'Font2');
      helper.setDefaultFont(fontId1);
      
      // Parse with different font-family specifications
      const result1 = helper.parseHTML<CharLayout[]>(
        '<div style="font-family: Font1;">Text1</div>', 800, 'flat'
      );
      const result2 = helper.parseHTML<CharLayout[]>(
        '<div style="font-family: Font2;">Text2</div>', 800, 'flat'
      );
      
      expect(result1[0].fontFamily).toBe('Font1');
      expect(result2[0].fontFamily).toBe('Font2');
    });
  });

  describe('Font ID Sequence', () => {
    it('should generate sequential font IDs', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const ids: number[] = [];
      for (let i = 0; i < 5; i++) {
        const id = helper.loadFont(fontData, `Font${i}`);
        ids.push(id);
      }
      
      // IDs should be sequential (or at least increasing)
      for (let i = 1; i < ids.length; i++) {
        expect(ids[i]).toBeGreaterThan(ids[i - 1]);
      }
    });

    it('should not reuse IDs after unloading', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const id1 = helper.loadFont(fontData, 'Font1');
      const id2 = helper.loadFont(fontData, 'Font2');
      
      helper.unloadFont(id1);
      
      const id3 = helper.loadFont(fontData, 'Font3');
      
      // id3 should be different from id1 (IDs are not reused)
      expect(id3).not.toBe(id1);
      expect(id3).toBeGreaterThan(id2);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid font data gracefully', () => {
      const invalidData = new Uint8Array([0, 1, 2, 3, 4, 5]);
      
      const fontId = helper.loadFont(invalidData, 'InvalidFont');
      
      // Should return 0 for invalid font
      expect(fontId).toBe(0);
    });

    it('should handle empty font name', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      // Empty name should still work (or return 0)
      const fontId = helper.loadFont(fontData, '');
      
      // Implementation may either accept empty name or reject it
      // Just ensure it doesn't crash
      expect(typeof fontId).toBe('number');
    });

    it('should handle very long font name', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      const longName = 'A'.repeat(1000);
      const fontId = helper.loadFont(fontData, longName);
      
      // Should handle long names without crashing
      expect(fontId).toBeGreaterThan(0);
    });
  });
});
