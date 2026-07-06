<template>
  <div class="mm-root">
    <header class="mm-header">
      <div class="mm-brand">
        <span class="mm-brand-icon">M</span>
        <div>
          <h1 class="mm-title">会议 / 论坛监测</h1>
          <p class="mm-subtitle">AI · 智能制造 · 先进封装 相关活动资讯</p>
        </div>
      </div>
    </header>

    <section class="mm-filters">
      <div class="mm-filter-row">
        <div class="mm-date-group">
          <label class="mm-date-label">开始日期</label>
          <DatePicker
            v-model="startDate"
            placeholder="开始日期"
            class="mm-date"
          />
        </div>
        <div class="mm-date-separator">至</div>
        <div class="mm-date-group">
          <label class="mm-date-label">结束日期</label>
          <DatePicker
            v-model="endDate"
            placeholder="结束日期"
            class="mm-date"
          />
        </div>
        <UButton 
          color="primary" 
          icon="i-lucide-search" 
          size="md" 
          variant="solid"
          class="mm-btn-search"
          @click="handleSearch"
        >
          查询
        </UButton>
        <UButton
          v-if="hasDateFilter"
          color="neutral"
          variant="outline"
          icon="i-lucide-rotate-ccw"
          size="md"
          class="mm-btn-reset"
          @click="handleReset"
        >
          重置
        </UButton>
      </div>
    </section>

    <main class="mm-main">
      <div v-if="loading" class="mm-state">
        <UIcon name="i-lucide-loader-circle" class="mm-spin size-6" />
        <span>加载中...</span>
      </div>

      <div v-else-if="!items.length" class="mm-state mm-state--empty">
        <UIcon name="i-lucide-inbox" class="size-10 opacity-40" />
        <span>暂无监测数据</span>
      </div>

      <ul v-else class="mm-list">
        <li
          v-for="item in items"
          :key="item.id"
          class="mm-item"
          :class="{ 'mm-item--link': !!item.url }"
          @click="openItem(item)"
        >
          <div class="mm-item-date">
            <span class="mm-item-day">{{ formatDay(item.created_at) }}</span>
            <span class="mm-item-mon">{{ formatMonth(item.created_at) }}</span>
          </div>
          <div class="mm-item-body">
            <div class="mm-item-meta">
              <span v-if="item.event_type" class="mm-badge">{{ item.event_type }}</span>
              <span class="mm-source">{{ item.crawl_site_name || item.source || '未知来源' }}</span>
            </div>
            <h2 class="mm-item-title">{{ item.title }}</h2>
            <p v-if="item.summary" class="mm-item-summary">{{ item.summary }}</p>
          </div>
          <UIcon v-if="item.url" name="i-lucide-external-link" class="mm-item-link size-4" />
        </li>
      </ul>

      <div v-if="!loading && pagination.total > 0" class="mm-list-footer">
        <span class="mm-total">
          共 {{ pagination.total }} 条
          <template v-if="totalPages > 1"> · 第 {{ currentPage }}/{{ totalPages }} 页</template>
        </span>
        <div class="mm-pagination">
          <USelectMenu
            v-model="pageSize"
            :items="pageSizeOptions"
            value-key="value"
            size="xs"
            class="mm-page-size"
            @update:model-value="onPageSizeChange"
          />
          <UPagination
            v-model:page="currentPage"
            :items-per-page="pageSize"
            :total="pagination.total"
            :show-edges="true"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { newsRequest } from '~/utils/request'

definePageMeta({ layout: 'blank' })

interface MeetingItem {
  id: number
  title: string
  summary: string
  url: string
  source: string
  created_at: string
  event_type: string
  crawl_site_name: string
}

function getTodayStr(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const todayStr = getTodayStr()
const startDate = ref<string>(todayStr)
const endDate = ref<string>(todayStr)
const appliedStartDate = ref<string>(todayStr)
const appliedEndDate = ref<string>(todayStr)

const items = ref<MeetingItem[]>([])
const loading = ref(false)
const pageReady = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const pageSizeOptions = [
  { label: '20 条/页', value: 20 },
  { label: '30 条/页', value: 30 },
  { label: '50 条/页', value: 50 },
]
const pagination = ref({ page: 1, page_size: 20, total: 0, total_pages: 0 })

const totalPages = computed(() => {
  const total = pagination.value.total
  if (!total) return 1
  return Math.max(1, Math.ceil(total / pageSize.value))
})

const hasDateFilter = computed(() =>
  appliedStartDate.value !== todayStr
  || appliedEndDate.value !== todayStr,
)

function mapItem(raw: Record<string, unknown>): MeetingItem {
  return {
    id: Number(raw.id),
    title: String(raw.title || ''),
    summary: String(raw.summary || ''),
    url: String(raw.url || ''),
    source: String(raw.source || ''),
    created_at: String(raw.created_at || ''),
    event_type: String(raw.event_type || ''),
    crawl_site_name: String(raw.crawl_site_name || ''),
  }
}

function formatDay(dateStr: string) {
  if (!dateStr) return '--'
  return dateStr.slice(8, 10)
}

function formatMonth(dateStr: string) {
  if (!dateStr) return ''
  const [, m] = dateStr.split('-')
  return m ? `${Number(m)}月` : ''
}

function openItem(item: MeetingItem) {
  if (!item.url) return
  window.open(item.url, '_blank', 'noopener,noreferrer')
}

async function fetchItems() {
  loading.value = true
  try {
    const params: Record<string, string | number> = {
      page: currentPage.value,
      page_size: pageSize.value,
      sort_by: 'created_at',
      sort_order: 'desc',
    }
    if (appliedStartDate.value) params.start_date = appliedStartDate.value
    if (appliedEndDate.value) params.end_date = appliedEndDate.value

    const res = await newsRequest.get('/meeting/list', { params })
    if (res.data?.code === 0) {
      const data = res.data.data
      items.value = (data.items || []).map(mapItem)
      const pg = data.pagination
      if (pg) {
        pagination.value = {
          page: Number(pg.page) || currentPage.value,
          page_size: Number(pg.page_size) || pageSize.value,
          total: Number(pg.total) || 0,
          total_pages: Number(pg.total_pages) || 0,
        }
        if (pg.page_size) pageSize.value = Number(pg.page_size)
      }
    }
  } catch (e) {
    console.error('获取会议列表失败:', e)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  appliedStartDate.value = startDate.value
  appliedEndDate.value = endDate.value
  currentPage.value = 1
  fetchItems()
}

function handleReset() {
  startDate.value = todayStr
  endDate.value = todayStr
  appliedStartDate.value = todayStr
  appliedEndDate.value = todayStr
  currentPage.value = 1
  fetchItems()
}

function onPageSizeChange() {
  currentPage.value = 1
  fetchItems()
}

watch(currentPage, () => {
  if (pageReady.value) fetchItems()
})

onMounted(async () => {
  await fetchItems()
  pageReady.value = true
})
</script>

<style scoped>
.mm-root {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f4ff 0%, #f8fafc 240px, #f1f5f9 100%);
  color: #0f172a;
}

.mm-header {
  padding: 28px 32px 20px;
  max-width: 1100px;
  margin: 0 auto;
}

.mm-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.mm-brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff;
  font-weight: 700;
  font-size: 18px;
}

.mm-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.mm-subtitle {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: #64748b;
}

.mm-filters {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 32px 16px;
}

.mm-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.mm-date-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mm-date-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #475569;
  white-space: nowrap;
}

.mm-date {
  width: 160px;
}

.mm-date-separator {
  display: flex;
  align-items: center;
  padding-bottom: 2px;
  color: #64748b;
  font-size: 0.875rem;
  height: 40px;
}

.mm-btn-search {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  letter-spacing: 0.025em;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
  transition: all 0.2s ease;
}

.mm-btn-search:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
  transform: translateY(-1px);
}

.mm-btn-reset {
  font-weight: 500 !important;
  transition: all 0.2s ease;
}

.mm-btn-reset:hover {
  background: #f1f5f9 !important;
  border-color: #94a3b8 !important;
}

.mm-main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 8px 32px 48px;
}

.mm-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 0;
  color: #64748b;
}

.mm-state--empty {
  opacity: 0.8;
}

.mm-spin {
  animation: mm-spin 0.8s linear infinite;
}

@keyframes mm-spin {
  to { transform: rotate(360deg); }
}

.mm-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mm-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 18px 20px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgb(15 23 42 / 4%);
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}

.mm-item--link {
  cursor: pointer;
}

.mm-item--link:hover {
  border-color: #93c5fd;
  box-shadow: 0 4px 16px rgb(37 99 235 / 10%);
  transform: translateY(-1px);
}

.mm-item-date {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 52px;
  padding: 8px 0;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
}

.mm-item-day {
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1;
}

.mm-item-mon {
  margin-top: 2px;
  font-size: 0.75rem;
}

.mm-item-body {
  flex: 1;
  min-width: 0;
}

.mm-item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
  font-size: 0.8125rem;
  color: #64748b;
}

.mm-badge {
  padding: 2px 8px;
  border-radius: 6px;
  background: #ede9fe;
  color: #6d28d9;
  font-weight: 500;
}

.mm-source {
  font-weight: 500;
  color: #475569;
}

.mm-item-title {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.45;
  color: #0f172a;
}

.mm-item-summary {
  margin: 8px 0 0;
  font-size: 0.875rem;
  line-height: 1.55;
  color: #64748b;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mm-item-link {
  flex-shrink: 0;
  margin-top: 4px;
  color: #94a3b8;
}

.mm-item--link:hover .mm-item-link {
  color: #2563eb;
}

.mm-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.mm-list-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 28px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
}

.mm-total {
  font-size: 0.875rem;
  color: #64748b;
}

.mm-page-size {
  min-width: 108px;
}

@media (max-width: 768px) {
  .mm-header,
  .mm-filters,
  .mm-main {
    padding-left: 16px;
    padding-right: 16px;
  }

  .mm-item {
    flex-direction: column;
  }

  .mm-item-date {
    flex-direction: row;
    width: auto;
    gap: 6px;
    padding: 6px 12px;
  }
}
</style>
