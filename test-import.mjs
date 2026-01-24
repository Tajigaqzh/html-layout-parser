// Test ESM import after npm publish
import { HtmlLayoutParser, detectEnvironment } from 'html-layout-parser';

console.log('Environment:', detectEnvironment());

async function test() {
  try {
    const parser = new HtmlLayoutParser();
    console.log('Parser created successfully');
    
    // Note: This will fail without WASM files, but import should work
    // await parser.init();
    
    console.log('✅ ESM import works!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();