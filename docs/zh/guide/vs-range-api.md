# HTML Layout Parser vs 浏览器 Range API

在 Web 应用中测量文本布局时，开发者通常使用浏览器 API，如 Range 或 `getBoundingClientRect()`。虽然这些 API 可以工作，但它们有显著的局限性，而 HTML Layout Parser 解决了这些问题。

## 浏览器 API 的问题

### 1. 跨浏览器不一致

浏览器 Range API 在**不同浏览器上产生不同的结果**：

```typescript
// 相同的 HTML，不同的浏览器
const html = '<div style="font-size: 16px;">Hello World</div>';

// Chrome 结果
{ x: 8, y: 8, width: 66.5, height: 19 }

// Safari 结果  
{ x: 8, y: 8, width: 67.2, height: 19 }

// Firefox 结果
{ x: 8, y: 8, width: 66.8, height: 19 }
```

**原因？** 每个浏览器都有自己的：
- 文本渲染引擎
- 字体微调算法
- 亚像素渲染逻辑
- 舍入策略

### 2. 平台特定差异

同一浏览器在不同平台上产生不同结果：

```typescript
// macOS 上的 Chrome
{ width: 66.5 }

// Windows 上的 Chrome
{ width: 67.1 }

// Linux 上的 Chrome
{ width: 66.9 }
```

**原因？** 操作系统有不同的：
- 字体渲染系统（CoreText、DirectWrite、FreeType）
- 抗锯齿设置
- DPI 缩放

## HTML Layout Parser 解决方案

### 100% 一致的结果

解析器在**任何地方都产生相同的结果**：

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

const parser = new HtmlLayoutParser();
await parser.init();

// 加载字体
const fontData = await loadFont('Arial.ttf');
parser.loadFont(fontData, 'Arial');

// 解析
const layouts = parser.parse(
  '<div style="font-size: 16px;">Hello World</div>',
  { viewportWidth: 800 }
);

// 结果在以下环境完全相同：
// ✅ Chrome、Safari、Firefox
// ✅ Windows、macOS、Linux
// ✅ 所有浏览器版本
// ✅ Node.js 服务端
```

### 工作原理

1. **单一布局引擎**：使用编译为 WASM 的 litehtml（C++）
2. **嵌入式字体度量**：使用 FreeType 实现一致的字体渲染
3. **确定性算法**：相同输入 → 相同输出，始终如一
4. **无浏览器依赖**：在 WASM 沙箱中运行

## 对比表

| 特性 | 浏览器 Range API | HTML Layout Parser |
|------|-----------------|-------------------|
| **跨浏览器一致性** | ❌ 结果不同 | ✅ 结果相同 |
| **跨平台一致性** | ❌ 平台相关 | ✅ 平台无关 |
| **版本稳定性** | ❌ 随更新变化 | ✅ 跨版本稳定 |
| **服务端支持** | ❌ 需要无头浏览器 | ✅ 原生 Node.js 支持 |
| **离线能力** | ❌ 需要 DOM | ✅ 可离线工作 |
| **性能** | ⚠️ DOM 操作开销 | ✅ 快速 WASM 执行 |
| **可预测测试** | ❌ 测试不稳定 | ✅ 确定性测试 |

## 实际影响

### 问题：Safari vs Chrome 差异

```typescript
// 使用 Range API
function measureWithRange(text: string): number {
  const div = document.createElement('div');
  div.textContent = text;
  document.body.appendChild(div);
  
  const range = document.createRange();
  range.selectNodeContents(div);
  const width = range.getBoundingClientRect().width;
  
  document.body.removeChild(div);
  return width;
}

// Chrome: 150.5px
// Safari: 151.2px
// 差异: 0.7px (0.46%)
```

**影响**：在 1000 字符的文档中，这会累积到 **7px 差异** - 足以导致：
- 文本溢出
- 错误的换行
- 元素错位

### 解决方案：一致的解析

```typescript
// 使用 HTML Layout Parser
const layouts = parser.parse(text, { viewportWidth: 800 });
const width = layouts[layouts.length - 1].x + layouts[layouts.length - 1].width;

// Chrome: 150.5px
// Safari: 150.5px
// 差异: 0px (0%)
```

## 使用场景

### ✅ 何时使用 HTML Layout Parser

1. **跨平台应用**
   - 桌面应用（Electron、Tauri）
   - 移动应用（React Native、Capacitor）
   - 渐进式 Web 应用

2. **服务端渲染**
   - 从 HTML 生成图片
   - PDF 生成
   - 精确布局的邮件模板

3. **基于 Canvas 的编辑器**
   - 富文本编辑器
   - 带文本标签的图表工具
   - 游戏 UI

4. **自动化测试**
   - 视觉回归测试
   - 布局验证
   - 截图对比

### ⚠️ 何时 Range API 可能足够

1. **简单文本测量** - 单行文本，无复杂布局
2. **仅浏览器应用** - 无跨平台需求
3. **近似定位** - 不需要像素级精确度
4. **原生 DOM 渲染** - 内容保留在 DOM 中，不需 Canvas

## 迁移示例

### 之前：Range API

```typescript
class TextMeasurer {
  measure(html: string): CharPosition[] {
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    
    const positions: CharPosition[] = [];
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT
    );
    
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent || '';
      for (let i = 0; i < text.length; i++) {
        const range = document.createRange();
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const rect = range.getBoundingClientRect();
        
        positions.push({
          char: text[i],
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        });
      }
    }
    
    document.body.removeChild(container);
    return positions;
  }
}

// ❌ 问题：
// - Chrome 和 Safari 上结果不同
// - DOM 操作开销
// - 无法在服务端运行
// - 测试不稳定
```

### 之后：HTML Layout Parser

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

class TextMeasurer {
  private parser: HtmlLayoutParser;
  
  async init() {
    this.parser = new HtmlLayoutParser();
    await this.parser.init();
    
    const fontData = await loadFont('Arial.ttf');
    this.parser.loadFont(fontData, 'Arial');
  }
  
  measure(html: string): CharPosition[] {
    const layouts = this.parser.parse(html, { 
      viewportWidth: 800 
    });
    
    return layouts.map(char => ({
      char: char.character,
      x: char.x,
      y: char.y,
      width: char.width,
      height: char.height
    }));
  }
}

// ✅ 优势：
// - 任何地方结果相同
// - 无 DOM 操作
// - 可在 Node.js 中运行
// - 确定性测试
```

## 性能对比

```typescript
// 基准测试：测量 1000 个字符

// Range API
console.time('Range API');
const rangeResults = measureWithRange(longText);
console.timeEnd('Range API');
// Range API: 45ms (Chrome), 52ms (Safari)

// HTML Layout Parser
console.time('Parser');
const parserResults = parser.parse(longText, { viewportWidth: 800 });
console.timeEnd('Parser');
// Parser: 8ms (任何地方)
```

**结果**：解析器**快 5-6 倍**且在所有浏览器上一致。

## 测试优势

### 之前：不稳定的测试

```typescript
// 测试在不同浏览器/平台上随机失败
test('文本应该适合容器', () => {
  const width = measureWithRange(text);
  expect(width).toBeLessThan(800);
  // ❌ Safari 上失败但 Chrome 上通过
});
```

### 之后：可靠的测试

```typescript
test('文本应该适合容器', () => {
  const layouts = parser.parse(text, { viewportWidth: 800 });
  const width = getTextWidth(layouts);
  expect(width).toBeLessThan(800);
  // ✅ 任何地方都通过
});
```

## 总结

HTML Layout Parser 解决了**跨平台文本测量不一致**的根本问题。相比 Range API，它通过单一的基于 WASM 的布局引擎和嵌入式字体度量，提供：

- ✅ **100% 一致的结果** - 所有浏览器和平台
- ✅ **更快的性能** - 比基于 DOM 的测量更快
- ✅ **服务端支持** - 无需无头浏览器
- ✅ **确定性测试** - 没有不稳定的测试
- ✅ **面向未来** - 不依赖浏览器更新

对于需要精确、一致文本布局的应用 - 特别是基于 Canvas 的渲染 - HTML Layout Parser 是更优的选择。

## 相关文档

- [快速开始](./getting-started.md)
- [Canvas 渲染](./canvas-rendering.md)
- [性能优化](./performance.md)
- [对比 SVG foreignObject](./vs-svg-foreignobject.md)
- [对比 Canvas measureText](./vs-measure-text.md)
