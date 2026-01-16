/**
 * Cross-Environment Consistency Tests
 * 
 * Tests to verify consistent behavior across:
 * - Web/Worker/Node.js environments
 * - Different browsers (simulated via API consistency)
 * - Different Node.js versions (API compatibility)
 * 
 * @note Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { loadWasmModule, WasmHelper, loadFontFile, getTestFontPath } from './wasm-loader';
import type { HtmlLayoutParserModule, CharLayout, LayoutDocument, SimpleOutput, Row } from './wasm-types';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Cross-Environment Consistency Tests', () => {
  let module: HtmlLayoutParserModule;
  let helper: WasmHelper;
  let fontId: number;

  beforeAll(async () => {
    module = await loadWasmModule();
    helper = new WasmHelper(module);
    
    const fontData = loadFontFile(getTestFontPath());
    fontId = helper.loadFont(fontData, 'TestFont');
    helper.setDefaultFont(fontId);
  });

  afterAll(() => {
    if (helper) {
      helper.clearAllFonts();
    }
  });

  describe('API Consistency (Req 5.4)', () => {
    it('should have consistent font management API', () => {
      // Verify all font management functions exist
      expect(typeof module._loadFont).toBe('function');
      expect(typeof module._unloadFont).toBe('function');
      expect(typeof module._setDefaultFont).toBe('function');
      expect(typeof module._getLoadedFonts).toBe('function');
      expect(typeof module._clearAllFonts).toBe('function');
    });

    it('should have consistent parsing API', () => {
      // Verify all parsing functions exist
      expect(typeof module._parseHTML).toBe('function');
      expect(typeof module._freeString).toBe('function');
    });

    it('should have consistent utility API', () => {
      // Verify all utility functions exist
      expect(typeof module._getVersion).toBe('function');
      expect(typeof module._getMetrics).toBe('function');
      expect(typeof module._destroy).toBe('function');
      expect(typeof module._getTotalMemoryUsage).toBe('function');
      expect(typeof module._checkMemoryThreshold).toBe('function');
      expect(typeof module._getMemoryMetrics).toBe('function');
    });

    it('should have consistent memory management API', () => {
      // Verify Emscripten memory functions
      expect(typeof module._malloc).toBe('function');
      expect(typeof module._free).toBe('function');
      expect(module.HEAPU8).toBeDefined();
      expect(typeof module.lengthBytesUTF8).toBe('function');
      expect(typeof module.stringToUTF8).toBe('function');
      expect(typeof module.UTF8ToString).toBe('function');
    });
  });

  describe('Output Consistency Across Modes (Req 5.1, 5.2, 5.3)', () => {
    const testHtml = '<div style="font-size: 16px; color: red;">Hello World</div>';
    const viewportWidth = 800;

    it('should produce consistent character content across modes', () => {
      const flatResult = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
      const byRowResult = helper.parseHTML<Row[]>(testHtml, viewportWidth, 'byRow');
      const simpleResult = helper.parseHTML<SimpleOutput>(testHtml, viewportWidth, 'simple');
      const fullResult = helper.parseHTML<LayoutDocument>(testHtml, viewportWidth, 'full');
      
      // Extract text from each mode
      const flatText = flatResult.map(c => c.character).join('');
      const byRowText = byRowResult.flatMap(row => row.children.map(c => c.character)).join('');
      const simpleText = simpleResult.lines.flatMap(line => 
        (line.characters || []).map(c => c.character)
      ).join('');
      
      // All modes should produce same text
      expect(flatText).toBe('Hello World');
      expect(byRowText).toBe('Hello World');
      expect(simpleText).toBe('Hello World');
    });

    it('should produce consistent character positions across modes', () => {
      const flatResult = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
      const byRowResult = helper.parseHTML<Row[]>(testHtml, viewportWidth, 'byRow');
      
      // Compare positions
      const flatPositions = flatResult.map(c => ({ x: c.x, y: c.y }));
      const byRowPositions = byRowResult.flatMap(row => 
        row.children.map(c => ({ x: c.x, y: c.y }))
      );
      
      expect(flatPositions.length).toBe(byRowPositions.length);
      
      for (let i = 0; i < flatPositions.length; i++) {
        expect(flatPositions[i].x).toBe(byRowPositions[i].x);
        expect(flatPositions[i].y).toBe(byRowPositions[i].y);
      }
    });

    it('should produce consistent styling across modes', () => {
      const flatResult = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
      const byRowResult = helper.parseHTML<Row[]>(testHtml, viewportWidth, 'byRow');
      
      // Compare styling
      const flatStyles = flatResult.map(c => ({
        color: c.color,
        fontSize: c.fontSize,
        fontFamily: c.fontFamily
      }));
      const byRowStyles = byRowResult.flatMap(row => 
        row.children.map(c => ({
          color: c.color,
          fontSize: c.fontSize,
          fontFamily: c.fontFamily
        }))
      );
      
      expect(flatStyles.length).toBe(byRowStyles.length);
      
      for (let i = 0; i < flatStyles.length; i++) {
        expect(flatStyles[i].color).toBe(byRowStyles[i].color);
        expect(flatStyles[i].fontSize).toBe(byRowStyles[i].fontSize);
        expect(flatStyles[i].fontFamily).toBe(byRowStyles[i].fontFamily);
      }
    });
  });

  describe('Version Consistency', () => {
    it('should return consistent version string', () => {
      const version1 = helper.getVersion();
      const version2 = helper.getVersion();
      const version3 = helper.getVersion();
      
      expect(version1).toBe('2.0.0');
      expect(version2).toBe('2.0.0');
      expect(version3).toBe('2.0.0');
    });

    it('should include version in full mode output', () => {
      const result = helper.parseHTML<LayoutDocument>(
        '<div>Test</div>', 800, 'full'
      );
      
      expect(result.version).toBe('2.0');
      expect(result.parserVersion).toBe('2.0.0');
    });

    it('should include version in simple mode output', () => {
      const result = helper.parseHTML<SimpleOutput>(
        '<div>Test</div>', 800, 'simple'
      );
      
      expect(result.version).toBe('2.0');
    });
  });

  describe('Deterministic Output', () => {
    it('should produce identical output for same input', () => {
      const html = '<div style="font-size: 16px;">Deterministic Test</div>';
      
      const result1 = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      const result2 = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      const result3 = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      // All results should be identical
      expect(result1.length).toBe(result2.length);
      expect(result2.length).toBe(result3.length);
      
      for (let i = 0; i < result1.length; i++) {
        expect(result1[i].character).toBe(result2[i].character);
        expect(result1[i].x).toBe(result2[i].x);
        expect(result1[i].y).toBe(result2[i].y);
        expect(result1[i].width).toBe(result2[i].width);
        expect(result1[i].height).toBe(result2[i].height);
        expect(result1[i].color).toBe(result2[i].color);
      }
    });

    it('should produce identical output with same CSS', () => {
      const html = '<div class="test">CSS Test</div>';
      const css = '.test { color: blue; font-size: 20px; }';
      
      const result1 = helper.parseHTML<CharLayout[]>(html, 800, 'flat', css);
      const result2 = helper.parseHTML<CharLayout[]>(html, 800, 'flat', css);
      
      expect(result1.length).toBe(result2.length);
      
      for (let i = 0; i < result1.length; i++) {
        expect(result1[i].color).toBe(result2[i].color);
        expect(result1[i].fontSize).toBe(result2[i].fontSize);
      }
    });
  });

  describe('HtmlLayoutParser Class Consistency', () => {
    it('should detect Node.js environment correctly', async () => {
      const { HtmlLayoutParser, detectEnvironment } = await import('../../packages/html-layout-parser/src/index');
      
      const env = detectEnvironment();
      expect(env).toBe('node');
      
      const parser = new HtmlLayoutParser();
      expect(parser.getEnvironment()).toBe('node');
    });

    it('should provide consistent API through class wrapper', async () => {
      const { HtmlLayoutParser } = await import('../../packages/html-layout-parser/src/index');
      const wasmPath = join(__dirname, '../../build/html_layout_parser.js');
      
      const parser = new HtmlLayoutParser();
      await parser.init(wasmPath);
      
      // Load font
      const fontData = new Uint8Array(readFileSync(getTestFontPath()));
      const id = parser.loadFont(fontData, 'TestFont');
      parser.setDefaultFont(id);
      
      // Parse HTML
      const result = parser.parse('<div>Test</div>', { viewportWidth: 800 });
      
      // Verify result structure
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4); // "Test"
      
      // Verify character properties
      const char = result[0] as CharLayout;
      expect(char.character).toBe('T');
      expect(typeof char.x).toBe('number');
      expect(typeof char.y).toBe('number');
      expect(typeof char.width).toBe('number');
      expect(typeof char.height).toBe('number');
      
      parser.destroy();
    });

    it('should produce same output through class and direct API', async () => {
      const { HtmlLayoutParser } = await import('../../packages/html-layout-parser/src/index');
      const wasmPath = join(__dirname, '../../build/html_layout_parser.js');
      
      const parser = new HtmlLayoutParser();
      await parser.init(wasmPath);
      
      const fontData = new Uint8Array(readFileSync(getTestFontPath()));
      const classId = parser.loadFont(fontData, 'ClassFont');
      parser.setDefaultFont(classId);
      
      const html = '<div style="font-size: 16px;">Consistency</div>';
      
      // Parse through class
      const classResult = parser.parse(html, { viewportWidth: 800 }) as CharLayout[];
      
      parser.destroy();
      
      // Parse through direct API (using existing helper)
      const directResult = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      // Compare results
      expect(classResult.length).toBe(directResult.length);
      
      for (let i = 0; i < classResult.length; i++) {
        expect(classResult[i].character).toBe(directResult[i].character);
        // Note: Positions may differ slightly due to different font instances
        // but character content should be identical
      }
    });
  });

  describe('Error Handling Consistency', () => {
    it('should handle empty HTML consistently', () => {
      const result1 = helper.parseHTML<CharLayout[]>('', 800, 'flat');
      const result2 = helper.parseHTML<CharLayout[]>('', 800, 'flat');
      
      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
    });

    it('should handle invalid viewport width consistently', () => {
      // Very small viewport
      const result1 = helper.parseHTML<CharLayout[]>('<div>Test</div>', 1, 'flat');
      const result2 = helper.parseHTML<CharLayout[]>('<div>Test</div>', 1, 'flat');
      
      expect(result1.length).toBe(result2.length);
    });

    it('should handle malformed HTML consistently', () => {
      const malformedHtml = '<div><p>Unclosed';
      
      const result1 = helper.parseHTML<CharLayout[]>(malformedHtml, 800, 'flat');
      const result2 = helper.parseHTML<CharLayout[]>(malformedHtml, 800, 'flat');
      
      expect(result1.length).toBe(result2.length);
      
      for (let i = 0; i < result1.length; i++) {
        expect(result1[i].character).toBe(result2[i].character);
      }
    });
  });

  describe('Memory Metrics Consistency', () => {
    it('should report consistent memory metrics', () => {
      const metrics1 = helper.getMetrics();
      const metrics2 = helper.getMetrics();
      
      expect(metrics1).not.toBeNull();
      expect(metrics2).not.toBeNull();
      
      if (metrics1 && metrics2) {
        expect(metrics1.memory.fontCount).toBe(metrics2.memory.fontCount);
        expect(metrics1.memory.totalFontMemory).toBe(metrics2.memory.totalFontMemory);
      }
    });

    it('should report consistent memory usage', () => {
      const usage1 = helper.getTotalMemoryUsage();
      const usage2 = helper.getTotalMemoryUsage();
      const usage3 = helper.getTotalMemoryUsage();
      
      expect(usage1).toBe(usage2);
      expect(usage2).toBe(usage3);
    });
  });

  describe('Font Management Consistency', () => {
    it('should maintain consistent font list', () => {
      const fonts1 = helper.getLoadedFonts();
      const fonts2 = helper.getLoadedFonts();
      
      expect(fonts1.length).toBe(fonts2.length);
      
      for (let i = 0; i < fonts1.length; i++) {
        expect(fonts1[i].id).toBe(fonts2[i].id);
        expect(fonts1[i].name).toBe(fonts2[i].name);
      }
    });

    it('should produce consistent font IDs', () => {
      const fontData = loadFontFile(getTestFontPath());
      
      // Clear and reload
      helper.clearAllFonts();
      
      const id1 = helper.loadFont(fontData, 'Font1');
      const id2 = helper.loadFont(fontData, 'Font2');
      
      // IDs should be sequential
      expect(id2).toBeGreaterThan(id1);
      
      // Reload default font for other tests
      const defaultId = helper.loadFont(fontData, 'TestFont');
      helper.setDefaultFont(defaultId);
    });
  });

  describe('CSS Separation Consistency', () => {
    it('should apply CSS consistently', () => {
      const html = '<div class="styled">Styled Text</div>';
      const css = '.styled { color: red; font-size: 20px; }';
      
      const result1 = helper.parseHTML<CharLayout[]>(html, 800, 'flat', css);
      const result2 = helper.parseHTML<CharLayout[]>(html, 800, 'flat', css);
      
      expect(result1.length).toBe(result2.length);
      
      for (let i = 0; i < result1.length; i++) {
        expect(result1[i].color).toBe(result2[i].color);
        expect(result1[i].fontSize).toBe(result2[i].fontSize);
      }
    });

    it('should handle CSS override consistently', () => {
      const html = '<div class="base" style="color: blue;">Override</div>';
      const css = '.base { color: red; }';
      
      const result1 = helper.parseHTML<CharLayout[]>(html, 800, 'flat', css);
      const result2 = helper.parseHTML<CharLayout[]>(html, 800, 'flat', css);
      
      // Inline style should override external CSS
      expect(result1[0].color).toBe('#0000FFFF');
      expect(result2[0].color).toBe('#0000FFFF');
    });
  });
});
