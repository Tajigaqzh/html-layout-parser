import type { CreateHtmlLayoutParserModule, HtmlLayoutParserModule } from './types';

type ModuleNamespace = {
  default?: CreateHtmlLayoutParserModule;
  createHtmlLayoutParserModule?: CreateHtmlLayoutParserModule;
};

declare const __dirname: string | undefined;
declare const require: ((id: string) => unknown) | undefined;

function getCreateModule(moduleNamespace: ModuleNamespace | CreateHtmlLayoutParserModule): CreateHtmlLayoutParserModule {
  if (typeof moduleNamespace === 'function') {
    return moduleNamespace;
  }

  const createModule = moduleNamespace.default || moduleNamespace.createHtmlLayoutParserModule;
  if (typeof createModule !== 'function') {
    throw new Error('WASM module factory was not found');
  }

  return createModule;
}

function getPackageRelativeUrl(fileName: string): string {
  if (import.meta.url) {
    return new URL(fileName, import.meta.url).href;
  }

  return `./${fileName}`;
}

function getNodeFilePath(fileName: string): string {
  if (typeof __dirname !== 'undefined') {
    return `${__dirname}/${fileName}`;
  }

  const url = new URL(fileName, import.meta.url);
  return url.protocol === 'file:' ? url.pathname : url.href;
}

function resolveWasmFile(wasmPath: string | undefined, environment: string): string {
  if (wasmPath) {
    return wasmPath.replace(/\.(mjs|cjs|js)$/, '.wasm');
  }

  if (environment === 'node') {
    return getNodeFilePath('html_layout_parser.wasm');
  }

  return getPackageRelativeUrl('html_layout_parser.wasm');
}

async function importWasmFactory(wasmPath: string | undefined, environment: string): Promise<CreateHtmlLayoutParserModule> {
  const candidates = [
    wasmPath,
    environment === 'node' ? getPackageRelativeUrl('html_layout_parser.mjs') : undefined,
    getPackageRelativeUrl('html_layout_parser.mjs'),
  ].filter(Boolean) as string[];

  let lastError: unknown;
  for (const jsPath of candidates) {
    try {
      const moduleNamespace = await import(/* @vite-ignore */ jsPath);
      return getCreateModule(moduleNamespace);
    } catch (error) {
      lastError = error;
    }
  }

  if (environment === 'node' && typeof require === 'function') {
    try {
      return getCreateModule(require('./html_layout_parser.cjs') as ModuleNamespace | CreateHtmlLayoutParserModule);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function createWasmModule(
  wasmPath: string | undefined,
  environment: string
): Promise<HtmlLayoutParserModule> {
  const createModule = await importWasmFactory(wasmPath, environment);
  const wasmFile = resolveWasmFile(wasmPath, environment);

  return createModule({
    locateFile: (path: string) => {
      if (path.endsWith('.wasm')) {
        return wasmFile;
      }
      return path;
    },
  });
}
