# 字体加载说明

## 浏览器警告

当加载默认字体时，你可能会在浏览器控制台看到以下警告：

```
[Intervention] Slow network is detected. Fallback font will be used while loading: 
http://localhost:5173/fonts/aliBaBaFont65.ttf
```

## 这不是错误

这是浏览器的一个**性能优化提示**，不是错误：

- 字体文件大小为 8MB，加载需要一些时间
- 浏览器检测到"慢速网络"（实际上是