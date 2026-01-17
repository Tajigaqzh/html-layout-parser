<template>
  <div class="json-node">
    <!-- Object or Array -->
    <div v-if="isObject || isArray" class="json-complex">
      <div class="json-line" @click="toggle">
        <span class="json-toggle">{{ isExpanded ? '▼' : '▶' }}</span>
        <span v-if="showKey" class="json-key">{{ displayKey }}:</span>
        <span class="json-bracket">{{ isArray ? '[' : '{' }}</span>
        <span v-if="!isExpanded" class="json-preview">{{ preview }}</span>
        <span v-if="!isExpanded" class="json-bracket">{{ isArray ? ']' : '}' }}</span>
        <span v-if="!isExpanded" class="json-count">{{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }}</span>
      </div>
      
      <div v-if="isExpanded" class="json-children">
        <JsonNode
          v-for="(value, key) in data"
          :key="key"
          :data="value"
          :path="[...path, String(key)]"
          :expanded="expanded"
          :objectKey="String(key)"
          @toggle="$emit('toggle', $event)"
        />
        <div class="json-line">
          <span class="json-bracket">{{ isArray ? ']' : '}' }}</span>
        </div>
      </div>
    </div>
    
    <!-- Primitive values -->
    <div v-else class="json-primitive">
      <span v-if="showKey" class="json-key">{{ displayKey }}:</span>
      <span :class="valueClass">{{ displayValue }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  data: any
  path: string[]
  expanded: Set<string>
  objectKey?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  toggle: [path: string[]]
}>()

const pathKey = computed(() => props.path.join('.') || 'root')
const isExpanded = computed(() => props.expanded.has(pathKey.value))

const isObject = computed(() => 
  typeof props.data === 'object' && 
  props.data !== null && 
  !Array.isArray(props.data)
)

const isArray = computed(() => Array.isArray(props.data))

const showKey = computed(() => props.objectKey !== undefined)

const displayKey = computed(() => {
  if (!props.objectKey) return ''
  // Check if key needs quotes (contains special characters or is a number)
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(props.objectKey)) {
    return props.objectKey
  }
  return `"${props.objectKey}"`
})

const itemCount = computed(() => {
  if (isArray.value) return props.data.length
  if (isObject.value) return Object.keys(props.data).length
  return 0
})

const preview = computed(() => {
  if (isArray.value) {
    if (props.data.length === 0) return ''
    const first = props.data[0]
    if (typeof first === 'object') return '...'
    return String(first).substring(0, 20) + (String(first).length > 20 ? '...' : '')
  }
  if (isObject.value) {
    const keys = Object.keys(props.data)
    if (keys.length === 0) return ''
    return keys.slice(0, 2).join(', ') + (keys.length > 2 ? '...' : '')
  }
  return ''
})

const valueClass = computed(() => {
  const type = typeof props.data
  if (props.data === null) return 'json-null'
  if (type === 'string') return 'json-string'
  if (type === 'number') return 'json-number'
  if (type === 'boolean') return 'json-boolean'
  return 'json-value'
})

const displayValue = computed(() => {
  if (props.data === null) return 'null'
  if (props.data === undefined) return 'undefined'
  if (typeof props.data === 'string') return `"${props.data}"`
  return String(props.data)
})

const toggle = () => {
  emit('toggle', props.path)
}
</script>

<style scoped>
.json-node {
  line-height: 1.6;
}

.json-line {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 2px 0;
  cursor: pointer;
  user-select: none;
}

.json-line:hover {
  background: rgba(255, 255, 255, 0.05);
}

.json-toggle {
  display: inline-block;
  width: 12px;
  color: #808080;
  font-size: 10px;
  flex-shrink: 0;
}

.json-key {
  color: #9cdcfe;
  font-weight: 500;
}

.json-bracket {
  color: #d4d4d4;
}

.json-preview {
  color: #808080;
  font-style: italic;
  margin-left: 4px;
}

.json-count {
  color: #808080;
  font-size: 11px;
  margin-left: 8px;
}

.json-children {
  margin-left: 20px;
  border-left: 1px solid #3e3e3e;
  padding-left: 8px;
}

.json-primitive {
  display: flex;
  gap: 4px;
  padding: 2px 0;
  padding-left: 16px;
}

.json-string {
  color: #ce9178;
}

.json-number {
  color: #b5cea8;
}

.json-boolean {
  color: #569cd6;
}

.json-null {
  color: #569cd6;
}

.json-value {
  color: #d4d4d4;
}
</style>
