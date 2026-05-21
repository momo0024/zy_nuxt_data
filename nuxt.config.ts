// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-11',
  devtools: { enabled: false },
  modules: ['@nuxt/ui', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
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
      '/api/company': {
        target: 'http://119.96.30.33:8096/company',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/company/, '')
      }
    }
  }
})
