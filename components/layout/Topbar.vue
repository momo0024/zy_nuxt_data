<template>
  <header class="topbar">
    <!-- 移动端菜单按钮 -->
    <UButton
      variant="ghost"
      color="neutral"
      size="sm"
      icon="i-lucide-menu"
      class="md:hidden"
      aria-label="打开菜单"
      @click="$emit('toggle-mobile')"
    />

    <div class="flex-1" />

    <!-- 主题切换下拉（UDropdownMenu） -->
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

      <!-- 租户信息 -->
      <div class="topbar-tenant">
        <UIcon name="i-lucide-building-2" class="size-4" />
        <span>{{ user?.tenant }}</span>
      </div>

      <!-- 分隔线 -->
      <div class="topbar-divider" />

      <!-- 用户头像 -->
      <div class="topbar-user">
        <UAvatar :text="userInitials" icon="i-lucide-user-round" size="sm" class="user-avatar-shell" />
        <div class="hidden md:block">
          <div class="user-name-sm">{{ user?.name }}</div>
          <div class="user-role-sm">{{ user?.roleName }}</div>
        </div>
      </div>
    </template>
  </header>
</template>

<script setup lang="ts">
import { THEMES } from '~/stores/settings'

defineEmits<{ (e: 'toggle-mobile'): void }>()

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const hydrated = ref(false)

const user = computed(() => authStore.user)
const currentTheme = computed(() => settingsStore.theme)
const themes = THEMES

const currentThemeMeta = computed(() => themes.find(t => t.id === currentTheme.value) || themes[0])
const currentThemeName = computed(() => currentThemeMeta.value?.name || '主题')
const currentThemeColors = computed(() => currentThemeMeta.value?.colors.slice(0, 3) || ['#888'])
const userInitials = computed(() => user.value?.name?.slice(0, 1) || user.value?.avatar?.slice(0, 1) || '?')

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

onMounted(() => {
  hydrated.value = true
})
</script>

<style scoped>
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

.topbar-tenant {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.topbar-user {
  display: flex;
  align-items: center;
  gap: 8px;
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