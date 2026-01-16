/**
 * HTML Layout Parser v2.0 - TypeScript Type Definitions
 * 
 * @packageDocumentation
 * @module html-layout-parser-worker
 * @version 2.0.0
 */

// =============================================================================
// Error Types
// =============================================================================

/**
 * Error codes for the parser.
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

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ParseError {
  code: ErrorCode | string;
  message: string;
  severity: ErrorSeverity;
  line?: number;
  column?: number;
  context?: string;
}

export interface PerformanceMetrics {
  parseTime: number;
  layoutTime: number;
  serializeTime: number;
  totalTime: number;
  characterCount: number;
  inputSize: number;
  charsPerSecond: number;
  memory: {
    totalFontMemory: number;
    fontCount: number;
    exceedsThreshold: boolean;
  };
}

export interface ParseResultWithDiagnostics<T = unknown> {
  success: boolean;
  data?: T;
  errors?: ParseError[];
  warnings?: ParseError[];
  metrics?: PerformanceMetrics;
}

export interface FontLoadResult {
  success: boolean;
  fontId: number;
  errorCode?: ErrorCode | string;
  errorMessage?: string;
}

// =============================================================================
// Text Styling Types
// =============================================================================

export interface TextDecoration {
  underline: boolean;
  overline: boolean;
  lineThrough: boolean;
  color: string;
  style: string;
  thickness: number;
}

export interface TextShadow {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  color: string;
}

export interface Transform {
  scaleX: number;
  scaleY: number;
  skewX: number;
  skewY: number;
  rotate: number;
}

// =============================================================================
// Character Layout Types
// =============================================================================

export interface CharLayout {
  character: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: string;
  color: string;
  backgroundColor: string;
  opacity: number;
  textDecoration: TextDecoration;
  letterSpacing: number;
  wordSpacing: number;
  textShadow: TextShadow[];
  transform: Transform;
  baseline: number;
  direction: string;
  fontId: number;
}

// =============================================================================
// Output Structure Types
// =============================================================================

export interface Viewport {
  width: number;
  height: number;
}

export interface BoxSpacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

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

export interface Page {
  pageIndex: number;
  width: number;
  height: number;
  blocks: Block[];
}

export interface LayoutDocument {
  version: string;
  parserVersion: string;
  viewport: Viewport;
  pages: Page[];
}

export interface SimpleOutput {
  version: string;
  viewport: Viewport;
  lines: Line[];
}

export interface Row {
  rowIndex: number;
  y: number;
  children: CharLayout[];
}

// =============================================================================
// Font Types
// =============================================================================

export interface FontInfo {
  id: number;
  name: string;
  memoryUsage: number;
}

export interface MemoryMetrics {
  totalMemoryUsage: number;
  fontCount: number;
  fonts: FontInfo[];
}

// =============================================================================
// Parse Options Types
// =============================================================================

export type OutputMode = 'full' | 'simple' | 'flat' | 'byRow';

export interface ParseOptions {
  viewportWidth: number;
  viewportHeight?: number;
  mode?: OutputMode;
  defaultFontId?: number;
  enableMetrics?: boolean;
  maxCharacters?: number;
  timeout?: number;
  css?: string;
  isDebug?: boolean;
}

export type ParseResult<T extends OutputMode = 'flat'> = 
  T extends 'full' ? LayoutDocument :
  T extends 'simple' ? SimpleOutput :
  T extends 'byRow' ? Row[] :
  CharLayout[];

// =============================================================================
// WASM Module Types
// =============================================================================

export interface HtmlLayoutParserModule {
  _malloc(size: number): number;
  _free(ptr: number): void;
  HEAPU8: Uint8Array;
  lengthBytesUTF8(str: string): number;
  stringToUTF8(str: string, ptr: number, maxBytes: number): void;
  UTF8ToString(ptr: number): string;
  _loadFont(fontDataPtr: number, fontDataSize: number, fontNamePtr: number): number;
  _unloadFont(fontId: number): void;
  _setDefaultFont(fontId: number): void;
  _getLoadedFonts(): number;
  _clearAllFonts(): void;
  _parseHTML(htmlPtr: number, cssPtr: number, viewportWidth: number, modePtr: number, optionsPtr: number): number;
  _parseHTMLWithDiagnostics(htmlPtr: number, cssPtr: number, viewportWidth: number, modePtr: number, optionsPtr: number): number;
  _getLastParseResult(): number;
  _freeString(ptr: number): void;
  _destroy(): void;
  _getTotalMemoryUsage(): number;
  _checkMemoryThreshold(): number;
  _getMemoryMetrics(): number;
  _getVersion(): number;
  _getMetrics(): number;
  _setDebugMode(isDebug: boolean): void;
  _getDebugMode(): number;
}

export type CreateHtmlLayoutParserModule = () => Promise<HtmlLayoutParserModule>;
