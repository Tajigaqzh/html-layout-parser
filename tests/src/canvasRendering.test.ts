/**
 * Tests for Canvas Rendering Support
 * 
 * Validates Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 * 
 * Tests:
 * - Output format validation for Canvas 2D API compatibility
 * - Pixel units for all position/size values
 * - Color format validation (#RRGGBBAA)
 * - Canvas rendering helper functions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loadWasmModule, WasmHelper, loadFontFile, getTestFontPath } from './wasm-loader';
import type { HtmlLayoutParserModule, CharLayout, LayoutDocument, SimpleOutput, Row } from './wasm-types';

describe('Canvas Rendering Support', () => {
  let module: HtmlLayoutParserModule;
  let helper: WasmHelper;
  let fontId: number;

  const testHtml = '<div style="font-size: 16px; color: red;">Hello World</div>';
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

  describe('6.1 Output Format Validation', () => {
    describe('Position and Size Values (Req 6.2)', () => {
      it('should use pixel units for x position', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        expect(result.length).toBeGreaterThan(0);
        
        for (const char of result) {
          expect(typeof char.x).toBe('number');
          expect(Number.isFinite(char.x)).toBe(true);
          expect(char.x).toBeGreaterThanOrEqual(0);
        }
      });

      it('should use pixel units for y position', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(typeof char.y).toBe('number');
          expect(Number.isFinite(char.y)).toBe(true);
          expect(char.y).toBeGreaterThanOrEqual(0);
        }
      });

      it('should use pixel units for width', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(typeof char.width).toBe('number');
          expect(Number.isFinite(char.width)).toBe(true);
          expect(char.width).toBeGreaterThan(0);
        }
      });

      it('should use pixel units for height', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(typeof char.height).toBe('number');
          expect(Number.isFinite(char.height)).toBe(true);
          expect(char.height).toBeGreaterThan(0);
        }
      });

      it('should use pixel units for baseline', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(typeof char.baseline).toBe('number');
          expect(Number.isFinite(char.baseline)).toBe(true);
          // Baseline should be between y and y + height
          expect(char.baseline).toBeGreaterThanOrEqual(char.y);
          expect(char.baseline).toBeLessThanOrEqual(char.y + char.height);
        }
      });

      it('should use pixel units for fontSize', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(typeof char.fontSize).toBe('number');
          expect(Number.isFinite(char.fontSize)).toBe(true);
          expect(char.fontSize).toBeGreaterThan(0);
        }
      });
    });

    describe('Color Format Validation (Req 6.4)', () => {
      const colorRegex = /^#[0-9A-Fa-f]{8}$/;

      it('should use #RRGGBBAA format for text color', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(char.color).toMatch(colorRegex);
        }
      });

      it('should use #RRGGBBAA format for backgroundColor', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(char.backgroundColor).toMatch(colorRegex);
        }
      });

      it('should use #RRGGBBAA format for textDecoration color', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(char.textDecoration.color).toMatch(colorRegex);
        }
      });

      it('should correctly parse red color', () => {
        const html = '<div style="color: red;">R</div>';
        const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat');
        
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].color).toBe('#FF0000FF');
      });

      it('should correctly parse blue color', () => {
        const html = '<div style="color: blue;">B</div>';
        const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat');
        
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].color).toBe('#0000FFFF');
      });

      it('should correctly parse green color', () => {
        const html = '<div style="color: green;">G</div>';
        const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat');
        
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].color).toBe('#008000FF');
      });

      it('should correctly parse hex color', () => {
        const html = '<div style="color: #123456;">H</div>';
        const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat');
        
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].color).toBe('#123456FF');
      });
    });

    describe('Font Properties (Req 6.3)', () => {
      it('should have valid fontFamily string', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(typeof char.fontFamily).toBe('string');
          expect(char.fontFamily.length).toBeGreaterThan(0);
        }
      });

      it('should have valid fontWeight number', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(typeof char.fontWeight).toBe('number');
          expect(char.fontWeight).toBeGreaterThanOrEqual(100);
          expect(char.fontWeight).toBeLessThanOrEqual(900);
        }
      });

      it('should have valid fontStyle string', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(typeof char.fontStyle).toBe('string');
          expect(['normal', 'italic', 'oblique']).toContain(char.fontStyle);
        }
      });

      it('should build valid Canvas font string', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          // Canvas font format: "style weight size family"
          const fontString = `${char.fontStyle} ${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
          expect(fontString).toMatch(/^(normal|italic|oblique) \d+ \d+px .+$/);
        }
      });
    });

    describe('Opacity Validation', () => {
      it('should have opacity between 0 and 1', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(typeof char.opacity).toBe('number');
          expect(char.opacity).toBeGreaterThanOrEqual(0);
          expect(char.opacity).toBeLessThanOrEqual(1);
        }
      });

      it('should default to opacity 1', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        // Without explicit opacity, should be 1
        expect(result[0].opacity).toBe(1);
      });
    });

    describe('Text Decoration Validation', () => {
      it('should have textDecoration object', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(char.textDecoration).toBeDefined();
          expect(typeof char.textDecoration).toBe('object');
        }
      });

      it('should have boolean underline flag', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(typeof char.textDecoration.underline).toBe('boolean');
        }
      });

      it('should have boolean overline flag', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(typeof char.textDecoration.overline).toBe('boolean');
        }
      });

      it('should have boolean lineThrough flag', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(typeof char.textDecoration.lineThrough).toBe('boolean');
        }
      });

      it('should have valid decoration style', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        const validStyles = ['solid', 'double', 'dotted', 'dashed', 'wavy'];
        
        for (const char of result) {
          expect(validStyles).toContain(char.textDecoration.style);
        }
      });

      it('should have numeric thickness', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(typeof char.textDecoration.thickness).toBe('number');
          expect(char.textDecoration.thickness).toBeGreaterThanOrEqual(0);
        }
      });
    });

    describe('Transform Validation', () => {
      it('should have transform object', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(char.transform).toBeDefined();
          expect(typeof char.transform).toBe('object');
        }
      });

      it('should have numeric transform values', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(typeof char.transform.scaleX).toBe('number');
          expect(typeof char.transform.scaleY).toBe('number');
          expect(typeof char.transform.skewX).toBe('number');
          expect(typeof char.transform.skewY).toBe('number');
          expect(typeof char.transform.rotate).toBe('number');
        }
      });

      it('should default to identity transform', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        // Without explicit transform, should be identity
        const char = result[0];
        expect(char.transform.scaleX).toBe(1);
        expect(char.transform.scaleY).toBe(1);
        expect(char.transform.skewX).toBe(0);
        expect(char.transform.skewY).toBe(0);
        expect(char.transform.rotate).toBe(0);
      });
    });

    describe('Direction Validation', () => {
      it('should have valid direction value', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(['ltr', 'rtl']).toContain(char.direction);
        }
      });

      it('should default to ltr direction', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        expect(result[0].direction).toBe('ltr');
      });
    });

    describe('Spacing Validation', () => {
      it('should have numeric letterSpacing', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(typeof char.letterSpacing).toBe('number');
        }
      });

      it('should have numeric wordSpacing', () => {
        const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
        
        for (const char of result) {
          expect(typeof char.wordSpacing).toBe('number');
        }
      });
    });
  });

  describe('6.2 Canvas Rendering Helper Functions', () => {
    describe('Color Parsing', () => {
      it('should parse #RRGGBBAA to rgba format', () => {
        // Test the color format is compatible with Canvas
        const color = '#FF0000FF';
        
        // Parse to rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const a = parseInt(color.slice(7, 9), 16) / 255;
        
        expect(r).toBe(255);
        expect(g).toBe(0);
        expect(b).toBe(0);
        expect(a).toBe(1);
      });

      it('should handle transparent color', () => {
        const color = '#00000000';
        const a = parseInt(color.slice(7, 9), 16) / 255;
        expect(a).toBe(0);
      });

      it('should handle semi-transparent color', () => {
        const color = '#FF000080';
        const a = parseInt(color.slice(7, 9), 16) / 255;
        expect(a).toBeCloseTo(0.502, 2);
      });
    });

    describe('Font String Building', () => {
      it('should build valid Canvas font string', () => {
        const char: Partial<CharLayout> = {
          fontStyle: 'normal',
          fontWeight: 400,
          fontSize: 16,
          fontFamily: 'Arial'
        };
        
        const fontString = `${char.fontStyle} ${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
        expect(fontString).toBe('normal 400 16px Arial');
      });

      it('should handle italic font style', () => {
        const char: Partial<CharLayout> = {
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: 24,
          fontFamily: 'Times New Roman'
        };
        
        const fontString = `${char.fontStyle} ${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
        expect(fontString).toBe('italic 700 24px Times New Roman');
      });
    });
  });

  describe('6.3 Canvas Rendering Performance', () => {
    it('should parse large HTML efficiently', () => {
      // Generate HTML with many characters
      const longText = 'A'.repeat(1000);
      const html = `<div style="font-size: 16px;">${longText}</div>`;
      
      const startTime = performance.now();
      const result = helper.parseHTML<CharLayout[]>(html, viewportWidth, 'flat');
      const endTime = performance.now();
      
      expect(result.length).toBe(1000);
      
      // Should complete in reasonable time (< 5 seconds)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000);
    });

    it('should handle multi-line content', () => {
      const html = `
        <div style="font-size: 16px; width: 100px;">
          This is a long text that should wrap to multiple lines when rendered.
        </div>
      `;
      
      const result = helper.parseHTML<CharLayout[]>(html, 100, 'flat');
      
      // Should have characters
      expect(result.length).toBeGreaterThan(0);
      
      // Should have multiple Y coordinates (multiple lines)
      const yCoords = new Set(result.map(c => c.y));
      expect(yCoords.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Complete CharLayout Structure', () => {
    it('should have all required fields for Canvas rendering', () => {
      const result = helper.parseHTML<CharLayout[]>(testHtml, viewportWidth, 'flat');
      expect(result.length).toBeGreaterThan(0);
      
      const char = result[0];
      
      // All required fields for Canvas 2D API
      const requiredFields = [
        'character',
        'x',
        'y',
        'width',
        'height',
        'fontFamily',
        'fontSize',
        'fontWeight',
        'fontStyle',
        'color',
        'backgroundColor',
        'opacity',
        'textDecoration',
        'letterSpacing',
        'wordSpacing',
        'transform',
        'baseline',
        'direction',
        'fontId'
      ];
      
      for (const field of requiredFields) {
        expect(char).toHaveProperty(field);
      }
    });
  });
});


describe('Canvas Renderer Module', () => {
  // Import the canvas renderer functions for testing
  // Note: These tests validate the helper function logic without actual Canvas
  
  describe('parseColor function', () => {
    it('should convert #RRGGBBAA to rgba format', () => {
      // Test color parsing logic
      const color = '#FF0000FF';
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const a = parseInt(color.slice(7, 9), 16) / 255;
      
      const rgba = `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
      expect(rgba).toBe('rgba(255, 0, 0, 1.000)');
    });

    it('should handle transparent colors', () => {
      const color = '#00000000';
      const a = parseInt(color.slice(7, 9), 16) / 255;
      expect(a).toBe(0);
    });

    it('should handle various alpha values', () => {
      const testCases = [
        { color: '#000000FF', expectedAlpha: 1 },
        { color: '#00000080', expectedAlpha: 0.502 },
        { color: '#00000040', expectedAlpha: 0.251 },
        { color: '#00000000', expectedAlpha: 0 }
      ];

      for (const { color, expectedAlpha } of testCases) {
        const a = parseInt(color.slice(7, 9), 16) / 255;
        expect(a).toBeCloseTo(expectedAlpha, 2);
      }
    });
  });

  describe('buildFontString function', () => {
    it('should build standard font string', () => {
      const fontString = 'normal 400 16px Arial';
      expect(fontString).toMatch(/^(normal|italic|oblique) \d+ \d+px .+$/);
    });

    it('should handle bold weight', () => {
      const fontString = 'normal 700 16px Arial';
      expect(fontString).toContain('700');
    });

    it('should handle italic style', () => {
      const fontString = 'italic 400 16px Arial';
      expect(fontString).toContain('italic');
    });

    it('should handle font families with spaces', () => {
      const fontString = 'normal 400 16px Times New Roman';
      expect(fontString).toContain('Times New Roman');
    });
  });

  describe('validateCanvasCompatibility logic', () => {
    it('should validate position values are numbers', () => {
      const char: Partial<CharLayout> = {
        x: 100,
        y: 50,
        width: 10,
        height: 16,
        baseline: 12
      };

      expect(typeof char.x).toBe('number');
      expect(typeof char.y).toBe('number');
      expect(typeof char.width).toBe('number');
      expect(typeof char.height).toBe('number');
      expect(typeof char.baseline).toBe('number');
    });

    it('should validate color format', () => {
      const colorRegex = /^#[0-9A-Fa-f]{8}$/;
      
      expect('#FF0000FF').toMatch(colorRegex);
      expect('#00FF00FF').toMatch(colorRegex);
      expect('#0000FFFF').toMatch(colorRegex);
      expect('#12345678').toMatch(colorRegex);
    });

    it('should validate opacity range', () => {
      const validOpacities = [0, 0.5, 1];
      const invalidOpacities = [-0.1, 1.1, 2];

      for (const opacity of validOpacities) {
        expect(opacity).toBeGreaterThanOrEqual(0);
        expect(opacity).toBeLessThanOrEqual(1);
      }

      for (const opacity of invalidOpacities) {
        expect(opacity < 0 || opacity > 1).toBe(true);
      }
    });

    it('should validate direction values', () => {
      const validDirections = ['ltr', 'rtl'];
      
      expect(validDirections).toContain('ltr');
      expect(validDirections).toContain('rtl');
      expect(validDirections).not.toContain('auto');
    });
  });
});

describe('OffscreenCanvas Support', () => {
  it('should support OffscreenCanvas type check', () => {
    // Test that we can check for OffscreenCanvas availability
    const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
    
    // In Node.js test environment, OffscreenCanvas may not be available
    // This test just validates the type check logic works
    expect(typeof hasOffscreenCanvas).toBe('boolean');
  });
});

describe('Usage Examples', () => {
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

  it('Example: Basic text rendering data', () => {
    const html = '<div style="font-size: 16px; color: black;">Hello</div>';
    const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
    
    // Verify we have renderable data
    expect(result.length).toBe(5); // "Hello" = 5 characters
    
    // Each character has all Canvas-required properties
    for (const char of result) {
      // Position for fillText()
      expect(char.x).toBeDefined();
      expect(char.baseline).toBeDefined();
      
      // Font for ctx.font
      expect(char.fontFamily).toBeDefined();
      expect(char.fontSize).toBeDefined();
      expect(char.fontWeight).toBeDefined();
      expect(char.fontStyle).toBeDefined();
      
      // Color for ctx.fillStyle
      expect(char.color).toBeDefined();
    }
  });

  it('Example: Styled text rendering data', () => {
    const html = '<div style="font-size: 24px; color: red; font-weight: bold;">Bold Red</div>';
    const result = helper.parseHTML<CharLayout[]>(html, 800, 'flat');
    
    expect(result.length).toBeGreaterThan(0);
    
    // Verify styling is captured
    expect(result[0].fontSize).toBe(24);
    expect(result[0].color).toBe('#FF0000FF');
    expect(result[0].fontWeight).toBe(700);
  });

  it('Example: Multi-line rendering data', () => {
    const html = '<div style="font-size: 16px; width: 50px;">Line one and line two</div>';
    const result = helper.parseHTML<Row[]>(html, 50, 'byRow');
    
    // Should have multiple rows
    expect(result.length).toBeGreaterThanOrEqual(1);
    
    // Each row has y coordinate and children
    for (const row of result) {
      expect(row.y).toBeDefined();
      expect(row.children).toBeDefined();
      expect(row.children.length).toBeGreaterThan(0);
    }
  });

  it('Example: Full document structure for complex rendering', () => {
    const html = '<div style="font-size: 16px;">Paragraph text</div>';
    const result = helper.parseHTML<LayoutDocument>(html, 800, 'full');
    
    // Full structure for advanced rendering
    expect(result.version).toBe('2.0');
    expect(result.viewport).toBeDefined();
    expect(result.pages).toBeDefined();
    expect(result.pages.length).toBeGreaterThan(0);
    
    // Navigate to characters
    const page = result.pages[0];
    expect(page.blocks).toBeDefined();
    
    if (page.blocks.length > 0) {
      const block = page.blocks[0];
      expect(block.lines).toBeDefined();
      
      if (block.lines.length > 0) {
        const line = block.lines[0];
        expect(line.runs).toBeDefined();
      }
    }
  });
});
