import { newsRequest, request } from '~/utils/request'

function resolveServerBaseURL(configured: string, fallback: string) {
  return configured.startsWith('http') ? configured : fallback
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  request.setBaseURL(resolveServerBaseURL(
    config.public.apiBase as string,
    config.public.apiBaseFallback as string,
  ))
  newsRequest.setBaseURL(resolveServerBaseURL(
    config.public.newsApiBase as string,
    config.public.newsApiBaseFallback as string,
  ))
})
