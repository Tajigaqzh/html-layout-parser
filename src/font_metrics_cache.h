/**
 * @file font_metrics_cache.h
 * @brief Font Metrics Cache for HTML Layout Parser v2.0
 * 
 * This module provides:
 * - Caching of character width measurements
 * - Per-font cache management
 * - Cache invalidation on font unload
 * - Memory-efficient storage
 * 
 * Design principles:
 * - Cache frequently used character widths to avoid repeated FreeType calls
 * - Clear cache when font is unloaded
 * - Support for multiple fonts with separate caches
 * 
 * @note Requirements: 7.7, 7.8
 */

#ifndef WASM_V2_FONT_METRICS_CACHE_H
#define WASM_V2_FONT_METRICS_CACHE_H

#include <cstdint>
#include <map>
#include <chrono>

namespace wasm_litehtml_v2 {

/**
 * @brief Font Metrics Cache class (字体度量缓存类)
 * 
 * Caches character width measurements to improve performance.
 * Each font has its own cache, keyed by (fontSize, codepoint).
 * 
 * Usage:
 * 1. Check cache with getCharWidth() before calling FreeType
 * 2. If cache miss (-1), calculate width and store with setCharWidth()
 * 3. Call clearFont() when a font is unloaded
 */
class FontMetricsCache {
public:
    /**
     * @brief Get singleton instance (获取单例实例)
     * @return FontMetricsCache& Reference to the singleton
     */
    static FontMetricsCache& getInstance();

    /**
     * @brief Get cached character width (获取缓存的字符宽度)
     * 
     * @param fontId Font ID
     * @param fontSize Font size in pixels
     * @param codepoint Unicode codepoint
     * @return int Character width in pixels, -1 if not cached
     */
    int getCharWidth(int fontId, int fontSize, uint32_t codepoint);

    /**
     * @brief Set character width in cache (设置字符宽度缓存)
     * 
     * @param fontId Font ID
     * @param fontSize Font size in pixels
     * @param codepoint Unicode codepoint
     * @param width Character width in pixels
     */
    void setCharWidth(int fontId, int fontSize, uint32_t codepoint, int width);

    /**
     * @brief Clear cache for a specific font (清除特定字体的缓存)
     * 
     * Call this when a font is unloaded to free memory.
     * 
     * @param fontId Font ID to clear
     */
    void clearFont(int fontId);

    /**
     * @brief Clear all caches (清除所有缓存)
     */
    void clearAll();

    /**
     * @brief Get cache statistics (获取缓存统计)
     * 
     * @param hits Output: number of cache hits
     * @param misses Output: number of cache misses
     * @param entries Output: total number of cached entries
     */
    void getStats(size_t& hits, size_t& misses, size_t& entries) const;

    /**
     * @brief Reset cache statistics (重置缓存统计)
     */
    void resetStats();

    /**
     * @brief Get total memory usage of cache (获取缓存内存占用)
     * @return size_t Estimated memory usage in bytes
     */
    size_t getMemoryUsage() const;

    /**
     * @brief Get cache hit rate (获取缓存命中率)
     * @return float Hit rate (0.0 - 1.0), -1 if no queries
     */
    float getHitRate() const;

    // Disable copy and assignment
    FontMetricsCache(const FontMetricsCache&) = delete;
    FontMetricsCache& operator=(const FontMetricsCache&) = delete;

private:
    FontMetricsCache();
    ~FontMetricsCache();

    /**
     * @brief Cache key combining fontSize and codepoint
     * 
     * Uses a 64-bit key: upper 32 bits = fontSize, lower 32 bits = codepoint
     */
    static uint64_t makeKey(int fontSize, uint32_t codepoint) {
        return (static_cast<uint64_t>(fontSize) << 32) | codepoint;
    }

    /**
     * @brief Per-font cache entry
     */
    struct FontCache {
        std::map<uint64_t, int> charWidths;  // (fontSize << 32 | codepoint) -> width
    };

    std::map<int, FontCache> m_fontCaches;  // fontId -> FontCache
    
    // Statistics
    mutable size_t m_hits;
    mutable size_t m_misses;
};

} // namespace wasm_litehtml_v2

#endif // WASM_V2_FONT_METRICS_CACHE_H
