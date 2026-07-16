<template>
  <ClientOnly>
    <div class="es-screen">
      <div class="es-bg" aria-hidden="true" />

      <!-- 顶部标题：几何科技顶栏，浮于地图 -->
      <header class="es-header">
        <div class="es-header-side es-header-side-left" aria-hidden="true" />

        <div class="es-title-wrap">
          <div class="es-title-frame">
            <span class="es-title-rail es-title-rail-l" aria-hidden="true">
              <svg class="es-rail-svg" viewBox="0 0 220 36" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMid meet">
                <path class="es-rail-line" d="M218 18H72" />
                <path class="es-rail-line es-rail-line-soft" d="M200 10H96" />
                <path class="es-rail-line es-rail-line-soft" d="M200 26H96" />
                <path class="es-rail-angle" d="M72 18L52 6H28L12 18L28 30H52L72 18Z" />
                <path class="es-rail-tick" d="M96 10V26M120 10V26M144 10V26M168 10V26" />
                <circle class="es-rail-node" cx="218" cy="18" r="2.5" />
                <circle class="es-rail-node es-rail-node-soft" cx="52" cy="18" r="2" />
                <circle class="es-rail-node es-rail-node-soft" cx="12" cy="18" r="1.5" />
              </svg>
            </span>

            <div class="es-title-banner">
              <span class="es-title-edge es-title-edge-l" aria-hidden="true" />
              <h1 class="es-title">
                <span class="es-title-text">产业态势总览</span>
              </h1>
              <span class="es-title-edge es-title-edge-r" aria-hidden="true" />
            </div>

            <span class="es-title-rail es-title-rail-r" aria-hidden="true">
              <svg class="es-rail-svg" viewBox="0 0 220 36" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMid meet">
                <path class="es-rail-line" d="M2 18H148" />
                <path class="es-rail-line es-rail-line-soft" d="M20 10H124" />
                <path class="es-rail-line es-rail-line-soft" d="M20 26H124" />
                <path class="es-rail-angle" d="M148 18L168 6H192L208 18L192 30H168L148 18Z" />
                <path class="es-rail-tick" d="M124 10V26M100 10V26M76 10V26M52 10V26" />
                <circle class="es-rail-node" cx="2" cy="18" r="2.5" />
                <circle class="es-rail-node es-rail-node-soft" cx="168" cy="18" r="2" />
                <circle class="es-rail-node es-rail-node-soft" cx="208" cy="18" r="1.5" />
              </svg>
            </span>
          </div>
        </div>

        <nav class="es-header-nav es-header-side es-header-side-right">
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

      <!-- 全屏地图 + 四角浮层 -->
      <main class="es-body">
        <!-- 左上：总览指标 -->
        <aside class="es-float es-float-tl">
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
                <div v-if="metric.hint" class="es-metric-hint">{{ metric.hint }}</div>
              </article>
            </div>
            <div v-if="aboveScaleMetrics.length" class="es-metrics es-metrics-above">
              <article
                v-for="metric in aboveScaleMetrics"
                :key="metric.key"
                class="es-metric"
              >
                <div class="es-metric-head">
                  <span class="es-metric-label" :title="metric.label">{{ metric.label }}</span>
                </div>
                <div class="es-metric-value es-metric-value-sm">
                  {{ metric.value }}<span class="es-metric-unit-suffix">{{ metric.unit }}</span>
                </div>
              </article>
            </div>
          </section>
        </aside>

        <!-- 右上：产业集群分布 -->
        <aside class="es-float es-float-tr">
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
        </aside>

        <!-- 左下：园区分布 -->
        <aside class="es-float es-float-bl">
          <section class="es-panel es-panel-flex es-panel-legend">
            <div class="es-panel-head">
              <h2>园区分布</h2>
              <span class="es-panel-tag">企业数</span>
            </div>
            <div class="es-legend">
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
          </section>
        </aside>

        <!-- 右下：产业公司性质分布 -->
        <aside class="es-float es-float-br">
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
        </aside>

        <!-- 中央地图 -->
        <section class="es-center">
          <div class="es-stage">
            <div ref="mapContainerRef" class="es-stage-canvas" />
            <div class="es-stage-fx" aria-hidden="true" />

            <div v-if="!mapReady" class="es-stage-loading">
              <span class="es-loader" />
              <span>地图渲染中</span>
            </div>
          </div>
        </section>
      </main>

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
  fetchAboveScale,
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
const aboveScaleList = ref<{ remark: string, sum: number }[]>([])
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

const aboveScaleMetrics = computed(() =>
  aboveScaleList.value.map((item, index) => ({
    key: `above-${index}`,
    label: String(item.remark || '').trim() || `规上指标${index + 1}`,
    unit: '亿元',
    value: Number.isFinite(Number(item.sum))
      ? Number(item.sum).toFixed(2)
      : '--',
  })),
)

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
      backgroundColor: 'rgba(6, 28, 56, 0.96)',
      borderColor: 'rgba(56, 189, 248, 0.35)',
      borderWidth: 1,
      textStyle: { color: '#e8f4ff', fontSize: 12 },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        return `${p?.name || ''}<br/>${p?.marker || ''}${p?.value ?? 0} 家`
      },
    },
    xAxis: {
      type: 'category',
      data: items.map(i => i.name),
      axisLine: { lineStyle: { color: 'rgba(56, 189, 248, 0.28)' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#6ba3d0',
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
      axisLabel: { color: '#4a7aa8', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(56, 189, 248, 0.1)', type: 'dashed' } },
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
            { offset: 0, color: '#38bdf8' },
            { offset: 1, color: 'rgba(56, 189, 248, 0.35)' },
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

async function loadAboveScale() {
  try {
    const res = await fetchAboveScale()
    if (res.code === 0 && Array.isArray(res.data)) {
      aboveScaleList.value = res.data
        .map(item => ({
          remark: String(item?.remark || '').trim(),
          sum: Number(item?.sum),
        }))
        .filter(item => item.remark || Number.isFinite(item.sum))
    }
    else {
      aboveScaleList.value = []
    }
  } catch (e) {
    console.error('获取规上数据失败:', e)
    aboveScaleList.value = []
  }
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
    const res = await fetchCompanies(1, 1000)
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
  await Promise.all([loadCompanies(), loadParkList(), loadAboveScale()])
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
  --es-bg-deep: #061a2b;
  --es-bg: #0b2c48;
  --es-bg-elev: #10345a;
  --es-panel: rgba(14, 44, 78, 0.88);
  --es-panel-solid: #0d2f52;
  --es-hair: rgba(56, 189, 248, 0.26);
  --es-hair-strong: rgba(125, 211, 252, 0.46);
  --es-accent: #38bdf8;
  --es-accent-soft: #7dd3fc;
  --es-accent-deep: #0284c7;
  --es-accent-line: rgba(56, 189, 248, 0.6);
  --es-gold: var(--es-accent);
  --es-gold-soft: var(--es-accent-soft);
  --es-gold-line: var(--es-accent-line);
  --es-crimson: #f87171;
  --es-text-strong: #f0f8ff;
  --es-text: #b8d8f0;
  --es-text-mute: #7eb4d8;
  --es-text-dim: #5a96c0;
  --es-sans: 'DIN Alternate', 'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', sans-serif;
  --es-mono: 'DIN Alternate', 'SF Mono', 'JetBrains Mono', ui-monospace, monospace;
  --es-radius: 8px;
  --es-float-w: 360px;
  --es-float-top-h: min(44vh, 440px);
  --es-float-bot-h: min(34vh, 320px);
  --es-header-h: 92px;

  position: fixed;
  inset: 0;
  overflow: hidden;
  color: var(--es-text);
  background: var(--es-bg-deep);
  font-family: var(--es-sans);
  font-size: 13px;
  font-feature-settings: 'tnum';
  letter-spacing: 0.01em;
  display: block;
  padding: 0;
}

/* ============ 背景 ============ */
.es-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(ellipse 65% 50% at 78% 12%, rgba(20, 180, 250, 0.26), transparent 55%),
    radial-gradient(ellipse 50% 45% at 6% 78%, rgba(56, 189, 248, 0.18), transparent 50%),
    radial-gradient(ellipse 40% 30% at 48% 100%, rgba(2, 145, 220, 0.14), transparent 60%),
    linear-gradient(180deg, #061c2e 0%, #0b3050 46%, #082744 100%);
}
.es-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(56, 189, 248, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56, 189, 248, 0.06) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(ellipse 88% 78% at 50% 42%, #000 18%, transparent 72%);
}

/* ============ 顶部标题：浮于地图，底部羽化融入 ============ */
.es-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  min-height: var(--es-header-h);
  height: var(--es-header-h);
  padding: 14px 20px 36px;
  border-bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(4, 18, 36, 0.72) 0%,
    rgba(6, 26, 48, 0.38) 42%,
    rgba(6, 26, 48, 0.12) 72%,
    transparent 100%
  );
  pointer-events: none;
}
.es-header::before,
.es-header::after {
  display: none;
}

.es-header-side {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  pointer-events: none;
}
.es-header-side-left {
  justify-content: flex-start;
}
.es-header-side-right {
  justify-content: flex-end;
  padding-top: 6px;
  pointer-events: auto;
}

.es-title-wrap {
  position: absolute;
  left: 50%;
  top: 8px;
  transform: translateX(-50%);
  z-index: 2;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(920px, 78vw);
}
.es-title-frame {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
}

/* 两侧几何导轨：刚性机械线 + 菱形节点 */
.es-title-rail {
  flex: 1;
  min-width: 0;
  height: 36px;
  display: flex;
  align-items: center;
}
.es-title-rail-l {
  justify-content: flex-end;
}
.es-title-rail-r {
  justify-content: flex-start;
}
.es-rail-svg {
  width: 100%;
  max-width: 240px;
  height: 36px;
  overflow: visible;
  filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.55));
}
.es-rail-line {
  stroke: #38bdf8;
  stroke-width: 1.6;
  stroke-linecap: round;
  fill: none;
}
.es-rail-line-soft {
  stroke: rgba(56, 189, 248, 0.35);
  stroke-width: 1;
}
.es-rail-angle {
  fill: rgba(8, 40, 72, 0.55);
  stroke: #5ec8f5;
  stroke-width: 1.4;
}
.es-rail-tick {
  stroke: rgba(125, 211, 252, 0.55);
  stroke-width: 1.2;
  stroke-linecap: round;
}
.es-rail-node {
  fill: #7dd3fc;
  stroke: rgba(165, 243, 252, 0.9);
  stroke-width: 1;
}
.es-rail-node-soft {
  fill: #38bdf8;
  opacity: 0.85;
}

/* 中央六边形标题框 */
.es-title-banner {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 4px;
  padding: 10px 52px;
  min-width: 280px;
  background:
    linear-gradient(180deg, rgba(14, 70, 130, 0.72) 0%, rgba(6, 32, 64, 0.82) 100%);
  border: 1.5px solid rgba(94, 200, 245, 0.85);
  clip-path: polygon(22px 0, calc(100% - 22px) 0, 100% 50%, calc(100% - 22px) 100%, 22px 100%, 0 50%);
  box-shadow:
    0 0 18px rgba(56, 189, 248, 0.45),
    0 0 40px rgba(14, 100, 180, 0.25),
    inset 0 0 20px rgba(56, 189, 248, 0.12);
}
.es-title-banner::before {
  content: '';
  position: absolute;
  inset: 2px;
  background: linear-gradient(180deg, rgba(18, 78, 140, 0.5) 0%, rgba(4, 24, 48, 0.75) 100%);
  clip-path: polygon(21px 0, calc(100% - 21px) 0, 100% 50%, calc(100% - 21px) 100%, 21px 100%, 0 50%);
  pointer-events: none;
  z-index: 0;
}
.es-title-banner::after {
  content: '';
  position: absolute;
  left: 28px;
  right: 28px;
  bottom: 5px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(125, 211, 252, 0.7), transparent);
  z-index: 1;
  pointer-events: none;
}
.es-title-edge {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  transform: translateY(-50%) rotate(45deg);
  background: #7dd3fc;
  box-shadow: 0 0 10px rgba(125, 211, 252, 0.95);
  z-index: 3;
}
.es-title-edge-l { left: 8px; }
.es-title-edge-r { right: 8px; }

.es-title {
  position: relative;
  z-index: 2;
  margin: 0;
  color: var(--es-text-strong);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.38em;
  line-height: 1.2;
  white-space: nowrap;
  text-indent: 0.38em;
}
.es-title-text {
  position: relative;
  display: inline-block;
  color: #e8f6ff;
  text-shadow:
    0 0 12px rgba(56, 189, 248, 0.65),
    0 0 28px rgba(56, 189, 248, 0.35);
  background: none;
  -webkit-text-fill-color: #e8f6ff;
}

.es-header-nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  pointer-events: auto;
}
.es-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: rgba(6, 28, 52, 0.45);
  color: var(--es-text-mute);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-decoration: none;
  border-radius: 6px;
  backdrop-filter: blur(8px);
  transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}
.es-nav-link:hover {
  color: var(--es-text-strong);
  border-color: var(--es-hair-strong);
  background: rgba(56, 189, 248, 0.12);
  transform: translateY(-1px);
}
.es-nav-link:active {
  transform: translateY(0) scale(0.98);
}
.es-nav-link.active {
  color: var(--es-text-strong);
  border-color: var(--es-accent-line);
  background: rgba(56, 189, 248, 0.16);
}

/* ============ 主体：全屏地图 + 四角浮层 ============ */
.es-body {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  min-height: 0;
  padding: 0;
}

.es-float {
  position: absolute;
  z-index: 30;
  pointer-events: none;
  min-width: 0;
}
.es-float > * {
  pointer-events: auto;
}
/* 左上：总览 */
.es-float-tl {
  top: calc(var(--es-header-h) - 8px);
  left: 16px;
  width: var(--es-float-w);
  height: var(--es-float-top-h);
  display: flex;
  flex-direction: column;
}
.es-float-tl .es-panel {
  flex: 1;
  max-height: 100%;
  overflow-y: auto;
}
/* 右上：产业集群 */
.es-float-tr {
  top: calc(var(--es-header-h) - 8px);
  right: 16px;
  width: var(--es-float-w);
  height: var(--es-float-top-h);
  display: flex;
  flex-direction: column;
}
.es-float-tr .es-panel {
  flex: 1;
  max-height: 100%;
}
/* 左下：园区分布 */
.es-float-bl {
  bottom: 16px;
  left: 16px;
  width: var(--es-float-w);
  height: var(--es-float-bot-h);
  display: flex;
  flex-direction: column;
}
.es-float-bl .es-panel {
  flex: 1;
  max-height: 100%;
}
/* 右下：公司性质 */
.es-float-br {
  bottom: 16px;
  right: 16px;
  width: var(--es-float-w);
  height: var(--es-float-bot-h);
  display: flex;
  flex-direction: column;
}
.es-float-br .es-panel {
  flex: 1;
  max-height: 100%;
}

/* ============ 面板通用 ============ */
.es-panel {
  position: relative;
  min-width: 0;
  min-height: 0;
  border: 1px solid rgba(56, 189, 248, 0.32);
  background: linear-gradient(165deg, rgba(12, 44, 82, 0.5) 0%, rgba(6, 24, 48, 0.58) 100%);
  border-radius: var(--es-radius);
  box-shadow:
    0 14px 34px rgba(2, 12, 36, 0.4),
    0 0 24px rgba(56, 189, 248, 0.1),
    inset 0 1px 0 rgba(125, 211, 252, 0.16),
    inset 0 0 0 1px rgba(56, 189, 248, 0.06);
  backdrop-filter: blur(18px) saturate(1.25);
  -webkit-backdrop-filter: blur(18px) saturate(1.25);
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
  background: linear-gradient(90deg, transparent, rgba(125, 211, 252, 0.5), transparent);
  pointer-events: none;
  z-index: 1;
}
.es-panel::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background:
    linear-gradient(var(--es-accent-line), var(--es-accent-line)) left top / 16px 2px no-repeat,
    linear-gradient(var(--es-accent-line), var(--es-accent-line)) left top / 2px 16px no-repeat,
    linear-gradient(var(--es-accent-line), var(--es-accent-line)) right top / 16px 2px no-repeat,
    linear-gradient(var(--es-accent-line), var(--es-accent-line)) right top / 2px 16px no-repeat,
    linear-gradient(var(--es-accent-line), var(--es-accent-line)) left bottom / 16px 2px no-repeat,
    linear-gradient(var(--es-accent-line), var(--es-accent-line)) left bottom / 2px 16px no-repeat,
    linear-gradient(var(--es-accent-line), var(--es-accent-line)) right bottom / 16px 2px no-repeat,
    linear-gradient(var(--es-accent-line), var(--es-accent-line)) right bottom / 2px 16px no-repeat;
  opacity: 0.9;
  filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.45));
}

.es-panel-flex {
  flex: 1;
  min-height: 0;
}
.es-panel-nature {
  flex: 1;
  min-height: 0;
}
.es-panel-legend {
  flex: 1;
  min-height: 0;
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
  background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.45), transparent);
}
.es-panel-empty-chart {
  min-height: 140px;
}

.es-panel-head {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 14px 0 16px;
  flex-shrink: 0;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.16), rgba(8, 36, 72, 0.32) 48%, transparent);
}
.es-panel-head::before {
  /* 斜切头部：左侧发光强调条 */
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: linear-gradient(180deg, var(--es-accent-soft), var(--es-accent-deep));
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.6);
}
.es-panel-head::after {
  /* 头部底边发光分隔线 */
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, var(--es-accent-line), rgba(56, 189, 248, 0.08) 58%, transparent);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}
.es-panel-idx {
  color: #05203a;
  font-family: var(--es-mono);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  padding: 4px 9px 4px 7px;
  background: linear-gradient(135deg, var(--es-accent-soft), var(--es-accent));
  clip-path: polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.45);
}
.es-panel-head h2 {
  margin: 0;
  color: var(--es-text-strong);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.12em;
}
.es-panel-tag {
  margin-left: auto;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--es-hair);
  background: rgba(56, 189, 248, 0.08);
  color: var(--es-text-mute);
  font-size: 10px;
  font-family: var(--es-mono);
  letter-spacing: 0.04em;
}

/* ============ 01 · 核心指标 ============ */
.es-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  flex: 1;
  min-height: 0;
  gap: 1px;
  background: var(--es-hair);
  padding: 1px;
  margin: 10px;
  border-radius: 6px;
  overflow: hidden;
}
.es-metrics-above {
  flex: 0 0 auto;
  grid-template-rows: auto;
  margin-top: 0;
  margin-bottom: 10px;
}
.es-metric {
  padding: 14px 14px 12px;
  background: var(--es-panel-solid);
  transition: background 0.2s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
}
.es-metric.active {
  background: rgba(56, 189, 248, 0.1);
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.es-metric-unit {
  color: var(--es-text-dim);
  font-size: 10px;
}
.es-metric-value {
  color: var(--es-text-strong);
  font-family: var(--es-mono);
  font-size: 28px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
}
.es-metric-value-sm {
  font-size: 20px;
  letter-spacing: 0.01em;
}
.es-metric-unit-suffix {
  margin-left: 4px;
  color: var(--es-text-dim);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
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
  color: var(--es-text);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
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
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.18);
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
  min-height: 0;
  width: 100%;
  padding: 6px 10px 8px;
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

/* ============ 中央地图（铺满） ============ */
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
  border: 0;
  border-radius: 0;
  overflow: hidden;
  background: #061c33;
  box-shadow: none;
  z-index: 5;
}
.es-stage::before {
  /* HUD 边框：内嵌青色描边 + 内发光 + 四角发光角标 */
  content: '';
  position: absolute;
  inset: 12px;
  pointer-events: none;
  z-index: 6;
  border: 1px solid rgba(56, 189, 248, 0.24);
  box-shadow:
    inset 0 0 60px rgba(6, 32, 64, 0.4),
    inset 0 0 3px rgba(125, 211, 252, 0.22);
  background:
    linear-gradient(var(--es-accent), var(--es-accent)) left top / 28px 2px no-repeat,
    linear-gradient(var(--es-accent), var(--es-accent)) left top / 2px 28px no-repeat,
    linear-gradient(var(--es-accent), var(--es-accent)) right top / 28px 2px no-repeat,
    linear-gradient(var(--es-accent), var(--es-accent)) right top / 2px 28px no-repeat,
    linear-gradient(var(--es-accent), var(--es-accent)) left bottom / 28px 2px no-repeat,
    linear-gradient(var(--es-accent), var(--es-accent)) left bottom / 2px 28px no-repeat,
    linear-gradient(var(--es-accent), var(--es-accent)) right bottom / 28px 2px no-repeat,
    linear-gradient(var(--es-accent), var(--es-accent)) right bottom / 2px 28px no-repeat;
  filter: drop-shadow(0 0 5px rgba(56, 189, 248, 0.5));
}
.es-stage::after {
  /* 四边中点羽翼光线，呼应标题装饰翼 */
  content: '';
  position: absolute;
  inset: 12px;
  pointer-events: none;
  z-index: 7;
  background:
    linear-gradient(90deg, transparent, var(--es-accent-soft), transparent) top center / 220px 2px no-repeat,
    linear-gradient(90deg, transparent, var(--es-accent-soft), transparent) bottom center / 220px 2px no-repeat,
    linear-gradient(180deg, transparent, var(--es-accent-soft), transparent) left center / 2px 150px no-repeat,
    linear-gradient(180deg, transparent, var(--es-accent-soft), transparent) right center / 2px 150px no-repeat;
  filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.65));
}

.es-stage-fx {
  /* 科技感背景层：周边背景地图压暗虚化 + 科技网格/辉光，突出被抬起的高新区 */
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background:
    /* 边缘暗角：周边背景地图压暗虚化 */
    radial-gradient(122% 100% at 50% 44%, transparent 44%, rgba(3, 11, 24, 0.66) 100%),
    /* 底部托举辉光，强化"抬起"的悬浮感 */
    radial-gradient(135% 82% at 50% 124%, rgba(37, 99, 235, 0.32), transparent 60%),
    /* 顶部科技辉光 */
    radial-gradient(92% 56% at 50% -14%, rgba(14, 165, 233, 0.20), transparent 58%),
    /* 科技网格 */
    linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px) 0 0 / 100% 46px,
    linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px) 0 0 / 46px 100%;
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
.es-stage-canvas :deep(.amap-toolbar) {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
}
.es-stage-canvas :deep(.amap-controlbar) {
  top: auto !important;
  bottom: 20px !important;
  right: 410px !important;
  left: auto !important;
  transform: scale(0.5) !important;
  transform-origin: bottom right !important;
}
.es-stage-canvas :deep(.amap-controlbar),
.es-stage-canvas :deep(.amap-controlbar *) {
  box-sizing: content-box !important;
  font-feature-settings: normal !important;
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

/* 左下：园区分布图例（嵌在统一面板内） */
.es-legend {
  position: relative;
  z-index: 6;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 10px 12px 12px;
  width: 100%;
  border: 0;
  border-radius: 0;
  background: transparent;
  backdrop-filter: none;
  box-shadow: none;
}
.es-legend-title {
  display: none;
}
.es-legend-items {
  display: grid;
  gap: 6px;
  flex: 1;
  min-height: 0;
  align-content: start;
  overflow-y: auto;
  overflow-x: hidden;
}
.es-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--es-text);
  font-size: 11px;
  letter-spacing: 0.02em;
  line-height: 1.4;
  white-space: nowrap;
  width: 100%;
  margin: 0;
  padding: 5px 6px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  opacity: 0.9;
  transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
}
.es-legend-item:hover {
  opacity: 1;
  color: var(--es-text-strong);
  background: rgba(56, 189, 248, 0.08);
}
.es-legend-item.active {
  opacity: 1;
  color: var(--es-accent-soft);
  background: rgba(56, 189, 248, 0.12);
}
.es-legend-dot {
  width: 9px;
  height: 9px;
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
  flex-shrink: 0;
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
    animation: none !important;
  }
}

/* ============ 响应式 ============ */
@media (max-width: 1600px) {
  .es-screen { --es-float-w: min(340px, 24vw); }
}

@media (max-width: 1400px) {
  .es-screen { --es-float-w: min(320px, 26vw); --es-header-h: 84px; }
  .es-title { font-size: 20px; letter-spacing: 0.28em; text-indent: 0.28em; }
  .es-title-banner { padding: 9px 40px; min-width: 240px; }
  .es-title-wrap { width: min(820px, 82vw); }
  .es-rail-svg { max-width: 180px; }
  .es-metric-value { font-size: 24px; }
  .es-industry-row { grid-template-columns: 90px minmax(0, 1fr) 42px; }
}

@media (max-width: 1180px) {
  .es-screen { --es-float-w: min(300px, 42vw); --es-header-h: 76px; }
  .es-header {
    flex-wrap: wrap;
    height: auto;
    min-height: 64px;
    padding: 10px 12px 28px;
    gap: 8px;
  }
  .es-title-wrap {
    position: relative;
    left: auto;
    top: auto;
    transform: none;
    order: -1;
    width: 100%;
    align-items: center;
    pointer-events: none;
  }
  .es-header-side-left { display: none; }
  .es-header-side-right {
    flex: 1 1 100%;
    justify-content: center;
  }
  .es-title { font-size: 17px; letter-spacing: 0.14em; text-indent: 0.14em; }
  .es-title-wrap { width: 100%; }
  .es-title-banner { padding: 8px 36px; min-width: 0; }
  .es-rail-svg { max-width: 120px; }
  .es-float-tl,
  .es-float-tr,
  .es-float-bl,
  .es-float-br {
    max-width: 360px;
  }
}

@media (max-width: 720px) {
  .es-title { font-size: 15px; letter-spacing: 0.1em; text-indent: 0.1em; }
  .es-title-banner { padding: 7px 28px; }
  .es-title-edge { width: 7px; height: 7px; }
  .es-title-rail { display: none; }
  .es-metrics { grid-template-columns: 1fr; }
  .es-float-tl {
    top: calc(var(--es-header-h) - 4px);
    left: 8px;
    right: 8px;
    width: auto;
    max-width: none;
    max-height: none;
  }
  .es-float-tr {
    top: auto;
    bottom: calc(34vh + 16px);
    right: 8px;
    left: auto;
    width: min(260px, 70vw);
    height: auto;
    max-height: 36vh;
  }
  .es-float-bl { display: none; }
  .es-float-br {
    bottom: 8px;
    right: 8px;
    left: 8px;
    width: auto;
    max-width: none;
    height: auto;
  }
  .es-footer { flex-wrap: wrap; height: auto; padding: 8px 12px; gap: 8px; }
  .es-industry-row { grid-template-columns: 76px minmax(0, 1fr) 40px; gap: 6px; }
}
</style>
