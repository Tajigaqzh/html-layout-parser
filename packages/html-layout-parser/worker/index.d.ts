/**
 * HTML Layout Parser v2.0 - TypeScript Type Definitions
 * HTML 布局解析器 v2.0 - TypeScript 类型定义
 *
 * @packageDocumentation
 * @module html-layout-parser
 * @version 2.0.0
 */
/**
 * Error codes for the parser.
 * 解析器错误代码。
 *
 * Error codes are grouped by category:
 * 错误代码按类别分组：
 * - 0: Success / 成功
 * - 1xxx: Input validation errors / 输入验证错误
 * - 2xxx: Font-related errors / 字体相关错误
 * - 3xxx: Parsing errors / 解析错误
 * - 4xxx: Memory errors / 内存错误
 * - 5xxx: Internal errors / 内部错误
 */
declare enum ErrorCode {
    /**
     * Operation completed successfully
     * 操作成功完成
     */
    Success = 0,
    /**
     * Invalid input provided
     * 提供的输入无效
     */
    InvalidInput = 1001,
    /**
     * HTML string is empty
     * HTML 字符串为空
     */
    EmptyHtml = 1002,
    /**
     * Viewport width is invalid (must be > 0)
     * 视口宽度无效（必须 > 0）
     */
    InvalidViewportWidth = 1003,
    /**
     * Output mode is invalid
     * 输出模式无效
     */
    InvalidMode = 1004,
    /**
     * Options object is invalid
     * 选项对象无效
     */
    InvalidOptions = 1005,
    /**
     * HTML content exceeds maximum size limit
     * HTML 内容超过最大大小限制
     */
    HtmlTooLarge = 1006,
    /**
     * No font has been loaded
     * 没有加载任何字体
     */
    FontNotLoaded = 2001,
    /**
     * Failed to load font data
     * 加载字体数据失败
     */
    FontLoadFailed = 2002,
    /**
     * Font data is invalid or corrupted
     * 字体数据无效或已损坏
     */
    FontDataInvalid = 2003,
    /**
     * Font name cannot be empty
     * 字体名称不能为空
     */
    FontNameEmpty = 2004,
    /**
     * Font ID not found in loaded fonts
     * 在已加载的字体中找不到字体 ID
     */
    FontIdNotFound = 2005,
    /**
     * No default font has been set
     * 未设置默认字体
     */
    NoDefaultFont = 2006,
    /**
     * Font memory usage exceeds threshold
     * 字体内存使用超过阈值
     */
    FontMemoryExceeded = 2007,
    /**
     * HTML parsing failed
     * HTML 解析失败
     */
    ParseFailed = 3001,
    /**
     * Failed to create document
     * 创建文档失败
     */
    DocumentCreationFailed = 3002,
    /**
     * Render operation failed
     * 渲染操作失败
     */
    RenderFailed = 3003,
    /**
     * Layout calculation failed
     * 布局计算失败
     */
    LayoutFailed = 3004,
    /**
     * CSS parsing error
     * CSS 解析错误
     */
    CssParseError = 3005,
    /**
     * Memory allocation failed
     * 内存分配失败
     */
    MemoryAllocationFailed = 4001,
    /**
     * Memory limit exceeded
     * 超过内存限制
     */
    MemoryLimitExceeded = 4002,
    /**
     * Internal error occurred
     * 发生内部错误
     */
    InternalError = 5001,
    /**
     * JSON serialization failed
     * JSON 序列化失败
     */
    SerializationFailed = 5002,
    /**
     * Unknown error
     * 未知错误
     */
    UnknownError = 5999
}
/**
 * Error severity levels
 * 错误严重级别
 */
type ErrorSeverity = 'error' | 'warning' | 'info';
/**
 * Parse error information
 * 解析错误信息
 */
interface ParseError {
    /**
     * Error code
     * 错误代码
     */
    code: ErrorCode | string;
    /**
     * Error message
     * 错误消息
     */
    message: string;
    /**
     * Error severity level
     * 错误严重级别
     */
    severity: ErrorSeverity;
    /**
     * Line number where error occurred (optional)
     * 错误发生的行号（可选）
     */
    line?: number;
    /**
     * Column number where error occurred (optional)
     * 错误发生的列号（可选）
     */
    column?: number;
    /**
     * Additional context about the error (optional)
     * 关于错误的附加上下文（可选）
     */
    context?: string;
}
/**
 * Performance metrics from parsing operation
 * 解析操作的性能指标
 */
interface PerformanceMetrics {
    /**
     * Time spent parsing HTML (ms)
     * HTML 解析耗时（毫秒）
     */
    parseTime: number;
    /**
     * Time spent calculating layout (ms)
     * 布局计算耗时（毫秒）
     */
    layoutTime: number;
    /**
     * Time spent serializing to JSON (ms)
     * JSON 序列化耗时（毫秒）
     */
    serializeTime: number;
    /**
     * Total processing time (ms)
     * 总处理时间（毫秒）
     */
    totalTime: number;
    /**
     * Number of characters processed
     * 处理的字符数
     */
    characterCount: number;
    /**
     * Size of input HTML in bytes
     * 输入 HTML 的字节大小
     */
    inputSize: number;
    /**
     * Processing speed (characters per second)
     * 处理速度（字符/秒）
     */
    charsPerSecond: number;
    /**
     * Memory usage information
     * 内存使用信息
     */
    memory: {
        /**
         * Total font memory usage in bytes
         * 字体总内存使用量（字节）
         */
        totalFontMemory: number;
        /**
         * Number of loaded fonts
         * 已加载的字体数量
         */
        fontCount: number;
        /**
         * Whether memory exceeds 50MB threshold
         * 内存是否超过 50MB 阈值
         */
        exceedsThreshold: boolean;
    };
}
/**
 * Parse result with diagnostics
 * 带诊断信息的解析结果
 */
interface ParseResultWithDiagnostics<T = unknown> {
    /**
     * Whether parsing was successful
     * 解析是否成功
     */
    success: boolean;
    /**
     * Parsed data (if successful)
     * 解析的数据（如果成功）
     */
    data?: T;
    /**
     * List of errors (if any)
     * 错误列表（如果有）
     */
    errors?: ParseError[];
    /**
     * List of warnings (if any)
     * 警告列表（如果有）
     */
    warnings?: ParseError[];
    /**
     * Performance metrics (if enabled)
     * 性能指标（如果启用）
     */
    metrics?: PerformanceMetrics;
}
/**
 * Font load result
 * 字体加载结果
 */
interface FontLoadResult {
    /**
     * Whether font loading was successful
     * 字体加载是否成功
     */
    success: boolean;
    /**
     * Font ID (positive on success, 0 on failure)
     * 字体 ID（成功时为正数，失败时为 0）
     */
    fontId: number;
    /**
     * Error code (if failed)
     * 错误代码（如果失败）
     */
    errorCode?: ErrorCode | string;
    /**
     * Error message (if failed)
     * 错误消息（如果失败）
     */
    errorMessage?: string;
}
/**
 * Text decoration information
 * 文本装饰信息
 */
interface TextDecoration {
    /**
     * Whether underline is applied
     * 是否应用下划线
     */
    underline: boolean;
    /**
     * Whether overline is applied
     * 是否应用上划线
     */
    overline: boolean;
    /**
     * Whether line-through (strikethrough) is applied
     * 是否应用删除线
     */
    lineThrough: boolean;
    /**
     * Decoration line color (#RRGGBBAA format)
     * 装饰线颜色（#RRGGBBAA 格式）
     */
    color: string;
    /**
     * Decoration line style
     * 装饰线样式
     */
    style: string;
    /**
     * Decoration line thickness in pixels
     * 装饰线粗细（像素）
     */
    thickness: number;
}
/**
 * Transform information
 * 变换信息
 */
interface Transform {
    /**
     * Horizontal scale factor
     * 水平缩放因子
     */
    scaleX: number;
    /**
     * Vertical scale factor
     * 垂直缩放因子
     */
    scaleY: number;
    /**
     * Horizontal skew angle in degrees
     * 水平倾斜角度（度）
     */
    skewX: number;
    /**
     * Vertical skew angle in degrees
     * 垂直倾斜角度（度）
     */
    skewY: number;
    /**
     * Rotation angle in degrees
     * 旋转角度（度）
     */
    rotate: number;
}
/**
 * Character layout information - contains all data needed for Canvas rendering
 * 字符布局信息 - 包含 Canvas 渲染所需的所有数据
 *
 * @example
 * ```typescript
 * const char: CharLayout = {
 *   character: 'A',
 *   x: 10,
 *   y: 20,
 *   width: 12,
 *   height: 16,
 *   baseline: 32,
 *   fontFamily: 'Arial',
 *   fontSize: 16,
 *   fontWeight: 400,
 *   fontStyle: 'normal',
 *   color: '#000000FF',
 *   backgroundColor: '#00000000',
 *   opacity: 1,
 *   // ... other properties
 * };
 * ```
 */
interface CharLayout {
    /**
     * The character
     * 字符
     */
    character: string;
    /**
     * X position in pixels
     * X 坐标（像素）
     */
    x: number;
    /**
     * Y position in pixels
     * Y 坐标（像素）
     */
    y: number;
    /**
     * Character width in pixels
     * 字符宽度（像素）
     */
    width: number;
    /**
     * Character height in pixels
     * 字符高度（像素）
     */
    height: number;
    /**
     * Font family name
     * 字体族名称
     */
    fontFamily: string;
    /**
     * Font size in pixels
     * 字体大小（像素）
     */
    fontSize: number;
    /**
     * Font weight (100-900)
     * 字体粗细（100-900）
     */
    fontWeight: number;
    /**
     * Font style ('normal', 'italic', 'oblique')
     * 字体样式（'normal'、'italic'、'oblique'）
     */
    fontStyle: string;
    /**
     * Text color (#RRGGBBAA format)
     * 文本颜色（#RRGGBBAA 格式）
     */
    color: string;
    /**
     * Background color (#RRGGBBAA format)
     * 背景颜色（#RRGGBBAA 格式）
     */
    backgroundColor: string;
    /**
     * Opacity (0-1)
     * 不透明度（0-1）
     */
    opacity: number;
    /**
     * Text decoration information
     * 文本装饰信息
     */
    textDecoration: TextDecoration;
    /**
     * Letter spacing in pixels
     * 字间距（像素）
     */
    letterSpacing: number;
    /**
     * Word spacing in pixels
     * 词间距（像素）
     */
    wordSpacing: number;
    /**
     * CSS transform information
     * CSS 变换信息
     */
    transform: Transform;
    /**
     * Baseline Y position in pixels (for accurate text rendering)
     * 基线 Y 坐标（像素，用于精确文本渲染）
     */
    baseline: number;
    /**
     * Text direction ('ltr' or 'rtl')
     * 文本方向（'ltr' 或 'rtl'）
     */
    direction: string;
    /**
     * Font ID used for this character
     * 此字符使用的字体 ID
     */
    fontId: number;
}
/**
 * Viewport information
 * 视口信息
 */
interface Viewport {
    /**
     * Viewport width in pixels
     * 视口宽度（像素）
     */
    width: number;
    /**
     * Viewport height in pixels
     * 视口高度（像素）
     */
    height: number;
}
/**
 * Box spacing (margin/padding)
 * 盒模型间距（外边距/内边距）
 */
interface BoxSpacing {
    /**
     * Top spacing in pixels
     * 顶部间距（像素）
     */
    top: number;
    /**
     * Right spacing in pixels
     * 右侧间距（像素）
     */
    right: number;
    /**
     * Bottom spacing in pixels
     * 底部间距（像素）
     */
    bottom: number;
    /**
     * Left spacing in pixels
     * 左侧间距（像素）
     */
    left: number;
}
/**
 * Run structure - group of characters with same styling
 * 运行段结构 - 具有相同样式的字符组
 */
interface Run {
    /**
     * Run index within the line
     * 行内运行段索引
     */
    runIndex: number;
    /**
     * X position of the run
     * 运行段的 X 坐标
     */
    x: number;
    /**
     * Font family for this run
     * 此运行段的字体族
     */
    fontFamily: string;
    /**
     * Font size for this run
     * 此运行段的字体大小
     */
    fontSize: number;
    /**
     * Font weight for this run
     * 此运行段的字体粗细
     */
    fontWeight: number;
    /**
     * Font style for this run
     * 此运行段的字体样式
     */
    fontStyle: string;
    /**
     * Text color for this run
     * 此运行段的文本颜色
     */
    color: string;
    /**
     * Background color for this run
     * 此运行段的背景颜色
     */
    backgroundColor: string;
    /**
     * Text decoration for this run
     * 此运行段的文本装饰
     */
    textDecoration: TextDecoration;
    /**
     * Characters in this run
     * 此运行段中的字符
     */
    characters: CharLayout[];
}
/**
 * Line structure
 * 行结构
 */
interface Line {
    /**
     * Line index within the block
     * 块内行索引
     */
    lineIndex: number;
    /**
     * Y position of the line top
     * 行顶部的 Y 坐标
     */
    y: number;
    /**
     * Baseline Y position
     * 基线 Y 坐标
     */
    baseline: number;
    /**
     * Line height in pixels
     * 行高（像素）
     */
    height: number;
    /**
     * Line width in pixels
     * 行宽（像素）
     */
    width: number;
    /**
     * Text alignment ('left', 'center', 'right', 'justify')
     * 文本对齐方式（'left'、'center'、'right'、'justify'）
     */
    textAlign: string;
    /**
     * Runs in this line (for full mode)
     * 此行中的运行段（完整模式）
     */
    runs?: Run[];
    /**
     * Characters in this line (for simple mode)
     * 此行中的字符（简化模式）
     */
    characters?: CharLayout[];
}
/**
 * Block structure
 * 块结构
 */
interface Block {
    /**
     * Block index within the page
     * 页面内块索引
     */
    blockIndex: number;
    /**
     * Block type ('paragraph', 'heading', 'list', 'table', 'div', etc.)
     * 块类型（'paragraph'、'heading'、'list'、'table'、'div' 等）
     */
    type: string;
    /**
     * X position of the block
     * 块的 X 坐标
     */
    x: number;
    /**
     * Y position of the block
     * 块的 Y 坐标
     */
    y: number;
    /**
     * Block width in pixels
     * 块宽度（像素）
     */
    width: number;
    /**
     * Block height in pixels
     * 块高度（像素）
     */
    height: number;
    /**
     * Block margin
     * 块外边距
     */
    margin: BoxSpacing;
    /**
     * Block padding
     * 块内边距
     */
    padding: BoxSpacing;
    /**
     * Block background color
     * 块背景颜色
     */
    backgroundColor: string;
    /**
     * Block border radius in pixels
     * 块边框圆角（像素）
     */
    borderRadius: number;
    /**
     * Lines in this block
     * 此块中的行
     */
    lines: Line[];
}
/**
 * Page structure
 * 页面结构
 */
interface Page {
    /**
     * Page index
     * 页面索引
     */
    pageIndex: number;
    /**
     * Page width in pixels
     * 页面宽度（像素）
     */
    width: number;
    /**
     * Page height in pixels
     * 页面高度（像素）
     */
    height: number;
    /**
     * Blocks in this page
     * 此页面中的块
     */
    blocks: Block[];
}
/**
 * Layout Document structure - full mode output
 * 布局文档结构 - 完整模式输出
 *
 * @example
 * ```typescript
 * const doc = parser.parse<'full'>(html, { viewportWidth: 800, mode: 'full' });
 * for (const page of doc.pages) {
 *   for (const block of page.blocks) {
 *     console.log(`Block: ${block.type}`);
 *   }
 * }
 * ```
 */
interface LayoutDocument {
    /**
     * Format version
     * 格式版本
     */
    version: string;
    /**
     * Parser version
     * 解析器版本
     */
    parserVersion: string;
    /**
     * Viewport information
     * 视口信息
     */
    viewport: Viewport;
    /**
     * Pages in the document
     * 文档中的页面
     */
    pages: Page[];
}
/**
 * Simple mode output structure
 * 简化模式输出结构
 */
interface SimpleOutput {
    /**
     * Format version
     * 格式版本
     */
    version: string;
    /**
     * Viewport information
     * 视口信息
     */
    viewport: Viewport;
    /**
     * Lines in the document
     * 文档中的行
     */
    lines: Line[];
}
/**
 * Row structure - for byRow mode (v1 compatible)
 * 行结构 - 用于 byRow 模式（v1 兼容）
 */
interface Row {
    /**
     * Row index
     * 行索引
     */
    rowIndex: number;
    /**
     * Y position of the row
     * 行的 Y 坐标
     */
    y: number;
    /**
     * Characters in this row
     * 此行中的字符
     */
    children: CharLayout[];
}
/**
 * Font information
 * 字体信息
 */
interface FontInfo {
    /**
     * Font ID
     * 字体 ID
     */
    id: number;
    /**
     * Font name
     * 字体名称
     */
    name: string;
    /**
     * Memory usage in bytes
     * 内存使用量（字节）
     */
    memoryUsage: number;
}
/**
 * Memory metrics
 * 内存指标
 */
interface MemoryMetrics {
    /**
     * Total memory usage in bytes
     * 总内存使用量（字节）
     */
    totalMemoryUsage: number;
    /**
     * Number of loaded fonts
     * 已加载的字体数量
     */
    fontCount: number;
    /**
     * Information about each loaded font
     * 每个已加载字体的信息
     */
    fonts: FontInfo[];
}
/**
 * Output mode for parsing
 * 解析输出模式
 *
 * - 'flat': Flat array of characters (fastest) / 扁平字符数组（最快）
 * - 'byRow': Characters grouped by row / 按行分组的字符
 * - 'simple': Lines with characters / 带字符的行结构
 * - 'full': Complete hierarchy / 完整层级结构
 */
type OutputMode = 'full' | 'simple' | 'flat' | 'byRow';
/**
 * Parse options for HTML parsing
 * HTML 解析选项
 *
 * @example
 * ```typescript
 * const options: ParseOptions = {
 *   viewportWidth: 800,
 *   viewportHeight: 600,
 *   mode: 'full',
 *   css: '.title { color: red; }',
 *   isDebug: true
 * };
 * ```
 */
interface ParseOptions {
    /**
     * Viewport width in pixels (required)
     * 视口宽度（像素，必需）
     */
    viewportWidth: number;
    /**
     * Viewport height in pixels (optional)
     * 视口高度（像素，可选）
     */
    viewportHeight?: number;
    /**
     * Output mode (default: 'flat')
     * 输出模式（默认：'flat'）
     */
    mode?: OutputMode;
    /**
     * Default font ID for fallback
     * 默认字体 ID（用于回退）
     */
    defaultFontId?: number;
    /**
     * Enable performance metrics collection
     * 启用性能指标收集
     */
    enableMetrics?: boolean;
    /**
     * Maximum number of characters to process
     * 最大处理字符数
     */
    maxCharacters?: number;
    /**
     * Timeout in milliseconds
     * 超时时间（毫秒）
     */
    timeout?: number;
    /**
     * External CSS string to apply
     * 要应用的外部 CSS 字符串
     */
    css?: string;
    /**
     * Enable debug logging (default: false)
     * 启用调试日志（默认：false）
     *
     * When enabled, outputs detailed logs at key stages:
     * 启用时，在关键阶段输出详细日志：
     * - Font loading/unloading / 字体加载/卸载
     * - HTML parsing / HTML 解析
     * - CSS parsing / CSS 解析
     * - Layout calculation / 布局计算
     * - Serialization / 序列化
     * - Memory usage / 内存使用
     */
    isDebug?: boolean;
}
/**
 * Parse result type based on output mode
 * 基于输出模式的解析结果类型
 */
type ParseResult<T extends OutputMode = 'flat'> = T extends 'full' ? LayoutDocument : T extends 'simple' ? SimpleOutput : T extends 'byRow' ? Row[] : CharLayout[];
/**
 * Runtime environment type
 * 运行时环境类型
 *
 * - 'web': Web browser environment / Web 浏览器环境
 * - 'worker': Web Worker environment / Web Worker 环境
 * - 'node': Node.js environment / Node.js 环境
 * - 'unknown': Unknown environment / 未知环境
 */
type Environment = 'web' | 'worker' | 'node' | 'unknown';
/**
 * Emscripten module interface for HTML Layout Parser v2.0
 * HTML 布局解析器 v2.0 的 Emscripten 模块接口
 *
 * @internal This interface is for internal use only
 * @internal 此接口仅供内部使用
 */
interface HtmlLayoutParserModule {
    /**
     * Allocate memory in WASM heap
     * 在 WASM 堆中分配内存
     */
    _malloc(size: number): number;
    /**
     * Free memory in WASM heap
     * 释放 WASM 堆中的内存
     */
    _free(ptr: number): void;
    /**
     * WASM heap as Uint8Array
     * WASM 堆（Uint8Array 形式）
     */
    HEAPU8: Uint8Array;
    /**
     * Get UTF-8 byte length of a string
     * 获取字符串的 UTF-8 字节长度
     */
    lengthBytesUTF8(str: string): number;
    /**
     * Write string to WASM memory as UTF-8
     * 将字符串以 UTF-8 格式写入 WASM 内存
     */
    stringToUTF8(str: string, ptr: number, maxBytes: number): void;
    /**
     * Read UTF-8 string from WASM memory
     * 从 WASM 内存读取 UTF-8 字符串
     */
    UTF8ToString(ptr: number): string;
    /**
     * Load font from binary data
     * 从二进制数据加载字体
     */
    _loadFont(fontDataPtr: number, fontDataSize: number, fontNamePtr: number): number;
    /**
     * Unload font by ID
     * 按 ID 卸载字体
     */
    _unloadFont(fontId: number): void;
    /**
     * Set default font for fallback
     * 设置默认字体（用于回退）
     */
    _setDefaultFont(fontId: number): void;
    /**
     * Get list of loaded fonts as JSON
     * 获取已加载字体列表（JSON 格式）
     */
    _getLoadedFonts(): number;
    /**
     * Clear all loaded fonts
     * 清空所有已加载的字体
     */
    _clearAllFonts(): void;
    /**
     * Parse HTML and return character layouts
     * 解析 HTML 并返回字符布局
     */
    _parseHTML(htmlPtr: number, cssPtr: number, viewportWidth: number, modePtr: number, optionsPtr: number): number;
    /**
     * Parse HTML with full diagnostics
     * 解析 HTML 并返回完整诊断信息
     */
    _parseHTMLWithDiagnostics(htmlPtr: number, cssPtr: number, viewportWidth: number, modePtr: number, optionsPtr: number): number;
    /**
     * Get last parse result with diagnostics
     * 获取上次解析结果（带诊断信息）
     */
    _getLastParseResult(): number;
    /**
     * Free string allocated by C++
     * 释放 C++ 分配的字符串
     */
    _freeString(ptr: number): void;
    /**
     * Destroy parser and release all resources
     * 销毁解析器并释放所有资源
     */
    _destroy(): void;
    /**
     * Get total memory usage in bytes
     * 获取总内存使用量（字节）
     */
    _getTotalMemoryUsage(): number;
    /**
     * Check if memory exceeds 50MB threshold
     * 检查内存是否超过 50MB 阈值
     */
    _checkMemoryThreshold(): number;
    /**
     * Get detailed memory metrics as JSON
     * 获取详细内存指标（JSON 格式）
     */
    _getMemoryMetrics(): number;
    /**
     * Get parser version
     * 获取解析器版本
     */
    _getVersion(): number;
    /**
     * Get memory metrics
     * 获取内存指标
     */
    _getMetrics(): number;
    /**
     * Set debug mode on/off
     * 设置调试模式开/关
     */
    _setDebugMode(isDebug: boolean): void;
    /**
     * Get current debug mode state (0 = off, 1 = on)
     * 获取当前调试模式状态（0 = 关，1 = 开）
     */
    _getDebugMode(): number;
}
/**
 * Factory function type for creating the module
 * 创建模块的工厂函数类型
 */
type CreateHtmlLayoutParserModule = (config?: {
    locateFile?: (path: string) => string;
}) => Promise<HtmlLayoutParserModule>;
/**
 * Emscripten module interface (alias for compatibility)
 * Emscripten 模块接口（兼容性别名）
 */
type EmscriptenModule = HtmlLayoutParserModule;
/**
 * Module factory function type
 * 模块工厂函数类型
 */
type ModuleFactory = CreateHtmlLayoutParserModule;

/**
 * HTML Layout Parser v2.0 - Core Parser Class
 * HTML 布局解析器 v2.0 - 核心解析器类
 *
 * @packageDocumentation
 * @module html-layout-parser
 */

/**
 * HTML Layout Parser v2.0 - Main Parser Class
 * HTML 布局解析器 v2.0 - 主解析器类
 *
 * High-level TypeScript API for parsing HTML and calculating character layouts.
 * Supports multi-font management, CSS separation, and multiple output modes.
 * Works in Web, Worker, and Node.js environments.
 *
 * 用于解析 HTML 和计算字符布局的高级 TypeScript API。
 * 支持多字体管理、CSS 分离和多种输出模式。
 * 可在 Web、Worker 和 Node.js 环境中使用。
 *
 * @example Basic Usage / 基本用法
 * ```typescript
 * import { HtmlLayoutParser } from 'html-layout-parser';
 *
 * const parser = new HtmlLayoutParser();
 * await parser.init();
 *
 * const fontId = parser.loadFont(fontData, 'MyFont');
 * parser.setDefaultFont(fontId);
 *
 * const layouts = parser.parse('<div>Hello World</div>', {
 *   viewportWidth: 800
 * });
 *
 * parser.destroy();
 * ```
 */
declare class HtmlLayoutParser$1 {
    protected module: HtmlLayoutParserModule | null;
    protected environment: Environment;
    protected initialized: boolean;
    protected moduleLoader: (() => Promise<HtmlLayoutParserModule>) | null;
    constructor();
    /**
     * Set the module loader function
     * 设置模块加载器函数
     * @internal
     */
    setModuleLoader(loader: () => Promise<HtmlLayoutParserModule>): void;
    /**
     * Set the environment type
     * 设置环境类型
     * @internal
     */
    setEnvironment(env: Environment): void;
    /**
     * Initialize the WASM module
     * 初始化 WASM 模块
     *
     * Must be called before using any other methods.
     * 必须在使用其他方法之前调用。
     *
     * @param _wasmPath - Optional path to the WASM file (used by subclasses)
     *                    可选的 WASM 文件路径（由子类使用）
     *
     * @example
     * ```typescript
     * const parser = new HtmlLayoutParser();
     * await parser.init();
     * // or with custom path / 或使用自定义路径
     * await parser.init('/custom/path/html_layout_parser.js');
     * ```
     */
    init(_wasmPath?: string): Promise<void>;
    /**
     * Ensure the module is initialized
     * 确保模块已初始化
     * @internal
     */
    protected ensureInitialized(): HtmlLayoutParserModule;
    /**
     * Set debug mode on/off
     * 设置调试模式开/关
     *
     * When debug mode is enabled, the parser outputs detailed logs at key stages:
     * 启用调试模式时，解析器在关键阶段输出详细日志：
     * - Font loading/unloading / 字体加载/卸载
     * - HTML parsing start/complete / HTML 解析开始/完成
     * - CSS parsing start/complete / CSS 解析开始/完成
     * - Layout calculation start/complete / 布局计算开始/完成
     * - Serialization start/complete / 序列化开始/完成
     * - Memory usage information / 内存使用信息
     *
     * @param isDebug - true to enable debug logging, false to disable
     *                  true 启用调试日志，false 禁用
     *
     * @example
     * ```typescript
     * parser.setDebugMode(true);
     * parser.parse(html, { viewportWidth: 800 }); // Will output debug logs
     * parser.setDebugMode(false);
     * ```
     */
    setDebugMode(isDebug: boolean): void;
    /**
     * Get current debug mode state
     * 获取当前调试模式状态
     *
     * @returns true if debug mode is enabled / 如果调试模式已启用则返回 true
     */
    getDebugMode(): boolean;
    /**
     * Internal debug log function
     * 内部调试日志函数
     *
     * Outputs to console.log in Web/Worker, process.stdout in Node.js
     * 在 Web/Worker 中输出到 console.log，在 Node.js 中输出到 process.stdout
     *
     * @internal
     */
    protected debugLog(message: string): void;
    /**
     * Load a font from binary data
     * 从二进制数据加载字体
     *
     * The font data is copied to WASM memory, so the original Uint8Array
     * can be safely discarded after this call.
     *
     * 字体数据会被复制到 WASM 内存，因此调用后可以安全地丢弃原始 Uint8Array。
     *
     * @param fontData - Font data as Uint8Array (TTF, OTF, WOFF)
     *                   字体数据（Uint8Array 格式，支持 TTF、OTF、WOFF）
     * @param fontName - Font name for CSS font-family matching
     *                   字体名称（用于 CSS font-family 匹配）
     * @returns Font ID on success (positive number), 0 on failure
     *          成功时返回字体 ID（正数），失败时返回 0
     *
     * @example
     * ```typescript
     * const fontResponse = await fetch('/fonts/arial.ttf');
     * const fontData = new Uint8Array(await fontResponse.arrayBuffer());
     * const fontId = parser.loadFont(fontData, 'Arial');
     * if (fontId > 0) {
     *   parser.setDefaultFont(fontId);
     * }
     * ```
     */
    loadFont(fontData: Uint8Array, fontName: string): number;
    /**
     * Unload a font and free its memory
     * 卸载字体并释放其内存
     *
     * After unloading, the font ID becomes invalid and should not be used.
     * 卸载后，字体 ID 将失效，不应再使用。
     *
     * @param fontId - Font ID to unload / 要卸载的字体 ID
     *
     * @example
     * ```typescript
     * parser.unloadFont(fontId);
     * ```
     */
    unloadFont(fontId: number): void;
    /**
     * Set the default font for fallback
     * 设置默认字体（用于回退）
     *
     * When a requested font is not found, the default font will be used.
     * 当请求的字体未找到时，将使用默认字体。
     *
     * @param fontId - Font ID to set as default / 要设置为默认的字体 ID
     *
     * @example
     * ```typescript
     * const fontId = parser.loadFont(fontData, 'Arial');
     * parser.setDefaultFont(fontId);
     * ```
     */
    setDefaultFont(fontId: number): void;
    /**
     * Get list of loaded fonts
     * 获取已加载字体列表
     *
     * @returns Array of font information / 字体信息数组
     *
     * @example
     * ```typescript
     * const fonts = parser.getLoadedFonts();
     * for (const font of fonts) {
     *   console.log(`${font.name} (ID: ${font.id}): ${font.memoryUsage} bytes`);
     * }
     * ```
     */
    getLoadedFonts(): FontInfo[];
    /**
     * Clear all loaded fonts
     * 清空所有已加载的字体
     *
     * Releases all font memory. After calling this, you must load fonts again.
     * 释放所有字体内存。调用后，必须重新加载字体。
     *
     * @example
     * ```typescript
     * parser.clearAllFonts();
     * ```
     */
    clearAllFonts(): void;
    /**
     * Parse HTML and calculate character layouts
     * 解析 HTML 并计算字符布局
     *
     * Memory safety: All allocated pointers are tracked and freed in finally block,
     * ensuring no memory leaks even if exceptions occur.
     *
     * 内存安全：所有分配的指针都会被跟踪并在 finally 块中释放，
     * 确保即使发生异常也不会内存泄漏。
     *
     * @typeParam T - Output mode type / 输出模式类型
     * @param html - HTML string to parse / 要解析的 HTML 字符串
     * @param options - Parse options / 解析选项
     * @returns Parsed layout data based on mode / 基于模式的解析布局数据
     *
     * @example Basic parsing / 基本解析
     * ```typescript
     * const layouts = parser.parse('<div>Hello</div>', { viewportWidth: 800 });
     * ```
     *
     * @example With CSS / 使用 CSS
     * ```typescript
     * const layouts = parser.parse(html, {
     *   viewportWidth: 800,
     *   css: '.title { color: red; }'
     * });
     * ```
     *
     * @example Full mode / 完整模式
     * ```typescript
     * const doc = parser.parse<'full'>(html, { viewportWidth: 800, mode: 'full' });
     * ```
     */
    parse<T extends OutputMode = 'flat'>(html: string, options: ParseOptions): T extends 'full' ? LayoutDocument : T extends 'simple' ? SimpleOutput : T extends 'byRow' ? Row[] : CharLayout[];
    /**
     * Parse HTML with external CSS (convenience method)
     * 使用外部 CSS 解析 HTML（便捷方法）
     *
     * @typeParam T - Output mode type / 输出模式类型
     * @param html - HTML string to parse / 要解析的 HTML 字符串
     * @param css - External CSS string / 外部 CSS 字符串
     * @param options - Parse options (without css field) / 解析选项（不含 css 字段）
     * @returns Parsed layout data based on mode / 基于模式的解析布局数据
     *
     * @example
     * ```typescript
     * const layouts = parser.parseWithCSS(
     *   '<div class="title">Hello</div>',
     *   '.title { color: red; font-size: 24px; }',
     *   { viewportWidth: 800 }
     * );
     * ```
     */
    parseWithCSS<T extends OutputMode = 'flat'>(html: string, css: string, options: Omit<ParseOptions, 'css'>): T extends 'full' ? LayoutDocument : T extends 'simple' ? SimpleOutput : T extends 'byRow' ? Row[] : CharLayout[];
    /**
     * Parse HTML and return result with full diagnostics
     * 解析 HTML 并返回带完整诊断信息的结果
     *
     * Use this method when you need error details, warnings, and performance metrics.
     * 当需要错误详情、警告和性能指标时使用此方法。
     *
     * Memory safety: All allocated pointers are tracked and freed in finally block,
     * ensuring no memory leaks even if exceptions occur.
     *
     * 内存安全：所有分配的指针都会被跟踪并在 finally 块中释放，
     * 确保即使发生异常也不会内存泄漏。
     *
     * @typeParam T - Output mode type / 输出模式类型
     * @param html - HTML string to parse / 要解析的 HTML 字符串
     * @param options - Parse options / 解析选项
     * @returns Parse result with diagnostics / 带诊断信息的解析结果
     *
     * @example
     * ```typescript
     * const result = parser.parseWithDiagnostics(html, {
     *   viewportWidth: 800,
     *   enableMetrics: true
     * });
     *
     * if (result.success) {
     *   console.log('Characters:', result.data.length);
     *   console.log('Parse time:', result.metrics?.parseTime, 'ms');
     * } else {
     *   console.error('Errors:', result.errors);
     * }
     * ```
     */
    parseWithDiagnostics<T extends OutputMode = 'flat'>(html: string, options: ParseOptions): ParseResultWithDiagnostics<T extends 'full' ? LayoutDocument : T extends 'simple' ? SimpleOutput : T extends 'byRow' ? Row[] : CharLayout[]>;
    /**
     * Get the last parse result with diagnostics
     * 获取上次解析结果（带诊断信息）
     *
     * @returns Last parse result with diagnostics / 上次解析结果（带诊断信息）
     */
    getLastParseResult(): ParseResultWithDiagnostics;
    /**
     * Get parser version
     * 获取解析器版本
     *
     * @returns Version string (e.g., "2.0.0") / 版本字符串（如 "2.0.0"）
     *
     * @example
     * ```typescript
     * console.log(parser.getVersion()); // "2.0.0"
     * ```
     */
    getVersion(): string;
    /**
     * Get memory metrics
     * 获取内存指标
     *
     * @returns Memory metrics or null if unavailable / 内存指标，如果不可用则返回 null
     */
    getMetrics(): MemoryMetrics | null;
    /**
     * Get the current runtime environment
     * 获取当前运行时环境
     *
     * @returns Environment type / 环境类型
     *
     * @example
     * ```typescript
     * const env = parser.getEnvironment(); // 'web' | 'worker' | 'node' | 'unknown'
     * ```
     */
    getEnvironment(): Environment;
    /**
     * Check if the module is initialized
     * 检查模块是否已初始化
     *
     * @returns true if initialized / 如果已初始化则返回 true
     *
     * @example
     * ```typescript
     * if (parser.isInitialized()) {
     *   // Safe to use parser
     * }
     * ```
     */
    isInitialized(): boolean;
    /**
     * Get total memory usage in bytes
     * 获取总内存使用量（字节）
     *
     * @returns Total memory usage in bytes / 总内存使用量（字节）
     *
     * @example
     * ```typescript
     * const bytes = parser.getTotalMemoryUsage();
     * console.log(`Memory: ${(bytes / 1024 / 1024).toFixed(2)} MB`);
     * ```
     */
    getTotalMemoryUsage(): number;
    /**
     * Check if memory usage exceeds the threshold (50MB)
     * 检查内存使用是否超过阈值（50MB）
     *
     * @returns true if memory exceeds 50MB / 如果内存超过 50MB 则返回 true
     *
     * @example
     * ```typescript
     * if (parser.checkMemoryThreshold()) {
     *   console.warn('Memory exceeds 50MB - consider clearing unused fonts');
     * }
     * ```
     */
    checkMemoryThreshold(): boolean;
    /**
     * Get detailed memory metrics
     * 获取详细内存指标
     *
     * @returns Memory metrics with font details / 带字体详情的内存指标
     *
     * @example
     * ```typescript
     * const metrics = parser.getMemoryMetrics();
     * if (metrics) {
     *   console.log(`Total: ${metrics.totalMemoryUsage} bytes`);
     *   console.log(`Fonts: ${metrics.fontCount}`);
     *   for (const font of metrics.fonts) {
     *     console.log(`  ${font.name}: ${font.memoryUsage} bytes`);
     *   }
     * }
     * ```
     */
    getMemoryMetrics(): MemoryMetrics | null;
    /**
     * Destroy the parser and release all resources
     * 销毁解析器并释放所有资源
     *
     * After calling this method, the parser instance cannot be used anymore.
     * You must create a new instance if you need to parse again.
     *
     * 调用此方法后，解析器实例将无法再使用。
     * 如果需要再次解析，必须创建新实例。
     *
     * @example
     * ```typescript
     * const parser = new HtmlLayoutParser();
     * await parser.init();
     *
     * try {
     *   // Use parser...
     * } finally {
     *   parser.destroy(); // Always clean up
     * }
     * ```
     */
    destroy(): void;
}

/**
 * HTML Layout Parser v2.0 - Web Worker Entry Point
 *
 * Use this entry point for Web Worker environments.
 * Supports both module workers and classic workers.
 *
 * @packageDocumentation
 * @module html-layout-parser/worker
 *
 * @example Module Worker
 * ```typescript
 * // worker.ts
 * import { HtmlLayoutParser } from 'html-layout-parser/worker';
 *
 * const parser = new HtmlLayoutParser();
 * await parser.init();
 *
 * self.onmessage = async (e) => {
 *   const { html, options } = e.data;
 *   const result = parser.parse(html, options);
 *   self.postMessage(result);
 * };
 * ```
 *
 * @example With OffscreenCanvas
 * ```typescript
 * // worker.ts
 * import { HtmlLayoutParser } from 'html-layout-parser/worker';
 *
 * const parser = new HtmlLayoutParser();
 * await parser.init();
 *
 * self.onmessage = async (e) => {
 *   const { html, canvas } = e.data;
 *   const layouts = parser.parse(html, { viewportWidth: canvas.width });
 *
 *   const ctx = canvas.getContext('2d');
 *   // Render layouts to OffscreenCanvas...
 *
 *   const bitmap = canvas.transferToImageBitmap();
 *   self.postMessage({ bitmap }, [bitmap]);
 * };
 * ```
 */

/**
 * HTML Layout Parser for Web Worker environment
 */
declare class HtmlLayoutParser extends HtmlLayoutParser$1 {
    constructor();
    /**
     * Initialize the WASM module for Web Worker
     * @param wasmPath Optional path to the WASM JS file
     */
    init(wasmPath?: string): Promise<void>;
}
/**
 * Create a new HtmlLayoutParser instance for Web Worker
 */
declare function createParser(): HtmlLayoutParser;

export { type Block, type BoxSpacing, type CharLayout, type CreateHtmlLayoutParserModule, type EmscriptenModule, type Environment, ErrorCode, type ErrorSeverity, type FontInfo, type FontLoadResult, HtmlLayoutParser, HtmlLayoutParser$1 as HtmlLayoutParserBase, type HtmlLayoutParserModule, type LayoutDocument, type Line, type MemoryMetrics, type ModuleFactory, type OutputMode, type Page, type ParseError, type ParseOptions, type ParseResult, type ParseResultWithDiagnostics, type PerformanceMetrics, type Row, type Run, type SimpleOutput, type TextDecoration, type Transform, type Viewport, createParser, HtmlLayoutParser as default };
