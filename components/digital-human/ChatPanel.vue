<template>
  <Teleport to="body">
    <!-- 遮罩 -->
    <Transition name="overlay-fade">
      <div
        v-if="chatStore.isOpen"
        class="chat-overlay"
        @click="chatStore.closePanel()"
      />
    </Transition>

    <!-- 右侧抽屉 -->
    <Transition name="drawer-slide">
      <div v-if="chatStore.isOpen" class="chat-drawer" ref="drawerRef">
        <!-- ===== Header ===== -->
        <div class="chat-header">
          <div class="header-left">
            <div class="header-avatar">
              <img src="/images/ai-assistant.png" alt="AI" style="width:36px;height:36px;object-fit:contain;" />
            </div>
            <div class="header-info">
              <div class="header-title">智知 AI 助手</div>
              <div class="header-model">{{ shortModel }}</div>
            </div>
          </div>
          <div class="header-right">
            <div class="ai-status" :class="chatStore.aiState">
              <span class="status-dot" />
              <span>{{ stateLabel }}</span>
            </div>
            <button class="icon-btn" @click="chatStore.closePanel()" title="关闭">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M2.5 2.5l10 10M12.5 2.5l-10 10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- ===== 工具栏 ===== -->
        <div class="chat-toolbar">
          <span class="toolbar-hint">Enter 发送 · Shift+Enter 换行</span>
          <div style="display:flex;gap:6px;align-items:center;">
            <span class="msg-count">{{ chatStore.messages.length }} 条</span>
            <button class="toolbar-btn" @click="chatStore.newConversation()" title="新建对话">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              新对话
            </button>
          </div>
        </div>

        <!-- ===== 消息区 ===== -->
        <div class="chat-messages" ref="messagesRef">
          <!-- 空状态 -->
          <div v-if="chatStore.messages.length === 0" class="chat-empty">
            <div class="empty-avatar-wrap">
              <img src="/images/ai-assistant.png" alt="AI" class="empty-avatar-img" />
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
              >{{ q }}</button>
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
              <div v-if="msg.role === 'assistant'" class="msg-avatar-wrap">
                <img src="/images/ai-assistant.png" alt="AI" style="width:22px;height:22px;object-fit:contain;" />
              </div>
              <div class="msg-bubble" :class="msg.role === 'user' ? 'bubble-user' : 'bubble-ai'">
                <div class="msg-content" v-html="renderMd(msg.content)" />
                <span v-if="msg.isStreaming" class="typing-cursor" />
                <div v-if="!msg.isStreaming" class="msg-actions">
                  <button class="msg-action-btn" @click="copyMsg(msg.content)">复制</button>
                  <button class="msg-action-btn" @click="quoteMsg(msg.content)">引用</button>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- ===== 快捷芯片 ===== -->
        <div v-if="chatStore.messages.length > 0" class="quick-chips-row">
          <button
            v-for="q in chatStore.QUICK_QUESTIONS"
            :key="q"
            class="quick-chip"
            @click="sendQuick(q)"
          >{{ q }}</button>
        </div>

        <!-- ===== 输入区 ===== -->
        <div class="chat-input-wrap">
          <textarea
            v-model="chatStore.inputText"
            class="chat-textarea"
            placeholder="输入问题，Enter 发送..."
            :disabled="isLoading"
            rows="1"
            ref="textareaRef"
            @keydown.enter.exact.prevent="handleSend"
            @input="autoResize"
          />
          <button
            class="send-btn"
            :disabled="!chatStore.inputText.trim() || isLoading"
            @click="handleSend"
          >
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <path d="M8.5 14.5V2.5M3 8l5.5-5.5L14 8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="chat-footer-note">回复基于当前 AI 配置生成，仅供参考</div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const chatStore = useChatStore()
const settingsStore = useSettingsStore()

const drawerRef = ref<HTMLElement | null>(null)
const messagesRef = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const isLoading = computed(() => chatStore.aiState !== 'idle')

const shortModel = computed(() => {
  const m = settingsStore.ai.model || ''
  if (!m) return 'AI 未配置'
  const parts = m.split('/')
  return parts[parts.length - 1] || m
})

const stateLabel = computed(() => {
  switch (chatStore.aiState) {
    case 'thinking': return '思考中...'
    case 'speaking': return '回复中...'
    default: return '就绪'
  }
})

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
  if (textareaRef.value) textareaRef.value.style.height = 'auto'
  await chatStore.sendMessage(text)
}

function sendQuick(q: string) {
  chatStore.inputText = q
  handleSend()
}

function copyMsg(content: string) {
  navigator.clipboard.writeText(content).catch(() => {})
}

function quoteMsg(content: string) {
  chatStore.inputText = `> ${content.slice(0, 80)}${content.length > 80 ? '...' : ''}\n`
  textareaRef.value?.focus()
}

function autoResize(e: Event) {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 140) + 'px'
}

watch(
  [() => chatStore.messages.length, () => chatStore.messages[chatStore.messages.length - 1]?.content],
  () => {
    nextTick(() => {
      if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    })
  }
)
</script>

<style scoped>
.chat-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
}

.chat-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1001;
  width: 420px;
  max-width: 100vw;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-left: 1px solid var(--border);
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.22);
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.header-left { display: flex; align-items: center; gap: 10px; }

.header-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(99,102,241,0.15), var(--bg));
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.header-title { font-size: 15px; font-weight: 700; color: var(--text-strong); }

.header-model {
  font-size: 11px;
  color: var(--text-muted);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-right { display: flex; align-items: center; gap: 10px; }

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
  background: var(--success);
}

.ai-status.thinking .status-dot { background: var(--warning); animation: breathe 0.7s infinite; }
.ai-status.speaking .status-dot { background: var(--primary); animation: breathe 0.45s infinite; }

.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.icon-btn:hover { background: var(--surface-alt); color: var(--text-strong); }

.chat-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 18px;
  background: var(--surface-alt);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.toolbar-hint { font-size: 11px; color: var(--text-muted); }

.msg-count {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--border);
  padding: 2px 8px;
  border-radius: 999px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.toolbar-btn:hover { border-color: var(--primary); color: var(--primary); }

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  scroll-behavior: smooth;
}
.chat-messages::-webkit-scrollbar { width: 4px; }
.chat-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 12px;
  gap: 14px;
}

.empty-avatar-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-avatar-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 4px 16px rgba(99,102,241,0.35));
}

.empty-glow {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99,102,241,0.22), transparent 70%);
  animation: glow-pulse 2.4s ease-in-out infinite;
}

.empty-greeting { font-size: 20px; font-weight: 700; color: var(--text-strong); }
.empty-sub { font-size: 13px; color: var(--text-muted); text-align: center; line-height: 1.6; }

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
  line-height: 1.5;
}

.quick-card:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: rgba(99,102,241,0.08);
  box-shadow: 0 2px 12px rgba(99,102,241,0.12);
}

.msg-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.msg-row.user { flex-direction: row-reverse; }

.msg-avatar-wrap {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(99,102,241,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.msg-bubble {
  max-width: 82%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.65;
  position: relative;
}

.bubble-user {
  background: var(--primary);
  color: white;
  border-bottom-right-radius: 4px;
}

.bubble-ai {
  background: var(--surface-alt);
  color: var(--text);
  border-bottom-left-radius: 4px;
  border: 1px solid var(--border);
}

.msg-content { word-break: break-word; }

.typing-cursor {
  display: inline-block;
  width: 2px;
  height: 14px;
  background: var(--primary);
  border-radius: 1px;
  margin-left: 2px;
  vertical-align: middle;
  animation: blink 0.8s step-end infinite;
}

.msg-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.15s;
}

.msg-bubble:hover .msg-actions { opacity: 1; }

.msg-action-btn {
  background: none;
  border: 1px solid var(--border);
  cursor: pointer;
  color: var(--text-muted);
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 11px;
  font-family: inherit;
  transition: all 0.12s;
}

.msg-action-btn:hover {
  background: var(--surface);
  color: var(--text-strong);
  border-color: var(--primary);
}

.quick-chips-row {
  display: flex;
  gap: 6px;
  padding: 8px 16px;
  overflow-x: auto;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
.quick-chips-row::-webkit-scrollbar { height: 0; }

.quick-chip {
  padding: 4px 12px;
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
.quick-chip:hover { border-color: var(--primary); color: var(--primary); background: rgba(99,102,241,0.08); }

.chat-input-wrap {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 16px 10px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.chat-textarea {
  flex: 1;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1.5px solid var(--border);
  background: var(--surface-alt);
  color: var(--text-strong);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  resize: none;
  max-height: 140px;
  transition: border-color 0.15s, box-shadow 0.15s;
  line-height: 1.55;
}

.chat-textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
}

.chat-textarea::placeholder { color: var(--text-muted); }

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
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
  filter: brightness(1.12);
  box-shadow: 0 4px 18px rgba(99,102,241,0.4);
  transform: translateY(-1px);
}

.send-btn:disabled { opacity: 0.38; cursor: not-allowed; transform: none; }

.chat-footer-note {
  text-align: center;
  font-size: 10px;
  color: var(--text-muted);
  padding: 2px 0 10px;
  flex-shrink: 0;
}

:deep(.inline-code) {
  background: var(--surface);
  padding: 1px 5px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  color: var(--accent);
  border: 1px solid var(--border);
}

.overlay-fade-enter-active { animation: overlay-in 0.25s ease forwards; }
.overlay-fade-leave-active { animation: overlay-out 0.2s ease forwards; }
@keyframes overlay-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes overlay-out { from { opacity: 1; } to { opacity: 0; } }

.drawer-slide-enter-active { animation: drawer-in 0.3s cubic-bezier(0.25,0.8,0.25,1) forwards; }
.drawer-slide-leave-active { animation: drawer-out 0.22s ease forwards; }
@keyframes drawer-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes drawer-out { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }

@keyframes breathe {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}

@media (max-width: 480px) {
  .chat-drawer { width: 100vw; }
  .quick-cards { grid-template-columns: 1fr; }
}
</style>
