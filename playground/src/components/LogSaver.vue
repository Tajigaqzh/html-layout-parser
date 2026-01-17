<template>
  <div class="log-saver">
    <button @click="handleSaveLogs" class="log-btn save" :disabled="saving">
      {{ saving ? '保存中...' : '💾 保存日志到服务器' }}
    </button>
    <button @click="handleDownloadLogs" class="log-btn download">
      📥 下载日志
    </button>
    <button @click="handleClearLogs" class="log-btn clear">
      🗑️ 清空日志
    </button>
    <span class="log-count">{{ logCount }} 条日志</span>
    
    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import logger from '../utils/logger'

const saving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const logCount = ref(0)

let updateInterval: number

onMounted(() => {
  updateLogCount()
  updateInterval = window.setInterval(updateLogCount, 1000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})

function updateLogCount() {
  logCount.value = logger.getLogs().length
}

async function handleSaveLogs() {
  saving.value = true
  message.value = ''
  
  try {
    const result = await logger.saveLogs()
    message.value = `✅ 日志已保存到: ${result.filename}`
    messageType.value = 'success'
    
    setTimeout(() => {
      message.value = ''
    }, 5000)
  } catch (error) {
    message.value = `❌ 保存失败: ${error instanceof Error ? error.message : '未知错误'}`
    messageType.value = 'error'
  } finally {
    saving.value = false
  }
}

function handleDownloadLogs() {
  logger.downloadLogs()
  message.value = '✅ 日志已下载'
  messageType.value = 'success'
  
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

function handleClearLogs() {
  if (confirm('确定要清空所有日志吗？')) {
    logger.clear()
    updateLogCount()
    message.value = '✅ 日志已清空'
    messageType.value = 'success'
    
    setTimeout(() => {
      message.value = ''
    }, 3000)
  }
}
</script>

<style scoped>
.log-saver {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
}

.log-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.log-btn.save {
  background: #3b82f6;
  color: white;
}

.log-btn.save:hover:not(:disabled) {
  background: #2563eb;
}

.log-btn.save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.log-btn.download {
  background: #10b981;
  color: white;
}

.log-btn.download:hover {
  background: #059669;
}

.log-btn.clear {
  background: #ef4444;
  color: white;
}

.log-btn.clear:hover {
  background: #dc2626;
}

.log-count {
  font-size: 12px;
  color: #64748b;
  text-align: center;
  padding: 4px 0;
}

.message {
  font-size: 12px;
  padding: 8px;
  border-radius: 4px;
  margin-top: 4px;
  word-break: break-all;
}

.message.success {
  background: #d1fae5;
  color: #065f46;
}

.message.error {
  background: #fee2e2;
  color: #991b1b;
}
</style>
