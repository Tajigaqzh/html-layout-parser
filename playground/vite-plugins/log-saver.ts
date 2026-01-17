import { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

export function logSaverPlugin(): Plugin {
  return {
    name: 'log-saver',
    
    configureServer(server) {
      // Add API endpoint to save logs
      server.middlewares.use('/api/save-logs', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        let body = ''
        req.on('data', chunk => {
          body += chunk.toString()
        })

        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            const { logs, timestamp } = data

            // Create logs directory if it doesn't exist
            const logsDir = path.join(process.cwd(), 'logs')
            if (!fs.existsSync(logsDir)) {
              fs.mkdirSync(logsDir, { recursive: true })
            }

            // Generate filename with timestamp
            const filename = `console-${new Date().toISOString().replace(/[:.]/g, '-')}.log`
            const filepath = path.join(logsDir, filename)

            // Write logs to file
            fs.writeFileSync(filepath, logs, 'utf-8')

            console.log(`✅ Logs saved to: ${filepath}`)

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: true,
              filepath: filepath,
              filename: filename
            }))
          } catch (error) {
            console.error('❌ Error saving logs:', error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }))
          }
        })
      })
    }
  }
}
