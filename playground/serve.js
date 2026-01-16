#!/usr/bin/env node
/**
 * Simple HTTP server for the HTML Layout Parser v2.0 Playground
 * 
 * Usage: node serve.js [port]
 * Default port: 3000
 */

import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.argv[2]) || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

async function serveFile(filePath, res) {
  try {
    const content = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });
    res.end(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
    }
  }
}

const server = createServer(async (req, res) => {
  let url = req.url.split('?')[0];
  
  // Default to index.html
  if (url === '/') {
    url = '/index.html';
  }
  
  // Resolve file path
  let filePath;
  
  if (url.startsWith('/build/') || url.startsWith('/dist/')) {
    // Serve from parent directory (wasm-v2)
    filePath = join(__dirname, '..', url);
  } else {
    // Serve from playground directory
    filePath = join(__dirname, url);
  }
  
  console.log(`${req.method} ${url} -> ${filePath}`);
  
  await serveFile(filePath, res);
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   📐 HTML Layout Parser v2.0 Playground                    ║
║                                                            ║
║   Server running at: http://localhost:${PORT}                ║
║                                                            ║
║   Press Ctrl+C to stop                                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);
});
