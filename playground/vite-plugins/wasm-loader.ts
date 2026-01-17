import { Plugin } from 'vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'

export function wasmLoaderPlugin(): Plugin {
  return {
    name: 'wasm-loader',
    configureServer(server) {
      // Serve WASM files from npm package
      server.middlewares.use('/wasm', (req, res, next) => {
        console.log('WASM middleware hit:', req.url)
        
        if (req.url === '/html_layout_parser.js') {
          try {
            const wasmJsPath = resolve(process.cwd(), 'node_modules/html-layout-parser/dist/html_layout_parser.js')
            console.log('Serving WASM JS from:', wasmJsPath)
            const content = readFileSync(wasmJsPath, 'utf-8')
            res.setHeader('Content-Type', 'application/javascript')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(content)
            return
          } catch (err) {
            console.error('Failed to serve WASM JS:', err)
            res.statusCode = 500
            res.end('Failed to load WASM JS file')
            return
          }
        } else if (req.url === '/html_layout_parser.wasm') {
          try {
            const wasmPath = resolve(process.cwd(), 'node_modules/html-layout-parser/dist/html_layout_parser.wasm')
            console.log('Serving WASM binary from:', wasmPath)
            const content = readFileSync(wasmPath)
            res.setHeader('Content-Type', 'application/wasm')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(content)
            return
          } catch (err) {
            console.error('Failed to serve WASM binary:', err)
            res.statusCode = 500
            res.end('Failed to load WASM binary file')
            return
          }
        }
        next()
      })
    }
  }
}