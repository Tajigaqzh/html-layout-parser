/**
 * Integration Tests for HTML Layout Parser v2.0
 * 
 * Tests end-to-end functionality:
 * - Canvas rendering (Web environment simulation)
 * - Worker environment (OffscreenCanvas)
 * - Node.js environment (file loading)
 * - Real webpage parsing
 * 
 * @note Requirements: 5.1, 5.2, 5.3, 6.1
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import { loadWasmModule, WasmHelper, loadFontFile, getTestFontPath } from './wasm-loader';
import type { HtmlLayoutParserModule, CharLayout, LayoutDocument, SimpleOutput, Row } from './wasm-types';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Integration Tests', () => {
  let module: HtmlLayoutParserModule;
  let helper: WasmHelper;
  let fontId: number;

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

  describe('Canvas Rendering Integration (Req 6.1)', () => {
    it('should produce Canvas-compatible output for basic text', () => {
      const html = '<div style="font-size: 16px; color: red;">Hello World</div>';
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      expect(result.length).toBe(11); // "Hello World"
      
      // Verify all Canvas-required properties
      for (const char of result) {
        // Position (for fillText)
        expect(typeof char.x).toBe('number');
        expect(typeof char.y).toBe('number');
        expect(typeof char.baseline).toBe('number');
        
        // Font (for ctx.font)
        expect(typeof char.fontFamily).toBe('string');
        expect(typeof char.fontSize).toBe('number');
        expect(typeof char.fontWeight).toBe('number');
        expect(typeof char.fontStyle).toBe('string');
        
        // Color (for ctx.fillStyle)
        expect(char.color).toMatch(/^#[0-9A-Fa-f]{8}$/);
        
        // Dimensions (for background/selection)
        expect(typeof char.width).toBe('number');
        expect(typeof char.height).toBe('number');
      }
    });

    it('should produce correct color values for Canvas', () => {
      const html = `
        <div>
          <span style="color: red;">R</span>
          <span style="color: green;">G</span>
          <span style="color: blue;">B</span>
        </div>
      `;
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      // Find the R, G, B characters
      const rChar = result.find(c => c.character === 'R');
      const gChar = result.find(c => c.character === 'G');
      const bChar = result.find(c => c.character === 'B');
      
      expect(rChar?.color).toBe('#FF0000FF');
      expect(gChar?.color).toBe('#008000FF');
      expect(bChar?.color).toBe('#0000FFFF');
    });

    it('should produce correct font string for Canvas', () => {
      const html = '<div style="font-size: 24px; font-weight: bold; font-style: italic;">Text</div>';
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      expect(result.length).toBeGreaterThan(0);
      
      const char = result[0];
      // Build Canvas font string
      const fontString = `${char.fontStyle} ${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
      
      expect(fontString).toContain('italic');
      expect(fontString).toContain('700');
      expect(fontString).toContain('24px');
    });

    it('should handle multi-line text for Canvas rendering', () => {
      const html = '<div style="width: 100px; font-size: 16px;">This is a long text that should wrap to multiple lines.</div>';
      const result = helper.parseHTML<Row[]>(html, 100, 'byRow');
      
      // Should have multiple rows
      expect(result.length).toBeGreaterThan(1);
      
      // Each row should have valid y coordinate
      for (let i = 1; i < result.length; i++) {
        expect(result[i].y).toBeGreaterThan(result[i - 1].y);
      }
    });

    it('should provide baseline for accurate text positioning', () => {
      const html = '<div style="font-size: 16px;">Baseline Test</div>';
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      for (const char of result) {
        // Baseline should be between y and y + height
        expect(char.baseline).toBeGreaterThanOrEqual(char.y);
        expect(char.baseline).toBeLessThanOrEqual(char.y + char.height);
      }
    });
  });

  describe('Node.js Environment Integration (Req 5.3, 5.5)', () => {
    it('should load font from file system', async () => {
      const fontPath = getTestFontPath();
      
      // Verify file exists
      expect(existsSync(fontPath)).toBe(true);
      
      // Load font using fs
      const fontData = new Uint8Array(readFileSync(fontPath));
      expect(fontData.length).toBeGreaterThan(0);
      
      // Load into parser
      const newFontId = helper.loadFont(fontData, 'FileLoadedFont');
      expect(newFontId).toBeGreaterThan(0);
      
      // Verify font is usable
      helper.setDefaultFont(newFontId);
      const result = helper.parseHTML<CharLayout[]>('<div>Test</div>', 800, 'flat');
      expect(result.length).toBe(4);
      
      helper.unloadFont(newFontId);
    });

    it('should work with HtmlLayoutParser class in Node.js', async () => {
      const { HtmlLayoutParser } = await import('../../packages/html-layout-parser/src/index');
      const wasmPath = join(__dirname, '../../build/html_layout_parser.js');
      
      const parser = new HtmlLayoutParser();
      expect(parser.getEnvironment()).toBe('node');
      
      await parser.init(wasmPath);
      expect(parser.isInitialized()).toBe(true);
      
      // Load font
      const fontPath = getTestFontPath();
      const fontData = new Uint8Array(readFileSync(fontPath));
      const id = parser.loadFont(fontData, 'TestFont');
      parser.setDefaultFont(id);
      
      // Parse HTML
      const result = parser.parse('<div>Node.js Test</div>', { viewportWidth: 800 });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      parser.destroy();
    });

    it('should support loadFontFromFile in Node.js', async () => {
      const { HtmlLayoutParser } = await import('../../packages/html-layout-parser/src/index');
      const wasmPath = join(__dirname, '../../build/html_layout_parser.js');
      
      const parser = new HtmlLayoutParser();
      await parser.init(wasmPath);
      
      const fontPath = getTestFontPath();
      const id = await parser.loadFontFromFile(fontPath, 'FileFont');
      expect(id).toBeGreaterThan(0);
      
      parser.destroy();
    });
  });

  describe('Real Webpage Parsing', () => {
    it('should parse complex HTML structure', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .header { font-size: 24px; font-weight: bold; color: navy; }
            .content { font-size: 14px; color: #333; }
            .footer { font-size: 12px; color: gray; }
          </style>
        </head>
        <body>
          <div class="header">Welcome to My Website</div>
          <div class="content">
            <p>This is the main content area.</p>
            <p>It contains multiple paragraphs.</p>
          </div>
          <div class="footer">Copyright 2024</div>
        </body>
        </html>
      `;
      
      const result = helper.parseHTML<LayoutDocument>(html, 800, 'full');
      
      expect(result.version).toBe('2.0');
      expect(result.pages.length).toBeGreaterThan(0);
      expect(result.pages[0].blocks.length).toBeGreaterThan(0);
    });

    it('should parse HTML with inline styles', () => {
      const html = `
        <div style="font-size: 20px; color: blue; background-color: yellow;">
          Styled Text
        </div>
      `;
      
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].color).toBe('#0000FFFF');
      expect(result[0].fontSize).toBe(20);
    });

    it('should parse HTML with nested elements', () => {
      const html = `
        <div>
          <span style="color: red;">Red</span>
          <span style="color: green;">Green</span>
          <span style="color: blue;">Blue</span>
        </div>
      `;
      
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      // Should have characters from all spans
      const text = result.map(c => c.character).join('');
      expect(text).toContain('Red');
      expect(text).toContain('Green');
      expect(text).toContain('Blue');
    });

    it('should parse HTML with tables', () => {
      const html = `
        <table>
          <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
          </tr>
          <tr>
            <td>Cell 3</td>
            <td>Cell 4</td>
          </tr>
        </table>
      `;
      
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      const text = result.map(c => c.character).join('');
      expect(text).toContain('Cell 1');
      expect(text).toContain('Cell 2');
      expect(text).toContain('Cell 3');
      expect(text).toContain('Cell 4');
    });

    it('should parse HTML with lists', () => {
      const html = `
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      `;
      
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      const text = result.map(c => c.character).join('');
      expect(text).toContain('Item 1');
      expect(text).toContain('Item 2');
      expect(text).toContain('Item 3');
    });

    it('should handle special characters', () => {
      const html = '<div>Special: &amp; &lt; &gt; &quot; &apos;</div>';
      
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      const text = result.map(c => c.character).join('');
      expect(text).toContain('&');
      expect(text).toContain('<');
      expect(text).toContain('>');
    });

    it('should handle Unicode characters', () => {
      const html = '<div>Unicode: 你好世界 🌍 Привет</div>';
      
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      const text = result.map(c => c.character).join('');
      expect(text).toContain('你好世界');
      expect(text).toContain('Привет');
    });
  });

  describe('CSS Separation Integration', () => {
    it('should apply external CSS to complex HTML', () => {
      const html = `
        <div class="container">
          <h1 class="title">Title</h1>
          <p class="content">Content paragraph</p>
          <footer class="footer">Footer text</footer>
        </div>
      `;
      
      const css = `
        .container { width: 100%; }
        .title { font-size: 32px; color: navy; font-weight: bold; }
        .content { font-size: 16px; color: #333; }
        .footer { font-size: 12px; color: gray; }
      `;
      
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat', css);
      
      // Find title character
      const titleChar = result.find(c => c.character === 'T');
      expect(titleChar?.fontSize).toBe(32);
      expect(titleChar?.color).toBe('#000080FF'); // navy
    });

    it('should support theme switching', () => {
      const html = '<div class="text">Theme Test</div>';
      
      const lightTheme = '.text { color: black; background-color: white; }';
      const darkTheme = '.text { color: white; background-color: black; }';
      
      const lightResult = helper.parseHTML<CharLayout[]>(html, 800, 'flat', lightTheme);
      const darkResult = helper.parseHTML<CharLayout[]>(html, 800, 'flat', darkTheme);
      
      expect(lightResult[0].color).toBe('#000000FF');
      expect(darkResult[0].color).toBe('#FFFFFFFF');
    });
  });

  describe('Output Mode Integration', () => {
    const testHtml = '<div style="font-size: 16px;">Hello World</div>';

    it('should produce consistent character count across modes', () => {
      const flatResult = helper.parseHTML<CharLayout[]>(testHtml, 800, 'flat');
      const byRowResult = helper.parseHTML<Row[]>(testHtml, 800, 'byRow');
      const simpleResult = helper.parseHTML<SimpleOutput>(testHtml, 800, 'simple');
      const fullResult = helper.parseHTML<LayoutDocument>(testHtml, 800, 'full');
      
      // Count characters in each mode
      const flatCount = flatResult.length;
      const byRowCount = byRowResult.reduce((sum, row) => sum + row.children.length, 0);
      const simpleCount = simpleResult.lines.reduce((sum, line) => 
        sum + (line.characters?.length || 0), 0);
      
      // All modes should have same character count
      expect(flatCount).toBe(11); // "Hello World"
      expect(byRowCount).toBe(11);
      expect(simpleCount).toBe(11);
    });

    it('should produce consistent text content across modes', () => {
      const flatResult = helper.parseHTML<CharLayout[]>(testHtml, 800, 'flat');
      const byRowResult = helper.parseHTML<Row[]>(testHtml, 800, 'byRow');
      
      const flatText = flatResult.map(c => c.character).join('');
      const byRowText = byRowResult.flatMap(row => row.children.map(c => c.character)).join('');
      
      expect(flatText).toBe('Hello World');
      expect(byRowText).toBe('Hello World');
    });
  });

  describe('Multi-Font Integration', () => {
    it('should use different fonts for different elements', () => {
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      
      // Load multiple fonts
      const font1 = helper.loadFont(fontData, 'Font1');
      const font2 = helper.loadFont(fontData, 'Font2');
      helper.setDefaultFont(font1);
      
      const html = `
        <div>
          <span style="font-family: Font1;">Text1</span>
          <span style="font-family: Font2;">Text2</span>
        </div>
      `;
      
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      // Find characters from each span
      const text1Chars = result.filter(c => 'Text1'.includes(c.character) && c.fontFamily === 'Font1');
      const text2Chars = result.filter(c => 'Text2'.includes(c.character) && c.fontFamily === 'Font2');
      
      expect(text1Chars.length).toBeGreaterThan(0);
      expect(text2Chars.length).toBeGreaterThan(0);
      
      helper.unloadFont(font1);
      helper.unloadFont(font2);
    });
  });

  describe('Error Recovery Integration', () => {
    it('should handle malformed HTML gracefully', () => {
      const malformedHtml = '<div><p>Unclosed paragraph<div>Nested div</p></div>';
      
      // Should not throw
      const result = helper.parseHTML<CharLayout[]>(malformedHtml, 800, 'flat');
      
      // Should still produce some output
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty HTML', () => {
      const result = helper.parseHTML<CharLayout[]>('', 800, 'flat');
      expect(result).toEqual([]);
    });

    it('should handle HTML with only whitespace', () => {
      const result = helper.parseHTML<CharLayout[]>('   \n\t  ', 800, 'flat');
      // May return empty or whitespace characters
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle very long text', () => {
      const longText = 'A'.repeat(10000);
      const html = `<div>${longText}</div>`;
      
      const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
      
      expect(result.length).toBe(10000);
    });
  });
});
