/**
 * HTML Layout Parser v2.0 - TypeScript Type Definitions
 * HTML 布局解析器 v2.0 - TypeScript 类型定义
 * 
 * @packageDocumentation
 * @module html-layout-parser
 * @version 2.0.0
 */

// =============================================================================
// Error Types / 错误类型
// =============================================================================

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
export enum ErrorCode {
  /** 
   * Operation completed successfully
   * 操作成功完成
   */
  Success = 0,
  
  // Input validation errors (1xxx) / 输入验证错误 (1xxx)
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
  
  // Font-related errors (2xxx) / 字体相关错误 (2xxx)
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
  
  // Parsing errors (3xxx) / 解析错误 (3xxx)
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
  
  // Memory errors (4xxx) / 内存错误 (4xxx)
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
  
  // Internal errors (5xxx) / 内部错误 (5xxx)
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
export type ErrorSeverity = 'error' | 'warning' | 'info';

/** 
 * Parse error information
 * 解析错误信息
 */
export interface ParseError {
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
export interface PerformanceMetrics {
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
export interface ParseResultWithDiagnostics<T = unknown> {
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
export interface FontLoadResult {
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


// =============================================================================
// Text Styling Types / 文本样式类型
// =============================================================================

/** 
 * Text decoration information
 * 文本装饰信息
 */
export interface TextDecoration {
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
export interface Transform {
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

// =============================================================================
// Character Layout Types / 字符布局类型
// =============================================================================

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
export interface CharLayout {
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


// =============================================================================
// Output Structure Types / 输出结构类型
// =============================================================================

/** 
 * Viewport information
 * 视口信息
 */
export interface Viewport {
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
export interface BoxSpacing {
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
export interface Run {
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
export interface Line {
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
export interface Block {
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
export interface Page {
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
export interface LayoutDocument {
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
export interface SimpleOutput {
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
export interface Row {
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


// =============================================================================
// Font Types / 字体类型
// =============================================================================

/** 
 * Font information
 * 字体信息
 */
export interface FontInfo {
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
export interface MemoryMetrics {
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

// =============================================================================
// Parse Options Types / 解析选项类型
// =============================================================================

/** 
 * Output mode for parsing
 * 解析输出模式
 * 
 * - 'flat': Flat array of characters (fastest) / 扁平字符数组（最快）
 * - 'byRow': Characters grouped by row / 按行分组的字符
 * - 'simple': Lines with characters / 带字符的行结构
 * - 'full': Complete hierarchy / 完整层级结构
 */
export type OutputMode = 'full' | 'simple' | 'flat' | 'byRow';

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
export interface ParseOptions {
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
export type ParseResult<T extends OutputMode = 'flat'> = 
  T extends 'full' ? LayoutDocument :
  T extends 'simple' ? SimpleOutput :
  T extends 'byRow' ? Row[] :
  CharLayout[];

// =============================================================================
// Runtime Environment Types / 运行时环境类型
// =============================================================================

/** 
 * Runtime environment type
 * 运行时环境类型
 * 
 * - 'web': Web browser environment / Web 浏览器环境
 * - 'worker': Web Worker environment / Web Worker 环境
 * - 'node': Node.js environment / Node.js 环境
 * - 'unknown': Unknown environment / 未知环境
 */
export type Environment = 'web' | 'worker' | 'node' | 'unknown';

// =============================================================================
// WASM Module Types / WASM 模块类型
// =============================================================================

/** 
 * Emscripten module interface for HTML Layout Parser v2.0
 * HTML 布局解析器 v2.0 的 Emscripten 模块接口
 * 
 * @internal This interface is for internal use only
 * @internal 此接口仅供内部使用
 */
export interface HtmlLayoutParserModule {
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
  _parseHTML(
    htmlPtr: number,
    cssPtr: number,
    viewportWidth: number,
    modePtr: number,
    optionsPtr: number
  ): number;
  /** 
   * Parse HTML with full diagnostics
   * 解析 HTML 并返回完整诊断信息
   */
  _parseHTMLWithDiagnostics(
    htmlPtr: number,
    cssPtr: number,
    viewportWidth: number,
    modePtr: number,
    optionsPtr: number
  ): number;
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
export type CreateHtmlLayoutParserModule = (config?: {
  locateFile?: (path: string) => string;
}) => Promise<HtmlLayoutParserModule>;
