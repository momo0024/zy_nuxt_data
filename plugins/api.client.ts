import { request } from '~/utils/request'

/**
 * 在客户端初始化时，从 runtimeConfig 读取后端地址并配置到 request 实例
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  request.setBaseURL(config.public.apiBase as string)
})