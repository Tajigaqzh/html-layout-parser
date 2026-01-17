<template>
  <div class="demo-page">
    <div class="page-header">
      <h1>Basic Demo</h1>
      <p>Compare DOM rendering with Canvas rendering using HTML Layout Parser</p>
    </div>

    <div class="controls">
      <div class="control-group">
        <label>Load Font:</label>
        <input type="file" @change="handleFontLoad" accept=".ttf,.otf" ref="fontInput" :disabled="fontLoading" />
        <button @click="loadDefaultFont" class="btn-secondary" :disabled="fontLoading || isLoading">
          {{ fontLoading ? 'Loading...' : 'Load Default Font' }}
        </button>
        <span v-if="fontLoading" class="status-badge loading">⏳ Loading font (8MB)...</span>
        <span v-else-if="fontLoaded" class="status-badge success">✓ {{ fontName }}</span>
        <span v-else class="status-badge">No font loaded</span>
      </div>

      <div class="control-group">
        <label>Viewport Width:</label>
        <input type="number" v-model.number="viewportWidth" min="100" max="2000" />
        <span>px</span>
      </div>

      <button @click="handleParse" :disabled="!fontLoaded || isLoading || fontLoading" class="btn-primary">
        {{ isLoading ? 'Parsing...' : 'Parse & Render' }}
      </button>
    </div>

    <div class="editor-section">
      <div class="editor-panel">
        <h3>HTML Input</h3>
        <textarea v-model="htmlInput" class="code-editor" rows="10"></textarea>
      </div>

      <div class="editor-panel">
        <h3>CSS Input (Optional)</h3>
        <textarea v-model="cssInput" class="code-editor" rows="10"></textarea>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <ComparisonView
      v-if="layouts"
      :key="renderKey"
      :html="htmlInput"
      :css="cssInput"
      :layouts="layouts"
      :metrics="metrics"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ComparisonView from '../components/ComparisonView.vue'
import { useParser } from '../composables/useParser'

const { initParser, loadFont, parseHTML, isLoading, error } = useParser()

const fontLoaded = ref(false)
const fontName = ref('')
const fontLoading = ref(false)
const viewportWidth = ref(800)
const layouts = ref<any[]>()
const metrics = ref<any>()
const renderKey = ref(0)

const htmlInput = ref(`<div class="container">
  <h1 class="title">琵琶行</h1>
  <p class="author">作者：<span class="italic">白居易</span></p>
  
  <p class="content">
    浔阳江头夜送客，<span class="large">枫叶荻花</span>秋瑟瑟。
  </p>
  
  <p class="highlight">
    忽闻水上<span class="red bold">琵琶</span>声，主人忘归客不发。
  </p>
  
  <p class="mixed">
    <span class="tiny">转轴拨弦三两声</span>，<span class="small">未成曲调先有情</span>。
  </p>
  
  <p class="emphasis">
    <span class="italic">大弦嘈嘈如急雨</span>，<span class="bold">小弦切切如私语</span>。
  </p>
</div>`)

const cssInput = ref(`.container {
  padding: 20px;
}

.title {
  font-size: 32px;
  color: #1e293b;
  margin-bottom: 8px;
  text-align: center;
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
  margin-top: 12px;
  margin-bottom: 16px;
}

.mixed {
  font-size: 16px;
  line-height: 2.2;
  margin-bottom: 16px;
  color: #334155;
}

.emphasis {
  font-size: 20px;
  line-height: 2;
  margin-bottom: 16px;
  color: #1e293b;
}

/* Font sizes */
.tiny {
  font-size: 12px;
}

.small {
  font-size: 14px;
}

.normal {
  font-size: 16px;
}

.large {
  font-size: 24px;
}

.xlarge {
  font-size: 28px;
}

.huge {
  font-size: 36px;
}

/* Font styles */
.italic {
  font-style: italic;
}

.bold {
  font-weight: bold;
}

/* Colors */
.red {
  color: #ef4444;
}

.blue {
  color: #3b82f6;
}

/* Decorations */
.underline {
  text-decoration: underline;
}`)

async function handleFontLoad(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  error.value = null
  fontLoading.value = true
  
  try {
    await initParser()
    const arrayBuffer = await file.arrayBuffer()
    const fontData = new Uint8Array(arrayBuffer)
    const name = file.name.replace(/\.[^.]+$/, '')
    
    await loadFont(fontData, name)
    fontLoaded.value = true
    fontName.value = name
    
    // Wait for browser to load the font
    if (document.fonts) {
      await document.fonts.ready
    }
  } catch (err: any) {
    console.error('Font loading error:', err)
    error.value = err.message
  } finally {
    fontLoading.value = false
  }
}

async function loadDefaultFont() {
  error.value = null
  fontLoading.value = true
  
  try {
    await initParser()
    
    // Fetch the default font from public directory
    const response = await fetch('/fonts/aliBaBaFont65.ttf')
    if (!response.ok) {
      throw new Error('Failed to load default font')
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const fontData = new Uint8Array(arrayBuffer)
    
    await loadFont(fontData, 'aliBaBaFont65')
    fontLoaded.value = true
    fontName.value = 'aliBaBaFont65'
    
    // Wait for browser to load the font
    if (document.fonts) {
      await document.fonts.ready
    }
    
    // Auto-parse after loading font
    await handleParse()
  } catch (err: any) {
    console.error('Font loading error:', err)
    error.value = err.message
  } finally {
    fontLoading.value = false
  }
}

async function handleParse() {
  if (!fontLoaded.value) return

  error.value = null
  
  try {
    const startTime = performance.now()
    const result = await parseHTML(htmlInput.value, cssInput.value, viewportWidth.value, 'flat')
    const endTime = performance.now()

    layouts.value = result
    metrics.value = {
      charCount: Array.isArray(result) ? result.length : 0,
      parseTime: (endTime - startTime).toFixed(2),
      memory: 'N/A' // Will be implemented
    }
    
    // Force re-render
    renderKey.value++
  } catch (err: any) {
    console.error('Parse error:', err)
    error.value = err.message
  }
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

.control-group input[type="file"] {
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

.btn-primary {
  padding: 8px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 6px 16px;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 8px;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-secondary:disabled {
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

@media (max-width: 1024px) {
  .editor-section {
    grid-template-columns: 1fr;
  }
}
</style>
