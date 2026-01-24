cmake_minimum_required(VERSION 3.11)

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

# FreeType configuration - using Emscripten ports
set(USE_FREETYPE ON)

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

# litehtml root (allows override via -DLITEHTML_ROOT=... or env)
if(NOT DEFINED LITEHTML_ROOT)
    if(DEFINED ENV{LITEHTML_ROOT})
        set(LITEHTML_ROOT "$ENV{LITEHTML_ROOT}")
    else()
        set(_third_party_root "${CMAKE_CURRENT_SOURCE_DIR}/../third_party/litehtml")
        set(_lib_root "${CMAKE_CURRENT_SOURCE_DIR}/../lib/litehtml")
        set(_local_root "${CMAKE_CURRENT_SOURCE_DIR}/..")
        set(_legacy_root "${CMAKE_CURRENT_SOURCE_DIR}/../..")
        if(EXISTS "${_third_party_root}/src/gumbo" AND EXISTS "${_third_party_root}/include")
            set(LITEHTML_ROOT "${_third_party_root}")
        elseif(EXISTS "${_lib_root}/src/gumbo" AND EXISTS "${_lib_root}/include")
            set(LITEHTML_ROOT "${_lib_root}")
        elseif(EXISTS "${_local_root}/src/gumbo" AND EXISTS "${_local_root}/include")
            set(LITEHTML_ROOT "${_local_root}")
        elseif(EXISTS "${_legacy_root}/src/gumbo" AND EXISTS "${_legacy_root}/include")
            set(LITEHTML_ROOT "${_legacy_root}")
        else()
            set(LITEHTML_ROOT "${_third_party_root}")
        endif()
    endif()
endif()

# Gumbo source files
set(GUMBO_DIR ${LITEHTML_ROOT}/src/gumbo)
set(SOURCE_GUMBO
    ${GUMBO_DIR}/attribute.c
    ${GUMBO_DIR}/char_ref.c
    ${GUMBO_DIR}/error.c
    ${GUMBO_DIR}/parser.c
    ${GUMBO_DIR}/string_buffer.c
    ${GUMBO_DIR}/string_piece.c
    ${GUMBO_DIR}/tag.c
    ${GUMBO_DIR}/tokenizer.c
    ${GUMBO_DIR}/utf8.c
    ${GUMBO_DIR}/util.c
    ${GUMBO_DIR}/vector.c
)

# litehtml source files
set(LITEHTML_DIR ${LITEHTML_ROOT}/src)
set(SOURCE_LITEHTML
    ${LITEHTML_DIR}/codepoint.cpp
    ${LITEHTML_DIR}/css_length.cpp
    ${LITEHTML_DIR}/css_selector.cpp
    ${LITEHTML_DIR}/css_tokenizer.cpp
    ${LITEHTML_DIR}/css_parser.cpp
    ${LITEHTML_DIR}/document.cpp
    ${LITEHTML_DIR}/document_container.cpp
    ${LITEHTML_DIR}/el_anchor.cpp
    ${LITEHTML_DIR}/el_base.cpp
    ${LITEHTML_DIR}/el_before_after.cpp
    ${LITEHTML_DIR}/el_body.cpp
    ${LITEHTML_DIR}/el_break.cpp
    ${LITEHTML_DIR}/el_cdata.cpp
    ${LITEHTML_DIR}/el_comment.cpp
    ${LITEHTML_DIR}/el_div.cpp
    ${LITEHTML_DIR}/element.cpp
    ${LITEHTML_DIR}/el_font.cpp
    ${LITEHTML_DIR}/el_image.cpp
    ${LITEHTML_DIR}/el_link.cpp
    ${LITEHTML_DIR}/el_para.cpp
    ${LITEHTML_DIR}/el_script.cpp
    ${LITEHTML_DIR}/el_space.cpp
    ${LITEHTML_DIR}/el_style.cpp
    ${LITEHTML_DIR}/el_table.cpp
    ${LITEHTML_DIR}/el_td.cpp
    ${LITEHTML_DIR}/el_text.cpp
    ${LITEHTML_DIR}/el_title.cpp
    ${LITEHTML_DIR}/el_tr.cpp
    ${LITEHTML_DIR}/encodings.cpp
    ${LITEHTML_DIR}/html.cpp
    ${LITEHTML_DIR}/html_tag.cpp
    ${LITEHTML_DIR}/html_microsyntaxes.cpp
    ${LITEHTML_DIR}/iterators.cpp
    ${LITEHTML_DIR}/media_query.cpp
    ${LITEHTML_DIR}/style.cpp
    ${LITEHTML_DIR}/stylesheet.cpp
    ${LITEHTML_DIR}/table.cpp
    ${LITEHTML_DIR}/tstring_view.cpp
    ${LITEHTML_DIR}/url.cpp
    ${LITEHTML_DIR}/url_path.cpp
    ${LITEHTML_DIR}/utf8_strings.cpp
    ${LITEHTML_DIR}/web_color.cpp
    ${LITEHTML_DIR}/num_cvt.cpp
    ${LITEHTML_DIR}/strtod.cpp
    ${LITEHTML_DIR}/string_id.cpp
    ${LITEHTML_DIR}/css_properties.cpp
    ${LITEHTML_DIR}/line_box.cpp
    ${LITEHTML_DIR}/css_borders.cpp
    ${LITEHTML_DIR}/render_item.cpp
    ${LITEHTML_DIR}/render_block_context.cpp
    ${LITEHTML_DIR}/render_block.cpp
    ${LITEHTML_DIR}/render_inline_context.cpp
    ${LITEHTML_DIR}/render_table.cpp
    ${LITEHTML_DIR}/render_flex.cpp
    ${LITEHTML_DIR}/render_image.cpp
    ${LITEHTML_DIR}/formatting_context.cpp
    ${LITEHTML_DIR}/flex_item.cpp
    ${LITEHTML_DIR}/flex_line.cpp
    ${LITEHTML_DIR}/background.cpp
    ${LITEHTML_DIR}/gradient.cpp
)

# WASM v2 module source files
set(SOURCE_WASM_V2
    html_layout_parser.cpp
    multi_font_manager.cpp
    wasm_container.cpp
    json_serializer.cpp
    debug_log.cpp
    font_metrics_cache.cpp
)

# Create executable (Emscripten will generate .wasm and .js)
add_executable(${PROJECT_NAME}
    ${SOURCE_GUMBO}
    ${SOURCE_LITEHTML}
    ${SOURCE_WASM_V2}
)

# Include directories
target_include_directories(${PROJECT_NAME} PRIVATE
    ${LITEHTML_ROOT}/include
    ${LITEHTML_ROOT}/include/litehtml
    ${LITEHTML_DIR}
    ${GUMBO_DIR}/include
    ${GUMBO_DIR}/include/gumbo
)

# Add FreeType include directories for Emscripten port
if(USE_FREETYPE)
    target_include_directories(${PROJECT_NAME} PRIVATE
        ${EMSCRIPTEN_ROOT_PATH}/cache/sysroot/include/freetype2
    )
endif()

# Emscripten compile options
set_target_properties(${PROJECT_NAME} PROPERTIES
    SUFFIX ".js"
)

# Build optimization and exception flags
if(ENABLE_EXCEPTIONS)
    set(EXCEPTION_COMPILE_FLAG "-fexceptions")
    set(EXCEPTION_LINK_FLAG "SHELL:-s DISABLE_EXCEPTION_CATCHING=0")
else()
    set(EXCEPTION_COMPILE_FLAG "-fno-exceptions")
    set(EXCEPTION_LINK_FLAG "SHELL:-s DISABLE_EXCEPTION_CATCHING=1")
endif()

# Common Emscripten link options
set(COMMON_LINK_OPTIONS
    # Use FreeType port
    "SHELL:-s USE_FREETYPE=1"
    # Exported functions (v2 API)
    "SHELL:-s EXPORTED_FUNCTIONS=['_loadFont','_unloadFont','_setDefaultFont','_getLoadedFonts','_clearAllFonts','_parseHTML','_parseHTMLWithDiagnostics','_getLastParseResult','_freeString','_getVersion','_getMetrics','_getDetailedMetrics','_getTotalMemoryUsage','_checkMemoryThreshold','_getMemoryMetrics','_destroy','_setDebugMode','_getDebugMode','_getCacheStats','_resetCacheStats','_clearCache','_malloc','_free']"
    # Exported runtime methods
    "SHELL:-s EXPORTED_RUNTIME_METHODS=['ccall','cwrap','UTF8ToString','stringToUTF8','lengthBytesUTF8','HEAPU8']"
    # Allow memory growth
    "SHELL:-s ALLOW_MEMORY_GROWTH=1"
    # Initial memory size (16MB)
    "SHELL:-s INITIAL_MEMORY=16777216"
    # Environment settings - support web and node
    "SHELL:-s ENVIRONMENT='web,node'"
    # Disable filesystem (not needed)
    "SHELL:-s FILESYSTEM=0"
    # Disable assertions for release builds
    "SHELL:-s ASSERTIONS=0"
    # Exception handling
    ${EXCEPTION_LINK_FLAG}
    ${EXCEPTION_COMPILE_FLAG}
    # Optimization level
    -${OPTIMIZATION_LEVEL}
)

# Add link options for original target
target_link_options(${PROJECT_NAME} PRIVATE
    ${COMMON_LINK_OPTIONS}
)

# Create ESM version
add_executable(${PROJECT_NAME}_esm
    ${SOURCE_GUMBO}
    ${SOURCE_LITEHTML}
    ${SOURCE_WASM_V2}
)

target_include_directories(${PROJECT_NAME}_esm PRIVATE
    ${LITEHTML_ROOT}/include
    ${LITEHTML_ROOT}/include/litehtml
    ${LITEHTML_DIR}
    ${GUMBO_DIR}/include
    ${GUMBO_DIR}/include/gumbo
)

# Add FreeType include directories for ESM target
if(USE_FREETYPE)
    target_include_directories(${PROJECT_NAME}_esm PRIVATE
        ${EMSCRIPTEN_ROOT_PATH}/cache/sysroot/include/freetype2
    )
endif()

set_target_properties(${PROJECT_NAME}_esm PROPERTIES
    SUFFIX ".mjs"
    OUTPUT_NAME "html_layout_parser_esm"
)

target_link_options(${PROJECT_NAME}_esm PRIVATE
    ${COMMON_LINK_OPTIONS}
    # Modular output
    "SHELL:-s MODULARIZE=1"
    # Export name
    "SHELL:-s EXPORT_NAME='createHtmlLayoutParserModule'"
    # ES6 module format
    "SHELL:-s EXPORT_ES6=1"
    # ES6 module format (USE_ES6_IMPORT_META is deprecated)
)

# Create CommonJS version
add_executable(${PROJECT_NAME}_cjs
    ${SOURCE_GUMBO}
    ${SOURCE_LITEHTML}
    ${SOURCE_WASM_V2}
)

target_include_directories(${PROJECT_NAME}_cjs PRIVATE
    ${LITEHTML_ROOT}/include
    ${LITEHTML_ROOT}/include/litehtml
    ${LITEHTML_DIR}
    ${GUMBO_DIR}/include
    ${GUMBO_DIR}/include/gumbo
)

# Add FreeType include directories for CJS target
if(USE_FREETYPE)
    target_include_directories(${PROJECT_NAME}_cjs PRIVATE
        ${EMSCRIPTEN_ROOT_PATH}/cache/sysroot/include/freetype2
    )
endif()

set_target_properties(${PROJECT_NAME}_cjs PROPERTIES
    SUFFIX ".js"
    OUTPUT_NAME "html_layout_parser_cjs"
)

target_link_options(${PROJECT_NAME}_cjs PRIVATE
    ${COMMON_LINK_OPTIONS}
    # Modular output
    "SHELL:-s MODULARIZE=1"
    # Export name
    "SHELL:-s EXPORT_NAME='createHtmlLayoutParserModule'"
    # CommonJS format (default)
)

# Add LTO flag separately if enabled for both targets
if(ENABLE_LTO)
    target_link_options(${PROJECT_NAME}_esm PRIVATE -flto)
    target_compile_options(${PROJECT_NAME}_esm PRIVATE -flto)
    target_link_options(${PROJECT_NAME}_cjs PRIVATE -flto)
    target_compile_options(${PROJECT_NAME}_cjs PRIVATE -flto)
endif()

# Compile options for both targets
foreach(target ${PROJECT_NAME}_esm ${PROJECT_NAME}_cjs ${PROJECT_NAME})
    target_compile_options(${target} PRIVATE
        -${OPTIMIZATION_LEVEL}
        -Wall
        "SHELL:-s USE_FREETYPE=1"
        ${EXCEPTION_COMPILE_FLAG}
    )
endforeach()

# Print build configuration summary
message(STATUS "=== Build Configuration ===")
message(STATUS "Build Type: ${CMAKE_BUILD_TYPE}")
message(STATUS "Minimal Build: ${BUILD_MINIMAL}")
message(STATUS "Optimization: -${OPTIMIZATION_LEVEL}")
message(STATUS "LTO Enabled: ${ENABLE_LTO}")
message(STATUS "Exceptions: ${ENABLE_EXCEPTIONS}")
