# Canvas 字体渲染说明

## 当前实现

目前 Canvas 渲染使用系统字体（Arial, sans-serif）作为后备字体，因为：

1. 自定义字体（如 aliBaBaFont65.ttf）已经加载到 WASM 模块中用于布局计算
2. 但 Canvas API 需要字体在浏览器中可用才能渲染
3. 为了简化实现，我们使用系统字体作为后备

## 字体差异

- **DOM 渲染**：使用浏览器原生渲染，字体可能不一致
- **Canvas 渲染**：使用 Arial 系统字体，与 WASM 计算的布局位置匹配

## 如果需要在 Canvas 中使用自定义字体

需要以下步骤：

### 1. 使用 CSS @font-face 加载字体

```css
@font-face {
  font-family: 'aliBaBaFont65';
  src: url('/fonts/aliBaBaFont65.ttf') format('truetype');
}
```

### 2. 等待字体加载完成

```typescript
await document.fonts.ready
```

### 3. 在 Canvas 中使用

```typescript
ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px aliBaBaFont65`
```

## 注意事项

- 字体文件需要放在 `public/fonts/` 目录
- 需要等待字体加载完成后再渲染 Canvas
- 字体文件可能较大，会影响加载速度
- 当前实现已经能够正确展示布局计算结果，只是字体外观可能略有差异
