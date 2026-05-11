<template>
  <header class="topbar">
    <!-- 移动端菜单按钮 -->
    <button class="btn btn-ghost btn-icon md:hidden" @click="$emit('toggle-mobile')">
      <Menu :size="18" />
    </button>

    <!-- 页面标题 -->
    <div class="topbar-title">
      <span>{{ pageTitle }}</span>
    </div>

    <div class="flex-1" />

    <!-- 主题切换 -->
    <div class="theme-switcher">
      <div
        v-for="t in themes"
        :key="t.id"
        class="theme-dot"
        :class="{ active: currentTheme === t.id }"
        :title="t.name"
        :style="{ background: t.colors[1] }"
        @click="setTheme(t.id)"
      />
    </div>

    <!-- 分隔线 -->
    <div class="topbar-divider" />

    <!-- 租户信息 -->
    <div class="topbar-tenant">
      <div class="tenant-icon">
        <Building2 :size="14" />
      </div>
      <span>{{ user?.tenant }}</span>
    </div>

    <!-- 分隔线 -->
    <div class="topbar-divider" />

    <!-- 用户头像 -->
    <div class="topbar-user">
      <div class="user-avatar-sm">{{ user?.avatar || '?' }}</div>
      <div class="hidden md:block">
        <div class="user-name-sm">{{ user?.name }}</div>
        <div class="user-role-sm">{{ user?.roleName }}</div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Menu, Building2 } from 'lucide-vue-next'
import { THEMES } from '~/stores/settings'

defineEmits<{ (e: 'toggle-mobile'): void }>()

const route = useRoute()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

const user = computed(() => authStore.user)
const currentTheme = computed(() => settingsStore.theme)
const themes = THEMES

const PAGE_TITLES: Record<string, string> = {
  '/': '首页概览',
  '/retrieve': '文档检索',
  '/data-search': '数据搜索',
  '/import': '文档导入',
  '/settings': '系统设置'
}

const pageTitle = computed(() => PAGE_TITLES[route.path] || '智知云')

function setTheme(id: any) {
  settingsStore.setTheme(id)
}
</script>

<style scoped>
.topbar-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-strong);
}

.theme-switcher {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--surface-alt);
  border-radius: 999px;
  border: 1px solid var(--border);
}

.theme-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  border: 2px solid transparent;
}

.theme-dot:hover {
  transform: scale(1.2);
}

.theme-dot.active {
  border-color: var(--text-strong);
  box-shadow: 0 0 0 2px var(--bg);
}

.topbar-divider {
  width: 1px;
  height: 20px;
  background: var(--border);
}

.topbar-tenant {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.tenant-icon {
  color: var(--text-muted);
}

.topbar-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: white;
}

.user-name-sm {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-strong);
  line-height: 1.2;
}

.user-role-sm {
  font-size: 10px;
  color: var(--text-muted);
}
</style>
