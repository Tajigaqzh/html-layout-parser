# CSS Support and Limitations

HTML Layout Parser is built on [litehtml](https://github.com/litehtml/litehtml), a lightweight HTML/CSS rendering engine. While litehtml supports many common CSS properties, it does **not** support all modern CSS features. This guide documents the CSS properties and features that are supported and those that are not.

::: warning Important
HTML Layout Parser is designed for **layout calculation and text measurement**, not full web rendering. Many modern CSS features (especially animations, transforms, and advanced selectors) are not supported.
:::

::: info Character-Level Property Extraction Limitations
While litehtml supports many CSS properties listed below for layout calculation, **HTML Layout Parser currently extracts only a subset of properties into the `CharLayout` objects** (primarily character position, dimensions, font properties, colors, and text decoration).

Other properties supported by litehtml but not yet extracted by HTML Layout Parser (such as opacity, spacing, transforms, borders, margins, padding, etc.) will be **gradually added in future versions**.

For a complete list of CSS support, please refer to the [litehtml documentation](https://github.com/litehtml/litehtml).
:::

## Supported CSS Properties

### Layout Properties

litehtml supports the following layout-related properties:

- **Display**: `display` (block, inline, inline-block, flex, inline-flex, table, list-item, none, etc.)
- **Position**: `position` (static, relative, absolute, fixed)
- **Float & Clear**: `float` (left, right, none), `clear` (left, right, both, none)
- **Box Model**:
  - `width`, `height`, `min-width`, `min-height`, `max-width`, `max-height`
  - `margin`, `margin-top`, `margin-right`, `margin-bottom`, `margin-left`
  - `padding`, `padding-top`, `padding-right`, `padding-bottom`, `padding-left`
  - `box-sizing` (content-box, border-box)
- **Positioning**: `top`, `right`, `bottom`, `left`, `z-index`
- **Overflow**: `overflow` (visible, hidden, scroll, auto)

### Flexbox Properties

litehtml has **basic flexbox support**:

- **Container**: `flex-direction`, `flex-wrap`, `justify-content`, `align-items`, `align-content`
- **Items**: `flex-grow`, `flex-shrink`, `flex-basis`, `align-self`, `order`

::: tip
Flexbox support is functional but may not handle all edge cases. Test your layouts thoroughly.
:::

### Text Properties

- **Font**: `font-family`, `font-size`, `font-weight`, `font-style`, `font-variant`
- **Text Styling**: 
  - `color`
  - `text-align` (left, right, center, justify)
  - `text-decoration`, `text-decoration-line`, `text-decoration-style`, `text-decoration-color`, `text-decoration-thickness`
  - `text-emphasis`, `text-emphasis-style`, `text-emphasis-color`, `text-emphasis-position`
  - `text-transform` (uppercase, lowercase, capitalize, none)
  - `text-indent`
  - `line-height`
  - `vertical-align`
  - `white-space` (normal, nowrap, pre, pre-line, pre-wrap)

### Border Properties

- **Border Width**: `border-width`, `border-top-width`, `border-right-width`, `border-bottom-width`, `border-left-width`
- **Border Style**: `border-style`, `border-top-style`, `border-right-style`, `border-bottom-style`, `border-left-style`
- **Border Color**: `border-color`, `border-top-color`, `border-right-color`, `border-bottom-color`, `border-left-color`
- **Border Radius**: `border-radius`, `border-top-left-radius`, `border-top-right-radius`, `border-bottom-right-radius`, `border-bottom-left-radius`
- **Border Collapse**: `border-collapse`, `border-spacing`

### Background Properties

- `background-color`
- `background-image`
- `background-repeat`
- `background-position`, `background-position-x`, `background-position-y`
- `background-size`
- `background-attachment`
- `background-origin`, `background-clip`
- **Gradients**: `linear-gradient`, `radial-gradient`, `conic-gradient` (and repeating variants)

### List Properties

- `list-style-type`
- `list-style-position`
- `list-style-image`

### Table Properties

- `border-collapse`
- `border-spacing`
- `caption-side`

### Other Properties

- `visibility` (visible, hidden, collapse)
- `cursor`
- `content` (for `::before` and `::after` pseudo-elements)
- `appearance`

## Unsupported CSS Features

The following modern CSS features are **NOT supported** by litehtml:

### ❌ CSS Grid

```css
/* NOT SUPPORTED */
.container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: 20px;
}
```

**Alternative**: Use flexbox or table layouts instead.

### ❌ CSS Transforms

```css
/* NOT SUPPORTED */
.element {
  transform: rotate(45deg);
  transform: scale(1.5);
  transform: translate(10px, 20px);
}
```

### ❌ CSS Animations & Transitions

```css
/* NOT SUPPORTED */
@keyframes slide {
  from { left: 0; }
  to { left: 100px; }
}

.element {
  animation: slide 2s;
  transition: all 0.3s ease;
}
```

### ❌ CSS Variables (Custom Properties)

```css
/* NOT SUPPORTED */
:root {
  --primary-color: #3498db;
}

.element {
  color: var(--primary-color);
}
```

### ❌ Modern Selectors

```css
/* NOT SUPPORTED */
.parent:has(.child) { }
.element:is(.class1, .class2) { }
.element:where(.class1, .class2) { }
```

**Supported selectors**: Basic selectors (class, id, element, descendant, child, adjacent sibling), pseudo-classes (`:hover`, `:active`, `:first-child`, `:last-child`, `:nth-child()`, `:not()`), and pseudo-elements (`::before`, `::after`).

### ❌ Modern Color Functions

```css
/* NOT SUPPORTED */
.element {
  color: oklch(60% 0.15 180);
  background: color-mix(in srgb, red 50%, blue);
}
```

**Supported**: Named colors, hex colors (`#fff`), `rgb()`, `rgba()`, `hsl()`, `hsla()`.

### ❌ Container Queries

```css
/* NOT SUPPORTED */
@container (min-width: 400px) {
  .element { font-size: 2rem; }
}
```

### ❌ Scroll-Driven Animations

```css
/* NOT SUPPORTED */
@scroll-timeline {
  source: selector(#scroller);
}
```

### ❌ CSS Filters

```css
/* NOT SUPPORTED */
.element {
  filter: blur(5px);
  backdrop-filter: blur(10px);
}
```

### ❌ CSS Clip-path & Masks

```css
/* NOT SUPPORTED */
.element {
  clip-path: circle(50%);
  mask-image: url(mask.png);
}
```

### ❌ Multi-column Layout

```css
/* NOT SUPPORTED */
.element {
  column-count: 3;
  column-gap: 20px;
}
```

### ❌ CSS Shapes

```css
/* NOT SUPPORTED */
.element {
  shape-outside: circle(50%);
}
```

### ❌ Writing Modes (Limited Support)

```css
/* LIMITED OR NOT SUPPORTED */
.element {
  writing-mode: vertical-rl;
  text-orientation: upright;
}
```

### ❌ Advanced Flexbox Features

While basic flexbox is supported, some advanced features may not work:

```css
/* MAY NOT WORK AS EXPECTED */
.element {
  flex: 1 1 auto; /* May have issues with complex flex shorthand */
  gap: 20px; /* gap property may not be supported */
}
```

### ❌ Subgrid

```css
/* NOT SUPPORTED */
.element {
  display: grid;
  grid-template-columns: subgrid;
}
```

### ❌ Aspect Ratio

```css
/* NOT SUPPORTED */
.element {
  aspect-ratio: 16 / 9;
}
```

### ❌ Object-fit & Object-position

```css
/* NOT SUPPORTED */
img {
  object-fit: cover;
  object-position: center;
}
```

## Best Practices

### 1. Keep CSS Simple

Use basic, well-supported CSS properties. Avoid cutting-edge features.

```css
/* ✅ GOOD - Simple, supported properties */
.container {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: #f0f0f0;
}

/* ❌ BAD - Modern, unsupported features */
.container {
  display: grid;
  gap: 20px;
  background: color-mix(in srgb, red, blue);
}
```

### 2. Test Your Layouts

Always test your HTML/CSS with HTML Layout Parser to ensure it renders correctly:

```typescript
import { HtmlLayoutParser } from 'html-layout-parser';

const parser = new HtmlLayoutParser();
await parser.initFont('/fonts/arial.ttf');

const html = `
  <div style="display: flex; padding: 20px;">
    <div style="flex: 1;">Column 1</div>
    <div style="flex: 1;">Column 2</div>
  </div>
`;

const result = await parser.parseHtml(html);
console.log(result.charLayouts); // Verify layout is correct
```

### 3. Use Fallbacks

If you need advanced features, consider preprocessing your HTML/CSS or using fallback styles:

```css
/* Provide fallback for unsupported features */
.element {
  /* Fallback for browsers without grid support */
  display: flex;
  flex-wrap: wrap;
  
  /* Grid layout (not supported by litehtml) */
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
```

### 4. Avoid Complex Selectors

Stick to simple, well-supported selectors:

```css
/* ✅ GOOD */
.container .item { }
.container > .item { }
.item:first-child { }
.item:nth-child(2) { }

/* ❌ AVOID */
.container:has(.item) { }
.item:is(.active, .selected) { }
```

## Media Queries

litehtml supports **basic media queries**:

```css
@media screen and (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}

@media print {
  .no-print {
    display: none;
  }
}
```

**Supported media features**:
- `width`, `height`, `min-width`, `max-width`, `min-height`, `max-height`
- `device-width`, `device-height`
- `orientation` (portrait, landscape)
- `aspect-ratio`, `device-aspect-ratio`
- `color`, `color-index`, `monochrome`
- `resolution`

## Pseudo-elements & Pseudo-classes

### Supported Pseudo-elements

- `::before`
- `::after`

### Supported Pseudo-classes

- `:hover`
- `:active`
- `:first-child`
- `:last-child`
- `:nth-child()`
- `:nth-of-type()`
- `:first-of-type`
- `:last-of-type`
- `:only-child`
- `:only-of-type`
- `:not()`
- `:lang()`
- `:root`

### Unsupported Pseudo-classes

- `:has()`
- `:is()`
- `:where()`
- `:focus-visible`
- `:focus-within`
- `:target`
- `:checked`
- `:disabled`
- `:enabled`

## Summary

HTML Layout Parser (via litehtml) provides solid support for **core CSS layout and styling properties**, including:

✅ Box model, positioning, floats  
✅ Basic flexbox  
✅ Text styling and fonts  
✅ Borders and backgrounds  
✅ Tables and lists  
✅ Basic media queries  

However, it does **not support** many modern CSS features:

❌ CSS Grid  
❌ Transforms, animations, transitions  
❌ CSS variables  
❌ Advanced selectors (`:has()`, `:is()`, `:where()`)  
❌ Modern color functions  
❌ Container queries  
❌ Filters, clip-path, masks  

For the best results, **keep your CSS simple and test thoroughly** with HTML Layout Parser.

## Related Resources

- [litehtml GitHub Repository](https://github.com/litehtml/litehtml)
- [litehtml Documentation](http://www.litehtml.com/)
- [Getting Started Guide](./getting-started.md)
- [Performance Optimization](./performance.md)
