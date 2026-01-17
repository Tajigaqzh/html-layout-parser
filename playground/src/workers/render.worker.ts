// Worker for offscreen canvas rendering
interface WasmModule {
  _malloc: (size: number) => number
  _free: (ptr: number) => void
  _loadFont: (dataPtr: number, dataLen: number, namePtr: number) => number
  _unloadFont: (fontId: number) => void
  _setDefaultFont: (fontId: number) => void
  _parseHTML: (htmlPtr: number, cssPtr: number, width: number, modePtr: number, debug: number) => number
  _freeString: (ptr: number) => void
  lengthBytesUTF8: (str: string) => number
  stringToUTF8: (str: string, ptr: number, maxBytes: number) => void
  UTF8ToString: (ptr: number) => string
  HEAPU8: Uint8Array
}

let wasmModule: WasmModule | null = null
let currentFontId = 0

interface RenderMessage {
  type: 'init' | 'loadFont' | 'render'
  wasmJsPath?: string
  wasmBinaryPath?: string
  fontData?: Uint8Array
  fontName?: string
  html?: string
  css?: string
  width?: number
  canvas?: OffscreenCanvas
}

// Load WASM module
async function initWasm(wasmJsPath: string, wasmBinaryPath: string) {
  try {
    // Fetch and evaluate the WASM loader script
    const response = await fetch(wasmJsPath)
    const scriptText = await response.text()
    
    // Create a function from the script text and execute it
    const scriptFunc = new Function(scriptText + '; return createHtmlLayoutParserModule;')
    const createModule = scriptFunc()
    
    if (!createModule) {
      throw new Error('WASM module factory not found')
    }
    
    wasmModule = await createModule({
      locateFile: (path: string) => {
        if (path.endsWith('.wasm')) {
          return wasmBinaryPath
        }
        return path
      }
    })
    
    return wasmModule
  } catch (error) {
    console.error('WASM init error:', error)
    throw error
  }
}

// Load font into WASM
function loadFont(fontData: Uint8Array, fontName: string): number {
  if (!wasmModule) {
    throw new Error('WASM not initialized')
  }
  
  console.log('[Worker] Loading font:', { fontName, dataSize: fontData.length })
  
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
    
    console.log('[Worker] Font loaded with ID:', fontId)
    
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

// Parse HTML
function parseHTML(html: string, css: string, width: number): any[] {
  if (!wasmModule) {
    throw new Error('WASM not initialized')
  }
  
  const mode = 'flat'
  
  console.log('[Worker] Parsing HTML:', { htmlLength: html.length, cssLength: css.length, width })
  
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
    
    const resultPtr = wasmModule._parseHTML(htmlPtr, cssPtr, width, modePtr, 0)
    
    if (resultPtr === 0) {
      throw new Error('Parse returned null')
    }
    
    const resultJson = wasmModule.UTF8ToString(resultPtr)
    wasmModule._freeString(resultPtr)
    
    const layouts = JSON.parse(resultJson)
    console.log('[Worker] Parse result:', { layoutCount: layouts.length, firstLayout: layouts[0] })
    
    return layouts
  } finally {
    wasmModule._free(htmlPtr)
    wasmModule._free(modePtr)
    if (cssPtr !== 0) {
      wasmModule._free(cssPtr)
    }
  }
}

// Render to canvas
function renderToCanvas(
  canvas: OffscreenCanvas,
  layouts: any[],
  width: number
): { width: number; height: number; charCount: number } {
  console.log('[Worker] Rendering to canvas:', { layoutCount: layouts.length, width })
  
  // Calculate canvas height
  let maxY = 0
  layouts.forEach((layout: any) => {
    const bottom = layout.y + layout.height
    if (bottom > maxY) maxY = bottom
  })
  
  const height = Math.ceil(maxY) + 40
  canvas.width = width
  canvas.height = height
  
  console.log('[Worker] Canvas size:', { width, height })
  
  // Render to canvas
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Cannot get canvas context')
  }
  
  // Clear canvas
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  
  // Log first few layouts for debugging
  console.log('[Worker] First 3 layouts:', layouts.slice(0, 3))
  
  // Render each character
  layouts.forEach((layout: any, index: number) => {
    const char = layout.character || layout.char // Support both field names
    const fontStyle = `${layout.italic ? 'italic ' : ''}${layout.fontWeight || layout.weight || 400} ${layout.fontSize}px ${layout.fontFamily}, Arial`
    ctx.font = fontStyle
    ctx.fillStyle = layout.color
    ctx.textBaseline = 'alphabetic'
    
    if (index < 3) {
      console.log(`[Worker] Rendering char ${index}:`, {
        char,
        x: layout.x,
        y: layout.y,
        fontSize: layout.fontSize,
        fontFamily: layout.fontFamily,
        color: layout.color,
        fontStyle
      })
    }
    
    const hasUnderline = layout.textDecoration?.underline || layout.textDecoration === 'underline'
    
    if (hasUnderline) {
      ctx.fillText(char, layout.x, layout.y + layout.fontSize)
      const metrics = ctx.measureText(char)
      const underlineY = layout.y + layout.fontSize + 2
      ctx.beginPath()
      ctx.moveTo(layout.x, underlineY)
      ctx.lineTo(layout.x + metrics.width, underlineY)
      ctx.strokeStyle = layout.color
      ctx.lineWidth = 1
      ctx.stroke()
    } else {
      ctx.fillText(char, layout.x, layout.y + layout.fontSize)
    }
  })
  
  console.log('[Worker] Rendering complete')
  
  return { width, height, charCount: layouts.length }
}

// Message handler
self.onmessage = async (e: MessageEvent<RenderMessage>) => {
  const { type, wasmJsPath, wasmBinaryPath, fontData, fontName, html, css, width, canvas } = e.data
  
  try {
    switch (type) {
      case 'init':
        if (wasmJsPath && wasmBinaryPath) {
          await initWasm(wasmJsPath, wasmBinaryPath)
          self.postMessage({ type: 'init', success: true })
        }
        break
        
      case 'loadFont':
        if (fontData && fontName) {
          loadFont(fontData, fontName)
          self.postMessage({ type: 'loadFont', success: true })
        }
        break
        
      case 'render':
        if (canvas && html && width) {
          // Parse HTML
          const layouts = parseHTML(html, css || '', width)
          
          // Render to canvas
          const result = renderToCanvas(canvas, layouts, width)
          
          // Convert canvas to blob in worker
          const blob = await canvas.convertToBlob({ type: 'image/png' })
          
          self.postMessage({ 
            type: 'render', 
            success: true, 
            blob,
            ...result 
          })
        }
        break
    }
  } catch (error: any) {
    console.error('Worker error:', error)
    self.postMessage({ 
      type: e.data.type, 
      success: false, 
      error: error.message 
    })
  }
}

