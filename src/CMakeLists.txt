cmake_minimum_required(VERSION 3.14)

project(html_layout_parser LANGUAGES C CXX)

# Emscripten check
if(NOT EMSCRIPTEN)
    message(FATAL_ERROR "This project must be built with Emscripten. Please use emcmake cmake.")
endif()

# C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_C_STANDARD 99)

# ============================================================================
# Build Configuration Options
# ============================================================================

# Build type: FULL (default) or MINIMAL
option(BUILD_MINIMAL "Build minimal version without unused features" OFF)

# Optimization level: O2 (default), O3 (performance), Oz (size)
set(OPTIMIZATION_LEVEL "O3" CACHE STRING "Optimization level: O2, O3, or Oz")

# Enable Link-Time Optimization (recommended for release)
option(ENABLE_LTO "Enable Link-Time Optimization" ON)

# Enable exception handling (required by litehtml)
option(ENABLE_EXCEPTIONS "Enable C++ exception handling" ON)

# FreeType / HarfBuzz: Emscripten official ports, not vendored source
set(USE_FREETYPE ON)

# litehtml: not an Emscripten port. Fetch a pinned tag at configure time
# instead of copying the tree into third_party/. Override with
# -DLITEHTML_SOURCE_DIR=... to use a local checkout.
set(LITEHTML_GIT_REPOSITORY "https://github.com/litehtml/litehtml.git" CACHE STRING
    "litehtml git repository")
set(LITEHTML_GIT_TAG "v0.10" CACHE STRING
    "litehtml git tag or commit")
set(LITEHTML_SOURCE_DIR "" CACHE PATH
    "Optional local litehtml source directory; skips git fetch")

# Define compile definitions based on build type
if(BUILD_MINIMAL)
    add_definitions(
        -DLITEHTML_NO_EXTERNAL_RESOURCES
        -DLITEHTML_STATIC_LAYOUT
    )
    message(STATUS "Building MINIMAL version")
else()
    message(STATUS "Building FULL version")
endif()

if(ENABLE_EXCEPTIONS)
    set(EXCEPTION_COMPILE_FLAG "-fexceptions")
    set(EXCEPTION_LINK_FLAG "SHELL:-s DISABLE_EXCEPTION_CATCHING=0")
else()
    set(EXCEPTION_COMPILE_FLAG "-fno-exceptions")
    set(EXCEPTION_LINK_FLAG "SHELL:-s DISABLE_EXCEPTION_CATCHING=1")
endif()

# ============================================================================
# litehtml (FetchContent, same idea as Emscripten ports: not committed)
# ============================================================================

set(LITEHTML_BUILD_TESTING OFF CACHE BOOL "Disable litehtml tests" FORCE)
set(LITEHTML_ENABLE_LINT OFF CACHE BOOL "Disable litehtml clang-tidy" FORCE)

if(LITEHTML_SOURCE_DIR)
    message(STATUS "Using local litehtml: ${LITEHTML_SOURCE_DIR}")
    add_subdirectory("${LITEHTML_SOURCE_DIR}" "${CMAKE_BINARY_DIR}/litehtml")
else()
    include(FetchContent)
    message(STATUS "Fetching litehtml ${LITEHTML_GIT_TAG}")
    FetchContent_Declare(litehtml
        GIT_REPOSITORY ${LITEHTML_GIT_REPOSITORY}
        GIT_TAG ${LITEHTML_GIT_TAG}
        GIT_SHALLOW TRUE
    )
    FetchContent_MakeAvailable(litehtml)
endif()

foreach(dep litehtml gumbo)
    if(TARGET ${dep})
        target_compile_options(${dep} PRIVATE
            -${OPTIMIZATION_LEVEL}
            ${EXCEPTION_COMPILE_FLAG}
        )
        if(ENABLE_LTO)
            target_compile_options(${dep} PRIVATE -flto)
            target_link_options(${dep} PRIVATE -flto)
        endif()
    endif()
endforeach()

# ============================================================================
# WASM module sources
# ============================================================================

set(SOURCE_WASM_V2
    html_layout_parser.cpp
    multi_font_manager.cpp
    wasm_container.cpp
    json_serializer.cpp
    debug_log.cpp
    font_metrics_cache.cpp
)

set(COMMON_LINK_OPTIONS
    "SHELL:-s USE_FREETYPE=1"
    "SHELL:-s USE_HARFBUZZ=1"
    "SHELL:-s EXPORTED_FUNCTIONS=['_loadFont','_unloadFont','_setDefaultFont','_getLoadedFonts','_clearAllFonts','_parseHTML','_parseHTMLWithDiagnostics','_getLastParseResult','_freeString','_getVersion','_getMetrics','_getDetailedMetrics','_getTotalMemoryUsage','_checkMemoryThreshold','_getMemoryMetrics','_destroy','_setDebugMode','_getDebugMode','_getCacheStats','_resetCacheStats','_clearCache','_malloc','_free']"
    "SHELL:-s EXPORTED_RUNTIME_METHODS=['ccall','cwrap','UTF8ToString','stringToUTF8','lengthBytesUTF8','HEAPU8']"
    "SHELL:-s ALLOW_MEMORY_GROWTH=1"
    "SHELL:-s INITIAL_MEMORY=16777216"
    "SHELL:-s ENVIRONMENT='web,node'"
    "SHELL:-s FILESYSTEM=0"
    "SHELL:-s ASSERTIONS=0"
    ${EXCEPTION_LINK_FLAG}
    ${EXCEPTION_COMPILE_FLAG}
    -${OPTIMIZATION_LEVEL}
)

function(configure_html_layout_parser_target target_name)
    target_link_libraries(${target_name} PRIVATE litehtml)

    if(USE_FREETYPE)
        target_include_directories(${target_name} PRIVATE
            ${EMSCRIPTEN_ROOT_PATH}/cache/sysroot/include/freetype2
            ${EMSCRIPTEN_ROOT_PATH}/cache/sysroot/include/harfbuzz
        )
    endif()

    target_compile_options(${target_name} PRIVATE
        -${OPTIMIZATION_LEVEL}
        -Wall
        "SHELL:-s USE_FREETYPE=1"
        "SHELL:-s USE_HARFBUZZ=1"
        ${EXCEPTION_COMPILE_FLAG}
    )

    if(ENABLE_LTO)
        target_compile_options(${target_name} PRIVATE -flto)
        target_link_options(${target_name} PRIVATE -flto)
    endif()
endfunction()

# Original / legacy JS glue
add_executable(${PROJECT_NAME} ${SOURCE_WASM_V2})
set_target_properties(${PROJECT_NAME} PROPERTIES SUFFIX ".js")
target_link_options(${PROJECT_NAME} PRIVATE ${COMMON_LINK_OPTIONS})
configure_html_layout_parser_target(${PROJECT_NAME})

# ESM glue
add_executable(${PROJECT_NAME}_esm ${SOURCE_WASM_V2})
set_target_properties(${PROJECT_NAME}_esm PROPERTIES
    SUFFIX ".mjs"
    OUTPUT_NAME "html_layout_parser_esm"
)
target_link_options(${PROJECT_NAME}_esm PRIVATE
    ${COMMON_LINK_OPTIONS}
    "SHELL:-s MODULARIZE=1"
    "SHELL:-s EXPORT_NAME='createHtmlLayoutParserModule'"
    "SHELL:-s EXPORT_ES6=1"
)
configure_html_layout_parser_target(${PROJECT_NAME}_esm)

# CommonJS glue
add_executable(${PROJECT_NAME}_cjs ${SOURCE_WASM_V2})
set_target_properties(${PROJECT_NAME}_cjs PROPERTIES
    SUFFIX ".js"
    OUTPUT_NAME "html_layout_parser_cjs"
)
target_link_options(${PROJECT_NAME}_cjs PRIVATE
    ${COMMON_LINK_OPTIONS}
    "SHELL:-s MODULARIZE=1"
    "SHELL:-s EXPORT_NAME='createHtmlLayoutParserModule'"
)
configure_html_layout_parser_target(${PROJECT_NAME}_cjs)

message(STATUS "=== Build Configuration ===")
message(STATUS "Build Type: ${CMAKE_BUILD_TYPE}")
message(STATUS "Minimal Build: ${BUILD_MINIMAL}")
message(STATUS "Optimization: -${OPTIMIZATION_LEVEL}")
message(STATUS "LTO Enabled: ${ENABLE_LTO}")
message(STATUS "Exceptions: ${ENABLE_EXCEPTIONS}")
message(STATUS "litehtml: ${LITEHTML_GIT_TAG}")
