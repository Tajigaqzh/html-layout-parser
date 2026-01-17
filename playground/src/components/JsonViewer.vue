<template>
  <div class="json-viewer">
    <div class="json-header">
      <div class="json-title">{{ title }}</div>
      <div class="json-actions">
        <button @click="expandAll" class="btn-action">Expand All</button>
        <button @click="collapseAll" class="btn-action">Collapse All</button>
        <button @click="copyToClipboard" class="btn-action">Copy JSON</button>
      </div>
    </div>
    <div class="json-content" ref="jsonContainer">
      <JsonNode :data="data" :path="[]" :expanded="expandedPaths" @toggle="togglePath" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import JsonNode from './JsonNode.vue'

interface Props {
  title: string
  data: any
}

const props = defineProps<Props>()

const expandedPaths = ref<Set<string>>(new Set())
const jsonContainer = ref<HTMLElement>()

// Initialize with first level expanded
const initExpanded = () => {
  expandedPaths.value = new Set(['root'])
}

initExpanded()

const togglePath = (path: string[]) => {
  const pathKey = path.join('.')
  if (expandedPaths.value.has(pathKey)) {
    expandedPaths.value.delete(pathKey)
  } else {
    expandedPaths.value.add(pathKey)
  }
}

const expandAll = () => {
  const allPaths = new Set<string>()
  const traverse = (obj: any, path: string[] = []) => {
    const pathKey = path.join('.')
    allPaths.add(pathKey || 'root')
    
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          traverse(item, [...path, String(index)])
        }
      })
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          traverse(obj[key], [...path, key])
        }
      })
    }
  }
  
  traverse(props.data, [])
  expandedPaths.value = allPaths
}

const collapseAll = () => {
  expandedPaths.value = new Set(['root'])
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(props.data, null, 2))
    alert('JSON copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<style scoped>
.json-viewer {
  background: #1e1e1e;
  border: 1px solid #3e3e3e;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}

.json-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #2d2d2d;
  border-bottom: 1px solid #3e3e3e;
}

.json-title {
  font-weight: 600;
  color: #d4d4d4;
  font-size: 14px;
}

.json-actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  padding: 4px 12px;
  background: #3e3e3e;
  border: 1px solid #4e4e4e;
  border-radius: 4px;
  color: #d4d4d4;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action:hover {
  background: #4e4e4e;
  border-color: #5e5e5e;
}

.json-content {
  padding: 16px;
  max-height: 600px;
  overflow: auto;
  color: #d4d4d4;
}

.json-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.json-content::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.json-content::-webkit-scrollbar-thumb {
  background: #4e4e4e;
  border-radius: 4px;
}

.json-content::-webkit-scrollbar-thumb:hover {
  background: #5e5e5e;
}
</style>
