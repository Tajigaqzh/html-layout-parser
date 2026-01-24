// WASM Module Loader - handles both ESM and CommonJS formats
import type { EmscriptenModule, ModuleFactory } from './types';

/**
 * Load WASM module with automatic format detection
 */
export async function loadWasmModule(
  wasmPath?: string,
  moduleOverrides?: { locateFile?: (path: string) => string }
): Promise<EmscriptenModule> {
  // Default WASM paths for different environments
  const defaultPaths = {
    esm: './html_layout_parser.mjs',
    cjs: './html_layout_parser.cjs',
    legacy: './html_layout_parser.js'
  };

  const actualWasmPath = wasmPath || getDefaultWasmPath();

  try {
    // Try to load as ESM first
    const moduleFactory = await loadESMModule(actualWasmPath);
    return await moduleFactory(moduleOverrides);
  } catch (esmError) {
    console.warn('ESM loading failed, trying CommonJS:', esmError);
    
    try {
      // Fallback to CommonJS
      const moduleFactory = await loadCJSModule(actualWasmPath);
      return await moduleFactory(moduleOverrides);
    } catch (cjsError) {
      console.error('Both ESM and CJS loading failed');
      throw new Error(`Failed to load WASM module: ESM error: ${esmError}, CJS error: ${cjsError}`);
    }
  }
}

/**
 * Load ESM module
 */
async function loadESMModule(wasmPath: string): Promise<ModuleFactory> {
  // Convert .cjs to .mjs for ESM loading
  const esmPath = wasmPath.replace(/\.cjs$/, '.mjs').replace(/\.js$/, '.mjs');
  
  // Check if dynamic import is available
  if (typeof globalThis !== 'undefined' && 'import' in globalThis) {
    // Dynamic import for ESM
    const module = await import(esmPath);
    return module.default || module.createHtmlLayoutParserModule;
  }
  
  throw new Error('ESM import not supported in this environment');
}

/**
 * Load CommonJS module
 */
async function loadCJSModule(wasmPath: string): Promise<ModuleFactory> {
  // Convert .mjs to .cjs for CommonJS loading
  const cjsPath = wasmPath.replace(/\.mjs$/, '.cjs').replace(/\.js$/, '.cjs');
  
  if (typeof require !== 'undefined') {
    // CommonJS require
    const module = require(cjsPath);
    return module.default || module.createHtmlLayoutParserModule || module;
  }
  
  // Fallback for environments without require
  if (typeof importScripts !== 'undefined') {
    // Web Worker environment
    importScripts(cjsPath);
    return (globalThis as any).createHtmlLayoutParserModule;
  }
  
  throw new Error('CommonJS require not supported in this environment');
}

/**
 * Get default WASM path based on environment
 */
function getDefaultWasmPath(): string {
  // Detect environment
  if (typeof window !== 'undefined') {
    // Browser environment - prefer ESM
    return './html_layout_parser.mjs';
  } else if (typeof global !== 'undefined') {
    // Node.js environment - check for ESM support
    if (typeof globalThis !== 'undefined' && 'import' in globalThis) {
      return './html_layout_parser.mjs';
    } else {
      return './html_layout_parser.cjs';
    }
  } else if (typeof self !== 'undefined') {
    // Web Worker environment
    return './html_layout_parser.mjs';
  }
  
  // Default fallback
  return './html_layout_parser.mjs';
}

/**
 * Environment detection utility
 */
export function detectEnvironment(): 'web' | 'worker' | 'node' | 'unknown' {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return 'web';
  } else if (typeof self !== 'undefined' && typeof importScripts !== 'undefined') {
    return 'worker';
  } else if (typeof global !== 'undefined' && typeof process !== 'undefined') {
    return 'node';
  }
  return 'unknown';
}

/**
 * Check if ESM is supported
 */
export function isESMSupported(): boolean {
  try {
    return typeof globalThis !== 'undefined' && 'import' in globalThis;
  } catch {
    return false;
  }
}

/**
 * Check if CommonJS is supported
 */
export function isCJSSupported(): boolean {
  try {
    return typeof require !== 'undefined';
  } catch {
    return false;
  }
}