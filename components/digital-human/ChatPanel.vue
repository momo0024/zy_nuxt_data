<template>
  <Teleport to="body">
    <Transition name="panel-slide">
      <div v-if="chatStore.isOpen" class="chat-panel" ref="panelRef">
        <!-- Header（可拖拽） -->
        <div class="chat-header" @mousedown="startDrag">
          <div class="flex items-center gap-3">
            <div class="header-avatar">
              <DigitalHumanAvatar :size="36" :state="chatStore.aiState" />
            </div>
            <div>
              <div class="header-title">智知 AI 助手</div>
              <div class="header-model">
                {{ settingsStore.ai.model || 'AI 未配置' }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- 状态指示 -->
            <div class="ai-status" :class="chatStore.aiState">
              <span class="status-dot" />
              <span>{{ stateLabel }}</span>
            </div>
            <!-- 关闭 -->
            <button class="btn btn-ghost btn-icon-sm" @click="chatStore.closePanel()">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 工具栏 -->
        <div class="chat-toolbar">
          <span class="text-xs" style="color: var(--text-muted)">
            Enter 发送 · Shift+Enter 换行 · 共 {{ chatStore.messages.length }} 条
          </span>
          <button class="btn btn-ghost btn-sm" @click="chatStore.newConversation()">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            新对话
          </button>
        </div>

        <!-- 消息区 -->
        <div class="chat-messages" ref="messagesRef">
          <!-- 空状态 -->
          <div v-if="chatStore.messages.length === 0" class="chat-empty">
            <div class="empty-dh">
              <DigitalHumanAvatar :size="88" state="idle" />
              <div class="empty-glow" />
            </div>
            <div class="empty-greeting">你好，我是智知</div>
            <div class="empty-sub">你的企业知识 AI 助手，有什么我可以帮你的？</div>
            <div class="quick-cards">
              <button
                v-for="q in chatStore.QUICK_QUESTIONS"
                :key="q"
                class="quick-card"
                @click="sendQuick(q)"
              >
                {{ q }}
              </button>
            </div>
          </div>

          <!-- 消息列表 -->
          <template v-else>
            <div
              v-for="msg in chatStore.messages"
              :key="msg.id"
              class="msg-row"
              :class="msg.role"
            >
              <!-- AI 头像 -->
              <div v-if="msg.role === 'assistant'" class="msg-avatar">
                <DigitalHumanAvatar :size="24" :state="msg.isStreaming ? 'speaking' : 'idle'" />
              </div>
              <!-- 气泡 -->
              <div class="msg-bubble" :class="msg.role === 'user' ? 'msg-user' : 'msg-ai'">
                <div class="msg-content" v-html="renderMd(msg.content)" />
                <!-- 打字光标 -->
                <span v-if="msg.isStreaming" class="typing-cursor" />
                <!-- 操作按钮 -->
                <div v-if="!msg.isStreaming" class="msg-actions">
                  <button class="msg-action-btn" @click="copyMsg(msg.content)" title="复制">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <rect x="1" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.2"/>
                      <path d="M3 3V2a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1H8" stroke="currentColor" stroke-width="1.2"/>
                    </svg>
                  </button>
                  <button class="msg-action-btn" @click="quoteMsg(msg.content)" title="引用">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M1 3h9M1 6h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 快捷问题（对话中） -->
        <div v-if="chatStore.messages.length > 0" class="quick-chips">
          <button
            v-for="q in chatStore.QUICK_QUESTIONS"
            :key="q"
            class="quick-chip"
            @click="sendQuick(q)"
          >
            {{ q }}
          </button>
        </div>

        <!-- 输入区 -->
        <div class="chat-input-area">
          <textarea
            v-model="chatStore.inputText"
            class="chat-textarea"
            placeholder="输入问题，Enter 发送..."
            :disabled="isLoading"
            @keydown.enter.exact.prevent="handleSend"
            @keydown.enter.shift.exact="() => {}"
            rows="1"
            @input="autoResize"
            ref="textareaRef"
          />
          <button
            class="send-btn"
            :disabled="!chatStore.inputText.trim() || isLoading"
            @click="handleSend"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 14V2M2 8l6-6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="chat-footer-note">回复基于当前 AI 配置生成</div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const chatStore = useChatStore()
const settingsStore = useSettingsStore()

const panelRef = ref<HTMLElement | null>(null)
const messagesRef = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const isLoading = computed(() => chatStore.aiState !== 'idle')

const stateLabel = computed(() => {
  switch (chatStore.aiState) {
    case 'thinking': return '思考中'
    case 'speaking': return '回复中'
    default: return '就绪'
  }
})

// 渲染简单 markdown（粗体、代码）
function renderMd(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\n/g, '<br>')
}

async function handleSend() {
  const text = chatStore.inputText.trim()
  if (!text || isLoading.value) return
  chatStore.inputText = ''
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
  await chatStore.sendMessage(text)
}

function sendQuick(q: string) {
  chatStore.inputText = q
  handleSend()
}

function copyMsg(content: string) {
  navigator.clipboard.writeText(content)
}

function quoteMsg(content: string) {
  chatStore.inputText = `> ${content.slice(0, 80)}${content.length > 80 ? '...' : ''}\n`
  textareaRef.value?.focus()
}

function autoResize(e: Event) {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

// 自动滚动到底部
watch(() => chatStore.messages.length, () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
})

watch(() => chatStore.messages[chatStore.messages.length - 1]?.content, () => {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
})

// 拖拽面板
let dragOffset = { x: 0, y: 0 }

function startDrag(e: MouseEvent) {
  if (!panelRef.value) return
  const rect = panelRef.value.getBoundingClientRect()
  dragOffset.x = e.clientX - rect.left
  dragOffset.y = e.clientY - rect.top

  const onMove = (ev: MouseEvent) => {
    if (!panelRef.value) return
    const x = ev.clientX - dragOffset.x
    const y = ev.clientY - dragOffset.y
    panelRef.value.style.left = `${Math.max(0, x)}px`
    panelRef.value.style.top = `${Math.max(0, y)}px`
    panelRef.value.style.right = 'auto'
    panelRef.value.style.bottom = 'auto'
  }

  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>

<style scoped>
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--border);
  cursor: grab;
  user-select: none;
}

.chat-header:active {
  cursor: grabbing;
}

.header-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, var(--primary-soft), var(--bg));
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
}

.header-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}

.header-model {
  font-size: 11px;
  color: var(--text-muted);
}

.ai-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-muted);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-muted);
}

.ai-status.idle .status-dot { background: var(--success); }
.ai-status.thinking .status-dot { background: var(--warning); animation: breathe 0.6s infinite; }
.ai-status.speaking .status-dot { background: var(--primary); animation: breathe 0.4s infinite; }

.chat-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-alt);
}

/* Empty state */
.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  gap: 12px;
}

.empty-dh {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-glow {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--primary) 20%, transparent), transparent 70%);
  pointer-events: none;
}

.empty-greeting {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-strong);
}

.empty-sub {
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
}

.quick-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
}

.quick-card {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-alt);
  color: var(--text);
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
  font-family: inherit;
}

.quick-card:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-soft);
}

/* Messages */
.msg-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.msg-row.user {
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}

.msg-content {
  word-break: break-word;
  line-height: 1.65;
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 14px;
  background: var(--primary);
  border-radius: 1px;
  margin-left: 2px;
  vertical-align: middle;
  animation: typing-blink 0.8s infinite;
}

.msg-actions {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  opacity: 0;
  transition: opacity 0.15s;
}

.msg-bubble:hover .msg-actions {
  opacity: 1;
}

.msg-action-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 3px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}

.msg-action-btn:hover {
  color: var(--text);
  background: var(--border);
}

/* Quick chips */
.quick-chips {
  display: flex;
  gap: 6px;
  padding: 8px 16px;
  overflow-x: auto;
  border-top: 1px solid var(--border);
}

.quick-chips::-webkit-scrollbar { height: 0; }

.quick-chip {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 11px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.quick-chip:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-soft);
}

/* Input area */
.chat-input-area {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 16px 8px;
  border-top: 1px solid var(--border);
}

.chat-textarea {
  flex: 1;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-alt);
  color: var(--text-strong);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  resize: none;
  max-height: 120px;
  transition: border-color 0.15s;
  line-height: 1.5;
}

.chat-textarea:focus {
  border-color: var(--primary);
}

.chat-textarea::placeholder {
  color: var(--text-muted);
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--primary);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  filter: brightness(1.15);
  box-shadow: 0 0 16px color-mix(in srgb, var(--primary) 50%, transparent);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chat-footer-note {
  text-align: center;
  font-size: 10px;
  color: var(--text-muted);
  padding: 4px 0 10px;
}

:deep(.inline-code) {
  background: var(--surface-alt);
  padding: 1px 5px;
  border-radius: 4px;
  font-family: 'Inter', monospace;
  font-size: 11px;
  color: var(--accent);
}

/* Panel animation */
.panel-slide-enter-active {
  animation: panel-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.panel-slide-leave-active {
  animation: panel-out 0.2s ease forwards;
}

@keyframes panel-in {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes panel-out {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(16px) scale(0.96); }
}

@keyframes breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes typing-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
