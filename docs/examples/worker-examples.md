# Worker Environment Examples

Complete examples for using HTML Layout Parser v2.0 in Web Worker environments.

## Table of Contents

1. [Basic Worker Setup](#basic-worker-setup)
2. [OffscreenCanvas Rendering](#offscreencanvas-rendering)
3. [Background Processing](#background-processing)
4. [Worker Pool Pattern](#worker-pool-pattern)

---

## Basic Worker Setup

Setting up HTML Layout Parser in a Web Worker.

### Main Thread (main.ts)

```typescript
// main.ts - Main thread code

interface WorkerMessage {
  type: 'init' | 'loadFont' | 'parse' | 'destroy';
  id: number;
  payload?: any;
}

interface WorkerResponse {
  type: 'ready' | 'fontLoaded' | 'parsed' | 'destroyed' | 'error';
  id: number;
  payload?: any;
  error?: string;
}

class ParserWorkerClient {
  private worker: Worker;
  private messageId = 0;
  private pendingRequests: Map<number, { resolve: Function; reject: Function }> = new Map();

  constructor(workerUrl: string) {
    this.worker = new Worker(workerUrl, { type: 'module' });
    this.worker.onmessage = this.handleMessage.bind(this);
    this.worker.onerror = this.handleError.bind(this);
  }

  private handleMessage(event: MessageEvent<WorkerResponse>) {
    const { type, id, payload, error } = event.data;
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

  private handleError(event: ErrorEvent) {
    console.error('Worker error:', event.message);
  }

  private sendMessage<T>(type: WorkerMessage['type'], payload?: any): Promise<T> {
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
    console.log('Worker initialized');

    // Load font
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    const fontId = await client.loadFont(fontData, 'Arial');
    console.log(`Font loaded with ID: ${fontId}`);

    // Parse HTML
    const html = '<div style="font-size: 24px; color: blue;">Hello from Worker!</div>';
    const layouts = await client.parse(html, { viewportWidth: 800 });
    console.log(`Parsed ${layouts.length} characters`);

  } finally {
    await client.destroy();
  }
}

main();
```

### Worker Thread (parser-worker.ts)

```typescript
// parser-worker.ts - Worker thread code

import { HtmlLayoutParser } from 'html-layout-parser/worker';

let parser: HtmlLayoutParser | null = null;

interface WorkerMessage {
  type: 'init' | 'loadFont' | 'parse' | 'destroy';
  id: number;
  payload?: any;
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
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
        if (fontId > 0) {
          parser.setDefaultFont(fontId);
        }
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

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    self.postMessage({ type: `${type}ed`, id, payload: result });
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      id, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};
```

---

## OffscreenCanvas Rendering

Rendering to OffscreenCanvas in a Web Worker for better performance.

### Main Thread (main-offscreen.ts)

```typescript
// main-offscreen.ts

class OffscreenRendererClient {
  private worker: Worker;
  private canvas: HTMLCanvasElement;
  private offscreen: OffscreenCanvas | null = null;
  private messageId = 0;
  private pendingRequests: Map<number, { resolve: Function; reject: Function }> = new Map();

  constructor(canvas: HTMLCanvasElement, workerUrl: string) {
    this.canvas = canvas;
    this.worker = new Worker(workerUrl, { type: 'module' });
    this.worker.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent) {
    const { type, id, payload, error } = event.data;
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

  private sendMessage<T>(type: string, payload?: any, transfer?: Transferable[]): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({ type, id, payload }, transfer || []);
    });
  }

  async init(): Promise<void> {
    // Transfer canvas control to worker
    this.offscreen = this.canvas.transferControlToOffscreen();
    
    await this.sendMessage('init', {
      canvas: this.offscreen,
      width: this.canvas.width,
      height: this.canvas.height
    }, [this.offscreen]);
  }

  async loadFont(fontData: Uint8Array, fontName: string): Promise<number> {
    // Transfer the buffer for efficiency
    const buffer = fontData.buffer.slice(0);
    return this.sendMessage('loadFont', { 
      fontData: new Uint8Array(buffer), 
      fontName 
    }, [buffer]);
  }

  async render(html: string, css?: string): Promise<void> {
    await this.sendMessage('render', { html, css });
  }

  async resize(width: number, height: number): Promise<void> {
    await this.sendMessage('resize', { width, height });
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
    await renderer.init();
    console.log('OffscreenCanvas renderer initialized');

    // Load font
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    await renderer.loadFont(fontData, 'Arial');

    // Render HTML
    const html = `
      <div style="padding: 20px;">
        <h1 style="font-size: 32px; color: #333333FF;">Rendered in Worker</h1>
        <p style="font-size: 18px; color: #666666FF;">
          This content is parsed and rendered entirely in a Web Worker
          using OffscreenCanvas for optimal performance.
        </p>
      </div>
    `;

    await renderer.render(html);
    console.log('Render complete');

  } catch (error) {
    console.error('Error:', error);
  }

  // Handle window resize
  window.addEventListener('resize', async () => {
    const rect = canvas.getBoundingClientRect();
    await renderer.resize(rect.width, rect.height);
  });

  // Cleanup
  window.addEventListener('beforeunload', () => {
    renderer.destroy();
  });
}

main();
```

### Worker Thread (offscreen-worker.ts)

```typescript
// offscreen-worker.ts

import { HtmlLayoutParser, CharLayout } from 'html-layout-parser/worker';

let parser: HtmlLayoutParser | null = null;
let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

interface Message {
  type: string;
  id: number;
  payload?: any;
}

function parseColor(color: string): string {
  if (!color || color === 'transparent' || color === '#00000000') {
    return 'transparent';
  }
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
  // Draw background
  if (char.backgroundColor && char.backgroundColor !== '#00000000') {
    ctx.fillStyle = parseColor(char.backgroundColor);
    ctx.fillRect(char.x, char.y, char.width, char.height);
  }

  // Set font
  ctx.font = `${char.fontStyle} ${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
  
  // Apply opacity
  ctx.globalAlpha = char.opacity ?? 1;

  // Draw text shadow
  if (char.textShadow && char.textShadow.length > 0) {
    const shadow = char.textShadow[0];
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;
    ctx.shadowBlur = shadow.blurRadius;
    ctx.shadowColor = parseColor(shadow.color);
  }

  // Draw character
  ctx.fillStyle = parseColor(char.color);
  ctx.fillText(char.character, char.x, char.baseline);

  // Reset
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  // Draw underline
  if (char.textDecoration?.underline) {
    ctx.strokeStyle = parseColor(char.textDecoration.color || char.color);
    ctx.lineWidth = char.textDecoration.thickness || 1;
    ctx.beginPath();
    ctx.moveTo(char.x, char.baseline + 2);
    ctx.lineTo(char.x + char.width, char.baseline + 2);
    ctx.stroke();
  }
}

self.onmessage = async (event: MessageEvent<Message>) => {
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
        if (fontId > 0) {
          parser.setDefaultFont(fontId);
        }
        result = fontId;
        break;

      case 'render':
        if (!parser || !canvas || !ctx) {
          throw new Error('Not initialized');
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Parse HTML
        const layouts = parser.parse(payload.html, {
          viewportWidth: canvas.width,
          css: payload.css
        });

        // Render each character
        for (const char of layouts) {
          renderCharacter(ctx, char);
        }

        result = layouts.length;
        break;

      case 'resize':
        if (canvas) {
          canvas.width = payload.width;
          canvas.height = payload.height;
        }
        break;

      case 'destroy':
        if (parser) {
          parser.destroy();
          parser = null;
        }
        canvas = null;
        ctx = null;
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    self.postMessage({ type: 'success', id, payload: result });
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      id, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};
```

---

## Background Processing

Processing large documents in the background without blocking the main thread.

### Main Thread (background-main.ts)

```typescript
// background-main.ts

interface ProcessingJob {
  id: string;
  html: string;
  css?: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  result?: any;
  error?: string;
  progress?: number;
}

class BackgroundProcessor {
  private worker: Worker;
  private jobs: Map<string, ProcessingJob> = new Map();
  private onProgress?: (job: ProcessingJob) => void;
  private onComplete?: (job: ProcessingJob) => void;

  constructor(workerUrl: string) {
    this.worker = new Worker(workerUrl, { type: 'module' });
    this.worker.onmessage = this.handleMessage.bind(this);
  }

  private handleMessage(event: MessageEvent) {
    const { type, jobId, payload, error, progress } = event.data;
    const job = this.jobs.get(jobId);

    if (!job) return;

    switch (type) {
      case 'progress':
        job.status = 'processing';
        job.progress = progress;
        this.onProgress?.(job);
        break;

      case 'complete':
        job.status = 'complete';
        job.result = payload;
        job.progress = 100;
        this.onComplete?.(job);
        break;

      case 'error':
        job.status = 'error';
        job.error = error;
        this.onComplete?.(job);
        break;
    }
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === 'ready') {
          this.worker.removeEventListener('message', handler);
          resolve();
        } else if (event.data.type === 'error') {
          this.worker.removeEventListener('message', handler);
          reject(new Error(event.data.error));
        }
      };
      this.worker.addEventListener('message', handler);
      this.worker.postMessage({ type: 'init' });
    });
  }

  async loadFont(fontData: Uint8Array, fontName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === 'fontLoaded') {
          this.worker.removeEventListener('message', handler);
          resolve(event.data.fontId);
        } else if (event.data.type === 'error') {
          this.worker.removeEventListener('message', handler);
          reject(new Error(event.data.error));
        }
      };
      this.worker.addEventListener('message', handler);
      this.worker.postMessage({ type: 'loadFont', fontData, fontName });
    });
  }

  submitJob(html: string, css?: string): string {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: ProcessingJob = {
      id: jobId,
      html,
      css,
      status: 'pending',
      progress: 0
    };

    this.jobs.set(jobId, job);
    this.worker.postMessage({ type: 'process', jobId, html, css });

    return jobId;
  }

  getJob(jobId: string): ProcessingJob | undefined {
    return this.jobs.get(jobId);
  }

  setProgressHandler(handler: (job: ProcessingJob) => void) {
    this.onProgress = handler;
  }

  setCompleteHandler(handler: (job: ProcessingJob) => void) {
    this.onComplete = handler;
  }

  destroy() {
    this.worker.terminate();
    this.jobs.clear();
  }
}

// Usage
async function main() {
  const processor = new BackgroundProcessor('./background-worker.js');

  // Set up handlers
  processor.setProgressHandler((job) => {
    console.log(`Job ${job.id}: ${job.progress}% complete`);
    updateProgressBar(job.id, job.progress!);
  });

  processor.setCompleteHandler((job) => {
    if (job.status === 'complete') {
      console.log(`Job ${job.id} complete:`, job.result);
      displayResult(job.id, job.result);
    } else {
      console.error(`Job ${job.id} failed:`, job.error);
      displayError(job.id, job.error!);
    }
  });

  try {
    await processor.init();

    // Load font
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    await processor.loadFont(fontData, 'Arial');

    // Submit multiple jobs
    const documents = [
      '<div>Document 1 content...</div>',
      '<div>Document 2 content...</div>',
      '<div>Document 3 content...</div>'
    ];

    const jobIds = documents.map(html => processor.submitJob(html));
    console.log('Submitted jobs:', jobIds);

  } catch (error) {
    console.error('Error:', error);
  }
}

function updateProgressBar(jobId: string, progress: number) {
  const bar = document.getElementById(`progress-${jobId}`);
  if (bar) {
    (bar as HTMLProgressElement).value = progress;
  }
}

function displayResult(jobId: string, result: any) {
  const container = document.getElementById(`result-${jobId}`);
  if (container) {
    container.textContent = `Parsed ${result.length} characters`;
  }
}

function displayError(jobId: string, error: string) {
  const container = document.getElementById(`result-${jobId}`);
  if (container) {
    container.textContent = `Error: ${error}`;
    container.classList.add('error');
  }
}

main();
```

### Worker Thread (background-worker.ts)

```typescript
// background-worker.ts

import { HtmlLayoutParser } from 'html-layout-parser/worker';

let parser: HtmlLayoutParser | null = null;

self.onmessage = async (event: MessageEvent) => {
  const { type, jobId, html, css, fontData, fontName } = event.data;

  try {
    switch (type) {
      case 'init':
        parser = new HtmlLayoutParser();
        await parser.init();
        self.postMessage({ type: 'ready' });
        break;

      case 'loadFont':
        if (!parser) throw new Error('Parser not initialized');
        const fontId = parser.loadFont(fontData, fontName);
        if (fontId > 0) {
          parser.setDefaultFont(fontId);
        }
        self.postMessage({ type: 'fontLoaded', fontId });
        break;

      case 'process':
        if (!parser) throw new Error('Parser not initialized');

        // Report progress
        self.postMessage({ type: 'progress', jobId, progress: 10 });

        // Parse HTML
        const layouts = parser.parse(html, {
          viewportWidth: 800,
          css: css
        });

        self.postMessage({ type: 'progress', jobId, progress: 50 });

        // Simulate additional processing
        await new Promise(resolve => setTimeout(resolve, 100));

        self.postMessage({ type: 'progress', jobId, progress: 90 });

        // Complete
        self.postMessage({ type: 'complete', jobId, payload: layouts });
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      jobId,
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};
```

---

## Worker Pool Pattern

Using multiple workers for parallel processing.

```typescript
// worker-pool.ts

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
  private initialized = false;

  constructor(
    private workerUrl: string,
    private poolSize: number = navigator.hardwareConcurrency || 4
  ) {}

  async init(fontData: Uint8Array, fontName: string): Promise<void> {
    if (this.initialized) return;

    // Create workers
    const initPromises = [];

    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerUrl, { type: 'module' });
      
      worker.onmessage = (event) => this.handleWorkerMessage(worker, event);
      worker.onerror = (event) => this.handleWorkerError(worker, event);

      this.workers.push(worker);

      // Initialize each worker
      const initPromise = new Promise<void>((resolve, reject) => {
        const handler = (event: MessageEvent) => {
          if (event.data.type === 'ready') {
            worker.removeEventListener('message', handler);
            resolve();
          } else if (event.data.type === 'error') {
            worker.removeEventListener('message', handler);
            reject(new Error(event.data.error));
          }
        };
        worker.addEventListener('message', handler);
        worker.postMessage({ type: 'init', fontData, fontName });
      });

      initPromises.push(initPromise);
    }

    await Promise.all(initPromises);
    this.initialized = true;
    console.log(`Worker pool initialized with ${this.poolSize} workers`);
  }

  private handleWorkerMessage(worker: Worker, event: MessageEvent) {
    const task = this.workerTaskMap.get(worker);
    if (!task) return;

    const { type, payload, error } = event.data;

    if (type === 'complete') {
      task.resolve(payload);
    } else if (type === 'error') {
      task.reject(new Error(error));
    }

    // Clean up and process next task
    this.workerTaskMap.delete(worker);
    this.busyWorkers.delete(worker);
    this.processNextTask();
  }

  private handleWorkerError(worker: Worker, event: ErrorEvent) {
    const task = this.workerTaskMap.get(worker);
    if (task) {
      task.reject(new Error(event.message));
      this.workerTaskMap.delete(worker);
    }
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
      const task: PoolTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        html,
        css,
        resolve,
        reject
      };

      this.taskQueue.push(task);
      this.processNextTask();
    });
  }

  async parseAll(documents: Array<{ html: string; css?: string }>): Promise<CharLayout[][]> {
    return Promise.all(
      documents.map(doc => this.parse(doc.html, doc.css))
    );
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
    this.workerTaskMap.clear();
    this.initialized = false;
  }
}

// Pool worker (pool-worker.ts)
// Similar to basic worker but optimized for pool usage

// Usage
async function main() {
  const pool = new ParserWorkerPool('./pool-worker.js', 4);

  try {
    // Load font and initialize all workers
    const fontResponse = await fetch('/fonts/arial.ttf');
    const fontData = new Uint8Array(await fontResponse.arrayBuffer());
    await pool.init(fontData, 'Arial');

    // Process many documents in parallel
    const documents = Array.from({ length: 100 }, (_, i) => ({
      html: `<div>Document ${i + 1}</div>`,
      css: '.container { font-size: 16px; }'
    }));

    console.log('Processing 100 documents...');
    const startTime = performance.now();

    const results = await pool.parseAll(documents);

    const endTime = performance.now();
    console.log(`Processed ${results.length} documents in ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`Average: ${((endTime - startTime) / results.length).toFixed(2)}ms per document`);

  } finally {
    pool.destroy();
  }
}

main();
```
