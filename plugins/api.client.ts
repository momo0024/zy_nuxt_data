import { newsRequest, request } from '~/utils/request'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  request.setBaseURL(config.public.apiBase as string)
  newsRequest.setBaseURL(config.public.newsApiBase as string)
})
