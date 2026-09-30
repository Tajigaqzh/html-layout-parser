import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

if (args.includes('--modules')) {
  const moduleDirs = [path.join(rootDir, 'node_modules')];
  const packagesDir = path.join(rootDir, 'packages');
  if (fs.existsSync(packagesDir)) {
    for (const name of fs.readdirSync(packagesDir)) {
      moduleDirs.push(path.join(packagesDir, name, 'node_modules'));
    }
  }
  for (const target of moduleDirs) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`removed ${path.relative(rootDir, target)}`);
  }
  process.exit(0);
}

if (args.length === 0) {
  console.error('Usage: node scripts/clean-artifacts.mjs <path> [path...]');
  process.exit(1);
}

for (const item of args) {
  const target = path.resolve(rootDir, item);
  fs.rmSync(target, { recursive: true, force: true });
  console.log(`removed ${path.relative(rootDir, target) || target}`);
}
