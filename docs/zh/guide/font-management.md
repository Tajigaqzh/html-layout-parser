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

::: warning 不支持的格式
- WOFF/WOFF2 (Web Open Font Format)
- EOT (Embedded OpenType)
- SVG 字体

目前如需使用 WOFF 字体，请先转换为 TTF 或 OTF 格式。**后续版本计划支持 WOFF/WOFF2 格式**。
:::

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

#### 类浏览器的回退行为

解析器实现了与浏览器**完全相同的 CSS font-family 回退机制**：

```typescript
const html = `
  <div style="font-family: 'Custom Font', Arial, sans-serif;">
    文本内容
  </div>
`;

// 回退顺序（逐字符）：
// 1. 尝试 'Custom Font'（font-family 中的第一个）
// 2. 尝试 'Arial'（font-family 中的第二个）
// 3. 尝试默认字体（通过 setDefaultFont 设置）
// 4. 使用智能回退（基于字符类型）
const layouts = parser.parse(html, { viewportWidth: 800 });
```

**核心特性：**
- ✅ **逐字符回退**：每个字符可以使用回退链中的不同字体
- ✅ **有序搜索**：严格按照 `font-family` 中指定的顺序尝试字体
- ✅ **精确宽度**：使用回退字体中字符的实际宽度
- ✅ **性能优化**：结果会被缓存，避免重复查找

### 系统字体回退限制

::: warning 为什么无法与浏览器行为完全一致
**WASM 沙箱限制**：WebAssembly 运行在沙箱环境中，出于安全原因**无法直接访问系统字体**。这是 WASM 平台的基本限制，而非设计选择。

**与浏览器的关键差异：**
- ❌ **无法访问**系统字体（用户操作系统上安装的 Arial、Times New Roman 等）
- ❌ **无法查询**可用的系统字体
- ❌ **无法自动加载**操作系统中的字体

**我们的解决方案**：解析器使用**用户指定的默认字体**代替系统字体进行最终回退。您必须显式加载并设置此字体。
:::

**与浏览器行为对比：**

| 方面 | 浏览器 | 我们的实现 |
|------|--------|-----------|
| 回退顺序 | font-family 列表顺序 | ✅ 相同 |
| 逐字符回退 | 是，逐字符 | ✅ 相同 |
| 实际宽度 | 使用回退字体宽度 | ✅ 相同 |
| 系统字体 | 回退到系统字体 | ⚠️ 使用默认字体* |
| 字体访问 | 直接访问操作系统 | ⚠️ 用户必须加载字体 |

**\*解决方案**：加载一个全面的回退字体（如 Noto Sans）并设置为默认字体，以替代系统字体功能。

### 最佳实践：使用全面的回退字体

要实现类似浏览器的行为，请加载字符覆盖范围广的字体：

```typescript
const parser = new HtmlLayoutParser();
await parser.init();

// 按优先级顺序加载字体
const arialId = parser.loadFont(arialData, 'Arial');
const helveticaId = parser.loadFont(helveticaData, 'Helvetica');

// 加载全面的回退字体（充当系统字体）
const notoSansId = parser.loadFont(notoSansData, 'Noto Sans');

// 设置为默认字体（替代系统字体回退）
parser.setDefaultFont(notoSansId);

// 在 CSS 中使用完整的回退链
const html = `
  <div style="font-family: 'Arial', 'Helvetica', 'Noto Sans', sans-serif;">
    多语言文本：Hello 你好 こんにちは
  </div>
`;

const layouts = parser.parse(html, { viewportWidth: 800 });
```

### 推荐的回退字体

为获得最佳的跨语言支持：

| 字体 | 覆盖范围 | 使用场景 |
|------|---------|---------|
| **Noto Sans** | 拉丁、希腊、西里尔 | 西方语言 |
| **Noto Sans CJK** | 中文、日文、韩文 | 东亚语言 |
| **Noto Sans Arabic** | 阿拉伯文 | 中东语言 |
| **Roboto** | 拉丁、希腊、西里尔 | 现代 UI 设计 |
| **Arial Unicode MS** | 广泛覆盖 | 通用（如果可用）|

**示例：多语言支持**

```typescript
// 加载全面的字体集
const notoSansId = parser.loadFont(notoSansData, 'Noto Sans');
const notoSansCJKId = parser.loadFont(notoSansCJKData, 'Noto Sans CJK');
const notoSansArabicId = parser.loadFont(notoSansArabicData, 'Noto Sans Arabic');

// 设置 CJK 为默认（覆盖范围最广）
parser.setDefaultFont(notoSansCJKId);

// 在 CSS 中使用
const html = `
  <div style="font-family: 'Noto Sans', 'Noto Sans CJK', 'Noto Sans Arabic', sans-serif;">
    English 中文 日本語 한국어 العربية
  </div>
`;
```

### 智能回退（最后手段）

当所有已加载字体中都找不到字符时，解析器使用智能回退：

| 字符类型 | 回退策略 | 示例 |
|---------|---------|------|
| **CJK 字符** (U+4E00-U+9FFF) | 使用 '中' (U+4E2D) 的宽度 | 你好 → 使用 '中' 的宽度 |
| **CJK 标点** (U+3000-U+303F) | 使用半宽 (fontSize / 2) | 、。→ fontSize/2 |
| **拉丁标点** | 使用半宽 (fontSize / 2) | ,.;: → fontSize/2 |
| **其他字符** | 尝试 '0' 或空格 | abc → 使用 '0' 的宽度 |

**调试输出示例：**

```typescript
const layouts = parser.parse(html, {
  viewportWidth: 800,
  isDebug: true
});

// 控制台输出：
// [WASM] Character U+8005 (者) not found in font ID 2
// [HtmlLayoutParser] Found character U+8005 in font-family font: aliBaBaFont65 (ID 1)
// [HtmlLayoutParser] Char U+8005 metrics: horiAdvance=20, finalWidth=20, usedFont=1
```

### 为什么采用这种方式？

| 方面 | 系统字体（浏览器）| 默认字体（我们的方式）|
|------|-----------------|---------------------|
| 访问方式 | 直接访问操作系统 | 仅用户加载的字体 |
| 一致性 | 因操作系统而异 | ✅ 跨平台一致 |
| 控制力 | 有限 | ✅ 完全控制 |
| 性能 | 快速（已缓存）| ✅ 快速（预加载）|
| 字符覆盖 | 取决于操作系统 | ✅ 有保证（如果你加载了）|

**优势：**
- ✅ **一致渲染** - 在所有平台（Windows、macOS、Linux）上保持一致
- ✅ **可预测输出** - 不会因操作系统字体差异而产生意外
- ✅ **完全控制** - 你可以精确选择使用哪些字体
- ✅ **更好的测试** - 开发和生产环境使用相同的字体

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

每个字体占用的内存约等于字体文件本身的大小。

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
