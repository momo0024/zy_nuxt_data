<template>
  <div class="nc-root">
    <!-- ── 顶栏：标题 + 搜索 ── -->
    <header class="nc-hero">
      <div class="nc-hero-masthead">
        <div class="nc-brand">
          <span class="nc-brand-symbol">N</span>
          <div class="nc-brand-text">
            <h1 class="nc-brand-title">新闻中心</h1>
            <p class="nc-brand-sub">财经资讯聚合 · 智能检索</p>
          </div>
        </div>
        <div class="nc-hero-stats">
          <div class="nc-stat-pill" v-for="s in heroStats" :key="s.label">
            <span class="nc-stat-val">{{ s.value }}</span>
            <span class="nc-stat-lbl">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <!-- 搜索栏 -->
      <div class="nc-search-bar">
        <UIcon name="i-lucide-search" class="nc-search-icon" />
        <input
          v-model="filters.keyword"
          class="nc-search-input"
          placeholder="输入标题、关键词或内容搜索新闻..."
          @keyup.enter="handleSearch"
        />
        <Transition name="nc-fade">
          <button v-if="filters.keyword" class="nc-search-clear" @click="filters.keyword = ''">
            <UIcon name="i-lucide-x" class="size-4" />
          </button>
        </Transition>
      </div>

      <!-- 快捷来源 filters -->
      <div class="nc-source-ribbon">
        <button
          class="nc-source-chip"
          :class="{ active: filters.source === 'all' }"
          @click="filters.source = 'all'"
        >全部</button>
        <button
          v-for="src in topSources"
          :key="src"
          class="nc-source-chip"
          :class="{ active: filters.source === src }"
          @click="filters.source = filters.source === src ? 'all' : src"
        >{{ src }}</button>
      </div>
    </header>

    <!-- ── 主内容 ── -->
    <div class="nc-body">
      <!-- 左侧：分类 + 日期 -->
      <aside class="nc-sidebar">
        <div class="nc-side-section">
          <div class="nc-side-label">新闻分类</div>
          <div class="nc-cat-list">
            <button
              v-for="cat in categoryList"
              :key="cat"
              class="nc-cat-btn"
              :class="{ active: filters.category === cat }"
              @click="filters.category = filters.category === cat ? '' : cat"
            >
              <span class="nc-cat-dot" :style="{ '--cat-color': catColors[cat] || 'var(--primary)' }" />
              <span>{{ cat }}</span>
              <span class="nc-cat-count">{{ catCounts[cat] || 0 }}</span>
            </button>
          </div>
        </div>

        <div class="nc-side-section">
          <div class="nc-side-label">日期筛选</div>
          <div class="nc-date-fields">
            <div class="nc-date-field">
              <span class="nc-date-field-label">起</span>
              <input v-model="filters.startDate" type="date" class="nc-date-input" />
            </div>
            <div class="nc-date-field">
              <span class="nc-date-field-label">止</span>
              <input v-model="filters.endDate" type="date" class="nc-date-input" />
            </div>
          </div>
        </div>

        <div class="nc-side-section">
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-lucide-rotate-ccw"
            class="nc-reset-btn"
            @click="handleReset"
          >
            重置筛选
          </UButton>
        </div>
      </aside>

      <!-- 右侧：新闻列表 -->
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
        <transition-group v-if="filteredNews.length" name="nc-list" tag="div" class="nc-news-grid">
          <!-- 第一条：featured 大卡片 -->
          <div
            v-if="pagedNews.length > 0"
            :key="pagedNews[0].id"
            class="nc-card nc-card-featured"
          >
            <div class="nc-card-featured-inner">
              <div class="nc-featured-meta">
                <UBadge :label="pagedNews[0].source" :color="getSourceColor(pagedNews[0].source)" variant="soft" size="sm" />
                <span class="nc-featured-date">{{ pagedNews[0].month }}{{ pagedNews[0].day }}日 {{ pagedNews[0].time }}</span>
              </div>
              <h2 class="nc-featured-title">{{ pagedNews[0].title }}</h2>
              <div class="nc-featured-footer">
                <span class="nc-featured-cat">{{ pagedNews[0].category }}</span>
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

          <!-- 其余卡片：双列 -->
          <div
            v-for="item in pagedNews.slice(1)"
            :key="item.id"
            class="nc-card"
          >
            <div class="nc-card-date-stamp">
              <span class="nc-stamp-day">{{ item.day }}</span>
              <span class="nc-stamp-mo">{{ item.month.slice(0, -1) }}</span>
            </div>
            <div class="nc-card-body">
              <h3 class="nc-card-title">{{ item.title }}</h3>
              <div class="nc-card-meta">
                <span class="nc-card-source" :style="{ color: sourceTextColors[item.source] || 'var(--text-muted)' }">
                  {{ item.source }}
                </span>
                <span class="nc-card-time">{{ item.time }}</span>
                <span class="nc-card-cat">{{ item.category }}</span>
              </div>
            </div>
          </div>
        </transition-group>

        <!-- 空状态 -->
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

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="nc-pagination">
          <UPagination
            v-model:page="currentPage"
            :items-per-page="pageSize"
            :total="filteredNews.length"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

definePageMeta({ middleware: 'auth', keepalive: true })

/* ── 类型 ── */
interface NewsItem {
  id: string
  title: string
  source: string
  date: string
  time: string
  category: string
}

interface FilterState {
  keyword: string
  startDate: string
  endDate: string
  source: string
  category: string
}

/* ── 数据 ── */
const NEWS_DATA: NewsItem[] = [
  { id: 'n001', title: '头部券商一季度业绩全面回暖，投行业务同比增长38%', source: '证券时报', date: '2026-05-09', time: '09:30', category: '财经' },
  { id: 'n002', title: '新能源汽车出口再创新高，供应链竞争力显著提升', source: '经济日报', date: '2026-05-08', time: '14:15', category: '产业' },
  { id: 'n003', title: '跨境电商平台Q1营收超预期，东南亚市场持续放量', source: '财经周报', date: '2026-05-07', time: '11:20', category: '商业' },
  { id: 'n004', title: '央行发布金融稳定报告，强调防范系统性风险', source: '中国证券报', date: '2026-05-09', time: '16:45', category: '政策' },
  { id: 'n005', title: '半导体行业周期调整接近尾声，去库存符合预期', source: '电子工程专辑', date: '2026-05-08', time: '10:00', category: '科技' },
  { id: 'n006', title: '多家银行调整存款利率，市场预期逐步修复', source: '金融时报', date: '2026-05-07', time: '08:30', category: '金融' },
  { id: 'n007', title: '部分中小房企资金链紧张，债务重组进入关键期', source: '21世纪经济报道', date: '2026-05-09', time: '13:20', category: '地产' },
  { id: 'n008', title: '消费贷不良率小幅上升，金融机构风控压力增加', source: '银行家', date: '2026-05-08', time: '15:40', category: '金融' },
  { id: 'n009', title: '出口订单环比下滑，部分出口企业面临承压', source: '贸易观察', date: '2026-05-06', time: '09:10', category: '贸易' },
  { id: 'n010', title: 'AI大模型商业化落地加速，垂直领域应用爆发', source: '科技日报', date: '2026-05-09', time: '11:00', category: '科技' },
  { id: 'n011', title: '医药集采扩围至中成药领域，行业格局面临重塑', source: '健康报', date: '2026-05-08', time: '16:00', category: '医药' },
  { id: 'n012', title: '光伏产业链价格企稳，二季度排产环比提升', source: '能源杂志', date: '2026-05-07', time: '14:30', category: '能源' },
  { id: 'n013', title: '智能制造专项政策出台，工业机器人迎发展良机', source: '中国制造', date: '2026-05-06', time: '10:20', category: '制造' },
  { id: 'n014', title: '消费电子需求回暖，智能手机出货量环比回升', source: '通信世界', date: '2026-05-09', time: '08:45', category: '电子' },
  { id: 'n015', title: '碳交易市场扩容在即，水泥钢铁纳入控排范围', source: '环境经济', date: '2026-05-08', time: '13:50', category: '环保' },
  { id: 'n016', title: '跨境电商综试区扩容，新政策利好出口企业', source: '经济日报', date: '2026-05-07', time: '09:30', category: '贸易' },
  { id: 'n017', title: '科创板迎来五周年，注册制改革成效显著', source: '证券时报', date: '2026-05-06', time: '11:15', category: '财经' },
  { id: 'n018', title: '工业互联网平台连接设备突破千万台', source: '科技日报', date: '2026-05-09', time: '15:20', category: '科技' },
  { id: 'n019', title: '绿色债券发行规模创新高，ESG投资持续升温', source: '金融时报', date: '2026-05-08', time: '10:45', category: '金融' },
  { id: 'n020', title: '智慧城市建设提速，数字孪生技术应用落地', source: '通信世界', date: '2026-05-07', time: '14:00', category: '科技' },
  { id: 'n021', title: '新能源汽车下乡活动启动，三四线城市渗透率提升', source: '经济日报', date: '2026-05-06', time: '08:20', category: '产业' },
  { id: 'n022', title: '养老保险全国统筹稳步推进，基金调剂规模扩大', source: '中国证券报', date: '2026-05-09', time: '16:10', category: '政策' },
  { id: 'n023', title: '生物医药产业创新加速，多个创新药获批上市', source: '健康报', date: '2026-05-08', time: '11:30', category: '医药' },
  { id: 'n024', title: '储能产业迎来爆发期，新型储能装机规模翻倍', source: '能源杂志', date: '2026-05-07', time: '13:40', category: '能源' },
]

const categoryList = computed(() => {
  const cats = Array.from(new Set(NEWS_DATA.map(n => n.category)))
  return cats.sort()
})

const catCounts = computed(() => {
  const counts: Record<string, number> = {}
  NEWS_DATA.forEach(n => {
    counts[n.category] = (counts[n.category] || 0) + 1
  })
  return counts
})

const catColors: Record<string, string> = {
  '财经': '#d97706', '科技': '#0891b2', '金融': '#6366f1',
  '产业': '#16a34a', '政策': '#dc2626', '地产': '#a855f7',
  '贸易': '#2563eb', '医药': '#db2777', '能源': '#d97706',
  '制造': '#52525b', '电子': '#0891b2', '环保': '#16a34a',
  '商业': '#d97706',
}

const sourceTextColors: Record<string, string> = {
  '证券时报': '#d97706', '经济日报': '#16a34a', '财经周报': '#d97706',
  '中国证券报': '#d97706', '电子工程专辑': '#52525b', '金融时报': '#6366f1',
  '21世纪经济报道': '#dc2626', '银行家': '#6366f1', '贸易观察': '#2563eb',
  '科技日报': '#0891b2', '健康报': '#db2777', '能源杂志': '#d97706',
  '中国制造': '#52525b', '通信世界': '#0891b2', '环境经济': '#16a34a',
}

const ALL_SOURCES = Array.from(new Set(NEWS_DATA.map(n => n.source)))

const sourceBadgeColors: Record<string, string> = {
  '证券时报': 'warning', '经济日报': 'success', '财经周报': 'warning',
  '中国证券报': 'warning', '电子工程专辑': 'neutral', '金融时报': 'primary',
  '21世纪经济报道': 'error', '银行家': 'primary', '贸易观察': 'primary',
  '科技日报': 'success', '健康报': 'error', '能源杂志': 'warning',
  '中国制造': 'neutral', '通信世界': 'success', '环境经济': 'success',
}

const topSources = ALL_SOURCES.slice(0, 6)

/* ── 状态 ── */
const filters = reactive<FilterState>({
  keyword: '', startDate: '', endDate: '', source: 'all', category: '',
})

const pageSize = 9
const currentPage = ref(1)

/* ── Hero 统计 ── */
const heroStats = computed(() => {
  const todayItems = NEWS_DATA.filter(n => n.date === '2026-05-09')
  return [
    { label: '今日更新', value: todayItems.length },
    { label: '新闻总数', value: NEWS_DATA.length },
    { label: '覆盖来源', value: ALL_SOURCES.length },
  ]
})

/* ── 筛选 ── */
const filteredNews = computed(() => {
  let result = [...NEWS_DATA]
  const kw = filters.keyword.trim().toLowerCase()
  if (kw) {
    result = result.filter(n =>
      n.title.toLowerCase().includes(kw) || n.source.toLowerCase().includes(kw) || n.category.toLowerCase().includes(kw)
    )
  }
  if (filters.startDate) result = result.filter(n => n.date >= filters.startDate)
  if (filters.endDate) result = result.filter(n => n.date <= filters.endDate)
  if (filters.source && filters.source !== 'all') result = result.filter(n => n.source === filters.source)
  if (filters.category) result = result.filter(n => n.category === filters.category)
  result.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
  return result
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredNews.value.length / pageSize)))

const pagedNews = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredNews.value.slice(start, start + pageSize).map(item => {
    const [, m, d] = item.date.split('-')
    return { ...item, month: `${m}月`, day: d }
  })
})

const activeFilters = computed(() => {
  const t: Array<{ key: string; label: string; onRemove: () => void }> = []
  if (filters.keyword.trim()) {
    t.push({ key: 'kw', label: `"${filters.keyword.trim()}"`, onRemove: () => { filters.keyword = '' } })
  }
  if (filters.category) {
    t.push({ key: 'cat', label: filters.category, onRemove: () => { filters.category = '' } })
  }
  if (filters.source !== 'all') {
    t.push({ key: 'src', label: filters.source, onRemove: () => { filters.source = 'all' } })
  }
  if (filters.startDate) {
    t.push({ key: 'sd', label: `≥${filters.startDate}`, onRemove: () => { filters.startDate = '' } })
  }
  if (filters.endDate) {
    t.push({ key: 'ed', label: `≤${filters.endDate}`, onRemove: () => { filters.endDate = '' } })
  }
  return t
})

/* ── 方法 ── */
function getSourceColor(s: string): string { return sourceBadgeColors[s] || 'neutral' }
function handleSearch() { currentPage.value = 1 }
function handleReset() {
  filters.keyword = ''; filters.startDate = ''; filters.endDate = ''
  filters.source = 'all'; filters.category = ''
  currentPage.value = 1
}

/* ── 监听 ── */
watch(() => filters.keyword, () => { currentPage.value = 1 })
watch(() => filters.source, () => { currentPage.value = 1 })
watch(() => filters.category, () => { currentPage.value = 1 })
watch(() => filters.startDate, () => { currentPage.value = 1 })
watch(() => filters.endDate, () => { currentPage.value = 1 })
</script>

<style scoped>
/* ═══════════════════════════════════════
   Root
═══════════════════════════════════════ */
.nc-root { display: flex; flex-direction: column; gap: 0; }

/* ═══════════════════════════════════════
   Hero
═══════════════════════════════════════ */
.nc-hero {
  background: linear-gradient(165deg, var(--surface) 0%, color-mix(in srgb, var(--primary-soft) 68%, var(--surface)) 100%);
  border: 1px solid var(--border);
  border-radius: var(--surface-radius);
  padding: 28px 28px 18px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.nc-hero::after {
  content: '';
  position: absolute;
  top: -40px; right: -40px;
  width: 180px; height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--primary) 6%, transparent) 0%, transparent 70%);
  pointer-events: none;
}

.nc-hero-masthead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  z-index: 1;
  margin-bottom: 22px;
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

/* Stats pills */
.nc-hero-stats {
  display: flex;
  gap: 12px;
}

.nc-stat-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 10px 16px;
  background: color-mix(in srgb, var(--surface) 80%, transparent);
  border: 1px solid var(--border);
  border-radius: 12px;
  min-width: 68px;
}

.nc-stat-val {
  font-size: 20px; font-weight: 800;
  color: var(--primary);
  font-family: var(--font-display);
  line-height: 1;
}

.nc-stat-lbl {
  font-size: 10px; color: var(--text-muted);
  letter-spacing: 0.04em;
}

/* Search bar */
.nc-search-bar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.nc-search-icon {
  position: absolute;
  left: 16px; top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  z-index: 2;
  pointer-events: none;
}

.nc-search-input {
  width: 100%;
  height: 48px;
  padding: 0 48px 0 44px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  color: var(--text-strong);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.22s ease, box-shadow 0.22s ease;
}

.nc-search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 10%, transparent);
}

.nc-search-input::placeholder { color: var(--text-muted); }

.nc-search-clear {
  position: absolute;
  right: 12px; top: 50%;
  transform: translateY(-50%);
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
  z-index: 2;
}
.nc-search-clear:hover { color: var(--text-strong); background: var(--border); }

/* Source ribbon */
.nc-source-ribbon {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.nc-source-chip {
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
  font-family: inherit;
}
.nc-source-chip:hover { border-color: var(--primary); color: var(--primary); }
.nc-source-chip.active {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 600;
}

/* ═══════════════════════════════════════
   Body: sidebar + main
═══════════════════════════════════════ */
.nc-body { display: flex; gap: 20px; align-items: flex-start; }

/* ═══════════════════════════════════════
   Sidebar
═══════════════════════════════════════ */
.nc-sidebar {
  width: 200px; min-width: 200px;
  display: flex; flex-direction: column; gap: 16px;
  position: sticky; top: 0;
}

.nc-side-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
}

.nc-side-label {
  font-size: 10px; font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
}

.nc-cat-list { display: flex; flex-direction: column; gap: 2px; }

.nc-cat-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}
.nc-cat-btn:hover { background: var(--surface-alt); }
.nc-cat-btn.active { background: var(--primary-soft); color: var(--primary); font-weight: 600; }

.nc-cat-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--cat-color);
  flex-shrink: 0;
}

.nc-cat-count {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-display);
}

/* Date fields */
.nc-date-fields { display: flex; flex-direction: column; gap: 8px; }

.nc-date-field {
  display: flex; align-items: center; gap: 8px;
}

.nc-date-field-label {
  font-size: 11px; font-weight: 600;
  color: var(--text-muted);
  min-width: 16px;
}

.nc-date-input {
  flex: 1;
  height: 34px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface-alt);
  color: var(--text-strong);
  font-size: 12px;
  font-family: inherit;
  outline: none;
}
.nc-date-input:focus { border-color: var(--primary); }

.nc-reset-btn { width: 100%; justify-content: center; }

/* ═══════════════════════════════════════
   Main content
═══════════════════════════════════════ */
.nc-main { flex: 1; min-width: 0; }

/* Active filter tags */
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

/* News grid */
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

.nc-card:hover {
  box-shadow: 0 8px 28px color-mix(in srgb, var(--primary) 10%, rgba(0,0,0,0.08));
  border-color: color-mix(in srgb, var(--primary) 30%, var(--border));
  transform: translateY(-2px);
}

/* Featured card: full width */
.nc-card-featured {
  grid-column: 1 / -1;
  padding: 0;
  gap: 0;
  flex-direction: row;
  min-height: 140px;
}

.nc-card-featured-inner {
  flex: 1;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
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

.nc-featured-date {
  font-size: 12px;
  color: var(--text-muted);
}

.nc-featured-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-strong);
  line-height: 1.55;
  margin: 0;
}

.nc-featured-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nc-featured-cat {
  font-size: 12px;
  color: var(--text-muted);
}

.nc-featured-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  opacity: 0;
  transform: translateX(-6px);
  transition: all 0.2s ease;
}

.nc-card-featured:hover .nc-featured-link {
  opacity: 1;
  transform: translateX(0);
}

.nc-featured-accent {
  width: 120px; min-width: 120px;
  display: flex; align-items: center; justify-content: center;
  color: var(--primary);
  opacity: 0.35;
  position: relative;
  z-index: 0;
}

.nc-featured-svg {
  width: 100px; height: 100px;
}

/* Regular card date stamp */
.nc-card-date-stamp {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 38px; min-width: 38px;
  padding-top: 4px;
}

.nc-stamp-day {
  font-size: 20px; font-weight: 800;
  color: var(--primary);
  font-family: var(--font-display);
  line-height: 0.9;
}

.nc-stamp-mo {
  font-size: 9px; font-weight: 600;
  color: var(--text-muted);
  margin-top: 3px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Regular card body */
.nc-card-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }

.nc-card-title {
  font-size: 14px; font-weight: 600;
  color: var(--text-strong);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.15s ease;
}

.nc-card:hover .nc-card-title { color: var(--primary); }

.nc-card-meta {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  font-size: 11px;
}

.nc-card-source { font-weight: 600; }

.nc-card-time { color: var(--text-muted); }

.nc-card-cat {
  color: var(--text-muted); font-size: 11px;
}

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

/* ═══════════════════════════════════════
   Pagination
═══════════════════════════════════════ */
.nc-pagination { display: flex; justify-content: center; padding: 20px 0 8px; }

/* ═══════════════════════════════════════
   Transition
═══════════════════════════════════════ */
.nc-list-enter-active { transition: opacity 0.35s ease, transform 0.35s ease; }
.nc-list-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; position: absolute; }
.nc-list-enter-from { opacity: 0; transform: translateY(12px); }
.nc-list-leave-to { opacity: 0; transform: translateY(-6px); }
.nc-list-move { transition: transform 0.3s ease; }

.nc-fade-enter-active, .nc-fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.nc-fade-enter-from, .nc-fade-leave-to { opacity: 0; transform: scale(0.8); }

/* ═══════════════════════════════════════
   Responsive
═══════════════════════════════════════ */
@media (max-width: 1024px) {
  .nc-body { flex-direction: column; }
  .nc-sidebar {
    width: 100%; min-width: unset;
    flex-direction: row; gap: 12px;
    position: static; flex-wrap: wrap;
  }
  .nc-side-section { flex: 1 1 auto; padding: 14px; }
  .nc-cat-list { flex-direction: row; flex-wrap: wrap; gap: 4px; }
  .nc-cat-btn { padding: 5px 10px; border-radius: 999px; font-size: 12px; }
  .nc-cat-count { display: none; }
  .nc-date-fields { flex-direction: row; }
}

@media (max-width: 640px) {
  .nc-hero { padding: 20px 16px 14px; border-radius: 14px; }
  .nc-hero-masthead { flex-direction: column; gap: 16px; }
  .nc-hero-stats { width: 100%; justify-content: stretch; }
  .nc-stat-pill { flex: 1; }
  .nc-news-grid { grid-template-columns: 1fr; }
  .nc-card-featured-inner { padding: 18px 20px; }
  .nc-featured-accent { display: none; }
  .nc-featured-title { font-size: 16px; }
  .nc-search-input { height: 44px; font-size: 13px; }
}
</style>