<template>
  <div class="app-shell">
    <!-- 侧边栏 -->
    <LayoutSidebar :collapsed="sidebarCollapsed" @toggle="sidebarCollapsed = !sidebarCollapsed" />

    <!-- 移动端遮罩 -->
    <div
      v-if="mobileMenuOpen"
      class="fixed inset-0 bg-black/50 z-30"
      @click="mobileMenuOpen = false"
    />

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 顶栏 -->
      <LayoutTopbar @toggle-mobile="mobileMenuOpen = !mobileMenuOpen" />

      <!-- 标签页栏 -->
      <div class="tabbar">
        <div
          v-for="tab in tabs"
          :key="tab.path"
          class="tab-item"
          :class="{ active: tab.path === currentPath }"
          @click="navigateTo(tab.path)"
        >
          <span>{{ tab.name }}</span>
          <button
            v-if="tabs.length > 1"
            class="tab-close"
            @click.stop="closeTab(tab.path)"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 页面内容 -->
      <div class="page-content">
        <slot />
      </div>
    </div>

    <!-- 数字人 FAB + 聊天面板 -->
    <DigitalHumanAiFab />
    <DigitalHumanChatPanel />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const sidebarCollapsed = ref(false)
const mobileMenuOpen = ref(false)

const NAV_ITEMS = [
  { path: '/', name: '首页概览' },
  { path: '/retrieve', name: '文档检索' },
  { path: '/data-search', name: '数据搜索' },
  { path: '/import', name: '文档导入' },
  { path: '/settings', name: '系统设置' }
]

const tabs = ref<{ path: string; name: string }[]>([])
const currentPath = computed(() => route.path)

watch(
  () => route.path,
  (newPath) => {
    const navItem = NAV_ITEMS.find(n => n.path === newPath)
    if (navItem && !tabs.value.find(t => t.path === newPath)) {
      tabs.value.push({ path: newPath, name: navItem.name })
    }
  },
  { immediate: true }
)

function closeTab(path: string) {
  const idx = tabs.value.findIndex(t => t.path === path)
  if (idx === -1) return
  tabs.value.splice(idx, 1)
  if (currentPath.value === path) {
    const newTab = tabs.value[Math.max(0, idx - 1)]
    if (newTab) navigateTo(newTab.path)
    else navigateTo('/')
  }
}
</script>
