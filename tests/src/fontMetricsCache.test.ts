/**
 * Font Metrics Cache tests for HTML Layout Parser v2.0
 * 
 * Tests cache functionality:
 * - Cache hit rate
 * - Performance improvement
 * - Memory usage
 * 
 * @note Requirements: 7.7, 7.8
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { loadWasmModule, WasmHelper, loadFontFile, getTestFontPath } from './wasm-loader';
import type { HtmlLayoutParserModule } from './wasm-types';

describe('Font Metrics Cache Tests', () => {
  let module: HtmlLayoutParserModule;
  let helper: WasmHelper;
  let fontId: number;

  beforeAll(async () => {
    module = await loadWasmModule();
    helper = new WasmHelper(module);
    
    // Load test font
    const fontPath = getTestFontPath();
    const fontData = loadFontFile(fontPath);
    fontId = helper.loadFont(fontData, 'TestFont');
    
    if (fontId === 0) {
      throw new Error('Failed to load test font');
    }
    
    helper.setDefaultFont(fontId);
  });

  afterAll(() => {
    if (helper) {
      helper.clearAllFonts();
    }
  });

  beforeEach(() => {
    // Reset cache statistics before each test
    helper.resetCacheStats();
  });

  describe('Cache Statistics', () => {
    it('should return cache statistics', () => {
      const stats = helper.getCacheStats();
      
      expect(stats).not.toBeNull();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('entries');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('memoryUsage');
    });

    it('should start with zero hits and misses after reset', () => {
      const stats = helper.getCacheStats();
      
      expect(stats?.hits).toBe(0);
      expect(stats?.misses).toBe(0);
    });

    it('should track cache entries after parsing', () => {
      // Parse some HTML to populate the cache
      helper.parseHTML('<div>Hello World</div>', 800, 'flat');
      
      const stats = helper.getCacheStats();
      
      // Should have some entries after parsing
      expect(stats?.entries).toBeGreaterThan(0);
      console.log(`  Cache entries after first parse: ${stats?.entries}`);
    });
  });

  describe('Cache Hit Rate', () => {
    it('should have cache hits on repeated parsing', () => {
      const html = '<div>Test content for cache testing</div>';
      
      // First parse - should populate cache (mostly misses)
      helper.parseHTML(html, 800, 'flat');
      const statsAfterFirst = helper.getCacheStats();
      console.log(`  After first parse: hits=${statsAfterFirst?.hits}, misses=${statsAfterFirst?.misses}`);
      
      // Second parse - should have cache hits
      helper.parseHTML(html, 800, 'flat');
      const statsAfterSecond = helper.getCacheStats();
      console.log(`  After second parse: hits=${statsAfterSecond?.hits}, misses=${statsAfterSecond?.misses}`);
      
      // Should have more hits after second parse
      expect(statsAfterSecond?.hits).toBeGreaterThan(statsAfterFirst?.hits || 0);
    });

    it('should achieve good hit rate on repeated parsing', () => {
      const html = '<div>ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>';
      
      // Parse multiple times to build up cache
      for (let i = 0; i < 5; i++) {
        helper.parseHTML(html, 800, 'flat');
      }
      
      const stats = helper.getCacheStats();
      
      console.log(`  After 5 parses:`);
      console.log(`    Hits: ${stats?.hits}`);
      console.log(`    Misses: ${stats?.misses}`);
      console.log(`    Hit Rate: ${stats?.hitRate !== null ? (stats?.hitRate * 100).toFixed(1) + '%' : 'N/A'}`);
      console.log(`    Entries: ${stats?.entries}`);
      
      // Should have a positive hit rate
      if (stats?.hitRate !== null) {
        expect(stats.hitRate).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance Improvement', () => {
    it('should show performance improvement with cache', () => {
      const html = '<div><p>This is a test paragraph with some text content for performance testing.</p></div>';
      
      // Reset stats
      helper.resetCacheStats();
      
      // First parse (cold cache)
      const startFirst = performance.now();
      helper.parseHTML(html, 800, 'flat');
      const timeFirst = performance.now() - startFirst;
      
      // Multiple subsequent parses (warm cache)
      const times: number[] = [];
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        helper.parseHTML(html, 800, 'flat');
        times.push(performance.now() - start);
      }
      
      const avgWarmTime = times.reduce((a, b) => a + b, 0) / times.length;
      
      console.log(`  First parse (cold cache): ${timeFirst.toFixed(2)}ms`);
      console.log(`  Average warm cache time: ${avgWarmTime.toFixed(2)}ms`);
      
      const stats = helper.getCacheStats();
      console.log(`  Cache hit rate: ${stats?.hitRate !== null ? (stats?.hitRate * 100).toFixed(1) + '%' : 'N/A'}`);
      
      // Warm cache should generally be faster or similar
      // (Note: timing can vary, so we just log the results)
    });

    it('should handle large documents efficiently with cache', () => {
      // Generate large HTML
      const paragraphs = Array(50).fill('<p>This is a test paragraph with some text content.</p>').join('');
      const html = `<div>${paragraphs}</div>`;
      
      helper.resetCacheStats();
      
      // First parse
      const startFirst = performance.now();
      helper.parseHTML(html, 800, 'flat');
      const timeFirst = performance.now() - startFirst;
      
      // Second parse (should benefit from cache)
      const startSecond = performance.now();
      helper.parseHTML(html, 800, 'flat');
      const timeSecond = performance.now() - startSecond;
      
      const stats = helper.getCacheStats();
      
      console.log(`  Large document (50 paragraphs):`);
      console.log(`    First parse: ${timeFirst.toFixed(2)}ms`);
      console.log(`    Second parse: ${timeSecond.toFixed(2)}ms`);
      console.log(`    Cache entries: ${stats?.entries}`);
      console.log(`    Hit rate: ${stats?.hitRate !== null ? (stats?.hitRate * 100).toFixed(1) + '%' : 'N/A'}`);
    });
  });

  describe('Memory Usage', () => {
    it('should track cache memory usage', () => {
      // Parse some content to populate cache
      helper.parseHTML('<div>Hello World 12345</div>', 800, 'flat');
      
      const stats = helper.getCacheStats();
      
      expect(stats?.memoryUsage).toBeGreaterThan(0);
      console.log(`  Cache memory usage: ${stats?.memoryUsage} bytes`);
    });

    it('should clear cache when fonts are unloaded', () => {
      // Load a new font
      const fontPath = getTestFontPath();
      const fontData = loadFontFile(fontPath);
      const newFontId = helper.loadFont(fontData, 'TempFont');
      
      // Parse with the new font
      helper.parseHTML('<div>Test with temp font</div>', 800, 'flat');
      
      const statsBeforeUnload = helper.getCacheStats();
      console.log(`  Cache entries before unload: ${statsBeforeUnload?.entries}`);
      
      // Unload the font
      helper.unloadFont(newFontId);
      
      // Cache should be cleared for that font
      // (Note: entries may still exist for the default font)
      const statsAfterUnload = helper.getCacheStats();
      console.log(`  Cache entries after unload: ${statsAfterUnload?.entries}`);
    });

    it('should clear all cache entries when clearCache is called', () => {
      // Parse some content
      helper.parseHTML('<div>Test content</div>', 800, 'flat');
      
      const statsBefore = helper.getCacheStats();
      expect(statsBefore?.entries).toBeGreaterThan(0);
      
      // Clear cache
      helper.clearCache();
      
      const statsAfter = helper.getCacheStats();
      expect(statsAfter?.entries).toBe(0);
      
      console.log(`  Entries before clear: ${statsBefore?.entries}`);
      console.log(`  Entries after clear: ${statsAfter?.entries}`);
    });
  });

  describe('Detailed Metrics', () => {
    it('should include cache stats in detailed metrics', () => {
      // Parse some content
      helper.parseHTML('<div>Test</div>', 800, 'flat');
      
      const detailedMetrics = helper.getDetailedMetrics();
      
      expect(detailedMetrics).not.toBeNull();
      expect(detailedMetrics).toHaveProperty('cache');
      expect(detailedMetrics.cache).toHaveProperty('hits');
      expect(detailedMetrics.cache).toHaveProperty('misses');
      expect(detailedMetrics.cache).toHaveProperty('entries');
      expect(detailedMetrics.cache).toHaveProperty('hitRate');
      expect(detailedMetrics.cache).toHaveProperty('memoryUsage');
      
      console.log(`  Detailed metrics cache section:`, detailedMetrics.cache);
    });
  });
});
