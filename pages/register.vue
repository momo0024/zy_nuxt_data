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
          <div v-if="error" class="error-alert">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.4"/>
              <path d="M7 4v3M7 9.5v.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            {{ error }}
          </div>
        </Transition>

        <div class="form-field">
          <label class="form-label">姓名</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="5" r="3" stroke="currentColor" stroke-width="1.3"/>
              <path d="M1 14c0-3.314 2.91-6 6.5-6s6.5 2.686 6.5 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            <input v-model="form.name" class="form-input" type="text" placeholder="请输入您的姓名" required />
          </div>
        </div>

        <div class="form-field">
          <label class="form-label">用户名</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
              <rect x="1" y="3" width="13" height="9" rx="2" stroke="currentColor" stroke-width="1.3"/>
              <path d="M4 7h7M4 10h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            <input v-model="form.username" class="form-input" type="text" placeholder="设置登录用户名" required />
          </div>
        </div>

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
              placeholder="设置登录密码"
              required
            />
            <button type="button" class="eye-btn" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M7.5 3C4.5 3 2 5.5 1 7.5c1 2 3.5 4.5 6.5 4.5s5.5-2.5 6.5-4.5C13 5.5 10.5 3 7.5 3z" stroke="currentColor" stroke-width="1.3"/>
                <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" stroke-width="1.3"/>
              </svg>
              <svg v-else width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M2 2l11 11M4 4.8C2.6 5.8 1.5 6.7 1 7.5c1 2 3.5 4.5 6.5 4.5 1.2 0 2.3-.3 3.3-.8M11.5 10.5C12.7 9.6 13.6 8.5 14 7.5 13 5.5 10.5 3 7.5 3c-1 0-2 .3-2.8.7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="role-notice">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.2"/>
            <path d="M6.5 5v4M6.5 3.5v.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          新注册账号将自动分配"普通用户"权限
        </div>

        <button type="submit" class="btn btn-primary w-full login-btn" :disabled="loading">
          <span v-if="loading" class="loading-dots"><span /><span /><span /></span>
          <span v-else>注册并登录</span>
        </button>

        <div class="form-switch">
          已有账号？<NuxtLink to="/login" class="form-link">立即登录</NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
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
.input-wrapper { position: relative; }
.input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
.input-wrapper .form-input { padding-left: 36px; padding-right: 36px; }
.eye-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 2px; transition: color 0.15s; }
.eye-btn:hover { color: var(--text); }
.login-btn { height: 42px; font-size: 14px; font-weight: 600; }
.error-alert { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 8px; background: color-mix(in srgb, var(--danger) 12%, transparent); color: var(--danger); font-size: 13px; border: 1px solid color-mix(in srgb, var(--danger) 25%, transparent); }
.role-notice { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); padding: 8px 12px; background: var(--surface-alt); border-radius: 8px; border: 1px solid var(--border); }
.form-switch { text-align: center; font-size: 13px; color: var(--text-muted); }
.form-link { color: var(--primary); text-decoration: none; font-weight: 600; }
.form-link:hover { text-decoration: underline; }
.loading-dots { display: flex; gap: 4px; align-items: center; }
.loading-dots span { width: 5px; height: 5px; border-radius: 50%; background: white; animation: loading-bounce 0.8s infinite; }
.loading-dots span:nth-child(2) { animation-delay: 0.15s; }
.loading-dots span:nth-child(3) { animation-delay: 0.3s; }
@keyframes loading-bounce {
  0%, 100% { transform: translateY(0); opacity: 0.7; }
  50% { transform: translateY(-4px); opacity: 1; }
}

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
