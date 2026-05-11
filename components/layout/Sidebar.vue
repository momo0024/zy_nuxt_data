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
        <div class="kb-stat">
          <div class="kb-stat-num">1,773</div>
          <div class="kb-stat-label">总文档数</div>
        </div>
        <div class="kb-stat-divider" />
        <div class="kb-stat">
          <div class="kb-stat-num">4</div>
          <div class="kb-stat-label">知识库</div>
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
        <component :is="item.icon" class="nav-icon" :size="18" :stroke-width="1.8" />
        <Transition name="fade-text">
          <span v-show="!collapsed" class="nav-label">{{ item.name }}</span>
        </Transition>
        <Transition name="fade-text">
          <span v-if="!collapsed && item.badge" class="nav-badge">{{ item.badge }}</span>
        </Transition>
      </NuxtLink>
    </nav>

    <div class="flex-1" />

    <!-- 用户卡片 -->
    <div class="sidebar-user">
      <div class="user-avatar">{{ user?.avatar || '?' }}</div>
      <Transition name="fade-text">
        <div v-show="!collapsed" class="user-info">
          <div class="user-name">{{ user?.name }}</div>
          <div class="user-role">{{ user?.roleName }}</div>
        </div>
      </Transition>
    </div>

    <!-- 退出登录 -->
    <button class="sidebar-logout" :title="collapsed ? '退出登录' : undefined" @click="handleLogout">
      <LogOut class="nav-icon" :size="16" :stroke-width="1.8" />
      <Transition name="fade-text">
        <span v-show="!collapsed" class="nav-label">退出登录</span>
      </Transition>
    </button>

    <!-- 折叠按钮 -->
    <button class="collapse-btn" @click="$emit('toggle')">
      <ChevronLeft
        :size="16"
        :style="{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }"
      />
    </button>
  </aside>
</template>

<script setup lang="ts">
import {
  LayoutDashboard, Search, Database, Upload, Settings, LogOut, ChevronLeft
} from 'lucide-vue-next'

defineProps<{ collapsed: boolean }>()
defineEmits<{ (e: 'toggle'): void }>()

const route = useRoute()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

const navItems = [
  { path: '/', name: '首页概览', icon: LayoutDashboard },
  { path: '/retrieve', name: '文档检索', icon: Search },
  { path: '/data-search', name: '数据搜索', icon: Database },
  { path: '/import', name: '文档导入', icon: Upload },
  { path: '/settings', name: '系统设置', icon: Settings }
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

async function handleLogout() {
  authStore.logout()
  await navigateTo('/login')
}
</script>

<style scoped>
.kb-stats-card {
  margin: 12px 12px 4px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.kb-stat {
  flex: 1;
  text-align: center;
}

.kb-stat-num {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
  font-family: 'Inter', sans-serif;
  line-height: 1.2;
}

.kb-stat-label {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
}

.kb-stat-divider {
  width: 1px;
  height: 28px;
  background: var(--border);
}

.sidebar-nav {
  padding: 8px 0;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
}

.nav-badge {
  background: var(--primary-soft);
  color: var(--primary);
  border-radius: 999px;
  font-size: 10px;
  padding: 1px 6px;
  font-weight: 600;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid var(--border);
  overflow: hidden;
}

.user-avatar {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: white;
}

.user-info {
  overflow: hidden;
  white-space: nowrap;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
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

.collapse-btn {
  position: absolute;
  top: 50%;
  right: -12px;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  box-shadow: var(--shadow-sm);
  transition: color 0.15s, background 0.15s;
  z-index: 10;
}

.collapse-btn:hover {
  color: var(--text-strong);
  background: var(--surface-alt);
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
