import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'HTML Layout Parser',
  description: 'High-performance HTML/CSS layout parser compiled to WebAssembly for Canvas text rendering',
  base: process.env.NODE_ENV === 'production' ? '/html-layout-parser/' : '/',
  
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'API', link: '/api/' },
          { text: 'Examples', link: '/examples/' },
          { text: 'Acknowledgments', link: '/acknowledgments' },
          {
            text: 'v0.2.0',
            items: [
              { text: 'Changelog', link: '/changelog' },
              { text: 'GitHub', link: 'https://github.com/Tajigaqzh/html-layout-parser' }
            ]
          }
        ],
        sidebar: {
          '/guide/': [
            {
              text: 'Introduction',
              items: [
                { text: 'What is HTML Layout Parser?', link: '/guide/' },
                { text: 'Getting Started', link: '/guide/getting-started' },
                { text: 'Installation', link: '/guide/installation' },
                { text: 'vs Range API', link: '/guide/vs-range-api' },
                { text: 'vs Canvas measureText', link: '/guide/vs-measure-text' },
                { text: 'vs SVG foreignObject', link: '/guide/vs-svg-foreignobject' }
              ]
            },
            {
              text: 'Core Concepts',
              items: [
                { text: 'Font Management', link: '/guide/font-management' },
                { text: 'Output Modes', link: '/guide/output-modes' },
                { text: 'CSS Support', link: '/guide/css-support' },
                { text: 'CSS Separation', link: '/guide/css-separation' },
                { text: 'Canvas Rendering', link: '/guide/canvas-rendering' }
              ]
            },
            {
              text: 'Advanced',
              items: [
                { text: 'Chinese Typography', link: '/guide/chinese-typography' },
                { text: 'Memory Management', link: '/guide/memory-management' },
                { text: 'Performance', link: '/guide/performance' },
                { text: 'Debug Mode', link: '/guide/debug-mode' },
                { text: 'Error Handling', link: '/guide/error-handling' }
              ]
            }
          ],
          '/api/': [
            {
              text: 'API Reference',
              items: [
                { text: 'Overview', link: '/api/' },
                { text: 'HtmlLayoutParser', link: '/api/parser' },
                { text: 'Types & Interfaces', link: '/api/types' },
                { text: 'Error Codes', link: '/api/error-codes' }
              ]
            }
          ],
          '/examples/': [
            {
              text: 'Examples',
              items: [
                { text: 'Overview', link: '/examples/' },
                { text: 'Web Browser', link: '/examples/web' },
                { text: 'Web Worker', link: '/examples/worker' },
                { text: 'Node.js', link: '/examples/node' },
                { text: 'Batch Processing', link: '/examples/batch' },
                { text: 'Memory Management', link: '/examples/memory' }
              ]
            }
          ]
        }
      }
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        nav: [
          { text: '指南', link: '/zh/guide/getting-started' },
          { text: 'API', link: '/zh/api/' },
          { text: '示例', link: '/zh/examples/' },
          { text: '鸣谢', link: '/zh/acknowledgments' },
          {
            text: 'v0.2.0',
            items: [
              { text: '更新日志', link: '/zh/changelog' },
              { text: 'GitHub', link: 'https://github.com/Tajigaqzh/html-layout-parser' }
            ]
          }
        ],
        sidebar: {
          '/zh/guide/': [
            {
              text: '介绍',
              items: [
                { text: '什么是 HTML Layout Parser?', link: '/zh/guide/' },
                { text: '快速开始', link: '/zh/guide/getting-started' },
                { text: '安装', link: '/zh/guide/installation' },
                { text: '对比 Range API', link: '/zh/guide/vs-range-api' },
                { text: '对比 Canvas measureText', link: '/zh/guide/vs-measure-text' },
                { text: '对比 SVG foreignObject', link: '/zh/guide/vs-svg-foreignobject' }
              ]
            },
            {
              text: '核心概念',
              items: [
                { text: '字体管理', link: '/zh/guide/font-management' },
                { text: '输出模式', link: '/zh/guide/output-modes' },
                { text: 'CSS 支持', link: '/zh/guide/css-support' },
                { text: 'CSS 分离', link: '/zh/guide/css-separation' },
                { text: 'Canvas 渲染', link: '/zh/guide/canvas-rendering' }
              ]
            },
            {
              text: '进阶',
              items: [
                { text: '中文排版', link: '/zh/guide/chinese-typography' },
                { text: '内存管理', link: '/zh/guide/memory-management' },
                { text: '性能优化', link: '/zh/guide/performance' },
                { text: '调试模式', link: '/zh/guide/debug-mode' },
                { text: '错误处理', link: '/zh/guide/error-handling' }
              ]
            }
          ],
          '/zh/api/': [
            {
              text: 'API 参考',
              items: [
                { text: '概览', link: '/zh/api/' },
                { text: 'HtmlLayoutParser', link: '/zh/api/parser' },
                { text: '类型与接口', link: '/zh/api/types' },
                { text: '错误代码', link: '/zh/api/error-codes' }
              ]
            }
          ],
          '/zh/examples/': [
            {
              text: '示例',
              items: [
                { text: '概览', link: '/zh/examples/' },
                { text: 'Web 浏览器', link: '/zh/examples/web' },
                { text: 'Web Worker', link: '/zh/examples/worker' },
                { text: 'Node.js', link: '/zh/examples/node' },
                { text: '批量处理', link: '/zh/examples/batch' },
                { text: '内存管理', link: '/zh/examples/memory' }
              ]
            }
          ]
        },
        outline: {
          label: '页面导航'
        },
        docFooter: {
          prev: '上一页',
          next: '下一页'
        }
      }
    }
  },

  themeConfig: {
    logo: '/logo.svg',
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/nwyzx1011/html-layout-parser' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 nwyzx1011'
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3]
    }
  },

  // Ignore dead links for localhost URLs
  ignoreDeadLinks: [
    /^http:\/\/localhost/
  ]
})
