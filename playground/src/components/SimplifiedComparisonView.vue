Run pnpm run build:packages
 ERR_PNPM_NO_SCRIPT  Missing script: build:packages
Command "build:packages" not found. Did you mean "pnpm run build:wasm"?
Error: Process completed with exit code 1.<template>
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

const renderedHtml = computed(() => {
  if (!props.css) return props.html
  return `<style>${props.css}</style>${props.html}`
})

watch(() => props.layouts, async (layouts) => {
  if (layouts && layouts.length > 0) {
    await nextTick()
    
    if (canvasRef.value) {
      if (document.fonts) {
        try {
          await document.fonts.ready
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
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  console.log('=== Canvas Rendering ===')
  console.log('Total layouts to render:', layouts.length)
  console.log('First 3 layouts (detailed):', JSON.stringify(layouts.slice(0, 3), null, 2))

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

  // Draw a border
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, canvas.width, canvas.height)

  // Render characters
  for (const char of layouts) {
    // Background
    if (char.backgroundColor && char.backgroundColor !== '#00000000') {
      ctx.fillStyle = parseColor(char.backgroundColor)
      ctx.fillRect(char.x, char.y, char.width, char.height)
    }

    // Font
    const fontStyle = char.fontStyle || 'normal'
    const fontWeight = char.fontWeight || 400
    const fontSize = char.fontSize || 16
    const fontFamily = char.fontFamily || 'Arial'
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}, Arial, sans-serif`

    // Text color
    ctx.fillStyle = parseColor(char.color)

    // Draw text at baseline position
    const baseline = char.baseline || (char.y + char.height * 0.8)
    ctx.fillText(char.character, char.x, baseline)

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
  
  console.log('Canvas rendering complete')
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

@media (max-width: 1024px) {
  .comparison-view {
    grid-template-columns: 1fr;
  }
}
</style>
