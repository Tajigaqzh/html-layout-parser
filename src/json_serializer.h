/**
 * @file json_serializer.h
 * @brief JSON Serializer v2.0 - Data structures and serialization for layout output
 * 
 * This module provides:
 * - Standardized data structures for layout output (LayoutDocument, Page, Block, Line, Run)
 * - Three output modes: full, simple, flat
 * - Version metadata and viewport information
 * - Canvas-friendly JSON format
 * 
 * @note Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

#ifndef WASM_V2_JSON_SERIALIZER_H
#define WASM_V2_JSON_SERIALIZER_H

#include <string>
#include <vector>
#include <map>
#include "wasm_container.h"
#include "error_types.h"

namespace wasm_litehtml_v2 {

/**
 * @brief Output mode for JSON serialization (JSON 输出模式)
 * 
 * - full: Complete hierarchical structure (Document → Pages → Blocks → Lines → Runs → Characters)
 * - simple: Simplified structure (Lines → Characters)
 * - flat: Flat character array (backward compatible with v1)
 * - byRow: Characters grouped by row (similar to v1's isRow mode)
 */
enum class OutputMode {
    Full,       // Complete hierarchical structure (完整层级结构)
    Simple,     // Simplified structure (Lines → Characters) (简化结构)
    Flat,       // Flat character array (扁平数组)
    ByRow       // Characters grouped by row (按行分组，兼容 v1)
};

/**
 * @brief Viewport information (视口信息)
 */
struct Viewport {
    int width = 0;   // Viewport width (视口宽度)
    int height = 0;  // Viewport height (视口高度)
};

/**
 * @brief Margin/Padding box values (外边距/内边距盒子)
 */
struct BoxSpacing {
    int top = 0;     // Top spacing (上)
    int right = 0;   // Right spacing (右)
    int bottom = 0;  // Bottom spacing (下)
    int left = 0;    // Left spacing (左)
};

/**
 * @brief Run structure - group of characters with same styling (样式一致的字符分组)
 * 
 * A Run represents a contiguous sequence of characters that share
 * the same font and styling properties. This allows efficient
 * rendering by batching characters with identical styles.
 * 
 * @note Requirements: 3.5
 */
struct Run {
    int runIndex = 0;               // Run index within the line (行内序号)
    int x = 0;                      // Starting X position (pixels) (起始 X)
    
    // Font properties (shared by all characters in run)
    std::string fontFamily;         // Font family (字体族)
    int fontSize = 16;              // Font size (字号)
    int fontWeight = 400;           // Font weight (字重)
    std::string fontStyle;          // normal/italic/oblique (字体样式)
    
    // Color properties (shared by all characters in run)
    std::string color;              // Text color (#RRGGBBAA) (文字颜色)
    std::string backgroundColor;    // Background color (#RRGGBBAA) (背景色)
    
    // Text decoration (shared by all characters in run)
    TextDecoration textDecoration;  // Decoration info (装饰线信息)
    
    // Characters in this run
    std::vector<CharLayout> characters; // Characters in run (字符列表)
};

/**
 * @brief Line structure - a single line of text (单行文本结构)
 * 
 * Contains baseline, height, and alignment information for
 * accurate text rendering on Canvas.
 * 
 * @note Requirements: 3.4
 */
struct Line {
    int lineIndex = 0;              // Line index within the block (行序号)
    int y = 0;                      // Line top Y position (pixels) (行顶部 Y)
    int baseline = 0;               // Baseline Y position (pixels) (基线 Y)
    int height = 0;                 // Line height (pixels) (行高)
    int width = 0;                  // Line width (pixels) (行宽)
    std::string textAlign;          // left/center/right/justify (对齐方式)
    
    // Runs in this line (for full mode)
    std::vector<Run> runs;          // Runs in this line (行内 Run)
    
    // Characters in this line (for simple mode)
    std::vector<CharLayout> characters; // Characters in this line (行内字符)
};

/**
 * @brief Row structure - for byRow mode (v1 compatible, 按行分组)
 * 
 * Simple grouping of characters by Y coordinate.
 */
struct Row {
    int rowIndex = 0;               // Row index (行序号)
    int y = 0;                      // Y coordinate (行 Y 坐标)
    std::vector<CharLayout> children; // Row children (行内字符)
};

/**
 * @brief Block type enumeration (块级类型枚举)
 */
enum class BlockType {
    Paragraph,
    Heading,
    List,
    Table,
    Div,
    Other
};

/**
 * @brief Block structure - a block-level element (块级元素结构)
 * 
 * Contains position, margin, padding, and background information
 * for block-level elements like paragraphs, headings, divs, etc.
 * 
 * @note Requirements: 3.3
 */
struct Block {
    int blockIndex = 0;             // Block index within the page (块序号)
    BlockType type = BlockType::Div;
    std::string typeString;         // String representation of type (类型字符串)
    
    // Position and size
    int x = 0;                      // X position (X 坐标)
    int y = 0;                      // Y position (Y 坐标)
    int width = 0;                  // Width (宽度)
    int height = 0;                 // Height (高度)
    
    // Spacing
    BoxSpacing margin;              // Margin box (外边距)
    BoxSpacing padding;             // Padding box (内边距)
    
    // Background
    std::string backgroundColor;    // Background color (#RRGGBBAA) (背景色)
    int borderRadius = 0;           // Border radius (pixels) (圆角)
    
    // Lines in this block
    std::vector<Line> lines;        // Lines in block (块内行)
};

/**
 * @brief Page structure (页面结构)
 * 
 * Represents a single page of content. For web content,
 * typically there is only one page.
 */
struct Page {
    int pageIndex = 0;              // Page index (页面序号)
    int width = 0;                  // Page width (pixels) (页面宽度)
    int height = 0;                 // Page height (pixels) (页面高度)
    
    // Blocks in this page
    std::vector<Block> blocks;      // Blocks in this page (页面块列表)
};

/**
 * @brief Layout Document structure - top-level container (布局文档根结构)
 * 
 * Contains version, viewport, and all pages with their content.
 * This is the root structure for "full" mode output.
 * 
 * @note Requirements: 3.1, 3.2, 3.6
 */
struct LayoutDocument {
    std::string version = "2.0";    // Format version (格式版本)
    Viewport viewport;              // Viewport dimensions (视口信息)
    
    // Parser metadata
    std::string parserVersion;      // Parser version (解析器版本)
    
    // Pages (typically one for web content)
    std::vector<Page> pages;        // Pages list (页面列表)
};

// Note: ParseResult is defined in error_types.h

/**
 * @brief JSON Serializer class (JSON 序列化器)
 * 
 * Provides methods to serialize layout data to JSON in different modes.
 */
class JsonSerializer {
public:
    /**
     * @brief Parse output mode string to enum (解析输出模式字符串)
     * @param modeStr Mode string: "full", "simple", "flat", "byRow"
     * @return OutputMode enum value (defaults to Flat if invalid)
     */
    static OutputMode parseMode(const char* modeStr);
    
    /**
     * @brief Serialize character layouts to JSON based on mode (按模式序列化)
     * @param layouts Character layouts from WasmContainer
     * @param mode Output mode
     * @param viewport Viewport dimensions
     * @return JSON string
     */
    static std::string serialize(
        const std::vector<CharLayout>& layouts,
        OutputMode mode,
        const Viewport& viewport
    );
    
    /**
     * @brief Serialize to flat JSON array (v1 compatible, 扁平数组)
     * @param layouts Character layouts
     * @return JSON string
     */
    static std::string serializeFlat(const std::vector<CharLayout>& layouts);
    
    /**
     * @brief Serialize to byRow JSON (v1 isRow compatible, 按行分组)
     * @param layouts Character layouts
     * @return JSON string
     */
    static std::string serializeByRow(const std::vector<CharLayout>& layouts);
    
    /**
     * @brief Serialize to simple JSON (Lines → Characters, 简化结构)
     * @param layouts Character layouts
     * @param viewport Viewport dimensions
     * @return JSON string
     */
    static std::string serializeSimple(
        const std::vector<CharLayout>& layouts,
        const Viewport& viewport
    );
    
    /**
     * @brief Serialize to full JSON (完整层级结构)
     * @param layouts Character layouts
     * @param viewport Viewport dimensions
     * @return JSON string
     */
    static std::string serializeFull(
        const std::vector<CharLayout>& layouts,
        const Viewport& viewport
    );
    
    /**
     * @brief Serialize parse result with metrics (序列化解析结果)
     * @param result Parse result
     * @param data Layout data JSON string
     * @return JSON string with result wrapper
     */
    static std::string serializeResult(
        const ParseResult& result,
        const std::string& data
    );
    
    /**
     * @brief Escape string for JSON (public utility, JSON 转义)
     * @param str Input string
     * @return Escaped string safe for JSON
     */
    static std::string escapeJsonString(const std::string& str);

private:
    /**
     * @brief Escape string for JSON (JSON 转义)
     * @param str Input string
     * @return Escaped string
     */
    static std::string escapeJson(const std::string& str);
    
    /**
     * @brief Serialize a single CharLayout to JSON (序列化单个字符)
     * @param layout Character layout
     * @param oss Output stream
     */
    static void serializeCharLayout(const CharLayout& layout, std::ostringstream& oss);
    
    /**
     * @brief Serialize TextDecoration to JSON (序列化装饰线)
     * @param decoration Text decoration
     * @param oss Output stream
     */
    static void serializeTextDecoration(const TextDecoration& decoration, std::ostringstream& oss);
    
    /**
     * @brief Serialize Transform to JSON (序列化变换)
     * @param transform Transform
     * @param oss Output stream
     */
    static void serializeTransform(const Transform& transform, std::ostringstream& oss);
    
    /**
     * @brief Serialize BoxSpacing to JSON (序列化边距)
     * @param spacing Box spacing
     * @param oss Output stream
     */
    static void serializeBoxSpacing(const BoxSpacing& spacing, std::ostringstream& oss);
    
    /**
     * @brief Serialize a Run to JSON (序列化 Run)
     * @param run Run
     * @param oss Output stream
     */
    static void serializeRun(const Run& run, std::ostringstream& oss);
    
    /**
     * @brief Serialize a Line to JSON (full mode, 完整模式)
     * @param line Line
     * @param oss Output stream
     */
    static void serializeLineFull(const Line& line, std::ostringstream& oss);
    
    /**
     * @brief Serialize a Line to JSON (simple mode, 简化模式)
     * @param line Line
     * @param oss Output stream
     */
    static void serializeLineSimple(const Line& line, std::ostringstream& oss);
    
    /**
     * @brief Serialize a Block to JSON (序列化块)
     * @param block Block
     * @param oss Output stream
     */
    static void serializeBlock(const Block& block, std::ostringstream& oss);
    
    /**
     * @brief Serialize a Page to JSON (序列化页面)
     * @param page Page
     * @param oss Output stream
     */
    static void serializePage(const Page& page, std::ostringstream& oss);
    
    /**
     * @brief Group characters into lines by Y coordinate (按 Y 分行)
     * @param layouts Character layouts
     * @return Vector of Lines
     */
    static std::vector<Line> groupIntoLines(const std::vector<CharLayout>& layouts);
    
    /**
     * @brief Group characters in a line into runs by style (按样式分组)
     * @param characters Characters in a line
     * @return Vector of Runs
     */
    static std::vector<Run> groupIntoRuns(const std::vector<CharLayout>& characters);
    
    /**
     * @brief Check if two characters have the same style (检查样式是否一致)
     * @param a First character
     * @param b Second character
     * @return true if same style
     */
    static bool isSameStyle(const CharLayout& a, const CharLayout& b);
    
    /**
     * @brief Convert BlockType enum to string (块类型转字符串)
     * @param type Block type
     * @return String representation
     */
    static std::string blockTypeToString(BlockType type);
};

} // namespace wasm_litehtml_v2

#endif // WASM_V2_JSON_SERIALIZER_H
