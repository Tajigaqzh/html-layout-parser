/**
 * HTML Layout Parser v2.0 - Core Parser Class
 * HTML 布局解析器 v2.0 - 核心解析器类
 * 
 * @packageDocumentation
 * @module html-layout-parser
 */

import type {
  HtmlLayoutParserModule,
  CharLayout,
  FontInfo,
  MemoryMetrics,
  ParseOptions,
  OutputMode,
  LayoutDocument,
  SimpleOutput,
  Row,
  ParseResultWithDiagnostics,
  Environment
} from './types';
import { ErrorCode } from './types';

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
export class HtmlLayoutParser {
  protected module: HtmlLayoutParserModule | null = null;
  protected environment: Environment;
  protected initialized = false;
  protected moduleLoader: (() => Promise<HtmlLayoutParserModule>) | null = null;

  constructor() {
    this.environment = 'unknown';
  }


  /**
   * Set the module loader function
   * 设置模块加载器函数
   * @internal
   */
  setModuleLoader(loader: () => Promise<HtmlLayoutParserModule>): void {
    this.moduleLoader = loader;
  }

  /**
   * Set the environment type
   * 设置环境类型
   * @internal
   */
  setEnvironment(env: Environment): void {
    this.environment = env;
  }

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
  async init(_wasmPath?: string): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.moduleLoader) {
      this.module = await this.moduleLoader();
      this.initialized = true;
      return;
    }

    throw new Error('Module loader not set. Use environment-specific entry point.');
  }

  /**
   * Ensure the module is initialized
   * 确保模块已初始化
   * @internal
   */
  protected ensureInitialized(): HtmlLayoutParserModule {
    if (!this.module) {
      throw new Error('WASM module not initialized. Call init() first.');
    }
    return this.module;
  }

  // ============================================================================
  // Debug Mode API / 调试模式 API
  // ============================================================================

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
  setDebugMode(isDebug: boolean): void {
    const module = this.ensureInitialized();
    if (typeof module._setDebugMode === 'function') {
      module._setDebugMode(isDebug);
    }
    
    if (isDebug) {
      this.debugLog('Debug mode enabled');
    }
  }

  /**
   * Get current debug mode state
   * 获取当前调试模式状态
   * 
   * @returns true if debug mode is enabled / 如果调试模式已启用则返回 true
   */
  getDebugMode(): boolean {
    const module = this.ensureInitialized();
    if (typeof module._getDebugMode === 'function') {
      return module._getDebugMode() !== 0;
    }
    return false;
  }

  /**
   * Internal debug log function
   * 内部调试日志函数
   * 
   * Outputs to console.log in Web/Worker, process.stdout in Node.js
   * 在 Web/Worker 中输出到 console.log，在 Node.js 中输出到 process.stdout
   * 
   * @internal
   */
  protected debugLog(message: string): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [HtmlLayoutParser] ${message}`;
    
    if (this.environment === 'node') {
      if (typeof process !== 'undefined' && process.stdout) {
        process.stdout.write(formattedMessage + '\n');
      } else {
        console.log(formattedMessage);
      }
    } else {
      console.log(formattedMessage);
    }
  }

  // ============================================================================
  // Font Management API / 字体管理 API
  // ============================================================================

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
  loadFont(fontData: Uint8Array, fontName: string): number {
    const module = this.ensureInitialized();

    const dataPtr = module._malloc(fontData.length);
    if (dataPtr === 0) {
      return 0;
    }

    const nameBytes = module.lengthBytesUTF8(fontName) + 1;
    const namePtr = module._malloc(nameBytes);
    if (namePtr === 0) {
      module._free(dataPtr);
      return 0;
    }

    try {
      module.HEAPU8.set(fontData, dataPtr);
      module.stringToUTF8(fontName, namePtr, nameBytes);
      return module._loadFont(dataPtr, fontData.length, namePtr);
    } finally {
      module._free(dataPtr);
      module._free(namePtr);
    }
  }

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
  unloadFont(fontId: number): void {
    const module = this.ensureInitialized();
    module._unloadFont(fontId);
  }

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
  setDefaultFont(fontId: number): void {
    const module = this.ensureInitialized();
    module._setDefaultFont(fontId);
  }

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
  getLoadedFonts(): FontInfo[] {
    const module = this.ensureInitialized();

    const resultPtr = module._getLoadedFonts();
    if (resultPtr === 0) {
      return [];
    }

    const result = module.UTF8ToString(resultPtr);
    module._freeString(resultPtr);

    try {
      return JSON.parse(result);
    } catch {
      return [];
    }
  }

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
  clearAllFonts(): void {
    const module = this.ensureInitialized();
    module._clearAllFonts();
  }


  // ============================================================================
  // HTML Parsing API / HTML 解析 API
  // ============================================================================

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
  parse<T extends OutputMode = 'flat'>(
    html: string,
    options: ParseOptions
  ): T extends 'full' ? LayoutDocument :
     T extends 'simple' ? SimpleOutput :
     T extends 'byRow' ? Row[] :
     CharLayout[] {
    const module = this.ensureInitialized();
    const mode = options.mode || 'flat';
    
    if (options.isDebug !== undefined) {
      this.setDebugMode(options.isDebug);
    }

    let htmlPtr = 0;
    let modePtr = 0;
    let cssPtr = 0;

    try {
      const htmlBytes = module.lengthBytesUTF8(html) + 1;
      htmlPtr = module._malloc(htmlBytes);
      if (htmlPtr === 0) {
        throw new Error('Failed to allocate memory for HTML string');
      }
      module.stringToUTF8(html, htmlPtr, htmlBytes);

      const modeBytes = module.lengthBytesUTF8(mode) + 1;
      modePtr = module._malloc(modeBytes);
      if (modePtr === 0) {
        throw new Error('Failed to allocate memory for mode string');
      }
      module.stringToUTF8(mode, modePtr, modeBytes);

      if (options.css) {
        const cssBytes = module.lengthBytesUTF8(options.css) + 1;
        cssPtr = module._malloc(cssBytes);
        if (cssPtr === 0) {
          throw new Error('Failed to allocate memory for CSS string');
        }
        module.stringToUTF8(options.css, cssPtr, cssBytes);
      }

      const resultPtr = module._parseHTML(
        htmlPtr,
        cssPtr,
        options.viewportWidth,
        modePtr,
        0
      );

      if (resultPtr === 0) {
        return [] as any;
      }

      const result = module.UTF8ToString(resultPtr);
      module._freeString(resultPtr);

      try {
        return JSON.parse(result);
      } catch {
        return [] as any;
      }
    } catch (error) {
      if (options.isDebug) {
        this.debugLog(`Parse error: ${error}`);
      }
      return [] as any;
    } finally {
      if (htmlPtr !== 0) {
        module._free(htmlPtr);
      }
      if (modePtr !== 0) {
        module._free(modePtr);
      }
      if (cssPtr !== 0) {
        module._free(cssPtr);
      }
    }
  }

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
  parseWithCSS<T extends OutputMode = 'flat'>(
    html: string,
    css: string,
    options: Omit<ParseOptions, 'css'>
  ): T extends 'full' ? LayoutDocument :
     T extends 'simple' ? SimpleOutput :
     T extends 'byRow' ? Row[] :
     CharLayout[] {
    return this.parse<T>(html, { ...options, css });
  }

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
  parseWithDiagnostics<T extends OutputMode = 'flat'>(
    html: string,
    options: ParseOptions
  ): ParseResultWithDiagnostics<
    T extends 'full' ? LayoutDocument :
    T extends 'simple' ? SimpleOutput :
    T extends 'byRow' ? Row[] :
    CharLayout[]
  > {
    const module = this.ensureInitialized();
    const mode = options.mode || 'flat';
    
    if (options.isDebug !== undefined) {
      this.setDebugMode(options.isDebug);
    }

    let htmlPtr = 0;
    let modePtr = 0;
    let cssPtr = 0;

    try {
      const htmlBytes = module.lengthBytesUTF8(html) + 1;
      htmlPtr = module._malloc(htmlBytes);
      if (htmlPtr === 0) {
        return {
          success: false,
          errors: [{
            code: ErrorCode.MemoryAllocationFailed,
            message: 'Failed to allocate memory for HTML string',
            severity: 'error'
          }]
        };
      }
      module.stringToUTF8(html, htmlPtr, htmlBytes);

      const modeBytes = module.lengthBytesUTF8(mode) + 1;
      modePtr = module._malloc(modeBytes);
      if (modePtr === 0) {
        return {
          success: false,
          errors: [{
            code: ErrorCode.MemoryAllocationFailed,
            message: 'Failed to allocate memory for mode string',
            severity: 'error'
          }]
        };
      }
      module.stringToUTF8(mode, modePtr, modeBytes);

      if (options.css) {
        const cssBytes = module.lengthBytesUTF8(options.css) + 1;
        cssPtr = module._malloc(cssBytes);
        if (cssPtr === 0) {
          return {
            success: false,
            errors: [{
              code: ErrorCode.MemoryAllocationFailed,
              message: 'Failed to allocate memory for CSS string',
              severity: 'error'
            }]
          };
        }
        module.stringToUTF8(options.css, cssPtr, cssBytes);
      }

      const resultPtr = module._parseHTMLWithDiagnostics(
        htmlPtr,
        cssPtr,
        options.viewportWidth,
        modePtr,
        0
      );

      if (resultPtr === 0) {
        return {
          success: false,
          errors: [{
            code: ErrorCode.InternalError,
            message: 'parseHTMLWithDiagnostics returned null pointer',
            severity: 'error'
          }]
        };
      }

      const resultJson = module.UTF8ToString(resultPtr);
      module._freeString(resultPtr);

      try {
        return JSON.parse(resultJson);
      } catch {
        return {
          success: false,
          errors: [{
            code: ErrorCode.SerializationFailed,
            message: 'Failed to parse result JSON',
            severity: 'error'
          }]
        };
      }
    } finally {
      if (htmlPtr !== 0) {
        module._free(htmlPtr);
      }
      if (modePtr !== 0) {
        module._free(modePtr);
      }
      if (cssPtr !== 0) {
        module._free(cssPtr);
      }
    }
  }

  /**
   * Get the last parse result with diagnostics
   * 获取上次解析结果（带诊断信息）
   * 
   * @returns Last parse result with diagnostics / 上次解析结果（带诊断信息）
   */
  getLastParseResult(): ParseResultWithDiagnostics {
    const module = this.ensureInitialized();

    const resultPtr = module._getLastParseResult();
    if (resultPtr === 0) {
      return {
        success: false,
        errors: [{
          code: ErrorCode.InternalError,
          message: 'getLastParseResult returned null pointer',
          severity: 'error'
        }]
      };
    }

    const resultJson = module.UTF8ToString(resultPtr);
    module._freeString(resultPtr);

    try {
      return JSON.parse(resultJson);
    } catch {
      return {
        success: false,
        errors: [{
          code: ErrorCode.SerializationFailed,
          message: 'Failed to parse result JSON',
          severity: 'error'
        }]
      };
    }
  }


  // ============================================================================
  // Utility API / 工具 API
  // ============================================================================

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
  getVersion(): string {
    const module = this.ensureInitialized();

    const resultPtr = module._getVersion();
    if (resultPtr === 0) {
      return '';
    }

    const result = module.UTF8ToString(resultPtr);
    module._freeString(resultPtr);
    return result;
  }

  /**
   * Get memory metrics
   * 获取内存指标
   * 
   * @returns Memory metrics or null if unavailable / 内存指标，如果不可用则返回 null
   */
  getMetrics(): MemoryMetrics | null {
    const module = this.ensureInitialized();

    const resultPtr = module._getMetrics();
    if (resultPtr === 0) {
      return null;
    }

    const result = module.UTF8ToString(resultPtr);
    module._freeString(resultPtr);

    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

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
  getEnvironment(): Environment {
    return this.environment;
  }

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
  isInitialized(): boolean {
    return this.initialized;
  }

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
  getTotalMemoryUsage(): number {
    const module = this.ensureInitialized();
    if (typeof module._getTotalMemoryUsage === 'function') {
      return module._getTotalMemoryUsage();
    }
    return 0;
  }

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
  checkMemoryThreshold(): boolean {
    const module = this.ensureInitialized();
    if (typeof module._checkMemoryThreshold === 'function') {
      return module._checkMemoryThreshold() !== 0;
    }
    return false;
  }

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
  getMemoryMetrics(): MemoryMetrics | null {
    const module = this.ensureInitialized();
    if (typeof module._getMemoryMetrics !== 'function') {
      return null;
    }

    const resultPtr = module._getMemoryMetrics();
    if (resultPtr === 0) {
      return null;
    }

    const result = module.UTF8ToString(resultPtr);
    module._freeString(resultPtr);

    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

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
  destroy(): void {
    if (this.module) {
      if (typeof this.module._destroy === 'function') {
        this.module._destroy();
      } else {
        this.clearAllFonts();
      }
      this.module = null;
      this.initialized = false;
    }
  }
}
