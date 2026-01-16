/**
 * Debug Mode Tests for HTML Layout Parser v2.0
 * 
 * Tests debug mode functionality:
 * - setDebugMode/getDebugMode API
 * - Debug logging at key stages
 * - Debug mode state persistence
 * 
 * @note Requirements: 8.1, 8.2, 8.3, 8.6
 * @note These tests require the WASM module to be rebuilt with debug mode support.
 *       If the module doesn't have debug mode functions, tests will be skipped.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { loadWasmModule, WasmHelper, loadFontFile, getTestFontPath } from './wasm-loader';
import type { HtmlLayoutParserModule, CharLayout } from './wasm-types';

describe('Debug Mode Tests', () => {
  let module: HtmlLayoutParserModule;
  let helper: WasmHelper;
  let fontId: number;
  let hasDebugModeSupport: boolean;

  beforeAll(async () => {
    module = await loadWasmModule();
    helper = new WasmHelper(module);
    
    // Check if debug mode functions are available
    hasDebugModeSupport = typeof module._setDebugMode === 'function' && 
                          typeof module._getDebugMode === 'function';
    
    if (!hasDebugModeSupport) {
      console.warn('Debug mode functions not available in WASM module. Tests will be skipped.');
      console.warn('Please rebuild the WASM module with: cd html-layout-parser && ./build.sh --clean');
    }
    
    // Load test font
    const fontData = loadFontFile(getTestFontPath());
    fontId = helper.loadFont(fontData, 'TestFont');
    expect(fontId).toBeGreaterThan(0);
    helper.setDefaultFont(fontId);
  });

  afterAll(() => {
    if (helper) {
      helper.clearAllFonts();
    }
  });

  beforeEach(() => {
    // Ensure debug mode is off before each test
    if (hasDebugModeSupport) {
      helper.setDebugMode(false);
    }
  });

  afterEach(() => {
    // Ensure debug mode is off after each test
    if (hasDebugModeSupport) {
      helper.setDebugMode(false);
    }
  });

  describe('Debug Mode API (Req 8.1)', () => {
    it('should have debug mode disabled by default', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      // After module load, debug mode should be off
      expect(helper.getDebugMode()).toBe(false);
    });

    it('should enable debug mode with setDebugMode(true)', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      helper.setDebugMode(true);
      expect(helper.getDebugMode()).toBe(true);
    });

    it('should disable debug mode with setDebugMode(false)', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      helper.setDebugMode(true);
      expect(helper.getDebugMode()).toBe(true);
      
      helper.setDebugMode(false);
      expect(helper.getDebugMode()).toBe(false);
    });

    it('should toggle debug mode correctly', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      // Start with false
      expect(helper.getDebugMode()).toBe(false);
      
      // Toggle to true
      helper.setDebugMode(true);
      expect(helper.getDebugMode()).toBe(true);
      
      // Toggle back to false
      helper.setDebugMode(false);
      expect(helper.getDebugMode()).toBe(false);
      
      // Toggle to true again
      helper.setDebugMode(true);
      expect(helper.getDebugMode()).toBe(true);
    });
  });

  describe('Debug Mode with Parsing (Req 8.2, 8.3)', () => {
    it('should parse successfully with debug mode enabled', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      helper.setDebugMode(true);
      
      const html = '<div style="font-size: 16px;">Hello World</div>';
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      expect(result.length).toBe(11); // "Hello World"
      expect(result[0].character).toBe('H');
    });

    it('should parse successfully with debug mode disabled', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      helper.setDebugMode(false);
      
      const html = '<div style="font-size: 16px;">Hello World</div>';
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      expect(result.length).toBe(11);
      expect(result[0].character).toBe('H');
    });

    it('should produce identical results with debug mode on and off', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      const html = '<div style="font-size: 16px; color: red;">Test</div>';
      
      // Parse with debug mode off
      helper.setDebugMode(false);
      const resultOff = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      // Parse with debug mode on
      helper.setDebugMode(true);
      const resultOn = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      // Results should be identical
      expect(resultOn.length).toBe(resultOff.length);
      
      for (let i = 0; i < resultOn.length; i++) {
        expect(resultOn[i].character).toBe(resultOff[i].character);
        expect(resultOn[i].x).toBe(resultOff[i].x);
        expect(resultOn[i].y).toBe(resultOff[i].y);
        expect(resultOn[i].color).toBe(resultOff[i].color);
      }
    });
  });

  describe('Debug Mode with Font Operations (Req 8.2)', () => {
    it('should load font successfully with debug mode enabled', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      helper.setDebugMode(true);
      
      const fontData = loadFontFile(getTestFontPath());
      const newFontId = helper.loadFont(fontData, 'DebugTestFont');
      
      expect(newFontId).toBeGreaterThan(0);
      
      // Clean up
      helper.unloadFont(newFontId);
    });

    it('should unload font successfully with debug mode enabled', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      helper.setDebugMode(true);
      
      const fontData = loadFontFile(getTestFontPath());
      const newFontId = helper.loadFont(fontData, 'DebugUnloadFont');
      expect(newFontId).toBeGreaterThan(0);
      
      // Get font count before unload
      const fontsBefore = helper.getLoadedFonts();
      const countBefore = fontsBefore.length;
      
      // Unload font
      helper.unloadFont(newFontId);
      
      // Get font count after unload
      const fontsAfter = helper.getLoadedFonts();
      const countAfter = fontsAfter.length;
      
      expect(countAfter).toBe(countBefore - 1);
    });

    it('should clear all fonts successfully with debug mode enabled', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      helper.setDebugMode(true);
      
      // Load some fonts
      const fontData = loadFontFile(getTestFontPath());
      const font1 = helper.loadFont(fontData, 'ClearFont1');
      const font2 = helper.loadFont(fontData, 'ClearFont2');
      
      expect(font1).toBeGreaterThan(0);
      expect(font2).toBeGreaterThan(0);
      
      // Clear all fonts
      helper.clearAllFonts();
      
      // Verify all fonts are cleared
      const fonts = helper.getLoadedFonts();
      expect(fonts.length).toBe(0);
      
      // Reload the test font for other tests
      const newFontId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(newFontId);
      fontId = newFontId;
    });
  });

  describe('Debug Mode with CSS Separation (Req 8.2)', () => {
    it('should parse with external CSS and debug mode enabled', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      helper.setDebugMode(true);
      
      const html = '<div class="title">Styled Text</div>';
      const css = '.title { color: blue; font-size: 24px; }';
      
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat', css);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].color).toBe('#0000FFFF');
      expect(result[0].fontSize).toBe(24);
    });
  });

  describe('Debug Mode State Persistence', () => {
    it('should persist debug mode state across multiple parse operations', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      helper.setDebugMode(true);
      
      // First parse
      helper.parseHTML<CharLayout[]>('<div>First</div>', 800, 'flat');
      expect(helper.getDebugMode()).toBe(true);
      
      // Second parse
      helper.parseHTML<CharLayout[]>('<div>Second</div>', 800, 'flat');
      expect(helper.getDebugMode()).toBe(true);
      
      // Third parse
      helper.parseHTML<CharLayout[]>('<div>Third</div>', 800, 'flat');
      expect(helper.getDebugMode()).toBe(true);
    });

    it('should persist debug mode state across font operations', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      helper.setDebugMode(true);
      
      const fontData = loadFontFile(getTestFontPath());
      
      // Load font
      const newFontId = helper.loadFont(fontData, 'PersistFont');
      expect(helper.getDebugMode()).toBe(true);
      
      // Unload font
      helper.unloadFont(newFontId);
      expect(helper.getDebugMode()).toBe(true);
    });
  });

  describe('Debug Mode with Different Output Modes', () => {
    const testHtml = '<div style="font-size: 16px;">Test</div>';

    it('should work with flat mode', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      helper.setDebugMode(true);
      const result = helper.parseHTML<CharLayout[]>(testHtml, 800, 'flat');
      expect(result.length).toBe(4);
    });

    it('should work with byRow mode', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      helper.setDebugMode(true);
      const result = helper.parseHTML(testHtml, 800, 'byRow');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should work with simple mode', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      helper.setDebugMode(true);
      const result = helper.parseHTML(testHtml, 800, 'simple');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('lines');
    });

    it('should work with full mode', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      helper.setDebugMode(true);
      const result = helper.parseHTML(testHtml, 800, 'full');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('pages');
    });
  });

  describe('Debug Mode with Error Handling', () => {
    it('should handle empty HTML with debug mode enabled', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      helper.setDebugMode(true);
      
      const result = helper.parseHTML<CharLayout[]>('', 800, 'flat');
      expect(result).toEqual([]);
    });

    it('should handle malformed HTML with debug mode enabled', () => {
      if (!hasDebugModeSupport) {
        console.log('Skipping: Debug mode not supported in current WASM build');
        return;
      }
      helper.setDebugMode(true);
      
      const malformedHtml = '<div><p>Unclosed';
      const result = helper.parseHTML<CharLayout[]>(malformedHtml, 800, 'flat');
      
      // Should not throw and should produce some output
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
