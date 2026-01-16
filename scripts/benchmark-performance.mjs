#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { Script } from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const wasmJsPath = join(rootDir, 'wasm-output', 'html_layout_parser.js');
const fontPath = join(rootDir, 'examples', 'font', 'aliBaBaFont65.ttf');

function parseArgs(argv) {
  const args = {
    warmup: 5,
    iterations: 30,
    mode: 'flat',
    viewport: 800,
  };

  for (const arg of argv) {
    if (arg.startsWith('--warmup=')) {
      args.warmup = Number(arg.split('=')[1]);
    } else if (arg.startsWith('--iterations=')) {
      args.iterations = Number(arg.split('=')[1]);
    } else if (arg.startsWith('--mode=')) {
      args.mode = arg.split('=')[1];
    } else if (arg.startsWith('--viewport=')) {
      args.viewport = Number(arg.split('=')[1]);
    }
  }

  if (!Number.isFinite(args.warmup) || args.warmup < 0) {
    throw new Error('Invalid --warmup value');
  }
  if (!Number.isFinite(args.iterations) || args.iterations <= 0) {
    throw new Error('Invalid --iterations value');
  }
  if (!Number.isFinite(args.viewport) || args.viewport <= 0) {
    throw new Error('Invalid --viewport value');
  }

  return args;
}

function formatMs(value) {
  return `${value.toFixed(2)}ms`;
}

function formatInt(value) {
  return Number(value).toFixed(0);
}

if (!existsSync(wasmJsPath)) {
  console.error(
    `WASM module not found at ${wasmJsPath}. ` +
      'Please run the build script first: ./build.sh'
  );
  process.exit(1);
}

if (!existsSync(fontPath)) {
  console.error(`Font not found at ${fontPath}.`);
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));

// Run the UMD bundle in a CommonJS-like wrapper so module.exports is populated.
function loadWasmFactory(filePath) {
  const source = readFileSync(filePath, 'utf8');
  const module = { exports: {} };
  const exports = module.exports;
  const require = createRequire(filePath);
  const filename = filePath;
  const dirnamePath = dirname(filePath);
  const wrapped = `(function (exports, require, module, __filename, __dirname) { ${source}\n});`;
  const script = new Script(wrapped, { filename: filePath });
  const func = script.runInThisContext();
  func(exports, require, module, filename, dirnamePath);
  return module.exports;
}

const createModule = loadWasmFactory(wasmJsPath);

if (typeof createModule !== 'function') {
  console.error('Failed to load WASM module factory function.');
  process.exit(1);
}

const module = await createModule();

function mallocString(value) {
  const bytes = module.lengthBytesUTF8(value) + 1;
  const ptr = module._malloc(bytes);
  if (ptr === 0) {
    throw new Error('Failed to allocate memory for string');
  }
  module.stringToUTF8(value, ptr, bytes);
  return ptr;
}

function loadFont(fontData, fontName) {
  const dataPtr = module._malloc(fontData.length);
  if (dataPtr === 0) {
    return 0;
  }

  const namePtr = mallocString(fontName);

  try {
    module.HEAPU8.set(fontData, dataPtr);
    return module._loadFont(dataPtr, fontData.length, namePtr);
  } finally {
    module._free(dataPtr);
    module._free(namePtr);
  }
}

function parseHTML(html, viewportWidth, mode, css) {
  let htmlPtr = 0;
  let modePtr = 0;
  let cssPtr = 0;

  try {
    htmlPtr = mallocString(html);
    modePtr = mallocString(mode);
    if (css) {
      cssPtr = mallocString(css);
    }

    const resultPtr = module._parseHTML(htmlPtr, cssPtr, viewportWidth, modePtr, 0);
    if (resultPtr !== 0) {
      module._freeString(resultPtr);
    }
  } finally {
    if (htmlPtr) {
      module._free(htmlPtr);
    }
    if (modePtr) {
      module._free(modePtr);
    }
    if (cssPtr) {
      module._free(cssPtr);
    }
  }
}

function getMetrics() {
  const resultPtr = module._getMetrics();
  if (resultPtr === 0) {
    return null;
  }

  const result = module.UTF8ToString(resultPtr);
  module._freeString(resultPtr);

  try {
    return JSON.parse(result);
  } catch {
    return null;
  }
}

function runBenchmarkCase(label, html) {
  for (let i = 0; i < args.warmup; i += 1) {
    parseHTML(html, args.viewport, args.mode);
  }

  const totals = {
    parseTime: 0,
    layoutTime: 0,
    serializeTime: 0,
    totalTime: 0,
  };
  let characterCount = 0;

  for (let i = 0; i < args.iterations; i += 1) {
    parseHTML(html, args.viewport, args.mode);
    const metrics = getMetrics();
    if (!metrics) {
      throw new Error('Failed to read metrics from WASM module');
    }

    characterCount = metrics.characterCount;
    totals.parseTime += metrics.parseTime;
    totals.layoutTime += metrics.layoutTime;
    totals.serializeTime += metrics.serializeTime;
    totals.totalTime += metrics.totalTime;
  }

  const avg = {
    parseTime: totals.parseTime / args.iterations,
    layoutTime: totals.layoutTime / args.iterations,
    serializeTime: totals.serializeTime / args.iterations,
    totalTime: totals.totalTime / args.iterations,
  };

  const avgCharsPerSecond = characterCount > 0
    ? (characterCount * 1000) / avg.totalTime
    : 0;

  return {
    label,
    characterCount,
    avg,
    avgCharsPerSecond,
  };
}

const fontData = new Uint8Array(readFileSync(fontPath));
const fontId = loadFont(fontData, 'BenchmarkFont');

if (!fontId) {
  console.error('Failed to load benchmark font.');
  process.exit(1);
}

module._setDefaultFont(fontId);

const cases = [
  { label: 'Simple', html: '<div>Hello World</div>' },
  {
    label: 'Medium',
    html: '<div>' + Array(10).fill('<p>This is a test paragraph with some text content.</p>').join('') + '</div>',
  },
  {
    label: 'Large',
    html: '<div>' + Array(100).fill('<p>This is a test paragraph with some text content for performance testing.</p>').join('') + '</div>',
  },
  {
    label: 'Very Large',
    html: '<div>' + Array(300).fill('<p>This is a longer test paragraph with more content for stress testing the parser performance.</p>').join('') + '</div>',
  },
];

console.log('HTML Layout Parser Benchmark');
console.log(`Warmup: ${args.warmup} runs`);
console.log(`Iterations: ${args.iterations} runs`);
console.log(`Mode: ${args.mode}`);
console.log(`Viewport: ${args.viewport}px`);
console.log('');

const results = [];

try {
  for (const testCase of cases) {
    results.push(runBenchmarkCase(testCase.label, testCase.html));
  }

  for (const result of results) {
    console.log(
      `${result.label} (${result.characterCount} chars): ` +
        `${formatInt(result.avgCharsPerSecond)} chars/sec, ` +
        `total ${formatMs(result.avg.totalTime)} ` +
        `(parse ${formatMs(result.avg.parseTime)}, ` +
        `layout ${formatMs(result.avg.layoutTime)}, ` +
        `serialize ${formatMs(result.avg.serializeTime)})`
    );
  }
} finally {
  module._clearAllFonts();
  module._destroy();
}
