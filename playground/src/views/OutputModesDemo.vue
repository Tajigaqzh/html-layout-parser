<template>
  <div class="demo-page">
    <div class="page-header">
      <h1>Output Modes Demo</h1>
      <p>Compare different output modes: flat, byRow, simple, and full</p>
    </div>

    <div class="controls">
      <div class="input-section">
        <label>HTML Input:</label>
        <textarea 
          v-model="htmlInput" 
          placeholder="Enter HTML to parse..."
          rows="6"
        ></textarea>
      </div>
      
      <div class="input-section">
        <label>CSS (Optional):</label>
        <textarea 
          v-model="cssInput" 
          placeholder="Enter CSS styles..."
          rows="4"
        ></textarea>
      </div>

      <button @click="parseHTML" class="btn-parse" :disabled="loading || !htmlInput">
        {{ loading ? 'Parsing...' : 'Parse HTML' }}
      </button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="results" class="results">
      <div class="mode-tabs">
        <button 
          v-for="mode in modes" 
          :key="mode.value"
          @click="activeMode = mode.value"
          :class="['tab', { active: activeMode === mode.value }]"
        >
          {{ mode.label }}
        </button>
      </div>

      <div class="mode-description">
        <p>{{ currentModeDescription }}</p>
      </div>

      <JsonViewer 
        :title="`${currentModeLabel} Output`"
        :data="currentModeData"
      />
    </div>

    <div v-else class="placeholder">
      <div class="placeholder-icon">📄</div>
      <p>Enter HTML above and click "Parse HTML" to see the output in different modes</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import JsonViewer from '../components/JsonViewer.vue'
import { useParser } from '../composables/useParser'

const modes = [
  { value: 'flat', label: 'Flat Mode', description: 'Returns a flat array of CharLayout objects (v1 compatible)' },
  { value: 'byRow', label: 'By Row Mode', description: 'Groups characters by rows with Y coordinate (v1 isRow compatible)' },
  { value: 'simple', label: 'Simple Mode', description: 'Simplified structure with lines and characters' },
  { value: 'full', label: 'Full Mode', description: 'Complete document structure with pages, blocks, lines, and runs' }
]

const htmlInput = ref(`<div style="font-size: 24px; color: #333;">
  <h1>Hello World</h1>
  <p>This is a <strong>sample</strong> paragraph with <em>styled</em> text.</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</div>`)

const cssInput = ref('')
const activeMode = ref<'flat' | 'byRow' | 'simple' | 'full'>('flat')
const loading = ref(false)
const error = ref('')

const results = ref<{
  flat: any
  byRow: any
  simple: any
  full: any
} | null>(null)

const { initParser, loadFont, parseHTML: parseHTMLFn } = useParser()

const currentModeLabel = computed(() => {
  return modes.find(m => m.value === activeMode.value)?.label || ''
})

const currentModeDescription = computed(() => {
  return modes.find(m => m.value === activeMode.value)?.description || ''
})

const currentModeData = computed(() => {
  if (!results.value) return null
  return results.value[activeMode.value]
})

const parseHTML = async () => {
  if (!htmlInput.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    const html = htmlInput.value
    const css = cssInput.value || ''
    
    console.log('=== Parsing HTML in all modes ===')
    console.log('HTML:', html)
    console.log('CSS:', css)
    
    // Parse in all modes
    const flat = await parseHTMLFn(html, css, 800, 'flat')
    console.log('Flat mode result:', JSON.stringify(flat, null, 2))
    
    const byRow = await parseHTMLFn(html, css, 800, 'byRow')
    console.log('ByRow mode result:', JSON.stringify(byRow, null, 2))
    
    const simple = await parseHTMLFn(html, css, 800, 'simple')
    console.log('Simple mode result:', JSON.stringify(simple, null, 2))
    
    const full = await parseHTMLFn(html, css, 800, 'full')
    console.log('Full mode result:', JSON.stringify(full, null, 2))
    
    results.value = { flat, byRow, simple, full }
    
    console.log('=== Parsing completed successfully ===')
  } catch (err: any) {
    error.value = err.message || 'Failed to parse HTML'
    console.error('Parse error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    // Initialize WASM module first
    await initParser()
    
    // Load original full font (not compressed) to ensure all characters are available
    const fontPath = '/fonts/aliBaBaFont65-original.ttf'
    const response = await fetch(fontPath)
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.statusText}`)
    }
    const fontBuffer = await response.arrayBuffer()
    const fontData = new Uint8Array(fontBuffer)
    
    await loadFont(fontData, 'DefaultFont')
    
    // Auto-parse on mount
    await parseHTML()
  } catch (err: any) {
    console.error('Failed to initialize:', err)
    error.value = err.message || 'Failed to load font'
  }
})
</script>

<style scoped>
.demo-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
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
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.input-section {
  margin-bottom: 16px;
}

.input-section label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-color);
}

.input-section textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  background: var(--bg-color);
  color: var(--text-color);
  resize: vertical;
}

.btn-parse {
  width: 100%;
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-parse:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-1px);
}

.btn-parse:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  padding: 16px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
  margin-bottom: 24px;
}

.results {
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
}

.mode-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 8px;
}

.tab {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 6px 6px 0 0;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-color);
}

.tab.active {
  background: #4CAF50;
  color: white;
}

.mode-description {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(76, 175, 80, 0.1);
  border-left: 3px solid #4CAF50;
  border-radius: 4px;
}

.mode-description p {
  margin: 0;
  color: var(--text-color);
  font-size: 14px;
}

.placeholder {
  text-align: center;
  padding: 80px 20px;
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.placeholder p {
  color: var(--text-muted);
  font-size: 1.125rem;
}
</style>
