// Test Node.js environment
import { HtmlLayoutParser } from './packages/html-layout-parser/dist/node.js';

async function testNodeEnvironment() {
    console.log('🧪 Testing Node.js environment...');
    
    const parser = new HtmlLayoutParser();
    
    try {
        console.log('📦 Initializing parser...');
        await parser.init();
        
        console.log('📝 Parsing HTML...');
        const html = '<div style="font-size: 24px; color: #333;">Hello from Node.js!</div>';
        const layouts = parser.parse(html, { viewportWidth: 800 });
        
        console.log(`✅ Successfully parsed ${layouts.length} layout items`);
        
        if (layouts.length > 0) {
            console.log('📊 First layout item:', {
                character: layouts[0].character,
                x: layouts[0].x,
                y: layouts[0].y,
                fontSize: layouts[0].fontSize,
                fontFamily: layouts[0].fontFamily
            });
        }
        
        // Test memory metrics
        const metrics = parser.getMemoryMetrics();
        if (metrics) {
            console.log(`💾 Memory usage: ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
        }
        
        console.log('✅ Node.js environment test passed!');
        
    } catch (error) {
        console.error('❌ Node.js environment test failed:', error.message);
        throw error;
    } finally {
        parser.destroy();
        console.log('🧹 Parser destroyed');
    }
}

testNodeEnvironment().catch(console.error);