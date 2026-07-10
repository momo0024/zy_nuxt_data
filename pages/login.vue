<template>
  <div class="login-page" data-layout="auth">
    <!-- 左侧品牌区 -->
    <div class="login-left">
      <div class="login-grid-bg" aria-hidden="true" />
      <div class="login-glow login-glow--1" aria-hidden="true" />
      <div class="login-glow login-glow--2" aria-hidden="true" />

      <div class="login-brand">
        <div class="login-logo">
          <UIcon name="i-lucide-building-2" class="size-7 text-white" />
        </div>
        <h1 class="login-brand-title">企业服务数据平台</h1>
        <p class="login-brand-sub">Enterprise Data Service Platform</p>

        <div class="login-features">
          <div v-for="item in features" :key="item.title" class="login-feature">
            <div class="login-feature-icon">
              <UIcon :name="item.icon" class="size-4" />
            </div>
            <div>
              <div class="login-feature-title">{{ item.title }}</div>
              <div class="login-feature-desc">{{ item.desc }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="login-left-footer">
        <span>园区企业 · 产业分析 · 数据服务</span>
      </div>
    </div>

    <!-- 右侧登录表单 -->
    <div class="login-right">
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="login-form-header">
          <h2 class="login-form-title">账户登录</h2>
          <p class="login-form-sub">登录后访问企业数据与服务模块</p>
        </div>

        <Transition name="shake">
          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            icon="i-lucide-circle-alert"
            :title="error"
          />
        </Transition>

        <div class="login-field">
          <label class="login-label">用户名</label>
          <UInput
            v-model="form.username"
            class="w-full"
            icon="i-lucide-user-round"
            size="lg"
            type="text"
            placeholder="请输入用户名"
            autocomplete="username"
            required
          />
        </div>

        <div class="login-field">
          <label class="login-label">密码</label>
          <UInput
            v-model="form.password"
            class="w-full"
            icon="i-lucide-lock-keyhole"
            size="lg"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码"
            autocomplete="current-password"
            :trailing-icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
            required
            @click:trailing="showPassword = !showPassword"
          />
        </div>

        <UButton
          type="submit"
          class="w-full login-submit"
          size="lg"
          :loading="loading"
        >
          登录
        </UButton>

        <p class="login-notice">
          <UIcon name="i-lucide-shield-check" class="size-3.5 inline-block align-text-bottom" />
          本平台仅供授权用户使用，请妥善保管账户信息
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

definePageMeta({ layout: false })

const authStore = useAuthStore()
const router = useRouter()

const form = reactive({ username: '', password: '' })
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

const features = [
  { icon: 'i-lucide-map', title: '企业全景地图', desc: '可视化展示园区企业分布与区域边界' },
  { icon: 'i-lucide-network', title: '产业供应链图谱', desc: '上中下游产业链结构与企业关联分析' },
  { icon: 'i-lucide-newspaper', title: '新闻资讯聚合', desc: '创新平台动态与行业资讯智能检索' },
  { icon: 'i-lucide-database', title: '企业数据管理', desc: '管理员专属的数据同步与运维入口' },
]

async function handleLogin() {
  if (!form.username.trim() || !form.password) return
  loading.value = true
  error.value = ''
  await new Promise(r => setTimeout(r, 400))
  const result = authStore.login(form.username.trim(), form.password)
  loading.value = false
  if (result.success) {
    await router.push('/')
  } else {
    error.value = result.error || '登录失败'
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  background: var(--bg);
}

.login-left {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background: linear-gradient(160deg, #0f172a 0%, #1e3a5f 45%, #0c4a6e 100%);
  color: #fff;
  padding: 48px 40px;
}

.login-grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 100%);
}

.login-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}

.login-glow--1 {
  width: 400px;
  height: 400px;
  background: rgba(37, 99, 235, 0.25);
  top: -10%;
  right: -5%;
}

.login-glow--2 {
  width: 300px;
  height: 300px;
  background: rgba(6, 182, 212, 0.2);
  bottom: 5%;
  left: -5%;
}

.login-brand {
  position: relative;
  z-index: 1;
  max-width: 420px;
  width: 100%;
}

.login-logo {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #2563eb, #06b6d4);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
  box-shadow: 0 8px 32px rgba(37, 99, 235, 0.35);
}

.login-brand-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.login-brand-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  margin: 0 0 40px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.login-features {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-feature {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.login-feature-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.85);
}

.login-feature-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 3px;
}

.login-feature-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
}

.login-left-footer {
  position: absolute;
  bottom: 32px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  z-index: 1;
}

.login-right {
  width: 440px;
  min-width: 440px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  background: var(--surface);
  border-left: 1px solid var(--border);
}

.login-form {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.login-form-header {
  margin-bottom: 4px;
}

.login-form-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-strong);
  margin: 0 0 6px;
}

.login-form-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.login-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.login-submit {
  height: 46px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px !important;
  justify-content: center;
  margin-top: 4px;
}

.login-notice {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  margin: 0;
  line-height: 1.6;
}

@media (max-width: 900px) {
  .login-left {
    display: none;
  }
  .login-right {
    width: 100%;
    min-width: unset;
    border-left: none;
  }
}
</style>
