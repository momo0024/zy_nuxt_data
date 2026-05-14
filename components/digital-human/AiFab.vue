<template>
  <Teleport to="body">
    <Transition name="fab-bounce">
      <button
        v-if="aiEnabled"
        class="ai-fab"
        :style="{ bottom: `${pos.y}px`, right: `${pos.x}px` }"
        :title="isOpen ? '关闭 AI 助手' : '打开 AI 助手'"
        @click="chatStore.togglePanel()"
        @mousedown="startDrag"
      >
        <!-- 脉冲光环 -->
        <span class="pulse-ring" style="animation-delay: 0s" />
        <span class="pulse-ring" style="animation-delay: 0.8s" />

        <!-- 3D AI 图标 -->
        <div class="fab-avatar">
          <img src="/images/ai-assistant.png" alt="AI助手" style="width:34px;height:34px;object-fit:contain;display:block;" />
        </div>
      </button>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const chatStore = useChatStore()
const settingsStore = useSettingsStore()
const route = useRoute()

const isOpen = computed(() => chatStore.isOpen)
const isAuthPage = computed(() => ['/login', '/register'].includes(route.path))
const aiEnabled = computed(() => settingsStore.ai.enabled && !isAuthPage.value)

// 拖拽位置
const pos = ref({ x: 24, y: 24 })
let dragging = false
let startX = 0
let startY = 0
let startPosX = 0
let startPosY = 0

function startDrag(e: MouseEvent) {
  dragging = false
  startX = e.clientX
  startY = e.clientY
  startPosX = pos.value.x
  startPosY = pos.value.y

  const onMove = (ev: MouseEvent) => {
    const dx = ev.clientX - startX
    const dy = ev.clientY - startY
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragging = true
    if (dragging) {
      pos.value.x = Math.max(16, startPosX - dx)
      pos.value.y = Math.max(16, startPosY - dy)
    }
  }

  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    if (dragging) {
      // Prevent click after drag
      setTimeout(() => { dragging = false }, 50)
    }
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>

<style scoped>
.ai-fab {
  position: fixed;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-md), 0 0 30px color-mix(in srgb, var(--primary) 40%, transparent);
  z-index: 999;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: none;
  overflow: visible;
  padding: 0;
}

.ai-fab:hover {
  transform: scale(1.06);
  box-shadow: var(--shadow-xl), 0 0 36px color-mix(in srgb, var(--primary) 54%, transparent);
}

.pulse-ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid var(--primary);
  animation: wave-ripple 2.5s ease-out infinite;
  pointer-events: none;
}

.fab-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Transition */
.fab-bounce-enter-active {
  animation: fab-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fab-bounce-leave-active {
  animation: fab-out 0.2s ease forwards;
}

@keyframes fab-in {
  from { opacity: 0; transform: scale(0.3); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes fab-out {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.3); }
}

@keyframes wave-ripple {
  0% { opacity: 0.5; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.55); }
}
</style>
