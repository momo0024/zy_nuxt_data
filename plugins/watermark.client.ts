import { renderWatermark, stopWatermarkGuard } from '~/utils/watermark'

export default defineNuxtPlugin({
  name: 'watermark',
  setup() {
    // 首屏水印由 app.html 内联脚本同步渲染；守护与路由/主题/登录态同步由 renderWatermark 统一处理
    renderWatermark()

    const authStore = useAuthStore()
    watch(
      () => authStore.user?.name,
      (name) => {
        renderWatermark(name || undefined)
      },
    )

    const router = useRouter()
    router.afterEach(() => {
      renderWatermark()
    })

    let themeObserver: MutationObserver | null = null
    if (typeof MutationObserver !== 'undefined') {
      themeObserver = new MutationObserver(() => {
        renderWatermark()
      })
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      })
    }

    return () => {
      themeObserver?.disconnect()
      stopWatermarkGuard()
    }
  },
})
