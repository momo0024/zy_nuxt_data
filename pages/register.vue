<template>
  <div class="auth-page">
    <div class="auth-left">
      <div class="particles-bg" aria-hidden="true">
        <div v-for="i in 18" :key="i" class="particle" :style="particleStyle(i)" />
      </div>
      <div class="auth-brand">
        <div class="brand-logo"><span class="logo-mark">智</span></div>
        <h1 class="brand-title">智知云</h1>
        <p class="brand-sub">企业知识中台</p>
        <div class="brand-tagline">加入智知云，开启智能知识管理之旅</div>
      </div>
    </div>

    <div class="auth-right">
      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="form-header">
          <h2 class="form-title">创建账号</h2>
          <p class="form-sub">加入智知云企业知识中台</p>
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

        <div class="form-field">
          <label class="form-label">姓名</label>
          <UInput
            v-model="form.name"
            class="w-full"
            icon="i-lucide-user-round"
            size="lg"
            type="text"
            placeholder="请输入您的姓名"
            required
          />
        </div>

        <div class="form-field">
          <label class="form-label">用户名</label>
          <UInput
            v-model="form.username"
            class="w-full"
            icon="i-lucide-id-card"
            size="lg"
            type="text"
            placeholder="设置登录用户名"
            required
          />
        </div>

        <div class="form-field">
          <label class="form-label">密码</label>
          <UInput
            v-model="form.password"
            class="w-full"
            icon="i-lucide-lock-keyhole"
            size="lg"
            :type="showPassword ? 'text' : 'password'"
            placeholder="设置登录密码"
            :trailing-icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
            required
            @click:trailing="showPassword = !showPassword"
          />
        </div>

        <div class="role-notice">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.2"/>
            <path d="M6.5 5v4M6.5 3.5v.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          新注册账号将自动分配"普通用户"权限
        </div>

        <UButton type="submit" class="w-full login-btn" size="lg" :loading="loading">
          注册并登录
        </UButton>

        <div class="form-switch">
          已有账号？<NuxtLink to="/login" class="form-link">立即登录</NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// @ts-ignore Nuxt macro
definePageMeta({ layout: false })

const authStore = useAuthStore()
const router = useRouter()

const form = reactive({ name: '', username: '', password: '' })
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

async function handleRegister() {
  if (!form.name.trim() || !form.username.trim() || !form.password) return
  loading.value = true
  error.value = ''
  await new Promise(r => setTimeout(r, 400))
  const result = authStore.register(form.name.trim(), form.username.trim(), form.password)
  loading.value = false
  if (result.success) {
    await router.push('/')
  } else {
    error.value = result.error || '注册失败'
  }
}

function particleStyle(i: number) {
  const x = (i * 17 + 11) % 100
  const y = (i * 23 + 7) % 100
  const size = 2 + (i % 4)
  const delay = (i * 0.3) % 3
  const dur = 3 + (i % 4)
  return { left: `${x}%`, top: `${y}%`, width: `${size}px`, height: `${size}px`, animationDelay: `${delay}s`, animationDuration: `${dur}s` }
}
</script>

<style scoped>
.auth-form { width: 100%; max-width: 340px; display: flex; flex-direction: column; gap: 20px; }
.form-header { text-align: center; }
.form-title { font-size: 26px; font-weight: 700; color: var(--text-strong); margin: 0 0 6px; }
.form-sub { font-size: 13px; color: var(--text-muted); margin: 0; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.login-btn { height: 46px; font-size: 14px; font-weight: 600; }
.role-notice { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); padding: 8px 12px; background: var(--surface-alt); border-radius: 8px; border: 1px solid var(--border); }
.form-switch { text-align: center; font-size: 13px; color: var(--text-muted); }
.form-link { color: var(--primary); text-decoration: none; font-weight: 600; }
.form-link:hover { text-decoration: underline; }

/* Brand */
.auth-brand { position: relative; z-index: 1; text-align: center; padding: 40px; }
.brand-logo { width: 72px; height: 72px; border-radius: 20px; background: linear-gradient(135deg, var(--primary), var(--accent)); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; box-shadow: 0 0 50px color-mix(in srgb, var(--primary) 50%, transparent); }
.logo-mark { font-size: 32px; font-weight: 700; color: white; }
.brand-title { font-size: 36px; font-weight: 700; color: var(--text-strong); margin: 0 0 8px; }
.brand-sub { font-size: 16px; color: var(--text-muted); margin: 0 0 24px; }
.brand-tagline { font-size: 14px; color: var(--text); padding: 12px 20px; background: var(--primary-soft); border-radius: 12px; border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent); }
.particles-bg { position: absolute; inset: 0; }
.particle { position: absolute; border-radius: 50%; background: var(--primary); opacity: 0.15; animation: particle-float 3s ease-in-out infinite; }
</style>
