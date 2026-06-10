import { request } from '~/utils/request'

const BACKEND_BASE = process.env.NUXT_PUBLIC_API_BASE || 'http://119.96.30.33:8096'

/**
 * SSR 阶段 api.client.ts 不执行，需在此将 baseURL 设为绝对地址
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const base = config.public.apiBase as string
  request.setBaseURL(base.startsWith('http') ? base : BACKEND_BASE)
})
