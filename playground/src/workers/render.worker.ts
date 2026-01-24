// Worker for offscreen canvas rendering
import { HtmlLayoutParser } from 'html-layout-parser/worker'

let parser: HtmlLayoutParser | null = null
let currentFontId = 0

interface RenderMessage {
  type: 'init' | 'loadFont' | 'render'
  useNpmPackage?: boolean
  fontData?: Uint8Array
  fontName?: string
  html?: string
  css?: string
  width?: number
  canvas?: OffscreenCanvas
}

// Initialize parser
async function initParser() {
  try {
    parser = new HtmlLayoutParser()
    await parser.init()
    console.log('[Worker] Parser initialized successfully')
    return parser
  } catch (error) {
    console.error('[Worker] Parser init error:', error)
    throw error
  }
}

// Load font into parser
function loadFont(fontData: Uint8Array, fontName: string): number {
  if (!parser) {
    throw new Error('WASM not initialized')
  }
  
  console.log('[Worker] Loading font:', { fontName, dataSize: fontData.length })
  
  // Unload previous font
  if (currentFontId > 0) {
    parser.unloadFont(currentFontId)
    currentFontId = 0
  }
  
  // Load new font
  const fontId = parser.loadFont(fontData, fontName)
  
  console.log('[Worker] Font loaded with ID:', fontId)
  
  if (fontId <= 0) {
    throw new Error('Failed to load font')
  }
  
  // Set as default font
  parser.setDefaultFont(fontId)
  
  currentFontId = fontId
  return fontId
}

// Parse HTML
function parseHTML(html: string, css: string, width: number): any[] {
  if (!parser) {
    throw new Error('WASM not initialized')
  }
  
  console.log('[Worker] Parsing HTML:', { htmlLength: html.length, cssLength: css.length, width })
  
  const options: any = {
    viewportWidth: width,
    mode: 'flat'
  }
  
  if (css && css.trim()) {
    options.css = css
  }
  
  const layouts = parser.parse(html, options)
  console.log('[Worker] Parse result:', { layoutCount: layouts.length, firstLayout: layouts[0] })
  
  return layouts
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
  const { type, useNpmPackage, fontData, fontName, html, css, width, canvas } = e.data
  
  try {
    switch (type) {
      case 'init':
        if (useNpmPackage) {
          await initParser()
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

