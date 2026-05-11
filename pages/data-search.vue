<template>
  <div>
    <!-- 表格选择 tabs -->
    <div class="table-tabs card" style="padding: 6px; margin-bottom: 20px; display: flex; gap: 4px;">
      <button
        v-for="t in TABLES"
        :key="t.key"
        class="tab-btn"
        :class="{ active: activeTable === t.key }"
        @click="switchTable(t.key)"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- 工具栏 -->
    <div class="card" style="padding: 16px; margin-bottom: 16px;">
      <div class="toolbar">
        <div class="search-wrapper flex-1">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4" stroke="currentColor" stroke-width="1.5"/>
            <path d="M9 9l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input
            v-model="searchText"
            class="form-input"
            style="padding-left: 34px; height: 36px; font-size: 13px;"
            :placeholder="`搜索 ${currentTableLabel}...`"
          />
          <button v-if="searchText" class="clear-btn" @click="searchText = ''">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="toolbar-right">
          <span class="result-count">{{ filteredRows.length }} 条</span>
          <!-- 自定义列 popover -->
          <div class="col-picker-wrap" ref="colPickerRef">
            <button class="btn btn-outline btn-sm" @click="colPickerOpen = !colPickerOpen">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                <rect x="7" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                <rect x="1" y="7" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
                <rect x="7" y="7" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/>
              </svg>
              自定义列
            </button>
            <div v-if="colPickerOpen" class="col-picker">
              <div class="col-picker-header">
                <span style="font-size:12px; font-weight:600">显示列</span>
                <div style="display:flex; gap:6px;">
                  <button class="btn btn-ghost btn-sm" @click="toggleAll(true)">全选</button>
                  <button class="btn btn-ghost btn-sm" @click="toggleAll(false)">全不选</button>
                </div>
              </div>
              <label v-for="col in currentCols" :key="col.key" class="col-picker-item">
                <input type="checkbox" v-model="col.visible" style="margin-right: 8px;" />
                {{ col.label }}
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据表 -->
    <div class="card table-card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th
                v-for="col in visibleCols"
                :key="col.key"
                class="th-sortable"
                @click="toggleSort(col.key)"
              >
                {{ col.label }}
                <span class="sort-indicator">
                  <span :class="sortKey === col.key && sortDir === 'asc' ? 'sort-active' : 'sort-dim'">▲</span>
                  <span :class="sortKey === col.key && sortDir === 'desc' ? 'sort-active' : 'sort-dim'">▼</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in pagedRows" :key="i" :class="i % 2 === 0 ? 'row-even' : 'row-odd'">
              <td v-for="col in visibleCols" :key="col.key">
                <!-- 状态列 -->
                <template v-if="col.key === 'status'">
                  <span class="badge" :class="statusBadge(String(row[col.key] ?? ''))">
                    {{ row[col.key] }}
                  </span>
                </template>
                <!-- 权限列 -->
                <template v-else-if="col.key === 'role'">
                  <span class="badge badge-primary">{{ row[col.key] }}</span>
                </template>
                <!-- 普通列 -->
                <template v-else>
                  <span class="cell-text">{{ row[col.key] ?? '-' }}</span>
                </template>
              </td>
            </tr>
            <tr v-if="pagedRows.length === 0">
              <td :colspan="visibleCols.length" style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 13px;">
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="table-footer">
        <span style="font-size: 12px; color: var(--text-muted)">
          第 {{ currentPage }}/{{ totalPages }} 页
        </span>
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
  </div>
</template>

<script setup lang="ts">
import { DOC_FILES, DOC_CHUNKS, QUERY_LOGS, KB_MEMBERS, IMPORT_TASKS_INIT } from '~/data/mock'

definePageMeta({ middleware: 'auth' })

const TABLES = [
  { key: 'doc_files', label: '文档文件' },
  { key: 'doc_chunks', label: '文档切片' },
  { key: 'query_logs', label: '检索日志' },
  { key: 'kb_members', label: 'KB 成员' },
  { key: 'import_tasks', label: '导入任务' }
]

const COLS: Record<string, { key: string; label: string; visible: boolean }[]> = {
  doc_files: [
    { key: 'id', label: 'ID', visible: true },
    { key: 'title', label: '文件名', visible: true },
    { key: 'category_key', label: '类别', visible: true },
    { key: 'kb_id', label: '知识库', visible: true },
    { key: 'file_type', label: '文件类型', visible: true },
    { key: 'file_size', label: '大小(KB)', visible: true },
    { key: 'status', label: '状态', visible: true },
    { key: 'created_at', label: '创建时间', visible: true }
  ],
  doc_chunks: [
    { key: 'id', label: 'ID', visible: true },
    { key: 'file_id', label: '文档ID', visible: true },
    { key: 'chunk_index', label: '切片序号', visible: true },
    { key: 'content_len', label: '字符数', visible: true },
    { key: 'score', label: '相关分', visible: true },
    { key: 'hit_count', label: '命中次数', visible: true },
    { key: 'created_at', label: '创建时间', visible: true }
  ],
  query_logs: [
    { key: 'id', label: 'ID', visible: true },
    { key: 'query_text', label: '查询词', visible: true },
    { key: 'user_id', label: '用户ID', visible: true },
    { key: 'result_count', label: '结果数', visible: true },
    { key: 'duration_ms', label: '耗时(ms)', visible: true },
    { key: 'created_at', label: '查询时间', visible: true }
  ],
  kb_members: [
    { key: 'id', label: 'ID', visible: true },
    { key: 'user_name', label: '姓名', visible: true },
    { key: 'user_id', label: '账号', visible: true },
    { key: 'role', label: '角色', visible: true },
    { key: 'kb_name', label: '知识库', visible: true },
    { key: 'granted_at', label: '加入时间', visible: true }
  ],
  import_tasks: [
    { key: 'id', label: 'ID', visible: true },
    { key: 'file_name', label: '文件名', visible: true },
    { key: 'category', label: '类别', visible: true },
    { key: 'file_type', label: '文件类型', visible: true },
    { key: 'chunk_size', label: '切片大小', visible: true },
    { key: 'status', label: '状态', visible: true },
    { key: 'submitted_at', label: '提交时间', visible: true }
  ]
}

const DATA: Record<string, any[]> = {
  doc_files: DOC_FILES,
  doc_chunks: DOC_CHUNKS,
  query_logs: QUERY_LOGS,
  kb_members: KB_MEMBERS,
  import_tasks: IMPORT_TASKS_INIT
}

const activeTable = ref('doc_files')
const searchText = ref('')
const sortKey = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)
const pageSize = 10
const colPickerOpen = ref(false)
const colPickerRef = ref<HTMLElement | null>(null)

const currentCols = computed(() => COLS[activeTable.value])
const currentTableLabel = computed(() => TABLES.find(t => t.key === activeTable.value)?.label || '')
const visibleCols = computed(() => currentCols.value.filter(c => c.visible))

function switchTable(key: string) {
  activeTable.value = key
  searchText.value = ''
  sortKey.value = ''
  sortDir.value = 'asc'
  currentPage.value = 1
  colPickerOpen.value = false
}

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
  currentPage.value = 1
}

function toggleAll(val: boolean) {
  currentCols.value.forEach(col => { col.visible = val })
}

const filteredRows = computed(() => {
  let rows = [...DATA[activeTable.value]]

  const kw = searchText.value.trim().toLowerCase()
  if (kw) {
    rows = rows.filter(row =>
      Object.values(row).some(v => String(v ?? '').toLowerCase().includes(kw))
    )
  }

  if (sortKey.value) {
    const k = sortKey.value
    rows.sort((a, b) => {
      const av = a[k] ?? ''
      const bv = b[k] ?? ''
      const res = String(av).localeCompare(String(bv), 'zh', { numeric: true })
      return sortDir.value === 'asc' ? res : -res
    })
  }

  return rows
})

const totalPages = computed(() => Math.ceil(filteredRows.value.length / pageSize))

const pagedRows = computed(() =>
  filteredRows.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize)
)

const pageRange = computed(() => {
  const pages: number[] = []
  for (let p = Math.max(1, currentPage.value - 2); p <= Math.min(totalPages.value, currentPage.value + 2); p++) {
    pages.push(p)
  }
  return pages
})

// 页码随搜索重置
watch(searchText, () => { currentPage.value = 1 })

// 点击外部关闭列选择器
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (colPickerRef.value && !colPickerRef.value.contains(e.target as Node)) {
      colPickerOpen.value = false
    }
  })
})

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    '已入库': 'badge-success',
    '已解析': 'badge-success',
    '处理中': 'badge-primary',
    '解析中': 'badge-primary',
    '待切片': 'badge-warning',
    '排队中': 'badge-warning',
    '已建立': 'badge-success',
    '失败': 'badge-danger'
  }
  return map[status] || 'badge-secondary'
}
</script>

<style scoped>
.table-tabs { display: flex; gap: 4px; padding: 5px; flex-wrap: wrap; }

.tab-btn {
  padding: 7px 16px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.tab-btn:hover { background: var(--surface-alt); color: var(--text); }
.tab-btn.active { background: var(--primary); color: white; font-weight: 600; }

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.toolbar-right { display: flex; align-items: center; gap: 10px; }

.result-count { font-size: 12px; color: var(--text-muted); white-space: nowrap; }

.col-picker-wrap { position: relative; }

.col-picker {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-xl);
  padding: 12px;
  min-width: 180px;
  z-index: 500;
}

.col-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.col-picker-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--text);
  padding: 5px 4px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.1s;
}

.col-picker-item:hover { background: var(--surface-alt); }

/* Table */
.table-card { overflow: hidden; }

.table-wrap { overflow-x: auto; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table thead { position: sticky; top: 0; }

.data-table th {
  background: var(--surface-alt);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 14px;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid var(--border);
  user-select: none;
}

.th-sortable { cursor: pointer; }
.th-sortable:hover { color: var(--text-strong); }

.sort-indicator { display: inline-flex; flex-direction: column; margin-left: 4px; font-size: 8px; line-height: 1.1; vertical-align: middle; }
.sort-active { color: var(--primary); }
.sort-dim { color: var(--border); }

.data-table td {
  padding: 10px 14px;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  max-width: 280px;
}

.cell-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 260px;
}

.row-even { background: var(--surface); }
.row-odd { background: color-mix(in srgb, var(--surface-alt) 60%, var(--surface)); }

.data-table tr:hover td { background: var(--primary-soft); }

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
}
</style>
