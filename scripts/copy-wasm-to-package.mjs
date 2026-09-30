import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(rootDir, 'wasm-output');
const destDir = path.join(rootDir, 'packages', 'html-layout-parser', 'dist');

const requiredFiles = [
  'html_layout_parser.wasm',
  'html_layout_parser.mjs',
  'html_layout_parser.cjs',
];
const optionalFiles = [
  'html_layout_parser.d.ts',
  'html_layout_parser_types.d.ts',
];

for (const file of requiredFiles) {
  const from = path.join(srcDir, file);
  if (!fs.existsSync(from)) {
    console.error(`Missing ${from}. Build WASM first: pnpm run build:wasm`);
    process.exit(1);
  }
}

fs.mkdirSync(destDir, { recursive: true });

for (const file of [...requiredFiles, ...optionalFiles]) {
  const from = path.join(srcDir, file);
  if (!fs.existsSync(from)) {
    continue;
  }
  fs.copyFileSync(from, path.join(destDir, file));
  console.log(`copied ${file}`);
}
