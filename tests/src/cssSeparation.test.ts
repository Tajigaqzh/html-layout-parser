/**
 * Tests for CSS Separation Support
 * 
 * Validates Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loadWasmModule, WasmHelper, loadFontFile, getTestFontPath } from './wasm-loader';
import type { HtmlLayoutParserModule, CharLayout } from './wasm-types';

describe('CSS Separation Support', () => {
  let module: HtmlLayoutParserModule;
  let helper: WasmHelper;
  let fontId: number;

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

  describe('Basic CSS Separation (Req 4.1, 4.2)', () => {
    it('should apply external CSS to HTML', () => {
      const html = '<div class="styled">Text</div>';
      const css = '.styled { color: red; }';
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', css);
      
      expect(result.length).toBeGreaterThan(0);
      // Red color should be #FF0000FF
      expect(result[0].color).toBe('#FF0000FF');
    });

    it('should work without external CSS (Req 4.3)', () => {
      const html = '<div style="color: blue;">Blue Text</div>';
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat');
      
      expect(result.length).toBeGreaterThan(0);
      // Blue color should be #0000FFFF
      expect(result[0].color).toBe('#0000FFFF');
    });

    it('should handle empty CSS string', () => {
      const html = '<div style="color: green;">Green</div>';
      const css = '';
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', css);
      
      expect(result.length).toBeGreaterThan(0);
      // Should use inline style (green)
      expect(result[0].color).toBe('#008000FF');
    });
  });

  describe('CSS and Inline Style Combination (Req 4.4)', () => {
    it('should combine external CSS with inline styles', () => {
      const html = '<div class="big" style="color: purple;">Combined</div>';
      const css = '.big { font-size: 24px; }';
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', css);
      
      expect(result.length).toBeGreaterThan(0);
      // Should have purple color from inline style
      expect(result[0].color).toBe('#800080FF');
      // Should have 24px font size from external CSS
      expect(result[0].fontSize).toBe(24);
    });

    it('should allow inline styles to override external CSS', () => {
      const html = '<div class="red" style="color: blue;">Override</div>';
      const css = '.red { color: red; }';
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', css);
      
      expect(result.length).toBeGreaterThan(0);
      // Inline style should override external CSS
      expect(result[0].color).toBe('#0000FFFF');
    });

    it('should combine external CSS with HTML style tags', () => {
      const html = `
        <style>.internal { font-weight: bold; }</style>
        <div class="external internal">Both</div>
      `;
      const css = '.external { color: orange; }';
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', css);
      
      expect(result.length).toBeGreaterThan(0);
      // Should have orange color from external CSS
      // Note: Orange is #FFA500FF
      expect(result[0].color).toBe('#FFA500FF');
      // Should have bold font weight from internal style
      expect(result[0].fontWeight).toBeGreaterThanOrEqual(700);
    });
  });

  describe('Theme Switching Scenario (Req 4.2)', () => {
    const html = '<div class="content">Theme Test</div>';
    
    it('should apply light theme CSS', () => {
      const lightTheme = '.content { color: black; }';
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', lightTheme);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].color).toBe('#000000FF');
    });

    it('should apply dark theme CSS', () => {
      const darkTheme = '.content { color: white; }';
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', darkTheme);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].color).toBe('#FFFFFFFF');
    });

    it('should switch themes by changing CSS only', () => {
      const theme1 = '.content { color: red; }';
      const theme2 = '.content { color: green; }';
      
      const result1 = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', theme1);
      const result2 = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', theme2);
      
      expect(result1[0].color).toBe('#FF0000FF');
      expect(result2[0].color).toBe('#008000FF');
    });
  });

  describe('CSS Modularity Scenario (Req 4.4)', () => {
    it('should combine multiple CSS modules', () => {
      const html = '<div class="base component theme">Modular</div>';
      
      const baseCSS = '.base { font-size: 16px; }';
      const componentCSS = '.component { font-weight: bold; }';
      const themeCSS = '.theme { color: navy; }';
      
      const combinedCSS = [baseCSS, componentCSS, themeCSS].join('\n');
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', combinedCSS);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].fontSize).toBe(16);
      expect(result[0].fontWeight).toBeGreaterThanOrEqual(700);
      // Navy is #000080FF
      expect(result[0].color).toBe('#000080FF');
    });

    it('should handle CSS with multiple selectors', () => {
      const html = '<div class="a b">Multi</div>';
      const css = `
        .a { color: red; }
        .b { font-size: 20px; }
        .a.b { font-weight: bold; }
      `;
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', css);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].color).toBe('#FF0000FF');
      expect(result[0].fontSize).toBe(20);
      expect(result[0].fontWeight).toBeGreaterThanOrEqual(700);
    });
  });

  describe('Complex CSS Features', () => {
    it('should handle descendant selectors', () => {
      const html = '<div class="parent"><span class="child">Nested</span></div>';
      const css = '.parent .child { color: teal; }';
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', css);
      
      expect(result.length).toBeGreaterThan(0);
      // Teal is #008080FF
      expect(result[0].color).toBe('#008080FF');
    });

    it('should handle element type selectors', () => {
      const html = '<p>Paragraph</p>';
      const css = 'p { color: maroon; }';
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', css);
      
      expect(result.length).toBeGreaterThan(0);
      // Maroon is #800000FF
      expect(result[0].color).toBe('#800000FF');
    });

    it('should handle ID selectors', () => {
      const html = '<div id="unique">ID Selector</div>';
      const css = '#unique { color: olive; }';
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', css);
      
      expect(result.length).toBeGreaterThan(0);
      // Olive is #808000FF
      expect(result[0].color).toBe('#808000FF');
    });

    it('should respect CSS specificity', () => {
      const html = '<div id="myid" class="myclass">Specificity</div>';
      const css = `
        .myclass { color: red; }
        #myid { color: blue; }
        div { color: green; }
      `;
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', css);
      
      expect(result.length).toBeGreaterThan(0);
      // ID selector has highest specificity, should be blue
      expect(result[0].color).toBe('#0000FFFF');
    });
  });

  describe('Edge Cases', () => {
    it('should handle CSS with comments', () => {
      const html = '<div class="test">Comments</div>';
      const css = `
        /* This is a comment */
        .test { color: silver; }
        /* Another comment */
      `;
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', css);
      
      expect(result.length).toBeGreaterThan(0);
      // Silver is #C0C0C0FF
      expect(result[0].color).toBe('#C0C0C0FF');
    });

    it('should handle CSS with whitespace', () => {
      const html = '<div class="spaced">Whitespace</div>';
      const css = `
        
        .spaced    {   color:   gray;   }
        
      `;
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', css);
      
      expect(result.length).toBeGreaterThan(0);
      // Gray is #808080FF
      expect(result[0].color).toBe('#808080FF');
    });

    it('should handle multiple CSS rules for same element', () => {
      const html = '<div class="multi">Multiple Rules</div>';
      const css = `
        .multi { color: red; }
        .multi { font-size: 18px; }
        .multi { font-weight: bold; }
      `;
      
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat', css);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].color).toBe('#FF0000FF');
      expect(result[0].fontSize).toBe(18);
      expect(result[0].fontWeight).toBeGreaterThanOrEqual(700);
    });
  });
});
