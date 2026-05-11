<template>
  <div>
    <!-- 路由守卫 -->
    <ClientOnly>
      <!-- 欢迎区 -->
      <div class="welcome-banner">
        <div class="welcome-left">
          <div class="welcome-greeting">
            欢迎回来，<span class="greeting-name">{{ user?.name }}</span>
          </div>
          <div class="welcome-sub">
            知识中台 · {{ user?.roleName }} · {{ user?.tenant }}
          </div>
        </div>
        <div class="welcome-stats">
          <div class="welcome-stat">
            <div class="stat-num">{{ visibleDocCount }}</div>
            <div class="stat-label">可见文档</div>
          </div>
          <div class="welcome-stat-sep" />
          <div class="welcome-stat">
            <div class="stat-num">{{ allowedCatCount }} 类</div>
            <div class="stat-label">覆盖知识库</div>
          </div>
          <div class="welcome-stat-sep" />
          <div class="welcome-stat">
            <div class="stat-num">38 次</div>
            <div class="stat-label">今日检索</div>
          </div>
        </div>
      </div>

      <!-- 舆情分析区 -->
      <div class="section-title">
        <span>舆情分析</span>
        <span class="section-meta">最近更新：{{ SENTIMENT_DATA.updateTime }}</span>
      </div>
      <div class="sentiment-area">
        <!-- 饼图区 -->
        <div class="sentiment-charts">
          <div class="card chart-container" style="padding: 16px">
            <div class="chart-label">历史舆情</div>
            <v-chart :option="historicalPieOption" style="height:200px" @click="onSentimentClick('historical', $event)" autoresize />
          </div>
          <div class="card chart-container" style="padding: 16px">
            <div class="chart-label">最新快照</div>
            <v-chart :option="latestPieOption" style="height:200px" @click="onSentimentClick('latest', $event)" autoresize />
          </div>
        </div>
        <!-- 趋势卡片区 -->
        <div class="trend-cards">
          <div
            v-for="card in trendCards"
            :key="card.key"
            class="trend-card card-hover"
            :class="{ active: selectedTrend === card.key }"
            @click="selectedTrend = selectedTrend === card.key ? null : card.key"
          >
            <div class="trend-card-header">
              <span class="trend-period">{{ card.period }}</span>
              <span class="trend-type badge" :class="card.badgeClass">{{ card.label }}</span>
            </div>
            <div class="trend-num" :style="{ color: card.color }">{{ card.value }}%</div>
            <div v-if="card.trend" class="trend-arrow" :class="card.trend">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path v-if="card.trend === 'up'" d="M6 10V2M2 6l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path v-else-if="card.trend === 'down'" d="M6 2v8M2 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path v-else d="M2 6h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>{{ card.trendText }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 舆情文章展开面板 -->
      <Transition name="slide-up">
        <div v-if="sentimentArticles.length > 0" class="card sentiment-articles">
          <div class="articles-header">
            <span class="articles-title">相关文章</span>
            <button class="btn btn-ghost btn-sm" @click="selectedSentiment = null; selectedTrend = null">收起</button>
          </div>
          <div class="articles-list">
            <div v-for="a in sentimentArticles" :key="a.id" class="article-item">
              <div class="article-score" :style="{ color: scoreColor(a.score) }">
                {{ (a.score * 100).toFixed(0) }}
              </div>
              <div class="article-body">
                <div class="article-title">{{ a.title }}</div>
                <div class="article-meta">{{ a.source }} · {{ a.date }}</div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 文档类型卡片区 -->
      <div class="section-title">
        <span>文档类型概览</span>
      </div>
      <div class="doc-type-grid">
        <div
          v-for="cat in visibleCatsFirst"
          :key="cat.key"
          class="doc-card card"
          :class="[cat.hasPermission ? 'card-hover cursor-pointer' : 'doc-card-locked']"
          @click="cat.hasPermission && goToRetrieve(cat.key)"
        >
          <div class="doc-card-header">
            <div class="doc-abbr" :style="{ background: cat.color }">{{ cat.abbr }}</div>
            <span v-if="!cat.hasPermission" class="badge badge-secondary" style="font-size:10px">权限受限</span>
          </div>
          <div class="doc-card-name">{{ cat.name }}</div>
          <div class="doc-card-desc">{{ cat.desc }}</div>
          <div class="doc-progress-row">
            <span class="doc-count">{{ cat.stats.visible }}/{{ cat.stats.total }}</span>
            <span class="doc-updated">{{ cat.stats.updatedAt }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: cat.stats.total > 0 ? (cat.stats.visible / cat.stats.total * 100) + '%' : '0%' }" />
          </div>
        </div>
      </div>

      <!-- 折叠/展开 -->
      <div v-if="hiddenCats.length > 0" class="expand-row">
        <button class="expand-btn" @click="catExpanded = !catExpanded">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path :d="catExpanded ? 'M2 9l5-5 5 5' : 'M2 5l5 5 5-5'" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          {{ catExpanded ? '收起其余类型' : `展开全部 ${allCats.length} 类` }}
        </button>
      </div>
      <Transition name="slide-up">
        <div v-if="catExpanded && hiddenCats.length > 0" class="doc-type-grid mt-3">
          <div
            v-for="cat in hiddenCats"
            :key="cat.key"
            class="doc-card card"
            :class="[cat.hasPermission ? 'card-hover cursor-pointer' : 'doc-card-locked']"
            @click="cat.hasPermission && goToRetrieve(cat.key)"
          >
            <div class="doc-card-header">
              <div class="doc-abbr" :style="{ background: cat.color }">{{ cat.abbr }}</div>
              <span v-if="!cat.hasPermission" class="badge badge-secondary" style="font-size:10px">权限受限</span>
            </div>
            <div class="doc-card-name">{{ cat.name }}</div>
            <div class="doc-card-desc">{{ cat.desc }}</div>
            <div class="doc-progress-row">
              <span class="doc-count">{{ cat.stats.visible }}/{{ cat.stats.total }}</span>
              <span class="doc-updated">{{ cat.stats.updatedAt }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: cat.stats.total > 0 ? (cat.stats.visible / cat.stats.total * 100) + '%' : '0%' }" />
            </div>
          </div>
        </div>
      </Transition>

      <!-- 图表统计区 -->
      <div class="section-title" style="margin-top: 32px">
        <span>数据统计</span>
      </div>
      <div class="charts-grid">
        <!-- 文档类型分布 -->
        <div class="card chart-container" style="padding: 20px">
          <div class="chart-label" style="margin-bottom: 4px">文档类型分布</div>
          <div class="chart-sub">当前用户可见文档</div>
          <v-chart :option="docTypePieOption" style="height: 220px" autoresize />
        </div>
        <!-- 近期导入趋势 -->
        <div class="card chart-container" style="padding: 20px">
          <div class="chart-label" style="margin-bottom: 4px">近期导入趋势</div>
          <div class="chart-sub">近 7 个月导入量</div>
          <v-chart :option="importBarOption" style="height: 220px" autoresize />
        </div>
        <!-- 近 7 日检索 -->
        <div class="card chart-container" style="padding: 20px">
          <div class="chart-label" style="margin-bottom: 4px">近 7 日检索次数</div>
          <div class="chart-sub">检索量趋势</div>
          <v-chart :option="queryLineOption" style="height: 220px" autoresize />
        </div>
        <!-- 知识库分布 -->
        <div class="card chart-container" style="padding: 20px">
          <div class="chart-label" style="margin-bottom: 4px">知识库文档分布</div>
          <div class="chart-sub">各库文档占比</div>
          <v-chart :option="kbPieOption" style="height: 220px" autoresize />
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import VChart from 'vue-echarts'
import {
  CATEGORIES, CATEGORY_STATS, SENTIMENT_DATA,
  MONTHLY_IMPORTS, DAILY_QUERIES, DOC_TYPE_DIST, KB_DOC_DIST
} from '~/data/mock'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const router = useRouter()

const user = computed(() => authStore.user)
const allowedCategories = computed(() => user.value?.allowedCategories || [])

const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b',
  '#22c55e', '#06b6d4', '#f97316', '#a855f7', '#ef4444',
  '#84cc16', '#0ea5e9', '#d946ef', '#fb923c', '#64748b'
]

const allCats = computed(() =>
  CATEGORIES.map((cat, i) => ({
    ...cat,
    hasPermission: allowedCategories.value.includes(cat.key),
    stats: CATEGORY_STATS[cat.key] || { visible: 0, total: 0, updatedAt: '-' },
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
  }))
)

const FIRST_ROW_COUNT = 7
const visibleCatsFirst = computed(() => allCats.value.slice(0, FIRST_ROW_COUNT))
const hiddenCats = computed(() => allCats.value.slice(FIRST_ROW_COUNT))
const catExpanded = ref(false)

const visibleDocCount = computed(() =>
  allCats.value.filter(c => c.hasPermission).reduce((s, c) => s + c.stats.visible, 0)
)

const allowedCatCount = computed(() => allowedCategories.value.length)

// ---- 舆情 ----
const selectedSentiment = ref<string | null>(null)
const selectedTrend = ref<string | null>(null)

const trendCards = computed(() => {
  const h = SENTIMENT_DATA.historical
  const l = SENTIMENT_DATA.latest
  return [
    { key: 'hist-pos', period: '历史', label: '正向', badgeClass: 'badge-success', color: 'var(--success)', value: h.positive, trend: null, trendText: '' },
    { key: 'late-pos', period: '最新', label: '正向', badgeClass: 'badge-success', color: 'var(--success)', value: l.positive, trend: 'up', trendText: `+${l.positive - h.positive}%` },
    { key: 'hist-neu', period: '历史', label: '中性', badgeClass: 'badge-secondary', color: 'var(--text-muted)', value: h.neutral, trend: null, trendText: '' },
    { key: 'late-neu', period: '最新', label: '中性', badgeClass: 'badge-secondary', color: 'var(--text-muted)', value: l.neutral, trend: 'down', trendText: `${l.neutral - h.neutral}%` },
    { key: 'hist-neg', period: '历史', label: '负向', badgeClass: 'badge-danger', color: 'var(--danger)', value: h.negative, trend: null, trendText: '' },
    { key: 'late-neg', period: '最新', label: '负向', badgeClass: 'badge-danger', color: 'var(--danger)', value: l.negative, trend: 'down', trendText: `${l.negative - h.negative}%` }
  ]
})

const sentimentArticles = computed(() => {
  if (selectedSentiment.value === 'positive' || selectedTrend.value?.includes('pos')) return SENTIMENT_DATA.articles.positive
  if (selectedSentiment.value === 'neutral' || selectedTrend.value?.includes('neu')) return SENTIMENT_DATA.articles.neutral
  if (selectedSentiment.value === 'negative' || selectedTrend.value?.includes('neg')) return SENTIMENT_DATA.articles.negative
  return []
})

function onSentimentClick(_chart: string, params: any) {
  const nameMap: Record<string, string> = { '正向': 'positive', '中性': 'neutral', '负向': 'negative' }
  selectedSentiment.value = nameMap[params.name] || null
}

function scoreColor(score: number) {
  if (score >= 0.7) return 'var(--success)'
  if (score >= 0.4) return 'var(--warning)'
  return 'var(--danger)'
}

// ---- ECharts 颜色 ----
const PRIMARY = '#6366f1'
const COLORS = ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4']

const chartTextColor = computed(() => {
  const t = settingsStore.theme
  return t === 'light' || t === 'warm' ? '#4a3820' : '#8080b0'
})

const baseAxisStyle = computed(() => ({
  axisLine: { lineStyle: { color: chartTextColor.value } },
  axisTick: { lineStyle: { color: chartTextColor.value } },
  axisLabel: { color: chartTextColor.value, fontSize: 11 },
  splitLine: { lineStyle: { color: chartTextColor.value, opacity: 0.15 } }
}))

const tooltipStyle = {
  backgroundColor: 'var(--surface)',
  borderColor: 'var(--border)',
  textStyle: { color: 'var(--text)', fontSize: 12 },
  borderRadius: 10
}

// 历史饼图
const historicalPieOption = computed(() => ({
  tooltip: { ...tooltipStyle, trigger: 'item', formatter: '{b}: {c}%' },
  color: [COLORS[2], COLORS[5], COLORS[4]],
  series: [{
    type: 'pie', radius: ['40%', '72%'], padAngle: 3,
    itemStyle: { borderRadius: 8 },
    label: { show: true, fontSize: 11, color: chartTextColor.value, formatter: '{b}\n{c}%' },
    data: [
      { name: '正向', value: SENTIMENT_DATA.historical.positive },
      { name: '中性', value: SENTIMENT_DATA.historical.neutral },
      { name: '负向', value: SENTIMENT_DATA.historical.negative }
    ]
  }]
}))

// 最新饼图
const latestPieOption = computed(() => ({
  tooltip: { ...tooltipStyle, trigger: 'item', formatter: '{b}: {c}%' },
  color: [COLORS[2], COLORS[5], COLORS[4]],
  series: [{
    type: 'pie', radius: ['40%', '72%'], padAngle: 3,
    itemStyle: { borderRadius: 8 },
    label: { show: true, fontSize: 11, color: chartTextColor.value, formatter: '{b}\n{c}%' },
    data: [
      { name: '正向', value: SENTIMENT_DATA.latest.positive },
      { name: '中性', value: SENTIMENT_DATA.latest.neutral },
      { name: '负向', value: SENTIMENT_DATA.latest.negative }
    ]
  }]
}))

// 文档类型分布
const docTypePieOption = computed(() => ({
  tooltip: { ...tooltipStyle, trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  color: COLORS,
  legend: { show: false },
  series: [{
    type: 'pie', radius: ['40%', '70%'], padAngle: 3,
    itemStyle: { borderRadius: 8 },
    label: { show: true, fontSize: 10, color: chartTextColor.value, formatter: '{b}\n{d}%' },
    data: DOC_TYPE_DIST
  }]
}))

// 导入趋势柱状图
const importBarOption = computed(() => ({
  tooltip: { ...tooltipStyle, trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { top: 16, right: 16, bottom: 32, left: 40 },
  xAxis: { type: 'category', data: MONTHLY_IMPORTS.map(d => d.month.slice(5)), ...baseAxisStyle.value },
  yAxis: { type: 'value', ...baseAxisStyle.value },
  series: [{
    type: 'bar', barMaxWidth: 32,
    itemStyle: { borderRadius: [6, 6, 0, 0], color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: PRIMARY }, { offset: 1, color: PRIMARY + '40' }] } },
    data: MONTHLY_IMPORTS.map(d => d.count)
  }]
}))

// 检索折线图
const queryLineOption = computed(() => ({
  tooltip: { ...tooltipStyle, trigger: 'axis' },
  grid: { top: 16, right: 16, bottom: 32, left: 40 },
  xAxis: { type: 'category', data: DAILY_QUERIES.map(d => d.date), ...baseAxisStyle.value },
  yAxis: { type: 'value', ...baseAxisStyle.value },
  series: [{
    type: 'line', smooth: true, symbol: 'circle', symbolSize: 5,
    lineStyle: { color: PRIMARY, width: 2 },
    itemStyle: { color: PRIMARY },
    areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: PRIMARY + '40' }, { offset: 1, color: PRIMARY + '05' }] } },
    data: DAILY_QUERIES.map(d => d.count)
  }]
}))

// 知识库分布
const kbPieOption = computed(() => ({
  tooltip: { ...tooltipStyle, trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  color: COLORS,
  series: [{
    type: 'pie', radius: ['40%', '70%'], padAngle: 3,
    itemStyle: { borderRadius: 8 },
    label: { show: true, fontSize: 10, color: chartTextColor.value, formatter: '{b}\n{d}%' },
    data: KB_DOC_DIST
  }]
}))

function goToRetrieve(categoryKey: string) {
  router.push({ path: '/retrieve', query: { category: categoryKey } })
}
</script>

<style scoped>
/* Welcome */
.welcome-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, var(--primary-soft), color-mix(in srgb, var(--accent) 8%, var(--surface)));
  border: 1px solid color-mix(in srgb, var(--primary) 20%, var(--border));
  border-radius: 16px;
  padding: 24px 28px;
  margin-bottom: 24px;
  gap: 20px;
  flex-wrap: wrap;
}

.welcome-greeting {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-strong);
  line-height: 1.3;
}

.greeting-name {
  color: var(--primary);
}

.welcome-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

.welcome-stats {
  display: flex;
  align-items: center;
  gap: 20px;
}

.welcome-stat { text-align: center; }

.stat-num {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary);
  font-family: 'Inter', sans-serif;
}

.stat-label { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.welcome-stat-sep { width: 1px; height: 32px; background: var(--border); }

/* Section title */
.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-strong);
  margin: 0 0 12px;
}

.section-meta { font-size: 11px; color: var(--text-muted); font-weight: 400; }

/* Sentiment */
.sentiment-area {
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: 16px;
  margin-bottom: 16px;
}

.sentiment-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.chart-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-strong);
}

.chart-sub { font-size: 11px; color: var(--text-muted); margin-bottom: 4px; }

.trend-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.trend-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.trend-card:hover, .trend-card.active {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.trend-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.trend-period { font-size: 11px; color: var(--text-muted); }

.trend-num {
  font-size: 28px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  line-height: 1;
}

.trend-arrow {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  margin-top: 6px;
}

.trend-arrow.up { color: var(--success); }
.trend-arrow.down { color: var(--danger); }

/* Sentiment articles */
.sentiment-articles {
  margin-bottom: 16px;
  padding: 16px;
}

.articles-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.articles-title { font-size: 13px; font-weight: 600; color: var(--text-strong); }

.articles-list { display: flex; flex-direction: column; gap: 10px; }

.article-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  background: var(--surface-alt);
  border-radius: 8px;
}

.article-score {
  font-size: 20px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  width: 40px;
  text-align: center;
  flex-shrink: 0;
}

.article-title { font-size: 13px; color: var(--text-strong); line-height: 1.4; }
.article-meta { font-size: 11px; color: var(--text-muted); margin-top: 3px; }

/* Doc type cards */
.doc-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 8px;
}

.doc-card {
  padding: 14px;
  transition: all 0.2s ease;
}

.doc-card-locked { opacity: 0.55; cursor: not-allowed !important; }

.doc-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.doc-abbr {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.doc-card-name { font-size: 13px; font-weight: 600; color: var(--text-strong); margin-bottom: 3px; }
.doc-card-desc { font-size: 11px; color: var(--text-muted); margin-bottom: 10px; line-height: 1.4; }

.doc-progress-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.doc-count { font-size: 11px; color: var(--text); font-family: 'Inter', sans-serif; }
.doc-updated { font-size: 10px; color: var(--text-muted); }

.expand-row { display: flex; justify-content: center; margin: 8px 0; }

.expand-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface-alt);
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.expand-btn:hover {
  color: var(--primary);
  border-color: var(--primary);
  background: var(--primary-soft);
}

/* Charts grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 1024px) {
  .sentiment-area { grid-template-columns: 1fr; }
  .trend-cards { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 640px) {
  .charts-grid { grid-template-columns: 1fr; }
  .welcome-banner { flex-direction: column; }
  .trend-cards { grid-template-columns: repeat(2, 1fr); }
  .doc-type-grid { grid-template-columns: repeat(2, 1fr); }
}

/* cursor */
.cursor-pointer { cursor: pointer; }
</style>
