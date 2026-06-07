<template>
  <div ref="wrapRef" class="cb">
    <!-- 产业链主体 -->
    <section v-if="chainPhases.length" class="cb-main">
      <header class="cb-main-head">
        <div class="cb-main-head-inner">
          <div class="cb-main-head-icon">
            <UIcon name="i-lucide-git-branch" class="size-5" />
          </div>
          <div>
            <h2>集成电路产业链</h2>
            <p>上 · 中 · 下游关键环节</p>
          </div>
        </div>
      </header>

      <!-- 流程导航条 -->
      <div class="cb-flow">
        <div
          v-for="(phase, i) in chainPhases"
          :key="phase.id"
          class="cb-flow-seg"
          :class="{
            'cb-flow-seg--first': i === 0,
            'cb-flow-seg--last': i === chainPhases.length - 1,
          }"
          :style="{ flex: phaseFlex(phase), '--tc': phase.color }"
        >
          <span class="cb-flow-icon">
            <UIcon :name="phaseIcons[phase.key] || 'i-lucide-layers'" class="size-4" />
          </span>
          <span class="cb-flow-label">{{ phase.name }}</span>
          <span class="cb-flow-count">{{ phase.children.length || 0 }}模块</span>
        </div>
      </div>

      <!-- 模块列 -->
      <div class="cb-columns">
        <template v-for="phase in chainPhases" :key="phase.id">
          <article
            v-for="mod in phase.children"
            :key="mod.id"
            class="cb-col"
            :style="{ '--tc': phase.color, '--tc-bg': phase.color + '12' }"
          >
            <button
              type="button"
              class="cb-col-head"
              :class="{ on: selectedId === mod.id }"
              :data-node-id="mod.id"
              @click="emit('select', mod.id)"
            >
              <span class="cb-col-head-dot" />
              {{ mod.name }}
              <em v-if="mod.count">{{ mod.count }}</em>
            </button>
            <ul class="cb-col-list">
              <template v-if="mod.children.length">
                <li v-for="(item, idx) in visibleItems(mod)" :key="item.id">
                  <button
                    type="button"
                    class="cb-col-item"
                    :class="{ on: selectedId === item.id }"
                    :data-node-id="item.id"
                    @click="emit('select', item.id)"
                  >
                    {{ item.name }}
                  </button>
                </li>
                <li v-if="mod.children.length > MAX_VISIBLE_ITEMS" class="cb-col-more">
                  <button
                    type="button"
                    class="cb-col-more-btn"
                    @click="openPopup(phase, mod)"
                  >
                    <UIcon name="i-lucide-more-horizontal" class="size-3.5" />
                    展示更多 ({{ mod.children.length - MAX_VISIBLE_ITEMS }})
                  </button>
                </li>
              </template>
              <template v-else-if="mod.companies.length">
                <li v-for="(co, idx) in visibleCompanies(mod)" :key="co.code + co.name">
                  <NuxtLink
                    v-if="isValidCode(co.code)"
                    :to="companyUrl(co.code)"
                    class="cb-col-item cb-col-item--link"
                  >
                    {{ co.name }}
                  </NuxtLink>
                  <span v-else class="cb-col-item dim">{{ co.name }}</span>
                </li>
                <li v-if="mod.companies.length > MAX_VISIBLE_ITEMS" class="cb-col-more">
                  <button
                    type="button"
                    class="cb-col-more-btn"
                    @click="openPopup(phase, mod)"
                  >
                    <UIcon name="i-lucide-more-horizontal" class="size-3.5" />
                    展示更多 ({{ mod.companies.length - MAX_VISIBLE_ITEMS }})
                  </button>
                </li>
              </template>
              <li v-else class="cb-col-empty">暂无数据</li>
            </ul>
          </article>
          <article
            v-if="!phase.children.length"
            class="cb-col cb-col--empty"
            :style="{ '--tc': phase.color, flex: phaseFlex(phase) }"
          >
            <div class="cb-col-head cb-col-head--ghost">{{ phase.name }}</div>
            <div class="cb-col-empty">暂无子模块</div>
          </article>
        </template>
      </div>
    </section>

    <!-- 其他环节 -->
    <section v-if="othersCards.length" class="cb-others">
      <header class="cb-others-head">
        <h3>
          <UIcon name="i-lucide-puzzle" class="size-4" />
          其他环节
        </h3>
      </header>
      <div class="cb-others-grid">
        <article
          v-for="(card, idx) in othersCards"
          :key="card.module.id"
          class="cb-other"
          :style="{ '--card': cardColors[idx % cardColors.length] }"
        >
          <button
            type="button"
            class="cb-other-head"
            :class="{ on: selectedId === card.module.id }"
            :data-node-id="card.module.id"
            @click="emit('select', card.module.id)"
          >
            <span class="cb-other-head-dot" />
            {{ card.module.name }}
          </button>
          <ul class="cb-other-list">
            <template v-if="card.module.children.length">
              <li v-for="item in visibleItems(card.module)" :key="item.id">
                <button
                  type="button"
                  class="cb-other-item"
                  :class="{ on: selectedId === item.id }"
                  :data-node-id="item.id"
                  @click="emit('select', item.id)"
                >
                  {{ item.name }}
                </button>
              </li>
              <li v-if="card.module.children.length > MAX_VISIBLE_ITEMS" class="cb-col-more">
                <button
                  type="button"
                  class="cb-col-more-btn"
                  @click="openPopup(othersPhase!.children.find(c => c.id === card.module.id) ? null : null, card.module)"
                >
                  <UIcon name="i-lucide-more-horizontal" class="size-3.5" />
                  展示更多 ({{ card.module.children.length - MAX_VISIBLE_ITEMS }})
                </button>
              </li>
            </template>
            <template v-else-if="card.module.companies.length">
              <li v-for="co in visibleCompanies(card.module)" :key="co.code + co.name">
                <NuxtLink
                  v-if="isValidCode(co.code)"
                  :to="companyUrl(co.code)"
                  class="cb-other-item cb-other-item--link"
                >
                  {{ co.name }}
                </NuxtLink>
                <span v-else class="cb-other-item dim">{{ co.name }}</span>
              </li>
              <li v-if="card.module.companies.length > MAX_VISIBLE_ITEMS" class="cb-col-more">
                <button
                  type="button"
                  class="cb-col-more-btn"
                  @click="openPopup(null, card.module)"
                >
                  <UIcon name="i-lucide-more-horizontal" class="size-3.5" />
                  展示更多 ({{ card.module.companies.length - MAX_VISIBLE_ITEMS }})
                </button>
              </li>
            </template>
            <li v-else class="cb-col-empty">暂无数据</li>
          </ul>
        </article>
      </div>
    </section>

    <div v-if="!chainPhases.length && !othersCards.length" class="cb-empty">暂无数据</div>

    <!-- 弹窗 - 展示所有子项 -->
    <Teleport to="body">
      <Transition name="cb-popup">
        <div v-if="popupVisible" class="cb-popup-overlay" @click.self="closePopup">
          <div class="cb-popup-panel">
            <div class="cb-popup-header">
              <div class="cb-popup-header-info">
                <span class="cb-popup-badge" :style="{ background: popupPhase?.color || '#6366f1', color: '#fff' }">
                  {{ popupPhase?.name || '' }}
                </span>
                <span class="cb-popup-arrow">
                  <UIcon name="i-lucide-chevron-right" class="size-3.5" />
                </span>
                <h3 class="cb-popup-title">{{ popupModule?.name || '' }}</h3>
              </div>
              <button class="cb-popup-close" @click="closePopup">
                <UIcon name="i-lucide-x" class="size-5" />
              </button>
            </div>
            <div class="cb-popup-body">
              <!-- 子分类 -->
              <template v-if="popupModule?.children?.length">
                <div class="cb-popup-subtitle">子分类（{{ popupModule.children.length }}）</div>
                <div class="cb-popup-grid">
                  <button
                    v-for="item in popupModule.children"
                    :key="item.id"
                    type="button"
                    class="cb-popup-item"
                    :class="{ on: selectedId === item.id }"
                    :data-node-id="item.id"
                    @click="emit('select', item.id); closePopup()"
                  >
                    {{ item.name }}
                  </button>
                </div>
              </template>
              <!-- 企业列表 -->
              <template v-if="popupModule?.companies?.length">
                <div class="cb-popup-subtitle">企业列表（{{ popupModule.companies.length }}）</div>
                <div class="cb-popup-grid">
                  <template v-for="co in popupModule.companies" :key="co.code + co.name">
                    <NuxtLink
                      v-if="isValidCode(co.code)"
                      :to="companyUrl(co.code)"
                      class="cb-popup-item cb-popup-item--link"
                    >
                      {{ co.name }}
                    </NuxtLink>
                    <span v-else class="cb-popup-item dim">{{ co.name }}</span>
                  </template>
                </div>
              </template>
              <div v-if="!popupModule?.children?.length && !popupModule?.companies?.length" class="cb-popup-empty">
                暂无数据
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
export type MindChainNode = {
  id: string
  key: string
  name: string
  count: number
  color: string
  icon: string
  companies: { code: string; name: string }[]
  children: MindChainNode[]
}

const CHAIN_KEYS = new Set(['up', 'middle', 'midlle', 'down'])
const MAX_VISIBLE_ITEMS = 8
const route = useRoute()
const cardColors = ['#c2780a', '#2d7a4f', '#1a7a72', '#9a7b0a', '#8b4513', '#5c4d7a', '#3d6b8e', '#6b5344']

const phaseIcons: Record<string, string> = {
  up: 'i-lucide-arrow-up-circle',
  middle: 'i-lucide-circle',
  midlle: 'i-lucide-circle',
  down: 'i-lucide-arrow-down-circle',
}

const props = defineProps<{
  phases: MindChainNode[]
  selectedId?: string
}>()

const emit = defineEmits<{ select: [id: string] }>()

const wrapRef = ref<HTMLElement>()

const chainPhases = computed(() => props.phases.filter(p => CHAIN_KEYS.has(p.key)))

const othersPhase = computed(() => props.phases.find(p => p.key === 'others') ?? null)

const othersCards = computed(() => {
  const phase = othersPhase.value
  if (!phase) return []
  if (phase.children.length) return phase.children.map(mod => ({ module: mod }))
  return [{ module: phase }]
})

// 弹窗控制
const popupVisible = ref(false)
const popupPhase = ref<MindChainNode | null>(null)
const popupModule = ref<MindChainNode | null>(null)

function openPopup(phase: MindChainNode | null, module: MindChainNode | null) {
  popupPhase.value = phase
  popupModule.value = module
  popupVisible.value = true
}

function closePopup() {
  popupVisible.value = false
}

function visibleItems(mod: MindChainNode) {
  return mod.children.slice(0, MAX_VISIBLE_ITEMS)
}

function visibleCompanies(mod: MindChainNode) {
  return mod.companies.slice(0, MAX_VISIBLE_ITEMS)
}

function phaseFlex(phase: MindChainNode) {
  return Math.max(phase.children.length, 1)
}

function isValidCode(c: string) {
  return Boolean(c && c !== 'null' && !c.startsWith('item-'))
}

function companyUrl(code: string) {
  return {
    path: '/company-detail',
    query: { id: code, from: route.fullPath },
  }
}

function focusNode(id: string) {
  if (!id || !wrapRef.value) return
  nextTick(() => {
    wrapRef.value?.querySelector(`[data-node-id="${id}"]`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    })
  })
}

defineExpose({ focusNode })

watch(() => props.selectedId, (id) => { if (id) focusNode(id) })
</script>

<style scoped>
.cb {
  width: 100%;
  padding-bottom: 32px;
  --cb-radius: 14px;
}

/* ── 主体区域 ── */
.cb-main {
  border: 1px solid var(--border);
  border-radius: var(--cb-radius);
  overflow: hidden;
  background: var(--surface);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

/* ── 头部 ── */
.cb-main-head {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(135deg, var(--surface) 0%, var(--surface-alt) 100%);
}

.cb-main-head-inner {
  display: flex;
  align-items: center;
  gap: 14px;
}

.cb-main-head-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  flex-shrink: 0;
}

.cb-main-head h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: 0.02em;
}

.cb-main-head p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

/* ── 流程导航条 ── */
.cb-flow {
  display: flex;
  border-bottom: 1px solid var(--border);
  background: var(--surface-alt);
  position: relative;
}

.cb-flow::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4);
  border-radius: 3px 3px 0 0;
}

.cb-flow-seg {
  --tc: var(--primary);
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 52px;
  padding: 0 20px;
  border-right: 1px solid var(--border);
  transition: background 0.2s;
}

.cb-flow-seg:last-child { border-right: 0; }

.cb-flow-seg:hover {
  background: color-mix(in srgb, var(--tc) 5%, var(--surface-alt));
}

.cb-flow-seg:not(:last-child)::after {
  content: '';
  position: absolute;
  right: -9px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 8px solid var(--border);
  z-index: 2;
}

.cb-flow-seg:not(:last-child)::before {
  content: '';
  position: absolute;
  right: -7px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left: 7px solid var(--surface-alt);
  z-index: 3;
}

.cb-flow-icon {
  display: flex;
  align-items: center;
  color: var(--tc);
  opacity: 0.8;
}

.cb-flow-label {
  font-size: 14px;
  font-weight: 700;
  color: var(--tc);
}

.cb-flow-count {
  font-size: 10px;
  color: var(--text-muted);
  background: color-mix(in srgb, var(--tc) 10%, transparent);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

/* ── 模块列 ── */
.cb-columns {
  display: flex;
  align-items: stretch;
  min-height: 180px;
  overflow-x: auto;
  position: relative;
}

.cb-col {
  --tc: var(--primary);
  flex: 1;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  position: relative;
}

.cb-col:last-child { border-right: 0; }

.cb-col::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--tc);
  opacity: 0;
  transition: opacity 0.2s;
}

.cb-col:hover::before {
  opacity: 0.5;
}

.cb-col-head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 12px 10px;
  border: 0;
  border-bottom: 2px solid var(--tc);
  background: color-mix(in srgb, var(--tc) 6%, var(--surface));
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  text-align: center;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
}

.cb-col-head-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tc);
  flex-shrink: 0;
}

.cb-col-head em {
  font-style: normal;
  font-size: 10px;
  font-weight: 600;
  color: var(--tc);
  padding: 1px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--tc) 12%, transparent);
}

.cb-col-head:hover,
.cb-col-head.on {
  background: color-mix(in srgb, var(--tc) 14%, var(--surface));
}

.cb-col-head--ghost {
  cursor: default;
  opacity: 0.5;
}

.cb-col-list {
  flex: 1;
  list-style: none;
  margin: 0;
  padding: 6px 0 10px;
}

.cb-col-item {
  display: block;
  width: 100%;
  padding: 6px 12px;
  border: 0;
  background: transparent;
  color: var(--text);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, padding-left 0.12s;
  border-left: 2px solid transparent;
}

.cb-col-item:hover,
.cb-col-item.on {
  background: color-mix(in srgb, var(--tc) 8%, transparent);
  color: var(--text-strong);
}

.cb-col-item--link {
  text-decoration: none;
}

.cb-col-item--link.dim {
  opacity: 0.4;
  cursor: default;
}

/* ── 展示更多按钮 ── */
.cb-col-more {
  padding: 4px 8px;
  text-align: center;
}

.cb-col-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border: 1px dashed var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.cb-col-more-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 5%, transparent);
}

.cb-col-empty {
  padding: 16px 12px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

/* ── 其他环节 ── */
.cb-others {
  margin-top: 24px;
  border: 1px solid var(--border);
  border-radius: var(--cb-radius);
  padding: 18px 20px;
  background: var(--surface);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.cb-others-head {
  margin-bottom: 14px;
}

.cb-others-head h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}

.cb-others-head h3 :deep(svg) {
  color: #8b5cf6;
}

.cb-others-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.cb-other {
  --card: #c2780a;
  border: 1px solid color-mix(in srgb, var(--card) 25%, var(--border));
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface);
  transition: box-shadow 0.2s, transform 0.2s;
}

.cb-other:hover {
  box-shadow: 0 4px 16px color-mix(in srgb, var(--card) 15%, transparent);
  transform: translateY(-1px);
}

.cb-other-head {
  width: 100%;
  padding: 10px 14px;
  border: 0;
  border-bottom: 2px solid var(--card);
  background: color-mix(in srgb, var(--card) 8%, var(--surface));
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.cb-other-head-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--card);
  flex-shrink: 0;
}

.cb-other-head:hover,
.cb-other-head.on {
  background: color-mix(in srgb, var(--card) 16%, var(--surface));
}

.cb-other-list {
  list-style: none;
  margin: 0;
  padding: 6px 0 10px;
}

.cb-other-item {
  display: block;
  width: 100%;
  padding: 5px 12px;
  border: 0;
  background: transparent;
  color: var(--text);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  cursor: pointer;
  transition: background 0.12s;
  border-left: 2px solid transparent;
}

.cb-other-item:hover,
.cb-other-item.on {
  background: color-mix(in srgb, var(--card) 8%, transparent);
  color: var(--text-strong);
}

.cb-other-item--link {
  text-decoration: none;
}

.cb-other-item--link.dim {
  opacity: 0.4;
}

/* ── 弹窗 ── */
.cb-popup-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.cb-popup-panel {
  width: 90vw;
  max-width: 700px;
  max-height: 80vh;
  background: var(--surface);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cb-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-alt);
}

.cb-popup-header-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.cb-popup-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.cb-popup-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
}

.cb-popup-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cb-popup-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}

.cb-popup-close:hover {
  background: var(--surface-alt);
  color: var(--text-strong);
}

.cb-popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.cb-popup-subtitle {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.cb-popup-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}

.cb-popup-item {
  display: block;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
  text-decoration: none;
}

.cb-popup-item:hover {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 5%, var(--surface));
  color: var(--text-strong);
}

.cb-popup-item.on {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 10%, var(--surface));
  color: var(--primary);
}

.cb-popup-item--link {
  text-decoration: none;
}

.cb-popup-item--link.dim {
  opacity: 0.4;
  cursor: default;
}

.cb-popup-empty {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 13px;
}

/* ── 弹窗过渡动画 ── */
.cb-popup-enter-active,
.cb-popup-leave-active {
  transition: opacity 0.25s ease;
}

.cb-popup-enter-active .cb-popup-panel,
.cb-popup-leave-active .cb-popup-panel {
  transition: transform 0.25s ease;
}

.cb-popup-enter-from,
.cb-popup-leave-to {
  opacity: 0;
}

.cb-popup-enter-from .cb-popup-panel {
  transform: scale(0.95) translateY(10px);
}

.cb-popup-leave-to .cb-popup-panel {
  transform: scale(0.95) translateY(10px);
}

/* ── 空状态 ── */
.cb-empty {
  padding: 48px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}
</style>