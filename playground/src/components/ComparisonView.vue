<template>
  <div class="comparison-view">
    <div class="comparison-panel">
      <div class="panel-header">
        <h3>🌐 DOM Rendering</h3>
        <span class="panel-subtitle">Browser native rendering</span>
      </div>
      <div class="panel-content dom-panel">
        <div ref="domContainer" class="dom-container" v-html="renderedHtml"></div>
      </div>
    </div>

    <div class="comparison-panel">
      <div class="panel-header">
        <h3>🎨 Canvas Rendering</h3>
        <span class="panel-subtitle">Parsed and rendered by HTML Layout Parser</span>
      </div>
      <div class="panel-content canvas-panel">
        <canvas ref="canvasRef" class="render-canvas"></canvas>
      </div>
      <div class="metrics" v-if="metrics">
        <div class="metric">
          <span class="metric-label">Characters:</span>
          <span class="metric-value">{{ metrics.charCount }}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Parse Time:</span>
          <span class="metric-value">{{ metrics.parseTime }}ms</span>
        </div>
        <div class="metric">
          <span class="metric-label">Memory:</span>
          <span class="metric-value">{{ metrics.memory }}</span>
        </div>
      </div>
    </div>

    <div class="comparison-panel" v-if="layouts && layouts.length > 0">
      <div class="panel-header">
        <h3>📍 Absolute Position Rendering</h3>
        <span class="panel-subtitle">Using absolute positioning to verify layout data accuracy</span>
      </div>
      <div class="panel-content absolute-panel">
        <div class="absolute-container" :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }">
          <span
            v-for="(char, index) in layouts"
            :key="index"
            class="absolute-char"
            :style="{
              left: char.x + 'px',
              top: char.y + 'px',
              width: char.width + 'px',
              height: char.height + 'px',
              fontSize: char.fontSize + 'px',
              fontFamily: char.fontFamily + ', Arial',
              fontWeight: char.fontWeight,
              fontStyle: char.fontStyle,
              color: char.color,
              lineHeight: char.height + 'px'
            }"
          >{{ char.character }}</span>
        </div>
      </div>
      <div class="debug-info">
        <details>
          <summary>Debug Info (First 10 characters)</summary>
          <pre>{{ JSON.stringify(layouts.slice(0, 10), null, 2) }}</pre>
        </details>
        <details>
          <summary>Browser Font Metrics Test</summary>
          <div class="font-test">
            <canvas ref="testCanvas" width="500" height="200" style="border: 1px solid #ccc;"></canvas>
            <button @click="measureFonts" class="measure-btn">Measure Browser Font Widths</button>
            <pre v-if="fontMeasurements">{{ fontMeasurements }}</pre>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'

interface Props {
  html: string
  css?: string
  layouts?: any[]
  metrics?: {
    charCount: number
    parseTime: string
    memory: string
  }
}

const props = defineProps<Props>()

const domContainer = ref<HTMLElement>()
const canvasRef = ref<HTMLCanvasElement>()
const testCanvas = ref<HTMLCanvasElement>()
const fontMeasurements = ref('')

const renderedHtml = computed(() => {
  if (!props.css) return props.html
  
  // Wrap HTML with style tag
  return `<style>${props.css}</style>${props.html}`
})

const canvasWidth = computed(() => {
  if (!props.layouts || props.layouts.length === 0) return 800
  
  let maxX = 0
  for (const char of props.layouts) {
    maxX = Math.max(maxX, char.x + char.width)
  }
  return Math.max(800, maxX + 40)
})

const canvasHeight = computed(() => {
  if (!props.layouts || props.layouts.length === 0) return 400
  
  let maxY = 0
  for (const char of props.layouts) {
    maxY = Math.max(maxY, char.y + char.height)
  }
  return Math.max(400, maxY + 40)
})

watch(() => props.layouts, async (layouts) => {
  if (layouts && layouts.length > 0) {
    // Wait for next tick to ensure canvas is mounted
    await nextTick()
    
    if (canvasRef.value) {
      // Wait for fonts to be loaded - this is critical for multi-font rendering
      if (document.fonts) {
        try {
          console.log('Waiting for fonts to load...')
          await document.fonts.ready
          console.log('Fonts ready, starting render')
          
          // Additional check: verify each font used in layouts is actually loaded
          const fontsUsed = new Set(layouts.map(c => c.fontFamily))
          console.log('Fonts used in layouts:', Array.from(fontsUsed))
          
          for (const fontFamily of fontsUsed) {
            const loaded = document.fonts.check(`16px ${fontFamily}`)
            console.log(`Font ${fontFamily}: ${loaded ? 'loaded' : 'NOT LOADED'}`)
          }
        } catch (e) {
          console.warn('Font loading warning:', e)
        }
      }
      
      renderToCanvas(layouts)
    }
  }
}, { immediate: true })

function renderToCanvas(layouts: any[]) {
  const canvas = canvasRef.value
  if (!canvas) {
    console.warn('Canvas ref not available')
    return
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.warn('Canvas context not available')
    return
  }

  console.log('Starting canvas render with', layouts.length, 'characters')
  console.log('First 5 layouts:', JSON.parse(JSON.stringify(layouts.slice(0, 5))))
  
  // Calculate canvas size
  let maxX = 0, maxY = 0
  for (const char of layouts) {
    maxX = Math.max(maxX, char.x + char.width)
    maxY = Math.max(maxY, char.y + char.height)
  }

  canvas.width = Math.max(800, maxX + 40)
  canvas.height = Math.max(400, maxY + 40)

  console.log('Canvas size:', canvas.width, 'x', canvas.height)

  // Clear canvas with white background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw a border for debugging
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, canvas.width, canvas.height)

  // Draw bounding boxes for debugging (optional - can be toggled)
  const showBoundingBoxes = false
  if (showBoundingBoxes) {
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)'
    ctx.lineWidth = 1
    for (const char of layouts) {
      ctx.strokeRect(char.x, char.y, char.width, char.height)
    }
  }

  // Render characters
  let rendered = 0
  for (const char of layouts) {
    // Log first few characters
    if (rendered < 5) {
      console.log(`Rendering char ${rendered}:`, {
        character: char.character,
        x: char.x,
        y: char.y,
        width: char.width,
        height: char.height,
        fontSize: char.fontSize,
        fontFamily: char.fontFamily,
        baseline: char.baseline,
        color: char.color
      })
    }
    
    // Background
    if (char.backgroundColor && char.backgroundColor !== '#00000000') {
      ctx.fillStyle = parseColor(char.backgroundColor)
      ctx.fillRect(char.x, char.y, char.width, char.height)
    }

    // Font - use the actual font family from the layout
    const fontStyle = char.fontStyle || 'normal'
    const fontWeight = char.fontWeight || 400
    const fontSize = char.fontSize || 16
    // Use the actual font family from the character layout, with fallback
    const fontFamily = char.fontFamily || 'Arial'
    const fontString = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}, Arial, sans-serif`
    ctx.font = fontString
    
    if (rendered < 5) {
      console.log(`Font string for char ${rendered}:`, fontString)
    }

    // Text color
    ctx.fillStyle = parseColor(char.color)

    // Draw text at baseline position
    const baseline = char.baseline || (char.y + char.height * 0.8)
    ctx.fillText(char.character, char.x, baseline)
    rendered++

    // Text decoration
    if (char.textDecoration) {
      const dec = char.textDecoration
      ctx.strokeStyle = parseColor(dec.color || char.color)
      ctx.lineWidth = dec.thickness || 1

      if (dec.underline) {
        const y = baseline + 2
        ctx.beginPath()
        ctx.moveTo(char.x, y)
        ctx.lineTo(char.x + char.width, y)
        ctx.stroke()
      }

      if (dec.lineThrough) {
        const y = char.y + char.height / 2
        ctx.beginPath()
        ctx.moveTo(char.x, y)
        ctx.lineTo(char.x + char.width, y)
        ctx.stroke()
      }

      if (dec.overline) {
        ctx.beginPath()
        ctx.moveTo(char.x, char.y)
        ctx.lineTo(char.x + char.width, char.y)
        ctx.stroke()
      }
    }
  }
  
  console.log('Canvas render complete:', rendered, 'characters rendered')
}

function parseColor(color: string): string {
  if (!color || color === 'transparent' || color === '#00000000') {
    return 'transparent'
  }

  // Handle #RRGGBBAA format
  if (color.startsWith('#') && color.length === 9) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    const a = parseInt(color.slice(7, 9), 16) / 255
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`
  }

  return color
}

function measureFonts() {
  if (!props.layouts || props.layouts.length === 0 || !testCanvas.value) {
    return
  }

  const ctx = testCanvas.value.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, testCanvas.value.width, testCanvas.value.height)

  const measurements: string[] = []
  measurements.push('Browser Font Width Measurements:')
  measurements.push('='.repeat(60))

  // Test first 10 characters
  const testChars = props.layouts.slice(0, 10)
  
  for (let i = 0; i < testChars.length; i++) {
    const char = testChars[i]
    const fontString = `${char.fontStyle} ${char.fontWeight} ${char.fontSize}px ${char.fontFamily}, Arial`
    ctx.font = fontString
    
    const metrics = ctx.measureText(char.character)
    const browserWidth = metrics.width
    const wasmWidth = char.width
    const diff = browserWidth - wasmWidth
    const diffPercent = ((diff / wasmWidth) * 100).toFixed(1)
    
    measurements.push(`\nChar ${i}: "${char.character}"`)
    measurements.push(`  Font: ${char.fontFamily} ${char.fontSize}px`)
    measurements.push(`  WASM width: ${wasmWidth}px`)
    measurements.push(`  Browser width: ${browserWidth.toFixed(2)}px`)
    measurements.push(`  Difference: ${diff.toFixed(2)}px (${diffPercent}%)`)
    measurements.push(`  Position: x=${char.x}, y=${char.y}`)
    
    // Draw on test canvas
    ctx.fillStyle = char.color
    ctx.fillText(char.character, 10, 30 + i * 20)
    
    // Draw WASM width box
    ctx.strokeStyle = 'blue'
    ctx.strokeRect(10, 15 + i * 20, wasmWidth, char.fontSize)
    
    // Draw browser width box
    ctx.strokeStyle = 'red'
    ctx.strokeRect(10, 15 + i * 20, browserWidth, char.fontSize)
  }

  fontMeasurements.value = measurements.join('\n')
  console.log(fontMeasurements.value)
}
</script>

<style scoped>
.comparison-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 24px;
}

.comparison-panel {
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.panel-header {
  padding: 16px 20px;
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
}

.panel-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.panel-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.panel-content {
  padding: 20px;
  min-height: 400px;
  overflow: auto;
}

.dom-panel {
  background: white;
}

.dom-container {
  width: 100%;
}

.canvas-panel {
  background: white;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  overflow: auto;
}

.render-canvas {
  display: block;
  /* Don't scale canvas - use actual pixel dimensions */
}

.metrics {
  display: flex;
  gap: 24px;
  padding: 12px 20px;
  background: var(--bg-color);
  border-top: 1px solid var(--border-color);
  font-size: 0.875rem;
}

.metric {
  display: flex;
  align-items: center;
  gap: 6px;
}

.metric-label {
  color: var(--text-muted);
}

.metric-value {
  font-weight: 600;
  color: var(--text-color);
}

.absolute-panel {
  background: white;
  overflow: auto;
}

.absolute-container {
  position: relative;
  background: white;
  border: 1px solid #e5e7eb;
}

.absolute-char {
  position: absolute;
  white-space: pre;
  pointer-events: none;
}

.debug-info {
  padding: 12px 20px;
  background: var(--bg-color);
  border-top: 1px solid var(--border-color);
  font-size: 0.75rem;
}

.debug-info summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--text-color);
  padding: 4px 0;
}

.debug-info pre {
  margin-top: 8px;
  padding: 12px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 11px;
  line-height: 1.4;
}

.font-test {
  margin-top: 12px;
}

.measure-btn {
  margin: 12px 0;
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.measure-btn:hover {
  background: #2563eb;
}

@media (max-width: 1024px) {
  .comparison-view {
    grid-template-columns: 1fr;
  }
}
</style>
