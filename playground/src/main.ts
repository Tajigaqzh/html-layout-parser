import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import logger from './utils/logger'

// Initialize logger
console.log('Logger initialized')

const app = createApp(App)

app.use(router)
app.mount('#app')

// Add global save logs function
;(window as any).saveLogs = () => logger.saveLogs()
;(window as any).downloadLogs = () => logger.downloadLogs()
;(window as any).clearLogs = () => logger.clear()

console.log('💡 Tip: Use saveLogs() to save logs to server, downloadLogs() to download, clearLogs() to clear')

