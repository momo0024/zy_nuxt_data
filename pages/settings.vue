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
        <!-- 颜色预览 -->
        <div class="theme-preview">
          <div v-for="(color, ci) in theme.colors" :key="ci" class="preview-swatch" :style="{ background: color }" />
        </div>
        <div class="theme-info">
          <div class="theme-name">{{ theme.name }}</div>
          <div class="theme-desc">{{ theme.desc }}</div>
        </div>
        <div class="theme-footer">
          <div v-if="currentTheme === theme.id" class="theme-active-badge">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <circle cx="5.5" cy="5.5" r="5.5" fill="currentColor"/>
              <path d="M3 5.5l2 2 3-3" stroke="white" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            当前主题
          </div>
          <button
            class="btn btn-sm"
            :class="currentTheme === theme.id ? 'btn-primary' : 'btn-outline'"
            @click.stop="applyTheme(theme.id)"
          >
            {{ currentTheme === theme.id ? '已应用' : '应用主题' }}
          </button>
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
        <div class="toggle-wrap" @click="aiForm.enabled = !aiForm.enabled">
          <div class="toggle" :class="{ on: aiForm.enabled }">
            <div class="toggle-thumb" />
          </div>
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
          <input
            v-model="aiForm.apiBase"
            class="form-input"
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
          <input
            v-model="aiForm.model"
            class="form-input"
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
        <div class="config-input-group" style="position: relative">
          <input
            v-model="aiForm.apiKey"
            :type="showKey ? 'text' : 'password'"
            class="form-input"
            placeholder="sk-..."
            :disabled="!aiForm.enabled"
            style="padding-right: 40px"
          />
          <button
            class="key-toggle"
            @click="showKey = !showKey"
            :disabled="!aiForm.enabled"
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path v-if="!showKey" d="M1 7C1 7 3 2 7 2s6 5 6 5-2 5-6 5S1 7 1 7z" stroke="currentColor" stroke-width="1.2"/>
              <circle v-if="!showKey" cx="7" cy="7" r="2" stroke="currentColor" stroke-width="1.2"/>
              <path v-if="showKey" d="M2 2l10 10M1 5c.5-.7 1.2-1.5 2-2M7 2c3.2 0 5.5 3.5 6 5-.3.7-.7 1.5-1.3 2.2M4 7.7A2 2 0 0 0 7 9c.5 0 1-.1 1.4-.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="config-divider" />

      <!-- 保存按钮 -->
      <div class="config-actions">
        <button class="btn btn-primary" @click="saveAiConfig" :disabled="savingAi">
          <template v-if="savingAi">保存中...</template>
          <template v-else>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style="margin-right: 6px">
              <path d="M2 7l3.5 3.5L11 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            保存配置
          </template>
        </button>
        <button class="btn btn-ghost" @click="resetAiForm">重置</button>
        <Transition name="fade-in">
          <span v-if="aiSaveMsg" class="save-msg">{{ aiSaveMsg }}</span>
        </Transition>
      </div>
    </div>

    <!-- 账号信息 -->
    <div class="section-header" style="margin-top: 36px">
      <div class="section-h-title">账号信息</div>
      <div class="section-h-desc">当前登录账号详情与权限概览</div>
    </div>

    <div class="card account-card">
      <div class="account-avatar">
        {{ user?.name?.slice(0, 1) || '?' }}
      </div>
      <div class="account-info">
        <div class="account-name">{{ user?.name }}</div>
        <div class="account-meta">
          <span class="badge badge-primary">{{ user?.roleName }}</span>
          <span class="account-sep">·</span>
          <span class="account-tenant">{{ user?.tenant }}</span>
          <span class="account-sep">·</span>
          <span class="account-username">@{{ user?.username }}</span>
        </div>
        <div class="account-cats">
          <span class="cats-label">可访问分类：</span>
          <span v-for="k in allowedCategories" :key="k" class="badge badge-outline" style="font-size:10px">
            {{ catName(k) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { THEMES } from '~/stores/settings'
import { CATEGORIES } from '~/data/mock'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const settingsStore = useSettingsStore()

const user = computed(() => authStore.user)
const allowedCategories = computed(() => user.value?.allowedCategories || [])
const currentTheme = computed(() => settingsStore.theme)

function applyTheme(id: string) {
  settingsStore.setTheme(id)
}

function catName(key: string) {
  return CATEGORIES.find(c => c.key === key)?.name || key
}

// AI 表单
const aiForm = reactive({
  enabled: settingsStore.ai.enabled,
  apiBase: settingsStore.ai.apiBase,
  model: settingsStore.ai.model,
  apiKey: settingsStore.ai.apiKey
})

const showKey = ref(false)
const savingAi = ref(false)
const aiSaveMsg = ref('')

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
  aiSaveMsg.value = '配置已保存'
  setTimeout(() => { aiSaveMsg.value = '' }, 3000)
}
</script>

<style scoped>
.section-header { margin-bottom: 16px; }
.section-h-title { font-size: 15px; font-weight: 700; color: var(--text-strong); }
.section-h-desc { font-size: 12px; color: var(--text-muted); margin-top: 3px; }

/* Theme grid */
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

.theme-preview {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
}

.preview-swatch {
  flex: 1;
  height: 24px;
  border-radius: 6px;
  border: 1px solid rgba(128,128,128,0.15);
}

.theme-info { margin-bottom: 14px; }
.theme-name { font-size: 14px; font-weight: 700; color: var(--text-strong); margin-bottom: 4px; }
.theme-desc { font-size: 11px; color: var(--text-muted); }

.theme-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.theme-active-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--primary);
  font-weight: 600;
}

/* AI Config */
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

.config-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 24px;
}

.save-msg { font-size: 12px; color: var(--success); }

/* Toggle */
.toggle-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  flex-shrink: 0;
}

.toggle {
  width: 46px;
  height: 26px;
  border-radius: 999px;
  background: var(--border);
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}

.toggle.on { background: var(--primary); }

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}

.toggle.on .toggle-thumb { transform: translateX(20px); }

.toggle-label { font-size: 13px; color: var(--text-muted); white-space: nowrap; }

.key-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px;
}

.key-toggle:disabled { opacity: 0.4; cursor: not-allowed; }

/* Account */
.account-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
}

.account-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.account-name { font-size: 18px; font-weight: 700; color: var(--text-strong); margin-bottom: 8px; }

.account-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  margin-bottom: 10px;
}

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
