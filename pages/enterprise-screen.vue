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
              <span class="es-panel-tag">{{ filteredCompanies.length }} 家 · {{ industryTabs.length }} 类</span>
            </div>
            <div class="es-chart-scroll">
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
                      :style="{ width: `${item.percent}%` }"
                    />
                    <span
                      class="es-industry-pct"
                      :style="{ left: `calc(${item.percent}% + 4px)` }"
                    >{{ item.percent }}%</span>
                  </div>
                  <span class="es-industry-count">{{ item.count }}</span>
                </li>
              </ul>
            </div>
          </section>

          <!-- 03 重点企业名录（暂隐藏）
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
              <span class="es-legend-title">园区分布</span>
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
                  {{ item.shortName }} {{ item.count }}
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
import type { CompanyRecord } from '~/types/company'
import { fetchCompanies } from '~/types/company'
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
const companies = ref<CompanyRecord[]>(fallbackCompanies)
const selectedCompany = ref<CompanyRecord | null>(null)
const sourceFilter = ref<SourceFilter>('all')
const activeIndustry = ref('all')
const activeMetric = ref<MetricKey | null>(null)
const syncStamp = ref(new Date())
const newsList = ref<NewsItem[]>([])
const newsLoading = ref(false)

function onScreenNavClick(event: MouseEvent, link: typeof screenNavLinks[number]) {
  event.preventDefault()
  navigateTo(link.path)
}

const {
  mapContainerRef,
  mapReady,
  parkLegend,
  selectedParkName,
  selectPark,
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
  const total = filteredCompanies.value.length || 1
  const counter = new Map<string, number>()
  for (const company of filteredCompanies.value) {
    const name = productSubName(company)
    counter.set(name, (counter.get(name) || 0) + 1)
  }
  return Array.from(counter, ([name, count]) => ({
    name,
    color: colorForName(name),
    count,
    percent: Math.round((count / total) * 1000) / 10,
  }))
    .sort((a, b) => b.count - a.count)
})

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
    { key: 'listed' as const, label: '上市公司', unit: '家', value: listed.toString(), hint: `资本化率 ${listedRate}%` },
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
})

onUnmounted(() => {
  destroyMap()
})
</script>

<style scoped>
/* ============================================================
   科技亮蓝 · 产业情报大屏
   Palette:  #0c2040 亮蓝底 / #38bdf8 天蓝 / #e8f4ff 冰白
   ============================================================ */
.es-screen {
  --es-bg-deep: #0c1522;
  --es-bg: #121c2b;
  --es-bg-elev: #182536;
  --es-panel: #152033;
  --es-panel-solid: #152033;
  --es-hair: rgba(148, 163, 184, 0.14);
  --es-hair-strong: rgba(148, 163, 184, 0.24);
  --es-accent: #4f8fbf;
  --es-accent-soft: #6ea6ce;
  --es-accent-deep: #3a6f96;
  --es-accent-line: rgba(79, 143, 191, 0.45);
  --es-gold: var(--es-accent);
  --es-gold-soft: var(--es-accent-soft);
  --es-gold-line: var(--es-accent-line);
  --es-crimson: #e07a7a;
  --es-text-strong: #e6edf5;
  --es-text: #b5c3d4;
  --es-text-mute: #8a9bb0;
  --es-text-dim: #6b7c90;
  --es-mono: 'DIN Alternate', 'SF Mono', 'JetBrains Mono', ui-monospace, monospace;

  position: fixed;
  inset: 0;
  overflow: hidden;
  color: var(--es-text);
  background: var(--es-bg-deep);
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', sans-serif;
  font-feature-settings: 'tnum';
  display: grid;
  grid-template-rows: 56px 1fr;
  padding: 10px 16px 10px;
}

/* ============ 背景 ============ */
.es-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: linear-gradient(180deg, #0c1522 0%, #121c2b 100%);
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
  padding: 0 4px;
  border-bottom: 1px solid var(--es-hair);
}

.es-title {
  margin: 0;
  color: var(--es-text-strong);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.04em;
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
  padding: 5px 10px;
  border: 1px solid var(--es-hair);
  background: transparent;
  color: var(--es-text-mute);
  font-size: 12px;
  letter-spacing: 0.02em;
  text-decoration: none;
  border-radius: 4px;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.es-nav-link:hover {
  color: var(--es-text-strong);
  border-color: var(--es-hair-strong);
  background: rgba(255, 255, 255, 0.03);
}
.es-nav-link.active {
  color: var(--es-text-strong);
  border-color: var(--es-accent-line);
  background: rgba(79, 143, 191, 0.12);
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
  grid-template-rows: auto minmax(0, 1fr);
  position: relative;
  z-index: 2;
}

/* ============ 面板通用 ============ */
.es-panel {
  position: relative;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--es-hair);
  background: var(--es-panel);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  padding: 10px;
}

.es-panel-flex {
  flex: 1;
  min-height: 0;
  padding: 10px;
}

.es-panel-head {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 36px;
  padding: 0 12px;
  border-bottom: 1px solid var(--es-hair);
  flex-shrink: 0;
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
  letter-spacing: 0.02em;
}
.es-panel-tag {
  margin-left: auto;
  color: var(--es-text-dim);
  font-size: 11px;
  font-family: var(--es-mono);
}

/* ============ 01 · 核心指标 ============ */
.es-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--es-hair);
  padding: 1px;
}
.es-metric {
  padding: 12px 14px 10px;
  background: var(--es-panel-solid);
  transition: background 0.2s ease;
  position: relative;
}
.es-metric.active {
  background: rgba(79, 143, 191, 0.1);
}
.es-metric.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 2px;
  background: var(--es-accent);
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
  font-size: 24px;
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
  padding: 10px 6px 8px;
}
.es-chart-scroll::-webkit-scrollbar {
  width: 4px;
}
.es-chart-scroll::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.25);
  border-radius: 2px;
}
.es-industry-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.es-industry-row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr) 32px;
  align-items: center;
  gap: 8px;
  min-height: 22px;
}
.es-industry-label {
  color: #8a9bb0;
  font-size: 11px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
}
.es-industry-bar-wrap {
  position: relative;
  height: 16px;
  background: rgba(148, 163, 184, 0.08);
  border-radius: 2px;
  overflow: visible;
}
.es-industry-bar {
  position: absolute;
  top: 50%;
  left: 0;
  height: 7px;
  transform: translateY(-50%);
  background: rgba(79, 143, 191, 0.35);
  border-radius: 2px;
  transition: width 0.4s ease;
}
.es-industry-bar.top {
  background: #6ea6ce;
}
.es-industry-pct {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: #9eb3c8;
  font-size: 10px;
  font-family: var(--es-mono);
  white-space: nowrap;
  line-height: 1;
  pointer-events: none;
}
.es-industry-count {
  color: #b5c3d4;
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
  border: 1px solid var(--es-hair);
  border-radius: 6px;
  overflow: hidden;
  background: #0a111c;
  z-index: 5;
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
  top: 10px;
  left: 10px;
  z-index: 5;
  padding: 8px 10px;
  border: 1px solid var(--es-hair);
  border-radius: 6px;
  background: rgba(18, 28, 43, 0.92);
  max-width: 168px;
}
.es-legend-title {
  display: block;
  color: var(--es-text-dim);
  font-size: 11px;
  margin-bottom: 6px;
}
.es-legend-items {
  display: grid;
  gap: 3px;
}
.es-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--es-text);
  font-size: 10px;
  letter-spacing: 0.02em;
  line-height: 1.3;
  white-space: nowrap;
  width: 100%;
  margin: 0;
  padding: 2px 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  opacity: 0.88;
  transition: opacity 0.15s ease, color 0.15s ease;
}
.es-legend-item:hover {
  opacity: 1;
  color: var(--es-text-strong);
}
.es-legend-item.active {
  opacity: 1;
  color: var(--es-accent);
}
.es-legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.es-legend-reset {
  margin-top: 6px;
  padding: 4px 0 0;
  border: 0;
  border-top: 1px solid var(--es-hair);
  background: transparent;
  color: var(--es-text-mute);
  font-size: 11px;
  cursor: pointer;
  width: 100%;
  text-align: left;
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

/* ============ 响应式（大屏 ≥ 1440px 为设计基准） ============ */
@media (max-width: 1400px) {
  .es-title { font-size: 18px; }
  .es-metric-value { font-size: 22px; }
  .es-body { grid-template-columns: minmax(280px, 32%) 1fr; gap: 12px; }
}

@media (max-width: 1180px) {
  .es-screen { padding: 8px 12px 8px; grid-template-rows: 52px 1fr; }
  .es-body { grid-template-columns: 1fr; padding: 10px 0 0; }
  .es-col { grid-template-rows: none; }
  .es-stage { min-height: 460px; }
  .es-title { font-size: 17px; white-space: normal; }
}

@media (max-width: 720px) {
  .es-screen { padding: 8px 10px 8px; }
  .es-title { font-size: 16px; }
  .es-footer { flex-wrap: wrap; height: auto; padding: 8px 12px; gap: 8px; }
}
</style>
