/**
 * TypeScript type definitions for HTML Layout Parser v2.0 WASM module
 */

// ============================================================================
// Error Types (Requirements: 8.1, 8.2)
// ============================================================================

/**
 * Error codes for the parser
 */
export enum ErrorCode {
  Success = 0,
  InvalidInput = 1001,
  EmptyHtml = 1002,
  InvalidViewportWidth = 1003,
  InvalidMode = 1004,
  InvalidOptions = 1005,
  HtmlTooLarge = 1006,
  FontNotLoaded = 2001,
  FontLoadFailed = 2002,
  FontDataInvalid = 2003,
  FontNameEmpty = 2004,
  FontIdNotFound = 2005,
  NoDefaultFont = 2006,
  FontMemoryExceeded = 2007,
  ParseFailed = 3001,
  DocumentCreationFailed = 3002,
  RenderFailed = 3003,
  LayoutFailed = 3004,
  CssParseError = 3005,
  MemoryAllocationFailed = 4001,
  MemoryLimitExceeded = 4002,
  InternalError = 5001,
  SerializationFailed = 5002,
  UnknownError = 5999
}

/**
 * Error severity levels
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

/**
 * Parse error information
 */
export interface ParseError {
  code: ErrorCode | string;
  message: string;
  severity: ErrorSeverity;
  line?: number;
  column?: number;
  context?: string;
}

/**
 * Parse result with diagnostics
 */
export interface ParseResultWithDiagnostics<T = unknown> {
  success: boolean;
  data?: T;
  errors?: ParseError[];
  warnings?: ParseError[];
  metrics?: PerformanceMetrics;
}

/**
 * Font load result
 */
export interface FontLoadResult {
  success: boolean;
  fontId: number;
  errorCode?: ErrorCode | string;
  errorMessage?: string;
}

/**
 * Text decoration information
 */
export interface TextDecoration {
  underline: boolean;
  overline: boolean;
  lineThrough: boolean;
  color: string;
  style: string;
  thickness: number;
}

/**
 * Text shadow information
 */
export interface TextShadow {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  color: string;
}

/**
 * Transform information
 */
export interface Transform {
  scaleX: number;
  scaleY: number;
  skewX: number;
  skewY: number;
  rotate: number;
}

/**
 * Character layout information for v2.0
 */
export interface CharLayout {
  // Basic properties
  character: string;
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Font properties
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: string;
  
  // Color and background
  color: string;
  backgroundColor: string;
  opacity: number;
  
  // Text decoration
  textDecoration: TextDecoration;
  
  // Spacing
  letterSpacing: number;
  wordSpacing: number;
  
  // Shadow
  textShadow: TextShadow[];
  
  // Transform
  transform: Transform;
  
  // Baseline and direction
  baseline: number;
  direction: string;
  
  // Internal reference
  fontId: number;
}

/**
 * Font information
 */
export interface FontInfo {
  id: number;
  name: string;
  memoryUsage: number;
}

/**
 * Memory metrics
 */
export interface MemoryMetrics {
  totalMemoryUsage: number;
  fontCount: number;
  fonts: FontInfo[];
}

/**
 * Performance metrics from last parse operation
 */
export interface PerformanceMetrics {
  parseTime: number;         // HTML parsing time (ms)
  layoutTime: number;        // Layout calculation time (ms)
  serializeTime: number;     // JSON serialization time (ms)
  totalTime: number;         // Total processing time (ms)
  characterCount: number;    // Number of characters processed
  inputSize: number;         // Input HTML size (bytes)
  charsPerSecond: number;    // Processing speed (chars/sec)
  memory: {
    totalFontMemory: number;
    fontCount: number;
    exceedsThreshold: boolean;
  };
}

// ============================================================================
// Output Format Types (v2.0)
// ============================================================================

/**
 * Viewport information
 */
export interface Viewport {
  width: number;
  height: number;
}

/**
 * Box spacing (margin/padding)
 */
export interface BoxSpacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Run structure - group of characters with same styling
 */
export interface Run {
  runIndex: number;
  x: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: string;
  color: string;
  backgroundColor: string;
  textDecoration: TextDecoration;
  characters: CharLayout[];
}

/**
 * Line structure - a single line of text
 */
export interface Line {
  lineIndex: number;
  y: number;
  baseline: number;
  height: number;
  width: number;
  textAlign: string;
  runs?: Run[];
  characters?: CharLayout[];
}

/**
 * Block structure - a block-level element
 */
export interface Block {
  blockIndex: number;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  margin: BoxSpacing;
  padding: BoxSpacing;
  backgroundColor: string;
  borderRadius: number;
  lines: Line[];
}

/**
 * Page structure
 */
export interface Page {
  pageIndex: number;
  width: number;
  height: number;
  blocks: Block[];
}

/**
 * Layout Document structure - full mode output
 */
export interface LayoutDocument {
  version: string;
  parserVersion: string;
  viewport: Viewport;
  pages: Page[];
}

/**
 * Simple mode output structure
 */
export interface SimpleOutput {
  version: string;
  viewport: Viewport;
  lines: Line[];
}

/**
 * Row structure - for byRow mode (v1 compatible)
 */
export interface Row {
  rowIndex: number;
  y: number;
  children: CharLayout[];
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRate: number | null;
  memoryUsage: number;
}

/**
 * Emscripten module interface for HTML Layout Parser v2.0
 */
export interface HtmlLayoutParserModule {
  // Memory management
  _malloc(size: number): number;
  _free(ptr: number): void;
  HEAPU8: Uint8Array;
  
  // String utilities
  lengthBytesUTF8(str: string): number;
  stringToUTF8(str: string, ptr: number, maxBytes: number): void;
  UTF8ToString(ptr: number): string;
  
  // Font management API
  _loadFont(fontDataPtr: number, fontDataSize: number, fontNamePtr: number): number;
  _unloadFont(fontId: number): void;
  _setDefaultFont(fontId: number): void;
  _getLoadedFonts(): number;
  _clearAllFonts(): void;
  
  // HTML parsing API
  _parseHTML(
    htmlPtr: number,
    cssPtr: number,
    viewportWidth: number,
    modePtr: number,
    optionsPtr: number
  ): number;
  
  // HTML parsing with diagnostics API
  _parseHTMLWithDiagnostics(
    htmlPtr: number,
    cssPtr: number,
    viewportWidth: number,
    modePtr: number,
    optionsPtr: number
  ): number;
  
  // Get last parse result
  _getLastParseResult(): number;
  
  // Memory management API
  _freeString(ptr: number): void;
  
  // Resource cleanup API
  _destroy(): void;
  _getTotalMemoryUsage(): number;
  _checkMemoryThreshold(): number;  // Returns 1 for true, 0 for false
  _getMemoryMetrics(): number;
  
  // Utility API
  _getVersion(): number;
  _getMetrics(): number;
  _getDetailedMetrics(): number;
  
  // Debug mode API
  _setDebugMode(isDebug: boolean): void;
  _getDebugMode(): number;  // Returns 0 for false, 1 for true
  
  // Cache management API
  _getCacheStats(): number;
  _resetCacheStats(): void;
  _clearCache(): void;
}

/**
 * Factory function type for creating the module
 */
export type CreateHtmlLayoutParserModule = () => Promise<HtmlLayoutParserModule>;
