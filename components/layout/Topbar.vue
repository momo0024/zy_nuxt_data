<template>
  <header class="topbar">
    <!-- Logo + 导航 -->
    <div class="topbar-left">
      <div class="topbar-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 32 32" class="brand-seal" aria-hidden="true">
            <rect x="1" y="1" width="30" height="30" rx="2" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5" />
            <path d="M10 16 h12 M16 10 v12" stroke="currentColor" stroke-width="1.2" />
            <circle cx="16" cy="16" r="3.5" fill="none" stroke="currentColor" stroke-width="1" />
          </svg>
        </div>
        <div class="brand-copy">
          <span class="brand-text">企业数据平台</span>
          <span class="brand-sub">产业情报中心</span>
        </div>
      </div>
      <nav class="topbar-nav">
        <a
          v-for="item in navItems"
          :key="item.path"
          :href="item.path"
          class="nav-link"
          :class="{ active: !item.openInNewTab && route.path === item.path }"
          :target="item.openInNewTab ? '_blank' : undefined"
          :rel="item.openInNewTab ? 'noopener noreferrer' : undefined"
          @click="onNavClick($event, item)"
        >
          <UIcon :name="item.icon" class="size-4" />
          <span>{{ item.name }}</span>
        </a>
      </nav>
    </div>

    <!-- 右侧工具区 -->
    <div class="topbar-right">
      <!-- 主题切换 -->
      <UDropdownMenu
        :items="themeMenuItems"
        :content="{ align: 'end', sideOffset: 10 }"
        :ui="{ content: 'w-80' }"
      >
        <UButton variant="outline" size="sm" color="neutral" class="theme-toggle-btn">
          <span class="theme-dot-stack" aria-hidden="true">
            <span
              v-for="(color, index) in currentThemeColors"
              :key="`${currentTheme}-${color}`"
              class="theme-dot-preview"
              :style="{ background: color, zIndex: currentThemeColors.length - index, transform: `translateX(${index * -6}px)` }"
            />
          </span>
          <span class="theme-label">{{ currentThemeName }}</span>
          <UIcon name="i-lucide-chevron-down" class="theme-caret size-3.5" />
        </UButton>

        <template #theme-leading="{ item }">
          <div class="theme-menu-swatches" aria-hidden="true">
            <span
              v-for="(color, index) in item.colors.slice(0, 4)"
              :key="`${item.id}-${color}`"
              class="theme-menu-swatch"
              :style="{ background: color, zIndex: 4 - index, transform: `translateX(${index * -5}px)` }"
            />
          </div>
        </template>

        <template #theme-trailing="{ item }">
          <UIcon v-if="item.id === currentTheme" name="i-lucide-check" class="size-4 text-[var(--primary)]" />
        </template>
      </UDropdownMenu>

      <template v-if="hydrated">
        <!-- 分隔线 -->
        <div class="topbar-divider" />

        <!-- 用户下拉菜单 -->
        <UDropdownMenu
          :items="userMenuItems"
          :content="{ align: 'end', sideOffset: 10 }"
        >
          <button class="user-dropdown-trigger">
            <UAvatar :text="userInitials" icon="i-lucide-user-round" size="sm" class="user-avatar-shell" />
            <div class="hidden md:block user-meta">
              <div class="user-name-sm">{{ user?.name }}</div>
              <div class="user-role-sm">{{ user?.roleName }}</div>
            </div>
            <UIcon name="i-lucide-chevron-down" class="size-3.5 text-[var(--text-muted)]" />
          </button>
        </UDropdownMenu>
      </template>
    </div>
  </header>
</template>

<script setup lang="ts">
import { THEMES } from '~/stores/settings'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const hydrated = ref(false)

const user = computed(() => authStore.user)
const isAdmin = computed(() => authStore.isAdmin)
const currentTheme = computed(() => settingsStore.theme)
const themes = THEMES

const currentThemeMeta = computed(() => themes.find(t => t.id === currentTheme.value) || themes[0])
const currentThemeName = computed(() => currentThemeMeta.value?.name || '主题')
const currentThemeColors = computed(() => currentThemeMeta.value?.colors.slice(0, 3) || ['#888'])
const userInitials = computed(() => user.value?.name?.slice(0, 1) || user.value?.avatar?.slice(0, 1) || '?')

const navItems = computed(() => {
  const items = [
    { path: '/', name: '产业图谱', icon: 'i-lucide-network', openInNewTab: false },
    { path: '/geo-screen', name: '企业地图', icon: 'i-lucide-map', openInNewTab: false },
    { path: '/enterprise-screen', name: '数据大屏', icon: 'i-lucide-monitor-dot', openInNewTab: false },
    { path: '/news-center', name: '新闻中心', icon: 'i-lucide-newspaper', openInNewTab: false },
  ]
  if (hydrated.value && isAdmin.value) {
    items.push({ path: '/admin/data-update', name: '数据更新', icon: 'i-lucide-database-zap', openInNewTab: false })
  }
  return items
})

function onNavClick(event: MouseEvent, item: { path: string, openInNewTab: boolean }) {
  if (item.openInNewTab) return
  event.preventDefault()
  if (route.path !== item.path) router.push(item.path)
}
const themeMenuItems = computed(() => [
  [
    {
      label: '界面主题',
      type: 'label' as const
    }
  ],
  themes.map(t => ({
    id: t.id,
    label: t.name,
    description: t.desc,
    colors: t.colors,
    slot: 'theme' as const,
    onSelect: () => settingsStore.setTheme(t.id)
  }))
])

const userMenuItems = computed(() => [
  [
    {
      label: user.value?.name || '用户',
      type: 'label' as const,
    },
  ],
  [
    {
      label: '角色信息',
      icon: 'i-lucide-shield',
      disabled: true,
    },
    {
      label: '系统设置',
      icon: 'i-lucide-settings-2',
      onSelect: () => router.push('/settings'),
    },
  ],
  [
    {
      label: '退出登录',
      icon: 'i-lucide-log-out',
      color: 'error' as const,
      onSelect: handleLogout,
    },
  ],
])

async function handleLogout() {
  authStore.logout()
  await router.push('/login')
}

onMounted(() => {
  hydrated.value = true
})
</script>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 20px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: relative;
  z-index: 50;
  gap: 16px;
  flex-shrink: 0;
  overflow: hidden;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 24px;
  min-width: 0;
  flex: 1;
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
}

.brand-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-seal {
  width: 20px;
  height: 20px;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.brand-text {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: 0.04em;
}

.brand-sub {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.08em;
}

.topbar-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.topbar-nav::-webkit-scrollbar {
  display: none;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}
.nav-link:hover {
  color: var(--text);
  background: var(--surface-alt);
}
.nav-link.active {
  color: var(--primary);
  background: var(--primary-soft);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.theme-toggle-btn:hover {
  border-color: color-mix(in srgb, var(--primary) 45%, var(--border));
  color: var(--text-strong);
  background: color-mix(in srgb, var(--primary-soft) 52%, var(--surface-alt));
}

.theme-dot-stack {
  display: inline-flex;
  align-items: center;
  padding-left: 12px;
}

.theme-dot-preview {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--surface) 55%, white);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--border) 70%, transparent);
  margin-left: -12px;
  flex-shrink: 0;
}

.theme-label {
  font-weight: 600;
  color: var(--text-strong);
}

.theme-caret {
  color: var(--text-muted);
}

.theme-menu-swatches {
  display: inline-flex;
  align-items: center;
  padding-left: 16px;
}

.theme-menu-swatch {
  width: 12px;
  height: 12px;
  margin-left: -12px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--surface) 58%, white);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--border) 70%, transparent);
}

.topbar-divider {
  width: 1px;
  height: 20px;
  background: var(--border);
}

.user-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}
.user-dropdown-trigger:hover {
  background: var(--surface-alt);
  border-color: var(--border);
}

.user-meta {
  text-align: left;
  line-height: 1.2;
}

.user-name-sm {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-strong);
}

.user-role-sm {
  font-size: 10px;
  color: var(--text-muted);
}
</style>
