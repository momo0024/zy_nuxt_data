<template>
  <div class="app-shell">
    <!-- 顶部栏（含导航 + 用户） -->
    <LayoutTopbar />

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 标签页栏 -->
      <div class="tabbar">
        <div
          v-for="tab in tabs"
          :key="tab.path"
          class="tab-item"
          :class="{ active: tab.path === currentPath }"
          @click="goToTab(tab.path)"
        >
          <UIcon :name="getTabIcon(tab.path)" class="tab-icon size-3.5" />
          <span>{{ tab.name }}</span>
          <UButton
            v-if="tabs.length > 1"
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-lucide-x"
            class="tab-close"
            :aria-label="`关闭${tab.name}`"
            @click.stop="closeTab(tab.path)"
          />
        </div>
      </div>

      <!-- 页面内容 -->
      <div class="page-content">
        <slot />
      </div>
    </div>

    <!-- 数字人 FAB + 聊天面板 -->
    <DigitalHumanAiFab v-if="settingsStore.ai.enabled" />
    <DigitalHumanChatPanel v-if="settingsStore.ai.enabled" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type NavItem = {
  path: string
  name: string
  icon: string
}

type TabItem = {
  path: string
  name: string
}

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

const NAV_ITEMS: NavItem[] = [
  { path: '/', name: '产业图谱', icon: 'i-lucide-network' },
  { path: '/geo-screen', name: '企业地图', icon: 'i-lucide-map' },
  { path: '/enterprise-screen', name: '企业大屏', icon: 'i-lucide-monitor-dot' },
  { path: '/news-center', name: '新闻中心', icon: 'i-lucide-newspaper' },
  { path: '/admin/data-update', name: '数据更新', icon: 'i-lucide-database-zap' },
  // { path: '/settings', name: '系统设置', icon: 'i-lucide-settings-2' },
]

const tabs = ref<TabItem[]>([])
const tabsReady = ref(false)
const currentPath = computed(() => route.path)

function addTabForPath(path: string) {
  if (path === '/admin/data-update' && !authStore.isAdmin) return
  const navItem = NAV_ITEMS.find((item) => item.path === path)
  if (navItem && !tabs.value.find((tab) => tab.path === path)) {
    tabs.value.push({ path, name: navItem.name })
  }
}

watch(
  () => route.path,
  (newPath: string) => {
    if (!tabsReady.value) return
    addTabForPath(newPath)
  },
)

onMounted(() => {
  authStore.loadFromStorage()
  tabsReady.value = true
  addTabForPath(route.path)
})

function getTabIcon(path: string) {
  return NAV_ITEMS.find((item) => item.path === path)?.icon || 'i-lucide-panel-right-open'
}

function goToTab(path: string) {
  if (path !== currentPath.value) {
    router.push(path)
  }
}

function closeTab(path: string) {
  const idx = tabs.value.findIndex((tab) => tab.path === path)
  if (idx === -1) return
  resetPageInit(path)
  tabs.value.splice(idx, 1)
  if (currentPath.value === path) {
    const newTab = tabs.value[Math.max(0, idx - 1)]
    if (newTab) {
      router.push(newTab.path)
    } else {
      router.push('/')
    }
  }
}
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--bg);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 标签页栏 */
.tabbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px 0;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  flex-shrink: 0;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px 8px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-bottom: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  position: relative;
  top: 1px;
}
.tab-item:hover {
  color: var(--text);
  background: var(--surface-alt);
}
.tab-item.active {
  color: var(--primary);
  background: var(--surface);
  border-color: var(--border);
  border-bottom-color: var(--surface);
}

.tab-icon {
  flex-shrink: 0;
  opacity: 0.7;
}
.tab-item.active .tab-icon {
  opacity: 1;
}

.tab-close {
  opacity: 0;
  margin-left: 2px;
  padding: 2px;
  height: 18px;
  width: 18px;
}
.tab-item:hover .tab-close {
  opacity: 1;
}

/* 页面内容 */
.page-content {
  flex: 1;
  overflow: auto;
  background: var(--bg);
  padding: 0;
}
</style>
