<template>
  <ClientOnly>
    <div class="es-screen">
      <div class="es-bg" aria-hidden="true" />

      <!-- 顶部标题栏 -->
      <header class="es-header">
        <h1 class="es-title">产业态势总览</h1>

        <nav class="es-header-nav">
          <a
            v-for="link in screenNavLinks"
            :key="link.path"
            :href="link.path"
            class="es-nav-link"
            @click="onScreenNavClick($event, link)"
          >
            <UIcon :name="link.icon" class="size-3.5" />
            <span>{{ link.name }}</span>
          </a>
        </nav>
      </header>

      <!-- 主体两栏：左面板 + 地图 -->
      <main class="es-body">
        <!-- 左栏 -->
        <aside class="es-col es-left">
          <!-- 01 核心指标 -->
          <section class="es-panel">
            <div class="es-panel-head">
              <h2>总览</h2>
            </div>
            <div class="es-metrics">
              <article
                v-for="metric in metrics"
                :key="metric.key"
                class="es-metric"
                :class="{ active: activeMetric === metric.key }"
              >
                <div class="es-metric-head">
                  <span class="es-metric-label">{{ metric.label }}</span>
                  <span class="es-metric-unit">{{ metric.unit }}</span>
                </div>
                <div class="es-metric-value">{{ metric.value }}</div>
                <div class="es-metric-hint">{{ metric.hint }}</div>
              </article>
            </div>
          </section>

          <!-- 02 产业集群分布（子类） -->
          <section class="es-panel es-panel-flex">
            <div class="es-panel-head">
              <h2>产业集群分布</h2>
              <span class="es-panel-tag">
                <template v-if="panelStatsLoading">加载中</template>
                <template v-else-if="showIndustryEmpty">暂无数据</template>
                <template v-else>{{ industryTotal }} 家 · {{ industryTabs.length }} 类</template>
              </span>
            </div>
            <div v-if="panelStatsLoading" class="es-panel-empty">
              <span class="es-loader" />
              <span>加载中</span>
            </div>
            <div v-else-if="showIndustryEmpty" class="es-panel-empty">
              <div class="es-panel-empty-line" />
              <span>暂无数据</span>
              <div class="es-panel-empty-line" />
            </div>
            <div v-else class="es-chart-scroll">
              <ul class="es-industry-list">
                <li
                  v-for="(item, idx) in industryTabs"
                  :key="item.name"
                  class="es-industry-row"
                >
                  <span class="es-industry-label" :title="item.name">{{ item.name }}</span>
                  <div class="es-industry-bar-wrap">
                    <div
                      class="es-industry-bar"
                      :class="{ top: idx < 3 }"
                      :style="{
                        width: `${item.percent}%`,
                        background: idx < 3
                          ? `linear-gradient(90deg, ${item.color}cc, ${item.color}55)`
                          : `linear-gradient(90deg, ${item.color}88, ${item.color}33)`,
                      }"
                    />
                    <span
                      class="es-industry-pct"
                      :style="{ left: `calc(${item.percent}% + 4px)` }"
                    >{{ item.percent }}%</span>
                  </div>
                  <span class="es-industry-count">{{ item.count }}家</span>
                </li>
              </ul>
            </div>
          </section>

          <!-- 03 产业公司性质分布 -->
          <section class="es-panel es-panel-nature">
            <div class="es-panel-head">
              <h2>产业公司性质分布</h2>
              <span class="es-panel-tag">
                <template v-if="panelStatsLoading">加载中</template>
                <template v-else-if="showNatureEmpty">暂无数据</template>
                <template v-else>{{ natureTabs.length }} 类</template>
              </span>
            </div>
            <div v-if="panelStatsLoading" class="es-panel-empty es-panel-empty-chart">
              <span class="es-loader" />
              <span>加载中</span>
            </div>
            <div v-else-if="showNatureEmpty" class="es-panel-empty es-panel-empty-chart">
              <div class="es-panel-empty-line" />
              <span>暂无数据</span>
              <div class="es-panel-empty-line" />
            </div>
            <VChart
              v-else-if="chartsReady"
              :key="`nature-${activeParkId ?? 'all'}-${natureTabs.length}`"
              class="es-chart es-chart-nature"
              :option="natureOption"
              autoresize
            />
            <div v-else class="es-panel-empty es-panel-empty-chart">
              <span class="es-loader" />
              <span>加载中</span>
            </div>
          </section>

          <!-- 04 重点企业名录（暂隐藏）
          <section class="es-panel es-panel-flex">
            ...
          </section>
          -->
        </aside>

        <!-- 中央地图 -->
        <section class="es-center">
          <div class="es-stage">
            <div ref="mapContainerRef" class="es-stage-canvas" />

            <div v-if="!mapReady" class="es-stage-loading">
              <span class="es-loader" />
              <span>地图渲染中</span>
            </div>

            <div class="es-legend">
              <span class="es-legend-title">园区分布(企业数)</span>
              <div class="es-legend-items">
                <button
                  v-for="item in parkLegend"
                  :key="item.name"
                  type="button"
                  class="es-legend-item"
                  :class="{ active: selectedParkName === item.name }"
                  @click="selectPark(item.name)"
                >
                  <span class="es-legend-dot" :style="{ background: item.color }" />
                  <span class="es-legend-name">{{ item.displayName }}</span>
                  <span class="es-legend-count" :style="{ color: item.color }">{{ item.count }}家</span>
                </button>
              </div>
              <button
                v-if="selectedParkName"
                type="button"
                class="es-legend-reset"
                @click="selectPark(null)"
              >
                返回全览
              </button>
            </div>
          </div>
        </section>

        <!-- 右栏（暂隐藏：产业结构评估 / 企业来源 / 新闻动态）
        <aside class="es-col es-right">
          ...
        </aside>
        -->
      </main>

      <!-- 底栏 · 数据来源与版权 -->
<!--      <footer class="es-footer">-->
<!--        <span>数据来源 · 光谷高新区经济信息中心 / 天眼查 / 企查查 / 国家知识产权局</span>-->
<!--        <span class="es-footer-sep" />-->
<!--        <span>更新频率 · 每 4 小时</span>-->
<!--        <span class="es-footer-sep" />-->
<!--        <span>版本 · 企业服务 产业情报中心</span>-->
<!--      </footer>-->

      <!-- 全屏加载 -->
      <div v-if="loading" class="es-loading">
        <span class="es-loader" />
        <span>加载企业数据</span>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import type { CompanyRecord } from '~/types/company'
import {
  fetchCompanies,
  fetchCompanyTypeInfo,
  fetchParkChain,
  fetchParkList,
  normalizeCompanyStatList,
  normalizeTypeInfoList,
} from '~/types/company'
import { matchParkId, type ParkInfo } from '~/composables/useGeoAmapMap'
import { resetPageInit } from '~/composables/usePageInit'
import { newsRequest } from '~/utils/request'

definePageMeta({ layout: 'blank', middleware: ['auth'], keepalive: false, ssr: false })

type SourceFilter = 'all' | 'listed' | 'native' | 'attract'
type MetricKey = 'scale' | 'listed' | 'native' | 'attract'

const screenNavLinks = [
  { path: '/', name: '产业图谱', icon: 'i-lucide-network' },
  { path: '/geo-screen', name: '企业地图', icon: 'i-lucide-map' },
]

interface NewsItem {
  id: string
  title: string
  source: string
  date: string
  time: string
  url: string
}


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
const panelStatsLoading = ref(false)
const chartsReady = ref(false)
const companies = ref<CompanyRecord[]>(fallbackCompanies)
const parkList = ref<ParkInfo[]>([])
const activeParkId = ref<number | null>(null)
const parkChainStats = ref<{ name: string, count: number }[]>([])
const typeInfoStats = ref<{ name: string, count: number }[]>([])
let globalChainStats: { name: string, count: number }[] = []
let globalTypeStats: { name: string, count: number }[] = []
const selectedCompany = ref<CompanyRecord | null>(null)
const sourceFilter = ref<SourceFilter>('all')
const activeIndustry = ref('all')
const activeMetric = ref<MetricKey | null>(null)
const syncStamp = ref(new Date())
const newsList = ref<NewsItem[]>([])
const newsLoading = ref(false)

function onScreenNavClick(event: MouseEvent, link: typeof screenNavLinks[number]) {
  event.preventDefault()
  resetPageInit(link.path)
  navigateTo(link.path)
}

const {
  mapContainerRef,
  mapReady,
  parkLegend,
  selectedParkName,
  selectPark,
  onParkSelect,
  initMap,
  updateCompanies,
  setParkApiList,
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
  const total = industryTotal.value || 1
  return parkChainStats.value.map(item => ({
    name: item.name,
    color: colorForName(item.name),
    count: item.count,
    percent: Math.round((item.count / total) * 1000) / 10,
  }))
})

const industryTotal = computed(() => parkChainStats.value.reduce((sum, item) => sum + item.count, 0))

const showIndustryEmpty = computed(() => !panelStatsLoading.value && industryTabs.value.length === 0)
const showNatureEmpty = computed(() => !panelStatsLoading.value && natureTabs.value.length === 0)

const listedCount = computed(() => filteredCompanies.value.filter(c => c.company_traded === 1).length)
const nativeCount = computed(() => filteredCompanies.value.filter(c => String(c.tag_name || '').includes('本土')).length)
const attractCount = computed(() => filteredCompanies.value.filter(c => String(c.tag_name || '').includes('招商')).length)
const totalPatents = computed(() => filteredCompanies.value.reduce((s, c) => s + patentCount(c), 0))

const metrics = computed(() => {
  const list = filteredCompanies.value
  const listed = list.filter(c => c.company_traded === 1).length
  const native = nativeCount.value
  const attract = attractCount.value
  const listedRate = list.length ? Math.round((listed / list.length) * 1000) / 10 : 0
  const nativeRate = list.length ? Math.round((native / list.length) * 1000) / 10 : 0
  const attractRate = list.length ? Math.round((attract / list.length) * 1000) / 10 : 0
  return [
    { key: 'scale' as const, label: '企业总数', unit: '家', value: list.length.toLocaleString(), hint: '' },
    // { key: 'listed' as const, label: '上市公司', unit: '家', value: listed.toString(), hint: `资本化率 ${listedRate}%` },
    { key: 'listed' as const, label: '上市公司', unit: '家', value: listed.toString(), hint: `` },
    { key: 'native' as const, label: '本土培育', unit: '家', value: native.toString(), hint: `占比 ${nativeRate}%` },
    { key: 'attract' as const, label: '招商引资', unit: '家', value: attract.toString(), hint: `占比 ${attractRate}%` },
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


const natureTabs = computed(() => typeInfoStats.value)

const natureOption = computed(() => {
  const items = natureTabs.value
  return {
    backgroundColor: 'transparent',
    animationDuration: 600,
    grid: { left: 8, right: 12, top: 24, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(21, 32, 51, 0.96)',
      borderColor: 'rgba(148, 163, 184, 0.28)',
      borderWidth: 1,
      textStyle: { color: '#e6edf5', fontSize: 12 },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        return `${p?.name || ''}<br/>${p?.marker || ''}${p?.value ?? 0} 家`
      },
    },
    xAxis: {
      type: 'category',
      data: items.map(i => i.name),
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.25)' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#8a9bb0',
        fontSize: 10,
        interval: 0,
        rotate: items.length > 4 ? 28 : 0,
        width: 64,
        overflow: 'truncate',
      },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#7a8ea3', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)', type: 'dashed' } },
    },
    series: [{
      type: 'bar',
      data: items.map(i => i.count),
      barMaxWidth: 22,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#7eb3d6' },
            { offset: 1, color: 'rgba(95, 158, 200, 0.35)' },
          ],
        },
        borderRadius: [3, 3, 0, 0],
      },
      label: {
        show: true,
        position: 'top',
        color: '#b5c3d4',
        fontSize: 10,
        fontFamily: 'DIN Alternate, ui-monospace, monospace',
        formatter: '{c}家',
      },
    }],
  }
})

// ECharts · 产业结构雷达
const chainOption = computed(() => {
  const list = filteredCompanies.value
  const total = list.length || 1
  const native = list.filter(c => String(c.tag_name || '').includes('本土')).length
  const attract = list.filter(c => String(c.tag_name || '').includes('招商')).length
  const listed = list.filter(c => c.company_traded === 1).length
  const avgPatent = list.reduce((s, c) => s + patentCount(c), 0) / total
  const values = [
    Math.min(100, Math.round(avgPatent / 3 + 35)),
    Math.min(100, Math.round((listed / total) * 100 + 20)),
    Math.min(100, Math.round((attract / total) * 100 + 25)),
    Math.min(100, Math.round((native / total) * 100 + 30)),
    Math.min(100, Math.round(averageScore(list))),
  ]
  return {
    backgroundColor: 'transparent',
    animationDuration: 1400,
    animationEasing: 'cubicOut' as const,
    tooltip: {
      backgroundColor: 'rgba(12, 32, 64, 0.94)',
      borderColor: 'rgba(56, 189, 248, 0.35)',
      textStyle: { color: '#e8f4ff', fontSize: 12 },
    },
    radar: {
      center: ['50%', '52%'],
      radius: '62%',
      splitNumber: 4,
      axisName: { color: '#9ec5e8', fontSize: 11, padding: [2, 4] },
      axisLine: { lineStyle: { color: 'rgba(56, 189, 248, 0.15)' } },
      splitLine: { lineStyle: { color: 'rgba(56, 189, 248, 0.1)' } },
      splitArea: { areaStyle: { color: ['rgba(56, 189, 248, 0.04)', 'rgba(37, 99, 235, 0.03)'] } },
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
        value: values,
        areaStyle: { color: 'rgba(56, 189, 248, 0.18)' },
        lineStyle: { color: '#38bdf8', width: 1.6 },
        itemStyle: { color: '#38bdf8', borderColor: '#e8f4ff', borderWidth: 1 },
      }],
      animationDuration: 1600,
    }],
  }
})

const newsPanelTag = computed(() => {
  if (newsLoading.value) return '加载中'
  if (!newsList.value.length) return '暂无数据'
  return `最新 ${newsList.value.length} 条`
})

const newsScrollItems = computed(() => {
  if (!newsList.value.length) return []
  return [...newsList.value, ...newsList.value]
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

function productSubName(company: CompanyRecord) {
  return clean(company.product_type)
    || clean(company.product)
    || clean(company.company_industry)
    || industryName(company)
}

function colorForName(name: string) {
  const palette = ['#38bdf8', '#60a5fa', '#2563eb', '#22d3ee', '#0ea5e9', '#7dd3fc', '#4ade80', '#a78bfa']
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

function isSameStatList(
  a: { name: string, count: number }[],
  b: { name: string, count: number }[],
): boolean {
  if (a.length !== b.length) return false
  if (!a.length) return true
  return a.every((item, index) => item.name === b[index]?.name && item.count === b[index]?.count)
}

async function loadParkList() {
  try {
    const res = await fetchParkList()
    if (res.code === 0 && Array.isArray(res.data)) {
      parkList.value = res.data.map(item => ({
        park_id: item.park_id,
        park_name: item.park_name,
        num: Number(item.num) || 0,
      }))
      setParkApiList(parkList.value)
    }
  } catch (e) {
    console.error('获取园区列表失败:', e)
    parkList.value = []
    setParkApiList([])
  }
}

async function loadPanelStats(parkId?: number | null) {
  panelStatsLoading.value = true
  parkChainStats.value = []
  typeInfoStats.value = []
  try {
    // 已选中园区但匹配不到 park_id：直接空态，禁止回退拉全量统计
    if (selectedParkName.value && (parkId == null || parkId <= 0)) {
      return
    }
    // 园区企业数为 0 时，左侧统计强制空态（避免接口仍返回全量数据）
    if (selectedParkName.value && parkId && parkId > 0) {
      const park = parkList.value.find(p => p.park_id === parkId)
      if (park && (Number(park.num) || 0) === 0) {
        return
      }
    }
    const queryParkId = parkId && parkId > 0 ? parkId : undefined
    const [chainRes, typeRes] = await Promise.all([
      fetchParkChain(queryParkId),
      fetchCompanyTypeInfo(queryParkId),
    ])
    let chainStats = chainRes.code === 0 ? normalizeCompanyStatList(chainRes.data) : []
    let typeStats = typeRes.code === 0 ? normalizeTypeInfoList(typeRes.data) : []
    if (queryParkId) {
      // 接口未按园区过滤、仍返回全量时，与全览基线相同则视为该园无统计
      if (globalChainStats.length && isSameStatList(chainStats, globalChainStats)) {
        chainStats = []
      }
      if (globalTypeStats.length && isSameStatList(typeStats, globalTypeStats)) {
        typeStats = []
      }
    }
    else {
      globalChainStats = chainStats
      globalTypeStats = typeStats
    }
    parkChainStats.value = chainStats
    typeInfoStats.value = typeStats
  } catch (e) {
    console.error('获取左侧统计失败:', e)
    parkChainStats.value = []
    typeInfoStats.value = []
  } finally {
    panelStatsLoading.value = false
  }
}

function syncActiveParkFromMap(parkName: string | null) {
  activeParkId.value = parkName ? matchParkId(parkName, parkList.value) : null
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

onParkSelect(async (parkName) => {
  syncActiveParkFromMap(parkName)
  await loadPanelStats(activeParkId.value)
})

onMounted(async () => {
  // 右栏「新闻动态」暂隐藏，不再请求 zy-news，避免本地未起 news 服务时刷 Network Error
  await Promise.all([loadCompanies(), loadParkList()])
  syncActiveParkFromMap(selectedParkName.value)
  await loadPanelStats(activeParkId.value)
  await nextTick()
  chartsReady.value = true
  await initMap(filteredCompanies.value, undefined, undefined, parkList.value)
})

onUnmounted(() => {
  destroyMap()
})
</script>

<style scoped>
/* ============================================================
   深色科技 · 产业情报大屏
   ============================================================ */
.es-screen {
  --es-bg-deep: #0a111a;
  --es-bg: #101a28;
  --es-bg-elev: #162232;
  --es-panel: rgba(20, 32, 48, 0.88);
  --es-panel-solid: #141f2e;
  --es-hair: rgba(148, 163, 184, 0.12);
  --es-hair-strong: rgba(148, 163, 184, 0.22);
  --es-accent: #5f9ec8;
  --es-accent-soft: #7eb3d6;
  --es-accent-deep: #3f7399;
  --es-accent-line: rgba(95, 158, 200, 0.42);
  --es-gold: var(--es-accent);
  --es-gold-soft: var(--es-accent-soft);
  --es-gold-line: var(--es-accent-line);
  --es-crimson: #d98a8a;
  --es-text-strong: #edf3f9;
  --es-text: #b8c6d8;
  --es-text-mute: #8fa0b5;
  --es-text-dim: #6d7f94;
  --es-mono: 'DIN Alternate', 'SF Mono', 'JetBrains Mono', ui-monospace, monospace;
  --es-radius: 8px;

  position: fixed;
  inset: 0;
  overflow: hidden;
  color: var(--es-text);
  background: var(--es-bg-deep);
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', sans-serif;
  font-feature-settings: 'tnum';
  display: grid;
  grid-template-rows: 52px 1fr;
  padding: 12px 18px 14px;
}

/* ============ 背景 ============ */
.es-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(ellipse 70% 55% at 72% 18%, rgba(95, 158, 200, 0.09), transparent 58%),
    radial-gradient(ellipse 45% 40% at 8% 82%, rgba(95, 158, 200, 0.05), transparent 52%),
    linear-gradient(180deg, #0a111a 0%, #101a28 50%, #0d1520 100%);
}
.es-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.028) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.028) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(ellipse 88% 78% at 50% 42%, #000 18%, transparent 72%);
}

/* ============ 顶部标题栏 ============ */
.es-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  height: 48px;
  padding: 0 6px;
  border-bottom: 1px solid var(--es-hair);
}
.es-header::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(95, 158, 200, 0.28), transparent);
}

.es-title {
  margin: 0;
  color: var(--es-text-strong);
  font-size: 19px;
  font-weight: 600;
  letter-spacing: 0.06em;
  line-height: 1.2;
  white-space: nowrap;
}

.es-header-nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}
.es-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: 1px solid var(--es-hair);
  background: rgba(16, 26, 40, 0.55);
  color: var(--es-text-mute);
  font-size: 12px;
  letter-spacing: 0.02em;
  text-decoration: none;
  border-radius: 6px;
  transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}
.es-nav-link:hover {
  color: var(--es-text-strong);
  border-color: var(--es-hair-strong);
  background: rgba(95, 158, 200, 0.08);
  transform: translateY(-1px);
}
.es-nav-link.active {
  color: var(--es-text-strong);
  border-color: var(--es-accent-line);
  background: rgba(95, 158, 200, 0.14);
}

/* ============ 主体两栏 ============ */
.es-body {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(300px, 28%) 1fr;
  gap: 14px;
  min-height: 0;
  padding: 12px 0 0;
}

.es-col {
  display: grid;
  gap: 12px;
  min-height: 0;
  min-width: 0;
}
.es-left {
  grid-template-rows: auto minmax(0, 1.15fr) minmax(160px, 0.85fr);
  position: relative;
  z-index: 2;
  overflow: hidden;
}

/* ============ 面板通用 ============ */
.es-panel {
  position: relative;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--es-hair);
  background: linear-gradient(165deg, rgba(22, 34, 50, 0.94) 0%, rgba(16, 26, 40, 0.98) 100%);
  border-radius: var(--es-radius);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}
.es-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 14px;
  right: 14px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(95, 158, 200, 0.32), transparent);
  pointer-events: none;
  z-index: 1;
}

.es-panel-flex {
  flex: 1;
  min-height: 0;
}
.es-panel-nature {
  min-height: 160px;
}

.es-panel-empty {
  flex: 1;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 28px 12px;
  color: var(--es-text-mute);
  font-size: 13px;
  letter-spacing: 0.08em;
}
.es-panel-empty-line {
  width: 36px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(95, 158, 200, 0.45), transparent);
}
.es-panel-empty-chart {
  min-height: 140px;
}

.es-panel-head {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding: 0 14px;
  border-bottom: 1px solid var(--es-hair);
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.015);
}
.es-panel-idx {
  color: var(--es-accent);
  font-family: var(--es-mono);
  font-size: 12px;
  font-weight: 600;
}
.es-panel-head h2 {
  margin: 0;
  color: var(--es-text-strong);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.es-panel-tag {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--es-hair);
  background: rgba(95, 158, 200, 0.06);
  color: var(--es-text-dim);
  font-size: 10px;
  font-family: var(--es-mono);
}

/* ============ 01 · 核心指标 ============ */
.es-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--es-hair);
  padding: 1px;
  margin: 10px;
  border-radius: 6px;
  overflow: hidden;
}
.es-metric {
  padding: 14px 14px 12px;
  background: var(--es-panel-solid);
  transition: background 0.2s ease;
  position: relative;
}
.es-metric.active {
  background: rgba(95, 158, 200, 0.1);
}
.es-metric.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 2px;
  background: linear-gradient(180deg, var(--es-accent-soft), var(--es-accent-deep));
  border-radius: 0 2px 2px 0;
}
.es-metric-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 8px;
}
.es-metric-label {
  color: var(--es-text-mute);
  font-size: 12px;
}
.es-metric-unit {
  color: var(--es-text-dim);
  font-size: 10px;
}
.es-metric-value {
  color: var(--es-text-strong);
  font-family: var(--es-mono);
  font-size: 26px;
  font-weight: 600;
  line-height: 1;
}
.es-metric.active .es-metric-value {
  color: var(--es-accent-soft);
}
.es-metric-hint {
  margin-top: 6px;
  color: var(--es-text-dim);
  font-size: 11px;
}

.es-panel-chart {
  min-height: 220px;
}

/* ============ 02 · 图表通用 ============ */
.es-chart-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 12px 10px;
}
.es-chart-scroll::-webkit-scrollbar {
  width: 4px;
}
.es-chart-scroll::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.28);
  border-radius: 2px;
}
.es-industry-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.es-industry-row {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr) 48px;
  align-items: center;
  gap: 10px;
  min-height: 24px;
  padding: 2px 0;
}
.es-industry-label {
  color: var(--es-text-mute);
  font-size: 11px;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
}
.es-industry-bar-wrap {
  position: relative;
  height: 18px;
  background: rgba(148, 163, 184, 0.07);
  border: 1px solid rgba(148, 163, 184, 0.08);
  border-radius: 4px;
  overflow: visible;
}
.es-industry-bar {
  position: absolute;
  top: 50%;
  left: 2px;
  right: auto;
  height: 8px;
  max-width: calc(100% - 4px);
  transform: translateY(-50%);
  border-radius: 3px;
  transition: width 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}
.es-industry-bar.top {
  box-shadow: 0 0 10px rgba(95, 158, 200, 0.18);
}
.es-industry-pct {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: #a8b9cc;
  font-size: 10px;
  font-family: var(--es-mono);
  white-space: nowrap;
  line-height: 1;
  pointer-events: none;
}
.es-industry-count {
  color: var(--es-text);
  font-size: 11px;
  font-family: var(--es-mono);
  text-align: right;
}
.es-chart {
  flex: 1;
  min-height: 180px;
  width: 100%;
  padding: 10px 6px 8px;
}
.es-chart-nature {
  flex: 1;
  min-height: 140px;
  width: 100%;
  padding: 8px 10px 10px;
}
.es-chart-industry {
  flex: none;
  min-height: 0;
  padding: 0;
}
.es-chart-radar {
  min-height: 200px;
}

/* ============ 03 · 企业名录 ============ */
.es-companies {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 8px 8px;
}
.es-company {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 56px;
  align-items: center;
  gap: 10px;
  padding: 9px 8px;
  border-bottom: 1px solid var(--es-hair);
  transition: background 0.3s ease;
  cursor: pointer;
}
.es-company:hover {
  background: rgba(198, 164, 100, 0.05);
}
.es-company:last-child { border-bottom: 0; }
.es-company.active {
  background: linear-gradient(90deg, rgba(198, 164, 100, 0.14) 0%, transparent 100%);
}
.es-company-rank {
  color: var(--es-gold);
  font-family: var(--es-mono);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.es-company.active .es-company-rank {
  color: var(--es-gold-soft);
}
.es-company-body { min-width: 0; }
.es-company-body strong {
  display: block;
  color: var(--es-text-strong);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.es-company-body small {
  display: block;
  margin-top: 2px;
  color: var(--es-text-dim);
  font-size: 11px;
  letter-spacing: 0.04em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.es-company-score {
  text-align: right;
  border-left: 1px solid var(--es-hair);
  padding-left: 10px;
}
.es-company-score span {
  display: block;
  color: var(--es-gold-soft);
  font-family: var(--es-mono);
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
}
.es-company-score small {
  display: block;
  margin-top: 2px;
  color: var(--es-text-dim);
  font-size: 10px;
  letter-spacing: 0.06em;
}

/* ============ 中央地图 ============ */
.es-center {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  position: relative;
  z-index: 5;
}

/* 地图舞台 */
.es-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  height: 100%;
  border: 1px solid rgba(95, 158, 200, 0.16);
  border-radius: var(--es-radius);
  overflow: hidden;
  background: #0a111c;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.03),
    0 14px 36px rgba(0, 0, 0, 0.22);
  z-index: 5;
}
.es-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
  border-radius: inherit;
  box-shadow: inset 0 0 48px rgba(8, 16, 28, 0.35);
}
.es-stage::after {
  content: '';
  position: absolute;
  inset: 10px;
  pointer-events: none;
  z-index: 4;
  border: 1px solid rgba(95, 158, 200, 0.08);
  border-radius: 4px;
}

.es-stage-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.es-stage-canvas :deep(canvas) {
  outline: none;
}
.es-stage-canvas :deep(.amap-logo),
.es-stage-canvas :deep(.amap-copyright),
.es-stage-canvas :deep(.amap-scalecontrol) {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
}
.es-stage-canvas :deep(.amap-control),
.es-stage-canvas :deep(.amap-ctrl-list),
.es-stage-canvas :deep(.amap-toolbar),
.es-stage-canvas :deep(.amap-controlbar) {
  z-index: 120 !important;
  opacity: 1 !important;
  visibility: visible !important;
  /* 避免页面字体/字偶间距把控件图标压成小点 */
  font-family: Arial, Helvetica, sans-serif !important;
  font-feature-settings: normal !important;
  font-variant-numeric: normal !important;
  letter-spacing: normal !important;
  line-height: normal !important;
}
.es-stage-canvas :deep(.amap-controlbar) {
  transform: scale(0.5) !important;
  transform-origin: top right !important;
}
.es-stage-canvas :deep(.amap-toolbar) {
  transform: scale(0.5) !important;
  transform-origin: bottom right !important;
}
.es-stage-canvas :deep(.amap-toolbar),
.es-stage-canvas :deep(.amap-toolbar *) {
  box-sizing: content-box !important;
  font-feature-settings: normal !important;
}
.es-stage-canvas :deep(.amap-controlbar),
.es-stage-canvas :deep(.amap-controlbar *) {
  box-sizing: content-box !important;
  font-feature-settings: normal !important;
}
.es-stage-canvas :deep(.amap-toolbar .amap-zoom-plus),
.es-stage-canvas :deep(.amap-toolbar .amap-zoom-minus),
.es-stage-canvas :deep(.amap-ctrl-zoom-in),
.es-stage-canvas :deep(.amap-ctrl-zoom-out) {
  width: 18px !important;
  height: 18px !important;
  font-size: 12px !important;
  line-height: 18px !important;
  text-align: center !important;
  color: #1f2937 !important;
}

.es-stage-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--es-text-mute);
  font-size: 13px;
  background: rgba(12, 21, 34, 0.88);
  z-index: 10;
  gap: 12px;
}
.es-stage-loading span:last-child {
  margin-top: 54px;
}

.es-loader {
  position: absolute;
  width: 28px;
  height: 28px;
  border: 1.5px solid var(--es-hair);
  border-top-color: var(--es-accent);
  border-radius: 50%;
  animation: es-spin 1s linear infinite;
}

/* 左上：园区分布图例 */
.es-legend {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 6;
  padding: 10px 12px;
  border: 1px solid rgba(95, 158, 200, 0.14);
  border-radius: 8px;
  background: rgba(14, 24, 38, 0.9);
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  max-width: 176px;
}
.es-legend-title {
  display: block;
  color: var(--es-text-dim);
  font-size: 10px;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}
.es-legend-items {
  display: grid;
  gap: 4px;
}
.es-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--es-text);
  font-size: 10px;
  letter-spacing: 0.02em;
  line-height: 1.35;
  white-space: nowrap;
  width: 100%;
  margin: 0;
  padding: 3px 4px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  opacity: 0.9;
  transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
}
.es-legend-item:hover {
  opacity: 1;
  color: var(--es-text-strong);
  background: rgba(95, 158, 200, 0.08);
}
.es-legend-item.active {
  opacity: 1;
  color: var(--es-accent-soft);
  background: rgba(95, 158, 200, 0.12);
}
.es-legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
}
.es-legend-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.es-legend-count {
  flex-shrink: 0;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.es-legend-reset {
  margin-top: 8px;
  padding: 6px 4px 0;
  border: 0;
  border-top: 1px solid var(--es-hair);
  background: transparent;
  color: var(--es-text-mute);
  font-size: 11px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: color 0.15s ease;
}
.es-legend-reset:hover {
  color: var(--es-text-strong);
}

/* ============ 05 · 来源结构条 ============ */
.es-bars {
  padding: 14px 16px 14px;
  display: grid;
  gap: 14px;
}
.es-bar-info {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}
.es-bar-label {
  color: var(--es-text);
  font-size: 12px;
  letter-spacing: 0.06em;
}
.es-bar-value {
  color: var(--es-text-strong);
  font-family: var(--es-mono);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.es-bar-value small {
  color: var(--es-gold-soft);
  font-size: 11px;
  margin-left: 4px;
}
.es-bar-track {
  height: 4px;
  background: var(--es-hair);
  overflow: hidden;
}
.es-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--es-accent-deep) 0%, var(--es-accent) 100%);
  transition: width 0.6s ease;
}

/* ============ 06 · 新闻动态 ============ */
.es-events {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 6px 12px 12px;
  position: relative;
}
.es-events:hover .es-events-track {
  animation-play-state: paused;
}
.es-events-track {
  display: grid;
  gap: 0;
  animation: es-news-scroll 36s linear infinite;
}
.es-events-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: var(--es-text-dim);
  font-size: 12px;
  letter-spacing: 0.06em;
}
.es-event {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 12px;
  padding: 10px 4px 10px 8px;
  border-bottom: 1px solid var(--es-hair);
  align-items: flex-start;
}
.es-event:last-child { border-bottom: 0; }
.es-event-link {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: background 0.2s ease;
}
.es-event-link:hover {
  background: rgba(56, 189, 248, 0.06);
}
.es-event-time {
  border-right: 1px solid var(--es-gold-line);
  padding-right: 8px;
  text-align: right;
}
.es-event-time strong {
  display: block;
  color: var(--es-gold-soft);
  font-family: var(--es-mono);
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
}
.es-event-time small {
  display: block;
  margin-top: 3px;
  color: var(--es-text-dim);
  font-size: 10px;
  letter-spacing: 0.06em;
  font-family: var(--es-mono);
}
.es-event-body strong {
  display: block;
  color: var(--es-text-strong);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
}
.es-event-body p {
  margin: 4px 0 0;
  color: var(--es-text-mute);
  font-size: 11px;
  line-height: 1.55;
  letter-spacing: 0.02em;
}

/* ============ 底栏 ============ */
.es-footer {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  height: 32px;
  padding: 0 24px;
  color: var(--es-text-dim);
  font-size: 11px;
  letter-spacing: 0.08em;
  border-top: 1px solid var(--es-hair);
}
.es-footer-sep {
  width: 3px;
  height: 3px;
  background: var(--es-gold);
  opacity: 0.6;
  transform: rotate(45deg);
}

/* ============ 加载遮罩 ============ */
.es-loading {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  gap: 14px;
  color: var(--es-text-mute);
  font-size: 13px;
  background: rgba(12, 21, 34, 0.92);
}
.es-loading span:last-child {
  margin-top: 52px;
}

/* ============ 滚动条 ============ */
.es-companies::-webkit-scrollbar,
.es-events::-webkit-scrollbar { width: 3px; }
.es-companies::-webkit-scrollbar-thumb,
.es-events::-webkit-scrollbar-thumb {
  background: var(--es-hair-strong);
}

@keyframes es-spin { to { transform: rotate(360deg); } }
@keyframes es-news-scroll {
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}

@media (prefers-reduced-motion: reduce) {
  .es-events-track {
    animation: none;
  }
}

/* ============ 响应式 ============ */
@media (max-width: 1600px) {
  .es-body { grid-template-columns: minmax(280px, 30%) 1fr; gap: 12px; }
  .es-left { grid-template-rows: auto minmax(0, 1.1fr) minmax(150px, 0.8fr); }
}

@media (max-width: 1400px) {
  .es-title { font-size: 18px; }
  .es-metric-value { font-size: 22px; }
  .es-body { grid-template-columns: minmax(260px, 34%) 1fr; gap: 12px; }
  .es-industry-row { grid-template-columns: 90px minmax(0, 1fr) 42px; }
}

@media (max-width: 1180px) {
  .es-screen { padding: 8px 12px 8px; grid-template-rows: 52px 1fr; }
  .es-body {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(420px, 1fr);
    padding: 10px 0 0;
    overflow: auto;
  }
  .es-left {
    grid-template-rows: auto minmax(220px, 280px) minmax(180px, 220px);
    max-height: none;
  }
  .es-stage { min-height: 420px; }
  .es-title { font-size: 17px; white-space: normal; }
  .es-header { flex-wrap: wrap; height: auto; min-height: 52px; padding: 8px 0; gap: 8px; }
}

@media (max-width: 720px) {
  .es-screen { padding: 8px 10px 8px; }
  .es-title { font-size: 16px; }
  .es-metrics { grid-template-columns: 1fr; }
  .es-left { grid-template-rows: auto minmax(200px, 260px) minmax(160px, 200px); }
  .es-stage { min-height: 360px; }
  .es-footer { flex-wrap: wrap; height: auto; padding: 8px 12px; gap: 8px; }
  .es-industry-row { grid-template-columns: 76px minmax(0, 1fr) 40px; gap: 6px; }
}
</style>
