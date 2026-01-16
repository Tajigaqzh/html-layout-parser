/**
 * @file multi_font_manager.cpp
 * @brief Multi-Font Manager implementation for HTML Layout Parser v2.0
 * 
 * @note Requirements: 1.1, 1.2, 1.3, 1.6, 1.8, 1.9, 9.2, 9.3, 9.8
 */

#include "multi_font_manager.h"
#include "font_metrics_cache.h"
#include <cstring>
#include <algorithm>
#include <cctype>
#include <sstream>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

namespace wasm_litehtml_v2 {

// Memory threshold for warning (50MB, 内存告警阈值)
static const size_t MEMORY_WARNING_THRESHOLD = 50 * 1024 * 1024;

MultiFontManager& MultiFontManager::getInstance() {
    static MultiFontManager instance;
    return instance;
}

MultiFontManager::MultiFontManager()
    : m_library(nullptr)
    , m_nextFontId(1)
    , m_defaultFontId(0)
    , m_nextFontHandle(1)
    , m_memoryWarningIssued(false)
{
    // Initialize FreeType library (初始化 FreeType)
    FT_Error error = FT_Init_FreeType(&m_library);
    if (error) {
        m_library = nullptr;
    }
}

MultiFontManager::~MultiFontManager() {
    // Clear all fonts first (releases FT_Face resources, 先释放字体资源)
    clearAllFonts();
    
    // Then release FreeType library (释放 FreeType 库)
    if (m_library) {
        FT_Done_FreeType(m_library);
        m_library = nullptr;
    }
}

int MultiFontManager::loadFont(const uint8_t* data, size_t size, const std::string& name) {
    // Parameter validation (参数校验)
    if (data == nullptr || size == 0 || !m_library) {
        return 0;
    }

    // Create new font entry (创建字体条目)
    FontEntry entry;
    entry.id = m_nextFontId;
    entry.name = name;
    entry.face = nullptr;
    entry.currentSize = 0;
    entry.memoryUsage = 0;

    // Copy font data (FreeType requires data to remain valid, 拷贝字体数据)
    try {
        entry.data.assign(data, data + size);
        entry.memoryUsage = size;
    } catch (...) {
        return 0;
    }

    // Load font face from memory (从内存加载字体)
    FT_Error error = FT_New_Memory_Face(
        m_library,
        entry.data.data(),
        static_cast<FT_Long>(entry.data.size()),
        0,  // face_index: use first face
        &entry.face
    );

    if (error || !entry.face) {
        // Failed to load - clean up
        entry.data.clear();
        entry.data.shrink_to_fit();
        return 0;
    }

    // Set Unicode charmap (设置 Unicode 字符映射表)
    FT_Select_Charmap(entry.face, FT_ENCODING_UNICODE);

    // Update font name from face if available (补全字体名称)
    if (entry.face->family_name && entry.name.empty()) {
        entry.name = entry.face->family_name;
    }

    // Store font entry (保存字体条目)
    int fontId = m_nextFontId++;
    entry.id = fontId;
    m_fonts[fontId] = std::move(entry);

    // Set as default if this is the first font (首个字体设为默认)
    if (m_defaultFontId == 0) {
        m_defaultFontId = fontId;
    }

    // Check memory threshold (检查内存阈值)
    checkMemoryThreshold();

    return fontId;
}

void MultiFontManager::unloadFont(int fontId) {
    auto it = m_fonts.find(fontId);
    if (it == m_fonts.end()) {
        return;
    }

    // ⚠️ Clear font metrics cache for this font
    FontMetricsCache::getInstance().clearFont(fontId);

    // ⚠️ MANDATORY: Release FreeType face resource
    if (it->second.face) {
        FT_Done_Face(it->second.face);
        it->second.face = nullptr;
    }

    // ⚠️ MANDATORY: Clear font data and release vector memory
    it->second.data.clear();
    it->second.data.shrink_to_fit();

    // Remove from map (从表中移除)
    m_fonts.erase(it);

    // Update default font if needed (更新默认字体)
    if (m_defaultFontId == fontId) {
        if (!m_fonts.empty()) {
            m_defaultFontId = m_fonts.begin()->first;
        } else {
            m_defaultFontId = 0;
        }
    }

    // Remove any font handles referencing this font (清理相关字体句柄)
    for (auto handleIt = m_fontInstances.begin(); handleIt != m_fontInstances.end(); ) {
        if (handleIt->second.fontId == fontId) {
            handleIt = m_fontInstances.erase(handleIt);
        } else {
            ++handleIt;
        }
    }

    // Reset memory warning flag (memory freed, 重置内存告警标记)
    m_memoryWarningIssued = false;
}

void MultiFontManager::setDefaultFont(int fontId) {
    if (m_fonts.find(fontId) != m_fonts.end()) {
        m_defaultFontId = fontId;
    }
}

int MultiFontManager::getDefaultFontId() const {
    return m_defaultFontId;
}

std::string MultiFontManager::getLoadedFontsJson() const {
    std::ostringstream oss;
    oss << "[";
    
    bool first = true;
    for (const auto& pair : m_fonts) {
        if (!first) {
            oss << ",";
        }
        first = false;
        
        oss << "{";
        oss << "\"id\":" << pair.second.id << ",";
        oss << "\"name\":\"" << pair.second.name << "\",";
        oss << "\"memoryUsage\":" << pair.second.memoryUsage << ",";
        oss << "\"isDefault\":" << (pair.second.id == m_defaultFontId ? "true" : "false");
        oss << "}";
    }
    
    oss << "]";
    return oss.str();
}

void MultiFontManager::clearAllFonts() {
    // ⚠️ Clear all font metrics caches
    FontMetricsCache::getInstance().clearAll();

    // ⚠️ MANDATORY: Release all FreeType resources (释放 FreeType 资源)
    for (auto& pair : m_fonts) {
        if (pair.second.face) {
            FT_Done_Face(pair.second.face);
            pair.second.face = nullptr;
        }
        
        // Clear and release vector memory
        pair.second.data.clear();
        pair.second.data.shrink_to_fit();
    }
    
    // Clear the map
    m_fonts.clear();
    
    // Clear font handles
    m_fontInstances.clear();
    
    // Reset state
    m_defaultFontId = 0;
    m_memoryWarningIssued = false;
}

bool MultiFontManager::isFontLoaded(int fontId) const {
    return m_fonts.find(fontId) != m_fonts.end();
}

std::string MultiFontManager::getFontName(int fontId) const {
    auto it = m_fonts.find(fontId);
    if (it != m_fonts.end()) {
        return it->second.name;
    }
    return "";
}

size_t MultiFontManager::getLoadedFontCount() const {
    return m_fonts.size();
}

// ============================================================================
// Font Fallback Support
// ============================================================================

int MultiFontManager::findFontByName(const std::string& fontName) const {
    std::string normalizedSearch = normalizeFontName(fontName);
    
    for (const auto& pair : m_fonts) {
        std::string normalizedFont = normalizeFontName(pair.second.name);
        if (normalizedFont == normalizedSearch) {
            return pair.second.id;
        }
    }
    
    return 0;
}

int MultiFontManager::resolveFontFamily(const std::string& fontFamily) const {
    // Parse font-family into individual names
    std::vector<std::string> fontNames = parseFontFamily(fontFamily);
    
    // Try each font in order
    for (const auto& name : fontNames) {
        int fontId = findFontByName(name);
        if (fontId != 0) {
            return fontId;
        }
    }
    
    // Fall back to default font
    return m_defaultFontId;
}

std::vector<std::string> MultiFontManager::parseFontFamily(const std::string& fontFamily) {
    std::vector<std::string> result;
    std::string current;
    bool inQuotes = false;
    char quoteChar = 0;
    
    for (size_t i = 0; i < fontFamily.length(); ++i) {
        char c = fontFamily[i];
        
        if (!inQuotes && (c == '"' || c == '\'')) {
            inQuotes = true;
            quoteChar = c;
        } else if (inQuotes && c == quoteChar) {
            inQuotes = false;
            quoteChar = 0;
        } else if (!inQuotes && c == ',') {
            // End of font name
            std::string trimmed = normalizeFontName(current);
            if (!trimmed.empty()) {
                result.push_back(trimmed);
            }
            current.clear();
        } else {
            current += c;
        }
    }
    
    // Add last font name
    std::string trimmed = normalizeFontName(current);
    if (!trimmed.empty()) {
        result.push_back(trimmed);
    }
    
    return result;
}

std::string MultiFontManager::normalizeFontName(const std::string& name) {
    std::string result;
    result.reserve(name.length());
    
    // Trim leading whitespace
    size_t start = 0;
    while (start < name.length() && std::isspace(static_cast<unsigned char>(name[start]))) {
        ++start;
    }
    
    // Trim trailing whitespace
    size_t end = name.length();
    while (end > start && std::isspace(static_cast<unsigned char>(name[end - 1]))) {
        --end;
    }
    
    // Convert to lowercase
    for (size_t i = start; i < end; ++i) {
        result += static_cast<char>(std::tolower(static_cast<unsigned char>(name[i])));
    }
    
    return result;
}

// ============================================================================
// Font Metrics and Text Measurement
// ============================================================================

bool MultiFontManager::setFontSize(int fontId, int fontSize) {
    auto it = m_fonts.find(fontId);
    if (it == m_fonts.end() || !it->second.face) {
        return false;
    }
    
    // Skip if already set to this size
    if (it->second.currentSize == fontSize) {
        return true;
    }
    
    FT_Error error = FT_Set_Pixel_Sizes(it->second.face, 0, fontSize);
    if (error) {
        return false;
    }
    
    it->second.currentSize = fontSize;
    return true;
}

bool MultiFontManager::getFontMetrics(int fontId, int fontSize, FontMetrics& metrics) {
    // Default values
    metrics.ascent = fontSize;
    metrics.descent = fontSize / 4;
    metrics.height = fontSize + fontSize / 4;
    metrics.x_height = fontSize * 2 / 3;
    metrics.ch_width = fontSize / 2;
    
    auto it = m_fonts.find(fontId);
    if (it == m_fonts.end() || !it->second.face) {
        return false;
    }
    
    if (!setFontSize(fontId, fontSize)) {
        return false;
    }
    
    FT_Face face = it->second.face;
    
    // Get metrics from face
    if (face->size && face->size->metrics.height) {
        metrics.ascent = static_cast<int>(face->size->metrics.ascender >> 6);
        metrics.descent = static_cast<int>(std::abs(face->size->metrics.descender >> 6));
        metrics.height = static_cast<int>(face->size->metrics.height >> 6);
    }
    
    // Calculate x_height
    FT_UInt xIndex = FT_Get_Char_Index(face, 'x');
    if (xIndex != 0) {
        FT_Error error = FT_Load_Glyph(face, xIndex, FT_LOAD_DEFAULT);
        if (!error) {
            metrics.x_height = static_cast<int>(face->glyph->metrics.height >> 6);
        }
    }
    
    // Calculate ch_width (width of '0')
    FT_UInt zeroIndex = FT_Get_Char_Index(face, '0');
    if (zeroIndex != 0) {
        FT_Error error = FT_Load_Glyph(face, zeroIndex, FT_LOAD_DEFAULT);
        if (!error) {
            metrics.ch_width = static_cast<int>(face->glyph->advance.x >> 6);
        }
    }
    
    return true;
}

int MultiFontManager::getCharWidth(int fontId, uint32_t codepoint, int fontSize) {
    // Check cache first (先检查缓存)
    FontMetricsCache& cache = FontMetricsCache::getInstance();
    int cachedWidth = cache.getCharWidth(fontId, fontSize, codepoint);
    if (cachedWidth >= 0) {
        return cachedWidth;  // Cache hit
    }

    auto it = m_fonts.find(fontId);
    if (it == m_fonts.end() || !it->second.face) {
        return fontSize / 2;  // Default width
    }
    
    if (!setFontSize(fontId, fontSize)) {
        return fontSize / 2;
    }
    
    FT_Face face = it->second.face;
    
    // Get glyph index
    FT_UInt glyphIndex = FT_Get_Char_Index(face, codepoint);
    if (glyphIndex == 0) {
        // Character not found, use space width
        glyphIndex = FT_Get_Char_Index(face, ' ');
        if (glyphIndex == 0) {
            return fontSize / 2;
        }
    }
    
    // Load glyph
    FT_Error error = FT_Load_Glyph(face, glyphIndex, FT_LOAD_DEFAULT);
    if (error) {
        return fontSize / 2;
    }
    
    int width = static_cast<int>(face->glyph->advance.x >> 6);
    
    // Store in cache (存入缓存)
    cache.setCharWidth(fontId, fontSize, codepoint, width);
    
    return width;
}

uint32_t MultiFontManager::decodeUtf8(const char*& text) {
    if (text == nullptr || *text == '\0') {
        return 0;
    }

    const uint8_t* p = reinterpret_cast<const uint8_t*>(text);
    uint32_t codepoint = 0;
    int bytes = 0;

    if ((*p & 0x80) == 0) {
        // ASCII (0xxxxxxx)
        codepoint = *p;
        bytes = 1;
    } else if ((*p & 0xE0) == 0xC0) {
        // 2 bytes (110xxxxx 10xxxxxx)
        codepoint = *p & 0x1F;
        bytes = 2;
    } else if ((*p & 0xF0) == 0xE0) {
        // 3 bytes (1110xxxx 10xxxxxx 10xxxxxx)
        codepoint = *p & 0x0F;
        bytes = 3;
    } else if ((*p & 0xF8) == 0xF0) {
        // 4 bytes (11110xxx 10xxxxxx 10xxxxxx 10xxxxxx)
        codepoint = *p & 0x07;
        bytes = 4;
    } else {
        // Invalid UTF-8 sequence
        text++;
        return 0xFFFD; // Replacement character
    }

    // Read continuation bytes
    for (int i = 1; i < bytes; i++) {
        if ((p[i] & 0xC0) != 0x80) {
            // Invalid continuation byte
            text++;
            return 0xFFFD;
        }
        codepoint = (codepoint << 6) | (p[i] & 0x3F);
    }

    text += bytes;
    return codepoint;
}

int MultiFontManager::getTextWidth(int fontId, const char* text, int fontSize) {
    if (text == nullptr) {
        return 0;
    }
    
    int totalWidth = 0;
    const char* p = text;
    
    while (*p) {
        uint32_t codepoint = decodeUtf8(p);
        if (codepoint != 0) {
            totalWidth += getCharWidth(fontId, codepoint, fontSize);
        }
    }
    
    return totalWidth;
}

// ============================================================================
// Font Handle Management
// ============================================================================

uint64_t MultiFontManager::createFontHandle(int fontId, int fontSize, bool bold, bool italic) {
    if (!isFontLoaded(fontId)) {
        // Try default font
        if (m_defaultFontId != 0 && isFontLoaded(m_defaultFontId)) {
            fontId = m_defaultFontId;
        } else {
            return 0;
        }
    }
    
    uint64_t handle = m_nextFontHandle++;
    m_fontInstances[handle] = {fontId, fontSize, bold, italic};
    return handle;
}

void MultiFontManager::deleteFontHandle(uint64_t handle) {
    m_fontInstances.erase(handle);
}

const FontInstance* MultiFontManager::getFontInstance(uint64_t handle) const {
    auto it = m_fontInstances.find(handle);
    if (it != m_fontInstances.end()) {
        return &it->second;
    }
    return nullptr;
}

// ============================================================================
// Memory Management
// ============================================================================

size_t MultiFontManager::getTotalMemoryUsage() const {
    size_t total = 0;
    for (const auto& pair : m_fonts) {
        total += pair.second.memoryUsage;
    }
    return total;
}

size_t MultiFontManager::getFontMemoryUsage(int fontId) const {
    auto it = m_fonts.find(fontId);
    if (it != m_fonts.end()) {
        return it->second.memoryUsage;
    }
    return 0;
}

bool MultiFontManager::checkMemoryThreshold(size_t threshold) const {
    size_t totalMemory = getTotalMemoryUsage();
    
    if (totalMemory > threshold) {
        if (!m_memoryWarningIssued) {
            // Log warning (only once until memory is freed)
#ifdef __EMSCRIPTEN__
            EM_ASM({
                console.warn('[MultiFontManager] Memory usage exceeds threshold: ' + 
                    ($0 / 1024 / 1024).toFixed(2) + 'MB > ' + 
                    ($1 / 1024 / 1024).toFixed(2) + 'MB');
            }, totalMemory, threshold);
#endif
            m_memoryWarningIssued = true;
        }
        return true;
    }
    
    return false;
}

std::string MultiFontManager::getMemoryMetricsJson() const {
    std::ostringstream oss;
    oss << "{";
    oss << "\"totalMemoryUsage\":" << getTotalMemoryUsage() << ",";
    oss << "\"fontCount\":" << m_fonts.size() << ",";
    oss << "\"fontHandleCount\":" << m_fontInstances.size() << ",";
    oss << "\"memoryThreshold\":" << MEMORY_WARNING_THRESHOLD << ",";
    oss << "\"exceedsThreshold\":" << (checkMemoryThreshold() ? "true" : "false") << ",";
    oss << "\"fonts\":[";
    
    bool first = true;
    for (const auto& pair : m_fonts) {
        if (!first) {
            oss << ",";
        }
        first = false;
        
        oss << "{";
        oss << "\"id\":" << pair.second.id << ",";
        oss << "\"name\":\"" << pair.second.name << "\",";
        oss << "\"memoryUsage\":" << pair.second.memoryUsage;
        oss << "}";
    }
    
    oss << "]}";
    return oss.str();
}

} // namespace wasm_litehtml_v2
