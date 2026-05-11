<template>
  <div class="auth-page">
    <!-- 左侧品牌区 -->
    <div class="auth-left">
      <!-- 粒子动画背景 -->
      <div class="particles-bg" aria-hidden="true">
        <div v-for="i in 20" :key="i" class="particle" :style="particleStyle(i)" />
      </div>
      <!-- 品牌内容 -->
      <div class="auth-brand">
        <div class="brand-logo">
          <div class="logo-mark">智</div>
        </div>
        <h1 class="brand-title">智知云</h1>
        <p class="brand-sub">企业知识中台</p>
        <div class="brand-features">
          <div class="feature-item" v-for="f in features" :key="f.text">
            <span class="feature-dot" />
            <span>{{ f.text }}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- 右侧表单区 -->
    <div class="auth-right">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const features = [
  { text: '多角色知识资产总览' },
  { text: '语义检索与知识查询' },
  { text: '数字人 AI 助手问答' },
  { text: '智能文档解析入库' }
]

function particleStyle(i: number) {
  const x = (i * 17 + 11) % 100
  const y = (i * 23 + 7) % 100
  const size = 2 + (i % 4)
  const delay = (i * 0.3) % 3
  const duration = 3 + (i % 4)
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}
</script>

<style scoped>
.auth-brand {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 40px;
}

.brand-logo {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  box-shadow: 0 0 40px color-mix(in srgb, var(--primary) 50%, transparent);
}

.logo-mark {
  font-size: 32px;
  font-weight: 700;
  color: white;
}

.brand-title {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-strong);
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.brand-sub {
  font-size: 16px;
  color: var(--text-muted);
  margin: 0 0 32px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
  max-width: 240px;
  margin: 0 auto;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text);
}

.feature-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
  flex-shrink: 0;
  box-shadow: 0 0 8px var(--primary);
}

.particles-bg {
  position: absolute;
  inset: 0;
}

.particle {
  position: absolute;
  border-radius: 50%;
  background: var(--primary);
  opacity: 0.15;
  animation: particle-float 3s ease-in-out infinite;
}
</style>
