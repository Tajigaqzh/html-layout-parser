// Test package imports
import { HtmlLayoutParser as WebParser } from './packages/html-layout-parser/dist/web.js';
import { HtmlLayoutParser as NodeParser } from './packages/html-layout-parser/dist/node.js';
import { HtmlLayoutParser as WorkerParser } from './packages/html-layout-parser/dist/worker.js';

console.log('✅ Web parser imported:', typeof WebParser);
console.log('✅ Node parser imported:', typeof NodeParser);
console.log('✅ Worker parser imported:', typeof WorkerParser);

// Test instantiation
const webParser = new WebParser();
const nodeParser = new NodeParser();
const workerParser = new WorkerParser();

console.log('✅ Web parser instantiated:', webParser.constructor.name);
console.log('✅ Node parser instantiated:', nodeParser.constructor.name);
console.log('✅ Worker parser instantiated:', workerParser.constructor.name);

console.log('✅ All imports and instantiations successful!');