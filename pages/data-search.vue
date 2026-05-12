<template>
  <div>
    <div class="card table-switch-card">
      <div>
        <div class="table-switch-title">数据表选择</div>
        <div class="table-switch-desc">切换不同数据表后，下方字段和高级规则会跟随表结构联动更新。</div>
      </div>
      <USelect
        v-model="activeTable"
        :items="tableSelectItems"
        size="lg"
        class="table-select"
      />
    </div>

    <!-- 工具栏 -->
    <div class="card toolbar-card">
      <div class="toolbar">
        <UInput
          v-model="globalFilter"
          icon="i-lucide-search"
          :trailing-icon="globalFilter ? 'i-lucide-circle-x' : undefined"
          :placeholder="`搜索 ${currentTableLabel}...`"
          size="lg"
          class="flex-1"
          @click:trailing="globalFilter = ''"
        />
        <div class="toolbar-right">
          <span class="result-count">{{ filteredCount }} 条</span>
          <UButton variant="soft" color="neutral" size="sm" icon="i-lucide-plus" @click="addRule">
            新增规则
          </UButton>
        </div>
      </div>
    </div>

    <div class="card advanced-card">
      <div class="advanced-header">
        <div>
          <div class="advanced-title">高级搜索</div>
          <div class="advanced-desc">像规则引擎一样组合字段、运算符和值，系统会同步生成 SQL 风格预览。</div>
        </div>
        <div class="advanced-actions">
          <USelect v-model="advancedMatchMode" :items="matchModeItems" size="sm" class="advanced-mode" />
          <UButton variant="ghost" color="neutral" size="sm" icon="i-lucide-rotate-ccw" @click="clearRules">
            清空规则
          </UButton>
        </div>
      </div>

      <div v-if="advancedRules.length" class="rule-list">
        <div v-for="(rule, index) in advancedRules" :key="rule.id" class="rule-row">
          <span class="rule-gate">{{ index === 0 ? 'WHERE' : advancedMatchMode === 'all' ? 'AND' : 'OR' }}</span>
          <USelect v-model="rule.field" :items="fieldOptions" size="sm" class="rule-field" />
          <USelect v-model="rule.operator" :items="operatorOptions" size="sm" class="rule-operator" />
          <UInput v-model="rule.value" size="sm" class="rule-value" placeholder="输入匹配值..." />
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-lucide-trash-2"
            class="rule-remove"
            @click="removeRule(rule.id)"
          />
        </div>
      </div>
      <div v-else class="advanced-empty">
        暂无高级规则。点击“新增规则”后，可以按字段、运算符和值逐步拼装查询条件。
      </div>

      <div class="sql-preview">
        <span class="sql-preview-label">SQL 预览</span>
        <code class="sql-preview-code">{{ advancedPreview }}</code>
      </div>
    </div>

    <!-- 数据表操作栏 -->
    <div class="table-actions-bar">
      <span class="result-count">共 {{ filteredCount }} 条记录</span>
      <UDropdownMenu
        :items="columnMenuItems"
        :content="{ align: 'end', sideOffset: 8 }"
        :ui="{ content: 'w-64' }"
      >
        <UButton variant="outline" color="neutral" size="sm" icon="i-lucide-sliders-horizontal">
          自定义列
        </UButton>
      </UDropdownMenu>
    </div>

    <!-- 数据表 -->
    <div class="card table-card">
      <UTable
        ref="dataTable"
        v-model:sorting="sorting"
        v-model:column-visibility="columnVisibility"
        :data="pagedData"
        :columns="tableColumns"
        :get-row-id="getRowId"
        sticky
        empty="暂无数据"
        class="data-table-shell max-h-[560px]"
      >
        <template #status-cell="{ row }">
          <UBadge :label="String(row.original.status ?? '')" :color="statusColor(String(row.original.status ?? ''))" variant="soft" size="xs" />
        </template>

        <template #role-cell="{ row }">
          <UBadge :label="String(row.original.role ?? '')" variant="soft" size="xs" />
        </template>

        <template #file_type-cell="{ row }">
          <UBadge :label="String(row.original.file_type ?? '').toUpperCase()" variant="outline" color="neutral" size="xs" />
        </template>

        <template #default-cell="{ getValue }">
          <span class="cell-text">{{ getValue() ?? '-' }}</span>
        </template>
      </UTable>

      <!-- 分页 -->
      <div v-if="filteredCount > pageSize" class="table-footer">
        <span style="font-size: 12px; color: var(--text-muted)">
          第 {{ currentPage }}/{{ totalPages }} 页
        </span>
        <UPagination
          v-model:page="currentPage"
          :items-per-page="pageSize"
          :total="filteredCount"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Column } from '@tanstack/vue-table'
import { computed, h, reactive, ref, resolveComponent, watch } from 'vue'
import { DOC_FILES, DOC_CHUNKS, QUERY_LOGS, KB_MEMBERS, IMPORT_TASKS_INIT } from '../data/mock'

// @ts-ignore Nuxt macro
definePageMeta({ middleware: 'auth' })

type DataRow = Record<string, string | number | null>
type ColumnConfig = { key: string; label: string; visible: boolean }
type MatchMode = 'all' | 'any'
type AdvancedOperator = 'contains' | 'equals' | 'not_equals' | 'starts_with' | 'ends_with' | 'gt' | 'gte' | 'lt' | 'lte'
type AdvancedRule = { id: number; field: string; operator: AdvancedOperator; value: string }

const TABLES = [
  { key: 'doc_files', label: '文档文件', description: '文档主表、状态与元数据' },
  { key: 'doc_chunks', label: '文档切片', description: '切片索引、相关分与命中信息' },
  { key: 'query_logs', label: '检索日志', description: '用户查询、结果数与耗时记录' },
  { key: 'kb_members', label: 'KB 成员', description: '知识库成员与角色授权关系' },
  { key: 'import_tasks', label: '导入任务', description: '导入队列、切片参数与处理状态' }
] as const

type TableKey = (typeof TABLES)[number]['key']

const COLS = reactive<Record<TableKey, ColumnConfig[]>>({
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
})

const DATA: Record<TableKey, DataRow[]> = {
  doc_files: DOC_FILES,
  doc_chunks: DOC_CHUNKS,
  query_logs: QUERY_LOGS,
  kb_members: KB_MEMBERS,
  import_tasks: IMPORT_TASKS_INIT
}

const UButton = resolveComponent('UButton')
const dataTable = ref<any | null>(null)
const activeTable = ref<TableKey>('doc_files')
const pageSize = 10
const currentPage = ref(1)
const globalFilter = ref('')
const advancedMatchMode = ref<MatchMode>('all')
const advancedRules = ref<AdvancedRule[]>([])
const sorting = ref<{ id: string; desc: boolean }[]>([])
const columnVisibility = ref<Record<string, boolean>>({})
let nextRuleId = 1

const currentCols = computed(() => COLS[activeTable.value])
const currentTableMeta = computed(() => TABLES.find(t => t.key === activeTable.value) || TABLES[0])
const currentTableLabel = computed(() => TABLES.find(t => t.key === activeTable.value)?.label || '')
const tableSelectItems = TABLES.map(t => ({ value: t.key, label: t.label }))
const fieldOptions = computed(() => currentCols.value.map(col => ({ value: col.key, label: col.label })))
const matchModeItems = [
  { value: 'all', label: '匹配全部' },
  { value: 'any', label: '匹配任一' }
]
const operatorOptions = [
  { value: 'contains', label: '包含' },
  { value: 'equals', label: '等于' },
  { value: 'not_equals', label: '不等于' },
  { value: 'starts_with', label: '开头是' },
  { value: 'ends_with', label: '结尾是' },
  { value: 'gt', label: '大于' },
  { value: 'gte', label: '大于等于' },
  { value: 'lt', label: '小于' },
  { value: 'lte', label: '小于等于' }
] as const

const currentTableData = computed(() => {
  let rows = [...DATA[activeTable.value]]
  const keyword = globalFilter.value.trim().toLowerCase()

  if (keyword) {
    rows = rows.filter((row) => Object.values(row).some(value => String(value ?? '').toLowerCase().includes(keyword)))
  }

  const activeRules = advancedRules.value.filter(rule => rule.value.trim())
  if (!activeRules.length) return rows

  return rows.filter((row) => {
    const results = activeRules.map(rule => evaluateRule(row[rule.field], rule.operator, rule.value))
    return advancedMatchMode.value === 'all' ? results.every(Boolean) : results.some(Boolean)
  })
})

const tableColumns = computed(() => currentCols.value.map((col: ColumnConfig) => ({
  accessorKey: col.key,
  header: ({ column }: { column: Column<any, unknown> }) => getSortHeader(column, col.label),
  meta: {
    class: {
      td: col.key === 'id' ? 'font-mono text-xs' : undefined
    }
  }
})))

const filteredCount = computed<number>(() => currentTableData.value.length)
const totalPages = computed<number>(() => Math.max(1, Math.ceil(filteredCount.value / pageSize)))
const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return currentTableData.value.slice(start, start + pageSize)
})
const advancedPreview = computed(() => {
  const clauses: string[] = []

  if (globalFilter.value.trim()) {
    clauses.push(`FULLTEXT LIKE '%${escapeSqlString(globalFilter.value.trim())}%'`)
  }

  advancedRules.value
    .filter(rule => rule.value.trim())
    .forEach((rule) => {
      const value = escapeSqlString(rule.value.trim())
      const comparator = getSqlComparator(rule.operator, value)
      clauses.push(`${rule.field} ${comparator}`)
    })

  if (!clauses.length) {
    return `SELECT * FROM ${activeTable.value}`
  }

  return `SELECT * FROM ${activeTable.value} WHERE ${clauses.join(advancedMatchMode.value === 'all' ? ' AND ' : ' OR ')}`
})

const columnMenuItems = computed(() => {
  const columnItems = dataTable.value?.tableApi
    ?.getAllColumns()
    .filter((column: any) => column.getCanHide())
    .map((column: any) => ({
      label: currentCols.value.find((col: ColumnConfig) => col.key === column.id)?.label || column.id,
      type: 'checkbox' as const,
      checked: column.getIsVisible(),
      onUpdateChecked(checked: boolean) {
        dataTable.value?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
      },
      onSelect(e: Event) {
        e.preventDefault()
      }
    })) || []

  return [
    [
      {
        label: '显示列',
        type: 'label' as const
      }
    ],
    [
      {
        label: '全选',
        icon: 'i-lucide-list-checks',
        onSelect: () => setCurrentColumns(true)
      },
      {
        label: '全不选',
        icon: 'i-lucide-list-x',
        onSelect: () => setCurrentColumns(false)
      }
    ],
    columnItems
  ]
})

function getSortHeader(column: Column<any, unknown>, label: string) {
  const isSorted = column.getIsSorted()

  return h(UButton, {
    color: 'neutral',
    variant: 'ghost',
    label,
    icon: isSorted
      ? isSorted === 'asc'
        ? 'i-lucide-arrow-up-narrow-wide'
        : 'i-lucide-arrow-down-wide-narrow'
      : 'i-lucide-arrow-up-down',
    class: '-mx-2.5',
    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
  })
}

function createRule(): AdvancedRule {
  return {
    id: nextRuleId++,
    field: currentCols.value[0]?.key || 'id',
    operator: 'contains',
    value: ''
  }
}

function addRule() {
  advancedRules.value.push(createRule())
}

function removeRule(ruleId: number) {
  advancedRules.value = advancedRules.value.filter(rule => rule.id !== ruleId)
}

function clearRules() {
  advancedRules.value = []
  globalFilter.value = ''
}

function normalizeText(value: string | number | null | undefined) {
  return String(value ?? '').trim().toLowerCase()
}

function evaluateRule(rowValue: string | number | null | undefined, operator: AdvancedOperator, inputValue: string) {
  const normalizedRow = normalizeText(rowValue)
  const normalizedInput = inputValue.trim().toLowerCase()
  if (!normalizedInput) return true

  const rowNumber = Number(rowValue)
  const inputNumber = Number(inputValue)
  const numericComparable = !Number.isNaN(rowNumber) && !Number.isNaN(inputNumber)

  switch (operator) {
    case 'contains':
      return normalizedRow.includes(normalizedInput)
    case 'equals':
      return numericComparable ? rowNumber === inputNumber : normalizedRow === normalizedInput
    case 'not_equals':
      return numericComparable ? rowNumber !== inputNumber : normalizedRow !== normalizedInput
    case 'starts_with':
      return normalizedRow.startsWith(normalizedInput)
    case 'ends_with':
      return normalizedRow.endsWith(normalizedInput)
    case 'gt':
      return numericComparable ? rowNumber > inputNumber : normalizedRow > normalizedInput
    case 'gte':
      return numericComparable ? rowNumber >= inputNumber : normalizedRow >= normalizedInput
    case 'lt':
      return numericComparable ? rowNumber < inputNumber : normalizedRow < normalizedInput
    case 'lte':
      return numericComparable ? rowNumber <= inputNumber : normalizedRow <= normalizedInput
    default:
      return true
  }
}

function getSqlComparator(operator: AdvancedOperator, value: string) {
  switch (operator) {
    case 'contains':
      return `LIKE '%${value}%'`
    case 'equals':
      return `= '${value}'`
    case 'not_equals':
      return `!= '${value}'`
    case 'starts_with':
      return `LIKE '${value}%'`
    case 'ends_with':
      return `LIKE '%${value}'`
    case 'gt':
      return `> '${value}'`
    case 'gte':
      return `>= '${value}'`
    case 'lt':
      return `< '${value}'`
    case 'lte':
      return `<= '${value}'`
    default:
      return `= '${value}'`
  }
}

function escapeSqlString(value: string) {
  return value.replaceAll("'", "''")
}

function syncColumnVisibility() {
  columnVisibility.value = Object.fromEntries(currentCols.value.map((col: ColumnConfig) => [col.key, col.visible]))
}

function setCurrentColumns(visible: boolean) {
  currentCols.value.forEach((col: ColumnConfig) => {
    col.visible = visible
  })
  syncColumnVisibility()
}

function getRowId(row: DataRow, index: number) {
  return String(row.id ?? `${activeTable.value}-${index}`)
}

watch(activeTable, () => {
  globalFilter.value = ''
  advancedMatchMode.value = 'all'
  advancedRules.value = []
  sorting.value = []
  currentPage.value = 1
  syncColumnVisibility()
}, { immediate: true })

watch(globalFilter, () => {
  currentPage.value = 1
})

watch(advancedMatchMode, () => {
  currentPage.value = 1
})

watch(advancedRules, () => {
  currentPage.value = 1
}, { deep: true })

watch(currentTableData, (rows) => {
  const maxPage = Math.max(1, Math.ceil(rows.length / pageSize))
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage
  }
})

watch(columnVisibility, (value: Record<string, boolean>) => {
  currentCols.value.forEach((col: ColumnConfig) => {
    if (typeof value[col.key] === 'boolean') {
      col.visible = value[col.key]
    }
  })
}, { deep: true })

function statusColor(status: string): string {
  const map: Record<string, string> = {
    '已入库': 'success',
    '已解析': 'success',
    '处理中': 'primary',
    '解析中': 'primary',
    '待切片': 'warning',
    '排队中': 'warning',
    '已建立': 'success',
    '失败': 'error'
  }
  return map[status] || 'neutral'
}
</script>

<style scoped>
.table-switch-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
  padding: 18px 20px;
}

.table-switch-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}

.table-switch-desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-muted);
}

.table-select {
  width: 220px;
  flex-shrink: 0;
}

.toolbar-card { padding: 12px 16px; margin-bottom: 16px; }

.toolbar { display: flex; gap: 12px; align-items: center; }
.toolbar-right { display: flex; align-items: center; gap: 10px; }
.result-count { font-size: 12px; color: var(--text-muted); white-space: nowrap; }

.table-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 10px;
}

.advanced-card {
  margin-bottom: 16px;
  padding: 18px 20px;
}

.advanced-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.advanced-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}

.advanced-desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-muted);
}

.advanced-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.advanced-mode {
  width: 120px;
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rule-row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1.1fr) minmax(0, 0.9fr) minmax(0, 1.2fr) auto;
  gap: 10px;
  align-items: center;
}

.rule-gate {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary-soft) 72%, transparent);
  color: var(--primary);
  font-size: 11px;
  font-weight: 700;
}

.rule-remove {
  min-width: 36px;
}

.advanced-empty {
  padding: 14px 16px;
  border: 1px dashed color-mix(in srgb, var(--border) 88%, transparent);
  border-radius: 16px;
  color: var(--text-muted);
  font-size: 12px;
  background: color-mix(in srgb, var(--surface-alt) 76%, transparent);
}

.sql-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.sql-preview-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.sql-preview-code {
  display: block;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--border) 86%, transparent);
  background: linear-gradient(135deg, color-mix(in srgb, var(--surface-alt) 86%, transparent), var(--surface));
  color: var(--text-strong);
  font-size: 12px;
  line-height: 1.7;
  white-space: normal;
  word-break: break-word;
}

.table-card { overflow: hidden; }
.data-table-shell { width: 100%; }
.data-table-shell :deep(thead tr th) {
  border-bottom: 1px solid color-mix(in srgb, var(--border) 55%, transparent) !important;
  background: color-mix(in srgb, var(--surface-alt) 60%, var(--surface)) !important;
}
.data-table-shell :deep(thead tr) {
  border-bottom: none !important;
}
.data-table-shell :deep(tbody tr:nth-child(even) td) {
  background-color: color-mix(in srgb, var(--surface-alt) 55%, transparent);
}
.data-table-shell :deep(tbody tr) {
  border-bottom: 1px solid color-mix(in srgb, var(--border) 35%, transparent);
}
.cell-text { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 260px; }

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
}

@media (max-width: 768px) {
  .table-switch-card,
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .table-select,
  .advanced-mode {
    width: 100%;
  }

  .advanced-header,
  .toolbar-right {
    flex-direction: column;
    align-items: stretch;
  }

  .rule-row {
    grid-template-columns: 1fr;
  }

  .rule-gate {
    justify-content: space-between;
  }
}
</style>