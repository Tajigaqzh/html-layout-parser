import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destDir = path.join(rootDir, 'playground', 'public', 'wasm');
const candidates = [
  [
    path.join(rootDir, 'playground', 'node_modules', 'html-layout-parser', 'dist', 'html_layout_parser.js'),
    path.join(rootDir, 'playground', 'node_modules', 'html-layout-parser', 'dist', 'html_layout_parser.wasm'),
  ],
  [
    path.join(rootDir, 'wasm-output', 'html_layout_parser.js'),
    path.join(rootDir, 'wasm-output', 'html_layout_parser.wasm'),
  ],
  [
    path.join(rootDir, 'wasm-output', 'html_layout_parser.mjs'),
    path.join(rootDir, 'wasm-output', 'html_layout_parser.wasm'),
  ],
];

const source = candidates.find(([jsFile, wasmFile]) => fs.existsSync(jsFile) && fs.existsSync(wasmFile));
if (!source) {
  console.error('WASM files not found. Install html-layout-parser or build WASM first:');
  console.error('  pnpm add html-layout-parser@latest');
  console.error('  or pnpm run build:wasm');
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(source[0], path.join(destDir, 'html_layout_parser.js'));
fs.copyFileSync(source[1], path.join(destDir, 'html_layout_parser.wasm'));
console.log('copied WASM files to playground/public/wasm');
