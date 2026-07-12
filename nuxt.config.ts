// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const rootDir = dirname(fileURLToPath(import.meta.url))

/** 企业地图等主后端（8096） */
const apiBase = process.env.NUXT_PUBLIC_API_BASE || 'http://119.96.30.33:8096'
/** 新闻中心 zy-news 后端（生产默认服务器地址） */
const newsApiBase = process.env.NUXT_PUBLIC_NEWS_API_BASE || 'http://119.96.30.33:8097'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-11',
  devtools: { enabled: false },
  devServer: {
    port: 6001,
  },
  modules: ['@nuxt/ui', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  icon: {
    localApiEndpoint: '/_nuxt_icon',
  },

  runtimeConfig: {
    public: {
      // 开发：/api → 企业后端；/news-api → zy-news。生产：环境变量绝对地址
      apiBase: import.meta.dev ? '/api' : apiBase,
      apiBaseFallback: apiBase,
      newsApiBase: import.meta.dev ? '/news-api' : newsApiBase,
      newsApiBaseFallback: newsApiBase,
      amapKey: process.env.NUXT_PUBLIC_AMAP_KEY || '',
      amapSecurityCode: process.env.NUXT_PUBLIC_AMAP_SECURITY_CODE || '',
    },
  },
  sourcemap: { server: false, client: false },
  vite: {
    logLevel: import.meta.dev ? 'info' : 'error',
    resolve: {
      alias: {
        'eventemitter3-original': 'eventemitter3',
        'eventemitter3': resolve(rootDir, 'lib/eventemitter3-shim.js'),
        'tslib': resolve(rootDir, 'node_modules/tslib/tslib.es6.mjs'),
      },
    },
    optimizeDeps: {
      include: ['simple-mind-map', 'eventemitter3-original'],
    },
    plugins: [
      {
        name: 'silence-tailwind-sourcemap',
        apply: 'build',
        configResolved(config) {
          const origWarn = config.logger.warn
          config.logger.warn = (msg: any, options?: any) => {
            if (typeof msg === 'string' && (msg.includes('@tailwindcss/vite') || msg.includes('nuxt:module-preload-polyfill'))) return
            origWarn(msg, options)
          }
          const origWarnOnce = config.logger.warnOnce
          config.logger.warnOnce = (msg: any, options?: any) => {
            if (typeof msg === 'string' && (msg.includes('@tailwindcss/vite') || msg.includes('nuxt:module-preload-polyfill'))) return
            origWarnOnce(msg, options)
          }
        },
      },
    ],
    build: {
      chunkSizeWarningLimit: 2048,
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'SOURCEMAP_ERROR') return
          if (warning.message?.includes('__PURE__')) return
          warn(warning)
        },
      },
    },
    ssr: {
      external: ['@antv/l7', '@antv/l7-maps', '@antv/l7-utils', 'simple-mind-map', 'echarts', 'vue-echarts'],
    },
  },
  app: {
    head: {
      htmlAttrs: {
        'data-theme': 'light',
      },
      title: '企业服务数据平台',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '企业服务数据平台 — 企业地图、产业图谱与数据管理' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }
      ]
    }
  },
  build: {
    transpile: ['echarts', 'vue-echarts', 'resize-detector', 'simple-mind-map', '@antv/l7', '@antv/l7-maps'],
  },
  fonts: {
    provider: 'local'
  },
  nitro: {
    externals: {
      traceExclude: [
        /^@antv\//,
        'simple-mind-map',
        'echarts',
        'vue-echarts',
      ],
    },
    devProxy: {
      '/api/': {
        target: apiBase,
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ''),
      },
      '/news-api/': {
        target: newsApiBase,
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/news-api/, ''),
      },
    },
    // 生产环境代理（routeRules 生产/开发都生效）
    routeRules: {
      '/api/**': {
        proxy: 'http://127.0.0.1:8096/**',
      },
      '/news-api/**': {
        proxy: 'http://127.0.0.1:9094/**',
      },
    },
    rollupConfig: {
      onwarn(warning: any, warn: any) {
        if (warning.code === 'SOURCEMAP_ERROR') return
        if (warning.message?.includes('__PURE__')) return
        // 忽略 Nitro/Nitropack 内部的循环依赖警告（框架级，非项目代码问题）
        if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.message?.includes('node_modules/nitropack')) return
        warn(warning)
      },
      external: ['tslib', '@antv/l7', '@antv/l7-maps', '@antv/l7-utils', '@antv/l7-core', '@antv/l7-component', '@antv/l7-source'],
    },
  }
})
