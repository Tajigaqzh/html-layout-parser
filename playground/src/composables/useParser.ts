import { ref } from 'vue'

interface WasmModule {
  _malloc: (size: number) => number
  _free: (ptr: number) => void
  _loadFont: (dataPtr: number, dataLen: number, namePtr: number) => number
  _unloadFont: (fontId: number) => void
  _setDefaultFont: (fontId: number) => void
  _parseHTML: (htmlPtr: number, cssPtr: number, width: number, modePtr: number, debug: number) => number
  _freeString: (ptr: number) => void
  _getTotalMemoryUsage: () => number
  lengthBytesUTF8: (str: string) => number
  stringToUTF8: (str: string, ptr: number, maxBytes: number) => void
  UTF8ToString: (ptr: number) => string
  HEAPU8: Uint8Array
}

let wasmModule: WasmModule | null = null
let currentFontId = 0
let scriptLoaded = false

export function useParser() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function initParser() {
    if (wasmModule) return wasmModule

    isLoading.value = true
    error.value = null

    try {
      // Load WASM module script if not already loaded
      if (!scriptLoaded) {
        const modulePath = '/wasm/html_layout_parser.js'
        
        // Check if script is already in the document
        const existingScript = document.querySelector(`script[src="${modulePath}"]`)
        
        if (!existingScript) {
          // Create a script element to load the module
          const script = document.createElement('script')
          script.src = modulePath
          
          // Wait for script to load
          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = () => reject(new Error(`Failed to load ${modulePath}`))
            document.head.appendChild(script)
          })
        }
        
        scriptLoaded = true
      }

      // Get the module factory from global scope
      const moduleFactory = (window as any).createHtmlLayoutParserModule
      
      if (typeof moduleFactory !== 'function') {
        throw new Error('WASM module factory not found. Make sure html_layout_parser.js is loaded correctly.')
      }

      console.log('Initializing WASM module with debug output capture...')

      // Initialize the WASM module with custom print functions
      wasmModule = await moduleFactory({
        locateFile: (path: string) => {
          // Ensure WASM file is loaded from /wasm/ directory
          if (path.endsWith('.wasm')) {
            return '/wasm/' + path
          }
          return path
        },
        print: (text: string) => {
          // Capture stdout from WASM
          console.log('[WASM stdout]', text)
        },
        printErr: (text: string) => {
          // Capture stderr from WASM
          console.error('[WASM stderr]', text)
        }
      })
      
      console.log('WASM module initialized successfully')
      return wasmModule
    } catch (err: any) {
      console.error('Failed to load WASM module:', err)
      error.value = `Failed to load WASM module: ${err.message}. Make sure to run ./copy-wasm.sh first!`
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function loadFont(fontData: Uint8Array, fontName: string) {
    if (!wasmModule) {
      throw new Error('WASM module not initialized')
    }

    // Unload previous font
    if (currentFontId > 0) {
      wasmModule._unloadFont(currentFontId)
      currentFontId = 0
    }

    // Allocate memory for font data
    const dataPtr = wasmModule._malloc(fontData.length)
    if (dataPtr === 0) {
      throw new Error('Failed to allocate memory for font data')
    }

    // Allocate memory for font name
    const nameBytes = wasmModule.lengthBytesUTF8(fontName) + 1
    const namePtr = wasmModule._malloc(nameBytes)
    if (namePtr === 0) {
      wasmModule._free(dataPtr)
      throw new Error('Failed to allocate memory for font name')
    }

    try {
      // Copy data to WASM memory
      wasmModule.HEAPU8.set(fontData, dataPtr)
      wasmModule.stringToUTF8(fontName, namePtr, nameBytes)

      // Load font
      const fontId = wasmModule._loadFont(dataPtr, fontData.length, namePtr)

      if (fontId <= 0) {
        throw new Error('Failed to load font')
      }

      // Set as default font
      wasmModule._setDefaultFont(fontId)

      currentFontId = fontId
      return fontId
    } finally {
      wasmModule._free(dataPtr)
      wasmModule._free(namePtr)
    }
  }

  async function parseHTML(
    html: string,
    css: string,
    viewportWidth: number,
    mode: 'flat' | 'byRow' | 'simple' | 'full' = 'flat'
  ) {
    if (!wasmModule) {
      throw new Error('WASM module not initialized')
    }

    // Allocate HTML string
    const htmlBytes = wasmModule.lengthBytesUTF8(html) + 1
    const htmlPtr = wasmModule._malloc(htmlBytes)
    if (htmlPtr === 0) {
      throw new Error('Failed to allocate memory for HTML')
    }

    // Allocate mode string
    const modeBytes = wasmModule.lengthBytesUTF8(mode) + 1
    const modePtr = wasmModule._malloc(modeBytes)
    if (modePtr === 0) {
      wasmModule._free(htmlPtr)
      throw new Error('Failed to allocate memory for mode')
    }

    // Allocate CSS string if provided
    let cssPtr = 0
    if (css && css.trim()) {
      const cssBytes = wasmModule.lengthBytesUTF8(css) + 1
      cssPtr = wasmModule._malloc(cssBytes)
      if (cssPtr !== 0) {
        wasmModule.stringToUTF8(css, cssPtr, cssBytes)
      }
    }

    try {
      wasmModule.stringToUTF8(html, htmlPtr, htmlBytes)
      wasmModule.stringToUTF8(mode, modePtr, modeBytes)

      const resultPtr = wasmModule._parseHTML(
        htmlPtr,
        cssPtr,
        viewportWidth,
        modePtr,
        1  // Enable debug mode
      )

      if (resultPtr === 0) {
        throw new Error('Parse returned null')
      }

      const resultJson = wasmModule.UTF8ToString(resultPtr)
      wasmModule._freeString(resultPtr)

      return JSON.parse(resultJson)
    } finally {
      wasmModule._free(htmlPtr)
      wasmModule._free(modePtr)
      if (cssPtr !== 0) {
        wasmModule._free(cssPtr)
      }
    }
  }

  function getMemoryUsage() {
    if (!wasmModule || !wasmModule._getTotalMemoryUsage) {
      return 0
    }
    return wasmModule._getTotalMemoryUsage()
  }

  return {
    initParser,
    loadFont,
    parseHTML,
    getMemoryUsage,
    isLoading,
    error
  }
}
