# Web 浏览器示例

在 Web 浏览器中使用 HTML Layout Parser 进行实时 HTML 布局解析和 Canvas 渲染。

## 基本 Web 使用

### HTML 结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Layout Parser Web 示例</title>
</head>
<body>
    <div class="container">
        <h1>HTML Layout Parser 演示</h1>
        
        <div class="input-section">
            <label for="html-input">HTML 内容:</label>
            <textarea id="html-input" rows="10" cols="50">
<div style="color: #333; font-size: 18px;">
    <h2 style="color: #007acc;">欢迎使用 HTML Layout Parser</h2>
    <p style="color: #666; font-size: 14px;">这是一个高性能的 HTML 布局解析器。</p>
    <div style="background-color: #f0f0f0; padding: 10px;">
        <span style="color: red;">红色文字</span>
        <span style="color: blue; font-weight: bold;">蓝色粗体</span>
    </div>
</div>
            </textarea>
            
            <label for="css-input">CSS 样式 (可选):</label>
            <textarea id="css-input" rows="5" cols="50">
h2 { text-decoration: underline; }
p { font-style: italic; }
            </textarea>
            
            <button id="parse-btn">解析并渲染</button>
        </div>
        
        <div class="output-section">
            <canvas id="output-canvas" width="800" height="600"></canvas>
            <div id="info-panel"></div>
        </div>
    </div>
    
    <script type="module" src="./app.js"></script>
</body>
</html>
```

### CSS 样式

```css
/* styles.css */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
}

.input-section {
    margin-bottom: 20px;
}

.input-section label {
    display: block;
    margin-top: 10px;
    margin-bottom: 5px;
    font-weight: bold;
}

.input-section textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: monospace;
}

.input-section button {
    margin-top: 10px;
    padding: 10px 20px;
    background-color: #007acc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.input-section button:hover {
    background-color: #005a9e;
}

.output-section {
    display: flex;
    gap: 20px;
}

#output-canvas {
    border: 1px solid #ccc;
    background-color: white;
}

#info-panel {
    flex: 1;
    padding: 10px;
    background-color: #f5f5f5;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
}
```

### JavaScript 应用

```typescript
// app.ts
import { HtmlLayoutParser } from 'html-layout-parser/web';

class WebParserDemo {
    private parser: HtmlLayoutParser;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private infoPanel: HTMLElement;
    private isInitialized = false;

    constructor() {
        this.parser = new HtmlLayoutParser();
        this.canvas = document.getElementById('output-canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.infoPanel = document.getElementById('info-panel')!;
        
        this.setupEventListeners();
        this.init();
    }

    private async init(): Promise<void> {
        try {
            this.updateInfo('正在初始化解析器...');
            
            // 初始化解析器
            await this.parser.init();
            
            // 加载默认字体
            await this.loadDefaultFont();
            
            this.isInitialized = true;
            this.updateInfo('解析器初始化完成');
            
            // 执行初始解析
            this.parseAndRender();
            
        } catch (error) {
            this.updateInfo(`初始化失败: ${error.message}`);
            console.error('初始化错误:', error);
        }
    }

    private async loadDefaultFont(): Promise<void> {
        try {
            // 尝试加载 Arial 字体
            const fontResponse = await fetch('/fonts/arial.ttf');
            
            if (fontResponse.ok) {
                const fontData = new Uint8Array(await fontResponse.arrayBuffer());
                const fontId = this.parser.loadFont(fontData, 'Arial');
                
                if (fontId > 0) {
                    this.parser.setDefaultFont(fontId);
                    this.updateInfo('Arial 字体加载成功');
                } else {
                    throw new Error('字体加载失败');
                }
            } else {
                throw new Error('字体文件下载失败');
            }
        } catch (error) {
            this.updateInfo(`字体加载失败: ${error.message}，将使用系统默认字体`);
            console.warn('字体加载警告:', error);
        }
    }

    private setupEventListeners(): void {
        const parseBtn = document.getElementById('parse-btn')!;
        const htmlInput = document.getElementById('html-input') as HTMLTextAreaElement;
        const cssInput = document.getElementById('css-input') as HTMLTextAreaElement;

        parseBtn.addEventListener('click', () => {
            if (this.isInitialized) {
                this.parseAndRender();
            } else {
                this.updateInfo('解析器尚未初始化完成，请稍候...');
            }
        });

        // 实时解析（防抖）
        let debounceTimer: number;
        const debouncedParse = () => {
            clearTimeout(debounceTimer);
            debounceTimer = window.setTimeout(() => {
                if (this.isInitialized) {
                    this.parseAndRender();
                }
            }, 500);
        };

        htmlInput.addEventListener('input', debouncedParse);
        cssInput.addEventListener('input', debouncedParse);
    }

    private parseAndRender(): void {
        try {
            const htmlInput = document.getElementById('html-input') as HTMLTextAreaElement;
            const cssInput = document.getElementById('css-input') as HTMLTextAreaElement;
            
            const html = htmlInput.value.trim();
            const css = cssInput.value.trim();
            
            if (!html) {
                this.updateInfo('请输入 HTML 内容');
                return;
            }

            this.updateInfo('正在解析...');
            
            const startTime = performance.now();
            
            // 解析 HTML
            const result = this.parser.parseWithDiagnostics(html, {
                viewportWidth: this.canvas.width,
                css: css || undefined,
                enableMetrics: true
            });
            
            const endTime = performance.now();
            
            if (result.success) {
                // 渲染到 Canvas
                this.renderToCanvas(result.data);
                
                // 更新信息面板
                this.updateParseInfo(result, endTime - startTime);
                
            } else {
                this.updateInfo('解析失败:\n' + 
                    result.errors?.map(e => `[${e.code}] ${e.message}`).join('\n'));
            }
            
        } catch (error) {
            this.updateInfo(`解析异常: ${error.message}`);
            console.error('解析错误:', error);
        }
    }

    private renderToCanvas(layouts: CharLayout[]): void {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 设置背景
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 渲染字符
        for (const char of layouts) {
            this.renderCharacter(char);
        }
    }

    private renderCharacter(char: CharLayout): void {
        // 保存当前状态
        this.ctx.save();
        
        try {
            // 设置字体
            this.ctx.font = `${char.fontStyle} ${char.fontWeight} ${char.fontSize}px ${char.fontFamily}`;
            
            // 设置透明度
            this.ctx.globalAlpha = char.opacity;
            
            // 绘制背景
            if (char.backgroundColor !== '#00000000') {
                this.ctx.fillStyle = char.backgroundColor;
                this.ctx.fillRect(
                    char.x, 
                    char.y - char.fontSize, 
                    char.width, 
                    char.height
                );
            }
            
            // 绘制字符
            this.ctx.fillStyle = char.color;
            this.ctx.fillText(char.character, char.x, char.baseline);
            
            // 绘制文本装饰
            this.renderTextDecoration(char);
            
        } finally {
            // 恢复状态
            this.ctx.restore();
        }
    }

    private renderTextDecoration(char: CharLayout): void {
        const decoration = char.textDecoration;
        
        if (!decoration.underline && !decoration.overline && !decoration.lineThrough) {
            return;
        }
        
        this.ctx.strokeStyle = decoration.color || char.color;
        this.ctx.lineWidth = decoration.thickness;
        
        // 设置线条样式
        switch (decoration.style) {
            case 'dashed':
                this.ctx.setLineDash([5, 5]);
                break;
            case 'dotted':
                this.ctx.setLineDash([2, 2]);
                break;
            default:
                this.ctx.setLineDash([]);
        }
        
        this.ctx.beginPath();
        
        if (decoration.underline) {
            const y = char.baseline + 2;
            this.ctx.moveTo(char.x, y);
            this.ctx.lineTo(char.x + char.width, y);
        }
        
        if (decoration.overline) {
            const y = char.y;
            this.ctx.moveTo(char.x, y);
            this.ctx.lineTo(char.x + char.width, y);
        }
        
        if (decoration.lineThrough) {
            const y = char.baseline - char.fontSize / 3;
            this.ctx.moveTo(char.x, y);
            this.ctx.lineTo(char.x + char.width, y);
        }
        
        this.ctx.stroke();
        this.ctx.setLineDash([]); // 重置线条样式
    }

    private updateParseInfo(result: any, parseTime: number): void {
        const layouts = result.data;
        const metrics = result.metrics;
        
        let info = `解析完成!\n`;
        info += `解析时间: ${parseTime.toFixed(2)}ms\n`;
        info += `字符数量: ${layouts.length}\n`;
        
        if (metrics) {
            info += `HTML 解析: ${metrics.parseTime.toFixed(2)}ms\n`;
            info += `布局计算: ${metrics.layoutTime.toFixed(2)}ms\n`;
            info += `序列化: ${metrics.serializationTime.toFixed(2)}ms\n`;
            info += `解析速度: ${metrics.charsPerSecond.toFixed(0)} 字符/秒\n`;
        }
        
        // 字体统计
        const fontUsage: Record<string, number> = {};
        layouts.forEach((char: CharLayout) => {
            fontUsage[char.fontFamily] = (fontUsage[char.fontFamily] || 0) + 1;
        });
        
        info += `\n字体使用:\n`;
        Object.entries(fontUsage).forEach(([font, count]) => {
            info += `  ${font}: ${count} 字符\n`;
        });
        
        // 内存使用
        const memoryMetrics = this.parser.getMemoryMetrics();
        if (memoryMetrics) {
            info += `\n内存使用:\n`;
            info += `  总计: ${(memoryMetrics.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB\n`;
            info += `  字体: ${memoryMetrics.fontCount} 个\n`;
        }
        
        // 缓存统计
        const cacheStats = this.parser.getCacheStats();
        info += `\n缓存统计:\n`;
        info += `  命中率: ${(cacheStats.hitRate * 100).toFixed(1)}%\n`;
        info += `  条目数: ${cacheStats.entries}\n`;
        
        this.updateInfo(info);
    }

    private updateInfo(message: string): void {
        this.infoPanel.textContent = message;
    }

    // 清理资源
    public destroy(): void {
        if (this.parser) {
            this.parser.destroy();
        }
    }
}

// 启动应用
const demo = new WebParserDemo();

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    demo.destroy();
});
```

## 高级 Web 示例

### 交互式编辑器

```typescript
// interactive-editor.ts
class InteractiveHTMLEditor {
    private parser: HtmlLayoutParser;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private layouts: CharLayout[] = [];
    private selectedChar: CharLayout | null = null;

    constructor(canvasId: string) {
        this.parser = new HtmlLayoutParser();
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        
        this.setupCanvasEvents();
        this.init();
    }

    private setupCanvasEvents(): void {
        this.canvas.addEventListener('click', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            this.handleCanvasClick(x, y);
        });

        this.canvas.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            this.handleCanvasHover(x, y);
        });
    }

    private handleCanvasClick(x: number, y: number): void {
        // 查找点击位置的字符
        const clickedChar = this.findCharacterAt(x, y);
        
        if (clickedChar) {
            this.selectedChar = clickedChar;
            this.highlightCharacter(clickedChar);
            this.showCharacterInfo(clickedChar);
        } else {
            this.selectedChar = null;
            this.redraw();
        }
    }

    private handleCanvasHover(x: number, y: number): void {
        const hoveredChar = this.findCharacterAt(x, y);
        
        if (hoveredChar) {
            this.canvas.style.cursor = 'pointer';
            this.showTooltip(hoveredChar, x, y);
        } else {
            this.canvas.style.cursor = 'default';
            this.hideTooltip();
        }
    }

    private findCharacterAt(x: number, y: number): CharLayout | null {
        for (const char of this.layouts) {
            if (x >= char.x && 
                x <= char.x + char.width && 
                y >= char.y - char.fontSize && 
                y <= char.y) {
                return char;
            }
        }
        return null;
    }

    private highlightCharacter(char: CharLayout): void {
        this.redraw();
        
        // 绘制高亮框
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            char.x - 1, 
            char.y - char.fontSize - 1, 
            char.width + 2, 
            char.height + 2
        );
    }

    private showCharacterInfo(char: CharLayout): void {
        const info = `
字符: "${char.character}"
位置: (${char.x.toFixed(1)}, ${char.y.toFixed(1)})
尺寸: ${char.width.toFixed(1)} × ${char.height.toFixed(1)}
字体: ${char.fontFamily} ${char.fontSize}px
颜色: ${char.color}
        `.trim();
        
        const infoElement = document.getElementById('char-info');
        if (infoElement) {
            infoElement.textContent = info;
        }
    }

    private showTooltip(char: CharLayout, x: number, y: number): void {
        // 创建或更新工具提示
        let tooltip = document.getElementById('canvas-tooltip') as HTMLElement;
        
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'canvas-tooltip';
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                pointer-events: none;
                z-index: 1000;
            `;
            document.body.appendChild(tooltip);
        }
        
        tooltip.textContent = `"${char.character}" (${char.fontFamily} ${char.fontSize}px)`;
        tooltip.style.left = `${x + 10}px`;
        tooltip.style.top = `${y - 30}px`;
        tooltip.style.display = 'block';
    }

    private hideTooltip(): void {
        const tooltip = document.getElementById('canvas-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    private redraw(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (const char of this.layouts) {
            this.renderCharacter(char);
        }
    }

    // ... 其他方法与基本示例相同
}
```

### 实时预览组件

```typescript
// real-time-preview.ts
class RealTimePreview {
    private parser: HtmlLayoutParser;
    private canvas: HTMLCanvasElement;
    private htmlEditor: HTMLTextAreaElement;
    private cssEditor: HTMLTextAreaElement;
    private debounceTimer: number = 0;

    constructor() {
        this.parser = new HtmlLayoutParser();
        this.canvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
        this.htmlEditor = document.getElementById('html-editor') as HTMLTextAreaElement;
        this.cssEditor = document.getElementById('css-editor') as HTMLTextAreaElement;
        
        this.setupRealtimePreview();
        this.init();
    }

    private setupRealtimePreview(): void {
        const updatePreview = () => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = window.setTimeout(() => {
                this.updatePreview();
            }, 300); // 300ms 防抖
        };

        this.htmlEditor.addEventListener('input', updatePreview);
        this.cssEditor.addEventListener('input', updatePreview);
        
        // 支持 Ctrl+S 保存并更新
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault();
                this.updatePreview();
            }
        });
    }

    private async updatePreview(): Promise<void> {
        try {
            const html = this.htmlEditor.value;
            const css = this.cssEditor.value;
            
            if (!html.trim()) {
                this.clearCanvas();
                return;
            }

            const result = this.parser.parseWithDiagnostics(html, {
                viewportWidth: this.canvas.width,
                css: css || undefined,
                enableMetrics: true
            });

            if (result.success) {
                this.renderLayouts(result.data);
                this.updateStatus('success', `解析成功 (${result.data.length} 字符)`);
                
                if (result.metrics) {
                    this.updatePerformanceInfo(result.metrics);
                }
            } else {
                this.updateStatus('error', '解析失败: ' + 
                    result.errors?.map(e => e.message).join(', '));
            }
            
        } catch (error) {
            this.updateStatus('error', `解析异常: ${error.message}`);
        }
    }

    private updateStatus(type: 'success' | 'error' | 'warning', message: string): void {
        const statusElement = document.getElementById('preview-status');
        if (statusElement) {
            statusElement.className = `status ${type}`;
            statusElement.textContent = message;
        }
    }

    private updatePerformanceInfo(metrics: any): void {
        const perfElement = document.getElementById('performance-info');
        if (perfElement) {
            perfElement.innerHTML = `
                <div>解析时间: ${metrics.parseTime.toFixed(2)}ms</div>
                <div>布局时间: ${metrics.layoutTime.toFixed(2)}ms</div>
                <div>解析速度: ${metrics.charsPerSecond.toFixed(0)} 字符/秒</div>
            `;
        }
    }

    // ... 其他渲染方法
}
```

## 性能优化示例

### Canvas 虚拟化

```typescript
// canvas-virtualization.ts
class VirtualizedCanvas {
    private parser: HtmlLayoutParser;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private layouts: CharLayout[] = [];
    private viewportY: number = 0;
    private viewportHeight: number;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.viewportHeight = this.canvas.height;
        this.parser = new HtmlLayoutParser();
        
        this.setupScrolling();
    }

    private setupScrolling(): void {
        this.canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            
            this.viewportY += event.deltaY;
            this.viewportY = Math.max(0, this.viewportY);
            
            this.renderVisibleArea();
        });
    }

    private renderVisibleArea(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 只渲染可见区域内的字符
        const visibleChars = this.layouts.filter(char => {
            const charTop = char.y - char.fontSize;
            const charBottom = char.y;
            
            return charBottom >= this.viewportY && 
                   charTop <= this.viewportY + this.viewportHeight;
        });
        
        for (const char of visibleChars) {
            // 调整 Y 坐标以适应滚动
            const adjustedChar = {
                ...char,
                y: char.y - this.viewportY,
                baseline: char.baseline - this.viewportY
            };
            
            this.renderCharacter(adjustedChar);
        }
        
        // 显示滚动指示器
        this.renderScrollIndicator();
    }

    private renderScrollIndicator(): void {
        if (this.layouts.length === 0) return;
        
        const maxY = Math.max(...this.layouts.map(c => c.y));
        const totalHeight = maxY + 50; // 添加一些底部边距
        
        if (totalHeight <= this.viewportHeight) return;
        
        // 绘制滚动条
        const scrollbarWidth = 10;
        const scrollbarHeight = (this.viewportHeight / totalHeight) * this.viewportHeight;
        const scrollbarY = (this.viewportY / totalHeight) * this.viewportHeight;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(
            this.canvas.width - scrollbarWidth, 
            scrollbarY, 
            scrollbarWidth, 
            scrollbarHeight
        );
    }

    // ... 其他方法
}
```

这些 Web 示例展示了如何在浏览器环境中有效使用 HTML Layout Parser，包括基本使用、交互功能、实时预览和性能优化等方面。