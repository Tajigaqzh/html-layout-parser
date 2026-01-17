/**
 * @file wasm_container.h
 * @brief WASM Container - Enhanced document_container implementation
 * 
 * This module provides:
 * - Integration with MultiFontManager for multi-font support
 * - Enhanced CharLayout with rich text attributes
 * - Font fallback chain support via font-family resolution
 * - Strict memory management with immediate cleanup
 * 
 * @note Requirements: 1.1, 1.5, 9.1, 9.8
 */

#ifndef WASM_CONTAINER_H
#define WASM_CONTAINER_H

#include <litehtml.h>
#include <vector>
#include <string>
#include <map>
#include "multi_font_manager.h"

namespace wasm_litehtml_v2 {

/**
 * @brief Text decoration information (文本装饰信息)
 * 
 * Contains complete text decoration styling for Canvas rendering.
 * Maps to CSS text-decoration-* properties.
 */
struct TextDecoration {
    bool underline = false;         // text-decoration-line: underline (下划线)
    bool overline = false;          // text-decoration-line: overline (上划线)
    bool lineThrough = false;       // text-decoration-line: line-through (删除线)
    std::string color;              // text-decoration-color (#RRGGBBAA) (装饰线颜色)
    std::string style;              // text-decoration-style: solid/double/dotted/dashed/wavy (装饰线样式)
    float thickness = 1.0f;         // text-decoration-thickness in pixels (装饰线粗细)
};

/**
 * @brief Transform information (变换信息)
 * 
 * Contains CSS transform values for Canvas rendering.
 * Note: Currently placeholder - full transform support requires
 * additional litehtml integration.
 */
struct Transform {
    float scaleX = 1.0f;            // Horizontal scale factor (X 方向缩放)
    float scaleY = 1.0f;            // Vertical scale factor (Y 方向缩放)
    float skewX = 0.0f;             // Horizontal skew in degrees (X 方向倾斜)
    float skewY = 0.0f;             // Vertical skew in degrees (Y 方向倾斜)
    float rotate = 0.0f;            // Rotation in degrees (旋转角度)
};

/**
 * @brief Enhanced character layout information (增强字符布局信息)
 * 
 * Contains comprehensive text styling information for Canvas rendering.
 * All position and size values are in pixels.
 * All colors are in #RRGGBBAA format for Canvas compatibility.
 * 
 * @note Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 2.8, 6.1-6.5
 */
struct CharLayout {
    // ========== Basic Position Properties ==========
    std::string character;          // Character content (UTF-8) (字符内容)
    int x = 0;                      // Horizontal position (pixels) (X 坐标)
    int y = 0;                      // Vertical position (pixels) (Y 坐标)
    int width = 0;                  // Character width (pixels) (字符宽度)
    int height = 0;                 // Character height (pixels) (字符高度)
    
    // ========== Font Properties ==========
    std::string fontFamily;         // Font family name (字体族)
    int fontSize = 16;              // Font size (pixels) (字号)
    int fontWeight = 400;           // Font weight (100-900) (字重)
    std::string fontStyle;          // normal/italic/oblique (字体样式)
    
    // ========== Color and Background (Req 2.1, 2.5) ==========
    std::string color;              // Text color (#RRGGBBAA) (文本颜色)
    std::string backgroundColor;    // Background color (#RRGGBBAA) (背景色)
    float opacity = 1.0f;           // Opacity (0-1) (不透明度)
    
    // ========== Text Decoration (Req 2.2) ==========
    TextDecoration textDecoration;  // Complete text decoration info (装饰线信息)
    
    // ========== Spacing (Req 2.3) ==========
    // Note: letter-spacing and word-spacing CSS properties are not directly
    // supported by litehtml's text rendering. These fields are defined for
    // future compatibility and can be populated if custom CSS parsing is added.
    float letterSpacing = 0.0f;     // Letter spacing (pixels) (字间距)
    float wordSpacing = 0.0f;       // Word spacing (pixels) (词间距)
    
    // ========== Transform (Req 2.8) ==========
    Transform transform;            // CSS transform values (变换参数)
    
    // ========== Baseline and Direction (Req 2.6, 2.7) ==========
    int baseline = 0;               // Baseline position (pixels) (基线位置)
    std::string direction;          // Text direction: ltr/rtl (文本方向)
    
    // ========== Internal Reference ==========
    int fontId = 0;                 // Font ID from MultiFontManager (字体 ID)
};

/**
 * @brief Font information structure (字体信息结构)
 * 
 * Stores font handle and associated styling information from font_description.
 * Used to map litehtml font handles to MultiFontManager fonts.
 */
struct FontInfoInternal {
    uint64_t fontHandle;            // MultiFontManager font handle (字体句柄)
    int fontId;                     // Font ID from MultiFontManager (字体 ID)
    int fontSize;                   // Font size in pixels (字号)
    int fontWeight;                 // Font weight (100-900) (字重)
    bool bold;                      // Is bold (weight >= 700) (粗体)
    bool italic;                    // Is italic (斜体)
    std::string fontFamily;         // Font family name (字体族)
    
    // Text decoration from font_description
    int decorationLine;             // Decoration line flags (装饰线类型)
    int decorationStyle;            // Decoration style (装饰线样式)
    float decorationThickness;      // Decoration thickness in pixels (装饰线粗细)
    std::string decorationColor;    // Decoration color (#RRGGBBAA) (装饰线颜色)
};

/**
 * @brief WASM Container class (WASM 容器类)
 * 
 * Implements litehtml::document_container interface with:
 * - Multi-font support via MultiFontManager
 * - Enhanced character layout collection
 * - Font fallback chain resolution
 * - Strict memory management
 */
class WasmContainer : public litehtml::document_container {
public:
    /**
     * @brief Constructor (构造函数)
     * @param viewportWidth Viewport width (pixels)
     * @param viewportHeight Viewport height (pixels)
     */
    WasmContainer(int viewportWidth, int viewportHeight);
    
    /**
     * @brief Destructor (析构函数)
     */
    ~WasmContainer() override;

    // ========== Font Methods (字体相关方法) ==========
    
    litehtml::uint_ptr create_font(const litehtml::font_description& descr, 
                                   const litehtml::document* doc, 
                                   litehtml::font_metrics* fm) override;
    
    void delete_font(litehtml::uint_ptr hFont) override;
    
    litehtml::pixel_t text_width(const char* text, litehtml::uint_ptr hFont) override;
    
    void draw_text(litehtml::uint_ptr hdc, const char* text, litehtml::uint_ptr hFont, 
                   litehtml::web_color color, const litehtml::position& pos) override;

    // ========== Size Conversion Methods (尺寸换算方法) ==========
    
    litehtml::pixel_t pt_to_px(float pt) const override;
    litehtml::pixel_t get_default_font_size() const override;
    const char* get_default_font_name() const override;

    // ========== Drawing Methods (Empty Implementation, 绘制空实现) ==========
    
    void draw_list_marker(litehtml::uint_ptr hdc, const litehtml::list_marker& marker) override;
    void load_image(const char* src, const char* baseurl, bool redraw_on_ready) override;
    void get_image_size(const char* src, const char* baseurl, litehtml::size& sz) override;
    void draw_image(litehtml::uint_ptr hdc, const litehtml::background_layer& layer, 
                    const std::string& url, const std::string& base_url) override;
    void draw_solid_fill(litehtml::uint_ptr hdc, const litehtml::background_layer& layer, 
                         const litehtml::web_color& color) override;
    void draw_linear_gradient(litehtml::uint_ptr hdc, const litehtml::background_layer& layer, 
                              const litehtml::background_layer::linear_gradient& gradient) override;
    void draw_radial_gradient(litehtml::uint_ptr hdc, const litehtml::background_layer& layer, 
                              const litehtml::background_layer::radial_gradient& gradient) override;
    void draw_conic_gradient(litehtml::uint_ptr hdc, const litehtml::background_layer& layer, 
                             const litehtml::background_layer::conic_gradient& gradient) override;
    void draw_borders(litehtml::uint_ptr hdc, const litehtml::borders& borders, 
                      const litehtml::position& draw_pos, bool root) override;

    // ========== Document Methods (Empty Implementation, 文档空实现) ==========
    
    void set_caption(const char* caption) override;
    void set_base_url(const char* base_url) override;
    void link(const std::shared_ptr<litehtml::document>& doc, 
              const litehtml::element::ptr& el) override;
    void on_anchor_click(const char* url, const litehtml::element::ptr& el) override;
    void on_mouse_event(const litehtml::element::ptr& el, litehtml::mouse_event event) override;
    void set_cursor(const char* cursor) override;
    void transform_text(litehtml::string& text, litehtml::text_transform tt) override;
    void import_css(litehtml::string& text, const litehtml::string& url, 
                    litehtml::string& baseurl) override;
    void set_clip(const litehtml::position& pos, 
                  const litehtml::border_radiuses& bdr_radius) override;
    void del_clip() override;
    void get_viewport(litehtml::position& viewport) const override;
    litehtml::element::ptr create_element(const char* tag_name,
                                          const litehtml::string_map& attributes,
                                          const std::shared_ptr<litehtml::document>& doc) override;
    void get_media_features(litehtml::media_features& media) const override;
    void get_language(litehtml::string& language, litehtml::string& culture) const override;

    // ========== Layout Result Access (布局结果访问) ==========
    
    /**
     * @brief Get collected character layouts (获取字符布局结果)
     * @return Const reference to character layout array
     */
    const std::vector<CharLayout>& getCharLayouts() const;
    
    /**
     * @brief Clear character layouts and release memory (清空布局并释放内存)
     * 
     * ⚠️ MANDATORY: Must call shrink_to_fit() to release vector memory
     */
    void clearCharLayouts();
    
    /**
     * @brief Get character count (获取字符数量)
     * @return Number of collected characters
     */
    size_t getCharCount() const;

private:
    int m_viewportWidth;                                // Viewport width (视口宽度)
    int m_viewportHeight;                               // Viewport height (视口高度)
    std::vector<CharLayout> m_charLayouts;              // Collected character layouts (字符布局集合)
    std::map<litehtml::uint_ptr, FontInfoInternal> m_fonts; // Font handle map (字体句柄映射)
    
    // Cached default font name (缓存默认字体名)
    mutable std::string m_defaultFontName;
    
    /**
     * @brief Convert color to #RRGGBBAA format string (颜色转换为 RGBA 字符串)
     * @param color Color value
     * @return Color string
     */
    static std::string colorToHexRGBA(const litehtml::web_color& color);
    
    /**
     * @brief Convert text_decoration_style enum to string (装饰线样式转字符串)
     * @param style Decoration style enum value
     * @return Style string (solid, double, dotted, dashed, wavy)
     */
    static std::string decorationStyleToString(int style);
    
    /**
     * @brief Decode next UTF-8 codepoint from string (解码下一个 UTF-8 字符)
     * @param text Input text pointer (updated to next char)
     * @param charStr Output: current character's UTF-8 string
     * @return Unicode codepoint, 0 on failure
     */
    static uint32_t decodeUtf8Char(const char*& text, std::string& charStr);
};

} // namespace wasm_litehtml_v2

#endif // WASM_CONTAINER_H
