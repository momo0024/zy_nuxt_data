import { Watermark } from 'watermark-js-plus'

export default defineNuxtPlugin({
  name: 'watermark',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    authStore.loadFromStorage()

    let watermark: Watermark | null = null
    let currentContent = ''

    function createWatermark(content: string) {
      if (watermark) {
        watermark.destroy()
      }
      currentContent = content
      watermark = new Watermark({
        content,
        contentType: 'text',
        width: 200,
        height: 140,
        fontSize: '16px',
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontColor: 'rgba(0, 0, 0, 0.24)',
        fontWeight: '500',
        rotate: 45,
        globalAlpha: 1,
        zIndex: 2147483647,
        layout: 'grid',
        gridLayoutOptions: {
          rows: 5,
          cols: 5,
          gap: [60, 60],
        },
      })
      watermark.create()
    }

    const name = authStore.user?.name
    if (name) {
      createWatermark(name)
    } else {
      createWatermark('智知云')
    }

    watch(
      () => authStore.user?.name,
      (name) => {
        if (name) {
          createWatermark(name)
        } else {
          createWatermark('智知云')
        }
      }
    )

    router.afterEach(() => {
      nextTick(() => {
        const el = document.querySelector('div[style*="z-index: 2147483647"]')
        if (!el && currentContent) {
          createWatermark(currentContent)
        }
      })
    })

    const checkInterval = setInterval(() => {
      const el = document.querySelector('div[style*="z-index: 2147483647"]')
      if (!el && currentContent) {
        createWatermark(currentContent)
      }
    }, 1000)

    onBeforeUnmount(() => {
      clearInterval(checkInterval)
      if (watermark) {
        watermark.destroy()
      }
    })
  },
})