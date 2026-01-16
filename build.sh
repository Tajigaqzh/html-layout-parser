#!/bin/bash

# WASM v2.0 Build Script
# Compiles litehtml HTML Layout Parser v2.0 to WebAssembly
#
# Usage:
#   ./build.sh               # Build full version optimized for speed (-O3)
#   ./build.sh --size        # Build full version optimized for size (-Oz)
#   ./build.sh --minimal     # Build minimal version with -Oz
#   ./build.sh --performance # Build full version optimized for speed (-O3)
#   ./build.sh --debug      # Build with -O2 and debug info
#   ./build.sh --clean      # Clean build directory first

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${SCRIPT_DIR}/build"
OUTPUT_DIR="${SCRIPT_DIR}/wasm-output"
SRC_DIR="${SCRIPT_DIR}/src"

# Default build options
BUILD_MINIMAL="OFF"
OPTIMIZATION_LEVEL="O3"
ENABLE_LTO="ON"
ENABLE_EXCEPTIONS="ON"  # Required by litehtml
CLEAN_BUILD="OFF"
RUN_WASM_OPT="OFF"
WASM_OPT_LEVEL="Oz"
WASM_OPT_FLAGS="--enable-threads --enable-bulk-memory --enable-nontrapping-float-to-int"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --size)
            OPTIMIZATION_LEVEL="Oz"
            RUN_WASM_OPT="ON"
            shift
            ;;
        --performance)
            OPTIMIZATION_LEVEL="O3"
            RUN_WASM_OPT="OFF"
            shift
            ;;
        --minimal)
            BUILD_MINIMAL="ON"
            OPTIMIZATION_LEVEL="Oz"
            RUN_WASM_OPT="ON"
            shift
            ;;
        --debug)
            OPTIMIZATION_LEVEL="O2"
            ENABLE_LTO="OFF"
            RUN_WASM_OPT="OFF"
            shift
            ;;
        --clean)
            CLEAN_BUILD="ON"
            shift
            ;;
        --no-wasm-opt)
            RUN_WASM_OPT="OFF"
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --size       Build full version optimized for size (-Oz)"
            echo "  --minimal    Build minimal version (smaller size, -Oz)"
            echo "  --performance Build full version optimized for speed (-O3)"
            echo "  --debug      Build debug version (-O2, no LTO)"
            echo "  --clean      Clean build directory before building"
            echo "  --no-wasm-opt Skip wasm-opt post-processing"
            echo "  --help       Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "=== HTML Layout Parser v2.0 WASM Build Script ==="
echo ""
echo "Build Configuration:"
echo "  Minimal Build: ${BUILD_MINIMAL}"
echo "  Optimization:  -${OPTIMIZATION_LEVEL}"
echo "  LTO Enabled:   ${ENABLE_LTO}"
echo "  Exceptions:    ${ENABLE_EXCEPTIONS}"
echo "  WASM Opt:      ${RUN_WASM_OPT} (-${WASM_OPT_LEVEL})"
echo ""

# Check if Emscripten is available
if ! command -v emcmake &> /dev/null; then
    echo "Error: emcmake not found. Please ensure Emscripten SDK is installed and activated."
    echo "Installation guide: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

# Clean build directory if requested
if [ "${CLEAN_BUILD}" = "ON" ]; then
    echo "Cleaning build directory..."
    rm -rf "${BUILD_DIR}"
fi

# Create build directory
echo "Creating build directory: ${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"

# Enter build directory
cd "${BUILD_DIR}"

# Run CMake configuration
echo "Running CMake configuration..."
emcmake cmake "${SRC_DIR}" \
    -DCMAKE_BUILD_TYPE=Release \
    -DBUILD_MINIMAL="${BUILD_MINIMAL}" \
    -DOPTIMIZATION_LEVEL="${OPTIMIZATION_LEVEL}" \
    -DENABLE_LTO="${ENABLE_LTO}" \
    -DENABLE_EXCEPTIONS="${ENABLE_EXCEPTIONS}"

# Compile
echo ""
echo "Compiling WASM module..."
emmake make -j$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)

echo ""
echo "=== Build Complete ==="
echo ""

# Create output directory and copy final files
mkdir -p "${OUTPUT_DIR}"
cp "${BUILD_DIR}/html_layout_parser.js" "${OUTPUT_DIR}/"
cp "${BUILD_DIR}/html_layout_parser.wasm" "${OUTPUT_DIR}/"

if [ "${RUN_WASM_OPT}" = "ON" ]; then
    WASM_OPT_BIN="${WASM_OPT_BIN:-}"
    if [ -n "${WASM_OPT_BIN}" ] && [ -x "${WASM_OPT_BIN}" ]; then
        :
    elif command -v wasm-opt &> /dev/null; then
        WASM_OPT_BIN="$(command -v wasm-opt)"
    elif command -v emcc &> /dev/null; then
        EMSCRIPTEN_ROOT="$(cd "$(dirname "$(command -v emcc)")" && pwd)"
        if [ -x "${EMSCRIPTEN_ROOT}/binaryen/bin/wasm-opt" ]; then
            WASM_OPT_BIN="${EMSCRIPTEN_ROOT}/binaryen/bin/wasm-opt"
        fi
    elif command -v emcmake &> /dev/null; then
        EMSCRIPTEN_ROOT="$(cd "$(dirname "$(command -v emcmake)")" && pwd)"
        if [ -x "${EMSCRIPTEN_ROOT}/binaryen/bin/wasm-opt" ]; then
            WASM_OPT_BIN="${EMSCRIPTEN_ROOT}/binaryen/bin/wasm-opt"
        fi
    fi

    if [ -z "${WASM_OPT_BIN}" ]; then
        for candidate in /opt/homebrew/Cellar/emscripten/*/libexec/binaryen/bin/wasm-opt; do
            if [ -x "${candidate}" ]; then
                WASM_OPT_BIN="${candidate}"
                break
            fi
        done
    fi

    if [ -n "${WASM_OPT_BIN}" ]; then
        echo "Running wasm-opt (-${WASM_OPT_LEVEL})..."
        "${WASM_OPT_BIN}" "-${WASM_OPT_LEVEL}" ${WASM_OPT_FLAGS} \
            -o "${OUTPUT_DIR}/html_layout_parser.wasm.opt" \
            "${OUTPUT_DIR}/html_layout_parser.wasm"
        mv "${OUTPUT_DIR}/html_layout_parser.wasm.opt" "${OUTPUT_DIR}/html_layout_parser.wasm"
    else
        echo "⚠️  wasm-opt not found; skipping post-processing"
    fi
    echo ""
fi

echo "Output files copied to: ${OUTPUT_DIR}"
ls -lh "${OUTPUT_DIR}/html_layout_parser.js" "${OUTPUT_DIR}/html_layout_parser.wasm" 2>/dev/null || true
echo ""

# Show file sizes
WASM_SIZE=$(stat -f%z "${OUTPUT_DIR}/html_layout_parser.wasm" 2>/dev/null || stat -c%s "${OUTPUT_DIR}/html_layout_parser.wasm" 2>/dev/null || echo "0")
JS_SIZE=$(stat -f%z "${OUTPUT_DIR}/html_layout_parser.js" 2>/dev/null || stat -c%s "${OUTPUT_DIR}/html_layout_parser.js" 2>/dev/null || echo "0")

echo "File sizes:"
echo "  WASM: $(echo "scale=2; ${WASM_SIZE}/1024" | bc) KB (${WASM_SIZE} bytes)"
echo "  JS:   $(echo "scale=2; ${JS_SIZE}/1024" | bc) KB (${JS_SIZE} bytes)"
echo ""

# Check against targets
if [ "${BUILD_MINIMAL}" = "ON" ]; then
    TARGET_SIZE=307200  # 300KB
    TARGET_NAME="minimal"
else
    TARGET_SIZE=2097152  # 2MB
    TARGET_NAME="full"
fi

if [ "${WASM_SIZE}" -gt "${TARGET_SIZE}" ]; then
    echo "⚠️  Warning: WASM size (${WASM_SIZE} bytes) exceeds ${TARGET_NAME} target (${TARGET_SIZE} bytes)"
else
    echo "✅ WASM size is within ${TARGET_NAME} target"
fi
