<template>
  <div class="auth-page">
    <div class="auth-left">
      <div class="particles-bg" aria-hidden="true">
        <div v-for="i in 20" :key="i" class="particle" :style="particleStyle(i)" />
      </div>
      <div class="auth-brand">
        <div class="brand-logo">
          <UIcon name="i-lucide-building-2" class="size-7 text-white" />
        </div>
        <h1 class="brand-title">企业服务数据平台</h1>
        <p class="brand-sub">Enterprise Data Service Platform</p>
        <div class="brand-features">
          <div v-for="f in features" :key="f.text" class="feature-item">
            <span class="feature-dot" />
            <span>{{ f.text }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="auth-right">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const features = [
  { text: '企业全景地图可视化' },
  { text: '产业供应链图谱分析' },
  { text: '新闻资讯智能聚合' },
  { text: '企业数据运维管理' }
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
