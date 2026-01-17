# 日志系统使用说明

## 功能概述

这个日志系统可以捕获浏览器控制台的所有日志（log, info, warn, error, debug），并提供保存到服务器或下载到本地的功能。

## 组成部分

### 1. Logger 类 (`src/utils/logger.ts`)
- 拦截所有 console 方法
- 存储最近 1000 条日志
- 序列化日志数据（处理对象、函数、循环引用等）
- 提供保存和下载功能

### 2. Vite 插件 (`vite-plugins/log-saver.ts`)
- 提供 `/api/save-logs` API 端点
- 接收日志数据并保存到 `playground/logs/` 目录
- 自动创建带时间戳的日志文件

### 3. LogSaver 组件 (`src/components/LogSaver.vue`)
- 固定在页面右下角的浮动按钮
- 显示当前日志数量
- 提供三个操作按钮：
  - 💾 保存日志到服务器
  - 📥 下载日志
  - 🗑️ 清空日志

## 使用方法

### 方式 1: 使用可视化按钮（推荐）

页面右下角有一个浮动的日志控制面板：

1. **保存到服务器**: 点击 "💾 保存日志到服务器" 按钮
   - 日志会保存到 `playground/logs/console-YYYY-MM-DDTHH-MM-SS-sssZ.log`
   - 成功后会显示文件名

2. **下载到本地**: 点击 "📥 下载日志" 按钮
   - 浏览器会下载一个 `console-logs-{timestamp}.txt` 文件

3. **清空日志**: 点击 "🗑️ 清空日志" 按钮
   - 清空内存中的所有日志记录

### 方式 2: 使用控制台命令

在浏览器控制台中可以直接调用：

```javascript
// 保存日志到服务器
saveLogs()

// 下载日志到本地
downloadLogs()

// 清空日志
clearLogs()
```

## 日志格式

保存的日志文件格式如下：

```
================================================================================
Browser Console Logs - 2026-01-17T01:16:48.123Z
================================================================================

[01:16:48.123] LOG   Logger initialized
[01:16:48.456] INFO  WASM module initialized successfully
[01:16:49.789] WARN  Font loading warning: timeout
[01:16:50.012] ERROR Failed to load font
  Stack: Error: Failed to load font
    at loadFont (useParser.ts:123:15)
    ...
```

## 日志存储位置

- **服务器端**: `playground/logs/*.log`
- **本地下载**: 浏览器默认下载目录

## 注意事项

1. **日志数量限制**: 内存中最多保存 1000 条日志，超过会自动删除最早的日志
2. **性能影响**: 日志拦截对性能影响很小，但大量日志可能占用内存
3. **敏感信息**: 注意不要在日志中输出敏感信息（密码、token 等）
4. **文件大小**: 如果日志很多，保存的文件可能会很大

## 调试多字体问题

当遇到多字体渲染问题时：

1. 打开多字体演示页面 (`/multi-font`)
2. 点击 "Load All Fonts" 加载字体
3. 点击 "Parse & Render" 解析和渲染
4. 观察控制台输出
5. 点击右下角 "💾 保存日志到服务器"
6. 在 `playground/logs/` 目录查看保存的日志文件
7. 将日志文件内容发送给开发者分析

## 示例日志内容

```
[01:16:48.123] LOG   Loaded aliBaBaFont65 with ID 5
[01:16:48.234] LOG   Loaded MaoKenShiJinHei with ID 6
[01:16:48.345] LOG   Browser fonts ready
[01:16:48.456] LOG   Browser font aliBaBaFont65: loaded
[01:16:48.567] LOG   Browser font MaoKenShiJinHei: loaded
[01:16:48.678] LOG   Starting canvas render with 92 characters
[01:16:48.789] LOG   First 5 layouts: [
  {
    "character": "琵",
    "x": 348,
    "y": 52,
    "width": 35,
    "height": 50,
    "fontFamily": "aliBaBaFont65",
    "fontSize": 36
  },
  ...
]
```

## 开发者工具

如果需要查看 Logger 实例：

```javascript
// 在控制台中
import logger from './src/utils/logger'

// 获取所有日志
logger.getLogs()

// 获取日志数量
logger.getLogs().length
```
