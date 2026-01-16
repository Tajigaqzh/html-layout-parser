# GitHub Actions 工作流说明

本目录包含项目的 GitHub Actions 自动化工作流配置。

## 📋 工作流列表

### 1. 文档部署 (deploy-docs.yml)

**触发条件：**
- 推送到 `main` 分支且修改了 `docs/**` 目录
- 手动触发

**功能：**
- 自动构建 VitePress 文档
- 部署到 GitHub Pages

**使用方法：**
1. 确保在 GitHub 仓库设置中启用了 GitHub Pages
2. 在 Settings > Pages 中，Source 选择 "GitHub Actions"
3. 推送文档更改到 main 分支即可自动部署

**访问地址：**
```
https://<username>.github.io/<repository>/
```

### 2. 持续集成 (ci.yml)

**触发条件：**
- 推送到 `main` 分支
- 创建 Pull Request 到 `main` 分支

**功能：**
- 运行测试套件
- 构建 TypeScript 包
- 验证代码质量

**包含的检查：**
- ✅ 单元测试
- ✅ 包构建验证

### 3. 发布版本 (release.yml)

**触发条件：**
- 推送版本标签 (如 `v0.2.0`)

**功能：**
- 构建所有包
- 创建 GitHub Release
- 上传 WASM 文件

**使用方法：**
```bash
# 1. 更新版本号
pnpm version:patch  # 或 version:minor, version:major

# 2. 提交更改
git add .
git commit -m "chore: release v0.2.1"

# 3. 创建并推送标签
git tag v0.2.1
git push origin main --tags
```

## 🔧 Issue 和 PR 模板

### Issue 模板

- **Bug Report** (`ISSUE_TEMPLATE/bug_report.yml`)
  - 用于报告 bug 和问题
  - 包含环境信息、复现步骤等

- **Feature Request** (`ISSUE_TEMPLATE/feature_request.yml`)
  - 用于提出新功能建议
  - 包含问题描述、解决方案等

### Pull Request 模板

- **PR Template** (`pull_request_template.md`)
  - 标准化 PR 描述格式
  - 包含变更类型、测试清单等

## 📝 配置说明

### GitHub Pages 设置

1. 进入仓库 Settings > Pages
2. Source 选择 "GitHub Actions"
3. 推送代码后自动部署

### Secrets 配置

如果需要发布到 NPM，需要配置以下 secrets：

1. 进入仓库 Settings > Secrets and variables > Actions
2. 添加 `NPM_TOKEN`：
   - 在 npmjs.com 生成 Access Token
   - 添加到 GitHub Secrets

## 🚀 快速开始

### 本地测试文档

```bash
cd docs
pnpm install
pnpm dev
```

### 本地运行测试

```bash
pnpm install
pnpm test
```

### 本地构建包

```bash
pnpm run build:packages
```

## 📊 工作流状态

在仓库主页可以看到工作流的运行状态：

- ✅ 绿色：所有检查通过
- ❌ 红色：有检查失败
- 🟡 黄色：正在运行中

## 🔍 调试工作流

如果工作流失败：

1. 点击失败的工作流查看详细日志
2. 检查具体失败的步骤
3. 在本地复现并修复问题
4. 重新推送代码

## 📚 相关文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [VitePress 部署指南](https://vitepress.dev/guide/deploy)
- [pnpm 工作空间](https://pnpm.io/workspaces)
