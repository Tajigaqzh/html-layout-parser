#!/bin/bash

# Script to update import statements in documentation files
# 更新文档文件中导入语句的脚本

echo "Updating documentation import statements..."

# Function to update imports in a file
update_imports() {
    local file="$1"
    local env="$2"
    
    echo "Updating $file for $env environment..."
    
    # Update basic imports
    sed -i.bak "s|import { HtmlLayoutParser } from 'html-layout-parser';|import { HtmlLayoutParser } from 'html-layout-parser/$env';|g" "$file"
    sed -i.bak "s|import { HtmlLayoutParser, CharLayout } from 'html-layout-parser';|import { HtmlLayoutParser, CharLayout } from 'html-layout-parser/$env';|g" "$file"
    sed -i.bak "s|import { HtmlLayoutParser, FontInfo } from 'html-layout-parser';|import { HtmlLayoutParser, FontInfo } from 'html-layout-parser/$env';|g" "$file"
    sed -i.bak "s|import { HtmlLayoutParser, MemoryMetrics } from 'html-layout-parser';|import { HtmlLayoutParser, MemoryMetrics } from 'html-layout-parser/$env';|g" "$file"
    
    # Update complex imports
    sed -i.bak "s|import { \([^}]*\) } from 'html-layout-parser';|import { \1 } from 'html-layout-parser/$env';|g" "$file"
    
    # Remove backup files
    rm -f "$file.bak"
}

# Update English documentation
echo "Updating English documentation..."

# Web examples
update_imports "docs/examples/web.md" "web"
update_imports "docs/examples/node.md" "node" 
update_imports "docs/examples/worker.md" "worker"
update_imports "docs/examples/batch.md" "web"
update_imports "docs/examples/memory.md" "web"

# Update Chinese documentation
echo "Updating Chinese documentation..."

# Already updated some, but let's ensure consistency
update_imports "docs/zh/examples/batch.md" "web"
update_imports "docs/zh/examples/memory.md" "web"

# Update installation and getting started guides
echo "Updating installation guides..."

# Add Vite configuration notes to installation guides
add_vite_config() {
    local file="$1"
    local lang="$2"
    
    if [ "$lang" = "zh" ]; then
        local vite_note="
### Vite 用户重要配置

如果您使用 **Vite**，请在 \`vite.config.ts\` 中添加以下配置：

\`\`\`typescript
export default defineConfig({
  optimizeDeps: {
    exclude: ['html-layout-parser']
  }
})
\`\`\`

**为什么？** Vite 的依赖预打包会破坏 WASM 模块。此配置可防止这种情况。
"
    else
        local vite_note="
### Important: Vite Users Configuration

If you're using **Vite**, add this to your \`vite.config.ts\`:

\`\`\`typescript
export default defineConfig({
  optimizeDeps: {
    exclude: ['html-layout-parser']
  }
})
\`\`\`

**Why?** Vite's dependency pre-bundling breaks WASM modules. This configuration prevents that.
"
    fi
    
    # Insert after "## Package Installation" or "## 包安装"
    if [ "$lang" = "zh" ]; then
        sed -i.bak "/## 包安装/a\\$vite_note" "$file"
    else
        sed -i.bak "/## Package Installation/a\\$vite_note" "$file"
    fi
    
    rm -f "$file.bak"
}

# Add Vite configuration notes
if [ -f "docs/guide/installation.md" ]; then
    add_vite_config "docs/guide/installation.md" "en"
fi

if [ -f "docs/zh/guide/installation.md" ]; then
    add_vite_config "docs/zh/guide/installation.md" "zh"
fi

echo "Documentation import statements updated successfully!"
echo "Please review the changes and commit them."