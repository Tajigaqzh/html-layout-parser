import { ref } from 'vue'
import { HtmlLayoutParser } from 'html-layout-parser/web'

let parser: HtmlLayoutParser | null = null
let currentFontId = 0

export function useParser() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function initParser() {
    if (parser) return parser

    isLoading.value = true
    error.value = null

    try {
      // Create parser instance from npm package
      parser = new HtmlLayoutParser()
      
      // Initialize - WASM will be loaded automatically
      console.log('Loading WASM from npm package via direct import...')
      await parser.init()
      
      console.log('HTML Layout Parser initialized successfully from npm package v0.1.0 with direct import')
      return parser
    } catch (err: any) {
      console.error('Failed to initialize parser:', err)
      error.value = `Failed to initialize parser: ${err.message}`
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function loadFont(fontData: Uint8Array, fontName: string) {
    if (!parser) {
      throw new Error('Parser not initialized')
    }

    try {
      // Unload previous font if exists
      if (currentFontId > 0) {
        parser.unloadFont(currentFontId)
        currentFontId = 0
      }

      // Load new font
      const fontId = parser.loadFont(fontData, fontName)

      if (fontId <= 0) {
        throw new Error('Failed to load font')
      }

      // Set as default font
      parser.setDefaultFont(fontId)

      currentFontId = fontId
      return fontId
    } catch (err: any) {
      console.error('Failed to load font:', err)
      throw err
    }
  }

  async function parseHTML(
    html: string,
    css: string,
    viewportWidth: number,
    mode: 'flat' | 'byRow' | 'simple' | 'full' = 'flat'
  ) {
    if (!parser) {
      throw new Error('Parser not initialized')
    }

    try {
      const options: any = {
        viewportWidth,
        mode
      }

      // Add CSS if provided
      if (css && css.trim()) {
        options.css = css
      }

      const result = parser.parse(html, options)
      return result
    } catch (err: any) {
      console.error('Failed to parse HTML:', err)
      throw err
    }
  }

  function getMemoryUsage() {
    if (!parser) {
      return 0
    }
    
    try {
      const metrics = parser.getMemoryMetrics()
      return metrics?.totalMemoryUsage || 0
    } catch {
      return 0
    }
  }

  function destroyParser() {
    if (parser) {
      parser.destroy()
      parser = null
      currentFontId = 0
    }
  }

  return {
    initParser,
    loadFont,
    parseHTML,
    getMemoryUsage,
    destroyParser,
    isLoading,
    error
  }
}