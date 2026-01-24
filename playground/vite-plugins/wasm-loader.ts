import { Plugin } from 'vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'

export function wasmLoaderPlugin(): Plugin {
  return {
    name: 'wasm-loader',
    configureServer(server) {
      // Log all requests to see what's being requested
      server.middlewares.use((req, res, next) => {
        if (req.url?.includes('wasm') || req.url?.includes('html_layout_parser')) {
          console.log('All requests - URL:', req.url, 'Method:', req.method);
        }
        next();
      });
      
      // Handle WASM files at root level (for relative imports)
      server.middlewares.use((req, res, next) => {
        const cleanUrl = req.url?.split('?')[0] || '';
        if (cleanUrl.endsWith('.wasm') && cleanUrl.includes('html_layout_parser')) {
          console.log('WASM file request at root level:', cleanUrl);
          
          // Determine which WASM file is being requested
          let wasmFileName = '';
          if (cleanUrl.includes('html_layout_parser_esm.wasm')) {
            wasmFileName = 'html_layout_parser_esm.wasm';
          } else if (cleanUrl.includes('html_layout_parser_cjs.wasm')) {
            wasmFileName = 'html_layout_parser_cjs.wasm';
          } else if (cleanUrl.includes('html_layout_parser.wasm')) {
            wasmFileName = 'html_layout_parser.wasm';
          }
          
          if (wasmFileName) {
            try {
              const wasmPath = resolve(process.cwd(), `node_modules/html-layout-parser/dist/${wasmFileName}`);
              console.log('Serving WASM file from:', wasmPath);
              const content = readFileSync(wasmPath);
              res.setHeader('Content-Type', 'application/wasm');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(content);
              return;
            } catch (err) {
              console.error('Failed to serve WASM file:', err);
            }
          }
        }
        next();
      });
      
      // Serve WASM files from npm package
      server.middlewares.use('/wasm', (req, res, next) => {
        console.log('WASM middleware hit:', req.url)
        
        // Remove query parameters from URL
        const cleanUrl = req.url?.split('?')[0] || ''
        console.log('Clean URL:', cleanUrl)
        
        if (cleanUrl === '/html_layout_parser.js' || cleanUrl === '/html_layout_parser.mjs') {
          try {
            const wasmJsPath = resolve(process.cwd(), 'node_modules/html-layout-parser/dist/html_layout_parser.mjs')
            console.log('Serving WASM ESM from:', wasmJsPath)
            const content = readFileSync(wasmJsPath, 'utf-8')
            res.setHeader('Content-Type', 'application/javascript')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(content)
            return
          } catch (err) {
            console.error('Failed to serve WASM ESM:', err)
            res.statusCode = 500
            res.end('Failed to load WASM ESM file')
            return
          }
        } else if (cleanUrl === '/html_layout_parser.cjs') {
          try {
            const wasmJsPath = resolve(process.cwd(), 'node_modules/html-layout-parser/dist/html_layout_parser.cjs')
            console.log('Serving WASM CJS from:', wasmJsPath)
            const content = readFileSync(wasmJsPath, 'utf-8')
            res.setHeader('Content-Type', 'application/javascript')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(content)
            return
          } catch (err) {
            console.error('Failed to serve WASM CJS:', err)
            res.statusCode = 500
            res.end('Failed to load WASM CJS file')
            return
          }
        } else if (cleanUrl.endsWith('.wasm')) {
          const wasmFileName = cleanUrl.substring(1) // remove leading slash
          try {
            // Always serve the unified WASM file
            const wasmFilePath = resolve(process.cwd(), 'node_modules/html-layout-parser/dist/html_layout_parser.wasm')
            console.log('Serving unified WASM binary from:', wasmFilePath)
            const content = readFileSync(wasmFilePath)
            res.setHeader('Content-Type', 'application/wasm')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(content)
            return
          } catch (err) {
            console.error(`Failed to serve WASM file ${wasmFileName}:`, err)
            res.statusCode = 500
            res.end(`Failed to load WASM file: ${wasmFileName}`)
            return
          }
        }
        console.log('WASM middleware - no match for:', cleanUrl)
        next()
      })
    }
  }
}