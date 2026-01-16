/**
 * @file error_types.h
 * @brief Error Types and Diagnostics for HTML Layout Parser v2.0
 * 
 * This module provides:
 * - Error code definitions
 * - ParseError structure for error reporting
 * - ParseResult structure with success/error/warnings/metrics
 * - Error message utilities
 * 
 * @note Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

#ifndef WASM_V2_ERROR_TYPES_H
#define WASM_V2_ERROR_TYPES_H

#include <string>
#include <vector>

namespace wasm_litehtml_v2 {

// ============================================================================
// Error Codes
// ============================================================================

/**
 * @brief Error code enumeration (错误码枚举)
 * 
 * Defines all possible error codes for the parser.
 * Error codes are grouped by category:
 * - 0: Success
 * - 1xxx: Input validation errors
 * - 2xxx: Font-related errors
 * - 3xxx: Parsing errors
 * - 4xxx: Memory errors
 * - 5xxx: Internal errors
 */
enum class ErrorCode {
    // Success
    Success = 0,
    
    // Input validation errors (1xxx)
    InvalidInput = 1001,
    EmptyHtml = 1002,
    InvalidViewportWidth = 1003,
    InvalidMode = 1004,
    InvalidOptions = 1005,
    HtmlTooLarge = 1006,
    
    // Font-related errors (2xxx)
    FontNotLoaded = 2001,
    FontLoadFailed = 2002,
    FontDataInvalid = 2003,
    FontNameEmpty = 2004,
    FontIdNotFound = 2005,
    NoDefaultFont = 2006,
    FontMemoryExceeded = 2007,
    
    // Parsing errors (3xxx)
    ParseFailed = 3001,
    DocumentCreationFailed = 3002,
    RenderFailed = 3003,
    LayoutFailed = 3004,
    CssParseError = 3005,
    
    // Memory errors (4xxx)
    MemoryAllocationFailed = 4001,
    MemoryLimitExceeded = 4002,
    
    // Internal errors (5xxx)
    InternalError = 5001,
    SerializationFailed = 5002,
    UnknownError = 5999
};

/**
 * @brief Convert error code to string representation (错误码转字符串)
 * @param code Error code
 * @return String representation of the error code
 */
inline const char* errorCodeToString(ErrorCode code) {
    switch (code) {
        case ErrorCode::Success: return "SUCCESS";
        case ErrorCode::InvalidInput: return "INVALID_INPUT";
        case ErrorCode::EmptyHtml: return "EMPTY_HTML";
        case ErrorCode::InvalidViewportWidth: return "INVALID_VIEWPORT_WIDTH";
        case ErrorCode::InvalidMode: return "INVALID_MODE";
        case ErrorCode::InvalidOptions: return "INVALID_OPTIONS";
        case ErrorCode::HtmlTooLarge: return "HTML_TOO_LARGE";
        case ErrorCode::FontNotLoaded: return "FONT_NOT_LOADED";
        case ErrorCode::FontLoadFailed: return "FONT_LOAD_FAILED";
        case ErrorCode::FontDataInvalid: return "FONT_DATA_INVALID";
        case ErrorCode::FontNameEmpty: return "FONT_NAME_EMPTY";
        case ErrorCode::FontIdNotFound: return "FONT_ID_NOT_FOUND";
        case ErrorCode::NoDefaultFont: return "NO_DEFAULT_FONT";
        case ErrorCode::FontMemoryExceeded: return "FONT_MEMORY_EXCEEDED";
        case ErrorCode::ParseFailed: return "PARSE_FAILED";
        case ErrorCode::DocumentCreationFailed: return "DOCUMENT_CREATION_FAILED";
        case ErrorCode::RenderFailed: return "RENDER_FAILED";
        case ErrorCode::LayoutFailed: return "LAYOUT_FAILED";
        case ErrorCode::CssParseError: return "CSS_PARSE_ERROR";
        case ErrorCode::MemoryAllocationFailed: return "MEMORY_ALLOCATION_FAILED";
        case ErrorCode::MemoryLimitExceeded: return "MEMORY_LIMIT_EXCEEDED";
        case ErrorCode::InternalError: return "INTERNAL_ERROR";
        case ErrorCode::SerializationFailed: return "SERIALIZATION_FAILED";
        case ErrorCode::UnknownError: return "UNKNOWN_ERROR";
        default: return "UNKNOWN_ERROR";
    }
}

/**
 * @brief Get numeric value of error code (获取错误码数字值)
 * @param code Error code
 * @return Numeric value
 */
inline int errorCodeToInt(ErrorCode code) {
    return static_cast<int>(code);
}

// ============================================================================
// Error Severity
// ============================================================================

/**
 * @brief Error severity levels (错误严重级别)
 */
enum class ErrorSeverity {
    Error,      // Fatal error, operation failed
    Warning,    // Non-fatal issue, operation continued
    Info        // Informational message
};

/**
 * @brief Convert severity to string (严重级别转字符串)
 * @param severity Severity level
 * @return String representation
 */
inline const char* severityToString(ErrorSeverity severity) {
    switch (severity) {
        case ErrorSeverity::Error: return "error";
        case ErrorSeverity::Warning: return "warning";
        case ErrorSeverity::Info: return "info";
        default: return "unknown";
    }
}

// ============================================================================
// ParseError Structure
// ============================================================================

/**
 * @brief Parse error information (解析错误信息)
 * 
 * Contains detailed information about an error that occurred during parsing.
 * 
 * @note Requirements: 8.1
 */
struct ParseError {
    ErrorCode code = ErrorCode::Success;    // Error code (错误码)
    std::string message;                     // Human-readable error message (错误信息)
    ErrorSeverity severity = ErrorSeverity::Error;  // Severity level (严重级别)
    int line = -1;                           // Line number (if applicable) (行号)
    int column = -1;                         // Column number (if applicable) (列号)
    std::string context;                     // Additional context (上下文信息)
    
    /**
     * @brief Default constructor (默认构造)
     */
    ParseError() = default;
    
    /**
     * @brief Constructor with code and message (指定错误码与信息)
     * @param c Error code
     * @param msg Error message
     */
    ParseError(ErrorCode c, const std::string& msg)
        : code(c), message(msg), severity(ErrorSeverity::Error) {}
    
    /**
     * @brief Constructor with all fields (完整字段构造)
     * @param c Error code
     * @param msg Error message
     * @param sev Severity level
     * @param l Line number
     * @param col Column number
     */
    ParseError(ErrorCode c, const std::string& msg, ErrorSeverity sev, int l = -1, int col = -1)
        : code(c), message(msg), severity(sev), line(l), column(col) {}
    
    /**
     * @brief Check if this is an error (是否为错误)
     * @return true if severity is Error
     */
    bool isError() const { return severity == ErrorSeverity::Error; }
    
    /**
     * @brief Check if this is a warning (是否为警告)
     * @return true if severity is Warning
     */
    bool isWarning() const { return severity == ErrorSeverity::Warning; }
    
    /**
     * @brief Get error code as string (错误码字符串)
     * @return String representation of error code
     */
    std::string codeString() const { return errorCodeToString(code); }
};

// ============================================================================
// Performance Metrics Structure
// ============================================================================

/**
 * @brief Performance metrics from parsing operation (性能指标)
 * 
 * Contains timing and resource usage information.
 * 
 * @note Requirements: 8.5, 7.6
 */
struct PerformanceMetrics {
    double parseTime = 0.0;         // HTML parsing time (ms) (解析耗时)
    double layoutTime = 0.0;        // Layout calculation time (ms) (布局耗时)
    double serializeTime = 0.0;     // JSON serialization time (ms) (序列化耗时)
    double totalTime = 0.0;         // Total processing time (ms) (总耗时)
    int characterCount = 0;         // Number of characters processed (字符数)
    size_t inputSize = 0;           // Input HTML size (bytes) (输入大小)
    double charsPerSecond = 0.0;    // Processing speed (chars/sec) (处理速度)
    size_t memoryUsed = 0;          // Memory used (bytes) (内存占用)
    
    /**
     * @brief Calculate characters per second (计算每秒字符数)
     */
    void calculateSpeed() {
        if (totalTime > 0) {
            charsPerSecond = (characterCount * 1000.0) / totalTime;
        }
    }
};

// ============================================================================
// ParseResult Structure
// ============================================================================

/**
 * @brief Parse result containing success status, data, errors, warnings, and metrics (解析结果)
 * 
 * This is the main result structure returned by parsing operations.
 * 
 * @note Requirements: 8.1, 8.2, 8.5
 */
struct ParseResult {
    bool success = false;                    // Whether parsing succeeded (是否成功)
    std::string data;                        // JSON data (if successful) (结果数据)
    std::vector<ParseError> errors;          // Errors that occurred (错误列表)
    std::vector<ParseError> warnings;        // Warnings (non-fatal issues) (警告列表)
    PerformanceMetrics metrics;              // Performance metrics (性能指标)
    bool metricsEnabled = false;             // Whether metrics were collected (是否包含指标)
    
    /**
     * @brief Create a successful result (创建成功结果)
     * @param jsonData JSON data string
     * @return ParseResult with success=true
     */
    static ParseResult ok(const std::string& jsonData) {
        ParseResult result;
        result.success = true;
        result.data = jsonData;
        return result;
    }
    
    /**
     * @brief Create a successful result with metrics (创建成功结果含指标)
     * @param jsonData JSON data string
     * @param m Performance metrics
     * @return ParseResult with success=true and metrics
     */
    static ParseResult ok(const std::string& jsonData, const PerformanceMetrics& m) {
        ParseResult result;
        result.success = true;
        result.data = jsonData;
        result.metrics = m;
        result.metricsEnabled = true;
        return result;
    }
    
    /**
     * @brief Create a failed result with single error (创建失败结果)
     * @param code Error code
     * @param message Error message
     * @return ParseResult with success=false
     */
    static ParseResult fail(ErrorCode code, const std::string& message) {
        ParseResult result;
        result.success = false;
        result.errors.push_back(ParseError(code, message));
        return result;
    }
    
    /**
     * @brief Create a failed result with error object (用错误对象创建失败结果)
     * @param error ParseError object
     * @return ParseResult with success=false
     */
    static ParseResult fail(const ParseError& error) {
        ParseResult result;
        result.success = false;
        result.errors.push_back(error);
        return result;
    }
    
    /**
     * @brief Add a warning to the result (添加警告)
     * @param code Warning code
     * @param message Warning message
     */
    void addWarning(ErrorCode code, const std::string& message) {
        warnings.push_back(ParseError(code, message, ErrorSeverity::Warning));
    }
    
    /**
     * @brief Add an error to the result (添加错误)
     * @param code Error code
     * @param message Error message
     */
    void addError(ErrorCode code, const std::string& message) {
        errors.push_back(ParseError(code, message, ErrorSeverity::Error));
        success = false;
    }
    
    /**
     * @brief Check if there are any errors (是否有错误)
     * @return true if errors exist
     */
    bool hasErrors() const { return !errors.empty(); }
    
    /**
     * @brief Check if there are any warnings (是否有警告)
     * @return true if warnings exist
     */
    bool hasWarnings() const { return !warnings.empty(); }
    
    /**
     * @brief Get the first error message (if any, 首个错误信息)
     * @return First error message or empty string
     */
    std::string firstErrorMessage() const {
        return errors.empty() ? "" : errors[0].message;
    }
    
    /**
     * @brief Get the first error code (if any, 首个错误码)
     * @return First error code or Success
     */
    ErrorCode firstErrorCode() const {
        return errors.empty() ? ErrorCode::Success : errors[0].code;
    }
};

// ============================================================================
// Font Load Result
// ============================================================================

/**
 * @brief Result of font loading operation (字体加载结果)
 * 
 * @note Requirements: 8.3
 */
struct FontLoadResult {
    bool success = false;           // Whether loading succeeded (是否成功)
    int fontId = 0;                 // Font ID (if successful) (字体 ID)
    ErrorCode errorCode = ErrorCode::Success;  // Error code (if failed) (错误码)
    std::string errorMessage;       // Error message (if failed) (错误信息)
    
    /**
     * @brief Create a successful result (创建成功结果)
     * @param id Font ID
     * @return FontLoadResult with success=true
     */
    static FontLoadResult ok(int id) {
        FontLoadResult result;
        result.success = true;
        result.fontId = id;
        return result;
    }
    
    /**
     * @brief Create a failed result (创建失败结果)
     * @param code Error code
     * @param message Error message
     * @return FontLoadResult with success=false
     */
    static FontLoadResult fail(ErrorCode code, const std::string& message) {
        FontLoadResult result;
        result.success = false;
        result.fontId = 0;
        result.errorCode = code;
        result.errorMessage = message;
        return result;
    }
};

} // namespace wasm_litehtml_v2

#endif // WASM_V2_ERROR_TYPES_H
