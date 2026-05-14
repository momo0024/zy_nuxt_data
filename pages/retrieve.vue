<template>
  <div>
    <!-- 搜索区 -->
    <div class="card search-section">
      <div class="search-row">
        <UInput
          v-model="searchText"
          icon="i-lucide-search"
          :trailing-icon="searchText ? 'i-lucide-circle-x' : undefined"
          placeholder="输入关键词检索知识库..."
          size="lg"
          class="flex-1"
          @keydown.enter="doSearch"
          @click:trailing="searchText = ''; doSearch()"
        />
        <UButton size="lg" icon="i-lucide-search" @click="doSearch">
          开始检索
        </UButton>
      </div>
      <!-- 分类筛选 -->
      <div class="category-chips">
        <UButton
          :variant="activeCategory === 'all' ? 'solid' : 'outline'"
          size="xs"
          @click="setCategory('all')"
        >全部类型</UButton>
        <UButton
          v-for="cat in allowedCats"
          :key="cat.key"
          :variant="activeCategory === cat.key ? 'solid' : 'outline'"
          size="xs"
          @click="setCategory(cat.key)"
        >{{ cat.name }}</UButton>
      </div>
    </div>

    <!-- 结果区 -->
    <div v-if="hasSearched">
      <div class="result-meta">
        <span>共找到 <strong>{{ filteredDocs.length }}</strong> 条结果</span>
        <span v-if="filteredDocs.length > 0">
          展示 {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredDocs.length) }} 条
        </span>
      </div>

      <div v-if="filteredDocs.length === 0" class="empty-state">
        <UIcon name="i-lucide-search-x" class="empty-state-icon size-12" />
        <div class="empty-state-text">未找到匹配的文档<br>尝试更换关键词或调整分类筛选</div>
      </div>

      <div class="result-list">
        <div
          v-for="(doc, idx) in pagedDocs"
          :key="doc.id"
          class="result-card card card-hover"
          @click="openPreview(doc)"
        >
          <div v-if="globalIdx(idx) < 3" class="top-badge" :class="`top-${globalIdx(idx)+1}`">
            Top {{ globalIdx(idx) + 1 }}
          </div>
          <div class="result-card-body">
            <div class="result-left">
              <div class="result-title">{{ doc.title }}</div>
              <div class="result-meta-row">
                <UBadge :label="doc.categoryName" variant="soft" size="xs" />
                <span class="result-sep">·</span>
                <span class="result-source">{{ doc.source }}</span>
                <span class="result-sep">·</span>
                <span class="result-kb">{{ doc.kbName }}</span>
                <span class="result-sep">·</span>
                <span class="result-date">{{ doc.updatedAt }}</span>
              </div>
              <div class="result-summary">{{ doc.summary }}</div>
              <div class="result-tags">
                <UBadge v-for="tag in doc.tags" :key="tag" :label="tag" variant="soft" size="xs" :color="getTagColor(tag)" />
              </div>
            </div>
            <div class="result-right" @click.stop>
              <div class="result-score">
                <div class="score-num">{{ (doc.score * 100).toFixed(0) }}</div>
                <div class="score-label">相关度</div>
              </div>
              <div class="result-actions">
                <UButton variant="outline" size="xs" icon="i-lucide-eye" @click.stop="openPreview(doc)">预览</UButton>
                <UButton variant="ghost" size="xs" icon="i-lucide-download" @click.stop="downloadDoc(doc)">下载</UButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination-row">
        <UPagination v-model:page="currentPage" :total="filteredDocs.length" :items-per-page="pageSize" />
      </div>
    </div>

    <div v-else class="empty-state" style="margin-top: 48px">
      <UIcon name="i-lucide-scan-search" class="empty-state-icon size-12" />
      <div class="empty-state-text">输入关键词开始检索<br>或直接点击「开始检索」查看全部文档</div>
    </div>

    <UModal v-model:open="isPreviewOpen" :title="previewDoc?.title || ''">
      <template #body>
        <div v-if="previewDoc" class="preview-body">
          <div class="preview-meta">
            <UBadge :label="previewDoc.categoryName" variant="soft" />
            <span>{{ previewDoc.source }}</span>
            <span>{{ previewDoc.updatedAt }}</span>
          </div>
          <p style="line-height: 1.8; font-size: 13px; color: var(--text); margin-top: 12px">{{ previewDoc.summary }}</p>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 12px">
            本文档来自 {{ previewDoc.kbName }}，知识类型为 {{ previewDoc.categoryName }}。相关度分数：{{ (previewDoc.score * 100).toFixed(0) }}。
          </p>
          <div class="preview-tags">
            <UBadge v-for="tag in previewDoc.tags" :key="tag" :label="tag" variant="soft" :color="getTagColor(tag)" size="xs" />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-2 justify-end w-full">
          <UButton variant="outline" size="sm" icon="i-lucide-download" @click="previewDoc && downloadDoc(previewDoc)">
            下载文档
          </UButton>
          <UButton variant="ghost" size="sm" @click="isPreviewOpen = false">关闭</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES, RETRIEVE_DOCS } from '~/data/mock'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const route = useRoute()

const hydrated = ref(false)
const allowedCategories = computed(() => hydrated.value ? (authStore.user?.allowedCategories || []) : [])
const allowedCats = computed(() => CATEGORIES.filter(c => allowedCategories.value.includes(c.key)))

const searchText = ref('')
const activeCategory = ref('all')
const hasSearched = ref(false)
const currentPage = ref(1)
const pageSize = 20
const previewDoc = ref<(typeof RETRIEVE_DOCS)[0] | null>(null)
const isPreviewOpen = ref(false)

onMounted(() => {
  hydrated.value = true
  if (route.query.category) {
    activeCategory.value = route.query.category as string
  }
  doSearch()
})

const TAG_COLORS = ['primary', 'success', 'warning', 'error', 'info', 'purple', 'orange', 'teal', 'pink', 'amber'] as const

function getTagColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

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
    if (!allowedCategories.value.includes(doc.category)) return false
    if (activeCategory.value !== 'all' && doc.category !== activeCategory.value) return false
    if (keywords.length === 0) return true
    const haystack = `${doc.title} ${doc.summary} ${doc.tags.join(' ')} ${doc.source}`.toLowerCase()
    return keywords.every(kw => haystack.includes(kw))
  }).sort((a, b) => b.score - a.score)
}

const pagedDocs = computed(() =>
  filteredDocs.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize)
)
const totalPages = computed(() => Math.ceil(filteredDocs.value.length / pageSize))

function globalIdx(localIdx: number) {
  return (currentPage.value - 1) * pageSize + localIdx
}

function openPreview(doc: typeof RETRIEVE_DOCS[0]) {
  previewDoc.value = doc
  isPreviewOpen.value = true
}

function downloadDoc(doc: typeof RETRIEVE_DOCS[0]) {
  const a = document.createElement('a')
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(doc.title + '\n' + doc.summary)
  a.download = doc.title + '.txt'
  a.click()
}
</script>

<style scoped>
.search-section { padding: 20px; margin-bottom: 20px; }
.search-row { display: flex; gap: 12px; margin-bottom: 14px; }
.category-chips { display: flex; flex-wrap: wrap; gap: 6px; }

.result-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.result-list { display: flex; flex-direction: column; gap: 12px; }
.result-card { padding: 20px; cursor: pointer; position: relative; }

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

.result-card-body { display: flex; gap: 20px; align-items: flex-start; }
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
.result-right { display: flex; flex-direction: column; align-items: center; gap: 12px; flex-shrink: 0; }
.result-score { text-align: center; }
.score-num { font-size: 28px; font-weight: 700; color: var(--primary); font-family: var(--font-display); line-height: 1; }
.score-label { font-size: 10px; color: var(--text-muted); }
.result-actions { display: flex; flex-direction: column; gap: 6px; }
.pagination-row { display: flex; justify-content: center; margin-top: 24px; }

.preview-body { padding: 4px 0; }
.preview-meta { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-muted); flex-wrap: wrap; }
.preview-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 0; }
.empty-state-icon { color: var(--text-muted); }
.empty-state-text { text-align: center; color: var(--text-muted); font-size: 14px; line-height: 1.8; }

@media (max-width: 640px) {
  .result-card-body { flex-direction: column; }
  .result-right { flex-direction: row; width: 100%; justify-content: space-between; align-items: center; }
  .search-row { flex-direction: column; }
  .search-section { padding: 14px; }
  .result-card { padding: 14px; }
}
</style>