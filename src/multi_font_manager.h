/**
 * @file multi_font_manager.h
 * @brief Multi-Font Manager for HTML Layout Parser v2.0
 * 
 * This module provides:
 * - Multiple font loading with unique Font IDs
 * - Font unloading with immediate memory release
 * - Font fallback chain support
 * - Memory usage tracking and monitoring
 * - Thread-safe font reuse for parallel parsing
 * 
 * @note Requirements: 1.1, 1.2, 1.3, 1.6, 1.8, 1.9, 9.2, 9.3, 9.8
 */

#ifndef WASM_V2_MULTI_FONT_MANAGER_H
#define WASM_V2_MULTI_FONT_MANAGER_H

#include <cstdint>
#include <cstddef>
#include <vector>
#include <string>
#include <map>

// FreeType headers
#include <ft2build.h>
#include FT_FREETYPE_H

namespace wasm_litehtml_v2 {

/**
 * @brief Font metrics information structure (字体度量信息结构)
 */
struct FontMetrics {
    int ascent;      // Distance from baseline to top (基线到顶部距离)
    int descent;     // Distance from baseline to bottom (基线到底部距离)
    int height;      // Total font height (字体总高度)
    int x_height;    // Height of lowercase 'x' (小写 x 高度)
    int ch_width;    // Width of character '0' (字符 '0' 宽度)
};

/**
 * @brief Font entry structure for internal storage (内部字体条目)
 */
struct FontEntry {
    int id;                         // Unique font ID (字体唯一 ID)
    std::string name;               // Font name (字体名称)
    FT_Face face;                   // FreeType face handle (FreeType 字体句柄)
    std::vector<uint8_t> data;      // Font binary data (FreeType 依赖的字体数据)
    size_t memoryUsage;             // Tracked memory usage in bytes (内存占用字节数)
    int currentSize;                // Current set font size (当前缓存字号)
};

/**
 * @brief Font instance for tracking created font handles (字体实例句柄记录)
 */
struct FontInstance {
    int fontId;     // Reference to loaded font (关联字体 ID)
    int fontSize;   // Font size in pixels (字号像素)
    bool bold;      // Bold flag (粗体标记)
    bool italic;    // Italic flag (斜体标记)
};

/**
 * @brief Multi-Font Manager class (多字体管理器)
 * 
 * Manages multiple fonts with FreeType, providing:
 * - Dynamic font loading/unloading with unique IDs
 * - Font fallback chain support
 * - Strict memory management with immediate resource release
 * - Memory usage tracking and warnings
 * 
 * Design principles:
 * - Load once, use many times (font reuse)
 * - Immediate memory release on unload
 * - Support for parallel parsing with shared fonts
 */
class MultiFontManager {
public:
    /**
     * @brief Get singleton instance (获取单例实例)
     * @return MultiFontManager& Reference to the singleton
     */
    static MultiFontManager& getInstance();

    /**
     * @brief Load a font from binary data (加载字体二进制数据)
     * 
     * @param data Font binary data (TTF/OTF)
     * @param size Size of font data in bytes
     * @param name Font name for identification
     * @return int Font ID (positive) on success, 0 on failure
     * 
     * @note Font data is copied internally; caller can free original data
     * @note Font can be reused for multiple parse operations
     */
    int loadFont(const uint8_t* data, size_t size, const std::string& name);

    /**
     * @brief Unload a font and immediately release all resources (卸载字体并立即释放资源)
     * 
     * ⚠️ MANDATORY: This function MUST:
     * - Call FT_Done_Face() to release FreeType resources
     * - Clear font data vector and call shrink_to_fit()
     * - Remove font from internal map
     * 
     * @param fontId Font ID to unload
     */
    void unloadFont(int fontId);

    /**
     * @brief Set the default font for fallback (设置默认回退字体)
     * @param fontId Font ID to use as default
     */
    void setDefaultFont(int fontId);

    /**
     * @brief Get the default font ID (获取默认字体 ID)
     * @return int Default font ID, 0 if not set
     */
    int getDefaultFontId() const;

    /**
     * @brief Get list of loaded fonts as JSON (获取已加载字体列表 JSON)
     * @return std::string JSON array of font info
     */
    std::string getLoadedFontsJson() const;

    /**
     * @brief Clear all loaded fonts and release all resources (清空所有字体并释放资源)
     * 
     * ⚠️ MANDATORY: This function MUST release all FreeType resources
     */
    void clearAllFonts();

    /**
     * @brief Check if a font is loaded (检查字体是否已加载)
     * @param fontId Font ID to check
     * @return bool True if font is loaded
     */
    bool isFontLoaded(int fontId) const;

    /**
     * @brief Get font name by ID (通过 ID 获取字体名称)
     * @param fontId Font ID
     * @return std::string Font name, empty if not found
     */
    std::string getFontName(int fontId) const;

    /**
     * @brief Get number of loaded fonts (获取已加载字体数量)
     * @return size_t Number of loaded fonts
     */
    size_t getLoadedFontCount() const;

    // ========================================================================
    // Font Fallback Support
    // ========================================================================

    /**
     * @brief Find font by name from loaded fonts (按名称查找字体)
     * @param fontName Font name to search
     * @return int Font ID if found, 0 if not found
     */
    int findFontByName(const std::string& fontName) const;

    /**
     * @brief Resolve font-family string to font ID with fallback (解析 font-family 并回退)
     * 
     * Parses font-family like "Arial, Helvetica, sans-serif" and
     * returns the first available font ID, or default font.
     * 
     * @param fontFamily CSS font-family string
     * @return int Resolved font ID
     */
    int resolveFontFamily(const std::string& fontFamily) const;

    // ========================================================================
    // Font Metrics and Text Measurement
    // ========================================================================

    /**
     * @brief Get font metrics for a specific font and size (获取字体度量信息)
     * @param fontId Font ID
     * @param fontSize Font size in pixels
     * @param metrics Output metrics structure
     * @return bool True on success
     */
    bool getFontMetrics(int fontId, int fontSize, FontMetrics& metrics);

    /**
     * @brief Calculate character width (计算字符宽度)
     * @param fontId Font ID
     * @param codepoint Unicode codepoint
     * @param fontSize Font size in pixels
     * @return int Character width in pixels
     */
    int getCharWidth(int fontId, uint32_t codepoint, int fontSize);

    /**
     * @brief Calculate text width (计算文本宽度)
     * @param fontId Font ID
     * @param text UTF-8 encoded text
     * @param fontSize Font size in pixels
     * @return int Text width in pixels
     */
    int getTextWidth(int fontId, const char* text, int fontSize);

    // ========================================================================
    // Font Handle Management (for litehtml integration)
    // ========================================================================

    /**
     * @brief Create a font instance handle (创建字体实例句柄)
     * @param fontId Font ID
     * @param fontSize Font size in pixels
     * @param bold Bold flag
     * @param italic Italic flag
     * @return uint64_t Font handle, 0 on failure
     */
    uint64_t createFontHandle(int fontId, int fontSize, bool bold, bool italic);

    /**
     * @brief Delete a font instance handle (删除字体实例句柄)
     * @param handle Font handle to delete
     */
    void deleteFontHandle(uint64_t handle);

    /**
     * @brief Get font instance info from handle (通过句柄获取字体实例信息)
     * @param handle Font handle
     * @return const FontInstance* Pointer to instance, nullptr if not found
     */
    const FontInstance* getFontInstance(uint64_t handle) const;

    // ========================================================================
    // Memory Management
    // ========================================================================

    /**
     * @brief Get total memory usage of all loaded fonts (获取字体总内存占用)
     * @return size_t Total memory usage in bytes
     */
    size_t getTotalMemoryUsage() const;

    /**
     * @brief Get memory usage of a specific font (获取单个字体内存占用)
     * @param fontId Font ID
     * @return size_t Memory usage in bytes, 0 if not found
     */
    size_t getFontMemoryUsage(int fontId) const;

    /**
     * @brief Check if memory usage exceeds threshold and log warning (检查内存阈值)
     * @param threshold Memory threshold in bytes (default 50MB)
     * @return bool True if memory exceeds threshold
     */
    bool checkMemoryThreshold(size_t threshold = 50 * 1024 * 1024) const;

    /**
     * @brief Get memory metrics as JSON (获取内存指标 JSON)
     * @return std::string JSON object with memory info
     */
    std::string getMemoryMetricsJson() const;

    // Disable copy and assignment
    MultiFontManager(const MultiFontManager&) = delete;
    MultiFontManager& operator=(const MultiFontManager&) = delete;

private:
    MultiFontManager();
    ~MultiFontManager();

    /**
     * @brief Set font size for a specific font (设置字体大小)
     * @param fontId Font ID
     * @param fontSize Font size in pixels
     * @return bool True on success
     */
    bool setFontSize(int fontId, int fontSize);

    /**
     * @brief Decode next UTF-8 codepoint from string (解码下一个 UTF-8 码点)
     * @param text Input text pointer (updated to next char)
     * @return uint32_t Unicode codepoint
     */
    static uint32_t decodeUtf8(const char*& text);

    /**
     * @brief Parse font-family string into individual font names (解析字体族列表)
     * @param fontFamily CSS font-family string
     * @return std::vector<std::string> List of font names
     */
    static std::vector<std::string> parseFontFamily(const std::string& fontFamily);

    /**
     * @brief Normalize font name for comparison (规范化字体名称用于比较)
     * @param name Font name
     * @return std::string Normalized name (lowercase, trimmed)
     */
    static std::string normalizeFontName(const std::string& name);

private:
    FT_Library m_library;                           // FreeType library instance (FreeType 库实例)
    std::map<int, FontEntry> m_fonts;               // Loaded fonts by ID (已加载字体表)
    int m_nextFontId;                               // Next font ID to assign (下一个字体 ID)
    int m_defaultFontId;                            // Default font ID for fallback (默认回退字体 ID)
    
    // Font handle management
    std::map<uint64_t, FontInstance> m_fontInstances; // Font handle -> instance (字体句柄映射)
    uint64_t m_nextFontHandle;                        // Next handle value (下一个句柄值)
    
    // Memory warning flag (to avoid repeated warnings)
    mutable bool m_memoryWarningIssued;            // Warning flag to avoid repeats (内存警告标记)
};

} // namespace wasm_litehtml_v2

#endif // WASM_V2_MULTI_FONT_MANAGER_H
