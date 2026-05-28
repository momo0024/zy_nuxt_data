<template>
  <ClientOnly>
    <div ref="screenRef" class="geo-screen" :class="{ 'geo-fullscreen': isFullscreen }">

      <!-- ── 顶部工具栏 ────────────────────────────── -->
      <div class="gs-toolbar" @click="closeMenus">
        <div class="gs-toolbar-left">
          <span class="gs-title-icon">
            <UIcon name="i-lucide-map-pin" class="size-[15px]" />
          </span>
          <span class="gs-title">企业地图</span>
          <span class="gs-breadcrumb">
            <span class="gs-crumb-badge">{{ companyTotal }} 家</span>
          </span>
        </div>
        <div class="gs-toolbar-right">
          <!-- 区域选择下拉 -->
          <div class="gs-area-select" @click.stop>
            <button class="gs-area-btn" @click="showAreaDropdown = !showAreaDropdown">
              <UIcon :name="areaOptions.find(a => a.value === selectedAreaView)?.icon || 'i-lucide-locate-fixed'" class="size-3.5" />
              <span>{{ areaOptions.find(a => a.value === selectedAreaView)?.label }}</span>
              <UIcon name="i-lucide-chevron-down" class="size-3" />
            </button>
            <Transition name="gs-dropdown">
              <div v-if="showAreaDropdown" class="gs-dropdown">
                <button
                  v-for="opt in areaOptions"
                  :key="opt.value"
                  class="gs-dropdown-item"
                  :class="{ 'gs-dropdown-active': selectedAreaView === opt.value }"
                  @click="handleAreaChange(opt.value); showAreaDropdown = false"
                >
                  <UIcon :name="opt.icon" class="size-3.5" />
                  <span>{{ opt.label }}</span>
                  <UIcon v-if="selectedAreaView === opt.value" name="i-lucide-check" class="size-3 gs-dropdown-check" />
                </button>
              </div>
            </Transition>
          </div>

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

          <!-- 主题切换 -->
          <div class="gs-theme-wrap" @click.stop>
            <button class="gs-tool-btn" title="地图主题" @click="toggleThemeMenu">
              <UIcon :name="themeOptions.find(t => t.value === currentTheme)?.icon || 'i-lucide-map'" class="size-3.5" />
            </button>
            <Transition name="gs-dropdown">
              <div v-if="showThemeMenu" class="gs-dropdown gs-dropdown-right">
                <div class="gs-dropdown-header">地图主题</div>
                <button
                  v-for="opt in themeOptions"
                  :key="opt.value"
                  class="gs-dropdown-item"
                  :class="{ 'gs-dropdown-active': currentTheme === opt.value }"
                  @click="selectTheme(opt.value)"
                >
                  <UIcon :name="opt.icon" class="size-3.5" />
                  <span>{{ opt.label }}</span>
                  <UIcon v-if="currentTheme === opt.value" name="i-lucide-check" class="size-3 gs-dropdown-check" />
                </button>
              </div>
            </Transition>
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
              <div class="gs-stat-num">{{ companyTotal }}</div>
              <div class="gs-stat-lbl">企业总数</div>
            </div>
            <div class="gs-stat-sep" />
            <div class="gs-stat">
              <div class="gs-stat-num">{{ listedCount }}</div>
              <div class="gs-stat-lbl">上市公司</div>
            </div>
            <div class="gs-stat-sep" />
            <div class="gs-stat gs-stat-project">
              <div class="gs-stat-num">{{ majorCount }}</div>
              <div class="gs-stat-lbl">重大项目</div>
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
                <span class="gs-legend-swatch gs-swatch-city" />
                <span>武汉市界</span>
              </div>
              <div class="gs-legend-item">
                <span class="gs-legend-swatch gs-swatch-zone" />
                <span>高新区</span>
              </div>
            </div>

          </div>

          <!-- 高德地图 -->
          <div ref="mapContainerRef" class="gs-map-container" />
          <div class="gs-map-toggle">
            <span class="gs-toggle-label">显示企业名称</span>
            <USwitch
              :model-value="showCompanyLabels"
              @update:model-value="setCompanyLabelVisible"
            />
          </div>

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
        <Transition
          name="cp-slide"
          @after-enter="onPanelLayoutDone"
          @after-leave="onPanelLayoutDone"
        >
          <div v-if="panelOpen" class="gs-company-panel">
            <div class="cp-header">
              <UIcon name="i-lucide-building-2" class="size-[15px] text-primary flex-shrink-0" />
              <span class="cp-title">{{ panelTitle }}</span>
              <span class="cp-count">{{ bubbleCompanies ? bubbleCompanies.length : companyTotal }} 家</span>
              <button
                v-if="bubbleCompanies || selectedRegion"
                type="button"
                class="cp-reset-btn"
                title="重置为全部企业"
                @click="resetPanel()"
              >
                <UIcon name="i-lucide-rotate-ccw" class="size-3.5" />
                <span>重置</span>
              </button>
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
                placeholder="搜索名称 / 信用代码 / 产品 / 区域…"
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
                <div class="cp-avatar" :style="{ background: getIndustryColor(c.product_type) }">
                  {{ c.company_name.charAt(0) }}
                </div>
                <div class="cp-info">
                  <div class="cp-name">
                    {{ c.company_name }}
                    <span v-if="c.company_traded === 1" class="cp-listed-tag">上市</span>
                    <span v-if="c.import_project === 1" class="cp-project-tag">重大项目</span>
                  </div>
                  <div class="cp-meta">
                    <span class="cp-city">
                      <UIcon name="i-lucide-map-pin" class="size-3 inline-block mr-0.5" />
                      {{ c.company_city }} · {{ c.conpany_district || '' }}
                    </span>
                  </div>
                  <div class="cp-tags">
                    <span v-if="c.product_type && c.product_type !== '-'" class="cp-tag">{{ c.product_type }}</span>
                    <span v-if="c.chain_name && c.chain_name !== '-'" class="cp-type-tag">{{ c.chain_name }}</span>
                  </div>
                  <div v-if="c.company_found_date && c.company_found_date !== '-'" class="cp-founded">
                    <UIcon name="i-lucide-calendar" class="size-3" />
                    <span>{{ c.company_found_date }}</span>
                  </div>
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
              <div class="cd-logo" :style="{ background: getIndustryColor(detailCompany.product_type) }">
                {{ detailCompany.company_name.slice(0, 2) }}
              </div>
              <div class="cd-title-wrap">
                <div class="cd-name-row">
                  <div class="cd-name">{{ detailCompany.company_name }}</div>
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
                  <span v-if="detailCompany.company_traded === 1" class="cd-type-badge type-listed">上市公司</span>
                  <span v-if="detailCompany.import_project === 1" class="cd-type-badge type-project">⚡重大项目</span>
                  <span v-if="detailCompany.chain_name && detailCompany.chain_name !== '-'" class="cd-type-badge type-info">{{ detailCompany.chain_name }}</span>
                  <span v-if="detailCompany.product && detailCompany.product !== '-'" class="cd-type-badge type-product">{{ detailCompany.product }}</span>
                  <span v-if="detailCompany.product_type && detailCompany.product_type !== '-'" class="cd-type-badge type-product-type">{{ detailCompany.product_type }}</span>
                </div>
              </div>
            </div>
            <div class="cd-body">
              <div class="cd-metrics">
                <div class="cd-metric">
                  <UIcon name="i-lucide-landmark" class="size-[18px] text-primary flex-shrink-0" />
                  <div>
                    <div class="cd-metric-val" :title="detailCompany.company_registered_capital">{{ detailCompany.company_registered_capital }}</div>
                    <div class="cd-metric-lbl">注册资本</div>
                  </div>
                </div>
                <div class="cd-metric">
                  <UIcon name="i-lucide-map-pin" class="size-[18px] text-warning flex-shrink-0" />
                  <div>
                    <div class="cd-metric-val" :title="`${detailCompany.company_city} · ${detailCompany.conpany_district || ''}`">{{ detailCompany.company_city }} · {{ detailCompany.conpany_district || '' }}</div>
                    <div class="cd-metric-lbl">所在区域</div>
                  </div>
                </div>
                <div class="cd-metric">
                  <UIcon name="i-lucide-activity" class="size-[18px] text-success flex-shrink-0" />
                  <div>
                    <div class="cd-metric-val" :title="detailCompany.company_business_status">{{ detailCompany.company_business_status }}</div>
                    <div class="cd-metric-lbl">经营状态</div>
                  </div>
                </div>
              </div>
              <div class="cd-scope-card">
                <div class="cd-scope-title">
                  <UIcon name="i-lucide-briefcase" class="size-4" />
                  经营范围
                </div>
                <div class="cd-scope-text-wrap">
                  <p
                    class="cd-scope-text"
                    :class="{ 'cd-scope-text-collapsed': !scopeExpanded }"
                  >
                    {{ detailCompany.company_business_scope }}
                  </p>
                  <button
                    v-if="scopeNeedExpand"
                    class="cd-scope-expand-btn"
                    @click="scopeExpanded = !scopeExpanded"
                  >
                    {{ scopeExpanded ? '收起' : '显示更多' }}
                  </button>
                </div>
              </div>
              <div class="cd-info-list">
                <div class="cd-info-row">
                  <UIcon name="i-lucide-user" class="size-3.5 opacity-40 flex-shrink-0" />
                  <span class="cd-info-key">法人</span>
                  <span class="cd-info-val">{{ detailCompany.company_legal_person }}</span>
                </div>
                <div v-if="detailCompany.company_found_date && detailCompany.company_found_date !== '-'" class="cd-info-row">
                  <UIcon name="i-lucide-calendar" class="size-3.5 opacity-40 flex-shrink-0" />
                  <span class="cd-info-key">成立日期</span>
                  <span class="cd-info-val">{{ detailCompany.company_found_date }}</span>
                </div>
                <div class="cd-info-row">
                  <UIcon name="i-lucide-map-pin" class="size-3.5 opacity-40 flex-shrink-0" />
                  <span class="cd-info-key">地址</span>
                  <span class="cd-info-val">{{ detailCompany.company_work_add || detailCompany.conpany_district || '-' }}</span>
                </div>
                <div v-if="detailCompany.contact_info && detailCompany.contact_info !== '-'" class="cd-info-row">
                  <UIcon name="i-lucide-phone" class="size-3.5 opacity-40 flex-shrink-0" />
                  <span class="cd-info-key">联系方式</span>
                  <span class="cd-info-val">{{ detailCompany.contact_info }}</span>
                </div>
                <div v-if="detailCompany.company_website && detailCompany.company_website !== '-'" class="cd-info-row">
                  <UIcon name="i-lucide-globe" class="size-3.5 opacity-40 flex-shrink-0" />
                  <span class="cd-info-key">网站</span>
                  <span class="cd-info-val text-primary">{{ detailCompany.company_website }}</span>
                </div>
                <div v-if="detailCompany.honors && detailCompany.honors !== '-'" class="cd-info-row cd-honors-row">
                  <UIcon name="i-lucide-award" class="size-3.5 opacity-40 flex-shrink-0" />
                  <span class="cd-info-key">荣誉</span>
                  <span class="cd-info-val">{{ detailCompany.honors }}</span>
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
import type { CompanyRecord } from '~/types/company'
import { fetchCompanies, isListedCompany } from '~/types/company'
import {
  getIndustryColor,
  useGeoAmapMap,
  type RegionSelectPayload,
  type MapTheme,
} from '~/composables/useGeoAmapMap'

definePageMeta({ middleware: 'auth' })

const {
  mapContainerRef,
  mapReady,
  quickView,
  showCompanyLabels,
  currentTheme,
  initMap,
  destroyMap,
  zoomIn,
  zoomOut,
  resetView,
  setQuickView,
  setCompanyLabelVisible,
  setMapTheme,
  invalidateSize,
  isInZone,
} = useGeoAmapMap()

const screenRef = ref<HTMLDivElement>()
const allCompanies = ref<CompanyRecord[]>([])
const detailCompany = ref<CompanyRecord | null>(null)
const companySearch = ref('')
const isFullscreen = ref(false)
const highlightedCompanyId = ref<string | null>(null)
const panelOpen = ref(true)
const selectedRegion = ref<RegionSelectPayload | null>(null)
const bubbleCompanies = ref<CompanyRecord[] | null>(null)
const bubbleLabel = ref('')
const pageSize = 500
const companyTotal = ref(0)
const scopeExpanded = ref(false)
const selectedAreaView = ref<'zone' | 'wuhan'>('zone')
const showThemeMenu = ref(false)
const showAreaDropdown = ref(false)

const themeOptions: { value: MapTheme, label: string, icon: string }[] = [
  { value: 'standard', label: '标准', icon: 'i-lucide-map' },
  { value: 'dark', label: '暗色', icon: 'i-lucide-moon' },
  { value: 'satellite', label: '卫星', icon: 'i-lucide-satellite' },
]

const areaOptions = [
  { value: 'zone' as const, label: '高新区', icon: 'i-lucide-locate-fixed' },
  { value: 'wuhan' as const, label: '武汉市', icon: 'i-lucide-building' },
]
const scopeNeedExpand = computed(() => {
  if (!detailCompany.value?.company_business_scope) return false
  const text = detailCompany.value.company_business_scope
  return text.length > 120
})

const listedCount = computed(() => allCompanies.value.filter(c => c.company_traded === 1).length)
const majorCount = computed(() => allCompanies.value.filter(c => c.import_project === 1).length)

function handleAreaChange(val: 'zone' | 'wuhan') {
  selectedAreaView.value = val
  setQuickView(val)
}

function toggleThemeMenu() {
  showThemeMenu.value = !showThemeMenu.value
  showAreaDropdown.value = false
}

function selectTheme(theme: MapTheme) {
  setMapTheme(theme)
  showThemeMenu.value = false
}

function closeMenus() {
  showThemeMenu.value = false
  showAreaDropdown.value = false
}

const panelTitle = computed(() => {
  if (bubbleLabel.value) return bubbleLabel.value
  const r = selectedRegion.value
  if (r?.type === 'city') return `${r.name} · 企业`
  if (r?.type === 'zone') return '高新区企业'
  return '企业列表'
})

const filteredCompanies = computed(() => {
  // 气泡模式：仅从气泡公司中检索
  const bubble = bubbleCompanies.value
  if (bubble) {
    const q = companySearch.value.trim().toLowerCase()
    if (!q) return bubble
    return bubble.filter(c =>
      c.company_name.toLowerCase().includes(q)
      || (c.company_credit_code || '').toLowerCase().includes(q)
      || (c.product_type || '').toLowerCase().includes(q)
      || (c.chain_name || '').toLowerCase().includes(q)
      || (c.product || '').toLowerCase().includes(q)
      || (c.conpany_district || '').toLowerCase().includes(q),
    )
  }
  // 区域模式
  let list = allCompanies.value
  const region = selectedRegion.value
  if (region?.type === 'zone') {
    list = list.filter(c => isInZone({ lat: c.company_latitude, lng: c.company_longitude }))
  }
  if (region?.type === 'city') {
    list = list.filter(c => c.company_city === region.name)
  }
  const q = companySearch.value.trim().toLowerCase()
  if (q) {
    list = list.filter(c =>
      c.company_name.toLowerCase().includes(q)
      || (c.company_credit_code || '').toLowerCase().includes(q)
      || (c.product_type || '').toLowerCase().includes(q)
      || (c.chain_name || '').toLowerCase().includes(q)
      || (c.product || '').toLowerCase().includes(q)
      || (c.conpany_district || '').toLowerCase().includes(q),
    )
  }
  return list
})

async function loadCompanyData() {
  try {
    const res = await fetchCompanies(1, pageSize)
    if (res.code === 0 && res.data) {
      allCompanies.value = res.data.list.map(item => ({
        ...item,
        id: item.company_credit_code || `${item.company_name}-${item.company_longitude}`,
      }))
      companyTotal.value = res.data.total
    }
  } catch (e) {
    console.error('[geo-screen] 加载企业数据失败', e)
  }
}

onMounted(async () => {
  try {
    await loadCompanyData()
    await initMap(allCompanies.value, {
      onCompany: company => openDetail(company),
      onRegion: payload => onRegionSelect(payload),
      onBubble: (companies, label) => onBubbleClick(companies, label),
    })
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
})

function onPanelLayoutDone() {
  invalidateSize()
  requestAnimationFrame(() => invalidateSize())
}

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
  if (payload.type === 'zone') selectedAreaView.value = 'zone'
  else if (payload.name === '武汉市') selectedAreaView.value = 'wuhan'
  bubbleCompanies.value = null
  bubbleLabel.value = ''
  panelOpen.value = true
  companySearch.value = ''
  nextTick(() => invalidateSize())
}

function onBubbleClick(companies: CompanyRecord[], label: string) {
  bubbleCompanies.value = companies
  bubbleLabel.value = label
  selectedRegion.value = null
  panelOpen.value = true
  companySearch.value = ''
  nextTick(() => invalidateSize())
}

function resetPanel() {
  bubbleCompanies.value = null
  bubbleLabel.value = ''
  selectedRegion.value = null
  selectedAreaView.value = 'zone'
  companySearch.value = ''
  nextTick(() => invalidateSize())
}

function openDetail(company: CompanyRecord) {
  detailCompany.value = company
  highlightedCompanyId.value = company.id
  scopeExpanded.value = false
}

function closeDetail() {
  detailCompany.value = null
  scopeExpanded.value = false
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

/* ── 区域选择下拉 ────────────────────────────────────── */
.gs-area-select {
  position: relative;
}
.gs-area-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 600;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #1d4ed8;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.gs-area-btn:hover {
  background: #eff6ff;
  border-color: #3b82f6;
}

/* ── 下拉菜单通用 ────────────────────────────────────── */
.gs-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 140px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 4px;
  z-index: 999;
}
.gs-dropdown-right {
  left: auto;
  right: 0;
}
.gs-dropdown-header {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 6px 10px 4px;
}
.gs-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 500;
  color: #334155;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s;
}
.gs-dropdown-item:hover {
  background: #f1f5f9;
}
.gs-dropdown-active {
  color: #1d4ed8;
  background: #eff6ff;
}
.gs-dropdown-check {
  margin-left: auto;
  color: #3b82f6;
}

/* ── 主题切换 ────────────────────────────────────── */
.gs-theme-wrap {
  position: relative;
}

/* ── 下拉动画 ────────────────────────────────────── */
.gs-dropdown-enter-active,
.gs-dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.gs-dropdown-enter-from,
.gs-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── 高德地图容器 ───────────────────────────────────── */
.gs-map-container {
  position: absolute;
  inset: 0;
  z-index: 0;
}

/* ── 地图统计浮层等其余样式保留 ─── */
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
  z-index: 410;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}
.gs-map-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  z-index: 410;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}
.gs-toggle-label {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
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
.gs-stat-project .gs-stat-num {
  color: #d97706;
}
.gs-stat-project .gs-stat-lbl {
  color: #f59e0b;
  font-weight: 600;
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
  z-index: 410;
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
.cp-reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid var(--border);
  background: var(--bg-soft);
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}
.cp-reset-btn:hover {
  background: color-mix(in srgb, var(--primary) 8%, transparent);
  color: var(--primary);
  border-color: var(--primary-border);
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
.type-project {
  background: linear-gradient(135deg, #ff6b35, #f5af19);
  color: #fff;
  font-weight: 700;
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 4px;
  box-shadow: 0 0 14px rgba(245, 175, 25, 0.55), inset 0 1px 0 rgba(255,255,255,0.25);
  border: 1px solid rgba(255, 200, 50, 0.6);
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  position: relative;
  overflow: hidden;
}
.type-project::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 40%,
    rgba(255,255,255,0.15) 45%,
    rgba(255,255,255,0.25) 50%,
    rgba(255,255,255,0.15) 55%,
    transparent 60%
  );
  animation: project-shine 2.5s ease-in-out infinite;
}
@keyframes project-shine {
  0% { transform: translateX(-100%) translateY(-100%); }
  100% { transform: translateX(100%) translateY(100%); }
}
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
.cp-founded {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
  margin-top: 4px;
}
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
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}
.cd-panel {
  position: relative;
  width: 520px;
  max-width: calc(100vw - 48px);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--shadow-xl), 0 0 60px rgba(99, 102, 241, 0.12);
}
.cd-close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.cd-close:hover {
  background: color-mix(in srgb, var(--danger) 10%, transparent);
  color: var(--danger);
}
.cd-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 48px 16px 20px;
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
  overflow-x: hidden;
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
.cd-metrics { display: flex; gap: 10px; margin-bottom: 16px; overflow-x: hidden; }
.cd-metric {
  flex: 1;
  min-width: 120px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.cd-metric > div { min-width: 0; }
.cd-metric-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
  font-family: var(--font-display);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
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
.cd-honors-row .cd-info-val {
  color: #b45309;
  font-weight: 500;
  line-height: 1.5;
}

.cd-scope-card {
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 16px;
}
.cd-scope-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
  margin-bottom: 8px;
}
.cd-scope-text-wrap { position: relative; }
.cd-scope-text {
  font-size: 12px;
  line-height: 1.8;
  color: var(--text);
  margin: 0;
  transition: max-height 0.3s ease;
}
.cd-scope-text-collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cd-scope-expand-btn {
  display: inline-flex;
  align-items: center;
  margin-top: 8px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.cd-scope-expand-btn:hover {
  background: color-mix(in srgb, var(--primary) 16%, transparent);
}

.type-listed { background: rgba(236, 72, 153, 0.15); color: #f472b6; }
.type-info { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
.type-project {
  background: linear-gradient(135deg, #ff6b35, #f5af19);
  color: #fff;
  font-weight: 700;
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 4px;
  box-shadow: 0 0 14px rgba(245, 175, 25, 0.55), inset 0 1px 0 rgba(255,255,255,0.25);
  border: 1px solid rgba(255, 200, 50, 0.6);
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  position: relative;
  overflow: hidden;
}
.type-project::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 40%,
    rgba(255,255,255,0.15) 45%,
    rgba(255,255,255,0.25) 50%,
    rgba(255,255,255,0.15) 55%,
    transparent 60%
  );
  animation: project-shine 2.5s ease-in-out infinite;
}
@keyframes project-shine {
  0% { transform: translateX(-100%) translateY(-100%); }
  100% { transform: translateX(100%) translateY(100%); }
}
.type-product { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
.type-product-type { background: rgba(6, 182, 212, 0.15); color: #06b6d4; }

.cp-listed-tag {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 600;
  padding: 0 5px;
  height: 16px;
  background: rgba(236, 72, 153, 0.15);
  color: #f472b6;
  border-radius: 3px;
  margin-left: 4px;
  vertical-align: middle;
}
.cp-project-tag {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  padding: 0 6px;
  height: 18px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #fff;
  border-radius: 3px;
  margin-left: 4px;
  vertical-align: middle;
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.45);
  line-height: 18px;
}
.cp-type-tag {
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

/* ── 过渡动画 ──────────────────────────────────────────── */
.cd-fade-enter-active { transition: opacity 0.22s ease; }
.cd-fade-leave-active { transition: opacity 0.16s ease; }
.cd-fade-enter-from, .cd-fade-leave-to { opacity: 0; }

.gs-crumb-enter-active { transition: all 0.2s ease; }
.gs-crumb-leave-active { transition: all 0.15s ease; }
.gs-crumb-enter-from, .gs-crumb-leave-to { opacity: 0; transform: translateX(-8px); }

</style>
