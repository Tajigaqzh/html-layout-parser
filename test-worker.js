// Test worker for package verification
import { HtmlLayoutParser } from './packages/html-layout-parser/dist/worker.js';

let parser = null;

self.onmessage = async (event) => {
    const { type, html, viewportWidth } = event.data;
    
    try {
        if (type === 'test') {
            // Initialize parser
            if (!parser) {
                parser = new HtmlLayoutParser();
                await parser.init();
            }
            
            // Parse HTML
            const layouts = parser.parse(html, { viewportWidth });
            
            self.postMessage({
                type: 'test',
                success: true,
                data: layouts
            });
        }
    } catch (error) {
        self.postMessage({
            type: 'test',
            success: false,
            error: error.message
        });
    }
};