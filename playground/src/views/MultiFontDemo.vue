<template>
  <div class="demo-page">
    <div class="page-header">
      <h1>Multi-Font Demo</h1>
      <p>Load and manage multiple fonts with automatic fallback chains</p>
    </div>

    <div class="controls">
      <button @click="loadAllFonts" class="btn-primary" :disabled="fontsLoading || isLoading">
        {{ fontsLoading ? 'Loading Fonts...' : 'Load All Fonts' }}
      </button>
      
      <div class="font-status">
        <span v-for="font in fonts" :key="font.name" class="font-badge" :class="{ loaded: font.loaded }">
          {{ font.loaded ? '✓' : '○' }} {{ font.name }}
        </span>
      </div>
    </div>

    <div v-if="allFontsLoaded" class="editor-section">
      <div class="editor-panel">
        <h3>HTML Input</h3>
        <textarea v-model="htmlInput" class="code-editor" rows="10"></textarea>
      </div>

      <div class="editor-panel">
        <h3>CSS Input</h3>
        <textarea v-model="cssInput" class="code-editor" rows="10"></textarea>
      </div>
    </div>

    <div v-if="allFontsLoaded" class="action-bar">
      <div class="control-group">
        <label>Viewport Width:</label>
        <input type="number" v-model.number="viewportWidth" min="100" max="2000" />
        <span>px</span>
      </div>
      
      <button @click="handleParse" :disabled="isLoading" class="btn-primary">
        {{ isLoading ? 'Parsing...' : 'Parse & Render' }}
      </button>
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
import { ref, computed } from 'vue'
import ComparisonView from '../components/ComparisonView.vue'
import { useMultiFontParser } from '../composables/useMultiFontParser'

const { initParser, loadFont, parseHTML, isLoading, error } = useMultiFontParser()

const fontsLoading = ref(false)
const viewportWidth = ref(800)
const layouts = ref<any[]>()
const metrics = ref<any>()
const renderKey = ref(0)

const fonts = ref([
  { name: 'aliBaBaFont65', file: '/fonts/aliBaBaFont65.ttf', loaded: false },
  { name: 'MaoKenShiJinHei', file: '/fonts/MaoKenShiJinHei-2.ttf', loaded: false }
])

const allFontsLoaded = computed(() => fonts.value.every(f => f.loaded))

const htmlInput = ref(`<div class="container">
  <h1 class="title font1">琵琶行</h1>
  <p class="subtitle font2">作者：白居易</p>
  
  <div class="section">
    <p class="font1">浔阳江头夜送客，枫叶荻花秋瑟瑟。</p>
    <p class="font2">主人下马客在船，举酒欲饮无管弦。</p>
  </div>
  
  <div class="section">
    <p class="font1">忽闻水上琵琶声，主人忘归客不发。</p>
    <p class="font2">寻声暗问弹者谁？琵琶声停欲语迟。</p>
  </div>
  
  <div class="mixed">
    <span class="font1">转轴拨弦</span>
    <span class="font2">三两声</span>，
    <span class="font1">未成曲调</span>
    <span class="font2">先有情</span>。
  </div>
</div>`)

const cssInput = ref(`.container {
  padding: 20px;
}

.title {
  font-size: 36px;
  color: #1e293b;
  text-align: center;
  margin-bottom: 12px;
}

.subtitle {
  font-size: 18px;
  color: #64748b;
  text-align: center;
  margin-bottom: 24px;
}

.section {
  margin-bottom: 20px;
}

.section p {
  font-size: 20px;
  line-height: 1.8;
  margin-bottom: 8px;
}

.mixed {
  font-size: 24px;
  line-height: 2;
  margin-top: 20px;
}

.font1 {
  font-family: 'aliBaBaFont65';
  color: #ef4444;
}

.font2 {
  font-family: 'MaoKenShiJinHei';
  color: #3b82f6;
}`)

async function loadAllFonts() {
  fontsLoading.value = true
  error.value = null
  
  try {
    // Initialize parser first
    await initParser()
    
    // Load all fonts
    for (const font of fonts.value) {
      const response = await fetch(font.file)
      if (!response.ok) {
        throw new Error(`Failed to load ${font.name}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      const fontData = new Uint8Array(arrayBuffer)
      
      // Use the new loadFont method from useMultiFontParser
      await loadFont(fontData, font.name)
      font.loaded = true
      
      console.log(`Loaded ${font.name}`)
    }
    
    // Wait for browser to load fonts for Canvas rendering
    if (document.fonts) {
      // Trigger font loading by creating temporary elements
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.visibility = 'hidden'
      tempDiv.style.fontSize = '16px'
      
      for (const font of fonts.value) {
        const span = document.createElement('span')
        span.style.fontFamily = font.name
        span.textContent = '测试'
        tempDiv.appendChild(span)
      }
      
      document.body.appendChild(tempDiv)
      
      await document.fonts.ready
      console.log('Browser fonts ready')
      
      document.body.removeChild(tempDiv)
      
      // Check which fonts are loaded in browser
      for (const font of fonts.value) {
        const loaded = document.fonts.check(`16px ${font.name}`)
        console.log(`Browser font ${font.name}: ${loaded ? 'loaded' : 'not loaded'}`)
      }
    }
    
    console.log('All fonts loaded successfully')
  } catch (err: any) {
    error.value = err.message
  } finally {
    fontsLoading.value = false
  }
}

async function handleParse() {
  if (!allFontsLoaded.value) return

  error.value = null
  
  try {
    const startTime = performance.now()
    const result = await parseHTML(htmlInput.value, cssInput.value, viewportWidth.value, 'flat')
    const endTime = performance.now()

    layouts.value = result
    metrics.value = {
      charCount: Array.isArray(result) ? result.length : 0,
      parseTime: (endTime - startTime).toFixed(2),
      memory: 'N/A'
    }
    
    renderKey.value++
  } catch (err: any) {
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

.font-status {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.font-badge {
  padding: 6px 12px;
  background: var(--border-color);
  color: var(--text-muted);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.3s;
}

.font-badge.loaded {
  background: var(--success-color);
  color: white;
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

.action-bar {
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
