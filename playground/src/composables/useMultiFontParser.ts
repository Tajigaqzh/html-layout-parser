import { ref } from 'vue'
import { HtmlLayoutParser } from 'html-layout-parser/web'

export function useMultiFontParser() {
  const parser = ref<HtmlLayoutParser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const loadedFonts = ref<Map<string, number>>(new Map())

  async function initParser(): Promise<HtmlLayoutParser> {
    if (parser.value) {
      return parser.value
    }

    try {
      isLoading.value = true
      error.value = null
      
      parser.value = new HtmlLayoutParser()
      await parser.value.init()
      
      console.log('✅ Multi-font parser initialized')
      return parser.value
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function loadFont(fontData: Uint8Array, fontName: string): Promise<number> {
    if (!parser.value) {
      throw new Error('Parser not initialized')
    }

    try {
      const fontId = parser.value.loadFont(fontData, fontName)
      
      if (fontId <= 0) {
        throw new Error(`Failed to load font ${fontName}`)
      }
      
      loadedFonts.value.set(fontName, fontId)
      console.log(`✅ Loaded font ${fontName} with ID ${fontId}`)
      
      // Set first font as default
      if (loadedFonts.value.size === 1) {
        parser.value.setDefaultFont(fontId)
      }
      
      return fontId
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }

  async function parseHTML(html: string, css: string, viewportWidth: number, mode: string = 'flat'): Promise<any[]> {
    if (!parser.value) {
      throw new Error('Parser not initialized')
    }

    try {
      isLoading.value = true
      error.value = null
      
      const options: any = {
        viewportWidth,
        mode
      }
      
      if (css && css.trim()) {
        options.css = css
      }
      
      const result = parser.value.parse(html, options)
      console.log(`✅ Parsed HTML: ${result.length} layout items`)
      
      return result
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function getLoadedFonts(): Map<string, number> {
    return loadedFonts.value
  }

  return {
    parser: parser.value,
    isLoading,
    error,
    initParser,
    loadFont,
    parseHTML,
    getLoadedFonts
  }
}