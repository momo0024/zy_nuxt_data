import { defineStore } from 'pinia'

export type ThemeId = 'dark' | 'light' | 'green' | 'purple' | 'warm'

export interface AiConfig {
  enabled: boolean
  apiBase: string
  model: string
  apiKey: string
}

export const THEMES = [
  {
    id: 'dark' as ThemeId,
    name: '深色',
    desc: '深邃星空，蓝紫光晕',
    colors: ['#13131f', '#6366f1', '#a78bfa', '#1e1e3f']
  },
  {
    id: 'light' as ThemeId,
    name: '浅色',
    desc: '极白背景，清爽精准',
    colors: ['#f8f9fc', '#2563eb', '#7c3aed', '#eff6ff']
  },
  {
    id: 'green' as ThemeId,
    name: '绿色',
    desc: '低饱和绿，科研气质',
    colors: ['#0e1812', '#34d399', '#6ee7b7', '#0d2a1e']
  },
  {
    id: 'purple' as ThemeId,
    name: '紫色',
    desc: '暗紫底色，创意灵感',
    colors: ['#100d1e', '#a855f7', '#f472b6', '#2d1860']
  },
  {
    id: 'warm' as ThemeId,
    name: '暖纸',
    desc: '象牙纸感，人文气质',
    colors: ['#faf6f0', '#b45309', '#d97706', '#fef3e2']
  }
]

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<ThemeId>('dark')
  const ai = ref<AiConfig>({
    enabled: false,
    apiBase: '',
    model: 'gpt-4o',
    apiKey: ''
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
