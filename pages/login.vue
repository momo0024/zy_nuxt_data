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
          <div v-if="error" class="error-alert">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.4"/>
              <path d="M7 4v3M7 9.5v.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            {{ error }}
          </div>
        </Transition>

        <!-- 用户名 -->
        <div class="form-field">
          <label class="form-label">用户名</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="5" r="3" stroke="currentColor" stroke-width="1.3"/>
              <path d="M1 14c0-3.314 2.91-6 6.5-6s6.5 2.686 6.5 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            <input
              v-model="form.username"
              class="form-input"
              type="text"
              placeholder="请输入用户名"
              autocomplete="username"
              required
            />
          </div>
        </div>

        <!-- 密码 -->
        <div class="form-field">
          <label class="form-label">密码</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="2" y="6" width="11" height="8" rx="2" stroke="currentColor" stroke-width="1.3"/>
              <path d="M5 6V4a2.5 2.5 0 015 0v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            <input
              v-model="form.password"
              class="form-input"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              autocomplete="current-password"
              required
            />
            <button type="button" class="eye-btn" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M7.5 3C4.5 3 2 5.5 1 7.5c1 2 3.5 4.5 6.5 4.5s5.5-2.5 6.5-4.5C13 5.5 10.5 3 7.5 3z" stroke="currentColor" stroke-width="1.3"/>
                <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" stroke-width="1.3"/>
              </svg>
              <svg v-else width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M2 2l11 11M6.5 6.6A2 2 0 0110 9.4M4 4.8C2.6 5.8 1.5 6.7 1 7.5c1 2 3.5 4.5 6.5 4.5 1.2 0 2.3-.3 3.3-.8M11.5 10.5C12.7 9.6 13.6 8.5 14 7.5 13 5.5 10.5 3 7.5 3c-1 0-2 .3-2.8.7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 登录按钮 -->
        <button
          type="submit"
          class="btn btn-primary w-full login-btn"
          :disabled="loading"
        >
          <span v-if="loading" class="loading-dots">
            <span /><span /><span />
          </span>
          <span v-else>登录</span>
        </button>

        <!-- 跳转注册 -->
        <div class="form-switch">
          还没有账号？
          <NuxtLink to="/register" class="form-link">立即注册</NuxtLink>
        </div>

        <!-- 快速登录提示 -->
        <div class="demo-accounts">
          <div class="demo-title">演示账号（密码均为 123456）</div>
          <div class="demo-list">
            <button
              v-for="a in demoAccounts"
              :key="a.username"
              type="button"
              class="demo-item"
              @click="fillDemo(a)"
            >
              <span class="demo-avatar">{{ a.avatar }}</span>
              <div>
                <div class="demo-name">{{ a.name }}</div>
                <div class="demo-role">{{ a.role }}</div>
              </div>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
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

.input-wrapper { position: relative; }

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.input-wrapper .form-input { padding-left: 36px; padding-right: 36px; }

.eye-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 2px;
  transition: color 0.15s;
}

.eye-btn:hover { color: var(--text); }

.login-btn { height: 42px; font-size: 14px; font-weight: 600; }

.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--danger) 12%, transparent);
  color: var(--danger);
  font-size: 13px;
  border: 1px solid color-mix(in srgb, var(--danger) 25%, transparent);
}

.form-switch {
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
}

.form-link { color: var(--primary); text-decoration: none; font-weight: 600; }
.form-link:hover { text-decoration: underline; }

.loading-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

.loading-dots span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: white;
  animation: loading-bounce 0.8s infinite;
}

.loading-dots span:nth-child(2) { animation-delay: 0.15s; }
.loading-dots span:nth-child(3) { animation-delay: 0.3s; }

@keyframes loading-bounce {
  0%, 100% { transform: translateY(0); opacity: 0.7; }
  50% { transform: translateY(-4px); opacity: 1; }
}

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
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-alt);
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  text-align: left;
}

.demo-item:hover {
  border-color: var(--primary);
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
