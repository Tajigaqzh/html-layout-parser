// Logger utility to capture and store console logs

interface LogEntry {
  timestamp: number
  level: 'log' | 'info' | 'warn' | 'error' | 'debug'
  args: any[]
  stack?: string
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private originalConsole: {
    log: typeof console.log
    info: typeof console.info
    warn: typeof console.warn
    error: typeof console.error
    debug: typeof console.debug
  }

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console)
    }

    // Override console methods
    this.interceptConsole()
  }

  private interceptConsole() {
    const self = this

    console.log = function (...args: any[]) {
      self.addLog('log', args)
      self.originalConsole.log(...args)
    }

    console.info = function (...args: any[]) {
      self.addLog('info', args)
      self.originalConsole.info(...args)
    }

    console.warn = function (...args: any[]) {
      self.addLog('warn', args)
      self.originalConsole.warn(...args)
    }

    console.error = function (...args: any[]) {
      self.addLog('error', args, new Error().stack)
      self.originalConsole.error(...args)
    }

    console.debug = function (...args: any[]) {
      self.addLog('debug', args)
      self.originalConsole.debug(...args)
    }
  }

  private addLog(level: LogEntry['level'], args: any[], stack?: string) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      args: this.serializeArgs(args),
      stack
    }

    this.logs.push(entry)

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }
  }

  private serializeArgs(args: any[]): any[] {
    return args.map(arg => {
      try {
        // Handle different types
        if (arg === null) return 'null'
        if (arg === undefined) return 'undefined'
        if (typeof arg === 'function') return `[Function: ${arg.name || 'anonymous'}]`
        if (arg instanceof Error) return {
          name: arg.name,
          message: arg.message,
          stack: arg.stack
        }
        if (typeof arg === 'object') {
          // Try to stringify, but handle circular references
          try {
            return JSON.parse(JSON.stringify(arg))
          } catch (e) {
            return '[Object with circular reference]'
          }
        }
        return arg
      } catch (e) {
        return '[Unserializable]'
      }
    })
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  clear() {
    this.logs = []
  }

  async saveLogs() {
    const logsData = this.formatLogs()
    
    try {
      const response = await fetch('/api/save-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logs: logsData,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to save logs: ${response.statusText}`)
      }

      const result = await response.json()
      this.originalConsole.log('✅ Logs saved to:', result.filepath)
      return result
    } catch (error) {
      this.originalConsole.error('❌ Failed to save logs:', error)
      throw error
    }
  }

  private formatLogs(): string {
    const lines: string[] = []
    
    lines.push('='.repeat(80))
    lines.push(`Browser Console Logs - ${new Date().toISOString()}`)
    lines.push('='.repeat(80))
    lines.push('')

    for (const entry of this.logs) {
      const date = new Date(entry.timestamp)
      const time = date.toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 })
      const level = entry.level.toUpperCase().padEnd(5)
      
      lines.push(`[${time}] ${level} ${this.formatArgs(entry.args)}`)
      
      if (entry.stack) {
        lines.push(`  Stack: ${entry.stack}`)
      }
      
      lines.push('')
    }

    return lines.join('\n')
  }

  private formatArgs(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'string') return arg
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2)
        } catch (e) {
          return String(arg)
        }
      }
      return String(arg)
    }).join(' ')
  }

  downloadLogs() {
    const logsData = this.formatLogs()
    const blob = new Blob([logsData], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `console-logs-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    this.originalConsole.log('✅ Logs downloaded')
  }
}

// Create singleton instance
export const logger = new Logger()

// Export for use in components
export default logger
