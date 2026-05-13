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
          <div class="card chart-container sentiment-chart-card">
            <div class="chart-label">历史舆情</div>
            <v-chart class="sentiment-chart" :option="historicalPieOption" @click="onSentimentClick('historical', $event)" autoresize />
          </div>
          <div class="card chart-container sentiment-chart-card">
            <div class="chart-label">最新快照</div>
            <v-chart class="sentiment-chart" :option="latestPieOption" @click="onSentimentClick('latest', $event)" autoresize />
          </div>
        </div>
        <!-- 趋势卡片区 -->
        <div class="trend-cards">
          <div
            v-for="card in trendCards"
            :key="card.key"
            class="trend-card card-hover"
            :class="{ active: selectedTrend === card.key }"
            :style="{ '--trend-color': card.color }"
            @click="selectedTrend = selectedTrend === card.key ? null : card.key"
          >
            <div class="trend-card-header">
              <span class="trend-period">
                <UIcon :name="card.icon" class="trend-icon" />
                {{ card.period }}
              </span>
              <span class="trend-type badge" :class="card.badgeClass">{{ card.label }}</span>
            </div>
            <div class="trend-num" :style="{ color: card.color }">{{ card.value }}%</div>
            <div class="trend-track">
              <div class="trend-track-fill" :style="{ width: `${card.value}%`, background: card.color, color: card.color }" />
            </div>
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
            <div>
              <div class="articles-title">相关文章</div>
              <div class="articles-sub">点击后的情感分区会展示关键词，用来说明为什么判定为正向、中性或负向。</div>
            </div>
            <UButton
              variant="ghost"
              color="neutral"
              size="sm"
              icon="i-lucide-chevron-up"
              @click="selectedSentiment = null; selectedTrend = null"
            >
              收起
            </UButton>
          </div>
          <div v-if="sentimentKeywordSummary.length" class="articles-insight">
            <span class="insight-label">关键词依据</span>
            <UBadge
              v-for="keyword in sentimentKeywordSummary"
              :key="keyword"
              :label="keyword"
              variant="outline"
              color="neutral"
              size="xs"
              class="insight-chip"
            />
          </div>
          <div class="articles-list">
            <div v-for="a in sentimentArticles" :key="a.id" class="article-item">
              <div class="article-score" :style="{ color: scoreColor(a.score) }">
                {{ (a.score * 100).toFixed(0) }}
              </div>
              <div class="article-main">
                <div class="article-body">
                  <div class="article-title">{{ a.title }}</div>
                  <div class="article-meta">{{ a.source }} · {{ a.date }}</div>
                  <div class="article-reason">{{ a.reason }}</div>
                  <div class="article-tags">
                    <UBadge
                      v-for="keyword in a.keywords"
                      :key="`${a.id}-${keyword}`"
                      :label="keyword"
                      variant="soft"
                      color="neutral"
                      size="xs"
                    />
                  </div>
                </div>
                <NuxtLink :to="a.link" class="article-link">
                  查看详情
                  <UIcon name="i-lucide-arrow-up-right" class="size-4" />
                </NuxtLink>
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
          :style="{ '--doc-color': cat.color }"
          @click="cat.hasPermission && goToRetrieve(cat.key)"
        >
          <div class="doc-card-header">
            <div class="doc-abbr" :style="{ background: cat.color }">{{ cat.abbr }}</div>
            <span class="doc-card-chip" :class="cat.hasPermission ? 'doc-card-chip-open' : 'doc-card-chip-locked'">
              {{ cat.hasPermission ? `${Math.round((cat.stats.visible / Math.max(cat.stats.total, 1)) * 100)}% 可见` : '权限受限' }}
            </span>
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
        <UButton
          variant="outline"
          color="neutral"
          size="sm"
          :icon="catExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          :trailing-icon="undefined"
          @click="catExpanded = !catExpanded"
        >
          {{ catExpanded ? '收起其余类型' : `展开全部 ${allCats.length} 类` }}
        </UButton>
      </div>
      <Transition name="slide-up">
        <div v-if="catExpanded && hiddenCats.length > 0" class="doc-type-grid mt-3">
          <div
            v-for="cat in hiddenCats"
            :key="cat.key"
            class="doc-card card"
            :class="[cat.hasPermission ? 'card-hover cursor-pointer' : 'doc-card-locked']"
            :style="{ '--doc-color': cat.color }"
            @click="cat.hasPermission && goToRetrieve(cat.key)"
          >
            <div class="doc-card-header">
              <div class="doc-abbr" :style="{ background: cat.color }">{{ cat.abbr }}</div>
              <span class="doc-card-chip" :class="cat.hasPermission ? 'doc-card-chip-open' : 'doc-card-chip-locked'">
                {{ cat.hasPermission ? `${Math.round((cat.stats.visible / Math.max(cat.stats.total, 1)) * 100)}% 可见` : '权限受限' }}
              </span>
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
        <!-- 知识库分布 -->
        <div class="card chart-container" style="padding: 20px">
          <div class="chart-label" style="margin-bottom: 4px">知识库文档分布</div>
          <div class="chart-sub">各库文档占比</div>
          <v-chart :option="kbPieOption" style="height: 220px" autoresize />
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
        <!-- 系统能力热度 -->
        <div class="card chart-container" style="padding: 20px">
          <div class="chart-label" style="margin-bottom: 4px">系统能力热度</div>
          <div class="chart-sub">展示平台核心模块的运行成熟度</div>
          <v-chart :option="systemCapabilityOption" style="height: 220px" autoresize />
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import VChart from 'vue-echarts'
import {
  CATEGORIES, CATEGORY_STATS, SENTIMENT_DATA,
  MONTHLY_IMPORTS, DAILY_QUERIES, KB_DOC_DIST, SYSTEM_CAPABILITY_SCORE
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
    { key: 'hist-pos', period: '历史', label: '正向', badgeClass: 'badge-success', icon: 'i-heroicons-arrow-trending-up', color: 'var(--success)', value: h.positive, trend: null, trendText: '' },
    { key: 'late-pos', period: '最新', label: '正向', badgeClass: 'badge-success', icon: 'i-heroicons-arrow-trending-up', color: 'var(--danger)', value: l.positive, trend: 'up', trendText: `+${l.positive - h.positive}%` },
    { key: 'hist-neu', period: '历史', label: '中性', badgeClass: 'badge-secondary', icon: 'i-heroicons-minus-circle', color: '#06b6d4', value: h.neutral, trend: null, trendText: '' },
    { key: 'late-neu', period: '最新', label: '中性', badgeClass: 'badge-secondary', icon: 'i-heroicons-minus-circle', color: '#06b6d4', value: l.neutral, trend: 'down', trendText: `${l.neutral - h.neutral}%` },
    { key: 'hist-neg', period: '历史', label: '负向', badgeClass: 'badge-danger', icon: 'i-heroicons-arrow-trending-down', color: 'var(--success)', value: h.negative, trend: null, trendText: '' },
    { key: 'late-neg', period: '最新', label: '负向', badgeClass: 'badge-danger', icon: 'i-heroicons-arrow-trending-down', color: 'var(--success)', value: l.negative, trend: 'down', trendText: `${l.negative - h.negative}%` }
  ]
})

const sentimentArticles = computed(() => {
  if (selectedSentiment.value === 'positive' || selectedTrend.value?.includes('pos')) return SENTIMENT_DATA.articles.positive
  if (selectedSentiment.value === 'neutral' || selectedTrend.value?.includes('neu')) return SENTIMENT_DATA.articles.neutral
  if (selectedSentiment.value === 'negative' || selectedTrend.value?.includes('neg')) return SENTIMENT_DATA.articles.negative
  return []
})

const sentimentKeywordSummary = computed(() => [...new Set(sentimentArticles.value.flatMap(article => article.keywords))].slice(0, 8))

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
const SENTIMENT_COLORS = {
  positive: '#22c55e',
  neutral: '#06b6d4',
  negative: '#ef4444'
}

const chartTextColor = computed(() => {
  const t = settingsStore.theme
  return t === 'light' || t === 'warm' ? '#4a3820' : '#8080b0'
})

const chartSurfaceColor = computed(() => {
  const t = settingsStore.theme
  if (t === 'light') return '#ffffff'
  if (t === 'green') return '#141f18'
  if (t === 'purple') return '#17132a'
  if (t === 'warm') return '#fffdf9'
  return '#13131f'
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

function createSentimentPieOption(title: string, data: typeof SENTIMENT_DATA.historical) {
  const chartData = [
    {
      name: '正向',
      value: data.positive,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#86efac' },
            { offset: 1, color: SENTIMENT_COLORS.positive }
          ]
        }
      }
    },
    {
      name: '中性',
      value: data.neutral,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#67e8f9' },
            { offset: 1, color: SENTIMENT_COLORS.neutral }
          ]
        }
      }
    },
    {
      name: '负向',
      value: data.negative,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#fca5a5' },
            { offset: 1, color: SENTIMENT_COLORS.negative }
          ]
        }
      }
    }
  ]

  return {
    animationDuration: 900,
    animationEasing: 'cubicOut',
    tooltip: { ...tooltipStyle, trigger: 'item', formatter: '{b}: {c}% 占比' },
    legend: {
      bottom: 0,
      left: 'center',
      icon: 'circle',
      itemWidth: 7,
      itemHeight: 7,
      itemGap: 10,
      textStyle: { color: chartTextColor.value, fontSize: 10 }
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '34%',
        z: 10,
        style: {
          text: `${data.total}`,
          fill: 'var(--text-strong)',
          fontSize: 26,
          fontWeight: 800,
          textAlign: 'center'
        }
      },
      {
        type: 'text',
        left: 'center',
        top: '48%',
        z: 10,
        style: {
          text: '总舆情量',
          fill: chartTextColor.value,
          fontSize: 11,
          fontWeight: 600,
          textAlign: 'center'
        }
      },
      {
        type: 'text',
        left: 'center',
        top: '56%',
        z: 10,
        style: {
          text: title,
          fill: chartTextColor.value,
          fontSize: 10,
          fontWeight: 600,
          textAlign: 'center'
        }
      }
    ],
    series: [
      {
        type: 'pie',
        radius: ['80%', '82%'],
        center: ['50%', '45%'],
        silent: true,
        label: { show: false },
        data: [
          { value: 35, itemStyle: { color: 'rgba(34, 197, 94, 0.26)' } },
          { value: 30, itemStyle: { color: 'rgba(6, 182, 212, 0.18)' } },
          { value: 35, itemStyle: { color: 'rgba(239, 68, 68, 0.22)' } }
        ]
      },
      {
        type: 'pie',
        radius: ['26%', '35%'],
        center: ['50%', '45%'],
        silent: true,
        label: { show: false },
        data: [{
          value: 100,
          itemStyle: {
            color: {
              type: 'radial',
              x: 0.5,
              y: 0.5,
              r: 0.6,
              colorStops: [
                { offset: 0, color: 'rgba(99, 102, 241, 0.24)' },
                { offset: 1, color: 'rgba(99, 102, 241, 0.04)' }
              ]
            }
          }
        }]
      },
      {
        type: 'pie',
        radius: ['42%', '73%'],
        center: ['50%', '45%'],
        roseType: 'area',
        padAngle: 4,
        startAngle: 104,
        selectedMode: 'single',
        selectedOffset: 8,
        itemStyle: {
          borderRadius: 12,
          borderColor: chartSurfaceColor.value,
          borderWidth: 2,
          shadowBlur: 18,
          shadowColor: 'rgba(99, 102, 241, 0.34)'
        },
        label: { show: true, fontSize: 10, color: chartTextColor.value, formatter: '{b} {c}%' },
        labelLine: { length: 16, length2: 12, lineStyle: { color: chartTextColor.value, opacity: 0.62 } },
        emphasis: {
          scale: true,
          scaleSize: 8,
          itemStyle: { shadowBlur: 26, shadowColor: 'rgba(99, 102, 241, 0.5)' },
          label: { fontWeight: 700 }
        },
        data: chartData
      }
    ]
  }
}

// 历史饼图
const historicalPieOption = computed(() => createSentimentPieOption('历史正向', SENTIMENT_DATA.historical))

// 最新饼图
const latestPieOption = computed(() => createSentimentPieOption('最新正向', SENTIMENT_DATA.latest))

// 系统能力热度
const systemCapabilityOption = computed(() => ({
  tooltip: { ...tooltipStyle, trigger: 'item', formatter: '{b}: {c} 分' },
  radar: {
    radius: '68%',
    splitNumber: 4,
    axisName: { color: chartTextColor.value, fontSize: 11 },
    splitArea: {
      areaStyle: {
        color: ['transparent', 'transparent', 'transparent', 'transparent']
      }
    },
    axisLine: { lineStyle: { color: 'rgba(99, 102, 241, 0.24)' } },
    splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.16)' } },
    indicator: SYSTEM_CAPABILITY_SCORE.map(item => ({ name: item.name, max: 100 }))
  },
  series: [{
    type: 'radar',
    symbol: 'circle',
    symbolSize: 5,
    itemStyle: { color: PRIMARY },
    lineStyle: { color: PRIMARY, width: 2 },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: PRIMARY + '70' },
          { offset: 1, color: PRIMARY + '14' }
        ]
      }
    },
    data: [{ value: SYSTEM_CAPABILITY_SCORE.map(item => item.value) }]
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
  font-family: var(--font-display);
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
  grid-template-columns: minmax(480px, 1.8fr) minmax(180px, 0.5fr);
  gap: 18px;
  align-items: stretch;
  margin-bottom: 16px;
  min-height: 340px;
}

.sentiment-charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  height: 100%;
  min-height: 340px;
}

.sentiment-chart-card {
  position: relative;
  min-height: 340px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 50% 46%, color-mix(in srgb, var(--primary) 16%, transparent), transparent 44%),
    linear-gradient(145deg, color-mix(in srgb, var(--primary) 10%, var(--surface)), var(--surface) 58%),
    var(--surface);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, white 6%, transparent),
    0 16px 34px color-mix(in srgb, var(--primary) 10%, transparent);
}



.sentiment-chart {
  flex: 1;
  min-height: 292px;
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
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 12px;
  height: 100%;
  min-height: 340px;
}

.trend-card {
  position: relative;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 86% 18%, color-mix(in srgb, var(--trend-color) 18%, transparent), transparent 42%),
    linear-gradient(135deg, color-mix(in srgb, var(--surface-alt) 64%, transparent), var(--surface)),
    var(--surface);
  border: 1px solid color-mix(in srgb, var(--trend-color) 24%, var(--border));
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: transform 0.18s, border-color 0.18s, background 0.18s, box-shadow 0.18s;
  isolation: isolate;
}



.trend-card:hover, .trend-card.active {
  border-color: var(--trend-color);
  background:
    radial-gradient(circle at 86% 18%, color-mix(in srgb, var(--trend-color) 26%, transparent), transparent 42%),
    linear-gradient(135deg, color-mix(in srgb, var(--trend-color) 12%, var(--surface)), var(--surface)),
    var(--primary-soft);
  box-shadow: 0 14px 34px color-mix(in srgb, var(--trend-color) 16%, transparent);
}

.trend-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.trend-period {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-muted);
}

.trend-icon {
  width: 14px;
  height: 14px;
  color: var(--trend-color);
}

.trend-num {
  font-size: 28px;
  font-weight: 700;
  font-family: var(--font-display);
  line-height: 1;
}

.trend-track {
  height: 4px;
  margin-top: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, var(--border) 70%, transparent);
}

.trend-track-fill {
  height: 100%;
  border-radius: inherit;
  box-shadow: 0 0 16px currentColor;
  transition: width 0.25s ease;
}

.trend-arrow {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  margin-top: 6px;
}

.trend-arrow.up { color: var(--danger); }
.trend-arrow.down { color: var(--success); }



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
.articles-sub { font-size: 11px; color: var(--text-muted); margin-top: 3px; }

.articles-insight {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 0 12px;
}

.insight-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
}

.insight-chip {
  backdrop-filter: blur(10px);
}

.articles-list { display: flex; flex-direction: column; gap: 10px; }

.article-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  background: var(--surface-alt);
  border-radius: 8px;
}

.article-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex: 1;
}

.article-body {
  min-width: 0;
  flex: 1;
}

.article-score {
  font-size: 20px;
  font-weight: 700;
  font-family: var(--font-display);
  width: 40px;
  text-align: center;
  flex-shrink: 0;
}

.article-title { font-size: 13px; color: var(--text-strong); line-height: 1.4; }
.article-meta { font-size: 11px; color: var(--text-muted); margin-top: 3px; }
.article-reason { font-size: 12px; color: var(--text); margin-top: 6px; line-height: 1.6; }
.article-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }

.article-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--primary);
  text-decoration: none;
  white-space: nowrap;
  padding-top: 2px;
}

.article-link:hover {
  color: color-mix(in srgb, var(--primary) 76%, white);
}

/* Doc type cards */
.doc-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 8px;
}

.doc-card {
  position: relative;
  overflow: hidden;
  padding: 16px;
  border-color: color-mix(in srgb, var(--doc-color) 20%, var(--border));
  background:
    radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--doc-color) 18%, transparent), transparent 36%),
    linear-gradient(145deg, color-mix(in srgb, var(--surface) 84%, var(--doc-color) 8%), var(--surface));
  transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
}

.doc-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, color-mix(in srgb, var(--doc-color) 18%, transparent), transparent 40%);
  opacity: 0.85;
  pointer-events: none;
}

.doc-card::after {
  content: '';
  position: absolute;
  inset: auto -26px -26px auto;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--doc-color) 22%, transparent);
  filter: blur(18px);
  opacity: 0.68;
  pointer-events: none;
}

.doc-card-locked { opacity: 0.55; cursor: not-allowed !important; }

.doc-card-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.doc-card-chip {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  backdrop-filter: blur(14px);
}

.doc-card-chip-open {
  background: color-mix(in srgb, var(--doc-color) 18%, transparent);
  color: color-mix(in srgb, var(--doc-color) 72%, white);
  border: 1px solid color-mix(in srgb, var(--doc-color) 32%, transparent);
}

.doc-card-chip-locked {
  background: color-mix(in srgb, var(--surface-alt) 88%, transparent);
  color: var(--text-muted);
  border: 1px solid var(--border);
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

.doc-card-name { position: relative; z-index: 1; font-size: 13px; font-weight: 700; color: var(--text-strong); margin-bottom: 4px; }
.doc-card-desc { position: relative; z-index: 1; font-size: 11px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.5; }

.doc-progress-row {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.doc-count { font-size: 11px; color: var(--text); font-family: var(--font-display); }
.doc-updated { font-size: 10px; color: var(--text-muted); }

.progress-bar { position: relative; z-index: 1; }

.expand-row { display: flex; justify-content: center; margin: 8px 0; }

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
  .sentiment-charts { grid-template-columns: 1fr; }
  .sentiment-chart-card { min-height: 250px; }
  .trend-cards { grid-template-columns: repeat(2, 1fr); }
  .doc-type-grid { grid-template-columns: repeat(2, 1fr); }
  .article-main { flex-direction: column; }
}

/* cursor */
.cursor-pointer { cursor: pointer; }
</style>
