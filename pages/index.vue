<template>
  <div class="chain-page">
    <header class="chain-top">
      <div class="chain-top-title">
        <div class="chain-top-icon">
          <UIcon name="i-lucide-git-branch" class="size-5" />
        </div>
        <div>
<!--          <h1>{{ chainTitle }}</h1>-->
          <h1>产业链</h1>
<!--          <p>上 · 中 · 下游关键环节</p>-->
        </div>
      </div>
      <div v-if="chainList.length > 1" class="chain-select">
        <button
          v-for="chain in chainList"
          :key="chain.key"
          class="chain-chain-btn"
          :class="{ on: currentChainKey === chain.key }"
          @click="switchChain(chain.key)"
        >
          {{ chain.name }}
        </button>
      </div>
      <div v-if="chainPhases.some(p => p.key !== 'all')" class="chain-tabs">
        <button class="chain-tab" :class="{ on: !phaseFilter }" @click="phaseFilter = ''">
          全部<span>{{ totalProductTypes }}</span>
        </button>
        <button
          v-for="p in chainPhases.filter(p => p.key !== 'all')"
          :key="p.key"
          class="chain-tab"
          :class="{ on: phaseFilter === p.key }"
          :style="{ '--tc': p.color }"
          @click="phaseFilter = phaseFilter === p.key ? '' : p.key"
        >
          <UIcon :name="p.icon" class="size-3.5" />
          {{ p.name }}<span>{{ p.children.length }}</span>
        </button>
      </div>
      <div class="chain-view-toggle">
        <button
          class="chain-view-btn"
          :class="{ on: viewMode === 'structure' }"
          title="结构图"
          @click="viewMode = 'structure'"
        >
          <UIcon name="i-lucide-layout-grid" class="size-4" />
        </button>
        <button
          class="chain-view-btn"
          :class="{ on: viewMode === 'tree' }"
          title="树形图"
          @click="viewMode = 'tree'"
        >
          <UIcon name="i-lucide-network" class="size-4" />
        </button>
      </div>
    </header>

    <main class="chain-main">
      <div v-if="loading" class="chain-state">
        <UIcon name="i-lucide-loader-2" class="chain-spin size-6" />
      </div>
      <div v-else-if="!chainPhases.length" class="chain-state">
        <UIcon name="i-lucide-network" class="size-10 opacity-30" />
        <p>暂无产业链数据</p>
      </div>

      <template v-else>
        <!-- 产业链结构 -->
        <section v-if="viewMode === 'structure'" class="chain-structure">
          <div
            v-for="phase in visiblePhases"
            :key="phase.key"
            class="chain-phase"
            :style="{ '--tc': phase.color }"
          >
            <div class="chain-phase-head">
              <UIcon :name="phase.icon" class="size-4" />
              <span>{{ phase.name }}</span>
              <em>{{ phase.totalCount }}</em>
            </div>
            <div class="chain-phase-body">
              <div
                v-for="industry in phase.children"
                :key="industry.secondIndustryId"
                class="chain-industry"
              >
                <div v-if="!(phase.children.length === 1 && phase.name === industry.name)" class="chain-industry-head">
                  <span class="chain-industry-dot" />
                  {{ industry.name }}
                </div>
                <div class="chain-product-list">
                  <div
                    v-for="product in industry.children"
                    :key="product.productTypeId"
                    class="chain-product-card"
                    :class="{ on: selectedProduct?.productTypeId === product.productTypeId }"
                  >
                    <span class="chain-product-name" :title="product.name">{{ product.name }}</span>
                    <div class="chain-product-actions">
                      <button
                        v-for="src in product.companyInfo"
                        :key="src.sourceId"
                        type="button"
                        class="chain-source-btn"
                        @click="selectProduct(product); openCompanyList({ company_source: src.sourceId })"
                      >
                        {{ src.sourceName }}<span class="csb-num">{{ src.num }}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 树形图 -->
        <section v-else-if="viewMode === 'tree'" class="chain-tree-wrap">
          <ClientOnly>
            <div ref="chainMindMapRef" class="chain-tree-chart" />
          </ClientOnly>
        </section>

        
        <!-- 底部统计图表 -->
        <section class="chain-charts">
          <div class="chain-chart-card">
            <h3 class="chain-chart-title">
              <UIcon name="i-lucide-map-pin" class="size-4" />
              园区分布
            </h3>
            <div class="chain-chart-wrap">
              <ClientOnly>
                <VChart v-if="parkChartOption" :option="parkChartOption" class="chain-chart" autoresize @click="handleChartClick($event, 'park')" />
                <div v-else class="chain-chart-empty">暂无数据</div>
              </ClientOnly>
            </div>
          </div>
          <div class="chain-chart-card">
            <h3 class="chain-chart-title">
              <UIcon name="i-lucide-building-2" class="size-4" />
              企业性质分布
            </h3>
            <div class="chain-chart-wrap">
              <ClientOnly>
                <VChart v-if="typeChartOption" :option="typeChartOption" class="chain-chart" autoresize @click="handleChartClick($event, 'type')" />
                <div v-else class="chain-chart-empty">暂无数据</div>
              </ClientOnly>
            </div>
          </div>
        </section>
      </template>
    </main>

    <!-- 企业列表弹窗 -->
    <Teleport to="body">
      <Transition name="chain-modal">
        <div v-if="companyModalVisible" class="chain-modal-overlay company-modal-overlay" @click.self="closeCompanyList">
          <div class="chain-modal-panel">
            <div class="chain-modal-head">
              <div>
                <h3>企业列表</h3>
                <p v-if="selectedProduct">{{ selectedProduct.name }} · 共 {{ companyTotal }} 家</p>
              </div>
              <button class="chain-modal-close" @click="closeCompanyList">
                <UIcon name="i-lucide-x" class="size-5" />
              </button>
            </div>
            <div class="chain-modal-body">
              <div v-if="companyLoading" class="chain-state">
                <UIcon name="i-lucide-loader-2" class="chain-spin size-6" />
              </div>
              <template v-else>
                <div class="chain-modal-list">
                  <NuxtLink
                    v-for="co in companyList"
                    :key="co.company_credit_code"
                    :to="companyUrl(co.company_credit_code)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="chain-modal-item"
                  >
                    <span class="chain-modal-av">{{ co.company_name.charAt(0) }}</span>
                    <span class="chain-modal-name">{{ co.company_name }}</span>
                    <UIcon name="i-lucide-chevron-right" class="size-3.5 opacity-40" />
                  </NuxtLink>
                </div>
                <div v-if="!companyList.length" class="chain-modal-empty">暂无企业数据</div>
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { request } from '~/utils/request'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DatasetComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, GridComponent, TooltipComponent, DatasetComponent, CanvasRenderer])

definePageMeta({ middleware: 'auth', keepalive: true })

type SourceInfo = {
  sourceId: string
  sourceName: string
  num: number
}

type ProductType = {
  productTypeId: number
  name: string
  companyInfo: SourceInfo[]
  totalCount: number
}

type SecondIndustry = {
  secondIndustryId: number
  name: string
  children: ProductType[]
  totalCount: number
}

type ChainPhase = {
  key: string
  name: string
  color: string
  icon: string
  children: SecondIndustry[]
  totalCount: number
}

type ParkItem = { park_id: number; park_name: string; num: number }
type TypeItem = { type_id: number; park_name: string; num: number }
type CompanyItem = { company_name: string; company_credit_code: string }
type ChainItem = { key: string; name: string; raw: any }

const PHASE_KEYS = ['up', 'middle', 'midlle', 'down']

const phaseMeta: Record<string, { name: string; color: string; icon: string; order: number }> = {
  up: { name: '上游', color: '#38bdf8', icon: 'i-lucide-arrow-up-circle', order: 1 },
  middle: { name: '中游', color: '#a78bfa', icon: 'i-lucide-cpu', order: 2 },
  midlle: { name: '中游', color: '#a78bfa', icon: 'i-lucide-cpu', order: 2 },
  down: { name: '下游', color: '#fbbf24', icon: 'i-lucide-arrow-down-circle', order: 3 },
}

const loading = ref(false)
const chainTitle = ref('集成电路产业链')
const chainList = ref<ChainItem[]>([])
const currentChainKey = ref('1')
const chainPhases = ref<ChainPhase[]>([])
const phaseFilter = ref('')
const viewMode = ref<'structure' | 'tree'>('structure')
const selectedProduct = ref<ProductType | null>(null)
const selectedSecondIndustry = ref<SecondIndustry | null>(null)

const visiblePhases = computed(() =>
  phaseFilter.value ? chainPhases.value.filter(p => p.key === phaseFilter.value) : chainPhases.value
)

const selectedPhase = computed(() => {
  if (!selectedProduct.value || !selectedSecondIndustry.value) return null
  return chainPhases.value.find(p =>
    p.children.some(ind => ind.secondIndustryId === selectedSecondIndustry.value?.secondIndustryId)
  ) || null
})

const totalProductTypes = computed(() =>
  chainPhases.value.reduce((sum, p) => sum + p.children.reduce((s, i) => s + i.children.length, 0), 0)
)

// 园区 / 企业性质分布（产品维度，当前弹窗已移除展示，保留类型供底部全局图表使用）

// 企业列表弹窗
const companyModalVisible = ref(false)
const companyLoading = ref(false)
const companyList = ref<CompanyItem[]>([])
const companyTotal = ref(0)
const companyFilter = ref<Record<string, any>>({})

// 底部图表
const globalParkList = ref<ParkItem[]>([])
const globalTypeList = ref<TypeItem[]>([])

function parseSourceInfo(info: Record<string, any>): SourceInfo[] {
  if (!info || typeof info !== 'object') return []
  return Object.entries(info)
    .map(([sourceId, v]: [string, any]) => ({
      sourceId,
      sourceName: v?.source_name || sourceId,
      num: typeof v?.num === 'number' ? v.num : 0,
    }))
    .filter(s => s.num > 0)
}

function parseProductType(raw: any): ProductType | null {
  if (!raw || typeof raw !== 'object') return null
  const info = parseSourceInfo(raw.company_info)
  return {
    productTypeId: raw.product_type_id ?? 0,
    name: raw.name || '-',
    companyInfo: info,
    totalCount: info.reduce((sum, s) => sum + s.num, 0),
  }
}

function parseSecondIndustry(raw: any): SecondIndustry | null {
  if (!raw || typeof raw !== 'object') return null
  const children = (raw.child_info || [])
    .map(parseProductType)
    .filter(Boolean) as ProductType[]
  return {
    secondIndustryId: raw.sencond_industry_id ?? 0,
    name: raw.name || '-',
    children,
    totalCount: children.reduce((sum, c) => sum + c.totalCount, 0),
  }
}

function parsePhase(key: string, raw: any): ChainPhase | null {
  if (!raw || typeof raw !== 'object') return null
  const meta = phaseMeta[key] || { name: raw.name || key, color: '#64748b', icon: 'i-lucide-box', order: 9 }
  const children = (raw.child_info || [])
    .map(parseSecondIndustry)
    .filter(Boolean) as SecondIndustry[]
  return {
    key,
    name: meta.name,
    color: meta.color,
    icon: meta.icon,
    children,
    totalCount: children.reduce((sum, c) => sum + c.totalCount, 0),
  }
}

function buildChain(raw: any): ChainPhase[] {
  if (!raw || typeof raw !== 'object') return []
  const chain = raw.chain
  if (chain && typeof chain === 'object') {
    return PHASE_KEYS
      .filter(k => chain[k])
      .map(k => parsePhase(k, chain[k]))
      .filter(Boolean) as ChainPhase[]
  }
  // 其他产业链数据结构没有 chain 字段，把每个二级行业提升为一个 ChainPhase
  const children = (raw.child_info || [])
    .map(parseSecondIndustry)
    .filter(Boolean) as SecondIndustry[]
  if (!children.length) return []
  return children.map(child => ({
    key: String(child.secondIndustryId),
    name: child.name,
    color: '#64748b',
    icon: 'i-lucide-layers',
    children: [child],
    totalCount: child.totalCount,
  }))
}

async function fetchChainData() {
  loading.value = true
  try {
    const res = await request.get('/company/chain')
    if (res.data?.code === 0 && res.data.data && typeof res.data.data === 'object') {
      const all = res.data.data as Record<string, any>
      chainList.value = Object.entries(all)
        .filter(([, v]) => v && typeof v === 'object')
        .map(([k, v]) => ({ key: k, name: v.name || `产业链${k}`, raw: v }))
      const target = chainList.value.find(c => c.key === '1') || chainList.value[0]
      if (target) {
        currentChainKey.value = target.key
        chainTitle.value = target.name
        chainPhases.value = buildChain(target.raw)
        selectedProduct.value = null
      }
    }
  } catch (e) {
    console.error('获取产业链数据失败:', e)
  } finally {
    loading.value = false
  }
}

function switchChain(key: string) {
  const target = chainList.value.find(c => c.key === key)
  if (!target || currentChainKey.value === key) return
  currentChainKey.value = key
  chainTitle.value = target.name
  chainPhases.value = buildChain(target.raw)
  phaseFilter.value = ''
  selectedProduct.value = null
}

async function fetchGlobalCharts() {
  try {
    const [parkRes, typeRes] = await Promise.all([
      request.get('/company/park'),
      request.get('/company/typeInfo'),
    ])
    if (parkRes.data?.code === 0 && Array.isArray(parkRes.data.data)) {
      globalParkList.value = parkRes.data.data
    }
    if (typeRes.data?.code === 0 && Array.isArray(typeRes.data.data)) {
      globalTypeList.value = typeRes.data.data
    }
  } catch (e) {
    console.error('获取图表数据失败:', e)
  }
}

function selectProduct(product: ProductType) {
  // 找到所属二级分类
  let parent: SecondIndustry | null = null
  for (const phase of chainPhases.value) {
    for (const ind of phase.children) {
      if (ind.children.some(p => p.productTypeId === product.productTypeId)) {
        parent = ind
        break
      }
    }
    if (parent) break
  }
  selectedSecondIndustry.value = parent
  selectedProduct.value = product
}

function openCompanyList(extra: Record<string, any>) {
  if (!selectedProduct.value) return
  companyFilter.value = {
    product_type: selectedProduct.value.productTypeId,
    ...(selectedSecondIndustry.value ? { sencond_industry_id: selectedSecondIndustry.value.secondIndustryId } : {}),
    ...extra,
  }
  companyModalVisible.value = true
  fetchCompanyList()
}

async function fetchCompanyList() {
  companyLoading.value = true
  try {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(companyFilter.value)) {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v))
    }
    const res = await request.get(`/company/SearchInfo?${params.toString()}`)
    if (res.data?.code === 0 && res.data.data) {
      const data = res.data.data
      companyList.value = Array.isArray(data) ? data : (data.list || [])
      companyTotal.value = Array.isArray(data) ? data.length : (data.total || companyList.value.length || 0)
    }
  } catch (e) {
    console.error('获取企业列表失败:', e)
  } finally {
    companyLoading.value = false
  }
}

function closeCompanyList() {
  companyModalVisible.value = false
}

function companyUrl(code: string) {
  return { path: '/company-detail', query: { id: code } }
}

const chartTextColor = ref('#334155')
const chartAxisColor = ref('#cbd5e1')
const chartGridColor = ref('#cbd5e1')
const chartSurfaceColor = ref('#ffffff')
const chartSurfaceAltColor = ref('#f8fafc')

function updateChartColors() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const get = (name: string, fallback: string) =>
    getComputedStyle(root).getPropertyValue(name).trim() || fallback
  chartTextColor.value = get('--text', '#334155')
  chartAxisColor.value = get('--border', '#cbd5e1')
  chartGridColor.value = get('--border', '#cbd5e1')
  chartSurfaceColor.value = get('--surface', '#ffffff')
  chartSurfaceAltColor.value = get('--surface-alt', '#f8fafc')
  if (chainMindMapInstance && chainMindMapRef.value) {
    chainMindMapInstance.themeConfig.backgroundColor = chartSurfaceColor.value
    chainMindMapInstance.initTheme()
  }
  if (viewMode.value === 'tree') {
    nextTick(() => initChainMindMap())
  }
}

let chartColorObserver: MutationObserver | null = null
onMounted(() => {
  updateChartColors()
  chartColorObserver = new MutationObserver(() => updateChartColors())
  chartColorObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})
onBeforeUnmount(() => {
  chartColorObserver?.disconnect()
})

// 树形思维导图
const chainMindMapRef = ref<HTMLElement | null>(null)
let chainMindMapInstance: any = null
let chainMindMapViewApplied = false

function buildChainMindMapData() {
  if (!chainPhases.value.length) return null
  const textColor = chartTextColor.value
  const borderColor = chartAxisColor.value
  const surfaceAlt = chartSurfaceAltColor.value
  const surface = chartSurfaceColor.value
  return {
    data: { text: chainTitle.value, expand: true },
    children: chainPhases.value.map(phase => ({
      data: {
        text: phase.name,
        fillColor: `${phase.color}1f`,
        borderColor: phase.color,
        color: phase.color,
        expand: true,
      },
      children: phase.children.map(industry => ({
        data: {
          text: industry.name,
          fillColor: surfaceAlt,
          borderColor: borderColor,
          color: textColor,
          expand: true,
        },
        children: industry.children.map(product => ({
          data: {
            text: product.name,
            value: product.totalCount,
            productTypeId: product.productTypeId,
            fillColor: surface,
            borderColor: borderColor,
            color: textColor,
          },
          children: [],
        })),
      })),
    })),
  }
}

function handleChainMindMapNodeClick(node: any) {
  const productTypeId = node?.getData?.('productTypeId')
  if (!productTypeId) return
  for (const phase of chainPhases.value) {
    for (const ind of phase.children) {
      const product = ind.children.find(p => p.productTypeId === productTypeId)
      if (product) {
        selectProduct(product)
        openCompanyList({})
        return
      }
    }
  }
}

async function initChainMindMap() {
  if (typeof window === 'undefined' || !chainMindMapRef.value) return
  if (viewMode.value !== 'tree') return
  const mindData = buildChainMindMapData()
  if (!mindData) {
    if (chainMindMapInstance) {
      chainMindMapInstance.destroy()
      chainMindMapInstance = null
    }
    return
  }

  if (chainMindMapInstance) {
    chainMindMapInstance.destroy()
    chainMindMapInstance = null
    chainMindMapViewApplied = false
  }

  const el = chainMindMapRef.value
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) {
    requestAnimationFrame(() => initChainMindMap())
    return
  }

  try {
    const [{ default: MindMap }, { default: Drag }] = await Promise.all([
      import('simple-mind-map'),
      // @ts-ignore simple-mind-map 插件无类型声明
      import('simple-mind-map/src/plugins/Drag.js'),
    ])

    ;(MindMap as any).extendNodeDataNoStylePropList(['productTypeId', 'value'])
    chainMindMapInstance = new (MindMap as any)({
      el,
      data: mindData,
      layout: 'logicalStructure',
      readonly: true,
      fit: false,
      fitPadding: 28,
      alwaysShowExpandBtn: true,
      notShowExpandBtn: false,
      isShowExpandNum: true,
      scaleRatio: 0.1,
      minZoomRatio: 20,
      maxZoomRatio: 300,
      mousewheelAction: 'zoom',
      mouseScaleCenterUseMousePosition: false,
      initRootNodePosition: ['left', 'center'],
      themeConfig: {
        lineStyle: 'curve',
        backgroundColor: chartSurfaceColor.value,
        root: { fontSize: 18, paddingX: 20, paddingY: 10 },
        second: { marginX: 120, marginY: 28, fontSize: 15, paddingX: 16, paddingY: 8 },
        node: { marginX: 90, marginY: 14, fontSize: 13, paddingX: 12, paddingY: 5 },
      },
    })
    chainMindMapInstance.addPlugin(Drag)
    chainMindMapInstance.on('node_click', handleChainMindMapNodeClick)
    chainMindMapInstance.on('node_tree_render_end', () => {
      if (!chainMindMapInstance || chainMindMapViewApplied) return
      chainMindMapViewApplied = true
      const cx = (chainMindMapInstance.width ?? 0) / 2
      const cy = (chainMindMapInstance.height ?? 0) / 2
      chainMindMapInstance.view.fit(undefined, true, 28)
      const scale = Math.min(1.4, Math.max(0.8, chainMindMapInstance.view.scale * 1.15))
      chainMindMapInstance.view.setScale(scale, cx, cy)
    })
  } catch (e) {
    console.error('产业链思维导图初始化失败:', e)
  }
}

function resizeChainMindMap() {
  if (chainMindMapInstance) chainMindMapInstance.resize()
}

watch([() => viewMode.value, () => chainPhases.value, chainMindMapRef], () => {
  if (viewMode.value !== 'tree') {
    if (chainMindMapInstance) {
      chainMindMapInstance.destroy()
      chainMindMapInstance = null
      chainMindMapViewApplied = false
    }
    return
  }
  nextTick(() => initChainMindMap())
})

onMounted(() => window.addEventListener('resize', resizeChainMindMap))
onUnmounted(() => {
  window.removeEventListener('resize', resizeChainMindMap)
  if (chainMindMapInstance) {
    chainMindMapInstance.destroy()
    chainMindMapInstance = null
    chainMindMapViewApplied = false
  }
})

function buildBarOption(data: { name: string; value: number; id: number }[], color: string) {
  if (!data.length) return null
  return {
    tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
    grid: { left: 12, right: 24, top: 24, bottom: 24, containLabel: true },
    xAxis: {
      type: 'category' as const,
      data: data.map(d => d.name),
      axisLabel: { color: chartTextColor.value, fontSize: 11, interval: 0, rotate: data.length > 6 ? 30 : 0 },
      axisLine: { lineStyle: { color: chartAxisColor.value } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: chartTextColor.value, fontSize: 11 },
      splitLine: { lineStyle: { color: chartGridColor.value, opacity: 0.08, type: 'dashed' } },
    },
    series: [{
      type: 'bar' as const,
      data: data.map(d => ({ value: d.value, id: d.id })),
      barWidth: '50%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color,
      },
      label: { show: true, position: 'top' as const, fontSize: 11, color: chartTextColor.value },
    }],
  }
}

function handleChartClick(params: any, chartType: 'park' | 'type') {
  const id = params?.data?.id
  if (!id) return
  const key = chartType === 'park' ? 'park_id' : 'company_type'
  companyFilter.value = { [key]: id }
  selectedProduct.value = null
  companyModalVisible.value = true
  fetchCompanyList()
}

const parkChartOption = computed(() =>
  buildBarOption(globalParkList.value.map(d => ({ name: d.park_name, value: d.num, id: d.park_id })), '#38bdf8')
)

const typeChartOption = computed(() =>
  buildBarOption(globalTypeList.value.map(d => ({ name: d.park_name, value: d.num, id: d.type_id })), '#a78bfa')
)

usePageInit(() => {
  fetchChainData()
  fetchGlobalCharts()
})
</script>

<style scoped>
.chain-page {
  min-height: 100%;
  color: var(--text);
  background: var(--bg);
  padding-bottom: 32px;
}

/* ── 顶栏 ── */
.chain-top {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px 16px;
  flex-wrap: wrap;
}

.chain-top-title {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.chain-view-toggle {
  flex-shrink: 0;
  margin-left: auto;
}

.chain-top-icon {
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

.chain-top h1 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: 0.02em;
}

.chain-top p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

.chain-select {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.chain-chain-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.chain-chain-btn:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.chain-chain-btn.on {
  background: var(--surface);
  border-color: var(--primary);
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.chain-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.chain-tab {
  --tc: var(--primary);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.chain-tab span {
  font-size: 11px;
  font-weight: 700;
  color: var(--tc);
}

.chain-tab:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.chain-tab.on {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text-strong);
  box-shadow: var(--shadow-sm);
}

/* ── 布局切换 ── */
.chain-view-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.chain-view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.chain-view-btn:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.chain-view-btn.on {
  background: var(--surface-alt);
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

/* ── 主区域 ── */
.chain-main {
  padding: 0 24px;
}

.chain-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 240px;
  color: var(--text-muted);
}

.chain-spin { animation: spin 1s linear infinite; }

@keyframes spin { to { transform: rotate(360deg); } }

/* ── 产业链结构 ── */
.chain-structure {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 36px;
  margin-bottom: 24px;
  position: relative;
}

.chain-phase {
  --tc: var(--primary);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  position: relative;
  display: flex;
  flex-direction: column;
}

/* phase 之间的连接线 + 箭头 */
.chain-phase:not(:last-child)::before {
  content: '';
  position: absolute;
  top: 50%;
  right: -26px;
  width: 22px;
  height: 2px;
  background: repeating-linear-gradient(90deg, var(--tc) 0, var(--tc) 4px, transparent 4px, transparent 7px);
  opacity: 0.45;
  transform: translateY(-50%);
  z-index: 1;
}

.chain-phase:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -32px;
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 7px solid var(--tc);
  transform: translateY(-50%);
  z-index: 2;
  opacity: 0.6;
}

.chain-phase-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-alt);
  color: var(--tc);
  font-size: 14px;
  font-weight: 700;
}

.chain-phase-head em {
  margin-left: auto;
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--tc) 12%, transparent);
}

.chain-phase-body {
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
  flex: 1;
}

.chain-industry {
  display: flex;
  flex-direction: column;
}

.chain-industry-head {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  font-size: 13px;
  font-weight: 700;
  color: var(--text-strong);
}

.chain-industry-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--tc);
}

.chain-product-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chain-product-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
}

.chain-source-btn {
  color: var(--text-muted);
}

.chain-product-card {
  --tc: var(--primary);
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-size: 12px;
  font-weight: 500;
  cursor: default;
  transition: all 0.15s;
  min-width: 0;
}

.chain-product-card:hover {
  border-color: color-mix(in srgb, var(--tc) 40%, var(--border));
  background: color-mix(in srgb, var(--tc) 5%, var(--surface));
}

.chain-product-card.on {
  border-color: var(--tc);
  background: color-mix(in srgb, var(--tc) 10%, var(--surface));
  color: var(--text-strong);
}

.chain-product-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.chain-product-actions {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.chain-source-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: var(--surface-alt);
  color: var(--text);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
}

.chain-source-btn:hover {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 6%, var(--surface-alt));
  color: var(--text-strong);
}

.csb-num {
  font-weight: 700;
  color: var(--primary);
  font-variant-numeric: tabular-nums;
}

/* ── 详情弹窗 ── */
.chain-detail-modal {
  max-width: 720px;
}

.chain-detail-modal .chain-modal-head {
  border-bottom-color: var(--tc, var(--border));
}

.chain-detail-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.chain-detail-section {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  background: var(--surface);
}

.chain-detail-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-strong);
}

.chain-detail-section-title :deep(svg) {
  color: var(--primary);
}

.chain-detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chain-detail-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--surface-alt);
  color: var(--text);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s;
}

.chain-detail-tag:hover {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 6%, var(--surface-alt));
  color: var(--text-strong);
}

.cdt-label {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cdt-num {
  font-weight: 700;
  color: var(--primary);
  font-variant-numeric: tabular-nums;
}

.chain-detail-empty {
  font-size: 12px;
  color: var(--text-muted);
  padding: 8px 0;
}

.chain-detail-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  color: var(--text-muted);
}

/* ── 底部图表 ── */
.chain-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
}

.chain-chart-card {
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.chain-chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-alt);
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}

.chain-chart-title :deep(svg) {
  color: var(--primary);
}

.chain-chart-wrap {
  padding: 12px;
  height: 300px;
}

.chain-chart {
  width: 100%;
  height: 100%;
}

.chain-chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  font-size: 13px;
}

/* ── 树形图 ── */
.chain-tree-wrap {
  margin-bottom: 24px;
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  padding: 12px;
}

.chain-tree-chart {
  width: 100%;
  height: 560px;
}

.chain-tree-chart :deep(.smm-node) {
  cursor: pointer;
}

.chain-tree-chart :deep(.smm-expand-btn) {
  cursor: pointer;
}

/* ── 企业列表弹窗 ── */
.chain-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.company-modal-overlay {
  z-index: 10000;
}

.chain-modal-panel {
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

.chain-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-alt);
}

.chain-modal-head h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-strong);
}

.chain-modal-head p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

.chain-modal-close {
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
  transition: background 0.12s, color 0.12s;
}

.chain-modal-close:hover {
  background: var(--surface);
  color: var(--text-strong);
}

.chain-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  min-height: 200px;
}

.chain-modal-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
}

.chain-modal-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}

.chain-modal-item:hover {
  background: var(--surface-alt);
  border-color: color-mix(in srgb, var(--primary) 40%, var(--border));
}

.chain-modal-av {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

.chain-modal-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chain-modal-empty {
  text-align: center;
  padding: 32px;
  color: var(--text-muted);
  font-size: 13px;
}

/* ── 弹窗过渡动画 ── */
.chain-modal-enter-active,
.chain-modal-leave-active {
  transition: opacity 0.25s ease;
}

.chain-modal-enter-active .chain-modal-panel,
.chain-modal-leave-active .chain-modal-panel {
  transition: transform 0.25s ease;
}

.chain-modal-enter-from,
.chain-modal-leave-to {
  opacity: 0;
}

.chain-modal-enter-from .chain-modal-panel {
  transform: scale(0.95) translateY(10px);
}

.chain-modal-leave-to .chain-modal-panel {
  transform: scale(0.95) translateY(10px);
}

@media (max-width: 900px) {
  .chain-top { flex-direction: column; align-items: flex-start; }
  .chain-structure { grid-template-columns: 1fr; gap: 16px; }
  .chain-phase:not(:last-child)::before,
  .chain-phase:not(:last-child)::after { display: none; }
  .chain-charts { grid-template-columns: 1fr; }
  .chain-detail-body { grid-template-columns: 1fr; }
  .chain-tree-chart { height: 420px; }
}

@media (max-width: 520px) {
  .chain-main { padding: 0 16px; }
  .chain-top { padding: 16px 16px 12px; }
  .chain-tabs { width: 100%; }
  .chain-modal-panel { width: 100vw; max-width: 100vw; border-radius: 12px 12px 0 0; }
  .chain-tree-chart { height: 360px; }
}

@media (prefers-reduced-motion: reduce) {
  .chain-spin,
  .chain-modal-enter-active,
  .chain-modal-leave-active,
  .chain-modal-enter-active .chain-modal-panel,
  .chain-modal-leave-active .chain-modal-panel {
    animation: none;
    transition: none;
  }
}
</style>
