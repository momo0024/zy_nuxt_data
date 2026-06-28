<template>
  <div class="nc-root">
    <!-- ── 顶栏 ── -->
    <header class="nc-hero">
      <div class="nc-hero-masthead">
        <div class="nc-brand">
          <span class="nc-brand-symbol">N</span>
          <div class="nc-brand-text">
            <h1 class="nc-brand-title">新闻中心</h1>
            <p class="nc-brand-sub">创新平台资讯聚合 · 智能检索</p>
          </div>
        </div>
        <div class="nc-hero-stats">
          <div class="nc-stat-pill" v-for="s in heroStats" :key="s.label">
            <span class="nc-stat-val">{{ s.value }}</span>
            <span class="nc-stat-lbl">{{ s.label }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- ── 筛选栏 ── -->
    <div class="nc-filter-bar">
      <!-- 第一行：关键词搜索 + 时间 + 来源 + 搜索按钮 -->
      <div class="nc-filter-row">
        <UInput
          v-model="filters.keyword"
          placeholder="输入标题、关键词搜索新闻..."
          icon="i-lucide-search"
          size="lg"
          class="nc-search-input"
          @keyup.enter="handleSearch"
        />
        <div class="nc-date-picker-wrap">
          <!-- <label class="nc-filter-label">时间</label> -->
          <DateRangePicker v-model="dateRange" placeholder="选择时间" class="nc-date-picker" />
        </div>
        <USelectMenu
          v-model="filters.source"
          :items="sourceOptions"
          value-key="value"
          placeholder="全部来源"
          size="lg"
          class="nc-filter-select"
        >
          <template #item="{ item }">
            <span :title="item.label" class="truncate">{{ item.label }}</span>
          </template>
        </USelectMenu>
        <UButton
          color="primary"
          icon="i-lucide-search"
          size="lg"
          class="nc-search-btn"
          @click="handleSearch"
        >
          搜索
        </UButton>
      </div>

      <!-- 第二行：重置 + 关键词 -->
      <div class="nc-filter-row nc-reset-keyword-row">
        <div class="nc-reset-wrap">
          <UButton
            v-if="hasActiveFilters"
            color="neutral"
            variant="ghost"
            icon="i-lucide-rotate-ccw"
            @click="handleReset"
            size="md"
          >
            重置条件
          </UButton>
        </div>
      </div>

      <!-- 第三行：关键词标签选择 -->
      <div class="nc-filter-row nc-keyword-row">
        <label class="nc-filter-label">关键词：</label>
        <div class="nc-keyword-list" :class="{ 'nc-keyword-list--expanded': keywordExpanded }">
          <span
            v-for="kw in visibleKeywords"
            :key="kw"
            class="nc-keyword-chip"
            :class="{ 'nc-keyword-chip--active': selectedKeywords.has(kw) }"
            @click="toggleKeyword(kw)"
          >
            {{ kw }}
          </span>
          <span v-if="!keywordList.length" class="nc-keyword-empty">暂无关键词</span>
        </div>
        <UButton
          v-if="keywordList.length > keywordShowLimit"
          variant="ghost"
          size="sm"
          class="nc-keyword-expand-btn"
          @click="keywordExpanded = !keywordExpanded"
        >
          {{ keywordExpanded ? '收起' : `展开更多 (${keywordList.length - keywordShowLimit})` }}
          <UIcon :name="keywordExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-3.5" />
        </UButton>
      </div>
    </div>

    <!-- ── 主内容：新闻列表 ── -->
    <main class="nc-main">
      <!-- 活跃 filter 标签 -->
      <div v-if="activeFilters.length" class="nc-active-tags">
        <span
          v-for="tag in activeFilters"
          :key="tag.key"
          class="nc-tag"
        >
          {{ tag.label }}
          <UIcon name="i-lucide-x" class="nc-tag-x" @click="tag.onRemove" />
        </span>
      </div>

      <!-- 新闻网格 -->
      <transition-group v-if="newsList.length" name="nc-list" tag="div" class="nc-news-grid">
        <div
          v-if="pagedNews.length > 0"
          :key="pagedNews[0].id"
          class="nc-card nc-card-featured"
          :class="{ 'nc-card--link': !!pagedNews[0].url }"
          @click="openNews(pagedNews[0])"
        >
          <div class="nc-card-accent-bar"></div>
          <div class="nc-card-featured-inner">
            <div class="nc-featured-meta">
              <span class="nc-source-badge" :class="'nc-source-badge--' + getSourceColor(pagedNews[0].source)">
                <UIcon name="i-lucide-newspaper" class="size-3" />
                {{ pagedNews[0].source }}
              </span>
              <span class="nc-featured-date">{{ formatFullDate(pagedNews[0].date) }}</span>
              <span class="nc-featured-time">{{ pagedNews[0].time }}</span>
            </div>
            <h2 class="nc-featured-title">{{ pagedNews[0].title }}</h2>
            <div class="nc-featured-footer">
              <div class="nc-featured-tags" v-if="pagedNews[0].matchedKeywords.length">
                <span
                  v-for="kw in pagedNews[0].matchedKeywords"
                  :key="kw"
                  class="nc-keyword-tag nc-keyword-tag--featured"
                >
                  <UIcon name="i-lucide-hash" class="size-3" />
                  {{ kw }}
                </span>
              </div>
              <span class="nc-featured-link">
                阅读 <UIcon name="i-lucide-arrow-right" class="size-3.5" />
              </span>
            </div>
          </div>
          <div class="nc-featured-accent" aria-hidden="true">
            <svg viewBox="0 0 120 120" class="nc-featured-svg">
              <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" stroke-width="0.4" opacity="0.25" />
              <circle cx="60" cy="60" r="35" fill="none" stroke="currentColor" stroke-width="0.3" opacity="0.15" />
              <circle cx="60" cy="60" r="18" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.4" />
              <line x1="60" y1="42" x2="60" y2="78" stroke="currentColor" stroke-width="0.5" opacity="0.2" />
              <line x1="42" y1="60" x2="78" y2="60" stroke="currentColor" stroke-width="0.5" opacity="0.2" />
            </svg>
          </div>
        </div>

        <div
          v-for="item in pagedNews.slice(1)"
          :key="item.id"
          class="nc-card"
          :class="{ 'nc-card--link': !!item.url }"
          @click="openNews(item)"
        >
          <div class="nc-card-accent-bar"></div>
          <div class="nc-card-date-stamp">
            <span class="nc-stamp-mo">{{ formatMonth(item.date) }}</span>
            <span class="nc-stamp-day">{{ formatDay(item.date) }}</span>
            <span v-if="getRelativeLabel(item.date)" class="nc-stamp-rel">{{ getRelativeLabel(item.date) }}</span>
          </div>
          <div class="nc-card-body">
            <div class="nc-card-header">
              <span class="nc-source-dot" :style="{ backgroundColor: getSourceDotColor(item.source) }"></span>
              <span class="nc-card-source">{{ item.source }}</span>
            </div>
            <h3 class="nc-card-title">{{ item.title }}</h3>
            <div class="nc-card-footer">
              <div class="nc-card-tags" v-if="item.matchedKeywords.length">
                <span
                  v-for="kw in item.matchedKeywords"
                  :key="kw"
                  class="nc-keyword-tag"
                >
                  <UIcon name="i-lucide-tag" class="size-3" />
                  {{ kw }}
                </span>
              </div>
              <span class="nc-card-time">{{ item.time }}</span>
            </div>
          </div>
          <div class="nc-card-jump">
            <UIcon name="i-lucide-arrow-up-right" class="nc-jump-icon" />
          </div>
        </div>
      </transition-group>

      <div v-else class="nc-empty">
        <div class="nc-empty-icon">
          <UIcon name="i-lucide-newspaper" class="size-10" />
        </div>
        <p class="nc-empty-title">未找到匹配的新闻</p>
        <p class="nc-empty-desc">尝试调整筛选条件或更换关键词</p>
        <UButton variant="ghost" color="neutral" size="sm" icon="i-lucide-rotate-ccw" @click="handleReset">
          清除所有条件
        </UButton>
      </div>

      <div v-if="totalPages > 1" class="nc-pagination">
        <USelectMenu
          v-model="pageSize"
          :items="pageSizeOptions"
          value-key="value"
          size="xs"
          class="nc-page-size-select"
          @update:model-value="onPageSizeChange"
        />
        <UPagination
          v-model:page="currentPage"
          :items-per-page="pageSize"
          :total="pagination.total"
          :show-edges="true"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { DateRangeValue } from '~/components/DateRangePicker.vue'

definePageMeta({ middleware: 'auth', keepalive: true })

/* ── 类型 ── */
interface NewsItem {
  id: string
  title: string
  source: string
  date: string
  time: string
  category: string
  matchedKeywords: string[]
  url: string
}

interface FilterState {
  keyword: string
  source: string
}

/* ── 来源选项 ── */
const sourceOptions = ref([{ label: '全部来源', value: 'all' }])

const sourceTextColors: Record<string, string> = {
  '证券时报': '#d97706', '经济日报': '#16a34a', '财经周报': '#d97706',
  '中国证券报': '#d97706', '电子工程专辑': '#52525b', '金融时报': '#6366f1',
  '21世纪经济报道': '#dc2626', '银行家': '#6366f1', '贸易观察': '#2563eb',
  '科技日报': '#0891b2', '健康报': '#db2777', '能源杂志': '#d97706',
  '中国制造': '#52525b', '通信世界': '#0891b2', '环境经济': '#16a34a',
}

const sourceBadgeColors: Record<string, string> = {
  '证券时报': 'warning', '经济日报': 'success', '财经周报': 'warning',
  '中国证券报': 'warning', '电子工程专辑': 'neutral', '金融时报': 'primary',
  '21世纪经济报道': 'error', '银行家': 'primary', '贸易观察': 'primary',
  '科技日报': 'success', '健康报': 'error', '能源杂志': 'warning',
  '中国制造': 'neutral', '通信世界': 'success', '环境经济': 'success',
}

/* ── 状态 ── */
const filters = reactive<FilterState>({ keyword: '', source: 'all' })
const appliedFilters = reactive<FilterState>({ keyword: '', source: 'all' })

const todayStr = getTodayStr()
const dateRange = ref<DateRangeValue>({ start: todayStr, end: todayStr })
const appliedDateRange = ref<DateRangeValue>({ start: todayStr, end: todayStr })

const keywordList = ref<string[]>([])
const selectedKeywords = ref(new Set<string>())
const keywordExpanded = ref(false)
const keywordShowLimit = 16
const pageReady = ref(false)

const newsList = ref<NewsItem[]>([])
const pagination = ref({ page: 1, page_size: 50, total: 0, total_pages: 0 })
const loading = ref(false)
const pageSize = ref(50)
const pageSizeOptions = [
  { label: '20 条/页', value: 20 },
  { label: '50 条/页', value: 50 },
  { label: '100 条/页', value: 100 },
  { label: '200 条/页', value: 200 },
]
const currentPage = ref(1)
const todayCount = ref(0)
const sourceCount = ref(0)

/* ── 日期格式化 ── */
function getTodayStr(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatFullDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}月${parseInt(d)}日`
}

function formatMonth(dateStr: string): string {
  const [, m] = dateStr.split('-')
  return `${parseInt(m)}月`
}

function formatDay(dateStr: string): string {
  const [, , d] = dateStr.split('-')
  return parseInt(d).toString()
}

function parseLocalDateParts(isoTime: string): { date: string; time: string } {
  if (!isoTime) return { date: '', time: '' }
  // 后端北京时间：2026-06-12 15:29:00
  const cnMatch = isoTime.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/)
  if (cnMatch) {
    return { date: cnMatch[1], time: cnMatch[2] }
  }
  const d = new Date(isoTime)
  if (Number.isNaN(d.getTime())) {
    return { date: '', time: '' }
  }
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return { date: `${y}-${m}-${day}`, time: `${h}:${min}` }
}

function getRelativeLabel(dateStr: string): string {
  const today = getTodayStr()
  if (dateStr === today) return '今天'
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return ''
  const itemDate = new Date(y, m - 1, d)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = Math.floor((todayStart.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 1) return '昨天'
  if (diff === 2) return '前天'
  return ''
}

/* ── 计算属性 ── */
const hasActiveFilters = computed(() => {
  return appliedFilters.keyword || appliedFilters.source !== 'all'
    || appliedDateRange.value.start || appliedDateRange.value.end || selectedKeywords.value.size > 0
})

const heroStats = computed(() => [
  { label: '今日更新', value: todayCount.value },
  { label: '覆盖来源', value: sourceCount.value },
])

const totalPages = computed(() => Math.max(1, pagination.value.total_pages))

const pagedNews = computed(() => newsList.value)

const visibleKeywords = computed(() => {
  if (keywordExpanded.value || keywordList.value.length <= keywordShowLimit) {
    return keywordList.value
  }
  return keywordList.value.slice(0, keywordShowLimit)
})

const activeFilters = computed(() => {
  const t: Array<{ key: string; label: string; onRemove: () => void }> = []
  if (appliedFilters.keyword.trim()) {
    t.push({ key: 'kw', label: `"${appliedFilters.keyword.trim()}"`, onRemove: () => { appliedFilters.keyword = ''; filters.keyword = ''; fetchNews() } })
  }
  if (appliedFilters.source !== 'all') {
    const siteLabel = sourceOptions.value.find(o => o.value === appliedFilters.source)?.label || appliedFilters.source
    t.push({ key: 'src', label: siteLabel, onRemove: () => { appliedFilters.source = 'all'; filters.source = 'all'; fetchNews() } })
  }
  if (appliedDateRange.value.start || appliedDateRange.value.end) {
    const start = appliedDateRange.value.start
    const end = appliedDateRange.value.end
    if (start && end) {
      t.push({ key: 'dr', label: `${start} ~ ${end}`, onRemove: () => { appliedDateRange.value = {}; dateRange.value = {}; fetchNews() } })
    } else if (start) {
      t.push({ key: 'ds', label: `从 ${start}`, onRemove: () => { appliedDateRange.value = {}; dateRange.value = {}; fetchNews() } })
    } else if (end) {
      t.push({ key: 'de', label: `到 ${end}`, onRemove: () => { appliedDateRange.value = {}; dateRange.value = {}; fetchNews() } })
    }
  }
  selectedKeywords.value.forEach(kw => {
    t.push({ key: `kw-${kw}`, label: kw, onRemove: () => {
      selectedKeywords.value.delete(kw)
      currentPage.value = 1
      fetchNews()
    }})
  })
  return t
})

/* ── 方法 ── */
function getSourceColor(s: string): string { return sourceBadgeColors[s] || 'neutral' }

const sourceDotColorMap: Record<string, string> = {
  '证券时报': '#f59e0b', '经济日报': '#22c55e', '财经周报': '#f59e0b',
  '中国证券报': '#f59e0b', '电子工程专辑': '#71717a', '金融时报': '#6366f1',
  '21世纪经济报道': '#ef4444', '银行家': '#6366f1', '贸易观察': '#2563eb',
  '科技日报': '#0891b2', '健康报': '#ec4899', '能源杂志': '#f59e0b',
  '中国制造': '#71717a', '通信世界': '#0891b2', '环境经济': '#22c55e',
}

function getSourceDotColor(s: string): string {
  return sourceDotColorMap[s] || 'var(--primary)'
}

function toggleKeyword(kw: string) {
  if (selectedKeywords.value.has(kw)) {
    selectedKeywords.value.delete(kw)
  } else {
    selectedKeywords.value.add(kw)
  }
  currentPage.value = 1
  fetchNews()
}

function mapMatchedKeywords(keywordHits: Array<{ keyword?: string }> | undefined): string[] {
  if (!Array.isArray(keywordHits)) return []
  const seen = new Set<string>()
  const keywords: string[] = []
  for (const hit of keywordHits) {
    const kw = hit.keyword?.trim()
    if (!kw || seen.has(kw)) continue
    seen.add(kw)
    keywords.push(kw)
  }
  return keywords
}

function mapApiItem(item: any): NewsItem {
  const { date, time } = parseLocalDateParts(item.publish_time || '')
  return {
    id: String(item.id),
    title: item.title || '',
    source: item.source || '',
    date,
    time,
    category: item.category || '',
    matchedKeywords: mapMatchedKeywords(item.keyword_hits),
    url: item.url || '',
  }
}

function openNews(item: NewsItem) {
  if (!item.url) return
  window.open(item.url, '_blank', 'noopener,noreferrer')
}

async function fetchNews(opts?: { includeSummary?: boolean }) {
  loading.value = true
  try {
    const query: Record<string, any> = {
      page: currentPage.value,
      page_size: pageSize.value,
      sort_by: 'publish_time',
      sort_order: 'desc',
    }
    if (opts?.includeSummary) query.include_summary = true
    if (appliedFilters.source && appliedFilters.source !== 'all') query.site_id = Number(appliedFilters.source)
    if (appliedDateRange.value.start) query.start_date = appliedDateRange.value.start
    if (appliedDateRange.value.end) query.end_date = appliedDateRange.value.end
    const keywordParts: string[] = []
    if (appliedFilters.keyword.trim()) keywordParts.push(appliedFilters.keyword.trim())
    if (keywordParts.length) query.keyword = keywordParts.join(' ')
    if (selectedKeywords.value.size) query.keywords = [...selectedKeywords.value].join(' ')

    const res = await newsRequest.get('/news/list', { params: query })
    if (res.data?.code === 0) {
      const apiData = res.data.data
      newsList.value = (apiData.items || []).map(mapApiItem)
      pagination.value = apiData.pagination || { page: 1, page_size: pageSize.value, total: 0, total_pages: 0 }
      if (apiData.keywords) {
        keywordList.value = apiData.keywords
      }
      if (apiData.summary) {
        todayCount.value = apiData.summary.today_news ?? 0
        sourceCount.value = apiData.summary.total_sources ?? 0
      }
    }
  } catch (e) {
    console.error('获取新闻列表失败:', e)
  } finally {
    loading.value = false
  }
}

async function fetchSources() {
  try {
    const res = await newsRequest.get('/sources')
    if (res.data?.code === 0) {
      const sources = res.data.data || []
      sourceOptions.value = [
        { label: '全部来源', value: 'all' },
        ...sources.map((s: { id: number; site_name: string }) => ({ label: s.site_name, value: String(s.id) })),
      ]
    }
  } catch (e) {
    console.error('获取来源列表失败:', e)
  }
}

async function handleSearch() {
  appliedFilters.keyword = filters.keyword
  appliedFilters.source = filters.source
  appliedDateRange.value = { ...dateRange.value }
  currentPage.value = 1
  await fetchNews()
}

function handleReset() {
  filters.keyword = ''; filters.source = 'all'
  appliedFilters.keyword = ''; appliedFilters.source = 'all'
  const tStr = getTodayStr()
  dateRange.value = { start: tStr, end: tStr }
  appliedDateRange.value = { start: tStr, end: tStr }
  selectedKeywords.value.clear()
  currentPage.value = 1
  fetchNews()
}

watch(currentPage, () => {
  if (pageReady.value) fetchNews()
})

function onPageSizeChange() {
  currentPage.value = 1
  fetchNews()
}

async function initNewsCenterPage() {
  await fetchNews({ includeSummary: true })
  pageReady.value = true
  void fetchSources()
}

usePageInit(initNewsCenterPage)
</script>

<style scoped>
/* ═══════════════════════════════════════
   Root
═══════════════════════════════════════ */
.nc-root {
  --nc-max-width: min(1400px, calc(100vw - 32px));
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.nc-hero,
.nc-filter-bar,
.nc-main {
  width: 100%;
  max-width: var(--nc-max-width);
}

/* ═══════════════════════════════════════
   Hero
═══════════════════════════════════════ */
.nc-hero {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--surface-radius);
  padding: 28px 28px 22px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
}

.nc-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    radial-gradient(ellipse 600px 300px at 85% -20%, color-mix(in srgb, var(--primary) 4%, transparent), transparent),
    radial-gradient(ellipse 400px 200px at 15% 120%, color-mix(in srgb, var(--primary) 3%, transparent), transparent);
  pointer-events: none;
}

.nc-hero::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--primary) 15%, transparent) 50%, transparent);
  pointer-events: none;
}

.nc-hero-masthead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

.nc-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.nc-brand-symbol {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px; height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  font-family: var(--font-display);
  flex-shrink: 0;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--primary) 35%, transparent);
}

.nc-brand-title {
  font-size: 20px; font-weight: 700;
  color: var(--text-strong); margin: 0;
  line-height: 1.2;
}

.nc-brand-sub {
  margin: 2px 0 0;
  font-size: 12px; color: var(--text-muted);
}

.nc-hero-stats {
  display: flex;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.nc-stat-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 18px;
  background: color-mix(in srgb, var(--surface-alt) 60%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  border-radius: 12px;
  min-width: 72px;
  transition: border-color 0.2s ease;
}

.nc-stat-pill:hover {
  border-color: color-mix(in srgb, var(--primary) 25%, var(--border));
}

.nc-stat-val {
  font-size: 20px; font-weight: 800;
  color: var(--primary);
  font-family: var(--font-display);
  line-height: 1;
}

.nc-stat-lbl {
  font-size: 10px; color: var(--text-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* ═══════════════════════════════════════
   Filter Bar
═══════════════════════════════════════ */
.nc-filter-bar {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--surface-radius);
  padding: 20px 24px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.nc-filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.nc-filter-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  min-width: 60px;
}

.nc-search-input {
  flex: 1;
  min-width: 180px;
}

.nc-search-input :deep(input) {
  height: 48px;
  font-size: 15px;
}

.nc-filter-select {
  width: 240px;
  min-width: 180px;
  flex-shrink: 0;
}

.nc-search-btn {
  flex-shrink: 0;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.nc-search-btn :deep(span) {
  color: #fff;
}

/* Date picker */
.nc-date-picker-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.nc-date-picker {
  width: 280px;
  min-width: 220px;
  max-width: 360px;
}

.nc-date-picker :deep(.date-input span) {
  font-size: 12px;
}

.nc-reset-wrap {
  flex-shrink: 0;
}

/* Keywords */
.nc-keyword-row {
  align-items: flex-start;
}

.nc-keyword-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
  background: var(--surface-alt);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.nc-keyword-chip:hover {
  border-color: var(--primary);
  color: #fff;
  background: var(--primary);
}

.nc-keyword-chip--active {
  color: #fff;
  background: var(--primary);
  border-color: var(--primary);
}

.nc-keyword-chip--active:hover {
  color: #fff;
  background: var(--primary);
  border-color: var(--primary);
  opacity: 0.85;
}

.nc-keyword-empty {
  font-size: 12px;
  color: var(--text-muted);
  padding: 4px 0;
}

.nc-keyword-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
  max-height: 32px;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.nc-keyword-list--expanded {
  max-height: 600px;
}

.nc-keyword-expand-btn {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--primary);
  white-space: nowrap;
}

/* ═══════════════════════════════════════
   Main content
═══════════════════════════════════════ */
.nc-main { min-width: 0; }

.nc-active-tags {
  display: flex; gap: 8px; flex-wrap: wrap;
  margin-bottom: 14px;
}

.nc-tag {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px; font-weight: 500;
  color: var(--primary);
  background: var(--primary-soft);
  border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent);
}
.nc-tag-x { cursor: pointer; opacity: 0.7; transition: opacity 0.15s; }
.nc-tag-x:hover { opacity: 1; }

.nc-news-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.nc-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  gap: 14px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

/* 顶部渐变装饰条 */
.nc-card-accent-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  opacity: 0;
  transition: opacity 0.2s ease;
}

.nc-card:hover .nc-card-accent-bar {
  opacity: 1;
}

.nc-card:hover {
  box-shadow: 0 8px 28px color-mix(in srgb, var(--primary) 10%, rgba(0,0,0,0.08));
  border-color: color-mix(in srgb, var(--primary) 30%, var(--border));
  transform: translateY(-2px);
}

.nc-card--link {
  cursor: pointer;
}

/* ── 置顶卡片 ── */
.nc-card-featured {
  grid-column: 1 / -1;
  padding: 0;
  gap: 0;
  flex-direction: row;
  min-height: 140px;
}

.nc-card-featured .nc-card-accent-bar {
  opacity: 1;
  height: 4px;
}

.nc-card-featured-inner {
  flex: 1;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.nc-featured-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* 来源徽章 */
.nc-source-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: all 0.15s ease;
}

.nc-source-badge--primary {
  background: color-mix(in srgb, var(--primary) 15%, transparent);
  color: var(--primary);
  border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
}
.nc-source-badge--success {
  background: color-mix(in srgb, var(--success) 15%, transparent);
  color: var(--success);
  border: 1px solid color-mix(in srgb, var(--success) 30%, transparent);
}
.nc-source-badge--warning {
  background: color-mix(in srgb, var(--warning) 15%, transparent);
  color: var(--warning);
  border: 1px solid color-mix(in srgb, var(--warning) 30%, transparent);
}
.nc-source-badge--error {
  background: color-mix(in srgb, var(--danger) 15%, transparent);
  color: var(--danger);
  border: 1px solid color-mix(in srgb, var(--danger) 30%, transparent);
}
.nc-source-badge--neutral {
  background: color-mix(in srgb, var(--text-muted) 12%, transparent);
  color: var(--text);
  border: 1px solid color-mix(in srgb, var(--text-muted) 25%, transparent);
}

.nc-featured-date { font-size: 13px; color: var(--text); font-weight: 500; }
.nc-featured-time { font-size: 12px; color: var(--text-muted); }

.nc-featured-title {
  font-size: 18px; font-weight: 700;
  color: var(--text-strong);
  line-height: 1.55; margin: 0;
}

.nc-featured-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* 关键词标签 */
.nc-featured-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.nc-keyword-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
  transition: all 0.15s ease;
}

.nc-keyword-tag--featured {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 10px;
}

.nc-keyword-tag:hover {
  background: color-mix(in srgb, var(--accent) 22%, transparent);
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
}

.nc-featured-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px; font-weight: 600;
  color: var(--primary);
  opacity: 0;
  transform: translateX(-6px);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.nc-card-featured:hover .nc-featured-link { opacity: 1; transform: translateX(0); }

.nc-featured-accent {
  width: 120px; min-width: 120px;
  display: flex; align-items: center; justify-content: center;
  color: var(--primary);
  opacity: 0.35;
  position: relative;
  z-index: 0;
}

.nc-featured-svg { width: 100px; height: 100px; }

/* ── 普通卡片 ── */
.nc-card-date-stamp {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 42px; min-width: 42px;
  padding-top: 4px;
}

.nc-stamp-mo {
  font-size: 10px; font-weight: 600;
  color: var(--text-muted);
  line-height: 1; margin-bottom: 2px;
}

.nc-stamp-day {
  font-size: 20px; font-weight: 800;
  color: var(--primary);
  font-family: var(--font-display);
  line-height: 0.9;
}

.nc-stamp-rel {
  margin-top: 4px;
  font-size: 9px; font-weight: 700;
  color: var(--surface);
  background: var(--primary);
  padding: 1px 5px;
  border-radius: 4px;
  line-height: 1.4;
}

.nc-card-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }

/* 卡片头部 - 来源 */
.nc-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nc-source-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 6px color-mix(in srgb, var(--primary) 40%, transparent);
  transition: box-shadow 0.15s ease;
}

.nc-card:hover .nc-source-dot {
  box-shadow: 0 0 10px color-mix(in srgb, var(--primary) 60%, transparent);
}

.nc-card-source {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: 0.01em;
}

.nc-card-jump {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding-top: 4px;
  flex-shrink: 0;
}

.nc-jump-icon {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  opacity: 0.3;
  transition: color 0.15s ease, opacity 0.15s ease, transform 0.15s ease;
}

.nc-card:hover .nc-jump-icon {
  color: var(--primary);
  opacity: 1;
  transform: translate(1px, -1px);
}

.nc-card-title {
  font-size: 14px; font-weight: 600;
  color: var(--text-strong);
  line-height: 1.5; margin: 0;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.15s ease;
}

.nc-card:hover .nc-card-title { color: var(--primary); }

/* 卡片底部 - 标签 + 时间 */
.nc-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
}

.nc-card-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.nc-card-time { color: var(--text-muted); flex-shrink: 0; }

/* ═══════════════════════════════════════
   Empty
═══════════════════════════════════════ */
.nc-empty {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--surface-radius);
  padding: 64px 24px;
  display: flex; flex-direction: column;
  align-items: center; gap: 10px;
}

.nc-empty-icon {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.nc-empty-title { font-size: 15px; font-weight: 600; color: var(--text-strong); margin: 0; }
.nc-empty-desc { font-size: 12px; color: var(--text-muted); margin: 0; }

.nc-pagination { display: flex; justify-content: center; align-items: center; gap: 12px; padding: 20px 0 8px; }

.nc-page-size-select { width: 100px; flex-shrink: 0; }

/* ═══════════════════════════════════════
   Transition
═══════════════════════════════════════ */
.nc-list-enter-active { transition: opacity 0.35s ease, transform 0.35s ease; }
.nc-list-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; position: absolute; }
.nc-list-enter-from { opacity: 0; transform: translateY(12px); }
.nc-list-leave-to { opacity: 0; transform: translateY(-6px); }
.nc-list-move { transition: transform 0.3s ease; }

/* ═══════════════════════════════════════
   Responsive
═══════════════════════════════════════ */
@media (max-width: 1024px) {
  .nc-filter-row { flex-direction: column; align-items: stretch; }
  .nc-filter-select { width: 100%; }
  .nc-date-picker-wrap { min-width: auto; }
  .nc-date-picker { max-width: none; }
  .nc-new-keyword { width: 100%; }
  .nc-new-kw-input { flex: 1; }
}

@media (max-width: 640px) {
  .nc-hero { padding: 20px 16px 14px; border-radius: 14px; }
  .nc-hero-masthead { flex-direction: column; gap: 16px; }
  .nc-hero-stats { width: 100%; justify-content: stretch; }
  .nc-stat-pill { flex: 1; }
  .nc-filter-bar { padding: 16px; }
  .nc-news-grid { grid-template-columns: 1fr; }
  .nc-card-featured-inner { padding: 18px 20px; }
  .nc-featured-accent { display: none; }
  .nc-featured-title { font-size: 16px; }
}
</style>

<style>
/* 全局：确保日期选择器面板不被遮挡 */
.dp__menu {
  z-index: 9999 !important;
}
.dp__input {
  cursor: pointer !important;
}
.dp__input_wrap {
  cursor: pointer !important;
}
.dp__instance_calendar {
  pointer-events: auto !important;
}
.dp__calendar_header {
  pointer-events: auto !important;
}
.dp__calendar_row {
  pointer-events: auto !important;
}
.dp__cell_inner {
  cursor: pointer !important;
  pointer-events: auto !important;
}

/* 来源下拉框文字完整显示 */
.nc-filter-select :deep([data-slot="content"]) {
  min-width: max-content !important;
}
</style>