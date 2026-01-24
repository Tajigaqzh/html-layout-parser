// Test CommonJS require after npm publish
const { HtmlLayoutParser, detectEnvironment } = require('html-layout-parser');

console.log('Environment:', detectEnvironment());

async function test() {
  try {
    const parser = new HtmlLayoutParser();
    console.log('Parser created successfully');
    
    // Note: This will fail without WASM files, but require should work
    // await parser.init();
    
    console.log('✅ CommonJS require works!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();