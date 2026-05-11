<template>
  <svg
    :width="size"
    :height="size * 1.15"
    viewBox="0 0 100 115"
    xmlns="http://www.w3.org/2000/svg"
    :class="['dh-avatar', `state-${state}`]"
  >
    <defs>
      <!-- 面部渐变 -->
      <radialGradient id="faceGrad" cx="38%" cy="32%" r="60%">
        <stop offset="0%" :stop-color="highlightColor" />
        <stop offset="100%" :stop-color="faceColor" />
      </radialGradient>
      <!-- 眼部发光 -->
      <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="var(--primary)" />
        <stop offset="100%" stop-color="var(--primary)" stop-opacity="0" />
      </radialGradient>
      <!-- 肩部渐变 -->
      <linearGradient id="shoulderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" :stop-color="faceColor" />
        <stop offset="100%" :stop-color="faceColor" stop-opacity="0" />
      </linearGradient>
      <!-- 发光滤镜 -->
      <filter id="eyeGlowFilter" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="outerGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <!-- 外层脉冲环 -->
    <circle
      class="pulse-ring-outer"
      cx="50" cy="42" r="38"
      fill="none"
      stroke="var(--primary)"
      stroke-width="0.5"
      stroke-dasharray="5 4"
      opacity="0.3"
    />
    <!-- 旋转装饰环 -->
    <circle
      class="spin-ring"
      cx="50" cy="42" r="34"
      fill="none"
      stroke="var(--primary)"
      stroke-width="0.4"
      stroke-dasharray="2 6"
      opacity="0.25"
    />

    <!-- 头部基底（发光轮廓） -->
    <ellipse
      cx="50" cy="40"
      rx="22" ry="24"
      fill="none"
      stroke="var(--primary)"
      stroke-width="0.8"
      opacity="0.4"
      filter="url(#outerGlow)"
    />

    <!-- 头部填充 -->
    <ellipse cx="50" cy="40" rx="21" ry="23" fill="url(#faceGrad)" />

    <!-- 额头科技线条 -->
    <path d="M 36 23 Q 43 19 50 18 Q 57 19 64 23" fill="none" stroke="var(--primary)" stroke-width="0.7" opacity="0.5" />
    <!-- 额头微点 -->
    <circle cx="37" cy="24" r="1" fill="var(--primary)" opacity="0.4" />
    <circle cx="63" cy="24" r="1" fill="var(--primary)" opacity="0.4" />
    <!-- 额头纵线 -->
    <line x1="50" y1="18" x2="50" y2="23" stroke="var(--primary)" stroke-width="0.5" opacity="0.35" />

    <!-- 侧脸电路点 -->
    <circle cx="29" cy="38" r="1.2" fill="var(--primary)" opacity="0.35" />
    <line x1="29" y1="38" x2="29" y2="44" stroke="var(--primary)" stroke-width="0.5" opacity="0.25" />
    <circle cx="71" cy="38" r="1.2" fill="var(--primary)" opacity="0.35" />
    <line x1="71" y1="38" x2="71" y2="44" stroke="var(--primary)" stroke-width="0.5" opacity="0.25" />

    <!-- 左眼 -->
    <ellipse cx="42" cy="38" rx="5" ry="4.5" fill="#08081a" />
    <ellipse
      class="eye-iris"
      cx="42" cy="38" rx="3.2" ry="2.8"
      fill="var(--primary)"
      filter="url(#eyeGlowFilter)"
      opacity="0.9"
    />
    <ellipse cx="43.5" cy="36.8" rx="1" ry="0.8" fill="white" opacity="0.55" />
    <!-- 眼睫毛线 -->
    <path d="M 37.5 37 Q 42 34.5 46.5 37" fill="none" stroke="var(--primary)" stroke-width="0.6" opacity="0.3" />

    <!-- 右眼 -->
    <ellipse cx="58" cy="38" rx="5" ry="4.5" fill="#08081a" />
    <ellipse
      class="eye-iris"
      cx="58" cy="38" rx="3.2" ry="2.8"
      fill="var(--primary)"
      filter="url(#eyeGlowFilter)"
      opacity="0.9"
    />
    <ellipse cx="59.5" cy="36.8" rx="1" ry="0.8" fill="white" opacity="0.55" />
    <path d="M 53.5 37 Q 58 34.5 62.5 37" fill="none" stroke="var(--primary)" stroke-width="0.6" opacity="0.3" />

    <!-- 鼻部暗示 -->
    <path d="M 49 43 L 48.2 47 Q 50 48.5 51.8 47 L 51 43" fill="none" stroke="var(--primary)" stroke-width="0.5" opacity="0.25" />

    <!-- 嘴部 -->
    <path
      class="mouth-line"
      d="M 43.5 51 Q 50 55.5 56.5 51"
      fill="none"
      stroke="var(--primary)"
      stroke-width="1.4"
      stroke-linecap="round"
      opacity="0.7"
    />
    <!-- 嘴角装饰 -->
    <circle cx="43.5" cy="51" r="1" fill="var(--primary)" opacity="0.4" />
    <circle cx="56.5" cy="51" r="1" fill="var(--primary)" opacity="0.4" />

    <!-- 下颌曲线 -->
    <path d="M 30 50 Q 50 68 70 50" fill="url(#faceGrad)" opacity="0.2" />

    <!-- 颈部 -->
    <rect x="46" y="62" width="8" height="8" rx="3" fill="url(#faceGrad)" opacity="0.8" />
    <!-- 领口横线 -->
    <line x1="40" y1="70" x2="60" y2="70" stroke="var(--primary)" stroke-width="0.6" opacity="0.4" />

    <!-- 肩部/身体 -->
    <path
      d="M 10 115 C 15 92 32 75 50 72 C 68 75 85 92 90 115 Z"
      fill="url(#shoulderGrad)"
      opacity="0.75"
    />
    <!-- 胸前领口V形 -->
    <path
      d="M 42 72 L 50 82 L 58 72"
      fill="none"
      stroke="var(--primary)"
      stroke-width="0.8"
      opacity="0.5"
    />
    <!-- 胸部左装饰线 -->
    <line x1="30" y1="90" x2="45" y2="80" stroke="var(--primary)" stroke-width="0.4" opacity="0.2" />
    <line x1="70" y1="90" x2="55" y2="80" stroke="var(--primary)" stroke-width="0.4" opacity="0.2" />
  </svg>
</template>

<script setup lang="ts">
type AvatarState = 'idle' | 'thinking' | 'speaking'

const props = withDefaults(defineProps<{
  size?: number
  state?: AvatarState
}>(), {
  size: 80,
  state: 'idle'
})

// 根据主题动态调整颜色
const faceColor = 'var(--dh-face)'
const highlightColor = 'var(--dh-highlight)'
</script>

<style scoped>
.dh-avatar {
  overflow: visible;
  display: block;
}

/* ---- 通用装饰环动画 ---- */
.pulse-ring-outer {
  transform-origin: 50px 42px;
  animation: pulse-ring 2.5s ease-in-out infinite;
}

.spin-ring {
  transform-origin: 50px 42px;
  animation: spin-slow 18s linear infinite;
}

/* ---- 待机：呼吸感 ---- */
.state-idle {
  animation: breathe 3.2s ease-in-out infinite;
  transform-origin: 50px 57px;
}

.state-idle .eye-iris {
  animation: eye-glow 3s ease-in-out infinite;
}

/* ---- 思考：头部左右晃动 ---- */
.state-thinking {
  transform-origin: 50px 115px;
  animation: think-wobble 0.5s ease-in-out infinite;
}

.state-thinking .pulse-ring-outer {
  animation: pulse-ring 0.8s ease-in-out infinite;
}

.state-thinking .spin-ring {
  animation: spin-slow 4s linear infinite;
}

.state-thinking .eye-iris {
  animation: eye-glow 0.4s ease-in-out infinite;
}

/* ---- 说话：嘴部动画 ---- */
.state-speaking {
  animation: breathe 0.6s ease-in-out infinite;
  transform-origin: 50px 57px;
}

.state-speaking .mouth-line {
  animation: speak-mouth 0.35s ease-in-out infinite alternate;
}

.state-speaking .pulse-ring-outer {
  animation: wave-ripple 1s ease-out infinite;
}

/* ---- 关键帧 ---- */
@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.025); }
}

@keyframes pulse-ring {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50% { opacity: 0.08; transform: scale(1.1); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes eye-glow {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 0.4; }
}

@keyframes think-wobble {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}

@keyframes speak-mouth {
  0% { d: path('M 43.5 51 Q 50 55.5 56.5 51'); }
  100% { d: path('M 43.5 51 Q 50 58 56.5 51'); }
}

@keyframes wave-ripple {
  0% { opacity: 0.5; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.4); }
}
</style>
