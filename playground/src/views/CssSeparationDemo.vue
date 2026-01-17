<template>
  <div class="demo-page">
    <div class="page-header">
      <h1>CSS Separation Demo</h1>
      <p>Separate HTML content from CSS styles for flexible theming</p>
    </div>

    <div class="controls">
      <div class="control-group">
        <label>Load Font:</label>
        <button @click="loadDefaultFont" class="btn-secondary" :disabled="fontLoading || isLoading">
          {{ fontLoading ? 'Loading...' : 'Load Default Font' }}
        </button>
        <span v-if="fontLoading" class="status-badge loading">⏳ Loading font...</span>
        <span v-else-if="fontLoaded" class="status-badge success">✓ {{ fontName }}</span>
        <span v-else class="status-badge">No font loaded</span>
      </div>

      <div class="control-group">
        <label>Select Theme:</label>
        <select v-model="selectedTheme" @change="handleThemeChange" :disabled="!fontLoaded || isLoading">
          <option value="default">Default</option>
          <option value="decoration">Text Decoration</option>
          <option value="sizes">Font Sizes</option>
          <option value="mixed">Mixed Styles</option>
        </select>
      </div>

      <div class="control-group">
        <label>Viewport Width:</label>
        <input type="number" v-model.number="viewportWidth" min="100" max="2000" />
        <span>px</span>
      </div>

      <button @click="handleParse" :disabled="!fontLoaded || isLoading || fontLoading" class="btn-primary">
        {{ isLoading ? 'Parsing...' : 'Apply Theme' }}
      </button>
    </div>

    <div class="info-box">
      <h3>💡 About CSS Separation</h3>
      <p>
        This demo showcases the text parsing capabilities of HTML Layout Parser. Switch between different themes to see how the library parses various text properties including: text color, font size, font weight, font style, and text decoration. The same HTML content is rendered with different CSS styles, demonstrating the parser's ability to extract detailed character-level layout information.
      </p>
    </div>

    <div class="editor-section">
      <div class="editor-panel">
        <h3>HTML Content (Unchanged)</h3>
        <textarea v-model="htmlInput" class="code-editor" rows="12" readonly></textarea>
      </div>

      <div class="editor-panel">
        <h3>CSS Theme: {{ themeName }}</h3>
        <textarea v-model="cssInput" class="code-editor" rows="12" readonly></textarea>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <SimplifiedComparisonView
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
import SimplifiedComparisonView from '../components/SimplifiedComparisonView.vue'
import { useParser } from '../composables/useParser'

const { initParser, loadFont, parseHTML, isLoading, error } = useParser()

const fontLoaded = ref(false)
const fontName = ref('')
const fontLoading = ref(false)
const viewportWidth = ref(800)
const layouts = ref<any[]>()
const metrics = ref<any>()
const renderKey = ref(0)
const selectedTheme = ref('default')

// HTML content stays the same
const htmlInput = ref(`<div class="container">
  <h1 class="title">春江花月夜</h1>
  <p class="author">作者：张若虚</p>
  
  <p class="verse">
    春江潮水连海平，海上明月共潮生。
  </p>
  
  <p class="verse">
    滟滟随波千万里，何处春江无月明！
  </p>
  
  <p class="verse highlight">
    江流宛转绕芳甸，月照花林皆似霰。
  </p>
  
  <p class="verse">
    空里流霜不觉飞，汀上白沙看不见。
  </p>
  
  <p class="verse emphasis">
    江天一色无纤尘，皎皎空中孤月轮。
  </p>
</div>`)

// Different CSS themes - focusing on text parsing capabilities
const themes = {
  default: {
    name: 'Default',
    css: `.container {
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
  margin-bottom: 24px;
}

.verse {
  font-size: 18px;
  color: #334155;
  line-height: 2;
  margin-bottom: 12px;
}

.highlight {
  color: #3b82f6;
  font-weight: bold;
}

.emphasis {
  color: #ef4444;
  font-style: italic;
}`
  },
  decoration: {
    name: 'Text Decoration',
    css: `.container {
  padding: 20px;
}

.title {
  font-size: 32px;
  color: #1e293b;
  margin-bottom: 8px;
  text-align: center;
  text-decoration: underline;
}

.author {
  font-size: 16px;
  color: #64748b;
  text-align: center;
  margin-bottom: 24px;
  font-style: italic;
}

.verse {
  font-size: 18px;
  color: #334155;
  line-height: 2;
  margin-bottom: 12px;
}

.highlight {
  color: #3b82f6;
  font-weight: bold;
  text-decoration: underline;
}

.emphasis {
  color: #ef4444;
  font-weight: bold;
  text-decoration: line-through;
}`
  },
  sizes: {
    name: 'Font Sizes',
    css: `.container {
  padding: 20px;
}

.title {
  font-size: 40px;
  color: #1e293b;
  margin-bottom: 8px;
  text-align: center;
  font-weight: bold;
}

.author {
  font-size: 14px;
  color: #64748b;
  text-align: center;
  margin-bottom: 24px;
}

.verse {
  font-size: 20px;
  color: #334155;
  line-height: 2.2;
  margin-bottom: 12px;
}

.highlight {
  color: #3b82f6;
  font-weight: bold;
  font-size: 26px;
}

.emphasis {
  color: #ef4444;
  font-style: italic;
  font-size: 24px;
}`
  },
  mixed: {
    name: 'Mixed Styles',
    css: `.container {
  padding: 20px;
}

.title {
  font-size: 36px;
  color: #7c3aed;
  margin-bottom: 8px;
  text-align: center;
  font-weight: bold;
  text-decoration: underline;
}

.author {
  font-size: 14px;
  color: #059669;
  text-align: center;
  margin-bottom: 24px;
  font-style: italic;
}

.verse {
  font-size: 20px;
  color: #0891b2;
  line-height: 2.2;
  margin-bottom: 12px;
}

.highlight {
  color: #dc2626;
  font-weight: bold;
  font-size: 24px;
  text-decoration: underline;
}

.emphasis {
  color: #ea580c;
  font-weight: bold;
  font-style: italic;
  text-decoration: line-through;
  font-size: 22px;
}`
  }
}

const cssInput = ref(themes.default.css)
const themeName = computed(() => themes[selectedTheme.value as keyof typeof themes].name)

async function loadDefaultFont() {
  error.value = null
  fontLoading.value = true
  
  try {
    await initParser()
    
    const response = await fetch('/fonts/aliBaBaFont65.ttf')
    if (!response.ok) {
      throw new Error('Failed to load default font')
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const fontData = new Uint8Array(arrayBuffer)
    
    await loadFont(fontData, 'aliBaBaFont65')
    fontLoaded.value = true
    fontName.value = 'aliBaBaFont65'
    
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

function handleThemeChange() {
  cssInput.value = themes[selectedTheme.value as keyof typeof themes].css
  if (fontLoaded.value) {
    handleParse()
  }
}

async function handleParse() {
  if (!fontLoaded.value) return

  error.value = null
  
  try {
    const startTime = performance.now()
    // Use 'flat' mode which returns CharLayout[]
    const result = await parseHTML(htmlInput.value, cssInput.value, viewportWidth.value, 'flat')
    const endTime = performance.now()

    console.log('=== Parse Result (flat mode) ===')
    console.log('Total characters:', result.length)
    console.log('First 5 characters (detailed):')
    result.slice(0, 5).forEach((char: any, index: number) => {
      console.log(`\nCharacter ${index}: "${char.character}"`)
      console.log('  Position:', { x: char.x, y: char.y, width: char.width, height: char.height })
      console.log('  Font:', { family: char.fontFamily, size: char.fontSize, weight: char.fontWeight, style: char.fontStyle })
      console.log('  Color:', char.color)
      console.log('  Text Decoration:', char.textDecoration)
      console.log('  Background:', char.backgroundColor)
    })

    layouts.value = result
    metrics.value = {
      charCount: result.length,
      parseTime: (endTime - startTime).toFixed(2),
      memory: 'N/A'
    }
    
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

.control-group select {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

.control-group select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  background: #10b981;
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
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
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
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.info-box {
  padding: 16px 20px;
  background: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 8px;
  margin-bottom: 24px;
}

.info-box h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1e40af;
}

.info-box p {
  font-size: 0.875rem;
  color: #1e3a8a;
  line-height: 1.6;
  margin: 0;
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
  background: #f8fafc;
}

.error-message {
  padding: 16px;
  background: #fef2f2;
  color: #dc2626;
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
