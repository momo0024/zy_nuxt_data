import { defineStore } from 'pinia'

export type ThemeId = 'dark' | 'light' | 'green' | 'purple' | 'warm'

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
    name: '曜夜智海',
    desc: '深海墨蓝，带一层冷紫辉光',
    colors: ['#13131f', '#6366f1', '#a78bfa', '#1e1e3f']
  },
  {
    id: 'light' as ThemeId,
    name: '云境霁白',
    desc: '雾白界面，配清透蓝调高光',
    colors: ['#f8f9fc', '#2563eb', '#7c3aed', '#eff6ff']
  },
  {
    id: 'green' as ThemeId,
    name: '松岚青研',
    desc: '松针青绿，偏理性和研究感',
    colors: ['#0e1812', '#34d399', '#6ee7b7', '#0d2a1e']
  },
  {
    id: 'purple' as ThemeId,
    name: '霓幕绛夜',
    desc: '绛紫夜幕，点缀玫粉霓光',
    colors: ['#100d1e', '#a855f7', '#f472b6', '#2d1860']
  },
  {
    id: 'warm' as ThemeId,
    name: '琥珀书页',
    desc: '暖纸米杏，适合长时间阅读',
    colors: ['#faf6f0', '#b45309', '#d97706', '#fef3e2']
  }
]

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<ThemeId>('dark')
  const ai = ref<AiConfig>({
    enabled: true,
    apiBase: 'http://119.96.30.33:8087/v1',
    model: '/data/model/qwen3_6_27B_FP8/Qwen/Qwen3_6-27B-FP8',
    apiKey: 'EMPTY'
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
