# 字体管理

HTML Layout Parser 支持加载和管理多个字体，提供自动回退机制。

## 加载字体

### Web 环境

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/web';

const parser = new HtmlLayoutParser();
await parser.init();

// 从 URL 加载字体
const response = await fetch('/fonts/arial.ttf');
const fontData = new Uint8Array(await response.arrayBuffer());
const fontId = parser.loadFont(fontData, 'Arial');

if (fontId > 0) {
  console.log('字体加载成功，ID:', fontId);
} else {
  console.error('字体加载失败');
}
```

### Node.js 环境

```typescript
import { HtmlLayoutParser } from 'html-layout-parser/node';

const parser = new HtmlLayoutParser();
await parser.init();

// 从文件加载字体
const fontId = await parser.loadFontFromFile('./fonts/arial.ttf', 'Arial');
```

## 支持的字体格式

- **TTF** (TrueType Font)
- **OTF** (OpenType Font)
- **WOFF** (Web Open Font Format)

## 设置默认字体

默认字体用于回退，当 CSS 中指定的字体未加载时使用。

```typescript
const fontId = parser.loadFont(fontData, 'Arial');
parser.setDefaultFont(fontId);
```

## 多字体管理

### 加载多个字体

```typescript
const fonts = [
  { url: '/fonts/arial.ttf', name: 'Arial' },
  { url: '/fonts/times.ttf', name: 'Times New Roman' },
  { url: '/fonts/courier.ttf', name: 'Courier New' }
];

const fontIds = new Map<string, number>();

for (const font of fonts) {
  const response = await fetch(font.url);
  const data = new Uint8Array(await response.arrayBuffer());
  const fontId = parser.loadFont(data, font.name);
  
  if (fontId > 0) {
    fontIds.set(font.name, fontId);
  }
}

// 设置默认字体
const defaultId = fontIds.get('Arial');
if (defaultId) {
  parser.setDefaultFont(defaultId);
}
```

### 字体回退链

CSS 中的 font-family 支持回退链：

```typescript
const html = `
  <div style="font-family: 'Custom Font', Arial, sans-serif;">
    文本内容
  </div>
`;

// 如果 'Custom Font' 未加载，会使用 Arial
// 如果 Arial 也未加载，会使用默认字体
const layouts = parser.parse(html, { viewportWidth: 800 });
```

## 查询已加载字体

```typescript
const fonts = parser.getLoadedFonts();

for (const font of fonts) {
  console.log(`字体: ${font.name}`);
  console.log(`ID: ${font.id}`);
  console.log(`内存占用: ${(font.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
}
```

## 卸载字体

### 卸载单个字体

```typescript
parser.unloadFont(fontId);
```

### 清除所有字体

```typescript
parser.clearAllFonts();
```

## 字体内存管理

每个字体大约占用 8MB 内存（约等于字体文件大小）。

### 监控字体内存

```typescript
const metrics = parser.getMemoryMetrics();

if (metrics) {
  console.log(`总内存: ${(metrics.totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
  console.log(`字体数量: ${metrics.fontCount}`);
  
  for (const font of metrics.fonts) {
    const mb = (font.memoryUsage / 1024 / 1024).toFixed(2);
    console.log(`${font.name}: ${mb} MB`);
  }
}
```

### 内存优化建议

1. **只加载需要的字体**
   ```typescript
   // ✅ 好的做法
   parser.loadFont(arialData, 'Arial');
   
   // ❌ 避免加载不使用的字体
   parser.loadFont(font1Data, 'Font1');
   parser.loadFont(font2Data, 'Font2');
   parser.loadFont(font3Data, 'Font3'); // 如果不使用就不要加载
   ```

2. **及时卸载不用的字体**
   ```typescript
   // 使用完毕后卸载
   parser.unloadFont(fontId);
   ```

3. **重用已加载的字体**
   ```typescript
   // ✅ 好的做法：加载一次，多次使用
   const fontId = parser.loadFont(fontData, 'Arial');
   parser.setDefaultFont(fontId);
   
   // 解析多个文档
   for (const html of documents) {
     parser.parse(html, { viewportWidth: 800 });
   }
   
   // ❌ 避免：每次都重新加载
   for (const html of documents) {
     const fontId = parser.loadFont(fontData, 'Arial'); // 浪费内存
     parser.parse(html, { viewportWidth: 800 });
   }
   ```

## 字体管理器示例

```typescript
class FontManager {
  private parser: HtmlLayoutParser;
  private loadedFonts: Map<string, number> = new Map();

  constructor(parser: HtmlLayoutParser) {
    this.parser = parser;
  }

  async loadFont(fontData: Uint8Array, fontName: string): Promise<number> {
    // 检查是否已加载
    if (this.loadedFonts.has(fontName)) {
      return this.loadedFonts.get(fontName)!;
    }

    const fontId = this.parser.loadFont(fontData, fontName);
    
    if (fontId > 0) {
      this.loadedFonts.set(fontName, fontId);
      console.log(`已加载字体 '${fontName}' (ID: ${fontId})`);
    }

    return fontId;
  }

  getFontId(fontName: string): number | undefined {
    return this.loadedFonts.get(fontName);
  }

  isLoaded(fontName: string): boolean {
    return this.loadedFonts.has(fontName);
  }

  unloadFont(fontName: string): void {
    const fontId = this.loadedFonts.get(fontName);
    if (fontId) {
      this.parser.unloadFont(fontId);
      this.loadedFonts.delete(fontName);
      console.log(`已卸载字体 '${fontName}'`);
    }
  }

  clearAll(): void {
    this.parser.clearAllFonts();
    this.loadedFonts.clear();
  }
}

// 使用示例
const parser = new HtmlLayoutParser();
await parser.init();

const fontManager = new FontManager(parser);

// 加载字体
const arialData = await fetch('/fonts/arial.ttf').then(r => r.arrayBuffer());
await fontManager.loadFont(new Uint8Array(arialData), 'Arial');

// 检查是否已加载
if (fontManager.isLoaded('Arial')) {
  console.log('Arial 已加载');
}

// 清理
fontManager.clearAll();
parser.destroy();
```

## 最佳实践

1. **在应用启动时加载常用字体**
2. **使用字体管理器避免重复加载**
3. **监控内存使用，及时卸载不用的字体**
4. **为不同语言准备相应的字体**
5. **始终设置默认字体作为回退**
