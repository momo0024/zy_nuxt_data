<template>
  <div class="app-shell">
    <!-- 侧边栏 -->
    <LayoutSidebar :collapsed="sidebarCollapsed" :mobile-open="mobileMenuOpen" @toggle="sidebarCollapsed = !sidebarCollapsed" @close-mobile="mobileMenuOpen = false" />

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
    <DigitalHumanAiFab />
    <DigitalHumanChatPanel />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
const sidebarCollapsed = ref(false)
const mobileMenuOpen = ref(false)

const NAV_ITEMS: NavItem[] = [
  { path: '/', name: '首页概览', icon: 'i-lucide-layout-dashboard' },
  { path: '/public-opinion', name: '舆情监测', icon: 'i-lucide-radar' },
  { path: '/retrieve', name: '文档检索', icon: 'i-lucide-search' },
  { path: '/data-search', name: '数据搜索', icon: 'i-lucide-table-properties' },
  { path: '/import', name: '文档导入', icon: 'i-lucide-file-up' },
  { path: '/settings', name: '系统设置', icon: 'i-lucide-settings-2' }
]

const tabs = ref<TabItem[]>([])
const currentPath = computed(() => route.path)

watch(
  () => route.path,
  (newPath: string) => {
    const navItem = NAV_ITEMS.find((item) => item.path === newPath)
    if (navItem && !tabs.value.find((tab) => tab.path === newPath)) {
      tabs.value.push({ path: newPath, name: navItem.name })
    }
  },
  { immediate: true }
)

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
