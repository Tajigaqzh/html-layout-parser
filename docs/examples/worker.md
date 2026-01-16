# Web Worker Examples

Complete examples for using HTML Layout Parser in Web Worker environments.

## Basic Worker Setup

### Main Thread

```typescript
// main.ts
interface WorkerMessage {
  type: 'init' | 'loadFont' | 'parse' | 'destroy';
  id: number;
  payload?: any;
}

class ParserWorkerClient {
  private worker: Worker;
  private messageId = 0;
  private pendingRequests: Map<number, { resolve: Function; reject: Function }> = new Map();

  constructor(workerUrl: string) {
    this.worker = new Worker(workerUrl, { type: 'module' });
    this.worker.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent) {
    const { id, payload, error } = event.data;
    const pending = this.pendingRequests.get(id);

    if (pending) {
      this.pendingRequests.delete(id);
      if (error) {
        pending.reject(new Error(error));
      } else {
        pending.resolve(payload);
      }
    }
  }

  private sendMessage<T>(type: string, payload?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({ type, id, payload });
    });
  }

  async init(): Promise<void> {
    await this.sendMessage('init');
  }

  async loadFont(fontData: Uint8Array, fontName: string): Promise<number> {
    return this.sendMessage('loadFont', { fontData, fontName });
  }

  async parse(html: string, options: { viewportWidth: number; css?: string }): Promise<any> {
    return this.sendMessage('parse', { html, options });
  }

  async destroy(): Promise<void> {
    await this.sendMessage('destroy');
    this.worker.terminate();
  }
}

// Usage
async function main() {
  const client = new ParserWorkerClient('./parser-worker.js');

  try {
    await client.init();

    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    await client.loadFont(fontData, 'Arial');

    const layouts = await client.parse(
      '<div style="font-size: 24px;">Hello from Worker!</div>',
      { viewportWidth: 800 }
    );
    
    console.log(`Parsed ${layouts.length} characters`);
  } finally {
    await client.destroy();
  }
}
```

### Worker Thread

```typescript
// parser-worker.ts
import { HtmlLayoutParser } from 'html-layout-parser/worker';

let parser: HtmlLayoutParser | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { type, id, payload } = event.data;

  try {
    let result: any;

    switch (type) {
      case 'init':
        parser = new HtmlLayoutParser();
        await parser.init();
        result = true;
        break;

      case 'loadFont':
        if (!parser) throw new Error('Parser not initialized');
        const fontId = parser.loadFont(payload.fontData, payload.fontName);
        if (fontId > 0) parser.setDefaultFont(fontId);
        result = fontId;
        break;

      case 'parse':
        if (!parser) throw new Error('Parser not initialized');
        result = parser.parse(payload.html, payload.options);
        break;

      case 'destroy':
        if (parser) {
          parser.destroy();
          parser = null;
        }
        result = true;
        break;
    }

    self.postMessage({ id, payload: result });
  } catch (error) {
    self.postMessage({ 
      id, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};
```

## OffscreenCanvas Rendering

Render directly in the worker using OffscreenCanvas.

### Main Thread

```typescript
// main-offscreen.ts
class OffscreenRendererClient {
  private worker: Worker;
  private messageId = 0;
  private pendingRequests: Map<number, { resolve: Function; reject: Function }> = new Map();

  constructor(canvas: HTMLCanvasElement, workerUrl: string) {
    this.worker = new Worker(workerUrl, { type: 'module' });
    this.worker.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent) {
    const { id, payload, error } = event.data;
    const pending = this.pendingRequests.get(id);
    if (pending) {
      this.pendingRequests.delete(id);
      error ? pending.reject(new Error(error)) : pending.resolve(payload);
    }
  }

  private sendMessage<T>(type: string, payload?: any, transfer?: Transferable[]): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({ type, id, payload }, transfer || []);
    });
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    const offscreen = canvas.transferControlToOffscreen();
    await this.sendMessage('init', {
      canvas: offscreen,
      width: canvas.width,
      height: canvas.height
    }, [offscreen]);
  }

  async loadFont(fontData: Uint8Array, fontName: string): Promise<number> {
    const buffer = fontData.buffer.slice(0);
    return this.sendMessage('loadFont', { 
      fontData: new Uint8Array(buffer), 
      fontName 
    }, [buffer]);
  }

  async render(html: string, css?: string): Promise<void> {
    await this.sendMessage('render', { html, css });
  }

  async destroy(): Promise<void> {
    await this.sendMessage('destroy');
    this.worker.terminate();
  }
}

// Usage
async function main() {
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
  canvas.width = 800;
  canvas.height = 600;

  const renderer = new OffscreenRendererClient(canvas, './offscreen-worker.js');

  try {
    await renderer.init(canvas);

    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    await renderer.loadFont(fontData, 'Arial');

    await renderer.render(`
      <div style="padding: 20px;">
        <h1 style="font-size: 32px; color: #333333FF;">Rendered in Worker</h1>
        <p style="font-size: 18px; color: #666666FF;">
          Using OffscreenCanvas for optimal performance.
        </p>
      </div>
    `);
  } catch (error) {
    console.error('Error:', error);
  }

  window.addEventListener('beforeunload', () => renderer.destroy());
}
```

### Worker Thread

```typescript
// offscreen-worker.ts
import { HtmlLayoutParser, CharLayout } from 'html-layout-parser/worker';

let parser: HtmlLayoutParser | null = null;
let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

function parseColor(color: string): string {
  if (!color || color === '#00000000') return 'transparent';
  if (color.startsWith('#') && color.length === 9) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const a = parseInt(color.slice(7, 9), 16) / 255;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
  }
  return color;
}

function renderCharacter(ctx: OffscreenCanvasRenderingContext2D, char: CharLayout) {
  if (char.backgroundColor && char.backgroundColor !== '#00000000') {
    ctx.fillStyle = parseColor(char.backgroundColor);
    ctx.fillRect(char.x, char.y, char.width, char.height);
  }

  ctx.font = `${char.fontStyle} ${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
  ctx.globalAlpha = char.opacity ?? 1;
  ctx.fillStyle = parseColor(char.color);
  ctx.fillText(char.character, char.x, char.baseline);
  ctx.globalAlpha = 1;
}

self.onmessage = async (event: MessageEvent) => {
  const { type, id, payload } = event.data;

  try {
    let result: any = true;

    switch (type) {
      case 'init':
        canvas = payload.canvas;
        canvas.width = payload.width;
        canvas.height = payload.height;
        ctx = canvas.getContext('2d');
        parser = new HtmlLayoutParser();
        await parser.init();
        break;

      case 'loadFont':
        if (!parser) throw new Error('Parser not initialized');
        const fontId = parser.loadFont(payload.fontData, payload.fontName);
        if (fontId > 0) parser.setDefaultFont(fontId);
        result = fontId;
        break;

      case 'render':
        if (!parser || !canvas || !ctx) throw new Error('Not initialized');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const layouts = parser.parse(payload.html, {
          viewportWidth: canvas.width,
          css: payload.css
        });
        for (const char of layouts) {
          renderCharacter(ctx, char);
        }
        result = layouts.length;
        break;

      case 'destroy':
        if (parser) {
          parser.destroy();
          parser = null;
        }
        canvas = null;
        ctx = null;
        break;
    }

    self.postMessage({ id, payload: result });
  } catch (error) {
    self.postMessage({ 
      id, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};
```

## Worker Pool Pattern

Use multiple workers for parallel processing.

```typescript
import { CharLayout } from 'html-layout-parser';

interface PoolTask {
  id: string;
  html: string;
  css?: string;
  resolve: (result: CharLayout[]) => void;
  reject: (error: Error) => void;
}

class ParserWorkerPool {
  private workers: Worker[] = [];
  private busyWorkers: Set<Worker> = new Set();
  private taskQueue: PoolTask[] = [];
  private workerTaskMap: Map<Worker, PoolTask> = new Map();

  constructor(
    private workerUrl: string,
    private poolSize: number = navigator.hardwareConcurrency || 4
  ) {}

  async init(fontData: Uint8Array, fontName: string): Promise<void> {
    const initPromises = [];

    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerUrl, { type: 'module' });
      worker.onmessage = (event) => this.handleWorkerMessage(worker, event);
      this.workers.push(worker);

      const initPromise = new Promise<void>((resolve, reject) => {
        const handler = (event: MessageEvent) => {
          if (event.data.type === 'ready') {
            worker.removeEventListener('message', handler);
            resolve();
          }
        };
        worker.addEventListener('message', handler);
        worker.postMessage({ type: 'init', fontData, fontName });
      });

      initPromises.push(initPromise);
    }

    await Promise.all(initPromises);
  }

  private handleWorkerMessage(worker: Worker, event: MessageEvent) {
    const task = this.workerTaskMap.get(worker);
    if (!task) return;

    const { payload, error } = event.data;
    error ? task.reject(new Error(error)) : task.resolve(payload);

    this.workerTaskMap.delete(worker);
    this.busyWorkers.delete(worker);
    this.processNextTask();
  }

  private processNextTask() {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.workers.find(w => !this.busyWorkers.has(w));
    if (!availableWorker) return;

    const task = this.taskQueue.shift()!;
    this.busyWorkers.add(availableWorker);
    this.workerTaskMap.set(availableWorker, task);

    availableWorker.postMessage({
      type: 'parse',
      html: task.html,
      css: task.css
    });
  }

  parse(html: string, css?: string): Promise<CharLayout[]> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({
        id: `task_${Date.now()}`,
        html,
        css,
        resolve,
        reject
      });
      this.processNextTask();
    });
  }

  async parseAll(documents: Array<{ html: string; css?: string }>): Promise<CharLayout[][]> {
    return Promise.all(documents.map(doc => this.parse(doc.html, doc.css)));
  }

  getStats() {
    return {
      totalWorkers: this.workers.length,
      busyWorkers: this.busyWorkers.size,
      queuedTasks: this.taskQueue.length
    };
  }

  destroy() {
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
    this.busyWorkers.clear();
    this.taskQueue = [];
  }
}

// Usage
async function main() {
  const pool = new ParserWorkerPool('./pool-worker.js', 4);

  try {
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    await pool.init(fontData, 'Arial');

    const documents = Array.from({ length: 100 }, (_, i) => ({
      html: `<div>Document ${i + 1}</div>`
    }));

    console.log('Processing 100 documents...');
    const startTime = performance.now();

    const results = await pool.parseAll(documents);

    const endTime = performance.now();
    console.log(`Processed ${results.length} documents in ${(endTime - startTime).toFixed(2)}ms`);

  } finally {
    pool.destroy();
  }
}
```

## Background Processing

Process large documents without blocking the main thread.

```typescript
// Main thread
class BackgroundProcessor {
  private worker: Worker;
  private onProgress?: (progress: number) => void;
  private onComplete?: (result: any) => void;

  constructor(workerUrl: string) {
    this.worker = new Worker(workerUrl, { type: 'module' });
    this.worker.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent) {
    const { type, progress, payload } = event.data;

    if (type === 'progress') {
      this.onProgress?.(progress);
    } else if (type === 'complete') {
      this.onComplete?.(payload);
    }
  }

  setProgressHandler(handler: (progress: number) => void) {
    this.onProgress = handler;
  }

  setCompleteHandler(handler: (result: any) => void) {
    this.onComplete = handler;
  }

  async init(): Promise<void> {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === 'ready') {
          this.worker.removeEventListener('message', handler);
          resolve();
        }
      };
      this.worker.addEventListener('message', handler);
      this.worker.postMessage({ type: 'init' });
    });
  }

  process(html: string, css?: string): void {
    this.worker.postMessage({ type: 'process', html, css });
  }

  destroy() {
    this.worker.terminate();
  }
}

// Usage
async function backgroundExample() {
  const processor = new BackgroundProcessor('./background-worker.js');

  processor.setProgressHandler((progress) => {
    console.log(`Progress: ${progress}%`);
  });

  processor.setCompleteHandler((result) => {
    console.log(`Complete: ${result.length} characters`);
  });

  await processor.init();
  processor.process('<div>Large document content...</div>');
}
```
