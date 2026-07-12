<template>
  <ClientOnly>
    <div class="es-screen">
      <div class="es-bg-grid" aria-hidden="true" />
      <div class="es-bg-glow" aria-hidden="true" />

      <!-- 顶部标题栏 -->
      <header class="es-header">
        <div class="es-brand">
          <span class="es-brand-mark">
            <UIcon name="i-lucide-radar" class="size-5" />
          </span>
          <div>
            <p class="es-kicker">企业大屏</p>
            <h1>光谷高新区企业态势总览</h1>
          </div>
        </div>
        <div class="es-header-right">
          <div class="es-clock">
            <span>{{ currentDate }}</span>
            <strong>{{ currentTime }}</strong>
          </div>
          <button
            class="es-cruise-btn"
            :class="{ active: autoPulse }"
            type="button"
            @click="autoPulse = !autoPulse"
          >
            <UIcon :name="autoPulse ? 'i-lucide-pause' : 'i-lucide-play'" class="size-4" />
            <span>{{ autoPulse ? '巡航中' : '启动巡航' }}</span>
          </button>
        </div>
      </header>

      <!-- 主体三栏布局 -->
      <main class="es-body">
        <!-- 左栏 -->
        <aside class="es-col es-left">
          <!-- KPI 指标 -->
          <div class="es-panel es-kpi-panel">
            <div class="es-panel-head">
              <span>运营总览</span>
              <button class="es-icon-btn" type="button" title="刷新" @click="loadCompanies">
                <UIcon name="i-lucide-refresh-cw" class="size-4" />
              </button>
            </div>
            <div class="es-kpi-grid">
              <button
                v-for="metric in metrics"
                :key="metric.key"
                type="button"
                class="es-kpi"
                :class="{ active: activeMetric === metric.key }"
                @click="activeMetric = metric.key"
              >
                <span class="es-kpi-label">{{ metric.label }}</span>
                <strong>{{ metric.value }}</strong>
                <small>{{ metric.hint }}</small>
              </button>
            </div>
          </div>

          <!-- 产业集群强度 -->
          <div class="es-panel es-chart-panel">
            <div class="es-panel-head">
              <span>产业集群强度</span>
              <span class="es-panel-note">{{ filteredCompanies.length }} 家</span>
            </div>
            <VChart class="es-chart" :option="industryOption" autoresize />
          </div>

          <!-- 重点企业 -->
          <div class="es-panel es-list-panel">
            <div class="es-panel-head">
              <span>重点企业</span>
              <span class="es-panel-note">点击定位</span>
            </div>
            <div class="es-company-list">
              <button
                v-for="company in topCompanies"
                :key="company.id"
                type="button"
                class="es-company-row"
                :class="{ active: selectedCompany?.id === company.id }"
                @click="selectCompany(company)"
              >
                <span class="es-company-rank">{{ company.rank }}</span>
                <span class="es-company-info">
                  <strong>{{ company.company_name }}</strong>
                  <small>{{ company.chain_name || company.product_type || '未分类' }}</small>
                </span>
                <span class="es-score">{{ company.company_score || 68 }}</span>
              </button>
            </div>
          </div>
        </aside>

        <!-- 中央地图 -->
        <section class="es-center">
          <!-- 地图工具栏 -->
          <div class="es-map-toolbar">
            <div class="es-filter-group">
              <button
                v-for="item in sourceFilters"
                :key="item.value"
                type="button"
                class="es-filter"
                :class="{ active: sourceFilter === item.value }"
                @click="sourceFilter = item.value"
              >
                {{ item.label }}
              </button>
            </div>
            <div class="es-filter-group compact">
              <button
                v-for="item in densityModes"
                :key="item.value"
                type="button"
                class="es-filter"
                :class="{ active: densityMode === item.value }"
                @click="densityMode = item.value"
              >
                {{ item.label }}
              </button>
            </div>
          </div>

          <!-- L7 地图容器 -->
          <div class="es-map-stage">
            <div ref="mapContainerRef" class="es-map-container" />

            <!-- 地图加载中 -->
            <div v-if="!mapReady" class="es-map-loading">
              <span class="es-loader" />
              <strong>地图加载中</strong>
            </div>

            <!-- 悬浮统计卡片（左上） -->
            <Transition name="es-fade">
              <div v-if="mapReady" class="es-map-stats">
                <div class="es-stat-card">
                  <span class="es-stat-label">企业总数</span>
                  <strong class="es-stat-value">{{ filteredCompanies.length }}</strong>
                </div>
                <div class="es-stat-card">
                  <span class="es-stat-label">上市公司</span>
                  <strong class="es-stat-value es-stat-listed">{{ listedCount }}</strong>
                </div>
                <div class="es-stat-card">
                  <span class="es-stat-label">本土培育</span>
                  <strong class="es-stat-value es-stat-native">{{ nativeCount }}</strong>
                </div>
                <div class="es-stat-card">
                  <span class="es-stat-label">招商引资</span>
                  <strong class="es-stat-value es-stat-attract">{{ attractCount }}</strong>
                </div>
              </div>
            </Transition>

            <!-- 悬浮图例（左下） -->
            <Transition name="es-fade">
              <div v-if="mapReady" class="es-map-legend">
                <span class="es-legend-title">产业分布</span>
                <div class="es-legend-items">
                  <span
                    v-for="item in legendItems"
                    :key="item.name"
                    class="es-legend-item"
                  >
                    <span class="es-legend-dot" :style="{ background: item.color }" />
                    {{ item.name }}
                  </span>
                </div>
              </div>
            </Transition>

            <!-- 悬浮信息条（右下） -->
            <Transition name="es-fade">
              <div v-if="mapReady && selectedIndustryLabel" class="es-map-info">
                <UIcon name="i-lucide-layers" class="size-4" />
                <span>当前筛选</span>
                <strong>{{ selectedIndustryLabel }}</strong>
              </div>
            </Transition>

            <!-- 企业详情抽屉 -->
            <Transition name="es-drawer">
              <aside v-if="selectedCompany" class="es-detail">
                <button class="es-detail-close" type="button" @click="selectedCompany = null">
                  <UIcon name="i-lucide-x" class="size-4" />
                </button>
                <div class="es-detail-header">
                  <span class="es-detail-avatar" :style="{ background: industryColor(selectedCompany) }">
                    {{ selectedCompany.company_name.slice(0, 2) }}
                  </span>
                  <div>
                    <h2>{{ selectedCompany.company_name }}</h2>
                    <p>{{ selectedCompany.product_type || selectedCompany.company_industry || '企业服务' }}</p>
                  </div>
                </div>
                <div class="es-detail-metrics">
                  <div>
                    <small>企业评分</small>
                    <strong>{{ selectedCompany.company_score || 72 }}</strong>
                  </div>
                  <div>
                    <small>专利</small>
                    <strong>{{ patentCount(selectedCompany) }}</strong>
                  </div>
                  <div>
                    <small>标准</small>
                    <strong>{{ standardCount(selectedCompany) }}</strong>
                  </div>
                </div>
                <dl class="es-detail-list">
                  <div>
                    <dt>产业链</dt>
                    <dd>{{ selectedCompany.chain_name || '未分类' }}</dd>
                  </div>
                  <div>
                    <dt>区域</dt>
                    <dd>{{ selectedCompany.company_city || '武汉市' }} {{ selectedCompany.conpany_district || '' }}</dd>
                  </div>
                  <div>
                    <dt>融资</dt>
                    <dd>{{ selectedCompany.company_financing_round || '暂无披露' }}</dd>
                  </div>
                  <div v-if="selectedCompany.company_registered_capital">
                    <dt>注册资本</dt>
                    <dd>{{ selectedCompany.company_registered_capital }}</dd>
                  </div>
                  <div v-if="selectedCompany.tag_name">
                    <dt>来源</dt>
                    <dd>{{ selectedCompany.tag_name }}</dd>
                  </div>
                </dl>
                <NuxtLink
                  class="es-detail-link"
                  :to="{ path: '/company-detail', query: { id: selectedCompany.id } }"
                  target="_blank"
                >
                  查看企业档案
                  <UIcon name="i-lucide-arrow-up-right" class="size-4" />
                </NuxtLink>
              </aside>
            </Transition>

            <!-- 悬浮企业名称提示 -->
            <Transition name="es-fade">
              <div
                v-if="hoveredCompany"
                class="es-hover-tip"
              >
                <strong>{{ hoveredCompany.company_name }}</strong>
                <span v-if="hoveredCompany.chain_name">{{ hoveredCompany.chain_name }}</span>
              </div>
            </Transition>
          </div>
        </section>

        <!-- 右栏 -->
        <aside class="es-col es-right">
          <!-- 产业筛选 -->
          <div class="es-panel es-filter-panel">
            <div class="es-panel-head">
              <span>产业筛选</span>
              <button class="es-text-btn" type="button" @click="activeIndustry = 'all'">重置</button>
            </div>
            <div class="es-industry-tabs">
              <button
                v-for="item in industryTabs"
                :key="item.name"
                type="button"
                class="es-industry-tab"
                :class="{ active: activeIndustry === item.name }"
                @click="activeIndustry = item.name"
              >
                <span class="es-tab-dot" :style="{ background: item.color }" />
                <strong>{{ item.name }}</strong>
                <small>{{ item.count }}</small>
              </button>
            </div>
          </div>

          <!-- 产业链结构雷达 -->
          <div class="es-panel es-chart-panel">
            <div class="es-panel-head">
              <span>产业链结构</span>
              <span class="es-panel-note">来源联动</span>
            </div>
            <VChart class="es-chart" :option="chainOption" autoresize />
          </div>

          <!-- 实时信号 -->
          <div class="es-panel es-event-panel">
            <div class="es-panel-head">
              <span>实时信号</span>
              <span class="es-live-badge">LIVE</span>
            </div>
            <div class="es-events">
              <button
                v-for="event in eventStream"
                :key="event.id"
                type="button"
                class="es-event"
                @click="focusByName(event.company)"
              >
                <span class="es-event-time">{{ event.time }}</span>
                <div class="es-event-body">
                  <strong>{{ event.company }}</strong>
                  <small>{{ event.text }}</small>
                </div>
              </button>
            </div>
          </div>
        </aside>
      </main>

      <!-- 加载遮罩 -->
      <div v-if="loading" class="es-loading">
        <span class="es-loader" />
        <strong>加载企业数据</strong>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import type { CompanyRecord } from '~/types/company'
import { fetchCompanies } from '~/types/company'

definePageMeta({ middleware: ['auth'], keepalive: true })

type SourceFilter = 'all' | 'listed' | 'native' | 'attract'
type DensityMode = 'core' | 'all'
type MetricKey = 'scale' | 'listed' | 'patent' | 'active'

const fallbackCompanies: CompanyRecord[] = [
  makeCompany('武汉光电工程技术研究院', '激光光电', '核心器件', 114.42, 30.505, 88, 0, '本土培育'),
  makeCompany('烽火通信科技', '光通信', '通信设备', 114.435, 30.518, 96, 1, '本土培育'),
  makeCompany('长飞光纤光缆', '光通信', '光纤光缆', 114.448, 30.492, 94, 1, '本土培育'),
  makeCompany('华工科技产业', '激光光电', '智能制造', 114.41, 30.478, 91, 1, '本土培育'),
  makeCompany('人福医药集团', '生物医药', '创新药', 114.455, 30.512, 86, 1, '招商引资'),
  makeCompany('斗鱼网络科技', '数字经济', '平台经济', 114.402, 30.485, 80, 1, '本土培育'),
  makeCompany('光谷云计算中心', '人工智能', '算力服务', 114.428, 30.468, 78, 0, '招商引资'),
  makeCompany('武汉生物城医药', '生物医药', 'CDMO', 114.462, 30.495, 82, 0, '本土培育'),
  makeCompany('光谷芯谷半导体', '半导体', '封装测试', 114.395, 30.502, 84, 0, '招商引资'),
  makeCompany('武汉人工智能研究院', '人工智能', '大模型', 114.418, 30.528, 90, 0, '本土培育'),
  makeCompany('光谷新能源科技', '新能源', '储能系统', 114.44, 30.455, 76, 0, '招商引资'),
  makeCompany('武汉网络安全实验室', '数字经济', '网络安全', 114.452, 30.508, 79, 0, '本土培育'),
  makeCompany('光谷量子技术研究院', '半导体', '量子芯片', 114.432, 30.52, 85, 0, '本土培育'),
  makeCompany('武汉智能制造装备园', '激光光电', '智能装备', 114.415, 30.495, 83, 0, '本土培育'),
  makeCompany('光谷生物医药产业园', '生物医药', '体外诊断', 114.465, 30.48, 81, 0, '招商引资'),
  makeCompany('武汉航空航天科技', '高端装备', '航空电子', 114.385, 30.47, 77, 0, '招商引资'),
]

const loading = ref(false)
const companies = ref<CompanyRecord[]>(fallbackCompanies)
const selectedCompany = ref<CompanyRecord | null>(null)
const sourceFilter = ref<SourceFilter>('all')
const densityMode = ref<DensityMode>('core')
const activeIndustry = ref('all')
const activeMetric = ref<MetricKey>('scale')
const autoPulse = ref(true)
const now = ref(new Date())
let clockTimer: ReturnType<typeof setInterval> | null = null
let cruiseTimer: ReturnType<typeof setInterval> | null = null
let cruiseIndex = 0

const {
  mapContainerRef,
  mapReady,
  hoveredCompany,
  initMap,
  updateCompanies,
  highlightCompany,
  flyToCompany,
  destroyMap,
} = useEnterpriseL7Map()

const sourceFilters: { label: string, value: SourceFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '上市', value: 'listed' },
  { label: '本土', value: 'native' },
  { label: '招商', value: 'attract' },
]

const densityModes: { label: string, value: DensityMode }[] = [
  { label: '核心', value: 'core' },
  { label: '全量', value: 'all' },
]

const filteredCompanies = computed(() => companies.value.filter((company) => {
  if (sourceFilter.value === 'listed' && company.company_traded !== 1) return false
  if (sourceFilter.value === 'native' && !String(company.tag_name || '').includes('本土')) return false
  if (sourceFilter.value === 'attract' && !String(company.tag_name || '').includes('招商')) return false
  if (activeIndustry.value !== 'all' && industryName(company) !== activeIndustry.value) return false
  return true
}))

const mapCompanies = computed(() => {
  const list = [...filteredCompanies.value].sort((a, b) => scoreOf(b) - scoreOf(a))
  return densityMode.value === 'core' ? list.slice(0, 20) : list.slice(0, 80)
})

const topCompanies = computed(() => [...filteredCompanies.value]
  .sort((a, b) => scoreOf(b) - scoreOf(a))
  .slice(0, 7)
  .map((company, index) => ({ ...company, rank: String(index + 1).padStart(2, '0') })))

const industryTabs = computed(() => {
  const counter = new Map<string, number>()
  for (const company of companies.value) {
    const name = industryName(company)
    counter.set(name, (counter.get(name) || 0) + 1)
  }
  return [
    { name: 'all', color: '#68e8d2', count: companies.value.length },
    ...Array.from(counter, ([name, count]) => ({ name, color: colorForName(name), count })),
  ]
})

const legendItems = computed(() => industryTabs.value.filter(t => t.name !== 'all').slice(0, 8))

const metrics = computed(() => {
  const list = filteredCompanies.value
  const patent = list.reduce((sum, company) => sum + patentCount(company), 0)
  const listed = list.filter(company => company.company_traded === 1).length
  return [
    { key: 'scale' as const, label: '企业总数', value: list.length.toLocaleString(), hint: '当前筛选范围' },
    { key: 'listed' as const, label: '上市公司', value: listed.toString(), hint: `${Math.round((listed / Math.max(list.length, 1)) * 100)}% 资本化` },
    { key: 'patent' as const, label: '知识产权', value: patent.toLocaleString(), hint: '专利总数' },
    { key: 'active' as const, label: '活跃指数', value: averageScore(list).toString(), hint: '综合评分均值' },
  ]
})

const listedCount = computed(() => filteredCompanies.value.filter(c => c.company_traded === 1).length)
const nativeCount = computed(() => filteredCompanies.value.filter(c => String(c.tag_name || '').includes('本土')).length)
const attractCount = computed(() => filteredCompanies.value.filter(c => String(c.tag_name || '').includes('招商')).length)

const selectedIndustryLabel = computed(() => activeIndustry.value === 'all' ? '全产业链' : activeIndustry.value)
const currentDate = computed(() => now.value.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', weekday: 'short' }))
const currentTime = computed(() => now.value.toLocaleTimeString('zh-CN', { hour12: false }))

const industryOption = computed(() => {
  const items = industryTabs.value.filter(item => item.name !== 'all').slice(0, 8)
  return {
    backgroundColor: 'transparent',
    grid: { left: 8, right: 16, top: 18, bottom: 12, containLabel: true },
    tooltip: { trigger: 'axis', backgroundColor: '#071114', borderColor: 'rgba(104,232,210,.22)', textStyle: { color: '#d7fff8' } },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      inverse: true,
      data: items.map(item => item.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#8aa8a4', fontSize: 11 },
    },
    series: [{
      type: 'bar',
      data: items.map(item => ({ value: item.count, itemStyle: { color: item.color } })),
      barWidth: 10,
      showBackground: true,
      backgroundStyle: { color: 'rgba(255,255,255,.05)', borderRadius: 8 },
      itemStyle: { borderRadius: 8 },
      label: { show: true, position: 'right', color: '#e7fff9', fontSize: 11 },
    }],
  }
})

const chainOption = computed(() => {
  const list = filteredCompanies.value
  const native = list.filter(company => String(company.tag_name || '').includes('本土')).length
  const attract = list.filter(company => String(company.tag_name || '').includes('招商')).length
  const listed = list.filter(company => company.company_traded === 1).length
  return {
    backgroundColor: 'transparent',
    tooltip: { backgroundColor: '#071114', borderColor: 'rgba(104,232,210,.22)', textStyle: { color: '#d7fff8' } },
    radar: {
      center: ['50%', '52%'],
      radius: '68%',
      splitNumber: 4,
      axisName: { color: '#9db8b4', fontSize: 11 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,.12)' } },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,.1)' } },
      splitArea: { areaStyle: { color: ['rgba(104,232,210,.03)', 'rgba(255,255,255,.015)'] } },
      indicator: [
        { name: '创新', max: 100 },
        { name: '资本', max: 100 },
        { name: '招商', max: 100 },
        { name: '本土', max: 100 },
        { name: '链主', max: 100 },
      ],
    },
    series: [{
      type: 'radar',
      data: [{
        value: [
          averageScore(list),
          Math.min(100, listed * 18 + 28),
          Math.min(100, attract * 14 + 30),
          Math.min(100, native * 10 + 36),
          Math.min(100, list.length * 3 + 42),
        ],
        areaStyle: { color: 'rgba(104,232,210,.2)' },
        lineStyle: { color: '#68e8d2', width: 2 },
        itemStyle: { color: '#68e8d2' },
      }],
    }],
  }
})

const eventStream = computed(() => topCompanies.value.slice(0, 5).map((company, index) => ({
  id: `${company.id}-${index}`,
  time: ['09:42', '10:16', '11:08', '14:22', '15:35'][index] || '16:00',
  company: company.company_name,
  text: [
    '产业链关系已更新',
    '知识产权指标上升',
    '企业画像完成校准',
    '招商匹配度进入高优先级',
    '空间聚集热度提升',
  ][index] || '数据完成同步',
})))

function selectCompany(company: CompanyRecord) {
  selectedCompany.value = company
  activeIndustry.value = industryName(company)
  highlightCompany(company)
  flyToCompany(company)
}

function focusByName(name: string) {
  const hit = companies.value.find(company => company.company_name === name)
  if (hit) selectCompany(hit)
}

function industryName(company: CompanyRecord) {
  return clean(company.chain_name) || clean(company.product_type) || clean(company.company_industry) || '综合服务'
}

function industryColor(company: CompanyRecord) {
  return colorForName(industryName(company))
}

function colorForName(name: string) {
  const palette = ['#68e8d2', '#7dd3fc', '#f2c46d', '#f48fb1', '#a7f070', '#89a7ff', '#ff9f68', '#b6f3ff']
  let hash = 0
  for (const char of name) hash = (hash + char.charCodeAt(0)) % palette.length
  return palette[hash]
}

function scoreOf(company: CompanyRecord) {
  return Number(company.company_score) || 60 + (patentCount(company) % 25)
}

function averageScore(list: CompanyRecord[]) {
  if (!list.length) return 0
  return Math.round(list.reduce((sum, company) => sum + scoreOf(company), 0) / list.length)
}

function patentCount(company: CompanyRecord) {
  return Number(company.authorized_patents_count || 0) + Number(company.authorized_invention_patents_count || 0)
}

function standardCount(company: CompanyRecord) {
  return Number(company.national_standards_count || 0) + Number(company.participated_standards_count || 0)
}

function clean(value?: string | null) {
  const text = String(value || '').trim()
  return text && text !== '-' ? text : ''
}

function normalizeCompany(company: CompanyRecord): CompanyRecord {
  return {
    ...company,
    id: company.id || company.company_credit_code || `${company.company_name}-${company.company_longitude}`,
    company_score: Number(company.company_score) || 70,
    tag_name: company.tag_name || (company.import_project === 1 ? '招商引资' : '本土培育'),
  }
}

function makeCompany(
  name: string,
  chain: string,
  product: string,
  lng: number,
  lat: number,
  score: number,
  listed: 0 | 1,
  tag: string,
): CompanyRecord {
  return {
    id: `${name}-${lng}`,
    company_name: name,
    company_longitude: lng,
    company_latitude: lat,
    company_credit_code: `${Math.abs(Math.round(lng * lat * 1000000))}`,
    company_city: '武汉市',
    conpany_district: '东湖高新区',
    company_work_add: '光谷核心区',
    info_type: 1,
    info_type_name: '企业',
    company_legal_person: '-',
    company_registered_capital: '-',
    company_found_date: '-',
    company_business_status: '存续',
    company_type: '科技企业',
    company_industry: chain,
    company_business_scope: '-',
    company_phone: '-',
    company_website: '-',
    company_email: '-',
    company_traded: listed,
    product_type: product,
    chain_name: chain,
    import_project: tag.includes('招商') ? 1 : 0,
    company_source: tag.includes('招商') ? 2 : 1,
    tag_name: tag,
    product,
    honors: '-',
    contact_info: '-',
    honrs: '-',
    hornor_num: 0,
    val_org_type: '重点企业',
    remark: null,
    above_scale: null,
    company_score: score,
    latest_financing_date: '-',
    authorized_patents_count: Math.round(score * 1.7),
    authorized_invention_patents_count: Math.round(score * 0.45),
    national_standards_count: Math.round(score / 18),
    participated_standards_count: Math.round(score / 12),
    company_financing_round: listed ? '上市' : '战略融资',
    company_scale: '规上企业',
    company_nature: listed ? '上市公司' : '高新技术企业',
  }
}

async function loadCompanies() {
  loading.value = true
  try {
    const res = await fetchCompanies(1, 300)
    const list = res.data?.list || []
    companies.value = list.length ? list.map(normalizeCompany) : fallbackCompanies
    selectedCompany.value = companies.value.find(company => company.company_traded === 1) || companies.value[0] || null
  } catch {
    companies.value = fallbackCompanies
    selectedCompany.value = fallbackCompanies[1]
  } finally {
    loading.value = false
  }
}

// 监听筛选变化，更新地图
watch([filteredCompanies, mapReady], () => {
  if (mapReady.value) {
    updateCompanies(
      mapCompanies.value,
      selectCompany,
      (c) => { hoveredCompany.value = c },
    )
  }
})

// 自动巡航
watch(autoPulse, (active) => {
  if (active) {
    cruiseTimer = setInterval(() => {
      const list = topCompanies.value
      if (!list.length) return
      cruiseIndex = (cruiseIndex + 1) % list.length
      selectCompany(list[cruiseIndex])
    }, 4000)
  } else {
    if (cruiseTimer) clearInterval(cruiseTimer)
    cruiseTimer = null
  }
}, { immediate: true })

onMounted(async () => {
  await loadCompanies()
  initMap(mapCompanies.value, selectCompany, (c) => { hoveredCompany.value = c })
  clockTimer = setInterval(() => { now.value = new Date() }, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (cruiseTimer) clearInterval(cruiseTimer)
  destroyMap()
})
</script>

<style scoped>
.es-screen {
  position: relative;
  min-height: calc(100dvh - 112px);
  overflow: hidden;
  padding: 16px;
  color: #d7fff8;
  background: #040809;
}

.es-bg-grid {
  position: absolute;
  inset: 0;
  opacity: 0.25;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(104, 232, 210, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(104, 232, 210, 0.06) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 78%);
}

.es-bg-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 48% 42%, rgba(104, 232, 210, 0.1), transparent 36%),
    radial-gradient(circle at 82% 78%, rgba(242, 196, 109, 0.06), transparent 28%);
}

.es-header,
.es-body,
.es-loading {
  position: relative;
  z-index: 1;
}

/* ============================
   顶部标题栏
   ============================ */
.es-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  height: 68px;
  padding: 0 4px 14px;
}

.es-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.es-brand-mark {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  color: #041111;
  background: linear-gradient(135deg, #68e8d2, #f2c46d);
  border-radius: 12px;
  box-shadow: 0 0 28px rgba(104, 232, 210, 0.24);
}

.es-kicker {
  margin: 0 0 3px;
  color: #7d9994;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.es-brand h1 {
  margin: 0;
  font-size: clamp(20px, 2.4vw, 32px);
  line-height: 1;
  color: #f2fffc;
}

.es-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.es-clock {
  min-width: 140px;
  padding: 8px 14px;
  border: 1px solid rgba(104, 232, 210, 0.16);
  border-radius: 12px;
  background: rgba(5, 17, 18, 0.6);
  text-align: right;
}

.es-clock span {
  display: block;
  color: #74928c;
  font-size: 11px;
}

.es-clock strong {
  display: block;
  color: #f2fffc;
  font-size: 16px;
  line-height: 1.1;
}

.es-cruise-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  color: #061311;
  border: 0;
  border-radius: 12px;
  background: #68e8d2;
  font-weight: 800;
  font-size: 12px;
  cursor: pointer;
  transition: filter 0.15s;
}

.es-cruise-btn:hover {
  filter: brightness(1.1);
}

.es-cruise-btn.active {
  background: linear-gradient(135deg, #68e8d2, #f2c46d);
}

/* ============================
   主体三栏
   ============================ */
.es-body {
  display: grid;
  grid-template-columns: minmax(250px, 0.72fr) minmax(480px, 1.5fr) minmax(260px, 0.76fr);
  gap: 14px;
  min-height: calc(100dvh - 180px);
}

.es-col {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.es-left {
  grid-template-rows: auto minmax(190px, 1fr) minmax(220px, 1.1fr);
}

.es-right {
  grid-template-rows: auto minmax(190px, 1fr) minmax(220px, 1.1fr);
}

/* ============================
   面板通用
   ============================ */
.es-panel {
  min-width: 0;
  border: 1px solid rgba(104, 232, 210, 0.14);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01)),
    rgba(6, 18, 20, 0.7);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 12px 40px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(16px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.es-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  height: 40px;
  padding: 0 12px;
  border-bottom: 1px solid rgba(104, 232, 210, 0.1);
  color: #f3fffc;
  font-size: 13px;
  font-weight: 800;
  flex-shrink: 0;
}

.es-panel-note {
  color: #789690;
  font-size: 11px;
  font-weight: 700;
}

.es-icon-btn,
.es-text-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: #9bb8b3;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.es-icon-btn {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 8px;
}

.es-icon-btn:hover,
.es-text-btn:hover {
  color: #68e8d2;
}

/* ============================
   KPI 指标
   ============================ */
.es-kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 12px;
}

.es-kpi {
  min-height: 80px;
  padding: 12px;
  text-align: left;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  color: #d7fff8;
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.es-kpi:hover,
.es-kpi.active {
  border-color: rgba(104, 232, 210, 0.4);
  background: rgba(104, 232, 210, 0.07);
}

.es-kpi-label {
  display: block;
  color: #7c9993;
  font-size: 11px;
}

.es-kpi strong {
  display: block;
  margin: 6px 0 2px;
  color: #f5fffc;
  font-size: 24px;
  line-height: 1;
}

.es-kpi small {
  display: block;
  color: #789690;
  font-size: 10px;
}

/* ============================
   图表
   ============================ */
.es-chart-panel {
  min-height: 0;
}

.es-chart {
  flex: 1;
  min-height: 160px;
}

/* ============================
   企业列表
   ============================ */
.es-list-panel,
.es-event-panel {
  min-height: 0;
}

.es-company-list,
.es-events {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.es-company-list::-webkit-scrollbar,
.es-events::-webkit-scrollbar,
.es-industry-tabs::-webkit-scrollbar {
  width: 3px;
}

.es-company-list::-webkit-scrollbar-thumb,
.es-events::-webkit-scrollbar-thumb,
.es-industry-tabs::-webkit-scrollbar-thumb {
  background: rgba(104, 232, 210, 0.2);
  border-radius: 2px;
}

.es-company-row {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) 38px;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: #d7fff8;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s;
}

.es-company-row + .company-row {
  margin-top: 4px;
}

.es-company-row:hover,
.es-company-row.active {
  border-color: rgba(104, 232, 210, 0.24);
  background: rgba(104, 232, 210, 0.06);
}

.es-company-rank {
  color: #f2c46d;
  font-size: 11px;
  font-weight: 900;
}

.es-company-info {
  min-width: 0;
}

.es-company-info strong {
  display: block;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.es-company-info small {
  display: block;
  color: #789690;
  font-size: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.es-score {
  display: grid;
  height: 28px;
  place-items: center;
  color: #061311;
  background: #68e8d2;
  border-radius: 8px;
  font-weight: 900;
  font-size: 12px;
}

/* ============================
   中央地图区
   ============================ */
.es-center {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.es-map-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.es-filter-group {
  display: flex;
  gap: 6px;
  padding: 5px;
  border: 1px solid rgba(104, 232, 210, 0.12);
  border-radius: 12px;
  background: rgba(6, 18, 20, 0.7);
}

.es-filter {
  height: 30px;
  padding: 0 12px;
  color: #8aa8a4;
  border: 0;
  border-radius: 9px;
  background: transparent;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: color 0.12s, background 0.12s;
}

.es-filter.active,
.es-filter:hover {
  color: #061311;
  background: #68e8d2;
}

.es-map-stage {
  position: relative;
  flex: 1;
  min-height: 520px;
  border: 1px solid rgba(104, 232, 210, 0.16);
  border-radius: 16px;
  overflow: hidden;
  background: #060d10;
  box-shadow: inset 0 0 80px rgba(104, 232, 210, 0.04), 0 16px 56px rgba(0, 0, 0, 0.32);
}

.es-map-container {
  width: 100%;
  height: 100%;
}

.es-map-container :deep(canvas) {
  outline: none;
}

/* 地图加载中 */
.es-map-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(4, 8, 9, 0.85);
  z-index: 10;
}

.es-map-loading strong {
  margin-top: 50px;
  color: #d7fff8;
  font-size: 13px;
}

.es-loader {
  position: absolute;
  width: 40px;
  height: 40px;
  border: 2px solid rgba(104, 232, 210, 0.16);
  border-top-color: #68e8d2;
  border-radius: 50%;
  animation: es-spin 0.8s linear infinite;
}

/* ============================
   地图悬浮卡片
   ============================ */
.es-map-stats {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 5;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  max-width: 280px;
}

.es-stat-card {
  padding: 10px 14px;
  border: 1px solid rgba(104, 232, 210, 0.14);
  border-radius: 10px;
  background: rgba(5, 17, 18, 0.78);
  backdrop-filter: blur(14px);
}

.es-stat-label {
  display: block;
  color: #789690;
  font-size: 10px;
  font-weight: 600;
}

.es-stat-value {
  display: block;
  margin-top: 4px;
  color: #f5fffc;
  font-size: 22px;
  line-height: 1;
}

.es-stat-listed { color: #f2c46d; }
.es-stat-native { color: #68e8d2; }
.es-stat-attract { color: #f48fb1; }

/* 图例 */
.es-map-legend {
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 5;
  padding: 10px 14px;
  border: 1px solid rgba(104, 232, 210, 0.14);
  border-radius: 10px;
  background: rgba(5, 17, 18, 0.78);
  backdrop-filter: blur(14px);
  max-width: 320px;
}

.es-legend-title {
  display: block;
  color: #789690;
  font-size: 10px;
  font-weight: 700;
  margin-bottom: 6px;
}

.es-legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.es-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #ccece6;
  font-size: 11px;
}

.es-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 信息条 */
.es-map-info {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid rgba(104, 232, 210, 0.14);
  border-radius: 10px;
  background: rgba(5, 17, 18, 0.78);
  backdrop-filter: blur(14px);
  color: #789690;
  font-size: 11px;
}

.es-map-info strong {
  color: #68e8d2;
  font-size: 13px;
}

/* 悬浮提示 */
.es-hover-tip {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 8;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 14px;
  border: 1px solid rgba(242, 196, 109, 0.3);
  border-radius: 10px;
  background: rgba(5, 17, 18, 0.9);
  backdrop-filter: blur(14px);
  max-width: 260px;
}

.es-hover-tip strong {
  color: #f2c46d;
  font-size: 12px;
}

.es-hover-tip span {
  color: #789690;
  font-size: 11px;
}

/* ============================
   企业详情抽屉
   ============================ */
.es-detail {
  position: absolute;
  right: 16px;
  top: 72px;
  z-index: 7;
  width: min(320px, calc(100% - 32px));
  border: 1px solid rgba(104, 232, 210, 0.2);
  border-radius: 14px;
  background: rgba(5, 17, 18, 0.88);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  padding: 16px;
}

.es-detail-close {
  position: absolute;
  top: 10px;
  right: 10px;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  color: #9bb8b3;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
}

.es-detail-close:hover {
  color: #68e8d2;
  background: rgba(255, 255, 255, 0.08);
}

.es-detail-header {
  display: flex;
  gap: 10px;
  padding-right: 24px;
  margin-bottom: 14px;
}

.es-detail-avatar {
  display: grid;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  place-items: center;
  color: #061311;
  border-radius: 12px;
  font-weight: 900;
  font-size: 13px;
}

.es-detail-header h2 {
  margin: 0;
  color: #f5fffc;
  font-size: 16px;
  line-height: 1.25;
}

.es-detail-header p {
  margin: 4px 0 0;
  color: #86a39d;
  font-size: 11px;
}

.es-detail-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 14px;
}

.es-detail-metrics div {
  padding: 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  text-align: center;
}

.es-detail-metrics small {
  display: block;
  color: #789690;
  font-size: 10px;
}

.es-detail-metrics strong {
  display: block;
  color: #68e8d2;
  font-size: 20px;
  margin-top: 2px;
}

.es-detail-list {
  display: grid;
  gap: 8px;
  margin: 0 0 14px;
}

.es-detail-list div {
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr);
  gap: 8px;
}

.es-detail-list dt {
  color: #789690;
  font-size: 11px;
}

.es-detail-list dd {
  margin: 0;
  color: #e2fff9;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.es-detail-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 38px;
  color: #061311;
  text-decoration: none;
  border-radius: 11px;
  background: #68e8d2;
  font-weight: 800;
  font-size: 13px;
  transition: filter 0.15s;
}

.es-detail-link:hover {
  filter: brightness(1.1);
}

/* ============================
   产业筛选 tabs
   ============================ */
.es-filter-panel {
  min-height: 0;
}

.es-industry-tabs {
  display: grid;
  gap: 6px;
  padding: 8px;
  max-height: 220px;
  overflow-y: auto;
}

.es-industry-tab {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  color: #ccece6;
  border: 1px solid transparent;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s;
}

.es-industry-tab:hover,
.es-industry-tab.active {
  border-color: rgba(104, 232, 210, 0.28);
  background: rgba(104, 232, 210, 0.07);
}

.es-tab-dot {
  width: 6px;
  height: 24px;
  border-radius: 4px;
}

.es-industry-tab strong {
  min-width: 0;
  text-align: left;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.es-industry-tab small {
  color: #f2c46d;
  font-weight: 900;
  font-size: 11px;
}

/* ============================
   实时信号
   ============================ */
.es-live-badge {
  color: #061311;
  background: #f2c46d;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 900;
}

.es-event {
  display: flex;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: #d7fff8;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.12s, background 0.12s;
}

.es-event:hover {
  border-color: rgba(104, 232, 210, 0.24);
  background: rgba(104, 232, 210, 0.06);
}

.es-event-time {
  flex-shrink: 0;
  color: #f2c46d;
  font-size: 11px;
  font-weight: 900;
  padding-top: 2px;
}

.es-event-body {
  min-width: 0;
}

.es-event-body strong {
  display: block;
  color: #f3fffc;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.es-event-body small {
  display: block;
  color: #7e9b95;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ============================
   加载遮罩
   ============================ */
.es-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(3, 8, 9, 0.7);
  backdrop-filter: blur(10px);
  z-index: 100;
}

.es-loading strong {
  margin-top: 50px;
  color: #d7fff8;
}

/* ============================
   动画
   ============================ */
@keyframes es-spin {
  to { transform: rotate(360deg); }
}

.es-drawer-enter-active,
.es-drawer-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.es-drawer-enter-from,
.es-drawer-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

.es-fade-enter-active,
.es-fade-leave-active {
  transition: opacity 0.3s ease;
}

.es-fade-enter-from,
.es-fade-leave-to {
  opacity: 0;
}

/* ============================
   响应式
   ============================ */
@media (max-width: 1180px) {
  .es-body {
    grid-template-columns: 1fr;
  }

  .es-left,
  .es-right {
    grid-template-rows: none;
  }

  .es-map-stage {
    min-height: 580px;
  }
}

@media (max-width: 720px) {
  .es-screen {
    padding: 10px;
  }

  .es-header {
    height: auto;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .es-map-toolbar {
    flex-direction: column;
  }

  .es-map-stats {
    grid-template-columns: 1fr 1fr;
    max-width: calc(100% - 32px);
  }

  .es-detail {
    top: auto;
    bottom: 16px;
    right: 16px;
    left: 16px;
    width: auto;
  }
}
</style>
