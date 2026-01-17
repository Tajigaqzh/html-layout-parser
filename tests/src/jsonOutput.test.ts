/**
 * Tests for JSON Output Modes
 * 
 * Validates Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loadWasmModule, WasmHelper, loadFontFile, getTestFontPath } from './wasm-loader';
import type { HtmlLayoutParserModule, CharLayout, LayoutDocument, SimpleOutput, Row } from './wasm-types';

describe('JSON Output Modes', () => {
  let module: HtmlLayoutParserModule;
  let helper: WasmHelper;
  let fontId: number;

  const testHtml = '<div style="font-size: 16px;">Hello World</div>';
  const viewportWidth = 800;

  beforeAll(async () => {
    module = await loadWasmModule();
    helper = new WasmHelper(module);
    
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

  describe('Flat Mode (v1 compatible)', () => {
    it('should return flat array of CharLayout', () => {
      const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Each item should be a CharLayout
      const firstChar = result[0];
      expect(firstChar.character).toBeDefined();
      expect(firstChar.x).toBeDefined();
      expect(firstChar.y).toBeDefined();
      expect(firstChar.width).toBeDefined();
      expect(firstChar.height).toBeDefined();
    });

    it('should contain all characters from HTML', () => {
      const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
      
      // "Hello World" = 11 characters
      const text = result.map(c => c.character).join('');
      expect(text).toBe('Hello World');
    });

    it('should have valid position values', () => {
      const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
      
      result.forEach(char => {
        expect(char.x).toBeGreaterThanOrEqual(0);
        expect(char.y).toBeGreaterThanOrEqual(0);
        expect(char.width).toBeGreaterThan(0);
        expect(char.height).toBeGreaterThan(0);
      });
    });
  });

  describe('ByRow Mode (v1 isRow compatible)', () => {
    it('should return array of Row objects', () => {
      const result = helper.parseHTML<Row[]>(testHtml, viewportWidth, 'byRow');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Each item should be a Row
      const firstRow = result[0];
      expect(firstRow.rowIndex).toBeDefined();
      expect(firstRow.children).toBeDefined();
      expect(Array.isArray(firstRow.children)).toBe(true);
    });

    it('should group characters by Y coordinate', () => {
      const multiLineHtml = '<div style="font-size: 16px;">Line 1<br/>Line 2</div>';
      const result = helper.parseHTML<Row[]>(multiLineHtml, viewportWidth, 'byRow');
      
      // Should have at least 2 rows
      expect(result.length).toBeGreaterThanOrEqual(2);
      
      // Each row should have different Y coordinate
      const yCoords = result.map(row => row.y);
      const uniqueYCoords = [...new Set(yCoords)];
      expect(uniqueYCoords.length).toBe(result.length);
    });

    it('should sort characters by X within each row', () => {
      const result = helper.parseHTML<Row[]>(testHtml, viewportWidth, 'byRow');
      
      result.forEach(row => {
        for (let i = 1; i < row.children.length; i++) {
          expect(row.children[i].x).toBeGreaterThanOrEqual(row.children[i - 1].x);
        }
      });
    });
  });

  describe('Simple Mode', () => {
    it('should return SimpleOutput structure', () => {
      const result = helper.parseHTML<SimpleOutput>(testHtml, viewportWidth, 'simple');
      
      expect(result.version).toBe('2.0');
      expect(result.viewport).toBeDefined();
      expect(result.viewport.width).toBe(viewportWidth);
      expect(result.lines).toBeDefined();
      expect(Array.isArray(result.lines)).toBe(true);
    });

    it('should have lines with characters', () => {
      const result = helper.parseHTML<SimpleOutput>(testHtml, viewportWidth, 'simple');
      
      expect(result.lines.length).toBeGreaterThan(0);
      
      const firstLine = result.lines[0];
      expect(firstLine.lineIndex).toBeDefined();
      expect(firstLine.y).toBeDefined();
      expect(firstLine.baseline).toBeDefined();
      expect(firstLine.height).toBeDefined();
      expect(firstLine.characters).toBeDefined();
      expect(Array.isArray(firstLine.characters)).toBe(true);
    });

    it('should include version metadata', () => {
      const result = helper.parseHTML<SimpleOutput>(testHtml, viewportWidth, 'simple');
      
      expect(result.version).toBe('2.0');
    });
  });

  describe('Full Mode', () => {
    it('should return LayoutDocument structure', () => {
      const result = helper.parseHTML<LayoutDocument>(testHtml, viewportWidth, 'full');
      
      expect(result.version).toBe('2.0');
      expect(result.parserVersion).toBe('2.0.0');
      expect(result.viewport).toBeDefined();
      expect(result.pages).toBeDefined();
      expect(Array.isArray(result.pages)).toBe(true);
    });

    it('should have pages with blocks', () => {
      const result = helper.parseHTML<LayoutDocument>(testHtml, viewportWidth, 'full');
      
      expect(result.pages.length).toBeGreaterThan(0);
      
      const firstPage = result.pages[0];
      expect(firstPage.pageIndex).toBe(0);
      expect(firstPage.width).toBe(viewportWidth);
      expect(firstPage.blocks).toBeDefined();
      expect(Array.isArray(firstPage.blocks)).toBe(true);
    });

    it('should have blocks with lines', () => {
      const result = helper.parseHTML<LayoutDocument>(testHtml, viewportWidth, 'full');
      
      const firstBlock = result.pages[0].blocks[0];
      expect(firstBlock.blockIndex).toBeDefined();
      expect(firstBlock.type).toBeDefined();
      expect(firstBlock.lines).toBeDefined();
      expect(Array.isArray(firstBlock.lines)).toBe(true);
    });

    it('should have lines with runs', () => {
      const result = helper.parseHTML<LayoutDocument>(testHtml, viewportWidth, 'full');
      
      const firstLine = result.pages[0].blocks[0].lines[0];
      expect(firstLine.lineIndex).toBeDefined();
      expect(firstLine.runs).toBeDefined();
      expect(Array.isArray(firstLine.runs)).toBe(true);
    });

    it('should group characters into runs by style', () => {
      const result = helper.parseHTML<LayoutDocument>(testHtml, viewportWidth, 'full');
      
      const firstRun = result.pages[0].blocks[0].lines[0].runs[0];
      expect(firstRun.runIndex).toBeDefined();
      expect(firstRun.fontFamily).toBeDefined();
      expect(firstRun.fontSize).toBeDefined();
      expect(firstRun.color).toBeDefined();
      expect(firstRun.characters).toBeDefined();
      expect(Array.isArray(firstRun.characters)).toBe(true);
    });

    it('should include block margin and padding', () => {
      const result = helper.parseHTML<LayoutDocument>(testHtml, viewportWidth, 'full');
      
      const firstBlock = result.pages[0].blocks[0];
      expect(firstBlock.margin).toBeDefined();
      expect(firstBlock.margin.top).toBeDefined();
      expect(firstBlock.margin.right).toBeDefined();
      expect(firstBlock.margin.bottom).toBeDefined();
      expect(firstBlock.margin.left).toBeDefined();
      
      expect(firstBlock.padding).toBeDefined();
      expect(firstBlock.padding.top).toBeDefined();
      expect(firstBlock.padding.right).toBeDefined();
      expect(firstBlock.padding.bottom).toBeDefined();
      expect(firstBlock.padding.left).toBeDefined();
    });
  });

  describe('Version and Metadata (Req 3.2, 3.6)', () => {
    it('should include version 2.0 in full mode', () => {
      const result = helper.parseHTML<LayoutDocument>(testHtml, viewportWidth, 'full');
      expect(result.version).toBe('2.0');
    });

    it('should include version 2.0 in simple mode', () => {
      const result = helper.parseHTML<SimpleOutput>(testHtml, viewportWidth, 'simple');
      expect(result.version).toBe('2.0');
    });

    it('should include parser version in full mode', () => {
      const result = helper.parseHTML<LayoutDocument>(testHtml, viewportWidth, 'full');
      expect(result.parserVersion).toBe('2.0.0');
    });

    it('should include viewport dimensions', () => {
      const result = helper.parseHTML<LayoutDocument>(testHtml, viewportWidth, 'full');
      expect(result.viewport.width).toBe(viewportWidth);
      expect(result.viewport.height).toBeGreaterThan(0);
    });
  });

  describe('CSS Separation Support', () => {
    it('should apply external CSS', () => {
      const html = '<div class="red-text">Styled</div>';
      const css = '.red-text { color: red; }';
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', css);
      
      expect(result.length).toBeGreaterThan(0);
      // The color should be red (#FF0000FF)
      expect(result[0].color).toBe('#FF0000FF');
    });

    it('should work without external CSS', () => {
      const html = '<div style="color: blue;">Blue</div>';
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat');
      
      expect(result.length).toBeGreaterThan(0);
      // The color should be blue (#0000FFFF)
      expect(result[0].color).toBe('#0000FFFF');
    });

    it('should combine external CSS with inline styles', () => {
      const html = '<div class="big" style="color: green;">Combined</div>';
      const css = '.big { font-size: 24px; }';
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', css);
      
      expect(result.length).toBeGreaterThan(0);
      // Should have green color and 24px font size
      expect(result[0].color).toBe('#008000FF');
      expect(result[0].fontSize).toBe(24);
    });
  });

  describe('Character Layout Properties', () => {
    it('should include all required CharLayout fields', () => {
      const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
      
      const char = result[0];
      
      // Basic properties
      expect(char.character).toBeDefined();
      expect(char.x).toBeDefined();
      expect(char.y).toBeDefined();
      expect(char.width).toBeDefined();
      expect(char.height).toBeDefined();
      
      // Font properties
      expect(char.fontFamily).toBeDefined();
      expect(char.fontSize).toBeDefined();
      expect(char.fontWeight).toBeDefined();
      expect(char.fontStyle).toBeDefined();
      
      // Color and background
      expect(char.color).toBeDefined();
      expect(char.backgroundColor).toBeDefined();
      expect(char.opacity).toBeDefined();
      
      // Text decoration
      expect(char.textDecoration).toBeDefined();
      expect(char.textDecoration.underline).toBeDefined();
      expect(char.textDecoration.overline).toBeDefined();
      expect(char.textDecoration.lineThrough).toBeDefined();
      
      // Spacing
      expect(char.letterSpacing).toBeDefined();
      expect(char.wordSpacing).toBeDefined();
      
      // Transform
      expect(char.transform).toBeDefined();
      
      // Baseline and direction
      expect(char.baseline).toBeDefined();
      expect(char.direction).toBeDefined();
      
      // Font ID
      expect(char.fontId).toBeDefined();
    });
  });
});
