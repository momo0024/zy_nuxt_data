import { Watermark } from 'watermark-js-plus'

function getThemeBasedColor(): string {
  const theme = document.documentElement.getAttribute('data-theme') || 'warm'
  const darkThemes = ['dark', 'purple']
  if (darkThemes.includes(theme)) {
    return 'rgba(255, 255, 255, 0.14)'
  }
  return 'rgba(0, 0, 0, 0.16)'
}

export default defineNuxtPlugin({
  name: 'watermark',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    const settingsStore = useSettingsStore()
    authStore.loadFromStorage()
    settingsStore.loadFromStorage()

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
        width: 300,
        height: 200,
        fontSize: '18px',
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
        fontColor: getThemeBasedColor(),
        fontWeight: '600',
        rotate: 45,
        globalAlpha: 1,
        zIndex: 2147483647,
        layout: 'default',
        // gridLayoutOptions: {
        //   rows: 4,
        //   cols: 4,
        //   gap: [80, 80],
        // },
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

    let themeObserver: MutationObserver | null = null
    if (typeof MutationObserver !== 'undefined') {
      themeObserver = new MutationObserver(() => {
        if (currentContent) {
          createWatermark(currentContent)
        }
      })
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      })
    }

    onBeforeUnmount(() => {
      clearInterval(checkInterval)
      themeObserver?.disconnect()
      if (watermark) {
        watermark.destroy()
      }
    })
  },
})