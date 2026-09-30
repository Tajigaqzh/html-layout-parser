/**
 * @file multi_font_manager.cpp
 * @brief Multi-Font Manager implementation for HTML Layout Parser v2.0
 * 
 * @note Requirements: 1.1, 1.2, 1.3, 1.6, 1.8, 1.9, 9.2, 9.3, 9.8
 */

#include "multi_font_manager.h"
#include "font_metrics_cache.h"
#include "debug_log.h"
#include <cstring>
#include <algorithm>
#include <cctype>
#include <sstream>
#include <hb-ft.h>

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
    entry.hbFont = nullptr;
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

    entry.hbFont = hb_ft_font_create(entry.face, nullptr);
    if (entry.hbFont) {
        hb_ft_font_set_load_flags(entry.hbFont, FT_LOAD_DEFAULT | FT_LOAD_COLOR);
    }

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
    m_shapeCache = ShapeCache{};

    // ⚠️ MANDATORY: Release HarfBuzz font before FreeType face
    destroyHbFont(it->second);

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
    m_shapeCache = ShapeCache{};

    // ⚠️ MANDATORY: Release all FreeType resources (释放 FreeType 资源)
    for (auto& pair : m_fonts) {
        destroyHbFont(pair.second);
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
    if (it->second.hbFont) {
        hb_ft_font_changed(it->second.hbFont);
    }
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
    // Use the fallback-aware function with single font
    return getCharWidthWithFallback(fontId, codepoint, fontSize, nullptr);
}

int MultiFontManager::getCharWidthWithFontFamily(const std::string& fontFamily, uint32_t codepoint, int fontSize, int* outUsedFontId) {
    // Parse font-family into ordered list
    std::vector<std::string> fontNames = parseFontFamily(fontFamily);
    
    // Try each font in the font-family list in order
    for (const auto& fontName : fontNames) {
        int fontId = findFontByName(fontName);
        if (fontId != 0) {
            // Check if this font has the glyph
            auto it = m_fonts.find(fontId);
            if (it != m_fonts.end() && it->second.face) {
                FT_UInt glyphIndex = FT_Get_Char_Index(it->second.face, codepoint);
                if (glyphIndex != 0) {
                    // Found! Use this font
                    DEBUG_LOG("Found character U+" << std::hex << codepoint << std::dec 
                             << " in font-family font: " << fontName << " (ID " << fontId << ")");
                    return getCharWidthWithFallback(fontId, codepoint, fontSize, outUsedFontId);
                }
            }
        }
    }
    
    // If not found in any font-family font, try default font
    if (m_defaultFontId != 0) {
        DEBUG_LOG("Character U+" << std::hex << codepoint << std::dec 
                 << " not found in font-family, trying default font (ID " << m_defaultFontId << ")");
        return getCharWidthWithFallback(m_defaultFontId, codepoint, fontSize, outUsedFontId);
    }
    
    // Last resort: use first font in font-family list
    if (!fontNames.empty()) {
        int firstFontId = findFontByName(fontNames[0]);
        if (firstFontId != 0) {
            return getCharWidthWithFallback(firstFontId, codepoint, fontSize, outUsedFontId);
        }
    }
    
    // Ultimate fallback
    return fontSize / 2;
}

int MultiFontManager::getCharWidthWithFallback(int fontId, uint32_t codepoint, int fontSize, int* outUsedFontId) {
    // Check cache first (先检查缓存)
    FontMetricsCache& cache = FontMetricsCache::getInstance();
    int cachedWidth = cache.getCharWidth(fontId, fontSize, codepoint);
    if (cachedWidth >= 0) {
        if (outUsedFontId) *outUsedFontId = fontId;
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
    
    // Get glyph index for primary font
    FT_UInt glyphIndex = FT_Get_Char_Index(face, codepoint);
    bool charNotFoundInPrimary = (glyphIndex == 0);
    int usedFontId = fontId;
    
    if (charNotFoundInPrimary) {
        // Log character not found warning (always show, not just in debug mode)
#ifdef __EMSCRIPTEN__
        EM_ASM({
            console.warn('[WASM] Character U+' + $0.toString(16) + 
                        ' (' + String.fromCodePoint($0) + ') not found in font ID ' + $1);
        }, codepoint, fontId);
#endif
        
        DEBUG_LOG("Character U+" << std::hex << codepoint << std::dec 
                 << " not found in primary font (ID " << fontId << "), using intelligent fallback");
        
        // Use intelligent fallback based on character type
        // Detect character type
        bool isCJK = (codepoint >= 0x4E00 && codepoint <= 0x9FFF) ||      // CJK Unified Ideographs
                     (codepoint >= 0x3400 && codepoint <= 0x4DBF) ||      // CJK Extension A
                     (codepoint >= 0x20000 && codepoint <= 0x2A6DF);      // CJK Extension B
        
        bool isCJKPunctuation = (codepoint >= 0x3000 && codepoint <= 0x303F) ||  // CJK Symbols and Punctuation
                                (codepoint >= 0xFF00 && codepoint <= 0xFFEF);    // Halfwidth and Fullwidth Forms
        
        bool isLatinPunctuation = (codepoint >= 0x20 && codepoint <= 0x2F) ||    // ASCII punctuation
                                  (codepoint >= 0x3A && codepoint <= 0x40) ||
                                  (codepoint >= 0x5B && codepoint <= 0x60) ||
                                  (codepoint >= 0x7B && codepoint <= 0x7E);
        
        if (isCJK) {
            // CJK characters: use '中' as fallback
            const uint32_t fallbackChars[] = {0x4E2D, '0', ' '};  // 中, 0, space
            
            for (uint32_t fallback : fallbackChars) {
                glyphIndex = FT_Get_Char_Index(face, fallback);
                if (glyphIndex != 0) {
                    DEBUG_LOG("→ Using CJK fallback character U+" << std::hex << fallback << std::dec);
                    break;
                }
            }
        } else if (isCJKPunctuation || isLatinPunctuation) {
            // Punctuation: use half width (fontSize / 2)
            int halfWidth = fontSize / 2;
            DEBUG_LOG("→ Using half-width fallback: " << halfWidth << "px for punctuation");
            cache.setCharWidth(usedFontId, fontSize, codepoint, halfWidth);
            if (outUsedFontId) *outUsedFontId = usedFontId;
            return halfWidth;
        } else {
            // Other characters: try common fallbacks
            const uint32_t fallbackChars[] = {'0', ' '};
            
            for (uint32_t fallback : fallbackChars) {
                glyphIndex = FT_Get_Char_Index(face, fallback);
                if (glyphIndex != 0) {
                    DEBUG_LOG("→ Using fallback character U+" << std::hex << fallback << std::dec);
                    break;
                }
            }
        }
        
        // If still no glyph found, return default
        if (glyphIndex == 0) {
            DEBUG_LOG("✗ No fallback glyph found, using default width: " << (fontSize / 2) << "px");
            if (outUsedFontId) *outUsedFontId = usedFontId;
            return fontSize / 2;
        }
    }
    
    // Load glyph
    FT_Error error = FT_Load_Glyph(face, glyphIndex, FT_LOAD_DEFAULT);
    if (error) {
        if (outUsedFontId) *outUsedFontId = usedFontId;
        return fontSize / 2;
    }
    
    // Calculate width using horiAdvance
    int horiAdvance = static_cast<int>(face->glyph->metrics.horiAdvance >> 6);
    int advanceX = static_cast<int>(face->glyph->advance.x >> 6);
    int width = static_cast<int>(face->glyph->metrics.width >> 6);
    
    // Use horiAdvance as primary method
    int finalWidth = horiAdvance;
    
    // Fallback to advance.x if horiAdvance is 0
    if (finalWidth == 0) {
        finalWidth = advanceX;
    }
    
    // Debug output for character metrics (only in debug mode)
    if (charNotFoundInPrimary || (codepoint >= 0x4E00 && codepoint <= 0x9FFF)) {
        DEBUG_LOG("Char U+" << std::hex << codepoint << std::dec 
                 << " metrics: horiAdvance=" << horiAdvance 
                 << ", advanceX=" << advanceX 
                 << ", width=" << width 
                 << ", fontSize=" << fontSize 
                 << ", finalWidth=" << finalWidth
                 << ", usedFont=" << usedFontId
                 << (charNotFoundInPrimary ? " (fallback)" : ""));
    }
    
    // Store in cache
    cache.setCharWidth(usedFontId, fontSize, codepoint, finalWidth);
    
    if (outUsedFontId) *outUsedFontId = usedFontId;
    
    return finalWidth;
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
    if (text == nullptr || *text == '\0') {
        return 0;
    }

    const std::vector<ShapedCluster> clusters = shapeText(fontId, text, fontSize);
    int totalWidth = 0;
    for (const ShapedCluster& cluster : clusters) {
        totalWidth += cluster.width;
    }
    return totalWidth;
}

int MultiFontManager::hbAdvanceToPx(int xAdvance) {
    if (xAdvance >= 0) {
        return (xAdvance + 32) >> 6;
    }
    return -((-xAdvance + 32) >> 6);
}

void MultiFontManager::destroyHbFont(FontEntry& entry) {
    if (entry.hbFont) {
        hb_font_destroy(entry.hbFont);
        entry.hbFont = nullptr;
    }
}

bool MultiFontManager::ensureHbFont(FontEntry& entry, int fontSize) {
    if (!entry.face) {
        return false;
    }
    if (!setFontSize(entry.id, fontSize)) {
        return false;
    }
    if (!entry.hbFont) {
        entry.hbFont = hb_ft_font_create(entry.face, nullptr);
        if (!entry.hbFont) {
            return false;
        }
        hb_ft_font_set_load_flags(entry.hbFont, FT_LOAD_DEFAULT | FT_LOAD_COLOR);
    }
    return true;
}

std::vector<int> MultiFontManager::buildFallbackFontIds(int primaryFontId) const {
    std::vector<int> fontIds;
    fontIds.push_back(primaryFontId);
    if (m_defaultFontId != 0 && m_defaultFontId != primaryFontId) {
        fontIds.push_back(m_defaultFontId);
    }
    for (const auto& pair : m_fonts) {
        if (pair.first != primaryFontId && pair.first != m_defaultFontId) {
            fontIds.push_back(pair.first);
        }
    }
    return fontIds;
}

bool MultiFontManager::fontHasGlyph(int fontId, uint32_t codepoint) const {
    auto it = m_fonts.find(fontId);
    if (it == m_fonts.end() || !it->second.face) {
        return false;
    }
    return FT_Get_Char_Index(it->second.face, codepoint) != 0;
}

static bool isEmojiZwj(uint32_t cp) { return cp == 0x200D; }
static bool isEmojiVs(uint32_t cp) { return cp == 0xFE0E || cp == 0xFE0F; }
static bool isEmojiSkinTone(uint32_t cp) { return cp >= 0x1F3FB && cp <= 0x1F3FF; }
static bool isRegionalIndicator(uint32_t cp) { return cp >= 0x1F1E6 && cp <= 0x1F1FF; }
static bool isKeycapMark(uint32_t cp) { return cp == 0x20E3; }
static bool isEmojiTag(uint32_t cp) { return cp >= 0xE0020 && cp <= 0xE007F; }
static bool isKeycapBase(uint32_t cp) {
    return (cp >= '0' && cp <= '9') || cp == '#' || cp == '*';
}

static bool isEmojiPresentation(uint32_t cp) {
    if (isEmojiZwj(cp) || isEmojiVs(cp) || isEmojiSkinTone(cp) || isRegionalIndicator(cp)
        || isKeycapMark(cp) || isEmojiTag(cp)) {
        return true;
    }
    if (cp >= 0x1F000 && cp <= 0x1FAFF) {
        return true;
    }
    if (cp >= 0x2600 && cp <= 0x27BF) {
        return true;
    }
    if (cp >= 0x2300 && cp <= 0x23FF) {
        return true;
    }
    if ((cp >= 0x2B1B && cp <= 0x2B1C) || cp == 0x2B50 || cp == 0x2B55) {
        return true;
    }
    return false;
}

static bool isEmojiJoiner(uint32_t cp) {
    return isEmojiZwj(cp) || isEmojiVs(cp) || isEmojiSkinTone(cp)
        || isKeycapMark(cp) || isEmojiTag(cp);
}

int MultiFontManager::selectFontForRun(int primaryFontId, const uint32_t* codepoints, int count, bool emojiRun) const {
    if (count <= 0) {
        return primaryFontId;
    }

    const std::vector<int> fontIds = buildFallbackFontIds(primaryFontId);
    for (int fontId : fontIds) {
        bool allPresent = true;
        bool anyContent = false;
        for (int i = 0; i < count; ++i) {
            const uint32_t cp = codepoints[i];
            if (isEmojiJoiner(cp)) {
                continue;
            }
            anyContent = true;
            if (!fontHasGlyph(fontId, cp)) {
                allPresent = false;
                break;
            }
        }
        if (allPresent && (anyContent || emojiRun)) {
            return fontId;
        }
    }

    return primaryFontId;
}

std::vector<ShapedCluster> MultiFontManager::shapeText(int fontId, const char* text, int fontSize) {
    if (text == nullptr || *text == '\0') {
        return {};
    }

    if (m_shapeCache.fontId == fontId && m_shapeCache.fontSize == fontSize && m_shapeCache.text == text) {
        return m_shapeCache.clusters;
    }

    struct CodeUnit {
        uint32_t cp;
        int byteStart;
        int byteEnd;
    };

    std::vector<CodeUnit> units;
    const char* cursor = text;
    while (*cursor) {
        CodeUnit unit;
        unit.byteStart = static_cast<int>(cursor - text);
        unit.cp = decodeUtf8(cursor);
        unit.byteEnd = static_cast<int>(cursor - text);
        if (unit.cp != 0) {
            units.push_back(unit);
        }
    }

    struct FontRun {
        int fontId;
        int byteStart;
        int byteEnd;
    };
    std::vector<FontRun> runs;

    auto appendRun = [&runs](int runFontId, int byteStart, int byteEnd) {
        if (byteEnd <= byteStart) {
            return;
        }
        if (!runs.empty() && runs.back().fontId == runFontId && runs.back().byteEnd == byteStart) {
            runs.back().byteEnd = byteEnd;
            return;
        }
        runs.push_back({runFontId, byteStart, byteEnd});
    };

    for (size_t i = 0; i < units.size(); ) {
        size_t seqEnd = i + 1;
        bool emojiRun = false;

        if (isRegionalIndicator(units[i].cp) && i + 1 < units.size() && isRegionalIndicator(units[i + 1].cp)) {
            seqEnd = i + 2;
            emojiRun = true;
        } else if (isKeycapBase(units[i].cp) && i + 1 < units.size()) {
            size_t look = i + 1;
            if (look < units.size() && isEmojiVs(units[look].cp)) {
                ++look;
            }
            if (look < units.size() && isKeycapMark(units[look].cp)) {
                seqEnd = look + 1;
                emojiRun = true;
            }
        } else if (isEmojiPresentation(units[i].cp) || (i + 1 < units.size() && isEmojiJoiner(units[i + 1].cp))) {
            emojiRun = isEmojiPresentation(units[i].cp);
            while (seqEnd < units.size()) {
                const uint32_t next = units[seqEnd].cp;
                if (isEmojiVs(next) || isEmojiSkinTone(next) || isKeycapMark(next) || isEmojiTag(next)) {
                    ++seqEnd;
                    emojiRun = true;
                    continue;
                }
                if (isEmojiZwj(next) && seqEnd + 1 < units.size()) {
                    seqEnd += 2;
                    emojiRun = true;
                    continue;
                }
                break;
            }
        }

        std::vector<uint32_t> seqCps;
        seqCps.reserve(seqEnd - i);
        for (size_t k = i; k < seqEnd; ++k) {
            seqCps.push_back(units[k].cp);
        }

        const int runFontId = selectFontForRun(
            fontId,
            seqCps.data(),
            static_cast<int>(seqCps.size()),
            emojiRun
        );
        appendRun(runFontId, units[i].byteStart, units[seqEnd - 1].byteEnd);
        i = seqEnd;
    }

    std::vector<ShapedCluster> clusters;
    for (const FontRun& run : runs) {
        std::vector<ShapedCluster> runClusters = shapeWithFont(
            run.fontId,
            text + run.byteStart,
            run.byteEnd - run.byteStart,
            fontSize
        );
        for (ShapedCluster& cluster : runClusters) {
            cluster.fontId = run.fontId;
            clusters.push_back(std::move(cluster));
        }
    }

    int totalWidth = 0;
    for (const ShapedCluster& cluster : clusters) {
        totalWidth += cluster.width;
    }

    m_shapeCache.fontId = fontId;
    m_shapeCache.fontSize = fontSize;
    m_shapeCache.text = text;
    m_shapeCache.clusters = clusters;
    m_shapeCache.totalWidth = totalWidth;
    return clusters;
}

std::vector<ShapedCluster> MultiFontManager::shapeWithFont(int fontId, const char* text, int textLen, int fontSize) {
    std::vector<ShapedCluster> clusters;
    if (text == nullptr || textLen <= 0) {
        return clusters;
    }

    auto it = m_fonts.find(fontId);
    if (it == m_fonts.end() || !ensureHbFont(it->second, fontSize) || !it->second.hbFont) {
        return clusters;
    }

    hb_buffer_t* buffer = hb_buffer_create();
    hb_buffer_add_utf8(buffer, text, textLen, 0, textLen);
    hb_buffer_set_cluster_level(buffer, HB_BUFFER_CLUSTER_LEVEL_MONOTONE_GRAPHEMES);
    hb_buffer_guess_segment_properties(buffer);
    hb_shape(it->second.hbFont, buffer, nullptr, 0);

    unsigned int glyphCount = 0;
    hb_glyph_info_t* infos = hb_buffer_get_glyph_infos(buffer, &glyphCount);
    hb_glyph_position_t* positions = hb_buffer_get_glyph_positions(buffer, &glyphCount);

    for (unsigned int i = 0; i < glyphCount; ) {
        const unsigned int cluster = infos[i].cluster;
        int advance = 0;
        bool missing = false;
        unsigned int j = i;
        while (j < glyphCount && infos[j].cluster == cluster) {
            advance += positions[j].x_advance;
            if (infos[j].codepoint == 0) {
                missing = true;
            }
            ++j;
        }

        unsigned int nextByte = static_cast<unsigned int>(textLen);
        for (unsigned int k = 0; k < glyphCount; ++k) {
            if (infos[k].cluster > cluster && infos[k].cluster < nextByte) {
                nextByte = infos[k].cluster;
            }
        }

        ShapedCluster shaped;
        if (cluster < static_cast<unsigned int>(textLen) && nextByte > cluster) {
            shaped.text.assign(text + cluster, text + nextByte);
        }
        shaped.width = hbAdvanceToPx(advance);
        if (missing && shaped.width <= 0) {
            shaped.width = fontSize;
        }
        shaped.missing = missing;
        shaped.fontId = fontId;
        if (!shaped.text.empty()) {
            clusters.push_back(std::move(shaped));
        }
        i = j;
    }

    hb_buffer_destroy(buffer);
    return clusters;
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
