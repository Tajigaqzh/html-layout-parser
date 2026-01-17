/**
 * @file wasm_container.cpp
 * @brief WASM Container implementation (WASM 容器实现)
 * 
 * @note Requirements: 1.1, 1.5, 9.1, 9.8
 */

#include "wasm_container.h"
#include <cstdio>
#include <cstring>

namespace wasm_litehtml_v2 {

WasmContainer::WasmContainer(int viewportWidth, int viewportHeight)
    : m_viewportWidth(viewportWidth)
    , m_viewportHeight(viewportHeight)
{
}

WasmContainer::~WasmContainer() {
    // Clean up all font handles (清理字体句柄)
    MultiFontManager& manager = MultiFontManager::getInstance();
    for (auto& pair : m_fonts) {
        manager.deleteFontHandle(pair.second.fontHandle);
    }
    m_fonts.clear();
    
    // Clear character layouts (清空字符布局)
    clearCharLayouts();
}

// ========== Font Methods (字体方法) ==========

litehtml::uint_ptr WasmContainer::create_font(const litehtml::font_description& descr, 
                                                 const litehtml::document* /*doc*/, 
                                                 litehtml::font_metrics* fm) {
    MultiFontManager& manager = MultiFontManager::getInstance();
    
    // Get font weight (litehtml uses 100-900 standard weights, 获取字重)
    int fontWeight = descr.weight;
    if (fontWeight < 100 || fontWeight > 900) {
        fontWeight = 400;
    }
    
    bool bold = fontWeight >= 700;
    bool italic = (descr.style == litehtml::font_style_italic);
    int fontSize = static_cast<int>(descr.size);
    
    // Resolve font-family to font ID using fallback chain (解析 font-family 回退链)
    std::string fontFamilyStr = descr.family;
    
    int fontId = manager.resolveFontFamily(fontFamilyStr);
    if (fontId == 0) {
        fontId = manager.getDefaultFontId();
    }
    
    // Create font handle (创建字体句柄)
    uint64_t fontHandle = manager.createFontHandle(fontId, fontSize, bold, italic);
    if (fontHandle == 0) {
        return 0;
    }
    
    // Get font metrics (获取字体度量)
    if (fm) {
        FontMetrics metrics;
        if (manager.getFontMetrics(fontId, fontSize, metrics)) {
            fm->font_size = descr.size;
            fm->height = static_cast<litehtml::pixel_t>(metrics.height);
            fm->ascent = static_cast<litehtml::pixel_t>(metrics.ascent);
            fm->descent = static_cast<litehtml::pixel_t>(metrics.descent);
            fm->x_height = static_cast<litehtml::pixel_t>(metrics.x_height);
            fm->ch_width = static_cast<litehtml::pixel_t>(metrics.ch_width);
        } else {
            // Default metrics (默认度量)
            fm->font_size = descr.size;
            fm->height = static_cast<litehtml::pixel_t>(fontSize);
            fm->ascent = static_cast<litehtml::pixel_t>(fontSize * 3 / 4);
            fm->descent = static_cast<litehtml::pixel_t>(fontSize / 4);
            fm->x_height = static_cast<litehtml::pixel_t>(fontSize / 2);
            fm->ch_width = static_cast<litehtml::pixel_t>(fontSize / 2);
        }
        fm->draw_spaces = true;
    }
    
    // Save font info with complete decoration information (保存字体信息)
    FontInfoInternal fontInfo;
    fontInfo.fontHandle = fontHandle;
    fontInfo.fontId = fontId;
    fontInfo.fontSize = fontSize;
    fontInfo.fontWeight = fontWeight;
    fontInfo.bold = bold;
    fontInfo.italic = italic;
    fontInfo.fontFamily = manager.getFontName(fontId);
    
    // Store text decoration information from font_description (保存装饰线信息)
    fontInfo.decorationLine = descr.decoration_line;
    fontInfo.decorationStyle = static_cast<int>(descr.decoration_style);
    fontInfo.decorationThickness = descr.decoration_thickness.val();
    
    // Convert decoration color to hex string (装饰线颜色转字符串)
    if (descr.decoration_color.alpha > 0) {
        fontInfo.decorationColor = colorToHexRGBA(descr.decoration_color);
    }
    
    litehtml::uint_ptr hFont = static_cast<litehtml::uint_ptr>(fontHandle);
    m_fonts[hFont] = fontInfo;
    
    return hFont;
}

void WasmContainer::delete_font(litehtml::uint_ptr hFont) {
    auto it = m_fonts.find(hFont);
    if (it != m_fonts.end()) {
        MultiFontManager::getInstance().deleteFontHandle(it->second.fontHandle);
        m_fonts.erase(it);
    }
}

litehtml::pixel_t WasmContainer::text_width(const char* text, litehtml::uint_ptr hFont) {
    if (text == nullptr || *text == '\0') {
        return 0;
    }
    
    auto it = m_fonts.find(hFont);
    if (it == m_fonts.end()) {
        return 0;
    }
    
    MultiFontManager& manager = MultiFontManager::getInstance();
    int width = manager.getTextWidth(it->second.fontId, text, it->second.fontSize);
    return static_cast<litehtml::pixel_t>(width);
}

void WasmContainer::draw_text(litehtml::uint_ptr /*hdc*/, const char* text, 
                                 litehtml::uint_ptr hFont, litehtml::web_color color, 
                                 const litehtml::position& pos) {
    if (text == nullptr || *text == '\0') {
        return;
    }
    
    auto it = m_fonts.find(hFont);
    if (it == m_fonts.end()) {
        return;
    }
    
    const FontInfoInternal& fontInfo = it->second;
    MultiFontManager& manager = MultiFontManager::getInstance();
    
    // Get font metrics (获取字体度量)
    FontMetrics metrics;
    manager.getFontMetrics(fontInfo.fontId, fontInfo.fontSize, metrics);
    
    // Color conversion (颜色转换)
    std::string colorHex = colorToHexRGBA(color);
    
    // Determine decoration flags from font_description (装饰线标记)
    bool underline = (fontInfo.decorationLine & litehtml::text_decoration_line_underline) != 0;
    bool lineThrough = (fontInfo.decorationLine & litehtml::text_decoration_line_line_through) != 0;
    bool overline = (fontInfo.decorationLine & litehtml::text_decoration_line_overline) != 0;
    
    // Get decoration style string (装饰线样式字符串)
    std::string decorationStyleStr = decorationStyleToString(fontInfo.decorationStyle);
    
    // Get decoration color (use text color if not specified, 获取装饰线颜色)
    std::string decorationColorStr = fontInfo.decorationColor.empty() ? colorHex : fontInfo.decorationColor;
    
    // Get decoration thickness (default to 1.0 if not specified or invalid, 获取装饰线粗细)
    float decorationThickness = fontInfo.decorationThickness > 0 ? fontInfo.decorationThickness : 1.0f;
    
    // Iterate through each character (逐字符处理)
    const char* p = text;
    int currentX = static_cast<int>(pos.x);
    int baseY = static_cast<int>(pos.y);
    
    while (*p) {
        std::string charStr;
        uint32_t codepoint = decodeUtf8Char(p, charStr);
        
        if (codepoint == 0) {
            continue;
        }
        
        // Calculate character width (计算字符宽度)
        int charWidth = manager.getCharWidth(fontInfo.fontId, codepoint, fontInfo.fontSize);
        
        // Create character layout with all properties (构建字符布局)
        CharLayout layout;
        
        // Basic position properties (基础位置)
        layout.character = charStr;
        layout.x = currentX;
        layout.y = baseY;
        layout.width = charWidth;
        layout.height = metrics.height;
        
        // Font properties (字体属性)
        layout.fontFamily = fontInfo.fontFamily;
        layout.fontSize = fontInfo.fontSize;
        layout.fontWeight = fontInfo.fontWeight;
        layout.fontStyle = fontInfo.italic ? "italic" : "normal";
        layout.fontId = fontInfo.fontId;
        
        // Color (Req 2.1)
        layout.color = colorHex;
        
        // Background color - default to transparent (Req 2.1)
        // Note: Background color is typically set at block level, not character level
        // This would need element context to extract properly
        layout.backgroundColor = "#00000000";
        
        // Opacity - default to 1.0 (Req 2.5)
        // Note: Opacity is typically inherited from parent elements
        layout.opacity = 1.0f;
        
        // Text decoration (Req 2.2)
        layout.textDecoration.underline = underline;
        layout.textDecoration.overline = overline;
        layout.textDecoration.lineThrough = lineThrough;
        layout.textDecoration.color = decorationColorStr;
        layout.textDecoration.style = decorationStyleStr;
        layout.textDecoration.thickness = decorationThickness;
        
        // Spacing (Req 2.3)
        // Note: Letter spacing and word spacing would need element context
        // These are set at the element level, not passed to draw_text
        layout.letterSpacing = 0.0f;
        layout.wordSpacing = 0.0f;
        
        // Transform (Req 2.8)
        // Note: Transform would need element context to extract
        // Default values are already set in Transform struct
        
        // Baseline position (Req 2.6)
        layout.baseline = baseY + metrics.ascent;
        
        // Text direction (Req 2.7)
        // Note: Direction would need element context to extract
        // Default to LTR
        layout.direction = "ltr";
        
        m_charLayouts.push_back(layout);
        
        // Update X position
        currentX += charWidth;
    }
}

// ========== Size Conversion Methods ==========

litehtml::pixel_t WasmContainer::pt_to_px(float pt) const {
    // Assume 96 DPI
    return static_cast<litehtml::pixel_t>(pt * 96.0f / 72.0f);
}

litehtml::pixel_t WasmContainer::get_default_font_size() const {
    return 16;
}

const char* WasmContainer::get_default_font_name() const {
    MultiFontManager& manager = MultiFontManager::getInstance();
    int defaultId = manager.getDefaultFontId();
    if (defaultId != 0) {
        m_defaultFontName = manager.getFontName(defaultId);
        if (!m_defaultFontName.empty()) {
            return m_defaultFontName.c_str();
        }
    }
    return "sans-serif";
}

// ========== Drawing Methods (Empty Implementation) ==========

void WasmContainer::draw_list_marker(litehtml::uint_ptr /*hdc*/, 
                                        const litehtml::list_marker& /*marker*/) {
}

void WasmContainer::load_image(const char* /*src*/, const char* /*baseurl*/, 
                                  bool /*redraw_on_ready*/) {
}

void WasmContainer::get_image_size(const char* /*src*/, const char* /*baseurl*/, 
                                      litehtml::size& sz) {
    sz.width = 0;
    sz.height = 0;
}

void WasmContainer::draw_image(litehtml::uint_ptr /*hdc*/, 
                                  const litehtml::background_layer& /*layer*/, 
                                  const std::string& /*url*/, 
                                  const std::string& /*base_url*/) {
}

void WasmContainer::draw_solid_fill(litehtml::uint_ptr /*hdc*/, 
                                       const litehtml::background_layer& /*layer*/, 
                                       const litehtml::web_color& /*color*/) {
}

void WasmContainer::draw_linear_gradient(litehtml::uint_ptr /*hdc*/, 
                                            const litehtml::background_layer& /*layer*/, 
                                            const litehtml::background_layer::linear_gradient& /*gradient*/) {
}

void WasmContainer::draw_radial_gradient(litehtml::uint_ptr /*hdc*/, 
                                            const litehtml::background_layer& /*layer*/, 
                                            const litehtml::background_layer::radial_gradient& /*gradient*/) {
}

void WasmContainer::draw_conic_gradient(litehtml::uint_ptr /*hdc*/, 
                                           const litehtml::background_layer& /*layer*/, 
                                           const litehtml::background_layer::conic_gradient& /*gradient*/) {
}

void WasmContainer::draw_borders(litehtml::uint_ptr /*hdc*/, 
                                    const litehtml::borders& /*borders*/, 
                                    const litehtml::position& /*draw_pos*/, 
                                    bool /*root*/) {
}

// ========== Document Methods (Empty Implementation) ==========

void WasmContainer::set_caption(const char* /*caption*/) {
}

void WasmContainer::set_base_url(const char* /*base_url*/) {
}

void WasmContainer::link(const std::shared_ptr<litehtml::document>& /*doc*/, 
                            const litehtml::element::ptr& /*el*/) {
}

void WasmContainer::on_anchor_click(const char* /*url*/, 
                                       const litehtml::element::ptr& /*el*/) {
}

void WasmContainer::on_mouse_event(const litehtml::element::ptr& /*el*/, 
                                      litehtml::mouse_event /*event*/) {
}

void WasmContainer::set_cursor(const char* /*cursor*/) {
}

void WasmContainer::transform_text(litehtml::string& /*text*/, 
                                      litehtml::text_transform /*tt*/) {
}

void WasmContainer::import_css(litehtml::string& /*text*/, 
                                  const litehtml::string& /*url*/, 
                                  litehtml::string& /*baseurl*/) {
}

void WasmContainer::set_clip(const litehtml::position& /*pos*/, 
                                const litehtml::border_radiuses& /*bdr_radius*/) {
}

void WasmContainer::del_clip() {
}

void WasmContainer::get_viewport(litehtml::position& viewport) const {
    viewport.x = 0;
    viewport.y = 0;
    viewport.width = static_cast<litehtml::pixel_t>(m_viewportWidth);
    viewport.height = static_cast<litehtml::pixel_t>(m_viewportHeight);
}

litehtml::element::ptr WasmContainer::create_element(const char* /*tag_name*/,
                                                        const litehtml::string_map& /*attributes*/,
                                                        const std::shared_ptr<litehtml::document>& /*doc*/) {
    return nullptr;
}

void WasmContainer::get_media_features(litehtml::media_features& media) const {
    media.type = litehtml::media_type_screen;
    media.width = static_cast<litehtml::pixel_t>(m_viewportWidth);
    media.height = static_cast<litehtml::pixel_t>(m_viewportHeight);
    media.device_width = static_cast<litehtml::pixel_t>(m_viewportWidth);
    media.device_height = static_cast<litehtml::pixel_t>(m_viewportHeight);
    media.color = 8;
    media.color_index = 0;
    media.monochrome = 0;
    media.resolution = 96;
}

void WasmContainer::get_language(litehtml::string& language, 
                                    litehtml::string& culture) const {
    language = "en";
    culture = "US";
}

// ========== Layout Result Access ==========

const std::vector<CharLayout>& WasmContainer::getCharLayouts() const {
    return m_charLayouts;
}

void WasmContainer::clearCharLayouts() {
    // ⚠️ MANDATORY: Clear and release vector memory
    m_charLayouts.clear();
    m_charLayouts.shrink_to_fit();
}

size_t WasmContainer::getCharCount() const {
    return m_charLayouts.size();
}

// ========== Private Helper Methods ==========

std::string WasmContainer::colorToHexRGBA(const litehtml::web_color& color) {
    char buf[10];
    snprintf(buf, sizeof(buf), "#%02X%02X%02X%02X", 
             color.red, color.green, color.blue, color.alpha);
    return std::string(buf);
}

std::string WasmContainer::decorationStyleToString(int style) {
    switch (style) {
        case litehtml::text_decoration_style_solid:
            return "solid";
        case litehtml::text_decoration_style_double:
            return "double";
        case litehtml::text_decoration_style_dotted:
            return "dotted";
        case litehtml::text_decoration_style_dashed:
            return "dashed";
        case litehtml::text_decoration_style_wavy:
            return "wavy";
        default:
            return "solid";
    }
}

uint32_t WasmContainer::decodeUtf8Char(const char*& text, std::string& charStr) {
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
        charStr = "\xEF\xBF\xBD"; // Replacement character U+FFFD
        return 0xFFFD;
    }

    // Read continuation bytes
    for (int i = 1; i < bytes; i++) {
        if ((p[i] & 0xC0) != 0x80) {
            // Invalid continuation byte
            text++;
            charStr = "\xEF\xBF\xBD";
            return 0xFFFD;
        }
        codepoint = (codepoint << 6) | (p[i] & 0x3F);
    }

    // Save character's UTF-8 representation
    charStr.assign(text, bytes);
    text += bytes;
    
    return codepoint;
}

} // namespace wasm_litehtml_v2
