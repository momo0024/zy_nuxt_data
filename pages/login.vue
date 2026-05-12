<template>
  <div class="auth-page" data-layout="auth">
    <!-- 左侧品牌区 -->
    <div class="auth-left">
      <div class="particles-bg" aria-hidden="true">
        <div v-for="i in 18" :key="i" class="particle" :style="particleStyle(i)" />
      </div>
      <div class="auth-brand">
        <div class="brand-logo">
          <span class="logo-mark">智</span>
        </div>
        <h1 class="brand-title">智知云</h1>
        <p class="brand-sub">企业知识中台</p>
        <div class="brand-features">
          <div v-for="f in features" :key="f" class="feature-item">
            <span class="feature-dot" />
            <span>{{ f }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录表单 -->
    <div class="auth-right">
      <form class="auth-form" @submit.prevent="handleLogin">
        <div class="form-header">
          <h2 class="form-title">欢迎回来</h2>
          <p class="form-sub">登录您的智知云账户</p>
        </div>

        <!-- 错误提示 -->
        <Transition name="shake">
          <UAlert
            v-if="error"
            color="error"
            variant="soft"
            icon="i-lucide-circle-alert"
            :title="error"
          />
        </Transition>

        <!-- 用户名 -->
        <div class="form-field">
          <label class="form-label">用户名</label>
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

        <!-- 密码 -->
        <div class="form-field">
          <label class="form-label">密码</label>
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

        <!-- 登录按钮 -->
        <UButton
          type="submit"
          class="w-full login-btn"
          size="lg"
          :loading="loading"
        >
          登录
        </UButton>

        <!-- 跳转注册 -->
        <div class="form-switch">
          还没有账号？
          <NuxtLink to="/register" class="form-link">立即注册</NuxtLink>
        </div>

        <!-- 快速登录提示 -->
        <div class="demo-accounts">
          <div class="demo-title">演示账号（密码均为 123456）</div>
          <div class="demo-list">
            <UButton
              v-for="a in demoAccounts"
              :key="a.username"
              color="neutral"
              variant="outline"
              class="demo-item"
              @click="fillDemo(a)"
            >
              <span class="demo-avatar">{{ a.avatar }}</span>
              <div>
                <div class="demo-name">{{ a.name }}</div>
                <div class="demo-role">{{ a.role }}</div>
              </div>
            </UButton>
          </div>
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

const form = reactive({ username: '', password: '' })
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

const features = [
  '多角色知识资产总览',
  '语义检索与知识查询',
  '数字人 AI 助手问答',
  '智能文档解析入库'
]

const demoAccounts = [
  { username: 'zhangyuan', name: '张媛', role: '知识管理员', avatar: 'ZY' },
  { username: 'linan', name: '李楠', role: '投研分析师', avatar: 'LN' },
  { username: 'sunlan', name: '孙岚', role: '运营经理', avatar: 'SL' }
]

function fillDemo(a: { username: string }) {
  form.username = a.username
  form.password = '123456'
  error.value = ''
}

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
.auth-form {
  width: 100%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-header { text-align: center; }

.form-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-strong);
  margin: 0 0 6px;
}

.form-sub { font-size: 13px; color: var(--text-muted); margin: 0; }

.form-field { display: flex; flex-direction: column; gap: 6px; }

.login-btn { height: 46px; font-size: 14px; font-weight: 600; border-radius: 999px !important; justify-content: center; letter-spacing: 0.04em; }

.form-switch {
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
}

.form-link { color: var(--primary); text-decoration: none; font-weight: 600; }
.form-link:hover { text-decoration: underline; }

/* Demo accounts */
.demo-accounts {
  border-top: 1px solid var(--border);
  padding-top: 16px;
}

.demo-title { font-size: 11px; color: var(--text-muted); margin-bottom: 10px; text-align: center; }

.demo-list { display: flex; gap: 8px; }

.demo-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  transition: all 0.15s;
  text-align: left;
}

.demo-item:hover {
  background: var(--primary-soft);
}

.demo-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.demo-name { font-size: 11px; font-weight: 600; color: var(--text-strong); }
.demo-role { font-size: 10px; color: var(--text-muted); }

/* Brand */
.auth-brand { position: relative; z-index: 1; text-align: center; padding: 40px; }
.brand-logo {
  width: 72px; height: 72px; border-radius: 20px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 24px;
  box-shadow: 0 0 50px color-mix(in srgb, var(--primary) 50%, transparent);
}
.logo-mark { font-size: 32px; font-weight: 700; color: white; }
.brand-title { font-size: 36px; font-weight: 700; color: var(--text-strong); margin: 0 0 8px; }
.brand-sub { font-size: 16px; color: var(--text-muted); margin: 0 0 32px; }
.brand-features { display: flex; flex-direction: column; gap: 10px; text-align: left; max-width: 240px; margin: 0 auto; }
.feature-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text); }
.feature-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--primary); flex-shrink: 0; box-shadow: 0 0 8px var(--primary); }
.particles-bg { position: absolute; inset: 0; }
.particle { position: absolute; border-radius: 50%; background: var(--primary); opacity: 0.15; animation: particle-float 3s ease-in-out infinite; }
</style>
