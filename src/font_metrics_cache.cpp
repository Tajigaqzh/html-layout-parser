/**
 * @file font_metrics_cache.cpp
 * @brief Font Metrics Cache implementation for HTML Layout Parser v2.0
 * 
 * @note Requirements: 7.7, 7.8
 */

#include "font_metrics_cache.h"

namespace wasm_litehtml_v2 {

FontMetricsCache& FontMetricsCache::getInstance() {
    static FontMetricsCache instance;
    return instance;
}

FontMetricsCache::FontMetricsCache()
    : m_hits(0)
    , m_misses(0)
{
}

FontMetricsCache::~FontMetricsCache() {
    clearAll();
}

int FontMetricsCache::getCharWidth(int fontId, int fontSize, uint32_t codepoint) {
    auto fontIt = m_fontCaches.find(fontId);
    if (fontIt == m_fontCaches.end()) {
        m_misses++;
        return -1;  // Font not in cache
    }

    uint64_t key = makeKey(fontSize, codepoint);
    auto& charWidths = fontIt->second.charWidths;
    auto charIt = charWidths.find(key);
    
    if (charIt != charWidths.end()) {
        m_hits++;
        return charIt->second;  // Cache hit
    }

    m_misses++;
    return -1;  // Cache miss
}

void FontMetricsCache::setCharWidth(int fontId, int fontSize, uint32_t codepoint, int width) {
    uint64_t key = makeKey(fontSize, codepoint);
    m_fontCaches[fontId].charWidths[key] = width;
}

void FontMetricsCache::clearFont(int fontId) {
    auto it = m_fontCaches.find(fontId);
    if (it != m_fontCaches.end()) {
        it->second.charWidths.clear();
        m_fontCaches.erase(it);
    }
}

void FontMetricsCache::clearAll() {
    for (auto& pair : m_fontCaches) {
        pair.second.charWidths.clear();
    }
    m_fontCaches.clear();
}

void FontMetricsCache::getStats(size_t& hits, size_t& misses, size_t& entries) const {
    hits = m_hits;
    misses = m_misses;
    
    entries = 0;
    for (const auto& pair : m_fontCaches) {
        entries += pair.second.charWidths.size();
    }
}

void FontMetricsCache::resetStats() {
    m_hits = 0;
    m_misses = 0;
}

size_t FontMetricsCache::getMemoryUsage() const {
    size_t usage = sizeof(FontMetricsCache);
    
    // Estimate map overhead
    // Each map entry: key (8 bytes) + value (4 bytes) + tree node overhead (~32 bytes)
    const size_t entryOverhead = 8 + 4 + 32;
    
    for (const auto& pair : m_fontCaches) {
        // FontCache struct overhead
        usage += sizeof(FontCache);
        // Map entries
        usage += pair.second.charWidths.size() * entryOverhead;
    }
    
    // Outer map entries
    usage += m_fontCaches.size() * (sizeof(int) + sizeof(FontCache*) + 32);
    
    return usage;
}

float FontMetricsCache::getHitRate() const {
    size_t total = m_hits + m_misses;
    if (total == 0) {
        return -1.0f;  // No queries yet
    }
    return static_cast<float>(m_hits) / static_cast<float>(total);
}

} // namespace wasm_litehtml_v2
