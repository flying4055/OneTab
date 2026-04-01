import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: [
          '@emotion/babel-plugin',
        ],
      },
    }),
    {
      name: 'copy-manifest',
      closeBundle() {
        copyFileSync('public/manifest.json', 'dist/manifest.json');
      }
    }
  ],
  server: {
    port: 8123,
    open: true
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    target: 'es2020',
    cssMinify: true,
    // 代码分割优化
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        format: 'es',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js'
      }
    },
    modulePreload: { polyfill: false },
    // CSS 代码分割
    cssCodeSplit: true,
    // 资源大小限制
    assetsInlineLimit: 4096,
    // 生成 source map（生产环境可关闭）
    sourcemap: false,
    // 块大小警告限制
    chunkSizeWarningLimit: 500
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom/client',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/icons-material'
    ],
    exclude: ['zustand']
  },
  // 开发服务器优化
  esbuild: {
    target: 'es2020',
    minify: true,
    // 移除 console.log（生产环境）
    drop: process.env.NODE_ENV === 'production' ? ['console'] : []
  }
});