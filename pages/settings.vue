<template>
  <div>
    <!-- 主题设置 -->
    <div class="section-header">
      <div class="section-h-title">界面主题</div>
      <div class="section-h-desc">选择适合您的视觉风格，立即生效</div>
    </div>
    <div class="theme-grid">
      <div
        v-for="theme in THEMES"
        :key="theme.id"
        class="theme-card card"
        :class="{ 'theme-card-active': currentTheme === theme.id }"
        @click="applyTheme(theme.id)"
      >
        <div class="theme-preview">
          <div v-for="(color, ci) in theme.colors" :key="ci" class="preview-swatch" :style="{ background: color }" />
        </div>
        <div class="theme-info">
          <div class="theme-name">{{ theme.name }}</div>
          <div class="theme-desc">{{ theme.desc }}</div>
        </div>
        <div class="theme-footer">
          <div v-if="currentTheme === theme.id" class="theme-active-badge">
            <UIcon name="i-lucide-check-circle-2" class="size-3.5" />
            当前主题
          </div>
          <UButton
            size="sm"
            :variant="currentTheme === theme.id ? 'solid' : 'outline'"
            @click.stop="applyTheme(theme.id)"
          >{{ currentTheme === theme.id ? '已应用' : '应用主题' }}</UButton>
        </div>
      </div>
    </div>

    <!-- AI 配置 -->
    <div class="section-header" style="margin-top: 36px">
      <div class="section-h-title">AI 助手配置</div>
      <div class="section-h-desc">配置知识中台内置 AI 数字人所使用的语言模型接入信息</div>
    </div>

    <div class="card ai-config-card">
      <!-- 启用开关 -->
      <div class="config-row">
        <div class="config-label-group">
          <div class="config-label">启用 AI 数字人</div>
          <div class="config-sub">开启后，页面右下角将显示 AI 数字人悬浮按钮</div>
        </div>
        <div class="flex items-center gap-3">
          <USwitch v-model="aiForm.enabled" />
          <span class="toggle-label">{{ aiForm.enabled ? '已启用' : '已关闭' }}</span>
        </div>
      </div>

      <div class="config-divider" />

      <!-- API Base -->
      <div class="config-row">
        <div class="config-label-group">
          <div class="config-label">API 地址</div>
          <div class="config-sub">OpenAI 兼容格式，例如 https://api.openai.com/v1</div>
        </div>
        <div class="config-input-group">
          <UInput
            v-model="aiForm.apiBase"
            placeholder="https://api.openai.com/v1"
            :disabled="!aiForm.enabled"
          />
        </div>
      </div>

      <!-- 模型名称 -->
      <div class="config-row">
        <div class="config-label-group">
          <div class="config-label">模型名称</div>
          <div class="config-sub">例如 gpt-4o、claude-3-5-sonnet、deepseek-chat</div>
        </div>
        <div class="config-input-group">
          <UInput
            v-model="aiForm.model"
            placeholder="gpt-4o"
            :disabled="!aiForm.enabled"
          />
        </div>
      </div>

      <!-- API Key -->
      <div class="config-row">
        <div class="config-label-group">
          <div class="config-label">API Key</div>
          <div class="config-sub">Bearer Token 格式，保存后会加密存储于本地</div>
        </div>
        <div class="config-input-group">
          <UInput
            v-model="aiForm.apiKey"
            :type="showKey ? 'text' : 'password'"
            placeholder="sk-..."
            :disabled="!aiForm.enabled"
            :trailing-icon="showKey ? 'i-lucide-eye-off' : 'i-lucide-eye'"
            @click:trailing="showKey = !showKey"
          />
        </div>
      </div>

      <div class="config-divider" />

      <!-- 保存 -->
      <div class="config-actions">
        <UButton icon="i-lucide-check" :loading="savingAi" @click="saveAiConfig">
          保存配置
        </UButton>
        <UButton variant="ghost" @click="resetAiForm">重置</UButton>
      </div>
    </div>

    <!-- 账号信息 -->
    <div class="section-header" style="margin-top: 36px">
      <div class="section-h-title">账号信息</div>
      <div class="section-h-desc">当前登录账号详情与权限概览</div>
    </div>

    <div class="card account-card">
      <UAvatar :text="userInitials" icon="i-lucide-user-round" size="xl" class="user-avatar-shell" />
      <div class="account-info">
        <div class="account-name">{{ hydrated ? (user?.name || '未登录用户') : '加载中...' }}</div>
        <div class="account-meta">
          <UBadge :label="hydrated ? (user?.roleName || '未设置角色') : '加载中'" variant="soft" size="xs" />
          <span class="account-sep">·</span>
          <span class="account-tenant">{{ hydrated ? (user?.tenant || '-') : '-' }}</span>
          <span class="account-sep">·</span>
          <span class="account-username">@{{ hydrated ? (user?.username || '-') : '-' }}</span>
        </div>
        <div class="account-cats">
          <span class="cats-label">可访问分类：</span>
          <UBadge
            v-for="k in hydratedAllowedCategories"
            :key="k"
            :label="catName(k)"
            variant="outline"
            color="neutral"
            size="xs"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { CATEGORIES } from '../data/mock'
import { useAuthStore } from '../stores/auth'
import { THEMES, useSettingsStore } from '../stores/settings'

// @ts-ignore Nuxt macro
definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const toast = useToast()

const hydrated = ref(false)
const user = computed(() => authStore.user)
const userInitials = computed(() => user.value?.name?.slice(0, 1) || user.value?.avatar?.slice(0, 1) || '?')
const allowedCategories = computed(() => user.value?.allowedCategories || [])
const hydratedAllowedCategories = computed(() => hydrated.value ? allowedCategories.value : [])
const currentTheme = computed(() => settingsStore.theme)

function applyTheme(id: string) {
  settingsStore.setTheme(id)
}

function catName(key: string) {
  return CATEGORIES.find(c => c.key === key)?.name || key
}

const aiForm = reactive({
  enabled: settingsStore.ai.enabled,
  apiBase: settingsStore.ai.apiBase,
  model: settingsStore.ai.model,
  apiKey: settingsStore.ai.apiKey
})

const showKey = ref(false)
const savingAi = ref(false)

function resetAiForm() {
  aiForm.enabled = settingsStore.ai.enabled
  aiForm.apiBase = settingsStore.ai.apiBase
  aiForm.model = settingsStore.ai.model
  aiForm.apiKey = settingsStore.ai.apiKey
}

async function saveAiConfig() {
  savingAi.value = true
  await new Promise(r => setTimeout(r, 500))
  settingsStore.saveAiConfig({
    enabled: aiForm.enabled,
    apiBase: aiForm.apiBase,
    model: aiForm.model,
    apiKey: aiForm.apiKey
  })
  savingAi.value = false
  toast.add({ title: '配置已保存', color: 'success' })
}

onMounted(() => {
  hydrated.value = true
})
</script>

<style scoped>
.section-header { margin-bottom: 16px; }
.section-h-title { font-size: 15px; font-weight: 700; color: var(--text-strong); }
.section-h-desc { font-size: 12px; color: var(--text-muted); margin-top: 3px; }

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}

.theme-card {
  padding: 18px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid var(--border);
}
.theme-card:hover { border-color: var(--primary); transform: translateY(-2px); }
.theme-card-active { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent); }

.theme-preview { display: flex; gap: 6px; margin-bottom: 14px; }
.preview-swatch { flex: 1; height: 24px; border-radius: 6px; border: 1px solid rgba(128,128,128,0.15); }

.theme-info { margin-bottom: 14px; }
.theme-name { font-size: 14px; font-weight: 700; color: var(--text-strong); margin-bottom: 4px; }
.theme-desc { font-size: 11px; color: var(--text-muted); }

.theme-footer { display: flex; align-items: center; justify-content: space-between; }
.theme-active-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--primary);
  font-weight: 600;
}

.ai-config-card { padding: 0; overflow: hidden; }

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  gap: 20px;
}
.config-label-group { flex: 1; min-width: 0; }
.config-label { font-size: 14px; font-weight: 600; color: var(--text-strong); margin-bottom: 3px; }
.config-sub { font-size: 11px; color: var(--text-muted); }
.config-input-group { width: 340px; flex-shrink: 0; }
.config-divider { border-top: 1px solid var(--border); }
.config-actions { display: flex; align-items: center; gap: 10px; padding: 16px 24px; }
.toggle-label { font-size: 13px; color: var(--text-muted); white-space: nowrap; }

.account-card { display: flex; align-items: center; gap: 20px; padding: 24px; }
.account-name { font-size: 18px; font-weight: 700; color: var(--text-strong); margin-bottom: 8px; }
.account-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; margin-bottom: 10px; }
.account-sep { color: var(--text-muted); }
.account-tenant, .account-username { color: var(--text-muted); }
.account-cats { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; }
.cats-label { font-size: 11px; color: var(--text-muted); }

@media (max-width: 768px) {
  .config-row { flex-direction: column; align-items: flex-start; }
  .config-input-group { width: 100%; }
  .account-card { flex-direction: column; }
}
</style>