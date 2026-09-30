import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const isWindows = process.platform === 'win32';

const child = isWindows
  ? spawn(
      'powershell.exe',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        path.join(rootDir, 'build.ps1'),
        ...args,
      ],
      { stdio: 'inherit', cwd: rootDir },
    )
  : spawn('bash', [path.join(rootDir, 'build.sh'), ...args], {
      stdio: 'inherit',
      cwd: rootDir,
    });

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 1);
});
