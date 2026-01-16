/**
 * @file debug_log.h
 * @brief Debug Logging System for HTML Layout Parser v2.0
 * 
 * This module provides:
 * - Global debug flag control
 * - DEBUG_LOG macro for conditional logging
 * - Timestamp-prefixed log output
 * - Memory usage logging
 * 
 * @note Requirements: 8.1, 8.2, 8.3, 8.6
 */

#ifndef WASM_V2_DEBUG_LOG_H
#define WASM_V2_DEBUG_LOG_H

#include <iostream>
#include <chrono>
#include <iomanip>
#include <sstream>
#include <ctime>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

namespace wasm_litehtml_v2 {

/**
 * @brief Global debug mode flag (全局调试模式标志)
 * 
 * When true, debug logs are output to console.
 * When false, no debug output is produced.
 */
extern bool g_isDebug;

/**
 * @brief Get current timestamp string (获取当前时间戳字符串)
 * @return Formatted timestamp string
 */
inline std::string getTimestamp() {
    auto now = std::chrono::system_clock::now();
    auto time = std::chrono::system_clock::to_time_t(now);
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        now.time_since_epoch()) % 1000;
    
    std::ostringstream oss;
    oss << std::put_time(std::localtime(&time), "%Y-%m-%d %H:%M:%S");
    oss << '.' << std::setfill('0') << std::setw(3) << ms.count();
    return oss.str();
}

/**
 * @brief Output debug log message (输出调试日志)
 * @param message Log message
 */
inline void debugLog(const std::string& message) {
    if (!g_isDebug) return;
    
    std::string fullMessage = "[" + getTimestamp() + "] [HtmlLayoutParser] " + message;
    
#ifdef __EMSCRIPTEN__
    // Use console.log in browser/worker environment
    EM_ASM({
        console.log(UTF8ToString($0));
    }, fullMessage.c_str());
#else
    // Use stdout in Node.js or native environment
    std::cout << fullMessage << std::endl;
#endif
}

/**
 * @brief Output debug log with stream-style formatting (流式格式化调试日志)
 * @param oss Output string stream containing the message
 */
inline void debugLogStream(const std::ostringstream& oss) {
    debugLog(oss.str());
}

/**
 * @brief Format bytes to human-readable string (格式化字节为可读字符串)
 * @param bytes Number of bytes
 * @return Formatted string (e.g., "1.5MB", "256KB")
 */
inline std::string formatBytes(size_t bytes) {
    std::ostringstream oss;
    if (bytes >= 1024 * 1024) {
        oss << std::fixed << std::setprecision(2) << (bytes / (1024.0 * 1024.0)) << "MB";
    } else if (bytes >= 1024) {
        oss << std::fixed << std::setprecision(2) << (bytes / 1024.0) << "KB";
    } else {
        oss << bytes << "B";
    }
    return oss.str();
}

/**
 * @brief Format duration to human-readable string (格式化时长为可读字符串)
 * @param ms Duration in milliseconds
 * @return Formatted string (e.g., "5.2ms", "1.5s")
 */
inline std::string formatDuration(double ms) {
    std::ostringstream oss;
    if (ms >= 1000) {
        oss << std::fixed << std::setprecision(2) << (ms / 1000.0) << "s";
    } else {
        oss << std::fixed << std::setprecision(2) << ms << "ms";
    }
    return oss.str();
}

} // namespace wasm_litehtml_v2

/**
 * @brief Debug log macro for conditional logging (条件日志宏)
 * 
 * Usage:
 *   DEBUG_LOG("Simple message");
 *   DEBUG_LOG("Value: " << value << ", Count: " << count);
 * 
 * @note Only outputs when g_isDebug is true
 */
#define DEBUG_LOG(msg) \
    do { \
        if (wasm_litehtml_v2::g_isDebug) { \
            std::ostringstream _debug_oss; \
            _debug_oss << msg; \
            wasm_litehtml_v2::debugLog(_debug_oss.str()); \
        } \
    } while(0)

/**
 * @brief Debug log macro for memory usage (内存使用日志宏)
 * 
 * Usage:
 *   DEBUG_LOG_MEMORY(totalBytes, fontCount);
 */
#define DEBUG_LOG_MEMORY(totalBytes, fontCount) \
    do { \
        if (wasm_litehtml_v2::g_isDebug) { \
            std::ostringstream _debug_oss; \
            _debug_oss << "Memory usage: " << wasm_litehtml_v2::formatBytes(totalBytes) \
                       << " (fonts=" << fontCount << ")"; \
            wasm_litehtml_v2::debugLog(_debug_oss.str()); \
        } \
    } while(0)

/**
 * @brief Debug log macro for timing (计时日志宏)
 * 
 * Usage:
 *   DEBUG_LOG_TIMING("HTML parsing", durationMs);
 */
#define DEBUG_LOG_TIMING(phase, durationMs) \
    do { \
        if (wasm_litehtml_v2::g_isDebug) { \
            std::ostringstream _debug_oss; \
            _debug_oss << phase << " completed (time=" \
                       << wasm_litehtml_v2::formatDuration(durationMs) << ")"; \
            wasm_litehtml_v2::debugLog(_debug_oss.str()); \
        } \
    } while(0)

#endif // WASM_V2_DEBUG_LOG_H
