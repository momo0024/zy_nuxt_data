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
              <span class="cp-count">{{ panelCompanyCount }} 家</span>
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
              <button
                v-if="companySearch"
                class="cp-search-clear"
                title="清除搜索"
                @click="companySearch = ''"
              >
                <UIcon name="i-lucide-x" class="size-3.5" />
              </button>
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
                    <span v-if="c.product_type && c.product_type !== '-'" class="cp-tag">{{ c.product_type }}</span>
                    <span v-if="c.chain_name && c.chain_name !== '-'" class="cp-type-tag">{{ c.chain_name }}</span>
                  </div>
                  <div class="cp-strength-row">
                    <span v-if="c.company_score" class="cp-strength-dot cp-strength-dot-score" :title="'公司得分: ' + c.company_score">{{ c.company_score }}分</span>
                    <span v-if="c.hornor_num" class="cp-strength-dot cp-strength-dot-honor" :title="'荣誉: ' + c.hornor_num">{{ c.hornor_num }}项荣誉</span>
                    <span v-if="c.authorized_patents_count" class="cp-strength-dot cp-strength-dot-patent" :title="'授权专利: ' + c.authorized_patents_count">{{ c.authorized_patents_count }}专利</span>
                    <span v-if="c.company_financing_round && c.company_financing_round !== '-'" class="cp-strength-dot cp-strength-dot-finance">{{ c.company_financing_round }}</span>
                    <span v-if="c.company_scale && c.company_scale !== '-'" class="cp-strength-dot cp-strength-dot-scale">{{ c.company_scale }}</span>
                  </div>
                </div>
              </div>

              <div v-if="filteredCompanies.length === 0" class="cp-empty">
                <UIcon name="i-lucide-building-x" class="size-10 opacity-20" />
                <span v-if="isLoadingCompanies || isLoadingParkCompanies">企业数据加载中…</span>
                <span v-else-if="companySearch.trim()">未找到匹配 "{{ companySearch.trim() }}" 的企业</span>
                <span v-else-if="allCompanies.length === 0">企业数据加载失败，请刷新页面重试</span>
                <span v-else>暂无匹配企业</span>
                <button
                  v-if="companySearch.trim() || selectedRegion || (bubbleCompanies && bubbleCompanies.length)"
                  class="cp-reset-btn"
                  @click="resetPanel"
                >
                  显示全部企业
                </button>
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
                  <NuxtLink
                    class="cd-detail-link"
                    :to="{ path: '/company-detail', query: { id: detailCompany.id } }"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="查看企业详情"
                    @click.stop
                  >
                    <span>查看详情</span>
                    <UIcon name="i-lucide-chevron-right" class="size-3.5" />
                  </NuxtLink>
                </div>
                <div class="cd-sub">
                  <span v-if="detailCompany.company_traded === 1" class="cd-type-badge type-listed">上市公司</span>
                  <span v-if="detailCompany.import_project === 1" class="cd-type-badge type-project">⚡重大项目</span>
                </div>
              </div>
            </div>
            <div class="cd-body">
              <!-- 核心指标 -->
              <div
                v-if="hasStrengthData(detailCompany)"
                class="cd-strength-section"
              >
                <div class="cd-strength-title">
                  <UIcon name="i-lucide-zap" class="size-4" />
                  核心指标
                </div>
                <div class="cd-strength-grid">
                  <div v-if="detailCompany.company_score" class="cd-strength-card cd-strength-score">
                    <div class="cd-strength-card-num">{{ detailCompany.company_score }}</div>
                    <div class="cd-strength-card-lbl">公司得分</div>
                  </div>
                  <div v-if="detailCompany.hornor_num" class="cd-strength-card cd-strength-honor">
                    <div class="cd-strength-card-num">{{ detailCompany.hornor_num }}</div>
                    <div class="cd-strength-card-lbl">荣誉数量</div>
                  </div>
                  <div v-if="detailCompany.authorized_patents_count" class="cd-strength-card cd-strength-patent">
                    <div class="cd-strength-card-num">{{ detailCompany.authorized_patents_count }}</div>
                    <div class="cd-strength-card-lbl">授权专利</div>
                  </div>
                  <div v-if="detailCompany.authorized_invention_patents_count" class="cd-strength-card cd-strength-invention">
                    <div class="cd-strength-card-num">{{ detailCompany.authorized_invention_patents_count }}</div>
                    <div class="cd-strength-card-lbl">授权发明专利</div>
                  </div>
                  <div v-if="detailCompany.national_standards_count" class="cd-strength-card cd-strength-standard">
                    <div class="cd-strength-card-num">{{ detailCompany.national_standards_count }}</div>
                    <div class="cd-strength-card-lbl">国家标准(项)</div>
                  </div>
                  <div v-if="detailCompany.participated_standards_count" class="cd-strength-card cd-strength-participate">
                    <div class="cd-strength-card-num">{{ detailCompany.participated_standards_count }}</div>
                    <div class="cd-strength-card-lbl">参研标准(项)</div>
                  </div>
                </div>
                <div class="cd-strength-meta">
                  <div v-if="detailCompany.company_financing_round && detailCompany.company_financing_round !== '-'" class="cd-strength-meta-item">
                    <UIcon name="i-lucide-trending-up" class="size-3.5" />
                    <span class="cd-strength-meta-label">融资轮次</span>
                    <span class="cd-strength-meta-value">{{ detailCompany.company_financing_round }}</span>
                  </div>
                  <div v-if="detailCompany.latest_financing_date && detailCompany.latest_financing_date !== '-'" class="cd-strength-meta-item">
                    <UIcon name="i-lucide-clock" class="size-3.5" />
                    <span class="cd-strength-meta-label">起始融资时间</span>
                    <span class="cd-strength-meta-value">{{ detailCompany.latest_financing_date }}</span>
                  </div>
                  <div v-if="detailCompany.company_scale && detailCompany.company_scale !== '-'" class="cd-strength-meta-item">
                    <UIcon name="i-lucide-building" class="size-3.5" />
                    <span class="cd-strength-meta-label">企业规模</span>
                    <span class="cd-strength-meta-value">{{ detailCompany.company_scale }}</span>
                  </div>
                  <div v-if="detailCompany.company_nature && detailCompany.company_nature !== '-'" class="cd-strength-meta-item">
                    <UIcon name="i-lucide-shield" class="size-3.5" />
                    <span class="cd-strength-meta-label">企业性质</span>
                    <span class="cd-strength-meta-value">{{ detailCompany.company_nature }}</span>
                  </div>
                </div>
              </div>

              <!-- 产业与产品信息 -->
              <div v-if="(detailCompany.chain_name && detailCompany.chain_name !== '-') || (detailCompany.product_type && detailCompany.product_type !== '-') || (detailCompany.product && detailCompany.product !== '-')" class="cd-tags-section">
                <div class="cd-tags-title">
                  <UIcon name="i-lucide-tags" class="size-4" />
                  产业与产品
                </div>
                <div class="cd-tags-body">
                  <div v-if="detailCompany.chain_name && detailCompany.chain_name !== '-'" class="cd-tag-module">
                    <span class="cd-tag-module-label">产业链类型</span>
                    <span class="cd-type-badge type-info">{{ detailCompany.chain_name }}</span>
                  </div>
                  <div v-if="detailCompany.product_type && detailCompany.product_type !== '-'" class="cd-tag-module">
                    <span class="cd-tag-module-label">产品类型</span>
                    <span class="cd-type-badge type-product-type">{{ detailCompany.product_type }}</span>
                  </div>
                  <div v-if="detailCompany.product && detailCompany.product !== '-'" class="cd-tag-module">
                    <span class="cd-tag-module-label">产品</span>
                    <span class="cd-type-badge type-product">{{ detailCompany.product }}</span>
                  </div>
                </div>
              </div>

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
import { fetchCompanies, fetchCompaniesByPark, isListedCompany } from '~/types/company'
import {
  getIndustryColor,
  useGeoAmapMap,
  type RegionSelectPayload,
} from '~/composables/useGeoAmapMap'

definePageMeta({ middleware: 'auth', keepalive: true })

const {
  mapContainerRef,
  mapReady,
  quickView,
  showCompanyLabels,
  cityList,
  initMap,
  destroyMap,
  zoomIn,
  zoomOut,
  resetView,
  setQuickView,
  flyToCity,
  flyToZone,
  flyToWuhan,
  setCompanyLabelVisible,
  updateMaskColor,
  invalidateSize,
  isInZone,
  showAllMapCompanies,
  setParkMapCompanies,
} = useGeoAmapMap()

const settingsStore = useSettingsStore()

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
const parkCompanies = ref<CompanyRecord[] | null>(null)
const isLoadingParkCompanies = ref(false)
const pageSize = 500
const companyTotal = ref(0)
const isLoadingCompanies = ref(false)
const mapInitialized = ref(false)
const scopeExpanded = ref(false)
const selectedAreaView = ref<string>('zone')
const showAreaDropdown = ref(false)

const areaOptions = computed(() => {
  const base = [
    { value: 'zone', label: '高新区', icon: 'i-lucide-locate-fixed' },
    { value: 'wuhan', label: '武汉市', icon: 'i-lucide-building' },
  ]
  const cities = (cityList.value || [])
    .filter(c => c.name !== '武汉市')
    .map(c => ({
      value: `city-${c.adcode}`,
      label: c.name,
      icon: 'i-lucide-map-pin',
    }))
  return [...base, ...cities]
})
const scopeNeedExpand = computed(() => {
  if (!detailCompany.value?.company_business_scope) return false
  const text = detailCompany.value.company_business_scope
  return text.length > 120
})

const listedCount = computed(() => allCompanies.value.filter(c => c.company_traded === 1).length)
const majorCount = computed(() => allCompanies.value.filter(c => c.import_project === 1).length)

function handleAreaChange(val: string) {
  selectedAreaView.value = val
  if (val.startsWith('city-')) {
    const adcode = Number(val.slice(5))
    const city = cityList.value.find(c => c.adcode === adcode)
    if (city) flyToCity(city.adcode, city.name)
    return
  }
  if (val === 'zone') {
    flyToZone()
    return
  }
  if (val === 'wuhan') {
    flyToWuhan()
    return
  }
}

function closeMenus() {
  showAreaDropdown.value = false
}

const panelTitle = computed(() => {
  if (bubbleLabel.value) return bubbleLabel.value
  const r = selectedRegion.value
  if (r?.type === 'park') return `${r.name} · 企业`
  if (r?.type === 'city') return `${r.name} · 企业`
  if (r?.type === 'zone') return '高新区企业'
  return '企业列表'
})

const filteredCompanies = computed(() => {
  // 气泡模式：仅从气泡公司中检索（注意：空数组也是 truthy，需额外判断长度）
  const bubble = bubbleCompanies.value
  if (bubble && bubble.length) {
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
  // 园区模式：展示接口按 park_id 拉取的企业
  if (selectedRegion.value?.type === 'park' && parkCompanies.value) {
    const q = companySearch.value.trim().toLowerCase()
    if (!q) return parkCompanies.value
    return parkCompanies.value.filter(c =>
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
  const q = companySearch.value.trim().toLowerCase()
  // 搜索时不过滤区域，显示全部企业；未搜索时按当前区域过滤
  if (!q) {
    if (region?.type === 'zone') {
      list = list.filter(c => isInZone({ lat: c.company_latitude, lng: c.company_longitude }))
    }
    if (region?.type === 'city') {
      list = list.filter(c => c.company_city === region.name)
    }
  }
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

const panelCompanyCount = computed(() => {
  if (bubbleCompanies.value?.length || selectedRegion.value) {
    return filteredCompanies.value.length
  }
  return companyTotal.value
})

async function loadParkCompanies(parkId: number) {
  isLoadingParkCompanies.value = true
  parkCompanies.value = null
  try {
    const res = await fetchCompaniesByPark(parkId, 1, pageSize)
    if (res.code === 0 && res.data) {
      parkCompanies.value = res.data.list.map(item => ({
        ...item,
        id: item.company_credit_code || `${item.company_name}-${item.company_longitude}`,
      }))
      setParkMapCompanies(parkCompanies.value)
    }
    else {
      parkCompanies.value = []
      setParkMapCompanies([])
    }
  }
  catch (e) {
    console.error('[geo-screen] 加载园区企业失败', e)
    parkCompanies.value = []
    setParkMapCompanies([])
  }
  finally {
    isLoadingParkCompanies.value = false
  }
}

async function loadCompanyData() {
  isLoadingCompanies.value = true
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
  } finally {
    isLoadingCompanies.value = false
  }
}

async function initGeoScreenPage() {
  try {
    await loadCompanyData()
    if (!mapInitialized.value) {
      await initMap(allCompanies.value, {
        onCompany: company => openDetail(company),
        onRegion: payload => onRegionSelect(payload),
        onBubble: (companies, label) => onBubbleClick(companies, label),
      })
      mapInitialized.value = true
    } else {
      nextTick(() => invalidateSize())
    }
  } catch (e) {
    console.error('[geo-screen] 加载地图数据失败', e)
  }
}

usePageInit(initGeoScreenPage)

onMounted(() => {
  document.addEventListener('fullscreenchange', onFsChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFsChange)
  destroyMap()
  mapInitialized.value = false
})

watch(isFullscreen, () => {
  nextTick(() => invalidateSize())
})

watch(() => settingsStore.theme, () => {
  nextTick(() => updateMaskColor())
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
  else if (payload.type === 'park') selectedAreaView.value = 'zone'
  else if (payload.name === '武汉市') selectedAreaView.value = 'wuhan'
  else selectedAreaView.value = `city-${payload.adcode}`
  bubbleCompanies.value = null
  bubbleLabel.value = ''
  if (payload.type === 'park') {
    loadParkCompanies(payload.park_id)
  }
  else {
    parkCompanies.value = null
    if (payload.type === 'zone') showAllMapCompanies()
  }
  panelOpen.value = true
  companySearch.value = ''
  nextTick(() => invalidateSize())
}

function onBubbleClick(companies: CompanyRecord[], label: string) {
  bubbleCompanies.value = companies
  bubbleLabel.value = label
  selectedRegion.value = null
  parkCompanies.value = null
  panelOpen.value = true
  companySearch.value = ''
  nextTick(() => invalidateSize())
}

function resetPanel() {
  bubbleCompanies.value = null
  bubbleLabel.value = ''
  selectedRegion.value = null
  parkCompanies.value = null
  showAllMapCompanies()
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

function hasStrengthData(c: CompanyRecord): boolean {
  return !!(c.company_score || c.hornor_num || c.authorized_patents_count || c.authorized_invention_patents_count || c.national_standards_count || c.participated_standards_count || (c.company_financing_round && c.company_financing_round !== '-') || (c.latest_financing_date && c.latest_financing_date !== '-') || (c.company_scale && c.company_scale !== '-') || (c.company_nature && c.company_nature !== '-'))
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
  background: var(--bg);
  transition: background 0.3s ease;
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
  background: color-mix(in srgb, var(--surface) 94%, transparent);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(12px);
  z-index: 10;
  flex-shrink: 0;
  transition: background 0.3s ease, border-color 0.3s ease;
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
  color: var(--text-strong);
  letter-spacing: 0.5px;
}
.gs-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 13px;
}
.gs-crumb-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 9px;
  font-size: 11px;
  font-weight: 600;
  background: color-mix(in srgb, var(--primary) 12%, transparent);
  color: var(--primary);
  border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
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
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.gs-tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  background: var(--surface);
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.gs-tool-btn:hover {
  background: var(--surface-alt);
  color: var(--primary);
}
.gs-btn-group .gs-tool-btn + .gs-tool-btn {
  border-left: 1px solid var(--border);
}
.gs-fullscreen-btn {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}
.gs-chain-btn {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  text-decoration: none;
}
.gs-chain-btn:hover {
  background: var(--surface-alt);
  color: var(--primary);
  border-color: color-mix(in srgb, var(--primary) 40%, var(--border));
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
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--primary);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.gs-area-btn:hover {
  background: color-mix(in srgb, var(--primary) 10%, var(--surface));
  border-color: var(--primary);
}

/* ── 下拉菜单通用 ────────────────────────────────────── */
.gs-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 160px;
  max-height: 400px;
  overflow-y: auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: var(--shadow-md);
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
  color: var(--text-muted);
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
  color: var(--text);
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s;
}
.gs-dropdown-item:hover {
  background: var(--surface-alt);
}
.gs-dropdown-active {
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}
.gs-dropdown-check {
  margin-left: auto;
  color: var(--primary);
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
  background: var(--bg, #eef2f7);
  transition: background 0.3s ease;
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
  background: var(--bg, #f8f9fc);
  transition: background 0.3s ease;
}
/* ── 统计浮层 ──────────────────────────────────────────── */
.gs-stats-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 5px 2px;
  z-index: 410;
  box-shadow: var(--shadow-sm);
}
.gs-map-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border);
  border-radius: 10px;
  z-index: 410;
  box-shadow: var(--shadow-sm);
}
.gs-toggle-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
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
  color: var(--primary);
  line-height: 1.15;
}
.gs-stat-lbl {
  font-size: 9px;
  color: var(--text-muted);
  margin-top: 2px;
  white-space: nowrap;
}
.gs-stat-sep {
  width: 1px;
  height: 22px;
  background: var(--border);
}
.gs-stat-project .gs-stat-num {
  color: var(--warning);
}
.gs-stat-project .gs-stat-lbl {
  color: var(--warning);
  font-weight: 600;
}

/* ── 图例 ──────────────────────────────────────────────── */
.gs-legend {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 5px 8px;
  z-index: 410;
  box-shadow: var(--shadow-sm);
}
.gs-legend-title {
  display: block;
  font-size: 9px;
  color: var(--text-muted);
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
  color: var(--text);
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
  color: var(--text-muted);
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
  color: var(--text);
  background: color-mix(in srgb, var(--surface) 96%, transparent);
  border: none;
  border-left: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  letter-spacing: 1px;
}
.gs-panel-reopen:hover {
  color: var(--primary);
  background: var(--surface-alt);
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
  padding: 0 28px 0 30px;
  font-size: 12px;
  border-radius: 8px !important;
}
.cp-search-clear {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}
.cp-search-clear:hover {
  background: var(--surface-alt);
  color: var(--text-strong);
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
.cp-meta { display: flex; align-items: center; gap: 6px; margin-top: 3px; flex-wrap: wrap; }
.cp-type { font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 4px; }
.type-state   { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
.type-private { background: rgba(34, 197, 94, 0.15);  color: #4ade80; }
.type-foreign { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.type-listed  { background: rgba(236, 72, 153, 0.15); color: #f472b6; }
.type-project {
  background: linear-gradient(135deg, #dc2626 0%, #ea580c 30%, #f59e0b 70%, #fbbf24 100%);
  color: #fff;
  font-weight: 800;
  font-size: 13px;
  padding: 4px 12px 4px 8px;
  border-radius: 6px;
  box-shadow:
    0 0 18px rgba(245, 158, 11, 0.6),
    0 0 36px rgba(239, 68, 68, 0.3),
    inset 0 1px 0 rgba(255,255,255,0.3);
  border: 2px solid rgba(255, 220, 100, 0.7);
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
  position: relative;
  overflow: hidden;
  animation: project-pulse 2s ease-in-out infinite;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%);
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
    transparent 30%,
    rgba(255,255,255,0.1) 35%,
    rgba(255,255,255,0.3) 40%,
    rgba(255,255,255,0.4) 45%,
    rgba(255,255,255,0.3) 50%,
    rgba(255,255,255,0.1) 55%,
    transparent 60%
  );
  animation: project-shine 2s ease-in-out infinite;
}
.type-project::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 100%;
  background: rgba(255,255,255,0.35);
  clip-path: polygon(100% 0, 100% 100%, 0 50%);
}
@keyframes project-shine {
  0% { transform: translateX(-100%) translateY(-100%); }
  100% { transform: translateX(100%) translateY(100%); }
}
@keyframes project-pulse {
  0%, 100% { box-shadow: 0 0 18px rgba(245, 158, 11, 0.6), 0 0 36px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255,255,255,0.3); }
  50% { box-shadow: 0 0 28px rgba(245, 158, 11, 0.85), 0 0 50px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255,255,255,0.4); }
}
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

/* ── 核心指标卡片 ─────────────────────────────── */
.cd-strength-section {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  background: var(--surface-alt);
}
.cd-strength-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 12px;
}
.cd-strength-title :deep(svg) {
  color: var(--primary);
}
.cd-strength-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}
.cd-strength-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  transition: all 0.15s;
}
.cd-strength-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
.cd-strength-card-num {
  font-size: 22px;
  font-weight: 800;
  font-family: var(--font-display);
  line-height: 1;
}
.cd-strength-card-lbl {
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
}
.cd-strength-score .cd-strength-card-num { color: #fff; }
.cd-strength-score {
  border: none;
  background: linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 70%, var(--accent)) 100%);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--primary) 35%, transparent);
}
.cd-strength-score::before {
  content: '';
  position: absolute;
  top: -60%;
  left: -20%;
  width: 140%;
  height: 140%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.25) 0%, transparent 50%);
  animation: cd-score-shine 3.5s ease-in-out infinite;
  pointer-events: none;
}
@keyframes cd-score-shine {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(10px, -10px) rotate(8deg); }
}
.cd-strength-score .cd-strength-card-num {
  font-size: 28px;
  font-weight: 900;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  letter-spacing: -0.03em;
}
.cd-strength-score .cd-strength-card-lbl {
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.9);
  font-size: 11px;
  text-transform: uppercase;
}
.cd-strength-honor .cd-strength-card-num { color: var(--warning); }
.cd-strength-honor { border-color: color-mix(in srgb, var(--warning) 20%, transparent); }
.cd-strength-patent .cd-strength-card-num { color: var(--success); }
.cd-strength-patent { border-color: color-mix(in srgb, var(--success) 20%, transparent); }
.cd-strength-invention .cd-strength-card-num { color: var(--accent); }
.cd-strength-invention { border-color: color-mix(in srgb, var(--accent) 20%, transparent); }
.cd-strength-standard .cd-strength-card-num { color: var(--primary); }
.cd-strength-standard { border-color: color-mix(in srgb, var(--primary) 20%, transparent); }
.cd-strength-participate .cd-strength-card-num { color: var(--danger); }
.cd-strength-participate { border-color: color-mix(in srgb, var(--danger) 20%, transparent); }
.cd-strength-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.cd-strength-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 12px;
  border-radius: 8px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  transition: all 0.15s;
}
.cd-strength-meta-item:hover {
  border-color: color-mix(in srgb, var(--text-muted) 30%, transparent);
  box-shadow: var(--shadow-sm);
}
.cd-strength-meta-item :deep(svg) {
  flex-shrink: 0;
  opacity: 0.7;
  color: var(--text-muted);
}
.cd-strength-meta-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.cd-strength-meta-value {
  font-weight: 700;
  font-size: 11px;
  font-family: var(--font-display);
  color: color-mix(in srgb, var(--primary) 50%, var(--text));
  letter-spacing: -0.01em;
}
.cd-strength-meta-label::after {
  content: '';
  display: inline-block;
  width: 1px;
  height: 10px;
  background: var(--border);
  margin-left: 8px;
  vertical-align: middle;
}

/* ── 抽屉列表核心指标行 ─────────────────────────── */
.cp-strength-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
.cp-strength-dot {
  font-size: 10px;
  font-weight: 500;
  padding: 0 6px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  border-radius: 3px;
  white-space: nowrap;
}
.cp-strength-dot-score {
  background: linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 70%, var(--accent)) 100%);
  color: #fff;
  font-weight: 700;
  font-size: 11px;
  padding: 0 8px;
  height: 19px;
  border-radius: 5px;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--primary) 25%, transparent);
  position: relative;
  overflow: hidden;
}
.cp-strength-dot-score::before {
  content: '';
  position: absolute;
  top: -60%;
  left: -20%;
  width: 140%;
  height: 140%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
  animation: cp-score-shine 3.5s ease-in-out infinite;
  pointer-events: none;
}
@keyframes cp-score-shine {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(6px, -6px) rotate(6deg); }
}
.cp-strength-dot-honor { background: color-mix(in srgb, var(--warning) 12%, transparent); color: var(--warning); }
.cp-strength-dot-patent { background: color-mix(in srgb, var(--success) 12%, transparent); color: var(--success); }
.cp-strength-dot-finance { background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); }
.cp-strength-dot-scale { background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); }

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

.type-info { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
.type-product { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
.type-product-type { background: rgba(6, 182, 212, 0.15); color: #06b6d4; }

.cd-tags-section {
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 16px;
}
.cd-tags-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
  margin-bottom: 10px;
}
.cd-tags-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cd-tag-module {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cd-tag-module-label {
  font-size: 12px;
  color: var(--text-muted);
  min-width: 64px;
  flex-shrink: 0;
}

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
  font-weight: 800;
  padding: 0 7px;
  height: 19px;
  background: linear-gradient(135deg, #ea580c, #f59e0b);
  color: #fff;
  border-radius: 4px;
  margin-left: 4px;
  vertical-align: middle;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.55), 0 0 20px rgba(234, 88, 12, 0.2);
  line-height: 19px;
  text-shadow: 0 1px 1px rgba(0,0,0,0.15);
  position: relative;
}
.cp-project-tag::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 5px;
  height: 100%;
  background: rgba(255,255,255,0.3);
  clip-path: polygon(100% 0, 100% 100%, 0 50%);
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
