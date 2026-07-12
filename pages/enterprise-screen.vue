<template>
  <ClientOnly>
    <div class="gs-screen">
      <!-- 背景层：极淡星纹 + 顶部/底部装饰线 -->
      <div class="gs-bg" aria-hidden="true">
        <div class="gs-bg-grain" />
        <div class="gs-bg-vignette" />
      </div>

      <!-- 四角装饰印章 -->
      <span class="gs-corner gs-corner-tl" aria-hidden="true" />
      <span class="gs-corner gs-corner-tr" aria-hidden="true" />
      <span class="gs-corner gs-corner-bl" aria-hidden="true" />
      <span class="gs-corner gs-corner-br" aria-hidden="true" />

      <!-- 顶部标题栏 -->
      <header class="gs-header">
        <div class="gs-header-left">
          <div class="gs-seal">
            <svg viewBox="0 0 40 40" class="gs-seal-svg" aria-hidden="true">
              <rect x="1" y="1" width="38" height="38" rx="2" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.6" />
              <rect x="6" y="6" width="28" height="28" rx="1" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.4" />
              <path d="M13 20 h14 M20 13 v14" stroke="currentColor" stroke-width="1" />
              <circle cx="20" cy="20" r="4.5" fill="none" stroke="currentColor" stroke-width="1" />
            </svg>
          </div>
          <div class="gs-header-title">
            <p class="gs-header-org">智知云 · 产业情报中心</p>
            <p class="gs-header-eng">EAST LAKE HIGH-TECH ZONE INTELLIGENCE</p>
          </div>
        </div>

        <div class="gs-header-center">
          <div class="gs-title-line" />
          <h1 class="gs-title">光谷高新区 · 产业态势总览</h1>
          <div class="gs-title-line" />
          <p class="gs-title-sub">
            东湖高新技术开发区
            <span class="gs-title-sep" />
            期次
            <span class="gs-title-value">{{ reportPeriod }}</span>
            <span class="gs-title-sep" />
            共 <span class="gs-title-value">{{ companies.length }}</span> 家在册企业
          </p>
        </div>

        <div class="gs-header-right">
          <div class="gs-clock">
            <div class="gs-clock-time">{{ currentTime }}</div>
            <div class="gs-clock-date">
              {{ currentDate }}
              <span class="gs-sep-dot" />
              {{ weekDay }}
            </div>
          </div>
          <div class="gs-sync">
            <span class="gs-sync-dot" />
            数据同步
            <strong>{{ syncTime }}</strong>
          </div>
        </div>
      </header>

      <!-- 主体三栏 -->
      <main class="gs-body">
        <!-- 左栏 -->
        <aside class="gs-col gs-left">
          <!-- 01 核心指标 -->
          <section class="gs-panel">
            <div class="gs-panel-head">
              <h2>核心指标</h2>
            </div>
            <div class="gs-metrics">
              <article
                v-for="metric in metrics"
                :key="metric.key"
                class="gs-metric"
                :class="{ active: activeMetric === metric.key }"
              >
                <div class="gs-metric-head">
                  <span class="gs-metric-label">{{ metric.label }}</span>
                  <span class="gs-metric-unit">{{ metric.unit }}</span>
                </div>
                <div class="gs-metric-value">{{ metric.value }}</div>
                <div class="gs-metric-hint">{{ metric.hint }}</div>
              </article>
            </div>
          </section>

          <!-- 02 产业集群分布 -->
          <section class="gs-panel gs-panel-flex">
            <div class="gs-panel-head">
              <h2>产业集群分布</h2>
              <span class="gs-panel-tag">{{ filteredCompanies.length }} 家</span>
            </div>
            <VChart class="gs-chart" :option="industryOption" autoresize />
          </section>

          <!-- 03 重点企业名录 -->
          <section class="gs-panel gs-panel-flex">
            <div class="gs-panel-head">
              <h2>重点企业名录</h2>
              <span class="gs-panel-tag">TOP {{ topCompanies.length }}</span>
            </div>
            <div class="gs-companies">
              <div
                v-for="company in topCompanies"
                :key="company.id"
                class="gs-company"
                :class="{ active: selectedCompany?.id === company.id }"
                @click="selectCompany(company)"
              >
                <span class="gs-company-rank">{{ company.rank }}</span>
                <div class="gs-company-body">
                  <strong>{{ company.company_name }}</strong>
                  <small>{{ company.chain_name || company.product_type || '综合服务' }}</small>
                </div>
                <div class="gs-company-score">
                  <span>{{ Math.round(scoreOf(company)) }}</span>
                  <small>评分</small>
                </div>
              </div>
            </div>
          </section>
        </aside>

        <!-- 中央地图 -->
        <section class="gs-center">
          <div class="gs-stage">
            <div ref="mapContainerRef" class="gs-stage-canvas" />

            <!-- 地图加载 -->
            <div v-if="!mapReady" class="gs-stage-loading">
              <span class="gs-loader" />
              <span>地图渲染中</span>
            </div>

            <!-- 左上：园区分布图例 -->
            <div class="gs-legend">
              <span class="gs-legend-title">园区分布</span>
              <div class="gs-legend-items">
                <span
                  v-for="item in parkLegend"
                  :key="item.name"
                  class="gs-legend-item"
                >
                  <span class="gs-legend-dot" :style="{ background: item.color }" />
                  {{ item.shortName }} · {{ item.count }}
                </span>
              </div>
            </div>

          </div>
        </section>

        <!-- 右栏 -->
        <aside class="gs-col gs-right">
          <!-- 04 产业结构 -->
          <section class="gs-panel gs-panel-flex">
            <div class="gs-panel-head">
              <h2>产业结构评估</h2>
              <span class="gs-panel-tag">五维</span>
            </div>
            <VChart class="gs-chart" :option="chainOption" autoresize />
          </section>

          <!-- 05 来源结构 -->
          <section class="gs-panel">
            <div class="gs-panel-head">
              <h2>企业来源</h2>
            </div>
            <div class="gs-bars">
              <div
                v-for="bar in sourceBars"
                :key="bar.label"
                class="gs-bar"
              >
                <div class="gs-bar-info">
                  <span class="gs-bar-label">{{ bar.label }}</span>
                  <span class="gs-bar-value">{{ bar.value }} <small>{{ bar.percent }}%</small></span>
                </div>
                <div class="gs-bar-track">
                  <div class="gs-bar-fill" :style="{ width: bar.percent + '%' }" />
                </div>
              </div>
            </div>
          </section>

          <!-- 06 新闻动态 -->
          <section class="gs-panel gs-panel-flex">
            <div class="gs-panel-head">
              <h2>新闻动态</h2>
              <span class="gs-panel-tag">{{ newsPanelTag }}</span>
            </div>
            <div class="gs-events">
              <div v-if="newsLoading" class="gs-events-empty">加载新闻中</div>
              <div v-else-if="!newsList.length" class="gs-events-empty">暂无新闻</div>
              <template v-else>
                <a
                  v-for="item in newsList"
                  :key="item.id"
                  class="gs-event gs-event-link"
                  :href="item.url || undefined"
                  target="_blank"
                  rel="noopener noreferrer"
                  @click.prevent="openNews(item)"
                >
                  <div class="gs-event-time">
                    <strong>{{ item.time || '--:--' }}</strong>
                    <small>{{ formatNewsDate(item.date) }}</small>
                  </div>
                  <div class="gs-event-body">
                    <strong>{{ item.source || '资讯' }}</strong>
                    <p>{{ item.title }}</p>
                  </div>
                </a>
              </template>
            </div>
          </section>
        </aside>
      </main>

      <!-- 底栏 · 数据来源与版权 -->
      <footer class="gs-footer">
        <span>数据来源 · 光谷高新区经济信息中心 / 天眼查 / 企查查 / 国家知识产权局</span>
        <span class="gs-footer-sep" />
        <span>更新频率 · 每 4 小时</span>
        <span class="gs-footer-sep" />
        <span>版本 · 智知云 产业情报中心</span>
      </footer>

      <!-- 全屏加载 -->
      <div v-if="loading" class="gs-loading">
        <span class="gs-loader" />
        <span>加载企业数据</span>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import type { CompanyRecord } from '~/types/company'
import { fetchCompanies } from '~/types/company'
import { newsRequest } from '~/utils/request'

definePageMeta({ layout: 'blank', middleware: ['auth'], keepalive: true, ssr: false })

type SourceFilter = 'all' | 'listed' | 'native' | 'attract'
type MetricKey = 'scale' | 'listed' | 'patent' | 'active'

interface NewsItem {
  id: string
  title: string
  source: string
  date: string
  time: string
  url: string
}

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

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
const activeIndustry = ref('all')
const activeMetric = ref<MetricKey>('scale')
const now = ref(new Date())
const syncStamp = ref(new Date())
const newsList = ref<NewsItem[]>([])
const newsLoading = ref(false)
let clockTimer: ReturnType<typeof setInterval> | null = null

const {
  mapContainerRef,
  mapReady,
  parkLegend,
  initMap,
  updateCompanies,
  highlightCompany,
  flyToCompany,
  destroyMap,
} = useEnterpriseL7Map()

const filteredCompanies = computed(() => companies.value.filter((company) => {
  if (sourceFilter.value === 'listed' && company.company_traded !== 1) return false
  if (sourceFilter.value === 'native' && !String(company.tag_name || '').includes('本土')) return false
  if (sourceFilter.value === 'attract' && !String(company.tag_name || '').includes('招商')) return false
  if (activeIndustry.value !== 'all' && industryName(company) !== activeIndustry.value) return false
  return true
}))

const topCompanies = computed(() => [...filteredCompanies.value]
  .sort((a, b) => scoreOf(b) - scoreOf(a))
  .slice(0, 8)
  .map((company, index) => ({ ...company, rank: String(index + 1).padStart(2, '0') })))

const industryTabs = computed(() => {
  const counter = new Map<string, number>()
  for (const company of companies.value) {
    const name = industryName(company)
    counter.set(name, (counter.get(name) || 0) + 1)
  }
  return Array.from(counter, ([name, count]) => ({ name, color: colorForName(name), count }))
    .sort((a, b) => b.count - a.count)
})

const listedCount = computed(() => filteredCompanies.value.filter(c => c.company_traded === 1).length)
const nativeCount = computed(() => filteredCompanies.value.filter(c => String(c.tag_name || '').includes('本土')).length)
const attractCount = computed(() => filteredCompanies.value.filter(c => String(c.tag_name || '').includes('招商')).length)
const totalPatents = computed(() => filteredCompanies.value.reduce((s, c) => s + patentCount(c), 0))

const metrics = computed(() => {
  const list = filteredCompanies.value
  const patents = list.reduce((sum, c) => sum + patentCount(c), 0)
  const listed = list.filter(c => c.company_traded === 1).length
  const listedRate = list.length ? Math.round((listed / list.length) * 1000) / 10 : 0
  return [
    { key: 'scale' as const, label: '企业总数', unit: '家', value: list.length.toLocaleString(), hint: '当前筛选范围' },
    { key: 'listed' as const, label: '上市公司', unit: '家', value: listed.toString(), hint: `资本化率 ${listedRate}%` },
    { key: 'patent' as const, label: '知识产权', unit: '件', value: patents.toLocaleString(), hint: '专利总量' },
    { key: 'active' as const, label: '综合评分', unit: '分', value: averageScore(list).toString(), hint: '均值口径' },
  ]
})

const sourceBars = computed(() => {
  const total = filteredCompanies.value.length || 1
  const native = nativeCount.value
  const attract = attractCount.value
  const listed = listedCount.value
  const other = Math.max(0, total - native - attract)
  return [
    { label: '本土培育', value: native, percent: Math.round((native / total) * 100) },
    { label: '招商引资', value: attract, percent: Math.round((attract / total) * 100) },
    { label: '上市公司', value: listed, percent: Math.round((listed / total) * 100) },
    { label: '其他类型', value: other, percent: Math.round((other / total) * 100) },
  ]
})

const currentDate = computed(() => {
  const d = now.value
  return `${d.getFullYear()} 年 ${String(d.getMonth() + 1).padStart(2, '0')} 月 ${String(d.getDate()).padStart(2, '0')} 日`
})
const currentTime = computed(() => now.value.toLocaleTimeString('zh-CN', { hour12: false }))
const weekDay = computed(() => WEEKDAYS[now.value.getDay()])
const syncTime = computed(() => syncStamp.value.toLocaleTimeString('zh-CN', { hour12: false }).slice(0, 5))
const reportPeriod = computed(() => {
  const d = syncStamp.value
  const q = Math.floor(d.getMonth() / 3) + 1
  return `${d.getFullYear()}-Q${q}`
})

// ECharts · 产业集群横条
const industryOption = computed(() => {
  const items = industryTabs.value.slice(0, 8)
  return {
    backgroundColor: 'transparent',
    grid: { left: 10, right: 22, top: 8, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(198, 164, 100, 0.06)' } },
      backgroundColor: 'rgba(10, 20, 40, 0.94)',
      borderColor: 'rgba(198, 164, 100, 0.32)',
      borderWidth: 1,
      textStyle: { color: '#f5f2e8', fontSize: 12 },
    },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      inverse: true,
      data: items.map(i => i.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#c8cee0', fontSize: 12 },
    },
    series: [{
      type: 'bar',
      data: items.map((i, idx) => ({
        value: i.count,
        itemStyle: {
          color: idx === 0
            ? { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [
                { offset: 0, color: 'rgba(224, 192, 132, 0.9)' },
                { offset: 1, color: 'rgba(198, 164, 100, 0.7)' },
              ] }
            : 'rgba(200, 206, 224, 0.28)',
        },
      })),
      barWidth: 8,
      showBackground: true,
      backgroundStyle: { color: 'rgba(245, 242, 232, 0.04)' },
      itemStyle: { borderRadius: [0, 2, 2, 0] },
      label: {
        show: true,
        position: 'right',
        color: '#f5f2e8',
        fontSize: 12,
        fontFamily: 'DIN Alternate, ui-monospace, monospace',
        formatter: '{c}',
      },
    }],
  }
})

// ECharts · 产业结构雷达
const chainOption = computed(() => {
  const list = filteredCompanies.value
  const native = list.filter(c => String(c.tag_name || '').includes('本土')).length
  const attract = list.filter(c => String(c.tag_name || '').includes('招商')).length
  const listed = list.filter(c => c.company_traded === 1).length
  return {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: 'rgba(10, 20, 40, 0.94)',
      borderColor: 'rgba(198, 164, 100, 0.32)',
      textStyle: { color: '#f5f2e8', fontSize: 12 },
    },
    radar: {
      center: ['50%', '54%'],
      radius: '68%',
      splitNumber: 4,
      axisName: { color: '#c8cee0', fontSize: 12, padding: [2, 4] },
      axisLine: { lineStyle: { color: 'rgba(245, 242, 232, 0.12)' } },
      splitLine: { lineStyle: { color: 'rgba(245, 242, 232, 0.09)' } },
      splitArea: { areaStyle: { color: ['rgba(198, 164, 100, 0.02)', 'rgba(245, 242, 232, 0.015)'] } },
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
      symbol: 'circle',
      symbolSize: 5,
      data: [{
        value: [
          averageScore(list),
          Math.min(100, listed * 18 + 28),
          Math.min(100, attract * 14 + 30),
          Math.min(100, native * 10 + 36),
          Math.min(100, list.length * 3 + 42),
        ],
        areaStyle: { color: 'rgba(198, 164, 100, 0.14)' },
        lineStyle: { color: '#e0c084', width: 1.4 },
        itemStyle: { color: '#e0c084', borderColor: '#f5f2e8', borderWidth: 1 },
      }],
    }],
  }
})

const newsPanelTag = computed(() => {
  if (newsLoading.value) return '加载中'
  if (!newsList.value.length) return '暂无数据'
  return `最新 ${newsList.value.length} 条`
})

function parseNewsDateParts(isoTime: string): { date: string, time: string } {
  if (!isoTime) return { date: '', time: '' }
  const cnMatch = isoTime.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/)
  if (cnMatch) return { date: cnMatch[1], time: cnMatch[2] }
  const d = new Date(isoTime)
  if (Number.isNaN(d.getTime())) return { date: '', time: '' }
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return { date: `${y}-${m}-${day}`, time: `${h}:${min}` }
}

function mapNewsItem(item: Record<string, unknown>): NewsItem {
  const { date, time } = parseNewsDateParts(String(item.publish_time || ''))
  return {
    id: String(item.id ?? ''),
    title: String(item.title || ''),
    source: String(item.source || ''),
    date,
    time,
    url: String(item.url || ''),
  }
}

function formatNewsDate(dateStr: string) {
  if (!dateStr) return '--'
  const [, month, day] = dateStr.split('-')
  return `${month}-${day}`
}

function openNews(item: NewsItem) {
  if (!item.url) return
  window.open(item.url, '_blank', 'noopener,noreferrer')
}

async function loadNews() {
  newsLoading.value = true
  try {
    const res = await newsRequest.get('/news/list', {
      params: {
        page: 1,
        page_size: 8,
        sort_by: 'publish_time',
        sort_order: 'desc',
      },
    })
    if (res.data?.code === 0) {
      newsList.value = (res.data.data?.items || []).map(mapNewsItem)
    } else {
      newsList.value = []
    }
  } catch (e) {
    console.error('获取新闻列表失败:', e)
    newsList.value = []
  } finally {
    newsLoading.value = false
  }
}

function selectCompany(company: CompanyRecord) {
  selectedCompany.value = company
  highlightCompany(company)
  flyToCompany(company)
}

function industryName(company: CompanyRecord) {
  return clean(company.chain_name) || clean(company.product_type) || clean(company.company_industry) || '综合服务'
}

function colorForName(name: string) {
  const palette = ['#c6a464', '#e0c084', '#b7935a', '#8fa4c4', '#a86b56', '#6e8bb0', '#c9b98a', '#7d92a8']
  let hash = 0
  for (const char of name) hash = (hash + char.charCodeAt(0)) % palette.length
  return palette[hash]
}

function scoreOf(company: CompanyRecord) {
  return Number(company.company_score) || 60 + (patentCount(company) % 25)
}

function averageScore(list: CompanyRecord[]) {
  if (!list.length) return 0
  return Math.round(list.reduce((sum, c) => sum + scoreOf(c), 0) / list.length)
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
    selectedCompany.value = companies.value.find(c => c.company_traded === 1) || companies.value[0] || null
    syncStamp.value = new Date()
  } catch {
    companies.value = fallbackCompanies
    selectedCompany.value = fallbackCompanies[1]
  } finally {
    loading.value = false
  }
}

watch([filteredCompanies, mapReady], () => {
  if (mapReady.value) {
    updateCompanies(filteredCompanies.value)
  }
})

onMounted(async () => {
  await Promise.all([loadCompanies(), loadNews()])
  await nextTick()
  initMap(filteredCompanies.value)
  clockTimer = setInterval(() => { now.value = new Date() }, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  destroyMap()
})
</script>

<style scoped>
/* ============================================================
   政务藏青金 · 智知云 产业情报大屏
   Palette:  #0a1428 深藏青 / #c6a464 冷金 / #f5f2e8 象牙 / #c25a5a 备红
   ============================================================ */
.gs-screen {
  --gs-bg-deep: #060d1c;
  --gs-bg: #0a1428;
  --gs-bg-elev: #0e1a34;
  --gs-panel: rgba(14, 26, 52, 0.72);
  --gs-panel-solid: #10203f;
  --gs-hair: rgba(200, 206, 224, 0.09);
  --gs-hair-strong: rgba(200, 206, 224, 0.18);
  --gs-gold: #c6a464;
  --gs-gold-soft: #e0c084;
  --gs-gold-line: rgba(198, 164, 100, 0.42);
  --gs-crimson: #c25a5a;
  --gs-text-strong: #f5f2e8;
  --gs-text: #c8cee0;
  --gs-text-mute: #7a8299;
  --gs-text-dim: #5b647c;
  --gs-mono: 'DIN Alternate', 'SF Mono', 'JetBrains Mono', ui-monospace, monospace;

  position: fixed;
  inset: 0;
  overflow: hidden;
  color: var(--gs-text);
  background: var(--gs-bg-deep);
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', sans-serif;
  font-feature-settings: 'tnum';
  display: grid;
  grid-template-rows: 96px 1fr 32px;
  padding: 18px 22px 6px;
}

/* ============ 背景 ============ */
.gs-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(198, 164, 100, 0.09), transparent 45%),
    radial-gradient(ellipse at 15% 100%, rgba(30, 60, 120, 0.18), transparent 55%),
    radial-gradient(ellipse at 85% 100%, rgba(30, 60, 120, 0.14), transparent 55%),
    linear-gradient(180deg, #060d1c 0%, #0a1428 50%, #060d1c 100%);
}

.gs-bg-grain {
  position: absolute;
  inset: 0;
  opacity: 0.32;
  background-image:
    linear-gradient(rgba(198, 164, 100, 0.028) 1px, transparent 1px),
    linear-gradient(90deg, rgba(198, 164, 100, 0.028) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse at center, black 0%, transparent 78%);
}

.gs-bg-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.42) 100%);
}

/* ============ 四角装饰印章 ============ */
.gs-corner {
  position: absolute;
  width: 28px;
  height: 28px;
  border: 1px solid var(--gs-gold);
  opacity: 0.55;
  z-index: 3;
}
.gs-corner-tl { top: 10px; left: 12px; border-right: 0; border-bottom: 0; }
.gs-corner-tr { top: 10px; right: 12px; border-left: 0; border-bottom: 0; }
.gs-corner-bl { bottom: 10px; left: 12px; border-right: 0; border-top: 0; }
.gs-corner-br { bottom: 10px; right: 12px; border-left: 0; border-top: 0; }

/* ============ 顶部标题栏 ============ */
.gs-header {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(260px, 1fr) auto minmax(260px, 1fr);
  align-items: center;
  gap: 24px;
  padding: 0 8px;
  border-bottom: 1px solid var(--gs-hair);
}

.gs-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.gs-seal {
  width: 44px;
  height: 44px;
  color: var(--gs-gold);
  flex-shrink: 0;
}
.gs-seal-svg {
  width: 100%;
  height: 100%;
}

.gs-header-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.gs-header-org {
  margin: 0;
  color: var(--gs-text-strong);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.06em;
}
.gs-header-eng {
  margin: 0;
  color: var(--gs-text-dim);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.24em;
  font-family: var(--gs-mono);
}

.gs-header-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.gs-title-line {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--gs-gold-line) 20%, var(--gs-gold) 50%, var(--gs-gold-line) 80%, transparent 100%);
}
.gs-title {
  margin: 0;
  color: var(--gs-text-strong);
  font-size: clamp(22px, 2.4vw, 32px);
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  text-shadow: 0 0 24px rgba(198, 164, 100, 0.18);
}
.gs-title-sub {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--gs-text-mute);
  font-size: 12px;
  letter-spacing: 0.06em;
}
.gs-title-sep {
  width: 3px;
  height: 3px;
  background: var(--gs-gold);
  opacity: 0.7;
  transform: rotate(45deg);
}
.gs-title-value {
  color: var(--gs-gold-soft);
  font-family: var(--gs-mono);
  font-weight: 600;
  padding: 0 2px;
}

.gs-header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 18px;
}

.gs-clock {
  text-align: right;
  min-width: 156px;
}
.gs-clock-time {
  color: var(--gs-text-strong);
  font-family: var(--gs-mono);
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.04em;
}
.gs-clock-date {
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  color: var(--gs-text-mute);
  font-size: 11px;
  letter-spacing: 0.05em;
}
.gs-sep-dot {
  width: 3px;
  height: 3px;
  background: var(--gs-text-dim);
  border-radius: 50%;
}

.gs-sync {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--gs-hair-strong);
  color: var(--gs-text-mute);
  font-size: 11px;
  letter-spacing: 0.04em;
}
.gs-sync strong {
  color: var(--gs-gold-soft);
  font-family: var(--gs-mono);
  font-weight: 600;
  margin-left: 4px;
}
.gs-sync-dot {
  width: 6px;
  height: 6px;
  background: var(--gs-gold);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--gs-gold);
}

/* ============ 主体三栏 ============ */
.gs-body {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(300px, 22%) 1fr minmax(300px, 22%);
  gap: 18px;
  min-height: 0;
  padding: 18px 4px 4px;
}

.gs-col {
  display: grid;
  gap: 16px;
  min-height: 0;
  min-width: 0;
  grid-template-rows: auto minmax(0, 1fr) minmax(0, 1.15fr);
}

/* ============ 面板通用 ============ */
.gs-panel {
  position: relative;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--gs-hair);
  background:
    linear-gradient(180deg, rgba(198, 164, 100, 0.025) 0%, transparent 30%),
    var(--gs-panel);
  backdrop-filter: blur(6px);
  display: flex;
  flex-direction: column;
}

.gs-panel::before,
.gs-panel::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border: 1px solid var(--gs-gold);
  opacity: 0.7;
}
.gs-panel::before { top: -1px; left: -1px; border-right: 0; border-bottom: 0; }
.gs-panel::after { bottom: -1px; right: -1px; border-left: 0; border-top: 0; }

.gs-panel-flex {
  flex: 1;
  min-height: 0;
}

.gs-panel-head {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 14px;
  border-bottom: 1px solid var(--gs-hair);
  flex-shrink: 0;
}
.gs-panel-idx {
  color: var(--gs-gold);
  font-family: var(--gs-mono);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
}
.gs-panel-head h2 {
  margin: 0;
  color: var(--gs-text-strong);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.14em;
}
.gs-panel-tag {
  margin-left: auto;
  color: var(--gs-text-dim);
  font-size: 11px;
  letter-spacing: 0.06em;
  font-family: var(--gs-mono);
}

/* ============ 01 · 核心指标 ============ */
.gs-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--gs-hair);
  padding: 1px;
}
.gs-metric {
  padding: 14px 16px 12px;
  background: var(--gs-panel-solid);
  transition: background 0.4s ease;
  position: relative;
}
.gs-metric.active {
  background: linear-gradient(180deg, rgba(198, 164, 100, 0.12) 0%, var(--gs-panel-solid) 100%);
}
.gs-metric.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 2px;
  background: var(--gs-gold);
}
.gs-metric-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 8px;
}
.gs-metric-label {
  color: var(--gs-text-mute);
  font-size: 12px;
  letter-spacing: 0.08em;
}
.gs-metric-unit {
  color: var(--gs-text-dim);
  font-size: 10px;
  letter-spacing: 0.06em;
}
.gs-metric-value {
  color: var(--gs-text-strong);
  font-family: var(--gs-mono);
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.02em;
}
.gs-metric.active .gs-metric-value {
  color: var(--gs-gold-soft);
  text-shadow: 0 0 20px rgba(224, 192, 132, 0.4);
}
.gs-metric-hint {
  margin-top: 6px;
  color: var(--gs-text-dim);
  font-size: 11px;
  letter-spacing: 0.02em;
}

/* ============ 02 · 图表通用 ============ */
.gs-chart {
  flex: 1;
  min-height: 0;
  width: 100%;
  padding: 10px 6px 8px;
}

/* ============ 03 · 企业名录 ============ */
.gs-companies {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 8px 8px;
}
.gs-company {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 56px;
  align-items: center;
  gap: 10px;
  padding: 9px 8px;
  border-bottom: 1px solid var(--gs-hair);
  transition: background 0.3s ease;
  cursor: pointer;
}
.gs-company:hover {
  background: rgba(198, 164, 100, 0.05);
}
.gs-company:last-child { border-bottom: 0; }
.gs-company.active {
  background: linear-gradient(90deg, rgba(198, 164, 100, 0.14) 0%, transparent 100%);
}
.gs-company-rank {
  color: var(--gs-gold);
  font-family: var(--gs-mono);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.gs-company.active .gs-company-rank {
  color: var(--gs-gold-soft);
}
.gs-company-body { min-width: 0; }
.gs-company-body strong {
  display: block;
  color: var(--gs-text-strong);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gs-company-body small {
  display: block;
  margin-top: 2px;
  color: var(--gs-text-dim);
  font-size: 11px;
  letter-spacing: 0.04em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gs-company-score {
  text-align: right;
  border-left: 1px solid var(--gs-hair);
  padding-left: 10px;
}
.gs-company-score span {
  display: block;
  color: var(--gs-gold-soft);
  font-family: var(--gs-mono);
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
}
.gs-company-score small {
  display: block;
  margin-top: 2px;
  color: var(--gs-text-dim);
  font-size: 10px;
  letter-spacing: 0.06em;
}

/* ============ 中央地图 ============ */
.gs-center {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

/* 地图舞台 */
.gs-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  height: 100%;
  border: 1px solid var(--gs-hair-strong);
  overflow: hidden;
  background: #050a14;
}
.gs-stage::before,
.gs-stage::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 24px;
  border: 1px solid var(--gs-gold);
  z-index: 4;
  pointer-events: none;
}
.gs-stage::before { top: 0; left: 0; border-right: 0; border-bottom: 0; }
.gs-stage::after { bottom: 0; right: 0; border-left: 0; border-top: 0; }

.gs-stage-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.gs-stage-canvas :deep(canvas) {
  outline: none;
}
.gs-stage-canvas :deep(.amap-logo),
.gs-stage-canvas :deep(.amap-copyright) {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
}

.gs-stage-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--gs-text-mute);
  font-size: 13px;
  letter-spacing: 0.08em;
  background: rgba(6, 13, 28, 0.86);
  z-index: 10;
  gap: 12px;
}
.gs-stage-loading span:last-child {
  margin-top: 54px;
}

.gs-loader {
  position: absolute;
  width: 34px;
  height: 34px;
  border: 1.5px solid rgba(198, 164, 100, 0.16);
  border-top-color: var(--gs-gold);
  border-radius: 50%;
  animation: gs-spin 1s linear infinite;
}

/* 左上：园区分布图例 */
.gs-legend {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 5;
  padding: 7px 10px;
  border: 1px solid var(--gs-hair-strong);
  background: rgba(6, 13, 28, 0.82);
  backdrop-filter: blur(10px);
  max-width: 168px;
}
.gs-legend-title {
  display: block;
  color: var(--gs-text-dim);
  font-size: 9px;
  letter-spacing: 0.18em;
  margin-bottom: 5px;
  font-family: var(--gs-mono);
}
.gs-legend-items {
  display: grid;
  gap: 3px;
}
.gs-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--gs-text);
  font-size: 10px;
  letter-spacing: 0.02em;
  line-height: 1.3;
  white-space: nowrap;
}
.gs-legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ============ 05 · 来源结构条 ============ */
.gs-bars {
  padding: 14px 16px 14px;
  display: grid;
  gap: 14px;
}
.gs-bar-info {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}
.gs-bar-label {
  color: var(--gs-text);
  font-size: 12px;
  letter-spacing: 0.06em;
}
.gs-bar-value {
  color: var(--gs-text-strong);
  font-family: var(--gs-mono);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.gs-bar-value small {
  color: var(--gs-gold-soft);
  font-size: 11px;
  margin-left: 4px;
}
.gs-bar-track {
  height: 4px;
  background: var(--gs-hair);
  overflow: hidden;
}
.gs-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gs-gold) 0%, var(--gs-gold-soft) 100%);
  transition: width 0.6s ease;
}

/* ============ 06 · 新闻动态 ============ */
.gs-events {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 12px 12px;
}
.gs-events-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: var(--gs-text-dim);
  font-size: 12px;
  letter-spacing: 0.06em;
}
.gs-event {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 12px;
  padding: 10px 4px 10px 8px;
  border-bottom: 1px solid var(--gs-hair);
  align-items: flex-start;
}
.gs-event:last-child { border-bottom: 0; }
.gs-event-link {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: background 0.2s ease;
}
.gs-event-link:hover {
  background: rgba(198, 164, 100, 0.04);
}
.gs-event-time {
  border-right: 1px solid var(--gs-gold-line);
  padding-right: 8px;
  text-align: right;
}
.gs-event-time strong {
  display: block;
  color: var(--gs-gold-soft);
  font-family: var(--gs-mono);
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
}
.gs-event-time small {
  display: block;
  margin-top: 3px;
  color: var(--gs-text-dim);
  font-size: 10px;
  letter-spacing: 0.06em;
  font-family: var(--gs-mono);
}
.gs-event-body strong {
  display: block;
  color: var(--gs-text-strong);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
}
.gs-event-body p {
  margin: 4px 0 0;
  color: var(--gs-text-mute);
  font-size: 11px;
  line-height: 1.55;
  letter-spacing: 0.02em;
}

/* ============ 底栏 ============ */
.gs-footer {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  height: 32px;
  padding: 0 24px;
  color: var(--gs-text-dim);
  font-size: 11px;
  letter-spacing: 0.08em;
  border-top: 1px solid var(--gs-hair);
}
.gs-footer-sep {
  width: 3px;
  height: 3px;
  background: var(--gs-gold);
  opacity: 0.6;
  transform: rotate(45deg);
}

/* ============ 加载遮罩 ============ */
.gs-loading {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  gap: 14px;
  color: var(--gs-text-mute);
  font-size: 13px;
  letter-spacing: 0.08em;
  background: rgba(6, 13, 28, 0.9);
  backdrop-filter: blur(8px);
}
.gs-loading span:last-child {
  margin-top: 52px;
}

/* ============ 滚动条 ============ */
.gs-companies::-webkit-scrollbar,
.gs-events::-webkit-scrollbar { width: 3px; }
.gs-companies::-webkit-scrollbar-thumb,
.gs-events::-webkit-scrollbar-thumb {
  background: var(--gs-gold-line);
}

/* ============ 动画 ============ */
@keyframes gs-spin { to { transform: rotate(360deg); } }

/* ============ 响应式（大屏 ≥ 1440px 为设计基准） ============ */
@media (max-width: 1400px) {
  .gs-title { font-size: 24px; }
  .gs-metric-value { font-size: 24px; }
  .gs-body { grid-template-columns: minmax(280px, 24%) 1fr minmax(280px, 24%); gap: 14px; }
}

@media (max-width: 1180px) {
  .gs-screen { padding: 12px 14px 4px; grid-template-rows: 96px 1fr 32px; }
  .gs-body { grid-template-columns: 1fr; padding: 12px 0; }
  .gs-col { grid-template-rows: none; }
  .gs-stage { min-height: 460px; }
  .gs-header { grid-template-columns: auto 1fr auto; gap: 12px; }
  .gs-header-center { gap: 4px; }
  .gs-title { font-size: 20px; white-space: normal; }
}

@media (max-width: 720px) {
  .gs-screen { padding: 8px 10px 4px; }
  .gs-header-center { display: none; }
  .gs-footer { flex-wrap: wrap; height: auto; padding: 8px 12px; gap: 8px; }
}
</style>
