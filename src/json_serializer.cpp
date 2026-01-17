/**
 * @file json_serializer.cpp
 * @brief JSON Serializer v2.0 implementation (JSON 序列化实现)
 * 
 * Implements serialization for all output modes:
 * - full: Complete hierarchical structure
 * - simple: Simplified structure (Lines → Characters)
 * - flat: Flat character array (v1 compatible)
 * - byRow: Characters grouped by row (v1 isRow compatible)
 * 
 * Performance optimizations:
 * - Uses std::ostringstream for efficient string building
 * - Pre-reserves capacity for vectors where possible
 * - Uses move semantics to avoid copies
 * - Inline escapeJson for common cases
 * 
 * @note Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.1
 */

#include "json_serializer.h"
#include "error_types.h"
#include <sstream>
#include <algorithm>
#include <map>
#include <cmath>

namespace wasm_litehtml_v2 {

// ============================================================================
// Optimized Helper Functions
// ============================================================================

/**
 * @brief Fast check if string needs escaping (快速判断是否需要转义)
 * @param str String to check
 * @return true if string contains characters that need escaping
 */
static inline bool needsEscaping(const std::string& str) {
    for (char c : str) {
        if (c == '"' || c == '\\' || static_cast<unsigned char>(c) < 0x20) {
            return true;
        }
    }
    return false;
}

/**
 * @brief Write escaped JSON string directly to stream (直接写入转义后的 JSON 字符串)
 * @param str String to escape
 * @param oss Output stream
 * 
 * Note: Currently unused but kept for potential future optimization
 * where we want to avoid creating intermediate strings.
 */
[[maybe_unused]]
static inline void writeEscapedJson(const std::string& str, std::ostringstream& oss) {
    // Fast path: no escaping needed (无需转义)
    if (!needsEscaping(str)) {
        oss << str;
        return;
    }
    
    // Slow path: escape special characters (逐字符转义)
    for (char c : str) {
        switch (c) {
            case '"':  oss << "\\\""; break;
            case '\\': oss << "\\\\"; break;
            case '\b': oss << "\\b"; break;
            case '\f': oss << "\\f"; break;
            case '\n': oss << "\\n"; break;
            case '\r': oss << "\\r"; break;
            case '\t': oss << "\\t"; break;
            default:
                if (static_cast<unsigned char>(c) < 0x20) {
                    char buf[8];
                    snprintf(buf, sizeof(buf), "\\u%04x", static_cast<unsigned char>(c));
                    oss << buf;
                } else {
                    oss << c;
                }
                break;
        }
    }
}

// ============================================================================
// Public Methods (公共方法)
// ============================================================================

OutputMode JsonSerializer::parseMode(const char* modeStr) {
    if (modeStr == nullptr) {
        return OutputMode::Flat;
    }
    
    std::string mode(modeStr);
    if (mode == "full") {
        return OutputMode::Full;
    } else if (mode == "simple") {
        return OutputMode::Simple;
    } else if (mode == "byRow" || mode == "byrow") {
        return OutputMode::ByRow;
    }
    
    // Default to flat (默认扁平模式)
    return OutputMode::Flat;
}

std::string JsonSerializer::serialize(
    const std::vector<CharLayout>& layouts,
    OutputMode mode,
    const Viewport& viewport
) {
    switch (mode) {
        case OutputMode::Full:
            return serializeFull(layouts, viewport);
        case OutputMode::Simple:
            return serializeSimple(layouts, viewport);
        case OutputMode::ByRow:
            return serializeByRow(layouts);
        case OutputMode::Flat:
        default:
            return serializeFlat(layouts);
    }
}

std::string JsonSerializer::serializeFlat(const std::vector<CharLayout>& layouts) {
    // Pre-allocate estimated capacity (rough estimate: ~500 bytes per character, 预估容量)
    std::ostringstream oss;
    
    oss << "[";
    
    for (size_t i = 0; i < layouts.size(); ++i) {
        if (i > 0) {
            oss << ",";
        }
        serializeCharLayout(layouts[i], oss);
    }
    
    oss << "]";
    return oss.str();
}

std::string JsonSerializer::serializeByRow(const std::vector<CharLayout>& layouts) {
    // Group characters by Y coordinate (按 Y 坐标分组)
    std::map<int, std::vector<const CharLayout*>> rowMap;
    
    for (const auto& layout : layouts) {
        rowMap[layout.y].push_back(&layout);
    }
    
    // Get all Y coordinates and sort them (获取并排序所有 Y)
    std::vector<int> yCoords;
    yCoords.reserve(rowMap.size());
    for (const auto& pair : rowMap) {
        yCoords.push_back(pair.first);
    }
    std::sort(yCoords.begin(), yCoords.end());
    
    // Serialize to JSON (序列化为 JSON)
    std::ostringstream oss;
    oss << "[";
    
    for (size_t rowIndex = 0; rowIndex < yCoords.size(); ++rowIndex) {
        if (rowIndex > 0) {
            oss << ",";
        }
        
        int y = yCoords[rowIndex];
        const auto& children = rowMap[y];
        
        // Sort children by X coordinate (按 X 排序)
        std::vector<const CharLayout*> sortedChildren = children;
        std::sort(sortedChildren.begin(), sortedChildren.end(),
            [](const CharLayout* a, const CharLayout* b) {
                return a->x < b->x;
            });
        
        oss << "{";
        oss << "\"rowIndex\":" << rowIndex << ",";
        oss << "\"y\":" << y << ",";
        oss << "\"children\":[";
        
        for (size_t i = 0; i < sortedChildren.size(); ++i) {
            if (i > 0) {
                oss << ",";
            }
            serializeCharLayout(*sortedChildren[i], oss);
        }
        
        oss << "]}";
    }
    
    oss << "]";
    return oss.str();
}

std::string JsonSerializer::serializeSimple(
    const std::vector<CharLayout>& layouts,
    const Viewport& viewport
) {
    // Group into lines
    std::vector<Line> lines = groupIntoLines(layouts);
    
    std::ostringstream oss;
    oss << "{";
    
    // Version
    oss << "\"version\":\"2.0\",";
    
    // Viewport
    oss << "\"viewport\":{";
    oss << "\"width\":" << viewport.width << ",";
    oss << "\"height\":" << viewport.height;
    oss << "},";
    
    // Lines
    oss << "\"lines\":[";
    
    for (size_t i = 0; i < lines.size(); ++i) {
        if (i > 0) {
            oss << ",";
        }
        serializeLineSimple(lines[i], oss);
    }
    
    oss << "]";
    oss << "}";
    
    return oss.str();
}

std::string JsonSerializer::serializeFull(
    const std::vector<CharLayout>& layouts,
    const Viewport& viewport
) {
    // Group into lines
    std::vector<Line> lines = groupIntoLines(layouts);
    
    // Group lines into runs
    for (auto& line : lines) {
        line.runs = groupIntoRuns(line.characters);
    }
    
    // Create a single block containing all lines
    Block block;
    block.blockIndex = 0;
    block.type = BlockType::Div;
    block.typeString = "div";
    block.x = 0;
    block.y = 0;
    block.width = viewport.width;
    
    // Calculate block height from lines
    if (!lines.empty()) {
        const Line& lastLine = lines.back();
        block.height = lastLine.y + lastLine.height;
    }
    
    block.lines = std::move(lines);
    
    // Create a single page
    Page page;
    page.pageIndex = 0;
    page.width = viewport.width;
    page.height = viewport.height;
    page.blocks.push_back(std::move(block));
    
    // Create document
    LayoutDocument doc;
    doc.version = "2.0";
    doc.parserVersion = "2.0.0";
    doc.viewport = viewport;
    doc.pages.push_back(std::move(page));
    
    // Serialize
    std::ostringstream oss;
    oss << "{";
    
    // Version
    oss << "\"version\":\"" << escapeJson(doc.version) << "\",";
    
    // Parser version
    oss << "\"parserVersion\":\"" << escapeJson(doc.parserVersion) << "\",";
    
    // Viewport
    oss << "\"viewport\":{";
    oss << "\"width\":" << doc.viewport.width << ",";
    oss << "\"height\":" << doc.viewport.height;
    oss << "},";
    
    // Pages
    oss << "\"pages\":[";
    
    for (size_t i = 0; i < doc.pages.size(); ++i) {
        if (i > 0) {
            oss << ",";
        }
        serializePage(doc.pages[i], oss);
    }
    
    oss << "]";
    oss << "}";
    
    return oss.str();
}

std::string JsonSerializer::serializeResult(
    const ParseResult& result,
    const std::string& data
) {
    std::ostringstream oss;
    oss << "{";
    
    oss << "\"success\":" << (result.success ? "true" : "false") << ",";
    
    if (!result.success && !result.errors.empty()) {
        oss << "\"errorCode\":\"" << escapeJson(errorCodeToString(result.errors[0].code)) << "\",";
        oss << "\"errorMessage\":\"" << escapeJson(result.errors[0].message) << "\",";
    }
    
    oss << "\"data\":" << data << ",";
    
    // Metrics
    oss << "\"metrics\":{";
    oss << "\"parseTime\":" << result.metrics.parseTime << ",";
    oss << "\"layoutTime\":" << result.metrics.layoutTime << ",";
    oss << "\"serializeTime\":" << result.metrics.serializeTime << ",";
    oss << "\"totalTime\":" << result.metrics.totalTime << ",";
    oss << "\"characterCount\":" << result.metrics.characterCount << ",";
    oss << "\"memoryUsed\":" << result.metrics.memoryUsed;
    oss << "}";
    
    oss << "}";
    return oss.str();
}

// ============================================================================
// Private Helper Methods
// ============================================================================

std::string JsonSerializer::escapeJson(const std::string& str) {
    // Fast path: no escaping needed
    if (!needsEscaping(str)) {
        return str;
    }
    
    // Slow path: escape special characters
    std::ostringstream oss;
    for (char c : str) {
        switch (c) {
            case '"':  oss << "\\\""; break;
            case '\\': oss << "\\\\"; break;
            case '\b': oss << "\\b"; break;
            case '\f': oss << "\\f"; break;
            case '\n': oss << "\\n"; break;
            case '\r': oss << "\\r"; break;
            case '\t': oss << "\\t"; break;
            default:
                if (static_cast<unsigned char>(c) < 0x20) {
                    char buf[8];
                    snprintf(buf, sizeof(buf), "\\u%04x", static_cast<unsigned char>(c));
                    oss << buf;
                } else {
                    oss << c;
                }
                break;
        }
    }
    return oss.str();
}

std::string JsonSerializer::escapeJsonString(const std::string& str) {
    return escapeJson(str);
}

void JsonSerializer::serializeCharLayout(const CharLayout& layout, std::ostringstream& oss) {
    oss << "{";
    
    // Character (escaped)
    oss << "\"character\":\"" << escapeJson(layout.character) << "\",";
    
    // Position
    oss << "\"x\":" << layout.x << ",";
    oss << "\"y\":" << layout.y << ",";
    oss << "\"width\":" << layout.width << ",";
    oss << "\"height\":" << layout.height << ",";
    
    // Font properties
    oss << "\"fontFamily\":\"" << escapeJson(layout.fontFamily) << "\",";
    oss << "\"fontSize\":" << layout.fontSize << ",";
    oss << "\"fontWeight\":" << layout.fontWeight << ",";
    oss << "\"fontStyle\":\"" << escapeJson(layout.fontStyle) << "\",";
    
    // Colors
    oss << "\"color\":\"" << escapeJson(layout.color) << "\",";
    oss << "\"backgroundColor\":\"" << escapeJson(layout.backgroundColor) << "\",";
    
    // Opacity
    oss << "\"opacity\":" << layout.opacity << ",";
    
    // Text decoration
    oss << "\"textDecoration\":";
    serializeTextDecoration(layout.textDecoration, oss);
    oss << ",";
    
    // Spacing
    oss << "\"letterSpacing\":" << layout.letterSpacing << ",";
    oss << "\"wordSpacing\":" << layout.wordSpacing << ",";
    
    // Transform
    oss << "\"transform\":";
    serializeTransform(layout.transform, oss);
    oss << ",";
    
    // Baseline and direction
    oss << "\"baseline\":" << layout.baseline << ",";
    oss << "\"direction\":\"" << escapeJson(layout.direction) << "\",";
    
    // Font ID
    oss << "\"fontId\":" << layout.fontId;
    
    oss << "}";
}

void JsonSerializer::serializeTextDecoration(const TextDecoration& decoration, std::ostringstream& oss) {
    oss << "{";
    oss << "\"underline\":" << (decoration.underline ? "true" : "false") << ",";
    oss << "\"overline\":" << (decoration.overline ? "true" : "false") << ",";
    oss << "\"lineThrough\":" << (decoration.lineThrough ? "true" : "false") << ",";
    oss << "\"color\":\"" << escapeJson(decoration.color) << "\",";
    oss << "\"style\":\"" << escapeJson(decoration.style) << "\",";
    oss << "\"thickness\":" << decoration.thickness;
    oss << "}";
}

void JsonSerializer::serializeTransform(const Transform& transform, std::ostringstream& oss) {
    oss << "{";
    oss << "\"scaleX\":" << transform.scaleX << ",";
    oss << "\"scaleY\":" << transform.scaleY << ",";
    oss << "\"skewX\":" << transform.skewX << ",";
    oss << "\"skewY\":" << transform.skewY << ",";
    oss << "\"rotate\":" << transform.rotate;
    oss << "}";
}

void JsonSerializer::serializeBoxSpacing(const BoxSpacing& spacing, std::ostringstream& oss) {
    oss << "{";
    oss << "\"top\":" << spacing.top << ",";
    oss << "\"right\":" << spacing.right << ",";
    oss << "\"bottom\":" << spacing.bottom << ",";
    oss << "\"left\":" << spacing.left;
    oss << "}";
}

void JsonSerializer::serializeRun(const Run& run, std::ostringstream& oss) {
    oss << "{";
    
    oss << "\"runIndex\":" << run.runIndex << ",";
    oss << "\"x\":" << run.x << ",";
    
    // Font properties
    oss << "\"fontFamily\":\"" << escapeJson(run.fontFamily) << "\",";
    oss << "\"fontSize\":" << run.fontSize << ",";
    oss << "\"fontWeight\":" << run.fontWeight << ",";
    oss << "\"fontStyle\":\"" << escapeJson(run.fontStyle) << "\",";
    
    // Colors
    oss << "\"color\":\"" << escapeJson(run.color) << "\",";
    oss << "\"backgroundColor\":\"" << escapeJson(run.backgroundColor) << "\",";
    
    // Text decoration
    oss << "\"textDecoration\":";
    serializeTextDecoration(run.textDecoration, oss);
    oss << ",";
    
    // Characters
    oss << "\"characters\":[";
    for (size_t i = 0; i < run.characters.size(); ++i) {
        if (i > 0) {
            oss << ",";
        }
        serializeCharLayout(run.characters[i], oss);
    }
    oss << "]";
    
    oss << "}";
}

void JsonSerializer::serializeLineFull(const Line& line, std::ostringstream& oss) {
    oss << "{";
    
    oss << "\"lineIndex\":" << line.lineIndex << ",";
    oss << "\"y\":" << line.y << ",";
    oss << "\"baseline\":" << line.baseline << ",";
    oss << "\"height\":" << line.height << ",";
    oss << "\"width\":" << line.width << ",";
    oss << "\"textAlign\":\"" << escapeJson(line.textAlign) << "\",";
    
    // Runs
    oss << "\"runs\":[";
    for (size_t i = 0; i < line.runs.size(); ++i) {
        if (i > 0) {
            oss << ",";
        }
        serializeRun(line.runs[i], oss);
    }
    oss << "]";
    
    oss << "}";
}

void JsonSerializer::serializeLineSimple(const Line& line, std::ostringstream& oss) {
    oss << "{";
    
    oss << "\"lineIndex\":" << line.lineIndex << ",";
    oss << "\"y\":" << line.y << ",";
    oss << "\"baseline\":" << line.baseline << ",";
    oss << "\"height\":" << line.height << ",";
    oss << "\"width\":" << line.width << ",";
    oss << "\"textAlign\":\"" << escapeJson(line.textAlign) << "\",";
    
    // Characters (simple mode doesn't use runs)
    oss << "\"characters\":[";
    for (size_t i = 0; i < line.characters.size(); ++i) {
        if (i > 0) {
            oss << ",";
        }
        serializeCharLayout(line.characters[i], oss);
    }
    oss << "]";
    
    oss << "}";
}

void JsonSerializer::serializeBlock(const Block& block, std::ostringstream& oss) {
    oss << "{";
    
    oss << "\"blockIndex\":" << block.blockIndex << ",";
    oss << "\"type\":\"" << escapeJson(block.typeString) << "\",";
    
    // Position and size
    oss << "\"x\":" << block.x << ",";
    oss << "\"y\":" << block.y << ",";
    oss << "\"width\":" << block.width << ",";
    oss << "\"height\":" << block.height << ",";
    
    // Spacing
    oss << "\"margin\":";
    serializeBoxSpacing(block.margin, oss);
    oss << ",";
    
    oss << "\"padding\":";
    serializeBoxSpacing(block.padding, oss);
    oss << ",";
    
    // Background
    oss << "\"backgroundColor\":\"" << escapeJson(block.backgroundColor) << "\",";
    oss << "\"borderRadius\":" << block.borderRadius << ",";
    
    // Lines
    oss << "\"lines\":[";
    for (size_t i = 0; i < block.lines.size(); ++i) {
        if (i > 0) {
            oss << ",";
        }
        serializeLineFull(block.lines[i], oss);
    }
    oss << "]";
    
    oss << "}";
}

void JsonSerializer::serializePage(const Page& page, std::ostringstream& oss) {
    oss << "{";
    
    oss << "\"pageIndex\":" << page.pageIndex << ",";
    oss << "\"width\":" << page.width << ",";
    oss << "\"height\":" << page.height << ",";
    
    // Blocks
    oss << "\"blocks\":[";
    for (size_t i = 0; i < page.blocks.size(); ++i) {
        if (i > 0) {
            oss << ",";
        }
        serializeBlock(page.blocks[i], oss);
    }
    oss << "]";
    
    oss << "}";
}

std::vector<Line> JsonSerializer::groupIntoLines(const std::vector<CharLayout>& layouts) {
    // Group characters by Y coordinate
    std::map<int, std::vector<CharLayout>> lineMap;
    
    for (const auto& layout : layouts) {
        lineMap[layout.y].push_back(layout);
    }
    
    // Get all Y coordinates and sort them
    std::vector<int> yCoords;
    yCoords.reserve(lineMap.size());
    for (const auto& pair : lineMap) {
        yCoords.push_back(pair.first);
    }
    std::sort(yCoords.begin(), yCoords.end());
    
    // Create Line objects
    std::vector<Line> lines;
    lines.reserve(yCoords.size());
    
    for (size_t i = 0; i < yCoords.size(); ++i) {
        int y = yCoords[i];
        auto& chars = lineMap[y];
        
        // Sort characters by X coordinate
        std::sort(chars.begin(), chars.end(),
            [](const CharLayout& a, const CharLayout& b) {
                return a.x < b.x;
            });
        
        Line line;
        line.lineIndex = static_cast<int>(i);
        line.y = y;
        line.characters = std::move(chars);
        
        // Calculate line properties from characters
        if (!line.characters.empty()) {
            // Height is max character height
            int maxHeight = 0;
            int maxBaseline = 0;
            int maxX = 0;
            
            for (const auto& ch : line.characters) {
                if (ch.height > maxHeight) {
                    maxHeight = ch.height;
                }
                if (ch.baseline > maxBaseline) {
                    maxBaseline = ch.baseline;
                }
                int charRight = ch.x + ch.width;
                if (charRight > maxX) {
                    maxX = charRight;
                }
            }
            
            line.height = maxHeight;
            line.baseline = maxBaseline;
            line.width = maxX - line.characters.front().x;
        }
        
        // Default text align
        line.textAlign = "left";
        
        lines.push_back(std::move(line));
    }
    
    return lines;
}

std::vector<Run> JsonSerializer::groupIntoRuns(const std::vector<CharLayout>& characters) {
    std::vector<Run> runs;
    
    if (characters.empty()) {
        return runs;
    }
    
    Run currentRun;
    currentRun.runIndex = 0;
    currentRun.x = characters[0].x;
    currentRun.fontFamily = characters[0].fontFamily;
    currentRun.fontSize = characters[0].fontSize;
    currentRun.fontWeight = characters[0].fontWeight;
    currentRun.fontStyle = characters[0].fontStyle;
    currentRun.color = characters[0].color;
    currentRun.backgroundColor = characters[0].backgroundColor;
    currentRun.textDecoration = characters[0].textDecoration;
    currentRun.characters.push_back(characters[0]);
    
    for (size_t i = 1; i < characters.size(); ++i) {
        const CharLayout& ch = characters[i];
        
        if (isSameStyle(currentRun.characters.back(), ch)) {
            // Same style, add to current run
            currentRun.characters.push_back(ch);
        } else {
            // Different style, start new run
            runs.push_back(std::move(currentRun));
            
            currentRun = Run();
            currentRun.runIndex = static_cast<int>(runs.size());
            currentRun.x = ch.x;
            currentRun.fontFamily = ch.fontFamily;
            currentRun.fontSize = ch.fontSize;
            currentRun.fontWeight = ch.fontWeight;
            currentRun.fontStyle = ch.fontStyle;
            currentRun.color = ch.color;
            currentRun.backgroundColor = ch.backgroundColor;
            currentRun.textDecoration = ch.textDecoration;
            currentRun.characters.push_back(ch);
        }
    }
    
    // Don't forget the last run
    runs.push_back(std::move(currentRun));
    
    return runs;
}

bool JsonSerializer::isSameStyle(const CharLayout& a, const CharLayout& b) {
    return a.fontFamily == b.fontFamily &&
           a.fontSize == b.fontSize &&
           a.fontWeight == b.fontWeight &&
           a.fontStyle == b.fontStyle &&
           a.color == b.color &&
           a.backgroundColor == b.backgroundColor &&
           a.textDecoration.underline == b.textDecoration.underline &&
           a.textDecoration.overline == b.textDecoration.overline &&
           a.textDecoration.lineThrough == b.textDecoration.lineThrough &&
           a.textDecoration.color == b.textDecoration.color &&
           a.textDecoration.style == b.textDecoration.style;
}

std::string JsonSerializer::blockTypeToString(BlockType type) {
    switch (type) {
        case BlockType::Paragraph: return "paragraph";
        case BlockType::Heading: return "heading";
        case BlockType::List: return "list";
        case BlockType::Table: return "table";
        case BlockType::Div: return "div";
        case BlockType::Other:
        default: return "other";
    }
}

} // namespace wasm_litehtml_v2
