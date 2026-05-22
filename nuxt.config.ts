// https://nuxt.com/docs/api/configuration/nuxt-config
import {defineNuxtConfig} from "nuxt/config";

export default defineNuxtConfig({
  compatibilityDate: '2025-05-11',
  devtools: { enabled: false },
  modules: ['@nuxt/ui', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      // 后端接口地址，开发环境通过 nitro devProxy 代理，生产环境直连
      apiBase: import.meta.dev ? '/api' : (process.env.NUXT_PUBLIC_API_BASE || 'http://119.96.30.33:8096'),
      amapKey: process.env.NUXT_PUBLIC_AMAP_KEY || '',
      amapSecurityCode: process.env.NUXT_PUBLIC_AMAP_SECURITY_CODE || '',
    },
  },
  sourcemap: { server: false, client: false },
  vite: {
    ssr: {
      external: ['@amap/amap-jsapi-loader'],
    },
    logLevel: import.meta.dev ? 'info' : 'error',
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
  },
  app: {
    head: {
      htmlAttrs: {
        'data-theme': 'warm',
      },
      title: '智知云 · 企业知识中台',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '智知云企业知识中台系统' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }
      ]
    }
  },
  build: {
    transpile: ['echarts', 'vue-echarts', 'resize-detector']
  },
  fonts: {
    provider: 'local'
  },
  nitro: {
    devProxy: {
      '/api/': {
        // 开发代理：将 /api/* 转发到后端，target 填后端实际地址
        target: 'http://119.96.30.33:8096',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, '')
      }
    },
    rollupConfig: {
      onwarn(warning: any, warn: any) {
        if (warning.code === 'SOURCEMAP_ERROR') return
        if (warning.message?.includes('__PURE__')) return
        // 忽略 Nitro/Nitropack 内部的循环依赖警告（框架级，非项目代码问题）
        if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.message?.includes('node_modules/nitropack')) return
        warn(warning)
      },
    },
  }
})
