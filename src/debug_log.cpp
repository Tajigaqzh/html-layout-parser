/**
 * @file debug_log.cpp
 * @brief Debug Logging System implementation
 * 
 * @note Requirements: 8.1, 8.2, 8.3, 8.6
 */

#include "debug_log.h"

namespace wasm_litehtml_v2 {

/**
 * @brief Global debug mode flag (全局调试模式标志)
 * 
 * Default is false (no debug output).
 * Set via setDebugMode() function.
 */
bool g_isDebug = false;

} // namespace wasm_litehtml_v2
