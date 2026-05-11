import { defineStore } from 'pinia'
import { useSettingsStore } from './settings'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isStreaming?: boolean
}

export type AiState = 'idle' | 'thinking' | 'speaking'

export const useChatStore = defineStore('chat', () => {
  const isOpen = ref(false)
  const messages = ref<ChatMessage[]>([])
  const aiState = ref<AiState>('idle')
  const inputText = ref('')
  const abortController = ref<AbortController | null>(null)

  const QUICK_QUESTIONS = [
    '总结当前首页数据',
    '解释字段含义',
    '给出导入建议',
    '梳理排队原因'
  ]

  function openPanel() { isOpen.value = true }
  function closePanel() { isOpen.value = false }
  function togglePanel() { isOpen.value = !isOpen.value }

  function newConversation() {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
    messages.value = []
    aiState.value = 'idle'
    inputText.value = ''
  }

  async function sendMessage(text: string) {
    const settings = useSettingsStore()
    if (!text.trim()) return
    if (!settings.ai.enabled) {
      messages.value.push({
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: 'AI 功能未启用，请前往系统设置开启并配置 API 参数。',
        timestamp: Date.now()
      })
      return
    }

    // Add user message
    messages.value.push({
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    })

    // Prepare AI response placeholder
    const aiMsgId = `msg-${Date.now()}-a`
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    }
    messages.value.push(aiMsg)
    aiState.value = 'thinking'

    try {
      abortController.value = new AbortController()
      const { apiBase, model, apiKey } = settings.ai
      const base = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase

      const response = await fetch(`${base}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          stream: true,
          messages: [
            {
              role: 'system',
              content: '你是智知云企业知识中台的 AI 助手，名字叫"智知"。你专注于帮助用户管理和检索知识资产，回答应简洁精准、专业友好。'
            },
            ...messages.value.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
          ]
        }),
        signal: abortController.value.signal
      })

      if (!response.ok) {
        throw new Error(`API 错误 ${response.status}: ${response.statusText}`)
      }

      aiState.value = 'speaking'
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      const msgIndex = messages.value.findIndex(m => m.id === aiMsgId)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content || ''
            if (delta && msgIndex !== -1) {
              messages.value[msgIndex].content += delta
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err: any) {
      const msgIndex = messages.value.findIndex(m => m.id === aiMsgId)
      if (msgIndex !== -1) {
        if (err?.name === 'AbortError') {
          messages.value[msgIndex].content += ' [已中断]'
        } else {
          messages.value[msgIndex].content = `调用失败：${err.message || '未知错误'}。请检查 AI 配置是否正确。`
        }
      }
    } finally {
      const msgIndex = messages.value.findIndex(m => m.id === aiMsgId)
      if (msgIndex !== -1) {
        messages.value[msgIndex].isStreaming = false
      }
      aiState.value = 'idle'
      abortController.value = null
    }
  }

  return {
    isOpen, messages, aiState, inputText, QUICK_QUESTIONS,
    openPanel, closePanel, togglePanel, newConversation, sendMessage
  }
})
