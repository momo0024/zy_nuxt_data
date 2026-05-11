<template>
  <div>
    <!-- 搜索区 -->
    <div class="card search-section">
      <div class="search-row">
        <div class="search-wrapper flex-1">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input
            v-model="searchText"
            class="form-input"
            style="padding-left: 38px; height: 42px; font-size: 14px;"
            placeholder="输入关键词检索知识库..."
            @keydown.enter="doSearch"
          />
          <button v-if="searchText" class="clear-btn" @click="searchText = ''; doSearch()">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <button class="btn btn-primary" style="height: 42px; padding: 0 24px;" @click="doSearch">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10 10l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          开始检索
        </button>
      </div>
      <!-- 分类筛选 -->
      <div class="category-chips">
        <button
          class="chip"
          :class="{ active: activeCategory === 'all' }"
          @click="setCategory('all')"
        >全部类型</button>
        <button
          v-for="cat in allowedCats"
          :key="cat.key"
          class="chip"
          :class="{ active: activeCategory === cat.key }"
          @click="setCategory(cat.key)"
        >
          {{ cat.name }}
        </button>
      </div>
    </div>

    <!-- 结果区 -->
    <div v-if="hasSearched">
      <!-- 统计栏 -->
      <div class="result-meta">
        <span>共找到 <strong>{{ filteredDocs.length }}</strong> 条结果</span>
        <span v-if="filteredDocs.length > 0">
          展示 {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredDocs.length) }} 条
        </span>
      </div>

      <!-- 无结果 -->
      <div v-if="filteredDocs.length === 0" class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 48 48" fill="none">
          <circle cx="21" cy="21" r="14" stroke="currentColor" stroke-width="2"/>
          <path d="M30 30l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M16 21h10M21 16v10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <div class="empty-state-text">未找到匹配的文档<br>尝试更换关键词或调整分类筛选</div>
      </div>

      <!-- 结果列表 -->
      <div class="result-list">
        <div
          v-for="(doc, idx) in pagedDocs"
          :key="doc.id"
          class="result-card card card-hover"
          @click="openPreview(doc)"
        >
          <!-- Top 标识 -->
          <div v-if="globalIdx(idx) < 3" class="top-badge" :class="`top-${globalIdx(idx)+1}`">
            Top {{ globalIdx(idx) + 1 }}
          </div>

          <div class="result-card-body">
            <div class="result-left">
              <div class="result-title">{{ doc.title }}</div>
              <div class="result-meta-row">
                <span class="badge badge-primary" style="font-size:10px">{{ doc.categoryName }}</span>
                <span class="result-sep">·</span>
                <span class="result-source">{{ doc.source }}</span>
                <span class="result-sep">·</span>
                <span class="result-kb">{{ doc.kbName }}</span>
                <span class="result-sep">·</span>
                <span class="result-date">{{ doc.updatedAt }}</span>
              </div>
              <div class="result-summary">{{ doc.summary }}</div>
              <div class="result-tags">
                <span v-for="tag in doc.tags" :key="tag" class="badge badge-outline" style="font-size:10px">{{ tag }}</span>
              </div>
            </div>
            <div class="result-right" @click.stop>
              <div class="result-score">
                <div class="score-num">{{ (doc.score * 100).toFixed(0) }}</div>
                <div class="score-label">相关度</div>
              </div>
              <div class="result-actions">
                <button class="btn btn-outline btn-sm" @click.stop="openPreview(doc)">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M1 6.5C1 6.5 3 2 6.5 2S12 6.5 12 6.5 10 11 6.5 11 1 6.5 1 6.5z" stroke="currentColor" stroke-width="1.3"/>
                    <circle cx="6.5" cy="6.5" r="2" stroke="currentColor" stroke-width="1.3"/>
                  </svg>
                  预览
                </button>
                <button class="btn btn-ghost btn-sm" @click.stop="downloadDoc(doc)">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M6.5 1v8M3 6l3.5 3.5L10 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                    <path d="M1 11h11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                  </svg>
                  下载
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination-row">
        <div class="pagination">
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage = 1">«</button>
          <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">‹</button>
          <button
            v-for="p in pageRange"
            :key="p"
            class="page-btn"
            :class="{ active: p === currentPage }"
            @click="currentPage = p"
          >{{ p }}</button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">›</button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages">»</button>
        </div>
      </div>
    </div>

    <!-- 初始提示 -->
    <div v-else class="empty-state" style="margin-top: 48px">
      <svg class="empty-state-icon" viewBox="0 0 48 48" fill="none">
        <circle cx="21" cy="21" r="14" stroke="currentColor" stroke-width="2"/>
        <path d="M30 30l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <div class="empty-state-text">在上方输入关键词开始检索知识库</div>
    </div>

    <!-- 预览 Modal -->
    <Teleport to="body">
      <Transition name="fade-in">
        <div v-if="previewDoc" class="preview-modal" @click.self="previewDoc = null">
          <div class="preview-panel card animate-fade-in">
            <div class="preview-header">
              <div>
                <div class="preview-title">{{ previewDoc.title }}</div>
                <div class="preview-meta">
                  <span class="badge badge-primary">{{ previewDoc.categoryName }}</span>
                  <span>{{ previewDoc.source }}</span>
                  <span>{{ previewDoc.updatedAt }}</span>
                </div>
              </div>
              <button class="btn btn-ghost btn-icon" @click="previewDoc = null">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <div class="preview-body">
              <p style="line-height: 1.8; font-size: 13px; color: var(--text)">{{ previewDoc.summary }}</p>
              <br>
              <p style="font-size: 12px; color: var(--text-muted)">
                本文档来自 {{ previewDoc.kbName }}，知识类型为 {{ previewDoc.categoryName }}。全文内容由智知云知识中台索引管理，相关度分数：{{ (previewDoc.score * 100).toFixed(0) }}。
              </p>
              <div class="preview-tags">
                <span v-for="tag in previewDoc.tags" :key="tag" class="badge badge-outline">{{ tag }}</span>
              </div>
            </div>
            <div class="preview-footer">
              <button class="btn btn-outline btn-sm" @click="downloadDoc(previewDoc!)">
                下载文档
              </button>
              <button class="btn btn-ghost btn-sm" @click="previewDoc = null">关闭</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES, RETRIEVE_DOCS } from '~/data/mock'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const route = useRoute()

const allowedCategories = computed(() => authStore.user?.allowedCategories || [])
const allowedCats = computed(() => CATEGORIES.filter(c => allowedCategories.value.includes(c.key)))

const searchText = ref('')
const activeCategory = ref('all')
const hasSearched = ref(false)
const currentPage = ref(1)
const pageSize = 20
const previewDoc = ref<(typeof RETRIEVE_DOCS)[0] | null>(null)

// 从路由参数读取分类
onMounted(() => {
  if (route.query.category) {
    activeCategory.value = route.query.category as string
    doSearch()
  }
})

function setCategory(key: string) {
  activeCategory.value = key
  if (hasSearched.value) doSearch()
}

const filteredDocs = ref<typeof RETRIEVE_DOCS>([])

function doSearch() {
  hasSearched.value = true
  currentPage.value = 1

  const keywords = searchText.value.trim().toLowerCase().split(/\s+/).filter(Boolean)

  filteredDocs.value = RETRIEVE_DOCS.filter(doc => {
    // 权限过滤
    if (!allowedCategories.value.includes(doc.category)) return false
    // 分类过滤
    if (activeCategory.value !== 'all' && doc.category !== activeCategory.value) return false
    // 关键词过滤（全量包含）
    if (keywords.length === 0) return true
    const haystack = `${doc.title} ${doc.summary} ${doc.tags.join(' ')} ${doc.source}`.toLowerCase()
    return keywords.every(kw => haystack.includes(kw))
  }).sort((a, b) => b.score - a.score)
}

const pagedDocs = computed(() =>
  filteredDocs.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize)
)

const totalPages = computed(() => Math.ceil(filteredDocs.value.length / pageSize))

const pageRange = computed(() => {
  const pages = []
  for (let p = Math.max(1, currentPage.value - 2); p <= Math.min(totalPages.value, currentPage.value + 2); p++) {
    pages.push(p)
  }
  return pages
})

function globalIdx(localIdx: number) {
  return (currentPage.value - 1) * pageSize + localIdx
}

function openPreview(doc: typeof RETRIEVE_DOCS[0]) {
  previewDoc.value = doc
}

function downloadDoc(doc: typeof RETRIEVE_DOCS[0]) {
  const content = `标题：${doc.title}\n类别：${doc.categoryName}\n来源：${doc.source}\n知识库：${doc.kbName}\n更新时间：${doc.updatedAt}\n相关度：${(doc.score * 100).toFixed(0)}\n\n摘要：\n${doc.summary}\n\n标签：${doc.tags.join('、')}`
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${doc.title}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.search-section { padding: 20px; margin-bottom: 20px; }

.search-row { display: flex; gap: 12px; margin-bottom: 14px; }

.category-chips { display: flex; flex-wrap: wrap; gap: 6px; }

.chip {
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  white-space: nowrap;
}

.chip:hover { border-color: var(--primary); color: var(--primary); }
.chip.active { background: var(--primary); color: white; border-color: var(--primary); }

.result-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.result-list { display: flex; flex-direction: column; gap: 12px; }

.result-card {
  padding: 20px;
  cursor: pointer;
  position: relative;
}

.top-badge {
  position: absolute;
  top: -1px;
  left: 20px;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 0 0 6px 6px;
  color: white;
}

.top-1 { background: linear-gradient(135deg, #f59e0b, #d97706); }
.top-2 { background: linear-gradient(135deg, #94a3b8, #64748b); }
.top-3 { background: linear-gradient(135deg, #cd7c3a, #b45309); }

.result-card-body {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.result-left { flex: 1; min-width: 0; }

.result-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-strong);
  margin-bottom: 8px;
  margin-top: 4px;
}

.result-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
  font-size: 11px;
}

.result-sep, .result-source, .result-kb, .result-date { color: var(--text-muted); }

.result-summary {
  font-size: 13px;
  color: var(--text);
  line-height: 1.6;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-tags { display: flex; flex-wrap: wrap; gap: 4px; }

.result-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.result-score { text-align: center; }

.score-num {
  font-size: 28px;
  font-weight: 700;
  color: var(--primary);
  font-family: 'Inter', sans-serif;
  line-height: 1;
}

.score-label { font-size: 10px; color: var(--text-muted); }

.result-actions { display: flex; flex-direction: column; gap: 6px; }

.pagination-row { display: flex; justify-content: center; margin-top: 24px; }

/* Preview modal */
.preview-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.preview-panel {
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border);
  gap: 16px;
}

.preview-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 8px;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.preview-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.preview-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }

.preview-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .result-card-body { flex-direction: column; }
  .result-right { flex-direction: row; width: 100%; justify-content: space-between; align-items: center; }
}
</style>
