# HTML Layout Parser v2.0 - Playground

An interactive web-based playground for testing and exploring the HTML Layout Parser v2.0.

## Features

- **Real-time HTML/CSS editing** - Edit HTML and CSS in separate tabs
- **Multiple output modes** - Switch between flat, byRow, simple, and full modes
- **Canvas rendering** - Visual preview of parsed layout
- **JSON output** - View raw JSON output for debugging
- **Font loading** - Load custom TTF/OTF/WOFF fonts
- **Export** - Download parsed results as JSON
- **Performance metrics** - View parse time, character count, and memory usage

## Quick Start

### Option 1: Using the built-in server

```bash
# From the playground directory
cd html-layout-parser/playground
node serve.js

# Or specify a custom port
node serve.js 8080
```

Then open http://localhost:3000 in your browser.

### Option 2: Using any static file server

```bash
# Using Python
cd html-layout-parser
python -m http.server 3000

# Using Node.js http-server
npx http-server html-layout-parser -p 3000

# Using PHP
cd html-layout-parser
php -S localhost:3000
```

Then open http://localhost:3000/playground/ in your browser.

## Usage

1. **Load a font** (optional but recommended)
   - Click "Load Font" button
   - Select a TTF, OTF, or WOFF font file
   - The font will be used for text rendering

2. **Enter HTML**
   - Type or paste HTML in the HTML tab
   - The playground includes default sample HTML

3. **Enter CSS** (optional)
   - Switch to the CSS tab
   - Add CSS styles that will be applied to the HTML

4. **Configure options**
   - Set viewport width (default: 800px)
   - Choose output mode:
     - `flat` - Array of characters
     - `byRow` - Characters grouped by row
     - `simple` - Lines with characters
     - `full` - Complete document structure

5. **Parse**
   - Click "Parse" button or press Ctrl+Enter
   - View results in Canvas or JSON tab

6. **Export**
   - Click "Export JSON" to download the parsed result

## Keyboard Shortcuts

- `Ctrl+Enter` / `Cmd+Enter` - Parse HTML

## Output Modes

### Flat Mode
Returns a flat array of character layouts:
```json
[
  { "character": "H", "x": 0, "y": 0, "width": 12, ... },
  { "character": "e", "x": 12, "y": 0, "width": 8, ... },
  ...
]
```

### By Row Mode
Returns characters grouped by row:
```json
[
  { "rowIndex": 0, "y": 0, "children": [...] },
  { "rowIndex": 1, "y": 24, "children": [...] },
  ...
]
```

### Simple Mode
Returns lines with characters:
```json
{
  "version": "2.0",
  "viewport": { "width": 800, "height": 600 },
  "lines": [
    { "lineIndex": 0, "y": 0, "characters": [...] },
    ...
  ]
}
```

### Full Mode
Returns complete document structure:
```json
{
  "version": "2.0",
  "parserVersion": "2.0.0",
  "viewport": { "width": 800, "height": 600 },
  "pages": [
    {
      "pageIndex": 0,
      "blocks": [
        {
          "blockIndex": 0,
          "type": "div",
          "lines": [
            {
              "lineIndex": 0,
              "runs": [
                { "characters": [...] }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- WASM module built (`html_layout_parser.wasm` and `html_layout_parser.js`)

## Troubleshooting

### "Could not load WASM module"
Make sure the WASM module is built:
```bash
cd html-layout-parser
./build.sh
```

### Font not rendering correctly
- Ensure you've loaded a font file
- Check that the font supports the characters in your HTML
- Try a different font file

### Canvas is blank
- Check the browser console for errors
- Ensure the HTML is valid
- Try with simpler HTML first

## Development

The playground is a single HTML file with embedded CSS and JavaScript. To modify:

1. Edit `index.html`
2. Refresh the browser to see changes

No build step is required.
