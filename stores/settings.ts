import { defineStore } from 'pinia'

export type ThemeId = 'dark' | 'light' | 'purple' | 'warm'

export interface ThemeMeta {
  id: ThemeId
  name: string
  desc: string
  colors: string[]
}

export interface AiConfig {
  enabled: boolean
  apiBase: string
  model: string
  apiKey: string
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'dark' as ThemeId,
    name: '藏青政务',
    desc: '深藏青底，冷金点缀，适合大屏与夜间值守',
    colors: ['#0a1428', '#1e4d8c', '#c6a464', '#0e1a34'],
  },
  {
    id: 'light' as ThemeId,
    name: '霁白实业',
    desc: '冷灰白界面，藏蓝主色，日常办公首选',
    colors: ['#f4f6fa', '#1e4d8c', '#b8935a', '#e8eef6'],
  },
  {
    id: 'purple' as ThemeId,
    name: '墨蓝银灰',
    desc: '墨蓝灰调，低饱和银蓝，沉稳耐看',
    colors: ['#0c1220', '#3d6a9e', '#8fa4c4', '#152238'],
  },
  {
    id: 'warm' as ThemeId,
    name: '素笺暖阅',
    desc: '暖灰纸色，适合长时间查阅文档',
    colors: ['#f6f4ef', '#8b5e34', '#a67c52', '#ede8df'],
  },
]

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<ThemeId>('light')
  const ai = ref<AiConfig>({
    enabled: false,
    apiBase: 'http://119.96.30.33:8087/v1',
    model: '/data/model/qwen3_6_27B_FP8/Qwen/Qwen3_6-27B-FP8',
    apiKey: '03ec81ae6ffc1bdb'
  })

  function loadFromStorage() {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('zhizhi_settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.theme) theme.value = parsed.theme
        if (parsed.ai) ai.value = { ...ai.value, ...parsed.ai }
      }
    } catch {
      // ignore
    }
    applyTheme(theme.value)
  }

  function applyTheme(t: ThemeId) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', t)
    }
  }

  function setTheme(t: ThemeId) {
    theme.value = t
    applyTheme(t)
    save()
  }

  function saveAiConfig(config: AiConfig) {
    ai.value = config
    save()
  }

  function save() {
    if (typeof window === 'undefined') return
    localStorage.setItem('zhizhi_settings', JSON.stringify({ theme: theme.value, ai: ai.value }))
  }

  return { theme, ai, loadFromStorage, setTheme, saveAiConfig }
})
