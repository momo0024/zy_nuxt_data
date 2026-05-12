<template>
  <aside class="sidebar" :class="{ collapsed }">
    <!-- Logo区 -->
    <div class="sidebar-logo">
      <div class="logo-icon">智</div>
      <Transition name="fade-text">
        <div v-show="!collapsed" class="brand-name">智知云</div>
      </Transition>
    </div>

    <!-- 知识库统计小卡片 -->
    <Transition name="fade-text">
      <div v-show="!collapsed" class="kb-stats-card">
        <div class="kb-stat-item">
          <span class="kb-stat-label">文档数</span>
          <span class="kb-stat-val">1,773</span>
        </div>
        <div class="kb-stat-divider" />
        <div class="kb-stat-item">
          <span class="kb-stat-label">知识类别</span>
          <span class="kb-stat-val">{{ hydrated ? (user?.allowedCategories?.length ?? 0) : '…' }}</span>
        </div>
      </div>
    </Transition>

    <!-- 导航菜单 -->
    <nav class="sidebar-nav">
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
        :title="collapsed ? item.name : undefined"
      >
        <UIcon :name="item.icon" class="nav-icon size-[18px] shrink-0" />
        <Transition name="fade-text">
          <span v-show="!collapsed" class="nav-label">{{ item.name }}</span>
        </Transition>
        <Transition name="fade-text">
          <UBadge v-if="!collapsed && item.badge" :label="item.badge" variant="soft" size="xs" class="nav-badge" />
        </Transition>
      </NuxtLink>
    </nav>

    <div class="flex-1" />

    <!-- 用户卡片 -->
    <div v-if="hydrated" class="sidebar-user">
      <UAvatar :text="userInitials" icon="i-lucide-user-round" size="sm" class="shrink-0 user-avatar-shell" />
      <Transition name="fade-text">
        <div v-show="!collapsed" class="user-info">
          <div class="user-name">{{ user?.name }}</div>
          <div class="user-role">{{ user?.roleName }}</div>
        </div>
      </Transition>
    </div>

    <!-- 退出登录 -->
    <UButton
      variant="ghost"
      color="neutral"
      class="sidebar-logout w-full justify-start"
      :title="collapsed ? '退出登录' : undefined"
      @click="handleLogout"
    >
      <UIcon name="i-lucide-log-out" class="nav-icon size-4" />
      <Transition name="fade-text">
        <span v-show="!collapsed" class="nav-label">退出登录</span>
      </Transition>
    </UButton>

    <!-- 折叠按钮 -->
    <button
      class="collapse-handle"
      :class="{ collapsed }"
      @click="$emit('toggle')"
    >
      <span class="collapse-chip" aria-hidden="true">
        <span class="collapse-edge" />
        <UIcon :name="collapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-left'" class="collapse-icon size-4" />
      </span>
    </button>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

type NavItem = {
  path: string
  name: string
  icon: string
  badge?: string
}

defineProps<{ collapsed: boolean }>()
defineEmits<{ (e: 'toggle'): void }>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)
const userInitials = computed(() => user.value?.name?.slice(0, 1) || user.value?.avatar?.slice(0, 1) || '?')
const hydrated = ref(false)

const navItems: NavItem[] = [
  { path: '/', name: '首页概览', icon: 'i-lucide-layout-dashboard' },
  { path: '/retrieve', name: '文档检索', icon: 'i-lucide-search' },
  { path: '/data-search', name: '数据搜索', icon: 'i-lucide-table-properties' },
  { path: '/import', name: '文档导入', icon: 'i-lucide-file-up' },
  { path: '/settings', name: '系统设置', icon: 'i-lucide-settings-2' }
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

async function handleLogout() {
  authStore.logout()
  await router.push('/login')
}

onMounted(() => {
  hydrated.value = true
})
</script>

<style scoped>
.kb-stats-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 8px 8px 4px;
  padding: 8px 10px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.kb-stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.kb-stat-label {
  color: var(--text-muted);
  font-size: 10px;
  white-space: nowrap;
}

.kb-stat-val {
  color: var(--primary);
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-display);
}

.kb-stat-divider {
  width: 1px;
  height: 28px;
  background: var(--border);
  flex-shrink: 0;
  margin: 0 6px;
}

.sidebar-nav {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 8px 0;
}

.nav-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-badge {
  flex-shrink: 0;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  overflow: hidden;
  white-space: nowrap;
  border-top: 1px solid var(--border);
}

.user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-name {
  overflow: hidden;
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role {
  font-size: 11px;
  color: var(--text-muted);
}

.sidebar-logout {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  color: var(--text-muted);
  cursor: pointer;
  background: none;
  border: none;
  width: 100%;
  font-size: 13px;
  font-family: inherit;
  transition: color 0.15s, background 0.15s;
  overflow: hidden;
  white-space: nowrap;
}

.sidebar-logout:hover {
  color: var(--danger);
  background: color-mix(in srgb, var(--danger) 8%, transparent);
}

.collapse-handle {
  position: absolute;
  top: 50%;
  right: -18px;
  transform: translateY(-50%);
  padding: 0;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 12;
}

.collapse-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 56px;
  padding: 0;
  border-radius: 0 8px 8px 0;
  background: var(--primary);
  border: none;
  color: white;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--primary) 45%, transparent);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.collapse-handle:hover .collapse-chip {
  transform: translateX(2px);
  opacity: 0.88;
  box-shadow: 0 6px 20px color-mix(in srgb, var(--primary) 55%, transparent);
}

.collapse-handle.collapsed {
  right: -18px;
}



.collapse-edge {
  display: none;
}

.collapse-icon {
  color: white;
}

/* Transition */
.fade-text-enter-active,
.fade-text-leave-active {
  transition: opacity 0.15s, width 0.2s;
  overflow: hidden;
}

.fade-text-enter-from,
.fade-text-leave-to {
  opacity: 0;
  width: 0;
}
</style>
