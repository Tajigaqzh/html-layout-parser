/**
 * @file html_layout_parser.cpp
 * @brief HTML Layout Parser v2.0 - WASM API Entry Point
 * 
 * This file defines the WASM module's exported API for v2.0:
 * - Multi-font management (load, unload, set default)
 * - HTML parsing with optional external CSS
 * - Rich text attributes and standardized JSON output
 * - Memory management utilities
 * - Performance metrics tracking
 * - Error handling and diagnostics
 * 
 * @note Requirements: 3.1, 3.4, 3.5, 3.6, 4.1, 7.1, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5
 */

#include <emscripten.h>
#include <cstdint>
#include <cstring>
#include <cstdlib>
#include <string>
#include <chrono>
#include <sstream>

#include <litehtml.h>
#include "multi_font_manager.h"
#include "wasm_container.h"
#include "json_serializer.h"
#include "error_types.h"
#include "debug_log.h"
#include "font_metrics_cache.h"

using namespace wasm_litehtml_v2;

// ============================================================================
// Performance Metrics Storage
// ============================================================================

/**
 * @brief Global performance metrics from last parse operation (上次解析性能指标)
 */
struct ParseMetrics {
    double parseTime = 0.0;         // HTML parsing time (ms) (解析耗时)
    double layoutTime = 0.0;        // Layout calculation time (ms) (布局耗时)
    double serializeTime = 0.0;     // JSON serialization time (ms) (序列化耗时)
    double totalTime = 0.0;         // Total time (ms) (总耗时)
    int characterCount = 0;         // Number of characters (字符数)
    size_t inputSize = 0;           // Input HTML size (bytes) (输入大小)
    double charsPerSecond = 0.0;    // Characters per second (处理速度)
};

static ParseMetrics g_lastMetrics;  // Last metrics snapshot (上次指标快照)

// Last parse result for error tracking (上次解析结果)
static ParseResult g_lastParseResult;

/**
 * @brief Helper function to allocate and copy a string (分配并拷贝字符串)
 * @param str Source string
 * @return char* Allocated string (caller must free with freeString)
 */
static char* allocateString(const std::string& str) {
    char* result = static_cast<char*>(malloc(str.length() + 1));
    if (result) {
        strcpy(result, str.c_str());
    }
    return result;
}

/**
 * @brief Serialize a ParseError to JSON (序列化错误信息)
 * @param error ParseError to serialize
 * @return JSON string
 */
static std::string serializeParseError(const ParseError& error) {
    std::ostringstream oss;
    oss << "{";
    oss << "\"code\":\"" << errorCodeToString(error.code) << "\",";
    oss << "\"codeNum\":" << errorCodeToInt(error.code) << ",";
    oss << "\"message\":\"" << JsonSerializer::escapeJsonString(error.message) << "\",";
    oss << "\"severity\":\"" << severityToString(error.severity) << "\"";
    if (error.line >= 0) {
        oss << ",\"line\":" << error.line;
    }
    if (error.column >= 0) {
        oss << ",\"column\":" << error.column;
    }
    if (!error.context.empty()) {
        oss << ",\"context\":\"" << JsonSerializer::escapeJsonString(error.context) << "\"";
    }
    oss << "}";
    return oss.str();
}

/**
 * @brief Serialize a ParseResult to JSON (序列化解析结果)
 * @param result ParseResult to serialize
 * @return JSON string
 */
static std::string serializeParseResult(const ParseResult& result) {
    std::ostringstream oss;
    oss << "{";
    oss << "\"success\":" << (result.success ? "true" : "false");
    
    // Add data if successful
    if (result.success && !result.data.empty()) {
        oss << ",\"data\":" << result.data;
    }
    
    // Add errors if any
    if (!result.errors.empty()) {
        oss << ",\"errors\":[";
        for (size_t i = 0; i < result.errors.size(); ++i) {
            if (i > 0) oss << ",";
            oss << serializeParseError(result.errors[i]);
        }
        oss << "]";
    }
    
    // Add warnings if any
    if (!result.warnings.empty()) {
        oss << ",\"warnings\":[";
        for (size_t i = 0; i < result.warnings.size(); ++i) {
            if (i > 0) oss << ",";
            oss << serializeParseError(result.warnings[i]);
        }
        oss << "]";
    }
    
    // Add metrics if enabled
    if (result.metricsEnabled) {
        oss << ",\"metrics\":{";
        oss << "\"parseTime\":" << result.metrics.parseTime << ",";
        oss << "\"layoutTime\":" << result.metrics.layoutTime << ",";
        oss << "\"serializeTime\":" << result.metrics.serializeTime << ",";
        oss << "\"totalTime\":" << result.metrics.totalTime << ",";
        oss << "\"characterCount\":" << result.metrics.characterCount << ",";
        oss << "\"inputSize\":" << result.metrics.inputSize << ",";
        oss << "\"charsPerSecond\":" << result.metrics.charsPerSecond << ",";
        oss << "\"memoryUsed\":" << result.metrics.memoryUsed;
        oss << "}";
    }
    
    oss << "}";
    return oss.str();
}

extern "C" {

// ============================================================================
// Debug Mode API
// ============================================================================

/**
 * @brief Set debug mode on/off (设置调试模式)
 * @param isDebug true to enable debug logging, false to disable
 * 
 * When debug mode is enabled, the parser outputs detailed logs at key stages:
 * - Font loading/unloading
 * - HTML parsing start/complete
 * - CSS parsing start/complete
 * - Layout calculation start/complete
 * - Serialization start/complete
 * - Memory usage information
 * 
 * @note Requirements: 8.1, 8.2, 8.3, 8.6
 */
EMSCRIPTEN_KEEPALIVE
void setDebugMode(bool isDebug) {
    g_isDebug = isDebug;
    if (isDebug) {
        DEBUG_LOG("Debug mode enabled");
    }
}

/**
 * @brief Get current debug mode state (获取当前调试模式状态)
 * @return true if debug mode is enabled
 */
EMSCRIPTEN_KEEPALIVE
bool getDebugMode() {
    return g_isDebug;
}

// ============================================================================
// Font Management API
// ============================================================================

/**
 * @brief Load a font from binary data (加载字体数据)
 * @param fontData Font binary data (TTF/OTF)
 * @param fontDataSize Size of font data in bytes
 * @param fontName Font name for identification
 * @return Font ID (positive integer) on success, 0 on failure
 */
EMSCRIPTEN_KEEPALIVE
int loadFont(const uint8_t* fontData, int fontDataSize, const char* fontName) {
    MultiFontManager& manager = MultiFontManager::getInstance();
    std::string name = fontName ? fontName : "";
    
    DEBUG_LOG("Font loading started: " << name << " (size=" << formatBytes(fontDataSize) << ")");
    
    int fontId = manager.loadFont(fontData, static_cast<size_t>(fontDataSize), name);
    
    if (fontId > 0) {
        DEBUG_LOG("Font loaded successfully: " << name << " (id=" << fontId << ")");
        DEBUG_LOG_MEMORY(manager.getTotalMemoryUsage(), manager.getLoadedFontCount());
    } else {
        DEBUG_LOG("Font loading failed: " << name);
    }
    
    return fontId;
}

/**
 * @brief Unload a font and free its memory (卸载字体并释放内存)
 * @param fontId Font ID returned by loadFont
 */
EMSCRIPTEN_KEEPALIVE
void unloadFont(int fontId) {
    MultiFontManager& manager = MultiFontManager::getInstance();
    std::string fontName = manager.getFontName(fontId);
    
    DEBUG_LOG("Font unloading: " << fontName << " (id=" << fontId << ")");
    
    manager.unloadFont(fontId);
    
    DEBUG_LOG("Font unloaded: " << fontName << " (id=" << fontId << ")");
    DEBUG_LOG_MEMORY(manager.getTotalMemoryUsage(), manager.getLoadedFontCount());
}

/**
 * @brief Set the default font for fallback (设置默认回退字体)
 * @param fontId Font ID to use as default
 */
EMSCRIPTEN_KEEPALIVE
void setDefaultFont(int fontId) {
    MultiFontManager& manager = MultiFontManager::getInstance();
    manager.setDefaultFont(fontId);
}

/**
 * @brief Get list of loaded fonts as JSON (获取已加载字体列表)
 * @return JSON array of loaded fonts (caller must free with freeString)
 */
EMSCRIPTEN_KEEPALIVE
const char* getLoadedFonts() {
    MultiFontManager& manager = MultiFontManager::getInstance();
    std::string json = manager.getLoadedFontsJson();
    return allocateString(json);
}

/**
 * @brief Clear all loaded fonts (清空所有字体)
 */
EMSCRIPTEN_KEEPALIVE
void clearAllFonts() {
    MultiFontManager& manager = MultiFontManager::getInstance();
    size_t fontCount = manager.getLoadedFontCount();
    
    DEBUG_LOG("Clearing all fonts (count=" << fontCount << ")");
    
    manager.clearAllFonts();
    
    DEBUG_LOG("All fonts cleared");
    DEBUG_LOG_MEMORY(manager.getTotalMemoryUsage(), manager.getLoadedFontCount());
}

// ============================================================================
// HTML Parsing API
// ============================================================================

/**
 * @brief Parse HTML and calculate character layouts (解析 HTML 并计算字符布局)
 * @param htmlString HTML content
 * @param cssString External CSS (optional, can be NULL)
 * @param viewportWidth Viewport width in pixels
 * @param mode Output mode: "full", "simple", "flat", or "byRow"
 * @param optionsJson Additional options as JSON string (optional)
 * @return JSON string with layout data (caller must free with freeString)
 * 
 * @note Requirements: 3.1, 3.4, 3.5, 3.6, 4.1, 7.1, 7.6, 8.1, 8.2, 8.4
 */
EMSCRIPTEN_KEEPALIVE
const char* parseHTML(
    const char* htmlString,
    const char* cssString,
    int viewportWidth,
    const char* mode,
    const char* optionsJson
) {
    // Reset metrics and result
    g_lastMetrics = ParseMetrics();
    g_lastParseResult = ParseResult();
    
    DEBUG_LOG("=== Parse operation started ===");
    
    // Input validation - Requirements: 8.2, 8.4
    if (htmlString == nullptr) {
        DEBUG_LOG("Error: HTML string is null");
        g_lastParseResult = ParseResult::fail(ErrorCode::InvalidInput, "HTML string is null");
        return allocateString("[]");
    }
    
    size_t htmlLen = strlen(htmlString);
    if (htmlLen == 0) {
        DEBUG_LOG("Error: HTML string is empty");
        g_lastParseResult = ParseResult::fail(ErrorCode::EmptyHtml, "HTML string is empty");
        return allocateString("[]");
    }
    
    if (viewportWidth <= 0) {
        DEBUG_LOG("Error: Invalid viewport width: " << viewportWidth);
        g_lastParseResult = ParseResult::fail(ErrorCode::InvalidViewportWidth, 
            "Viewport width must be positive, got: " + std::to_string(viewportWidth));
        return allocateString("[]");
    }
    
    // Check for excessively large input (>10MB)
    const size_t MAX_HTML_SIZE = 10 * 1024 * 1024;
    if (htmlLen > MAX_HTML_SIZE) {
        DEBUG_LOG("Error: HTML too large: " << formatBytes(htmlLen));
        g_lastParseResult = ParseResult::fail(ErrorCode::HtmlTooLarge, 
            "HTML size exceeds maximum allowed (10MB), got: " + std::to_string(htmlLen) + " bytes");
        return allocateString("[]");
    }
    
    g_lastMetrics.inputSize = htmlLen;
    
    DEBUG_LOG("HTML parsing started (length=" << formatBytes(htmlLen) << ", viewport=" << viewportWidth << "px)");
    
    // Log CSS info if provided
    if (cssString != nullptr && strlen(cssString) > 0) {
        DEBUG_LOG("External CSS provided (length=" << formatBytes(strlen(cssString)) << ")");
    }
    
    try {
        // Start timing
        auto startTime = std::chrono::high_resolution_clock::now();
        
        // Default viewport height
        const int defaultViewportHeight = 10000;
        
        // Create container
        WasmContainer container(viewportWidth, defaultViewportHeight);
        
        // Parse HTML
        auto parseStartTime = std::chrono::high_resolution_clock::now();
        
        // Build HTML with optional external CSS
        // Use reserve to minimize string reallocations
        std::string fullHtml;
        if (cssString != nullptr && strlen(cssString) > 0) {
            size_t cssLen = strlen(cssString);
            fullHtml.reserve(htmlLen + cssLen + 20); // +20 for <style></style> tags
            fullHtml = "<style>";
            fullHtml += cssString;
            fullHtml += "</style>";
            fullHtml += htmlString;
            
            DEBUG_LOG("CSS parsing started");
        } else {
            fullHtml = htmlString;
        }
        
        litehtml::document::ptr doc = litehtml::document::createFromString(
            fullHtml.c_str(),
            &container
        );
        
        if (!doc) {
            DEBUG_LOG("Error: Failed to create document");
            g_lastParseResult = ParseResult::fail(ErrorCode::DocumentCreationFailed, 
                "Failed to create document from HTML string");
            return allocateString("[]");
        }
        
        auto parseEndTime = std::chrono::high_resolution_clock::now();
        double parseTime = std::chrono::duration<double, std::milli>(parseEndTime - parseStartTime).count();
        
        DEBUG_LOG_TIMING("HTML parsing", parseTime);
        if (cssString != nullptr && strlen(cssString) > 0) {
            DEBUG_LOG_TIMING("CSS parsing", parseTime); // CSS is parsed together with HTML
        }
        
        // Render and layout
        DEBUG_LOG("Layout calculation started (viewport=" << viewportWidth << "x" << defaultViewportHeight << ")");
        auto layoutStartTime = std::chrono::high_resolution_clock::now();
        
        doc->render(viewportWidth);
        
        // Draw to collect character layouts
        litehtml::position clip(0, 0, viewportWidth, defaultViewportHeight);
        doc->draw(0, 0, 0, &clip);
        
        auto layoutEndTime = std::chrono::high_resolution_clock::now();
        double layoutTime = std::chrono::duration<double, std::milli>(layoutEndTime - layoutStartTime).count();
        
        // Get character layouts
        const std::vector<CharLayout>& layouts = container.getCharLayouts();
        g_lastMetrics.characterCount = static_cast<int>(layouts.size());
        
        DEBUG_LOG_TIMING("Layout calculation", layoutTime);
        DEBUG_LOG("Characters extracted: " << layouts.size());
        
        // Parse output mode
        OutputMode outputMode = JsonSerializer::parseMode(mode);
        std::string modeStr = mode ? mode : "flat";
        
        // Create viewport info
        Viewport viewport;
        viewport.width = viewportWidth;
        viewport.height = defaultViewportHeight;
        
        // Serialize to JSON
        DEBUG_LOG("Serialization started (mode=" << modeStr << ")");
        auto serializeStartTime = std::chrono::high_resolution_clock::now();
        
        std::string jsonResult = JsonSerializer::serialize(layouts, outputMode, viewport);
        
        auto serializeEndTime = std::chrono::high_resolution_clock::now();
        double serializeTime = std::chrono::duration<double, std::milli>(serializeEndTime - serializeStartTime).count();
        
        DEBUG_LOG_TIMING("Serialization", serializeTime);
        DEBUG_LOG("Output size: " << formatBytes(jsonResult.length()));
        
        // Calculate timing metrics (in milliseconds)
        g_lastMetrics.parseTime = parseTime;
        g_lastMetrics.layoutTime = layoutTime;
        g_lastMetrics.serializeTime = serializeTime;
        g_lastMetrics.totalTime = std::chrono::duration<double, std::milli>(serializeEndTime - startTime).count();
        
        // Calculate characters per second
        if (g_lastMetrics.totalTime > 0) {
            g_lastMetrics.charsPerSecond = (g_lastMetrics.characterCount * 1000.0) / g_lastMetrics.totalTime;
        }
        
        // Update parse result with success
        g_lastParseResult.success = true;
        g_lastParseResult.data = jsonResult;
        g_lastParseResult.metrics.parseTime = g_lastMetrics.parseTime;
        g_lastParseResult.metrics.layoutTime = g_lastMetrics.layoutTime;
        g_lastParseResult.metrics.serializeTime = g_lastMetrics.serializeTime;
        g_lastParseResult.metrics.totalTime = g_lastMetrics.totalTime;
        g_lastParseResult.metrics.characterCount = g_lastMetrics.characterCount;
        g_lastParseResult.metrics.inputSize = g_lastMetrics.inputSize;
        g_lastParseResult.metrics.charsPerSecond = g_lastMetrics.charsPerSecond;
        g_lastParseResult.metrics.memoryUsed = MultiFontManager::getInstance().getTotalMemoryUsage();
        g_lastParseResult.metricsEnabled = true;
        
        // Add warning if no characters were extracted
        if (layouts.empty()) {
            DEBUG_LOG("Warning: No characters extracted from HTML");
            g_lastParseResult.addWarning(ErrorCode::InvalidInput, 
                "No characters were extracted from the HTML. The document may be empty or contain only non-text elements.");
        }
        
        // Check memory threshold and add warning if exceeded
        MultiFontManager& manager = MultiFontManager::getInstance();
        if (manager.checkMemoryThreshold()) {
            DEBUG_LOG("Warning: Memory usage exceeds 50MB threshold");
            g_lastParseResult.addWarning(ErrorCode::FontMemoryExceeded, 
                "Memory usage exceeds 50MB threshold. Consider unloading unused fonts.");
        }
        
        // Log memory usage
        DEBUG_LOG_MEMORY(manager.getTotalMemoryUsage(), manager.getLoadedFontCount());
        
        // Clear character layouts to release memory
        container.clearCharLayouts();
        
        DEBUG_LOG("=== Parse operation completed (total=" << formatDuration(g_lastMetrics.totalTime) 
                  << ", chars=" << g_lastMetrics.characterCount 
                  << ", speed=" << static_cast<int>(g_lastMetrics.charsPerSecond) << " chars/sec) ===");
        
        return allocateString(jsonResult);
        
    } catch (const std::exception& e) {
        DEBUG_LOG("Error: Exception during parsing: " << e.what());
        g_lastParseResult = ParseResult::fail(ErrorCode::InternalError, 
            std::string("Exception during parsing: ") + e.what());
        return allocateString("[]");
    } catch (...) {
        DEBUG_LOG("Error: Unknown exception during parsing");
        g_lastParseResult = ParseResult::fail(ErrorCode::UnknownError, 
            "Unknown exception occurred during parsing");
        return allocateString("[]");
    }
}

/**
 * @brief Parse HTML and return result with diagnostics (解析并返回诊断结果)
 * @param htmlString HTML content
 * @param cssString External CSS (optional, can be NULL)
 * @param viewportWidth Viewport width in pixels
 * @param mode Output mode: "full", "simple", "flat", or "byRow"
 * @param optionsJson Additional options as JSON string (optional)
 * @return JSON string with ParseResult structure (caller must free with freeString)
 * 
 * This function returns a structured result including:
 * - success: boolean indicating if parsing succeeded
 * - data: parsed layout data (if successful)
 * - errors: array of errors (if any)
 * - warnings: array of warnings (if any)
 * - metrics: performance metrics
 * 
 * @note Requirements: 8.1, 8.2, 8.4, 8.5
 */
EMSCRIPTEN_KEEPALIVE
const char* parseHTMLWithDiagnostics(
    const char* htmlString,
    const char* cssString,
    int viewportWidth,
    const char* mode,
    const char* optionsJson
) {
    // Call the regular parseHTML to do the actual work
    const char* result = parseHTML(htmlString, cssString, viewportWidth, mode, optionsJson);
    
    // Free the result since we'll return a different format
    if (result) {
        free(const_cast<char*>(result));
    }
    
    // Return the structured result
    return allocateString(serializeParseResult(g_lastParseResult));
}

/**
 * @brief Get the last parse result with diagnostics (获取最近解析结果)
 * @return JSON string with ParseResult structure (caller must free with freeString)
 * 
 * @note Requirements: 8.1, 8.2, 8.4, 8.5
 */
EMSCRIPTEN_KEEPALIVE
const char* getLastParseResult() {
    return allocateString(serializeParseResult(g_lastParseResult));
}

// ============================================================================
// Memory Management API
// ============================================================================

/**
 * @brief Free a string returned by the API (释放返回的字符串)
 * @param str String pointer to free
 * 
 * ⚠️ MANDATORY: All strings returned by the API must be freed using this function.
 * Failure to call freeString will result in memory leaks.
 * 
 * @note Requirements: 9.1
 */
EMSCRIPTEN_KEEPALIVE
void freeString(const char* str) {
    if (str != nullptr) {
        free(const_cast<char*>(str));
    }
}

/**
 * @brief Destroy the parser and release all resources (销毁并释放资源)
 * 
 * This function performs complete cleanup:
 * - Clears all loaded fonts
 * - Releases FreeType resources
 * - Resets all internal state
 * 
 * ⚠️ MANDATORY: Call this function when the parser is no longer needed
 * to ensure all resources are properly released.
 * 
 * @note Requirements: 9.4, 9.5
 */
EMSCRIPTEN_KEEPALIVE
void destroy() {
    DEBUG_LOG("Destroying parser and releasing all resources");
    
    // Clear all fonts (releases FreeType resources)
    MultiFontManager& manager = MultiFontManager::getInstance();
    manager.clearAllFonts();
    
    // Reset metrics
    g_lastMetrics = ParseMetrics();
    g_lastParseResult = ParseResult();
    
    // Reset debug mode
    g_isDebug = false;
    
    DEBUG_LOG("Parser destroyed");
}

/**
 * @brief Get total memory usage in bytes (获取总内存占用)
 * @return Total memory usage including fonts and internal buffers
 * 
 * @note Requirements: 9.7, 9.9
 */
EMSCRIPTEN_KEEPALIVE
size_t getTotalMemoryUsage() {
    MultiFontManager& manager = MultiFontManager::getInstance();
    return manager.getTotalMemoryUsage();
}

/**
 * @brief Check if memory usage exceeds the threshold (50MB) (检查内存阈值)
 * @return true if memory exceeds threshold
 * 
 * @note Requirements: 9.10
 */
EMSCRIPTEN_KEEPALIVE
bool checkMemoryThreshold() {
    MultiFontManager& manager = MultiFontManager::getInstance();
    return manager.checkMemoryThreshold();
}

/**
 * @brief Get memory metrics as JSON (获取内存指标 JSON)
 * @return JSON string with detailed memory information (caller must free with freeString)
 * 
 * @note Requirements: 9.7, 9.9, 9.10
 */
EMSCRIPTEN_KEEPALIVE
const char* getMemoryMetrics() {
    MultiFontManager& manager = MultiFontManager::getInstance();
    std::string json = manager.getMemoryMetricsJson();
    return allocateString(json);
}

// ============================================================================
// Utility API
// ============================================================================

/**
 * @brief Get parser version (获取版本号)
 * @return Version string (caller must free with freeString)
 */
EMSCRIPTEN_KEEPALIVE
const char* getVersion() {
    const char* version = "2.0.0";
    char* result = static_cast<char*>(malloc(strlen(version) + 1));
    if (result) {
        strcpy(result, version);
    }
    return result;
}

/**
 * @brief Get performance metrics as JSON (获取性能指标 JSON)
 * @return JSON string with metrics (caller must free with freeString)
 * 
 * Returns metrics from the last parseHTML call including:
 * - parseTime: HTML parsing time (ms)
 * - layoutTime: Layout calculation time (ms)
 * - serializeTime: JSON serialization time (ms)
 * - totalTime: Total processing time (ms)
 * - characterCount: Number of characters processed
 * - inputSize: Input HTML size (bytes)
 * - charsPerSecond: Processing speed (chars/sec)
 * - memory: Memory usage information
 * 
 * @note Requirements: 8.5, 7.6
 */
EMSCRIPTEN_KEEPALIVE
const char* getMetrics() {
    MultiFontManager& manager = MultiFontManager::getInstance();
    
    std::ostringstream oss;
    oss << "{";
    
    // Performance metrics from last parse
    oss << "\"parseTime\":" << g_lastMetrics.parseTime << ",";
    oss << "\"layoutTime\":" << g_lastMetrics.layoutTime << ",";
    oss << "\"serializeTime\":" << g_lastMetrics.serializeTime << ",";
    oss << "\"totalTime\":" << g_lastMetrics.totalTime << ",";
    oss << "\"characterCount\":" << g_lastMetrics.characterCount << ",";
    oss << "\"inputSize\":" << g_lastMetrics.inputSize << ",";
    oss << "\"charsPerSecond\":" << g_lastMetrics.charsPerSecond << ",";
    
    // Memory metrics
    oss << "\"memory\":{";
    oss << "\"totalFontMemory\":" << manager.getTotalMemoryUsage() << ",";
    oss << "\"fontCount\":" << manager.getLoadedFontCount() << ",";
    oss << "\"exceedsThreshold\":" << (manager.checkMemoryThreshold() ? "true" : "false");
    oss << "}";
    
    oss << "}";
    
    return allocateString(oss.str());
}

/**
 * @brief Get detailed performance metrics as JSON (获取详细性能指标 JSON)
 * @return JSON string with detailed metrics (caller must free with freeString)
 * 
 * Returns detailed metrics including:
 * - All metrics from getMetrics()
 * - Additional breakdown of timing
 * - Memory usage details per font
 * 
 * @note Requirements: 8.5, 7.6
 */
EMSCRIPTEN_KEEPALIVE
const char* getDetailedMetrics() {
    MultiFontManager& manager = MultiFontManager::getInstance();
    FontMetricsCache& cache = FontMetricsCache::getInstance();
    
    // Get cache statistics
    size_t cacheHits, cacheMisses, cacheEntries;
    cache.getStats(cacheHits, cacheMisses, cacheEntries);
    
    std::ostringstream oss;
    oss << "{";
    
    // Performance metrics from last parse
    oss << "\"performance\":{";
    oss << "\"parseTime\":" << g_lastMetrics.parseTime << ",";
    oss << "\"layoutTime\":" << g_lastMetrics.layoutTime << ",";
    oss << "\"serializeTime\":" << g_lastMetrics.serializeTime << ",";
    oss << "\"totalTime\":" << g_lastMetrics.totalTime << ",";
    oss << "\"characterCount\":" << g_lastMetrics.characterCount << ",";
    oss << "\"inputSize\":" << g_lastMetrics.inputSize << ",";
    oss << "\"charsPerSecond\":" << g_lastMetrics.charsPerSecond;
    oss << "},";
    
    // Memory metrics
    oss << "\"memory\":{";
    oss << "\"totalFontMemory\":" << manager.getTotalMemoryUsage() << ",";
    oss << "\"fontCount\":" << manager.getLoadedFontCount() << ",";
    oss << "\"exceedsThreshold\":" << (manager.checkMemoryThreshold() ? "true" : "false") << ",";
    oss << "\"threshold\":" << (50 * 1024 * 1024);  // 50MB threshold
    oss << "},";
    
    // Cache metrics
    oss << "\"cache\":{";
    oss << "\"hits\":" << cacheHits << ",";
    oss << "\"misses\":" << cacheMisses << ",";
    oss << "\"entries\":" << cacheEntries << ",";
    float hitRate = cache.getHitRate();
    if (hitRate >= 0) {
        oss << "\"hitRate\":" << hitRate << ",";
    } else {
        oss << "\"hitRate\":null,";
    }
    oss << "\"memoryUsage\":" << cache.getMemoryUsage();
    oss << "},";
    
    // Last parse result status
    oss << "\"lastParseStatus\":{";
    oss << "\"success\":" << (g_lastParseResult.success ? "true" : "false") << ",";
    oss << "\"errorCount\":" << g_lastParseResult.errors.size() << ",";
    oss << "\"warningCount\":" << g_lastParseResult.warnings.size();
    oss << "}";
    
    oss << "}";
    
    return allocateString(oss.str());
}

// ============================================================================
// Cache Management API
// ============================================================================

/**
 * @brief Get font metrics cache statistics (获取字体度量缓存统计)
 * @return JSON string with cache statistics (caller must free with freeString)
 * 
 * Returns:
 * - hits: number of cache hits
 * - misses: number of cache misses
 * - entries: total cached entries
 * - hitRate: cache hit rate (0.0-1.0, null if no queries)
 * - memoryUsage: estimated memory usage in bytes
 * 
 * @note Requirements: 7.7, 7.8
 */
EMSCRIPTEN_KEEPALIVE
const char* getCacheStats() {
    FontMetricsCache& cache = FontMetricsCache::getInstance();
    
    size_t hits, misses, entries;
    cache.getStats(hits, misses, entries);
    float hitRate = cache.getHitRate();
    
    std::ostringstream oss;
    oss << "{";
    oss << "\"hits\":" << hits << ",";
    oss << "\"misses\":" << misses << ",";
    oss << "\"entries\":" << entries << ",";
    if (hitRate >= 0) {
        oss << "\"hitRate\":" << hitRate << ",";
    } else {
        oss << "\"hitRate\":null,";
    }
    oss << "\"memoryUsage\":" << cache.getMemoryUsage();
    oss << "}";
    
    return allocateString(oss.str());
}

/**
 * @brief Reset cache statistics counters (重置缓存统计计数器)
 * 
 * Resets hits and misses counters to 0 without clearing the cache.
 * Useful for measuring cache performance over specific operations.
 * 
 * @note Requirements: 7.7, 7.8
 */
EMSCRIPTEN_KEEPALIVE
void resetCacheStats() {
    FontMetricsCache::getInstance().resetStats();
    DEBUG_LOG("Cache statistics reset");
}

/**
 * @brief Clear all font metrics caches (清除所有字体度量缓存)
 * 
 * Clears all cached character width data. This is automatically
 * called when fonts are unloaded, but can be called manually
 * to free memory.
 * 
 * @note Requirements: 7.7, 7.8
 */
EMSCRIPTEN_KEEPALIVE
void clearCache() {
    FontMetricsCache::getInstance().clearAll();
    DEBUG_LOG("Font metrics cache cleared");
}

} // extern "C"
