<template>
  <div class="demo-page">
    <div class="page-header">
      <h1>Worker Offscreen Rendering</h1>
      <p>Use Web Worker for offscreen canvas rendering and export images</p>
    </div>

    <div class="controls">
      <div class="control-group">
        <button @click="loadDefaultFont" class="btn-secondary" :disabled="fontLoading || workerBusy">
          {{ fontLoading ? 'Loading...' : 'Load Font' }}
        </button>
        <span v-if="fontLoading" class="status-badge loading">⏳ Loading...</span>
        <span v-else-if="fontLoaded" class="status-badge success">✓ Font Ready</span>
      </div>

      <div class="control-group">
        <label>Width:</label>
        <input type="number" v-model.number="viewportWidth" min="100" max="2000" />
        <span>px</span>
      </div>

      <button 
        @click="handleRender" 
        :disabled="!fontLoaded || workerBusy" 
        class="btn-primary"
      >
        {{ workerBusy ? 'Rendering...' : 'Render in Worker' }}
      </button>

      <button 
        @click="exportImage" 
        :disabled="!renderedImage" 
        class="btn-export"
      >
        📥 Export Image
      </button>
    </div>

    <div class="editor-section">
      <div class="editor-panel">
        <h3>HTML Input</h3>
        <textarea v-model="htmlInput" class="code-editor" rows="8"></textarea>
      </div>

      <div class="editor-panel">
        <h3>CSS Input</h3>
        <textarea v-model="cssInput" class="code-editor" rows="8"></textarea>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="metrics" class="metrics">
      <div class="metric-item">
        <span class="metric-label">Characters:</span>
        <span class="metric-value">{{ metrics.charCount }}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Canvas Size:</span>
        <span class="metric-value">{{ metrics.width }} × {{ metrics.height }}px</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Render Time:</span>
        <span class="metric-value">{{ metrics.renderTime }}ms</span>
      </div>
    </div>

    <div v-if="renderedImage" class="comparison-section">
      <div class="comparison-panel">
        <h3>🌐 DOM Rendering (Browser)</h3>
        <div class="dom-preview" ref="domPreviewRef">
          <div v-html="renderedHtml"></div>
        </div>
      </div>

      <div class="comparison-panel">
        <h3>🎨 Canvas Rendering (Worker)</h3>
        <div class="image-container">
          <img :src="renderedImage" alt="Rendered output" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'

const worker = ref<Worker | null>(null)
const fontLoaded = ref(false)
const fontLoading = ref(false)
const workerBusy = ref(false)
const viewportWidth = ref(800)
const error = ref('')
const renderedImage = ref('')
const metrics = ref<any>(null)

const htmlInput = ref(`<div class="container">
  <h1 class="title">琵琶行</h1>
  <p class="author">作者：<span class="italic">白居易</span></p>
  
  <p class="content">
    浔阳江头夜送客，<span class="large">枫叶荻花</span>秋瑟瑟。
  </p>
  
  <p class="highlight">
    忽闻水上<span class="red bold">琵琶</span>声，主人忘归客不发。
  </p>
</div>`)

const cssInput = ref(`.container {
  padding: 20px;
}

.title {
  font-size: 32px;
  color: #1e293b;
  text-align: center;
  margin-bottom: 8px;
}

.author {
  font-size: 16px;
  color: #64748b;
  text-align: center;
  margin-bottom: 20px;
}

.content {
  font-size: 18px;
  color: #475569;
  line-height: 1.8;
  margin-bottom: 16px;
}

.highlight {
  font-size: 18px;
  line-height: 1.8;
}

.large {
  font-size: 24px;
}

.italic {
  font-style: italic;
}

.bold {
  font-weight: bold;
}

.red {
  color: #ef4444;
}`)

const domPreviewRef = ref<HTMLElement | null>(null)

// Combine HTML and CSS for DOM rendering
const renderedHtml = computed(() => {
  if (!cssInput.value) return htmlInput.value
  return `<style>${cssInput.value}</style>${htmlInput.value}`
})

// Apply CSS to DOM preview (no longer needed, using computed property instead)
function applyDomStyles() {
  // This function is kept for compatibility but no longer used
}

onMounted(() => {
  // Create worker
  worker.value = new Worker(
    new URL('../workers/render.worker.ts', import.meta.url),
    { type: 'module' }
  )
  
  worker.value.onmessage = handleWorkerMessage
  
  // Initialize worker with WASM
  worker.value.postMessage({
    type: 'init',
    wasmJsPath: '/wasm/html_layout_parser.js',
    wasmBinaryPath: '/wasm/html_layout_parser.wasm'
  })
})

onUnmounted(() => {
  worker.value?.terminate()
})

function handleWorkerMessage(e: MessageEvent) {
  const { type, success, error: workerError, width, height, charCount, blob } = e.data
  
  if (!success) {
    error.value = workerError || 'Worker error'
    workerBusy.value = false
    fontLoading.value = false
    return
  }
  
  switch (type) {
    case 'init':
      console.log('Worker initialized')
      break
      
    case 'loadFont':
      fontLoaded.value = true
      fontLoading.value = false
      break
      
    case 'render':
      metrics.value = {
        width,
        height,
        charCount,
        renderTime: (performance.now() - renderStartTime.value).toFixed(2)
      }
      
      // Create image URL from blob
      if (blob) {
        if (renderedImage.value) {
          URL.revokeObjectURL(renderedImage.value)
        }
        renderedImage.value = URL.createObjectURL(blob)
      }
      
      workerBusy.value = false
      break
  }
}

const renderStartTime = ref(0)

async function loadDefaultFont() {
  if (!worker.value) return
  
  error.value = ''
  fontLoading.value = true
  
  try {
    const response = await fetch('/fonts/aliBaBaFont65.ttf')
    if (!response.ok) {
      throw new Error('Failed to load font')
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const fontData = new Uint8Array(arrayBuffer)
    
    worker.value.postMessage({
      type: 'loadFont',
      fontData,
      fontName: 'aliBaBaFont65'
    })
    
    // Also load in main thread for font rendering
    if (document.fonts) {
      await document.fonts.ready
    }
  } catch (err: any) {
    error.value = err.message
    fontLoading.value = false
  }
}

async function handleRender() {
  if (!worker.value || !fontLoaded.value) return
  
  error.value = ''
  workerBusy.value = true
  renderStartTime.value = performance.now()
  
  try {
    // Create offscreen canvas
    const canvas = new OffscreenCanvas(viewportWidth.value, 1000)
    
    // Send to worker (canvas will be transferred)
    worker.value.postMessage({
      type: 'render',
      canvas,
      html: htmlInput.value,
      css: cssInput.value,
      width: viewportWidth.value
    }, [canvas])
  } catch (err: any) {
    error.value = err.message
    workerBusy.value = false
  }
}

function exportImage() {
  if (!renderedImage.value) return
  
  const link = document.createElement('a')
  link.href = renderedImage.value
  link.download = `rendered-${Date.now()}.png`
  link.click()
}
</script>

<style scoped>
.demo-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.page-header p {
  color: var(--text-muted);
  font-size: 1.125rem;
}

.controls {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  padding: 20px;
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: 24px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-group label {
  font-weight: 500;
  font-size: 0.875rem;
}

.control-group input[type="number"] {
  width: 100px;
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
}

.status-badge {
  padding: 4px 12px;
  background: var(--border-color);
  color: var(--text-muted);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.success {
  background: var(--success-color);
  color: white;
}

.status-badge.loading {
  background: #f59e0b;
  color: white;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.btn-primary,
.btn-secondary,
.btn-export {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-export {
  background: #10b981;
  color: white;
}

.btn-export:hover:not(:disabled) {
  background: #059669;
}

.btn-primary:disabled,
.btn-secondary:disabled,
.btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.editor-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.editor-panel {
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}

.editor-panel h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.code-editor {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
}

.error-message {
  padding: 16px;
  background: #fef2f2;
  color: var(--error-color);
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin-bottom: 24px;
}

.metrics {
  display: flex;
  gap: 24px;
  padding: 16px 20px;
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: 24px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
}

.result-section {
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}

.result-section h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.comparison-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.comparison-panel {
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}

.comparison-panel h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dom-preview {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  background: #ffffff;
  min-height: 200px;
  font-family: 'aliBaBaFont65', Arial, sans-serif;
  overflow: hidden;
}

.dom-preview > div {
  max-width: 100%;
  overflow-wrap: break-word;
}

.image-container {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  background: #f8fafc;
  min-height: 200px;
}

.image-container img {
  max-width: 100%;
  width: 100%;
  height: auto;
  display: block;
}

@media (max-width: 1024px) {
  .editor-section {
    grid-template-columns: 1fr;
  }
  
  .metrics {
    flex-direction: column;
    gap: 12px;
  }
  
  .comparison-section {
    grid-template-columns: 1fr;
  }
}
</style>
