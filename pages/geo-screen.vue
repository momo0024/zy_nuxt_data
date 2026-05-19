<template>
  <ClientOnly>
    <div ref="screenRef" class="geo-screen" :class="{ 'geo-fullscreen': isFullscreen }">

      <!-- ── 顶部工具栏 ────────────────────────────── -->
      <div class="gs-toolbar">
        <div class="gs-toolbar-left">
          <span class="gs-title-icon">
            <UIcon name="i-lucide-map-pin" class="size-[15px]" />
          </span>
          <span class="gs-title">高新区企业地图</span>
          <span class="gs-breadcrumb">
            <span class="gs-crumb-badge">{{ zoneCompanies.length }} 家</span>
          </span>
        </div>
        <div class="gs-toolbar-right">
          <div class="gs-btn-group">
            <button class="gs-tool-btn" title="缩小" @click="zoomOut">
              <UIcon name="i-lucide-minus" class="size-3.5" />
            </button>
            <button class="gs-tool-btn" title="放大" @click="zoomIn">
              <UIcon name="i-lucide-plus" class="size-3.5" />
            </button>
            <button class="gs-tool-btn" title="重置视图" @click="resetView">
              <UIcon name="i-lucide-rotate-ccw" class="size-3.5" />
            </button>
          </div>
          <div class="gs-quick-btns">
            <button
              class="gs-quick-btn"
              :class="{ 'gs-quick-active': quickView === 'zone' }"
              @click="setQuickView('zone')"
            >
              <UIcon name="i-lucide-locate-fixed" class="size-3.5" />
              高新区
            </button>
            <button
              class="gs-quick-btn"
              :class="{ 'gs-quick-active': quickView === 'wuhan' }"
              @click="setQuickView('wuhan')"
            >
              <UIcon name="i-lucide-building" class="size-3.5" />
              武汉市
            </button>
          </div>
          <button class="gs-tool-btn gs-fullscreen-btn" :title="isFullscreen ? '退出全屏' : '全屏'" @click="toggleFullscreen">
            <UIcon :name="isFullscreen ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'" class="size-3.5" />
          </button>
        </div>
      </div>

      <!-- ── 主内容区 ──────────────────────────────── -->
      <div class="gs-main">

        <!-- 地图区域 -->
        <div class="gs-map-wrap">

          <!-- 统计浮层 (左上) -->
          <div class="gs-stats-overlay">
            <div class="gs-stat">
              <div class="gs-stat-num">{{ zoneCompanies.length }}</div>
              <div class="gs-stat-lbl">高新企业</div>
            </div>
            <div class="gs-stat-sep" />
            <div class="gs-stat">
              <div class="gs-stat-num">东湖高新区</div>
              <div class="gs-stat-lbl">范围</div>
            </div>
            <div class="gs-stat-sep" />
            <div class="gs-stat">
              <div class="gs-stat-num">{{ industryCount }}</div>
              <div class="gs-stat-lbl">行业类别</div>
            </div>
          </div>

          <!-- 图例 (左下) -->
          <div class="gs-legend">
            <span class="gs-legend-title">区域高亮</span>
            <div class="gs-legend-items">
              <div class="gs-legend-item">
                <span class="gs-legend-swatch gs-swatch-china" />
                <span>悬停省界</span>
              </div>
              <div class="gs-legend-item">
                <span class="gs-legend-swatch gs-swatch-province" />
                <span>湖北省界</span>
              </div>
              <div class="gs-legend-item">
                <span class="gs-legend-swatch gs-swatch-city" />
                <span>悬停市区</span>
              </div>
              <div class="gs-legend-item">
                <span class="gs-legend-swatch gs-swatch-wuhan" />
                <span>武汉市</span>
              </div>
              <div class="gs-legend-item">
                <span class="gs-legend-swatch gs-swatch-zone" />
                <span>高新区范围</span>
              </div>
            </div>

          </div>

          <!-- Leaflet 高德地图 -->
          <div ref="mapContainerRef" class="gs-leaflet-map" />

          <!-- 加载中 -->
          <div v-if="!mapReady" class="gs-loading gs-loading-overlay">
            <div class="gs-loading-ring" />
            <div class="gs-loading-text">地图数据加载中…</div>
          </div>
        </div>

        <!-- 收起后展开按钮 -->
        <button
          v-if="!panelOpen"
          type="button"
          class="gs-panel-reopen"
          title="展开企业列表"
          @click="panelOpen = true"
        >
          <UIcon name="i-lucide-panel-left-open" class="size-4" />
          <span>企业列表</span>
        </button>

        <!-- 右侧企业列表面板 -->
        <Transition name="cp-slide">
          <div v-if="panelOpen" class="gs-company-panel">
            <div class="cp-header">
              <UIcon name="i-lucide-building-2" class="size-[15px] text-primary flex-shrink-0" />
              <span class="cp-title">{{ panelTitle }}</span>
              <span class="cp-count">{{ filteredCompanies.length }} 家</span>
              <button
                type="button"
                class="cp-close"
                title="关闭列表"
                @click="panelOpen = false"
              >
                <UIcon name="i-lucide-x" class="size-4" />
              </button>
            </div>

            <div class="cp-search-wrap">
              <UIcon name="i-lucide-search" class="cp-search-icon size-3.5" />
              <input
                v-model="companySearch"
                class="cp-search-input"
                placeholder="搜索名称 / 行业 / 标签…"
              />
            </div>

            <div class="cp-list">
              <div
                v-for="c in filteredCompanies"
                :key="c.id"
                class="cp-item"
                :class="{ 'cp-item-highlighted': highlightedCompanyId === c.id }"
                @click="openDetail(c)"
              >
                <div class="cp-avatar" :style="{ background: getIndustryColor(c.industry) }">
                  {{ c.name.charAt(0) }}
                </div>
                <div class="cp-info">
                  <div class="cp-name">{{ c.name }}</div>
                  <div class="cp-meta">
                    <span class="cp-city">
                      <UIcon name="i-lucide-map-pin" class="size-3 inline-block mr-0.5" />
                      {{ c.city }}
                    </span>
                    <span :class="['cp-type', getTypeCls(c.type)]">{{ c.type }}</span>
                  </div>
                  <div class="cp-tags">
                    <span v-for="t in c.tags.slice(0, 2)" :key="t" class="cp-tag">{{ t }}</span>
                  </div>
                </div>
                <div class="cp-emp">
                  <div class="cp-emp-num">{{ fmtNum(c.employees) }}</div>
                  <div class="cp-emp-lbl">员工</div>
                </div>
              </div>

              <div v-if="filteredCompanies.length === 0" class="cp-empty">
                <UIcon name="i-lucide-building-x" class="size-10 opacity-20" />
                <span>暂无匹配企业</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- ── 企业详情弹窗 ──────────────────────────── -->
      <Transition name="cd-fade">
        <div v-if="detailCompany" class="cd-overlay" @click.self="closeDetail">
          <div class="cd-panel">
            <button class="cd-close" @click="closeDetail">
              <UIcon name="i-lucide-x" class="size-4" />
            </button>
            <div class="cd-header">
              <div class="cd-logo" :style="{ background: getIndustryColor(detailCompany.industry) }">
                {{ detailCompany.name.slice(0, 2) }}
              </div>
              <div class="cd-title-wrap">
                <div class="cd-name-row">
                  <div class="cd-name">{{ detailCompany.name }}</div>
                  <a
                    class="cd-detail-link"
                    :href="`/company-detail?id=${detailCompany.id}`"
                    target="_blank"
                    title="查看企业详情"
                    @click.stop
                  >
                    <span>查看详情</span>
                    <UIcon name="i-lucide-external-link" class="size-3.5" />
                  </a>
                </div>
                <div class="cd-sub">
                  <span :class="['cd-type-badge', getTypeCls(detailCompany.type)]">{{ detailCompany.type }}</span>
                  <span class="cd-industry">{{ detailCompany.industry }}</span>
                  <span class="cd-founded">成立 {{ detailCompany.founded }} 年</span>
                </div>
              </div>
            </div>
            <div class="cd-body">
              <p class="cd-desc">{{ detailCompany.description }}</p>
              <div class="cd-metrics">
                <div class="cd-metric">
                  <UIcon name="i-lucide-users" class="size-[18px] text-primary flex-shrink-0" />
                  <div>
                    <div class="cd-metric-val">{{ fmtNum(detailCompany.employees) }}</div>
                    <div class="cd-metric-lbl">在职员工</div>
                  </div>
                </div>
                <div class="cd-metric">
                  <UIcon name="i-lucide-trending-up" class="size-[18px] text-success flex-shrink-0" />
                  <div>
                    <div class="cd-metric-val">{{ detailCompany.revenue }}</div>
                    <div class="cd-metric-lbl">年营收</div>
                  </div>
                </div>
                <div class="cd-metric">
                  <UIcon name="i-lucide-map-pin" class="size-[18px] text-warning flex-shrink-0" />
                  <div>
                    <div class="cd-metric-val">{{ detailCompany.city }}</div>
                    <div class="cd-metric-lbl">所在城市</div>
                  </div>
                </div>
              </div>
              <div class="cd-tags">
                <UBadge v-for="t in detailCompany.tags" :key="t" :label="t" variant="soft" color="primary" size="sm" />
              </div>
              <div class="cd-info-list">
                <div class="cd-info-row">
                  <UIcon name="i-lucide-map-pin" class="size-3.5 opacity-40 flex-shrink-0" />
                  <span class="cd-info-key">地址</span>
                  <span class="cd-info-val">{{ detailCompany.address }}</span>
                </div>
                <div class="cd-info-row">
                  <UIcon name="i-lucide-phone" class="size-3.5 opacity-40 flex-shrink-0" />
                  <span class="cd-info-key">电话</span>
                  <span class="cd-info-val">{{ detailCompany.phone }}</span>
                </div>
                <div class="cd-info-row">
                  <UIcon name="i-lucide-globe" class="size-3.5 opacity-40 flex-shrink-0" />
                  <span class="cd-info-key">网站</span>
                  <span class="cd-info-val text-primary">{{ detailCompany.website }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { COMPANIES } from '~/data/mock'
import type { CompanyRecord } from '~/data/mock'
import {
  getIndustryColor,
  useGeoLeafletMap,
  type RegionSelectPayload,
} from '~/composables/useGeoLeafletMap'

definePageMeta({ middleware: 'auth' })

const {
  mapContainerRef,
  mapReady,
  quickView,
  initMap,
  destroyMap,
  zoomIn,
  zoomOut,
  resetView,
  setQuickView,
  invalidateSize,
} = useGeoLeafletMap()

const screenRef = ref<HTMLDivElement>()
const zoneCompanies = ref<CompanyRecord[]>([])
const detailCompany = ref<CompanyRecord | null>(null)
const companySearch = ref('')
const isFullscreen = ref(false)
const highlightedCompanyId = ref<string | null>(null)
const panelOpen = ref(true)
const selectedRegion = ref<RegionSelectPayload | null>(null)

const industryCount = computed(() => new Set(zoneCompanies.value.map(c => c.industry)).size)

const panelTitle = computed(() => {
  const r = selectedRegion.value
  if (r?.type === 'city') return `${r.name} · 企业`
  if (r?.type === 'zone') return '高新区企业'
  return '高新区企业'
})

const filteredCompanies = computed(() => {
  let list = zoneCompanies.value
  const region = selectedRegion.value
  if (region?.type === 'city') {
    list = list.filter(c => c.city === region.name)
  }
  const q = companySearch.value.trim().toLowerCase()
  if (q) {
    list = list.filter(c =>
      c.name.toLowerCase().includes(q)
      || c.industry.toLowerCase().includes(q)
      || c.tags.some(t => t.toLowerCase().includes(q)),
    )
  }
  return list
})

onMounted(async () => {
  try {
    const list = await initMap(COMPANIES, {
      onCompany: company => openDetail(company),
      onRegion: payload => onRegionSelect(payload),
    })
    zoneCompanies.value = list ?? []
  }
  catch (e) {
    console.error('[geo-screen] 加载地图数据失败', e)
  }
  document.addEventListener('fullscreenchange', onFsChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFsChange)
  destroyMap()
})

watch(isFullscreen, () => {
  nextTick(() => invalidateSize())
})

watch(panelOpen, () => {
  nextTick(() => invalidateSize())
  setTimeout(() => invalidateSize(), 100)
  setTimeout(() => invalidateSize(), 280)
})

function toggleFullscreen() {
  if (!document.fullscreenElement) screenRef.value?.requestFullscreen()
  else document.exitFullscreen()
}

function onFsChange() {
  isFullscreen.value = !!document.fullscreenElement
  nextTick(() => invalidateSize())
}

function onRegionSelect(payload: RegionSelectPayload) {
  selectedRegion.value = payload
  panelOpen.value = true
  companySearch.value = ''
  nextTick(() => invalidateSize())
}

function openDetail(company: CompanyRecord) {
  detailCompany.value = company
  highlightedCompanyId.value = company.id
}

function closeDetail() {
  detailCompany.value = null
}

function getTypeCls(type: string): string {
  return ({ '国企': 'type-state', '民企': 'type-private', '外资': 'type-foreign', '上市公司': 'type-listed' })[type] || ''
}

function fmtNum(n: number): string {
  if (n >= 100000) return `${(n / 10000).toFixed(0)}万`
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return `${n}`
}
</script>

<style scoped>
/* ── 容器 ─────────────────────────────────────────────── */
.geo-screen {
  position: relative;
  display: flex;
  flex-direction: column;
  margin: -24px;
  height: calc(100vh - 90px);
  min-height: 480px;
  overflow: hidden;
  background: #eef2f7;
}
.geo-fullscreen {
  margin: 0;
  height: 100vh;
}

/* ── 工具栏 ────────────────────────────────────────────── */
.gs-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 46px;
  min-height: 46px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid #e2e8f0;
  backdrop-filter: blur(12px);
  z-index: 10;
  flex-shrink: 0;
}
.gs-toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.gs-title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: color-mix(in srgb, var(--primary) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
  border-radius: 7px;
  color: var(--primary);
}
.gs-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.5px;
}
.gs-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 13px;
}
.gs-crumb-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 9px;
  font-size: 11px;
  font-weight: 600;
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
}
.gs-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── 视图层级指示器 ──────────────────────────────────────── */
/* ── 按钮组 ────────────────────────────────────────────── */
.gs-btn-group {
  display: flex;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}
.gs-tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  background: #fff;
  border: none;
  color: #64748b;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.gs-tool-btn:hover {
  background: #f1f5f9;
  color: #2563eb;
}
.gs-btn-group .gs-tool-btn + .gs-tool-btn {
  border-left: 1px solid #e2e8f0;
}
.gs-fullscreen-btn {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

/* ── 快速视图按钮 ────────────────────────────────────── */
.gs-quick-btns {
  display: flex;
  gap: 6px;
}
.gs-quick-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 600;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.gs-quick-btn:hover {
  background: #f8fafc;
  color: #2563eb;
  border-color: #93c5fd;
}
.gs-quick-btn.gs-quick-active {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #3b82f6;
}

/* ── Leaflet 高德地图 ───────────────────────────────────── */
.gs-leaflet-map {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.gs-leaflet-map :deep(.leaflet-container) {
  width: 100%;
  height: 100%;
  background: #e8eef5;
  font-family: inherit;
}
.gs-leaflet-map :deep(.leaflet-control-attribution) {
  display: none !important;
}
.gs-leaflet-map :deep(.gs-outside-blur) {
  position: absolute;
  inset: 0;
  z-index: 400;
  pointer-events: none;
  backdrop-filter: blur(1.5px);
  -webkit-backdrop-filter: blur(1.5px);
}
.gs-leaflet-map :deep(.leaflet-interactive:focus) {
  outline: none !important;
}
.gs-leaflet-map :deep(.leaflet-tooltip) {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #e2e8f0;
  color: #334155;
  font-size: 12px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
}
.gs-leaflet-map :deep(.gs-city-tooltip) {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ea580c;
  box-shadow: none;
  color: #c2410c;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  pointer-events: none;
}
.gs-leaflet-map :deep(.gs-company-icon) {
  background: transparent !important;
  border: none !important;
}
.gs-leaflet-map :deep(.gs-company-dot) {
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.65);
}
.gs-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: #eef2f7;
}

/* ── 主区域 ────────────────────────────────────────────── */
.gs-main {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

/* ── 地图区 ────────────────────────────────────────────── */
.gs-map-wrap {
  flex: 1;
  position: relative;
  overflow: hidden;
}
/* ── 统计浮层 ──────────────────────────────────────────── */
.gs-stats-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 5px 2px;
  z-index: 5;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}
.gs-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 10px;
}
.gs-stat-num {
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-display);
  color: #1d4ed8;
  line-height: 1.15;
}
.gs-stat-lbl {
  font-size: 9px;
  color: #64748b;
  margin-top: 2px;
  white-space: nowrap;
}
.gs-stat-sep {
  width: 1px;
  height: 22px;
  background: #e2e8f0;
}

/* ── 图例 ──────────────────────────────────────────────── */
.gs-legend {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 5px 8px;
  z-index: 5;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}
.gs-legend-title {
  display: block;
  font-size: 9px;
  color: #94a3b8;
  margin-bottom: 3px;
}
.gs-legend-items {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 2px;
}
.gs-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: #475569;
}
.gs-legend-swatch {
  width: 11px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}
.gs-swatch-china {
  background: transparent;
  border: 1.5px dashed #94a3b8;
}
.gs-swatch-province {
  background: transparent;
  border: 2px solid #4a9eff;
}
.gs-swatch-city {
  background: #fed7aa;
  border: 2px solid #ea580c;
}
.gs-swatch-wuhan {
  background: transparent;
  border: 2.5px solid #2dd4bf;
  box-shadow: 0 0 6px rgba(45, 212, 191, 0.45);
}
.gs-swatch-zone {
  background: transparent;
  border: 3px dashed #7c3aed;
}

/* ── 加载中 ─────────────────────────────────────────────── */
.gs-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 14px;
}
.gs-loading-ring {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid rgba(74, 138, 255, 0.15);
  border-top-color: #4a8aff;
  animation: gs-spin 0.9s linear infinite;
}
@keyframes gs-spin { to { transform: rotate(360deg); } }
.gs-loading-text {
  font-size: 13px;
  color: rgba(126, 200, 255, 0.4);
}

/* ── 右侧企业面板 ──────────────────────────────────────── */
.gs-panel-reopen {
  flex-shrink: 0;
  width: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 4px;
  font-size: 10px;
  font-weight: 600;
  color: #475569;
  background: rgba(255, 255, 255, 0.96);
  border: none;
  border-left: 1px solid #e2e8f0;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  letter-spacing: 1px;
}
.gs-panel-reopen:hover {
  color: #2563eb;
  background: #f8fafc;
}
.gs-company-panel {
  width: 310px;
  min-width: 310px;
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--surface) 97%, transparent);
  border-left: 1px solid var(--border);
  overflow: hidden;
  flex-shrink: 0;
}
.cp-slide-enter-active,
.cp-slide-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}
.cp-slide-enter-from,
.cp-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
.cp-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 12px 14px;
  background: var(--surface-alt);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.cp-title {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cp-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--primary) 22%, transparent);
  border-radius: 999px;
  padding: 2px 9px;
  flex-shrink: 0;
}
.cp-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}
.cp-close:hover {
  background: color-mix(in srgb, var(--danger) 12%, transparent);
  color: var(--danger);
}
.cp-search-wrap {
  position: relative;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.cp-search-icon {
  position: absolute;
  left: 22px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}
.cp-search-input {
  width: 100%;
  height: 30px;
  padding: 0 10px 0 30px;
  font-size: 12px;
  border-radius: 8px !important;
}
.cp-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.cp-list::-webkit-scrollbar { width: 3px; }
.cp-list::-webkit-scrollbar-track { background: transparent; }
.cp-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
.cp-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  margin-bottom: 4px;
  border: 1px solid transparent;
}
.cp-item:hover {
  background: color-mix(in srgb, var(--primary) 8%, var(--surface-alt));
}
.cp-item-highlighted {
  background: color-mix(in srgb, var(--primary) 12%, var(--surface-alt));
  border-color: color-mix(in srgb, var(--primary) 30%, transparent);
}
.cp-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
  opacity: 0.92;
}
.cp-info { flex: 1; min-width: 0; }
.cp-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cp-meta { display: flex; align-items: center; gap: 6px; margin-top: 3px; }
.cp-city { font-size: 11px; color: var(--text-muted); display: flex; align-items: center; }
.cp-type { font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 4px; }
.type-state   { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
.type-private { background: rgba(34, 197, 94, 0.15);  color: #4ade80; }
.type-foreign { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.type-listed  { background: rgba(236, 72, 153, 0.15); color: #f472b6; }
.cp-tags { display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap; }
.cp-tag {
  font-size: 10px;
  padding: 0 6px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  background: var(--surface-alt);
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 4px;
}
.cp-emp { text-align: right; flex-shrink: 0; }
.cp-emp-num { font-size: 13px; font-weight: 700; color: var(--text-strong); font-family: var(--font-display); }
.cp-emp-lbl { font-size: 10px; color: var(--text-muted); }
.cp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 20px;
  color: var(--text-muted);
  font-size: 12px;
}

/* ── 企业详情弹窗 ──────────────────────────────────────── */
.cd-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 24px;
}
.cd-panel {
  position: relative;
  width: 100%;
  max-width: 540px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--shadow-xl), 0 0 60px rgba(99, 102, 241, 0.12);
}
.cd-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}
.cd-close:hover {
  background: color-mix(in srgb, var(--danger) 12%, transparent);
  color: var(--danger);
}
.cd-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 20px 16px;
  background: color-mix(in srgb, var(--surface-alt) 80%, transparent);
  border-bottom: 1px solid var(--border);
}
.cd-logo {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
}
.cd-title-wrap { flex: 1; min-width: 0; }
.cd-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cd-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.cd-name-row .cd-name {
  flex: 1;
  min-width: 0;
}
.cd-detail-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--primary);
  white-space: nowrap;
  text-decoration: none;
  transition: color 0.15s;
  flex-shrink: 0;
}
.cd-detail-link:hover {
  color: color-mix(in srgb, var(--primary) 80%, #000);
  text-decoration: underline;
}
.cd-sub { display: flex; align-items: center; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
.cd-type-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 5px; }
.cd-industry { font-size: 12px; color: var(--text-muted); }
.cd-founded { font-size: 11px; color: var(--text-muted); }
.cd-body {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 220px);
}
.cd-body::-webkit-scrollbar { width: 3px; }
.cd-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
.cd-desc {
  font-size: 13px;
  line-height: 1.75;
  color: var(--text);
  margin-bottom: 18px;
  padding: 12px 14px;
  background: var(--surface-alt);
  border-radius: 10px;
  border-left: 3px solid var(--primary);
}
.cd-metrics { display: flex; gap: 10px; margin-bottom: 16px; }
.cd-metric {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.cd-metric-val {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-strong);
  font-family: var(--font-display);
  white-space: nowrap;
}
.cd-metric-lbl { font-size: 10px; color: var(--text-muted); margin-top: 2px; }
.cd-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
.cd-info-list { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
.cd-info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 12px;
  border-bottom: 1px solid var(--border);
}
.cd-info-row:last-child { border-bottom: none; }
.cd-info-key { color: var(--text-muted); min-width: 28px; flex-shrink: 0; }
.cd-info-val { color: var(--text); flex: 1; }

/* ── 过渡动画 ──────────────────────────────────────────── */
.cd-fade-enter-active { transition: opacity 0.22s ease; }
.cd-fade-leave-active { transition: opacity 0.16s ease; }
.cd-fade-enter-from, .cd-fade-leave-to { opacity: 0; }

.gs-crumb-enter-active { transition: all 0.2s ease; }
.gs-crumb-leave-active { transition: all 0.15s ease; }
.gs-crumb-enter-from, .gs-crumb-leave-to { opacity: 0; transform: translateX(-8px); }

</style>
