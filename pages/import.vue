﻿<template>
  <div class="import-layout">
    <!-- 左侧表单 -->
    <div class="import-form-col">
      <div class="card form-card">
        <div class="form-card-title">
          <UIcon name="i-heroicons-arrow-up-tray" class="size-5" />
          新文档导入
        </div>

        <!-- 标题 -->
        <div class="form-group">
          <label class="form-label">文档标题</label>
          <UInput
            v-model="form.title"
            placeholder="自动从文件名获取，可手动修改"
            :color="errors.title ? 'error' : undefined"
          />
          <div v-if="errors.title" class="error-msg">{{ errors.title }}</div>
        </div>

        <!-- 文件所属类别 和 文件类型 并排 -->
        <div class="form-row">
          <!-- 知识分类 -->
          <div class="form-group flex-1">
            <label class="form-label">文件所属类别</label>
            <div class="category-selector">
              <USelect
                v-model="form.category"
                :items="allCategoryOptions"
                placeholder="新闻 / 资讯"
                :color="errors.category ? 'error' : undefined"
                class="flex-1"
              />
              <UButton variant="outline" size="sm" icon="i-heroicons-plus" @click="showAddCat = !showAddCat" />
            </div>
            <div v-if="errors.category" class="error-msg">{{ errors.category }}</div>
            <!-- 新增自定义分类 -->
            <Transition name="slide-up">
              <div v-if="showAddCat" class="add-cat-panel">
                <UInput
                  v-model="newCatInput"
                  placeholder="输入新分类名称，如「内部通知」..."
                  size="sm"
                  class="flex-1"
                  @keydown.enter.prevent="addCustomCategory"
                />
                <UButton size="sm" @click="addCustomCategory">确认添加</UButton>
                <UButton variant="ghost" size="sm" @click="showAddCat = false; newCatInput = ''">取消</UButton>
              </div>
            </Transition>
          </div>

          <!-- 文件类型 -->
          <div class="form-group flex-1">
            <label class="form-label">文件类型（自动解析）</label>
            <USelect v-model="form.fileType" :items="fileTypeOptions" placeholder="选择文件类型" />
          </div>
        </div>

        <!-- 发布日期 -->
        <div class="form-group">
          <label class="form-label">发布日期</label>
          <DatePicker v-model="form.docDate" placeholder="选择日期" />
        </div>

        <!-- 切片大小 -->
        <div class="form-group">
          <label class="form-label">切片大小（字符数）</label>
          <div class="chunk-presets">
            <UButton
              v-for="preset in chunkPresets"
              :key="preset"
              :variant="form.chunkSize === preset && !customChunk ? 'solid' : 'outline'"
              size="xs"
              @click="setChunk(preset)"
            >{{ preset }}</UButton>
            <UButton
              :variant="customChunk ? 'solid' : 'outline'"
              size="xs"
              @click="customChunk = !customChunk"
            >自定义</UButton>
          </div>
          <Transition name="slide-up">
            <div v-if="customChunk" style="margin-top: 8px">
              <UInput
                v-model.number="form.chunkSize"
                type="number"
                placeholder="输入字符数..."
                style="width: 160px"
              />
            </div>
          </Transition>
        </div>

        <!-- 上传区 -->
        <div class="form-group">
          <label class="form-label">选择文件 <span class="required">*</span></label>
          <div
            class="upload-zone"
            :class="[dragActive ? 'drop-active' : form.file ? 'has-file' : '']"
            @dragover.prevent="dragActive = true"
            @dragleave.prevent="dragActive = false"
            @drop.prevent="onDrop"
            @click="fileInputRef?.click()"
          >
            <template v-if="!form.file">
              <UIcon name="i-heroicons-arrow-up-tray" class="upload-icon size-10" />
              <div class="upload-text">
                {{ dragActive ? '松开以添加文件' : '点击选择文件，或将文件拖拽到此处' }}
              </div>
              <div class="upload-hint">支持 PDF、DOCX、XLSX、TXT、MD、HTML</div>
            </template>
            <template v-else>
              <UIcon name="i-heroicons-check-circle" class="upload-icon size-10" style="color: var(--success)" />
              <div class="upload-text" style="color: var(--success)">{{ form.file.name }}</div>
              <div class="upload-hint">{{ (form.file.size / 1024).toFixed(0) }} KB · 点击更换</div>
            </template>
            <input
              ref="fileInputRef"
              type="file"
              accept=".pdf,.docx,.xlsx,.txt,.md,.html"
              style="display: none"
              @change="onFileChange"
            />
          </div>
          <div v-if="errors.file" class="error-msg">{{ errors.file }}</div>
        </div>

        <!-- 提交 -->
        <div class="form-actions">
          <UButton icon="i-heroicons-plus" :loading="submitting" @click="submitForm">
            加入导入队列
          </UButton>
          <UButton variant="ghost" @click="resetForm">重置</UButton>
        </div>
      </div>
    </div>

    <!-- 右侧帮助卡片 -->
    <div class="import-help-col">
      <div class="card help-card">
        <div class="help-title">
          <UIcon name="i-heroicons-information-circle" class="size-4" />
          使用说明
        </div>
        <ul class="help-list">
          <li>填写文档标题和知识分类后，选择要导入的文件。</li>
          <li>切片大小影响向量检索精度，一般推荐 <strong>500</strong>。</li>
          <li>文档将加入解析队列，状态显示于下方列表。</li>
          <li>仅支持拥有权限的知识分类。</li>
          <li>同一文件名已导入则会生成新版本，不会覆盖。</li>
        </ul>
        <div class="help-divider" />
        <div class="help-sub-title">状态说明</div>
        <div class="help-status-list">
          <div class="help-status-row">
            <UBadge label="排队中" color="warning" variant="soft" size="xs" />
            <span>等待解析</span>
          </div>
          <div class="help-status-row">
            <UBadge label="解析中" color="primary" variant="soft" size="xs" />
            <span>正在切片向量化</span>
          </div>
          <div class="help-status-row">
            <UBadge label="已解析" color="success" variant="soft" size="xs" />
            <span>完成，可检索</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 导入队列 -->
  <div class="card" style="margin-top: 24px">
    <div class="queue-header">
      <div class="form-card-title" style="margin-bottom: 0">导入队列</div>
      <div class="queue-toolbar">
        <UInput
          v-model="queueSearch"
          icon="i-heroicons-magnifying-glass"
          placeholder="搜索任务..."
          size="sm"
          style="width: 200px"
        />
        <USelect
          v-model="queueStatusFilter"
          :items="statusFilterOptions"
          size="sm"
          style="width: 110px"
        />
      </div>
    </div>

    <div class="table-wrap">
      <UTable
        :data="filteredQueue"
        :columns="queueColumns"
        :get-row-id="(row) => row.id"
        sticky
        empty="暂无任务"
        class="queue-table max-h-[420px]"
      >
        <template #file_name-cell="{ row }">
          <span class="cell-text" style="max-width: 220px">{{ row.original.file_name }}</span>
        </template>

        <template #file_type-cell="{ row }">
          <UBadge :label="row.original.file_type.toUpperCase()" variant="outline" color="neutral" size="xs" />
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :label="row.original.status"
            :color="taskStatusColor(row.original.status)"
            variant="soft"
            size="xs"
          />
        </template>

        <template #submitted_at-cell="{ row }">
          <span class="queue-time">{{ row.original.submitted_at }}</span>
        </template>
      </UTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES, IMPORT_TASKS_INIT } from '~/data/mock'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const toast = useToast()
const allowedCategories = computed(() => authStore.user?.allowedCategories || [])

const allowedCatOptions = computed(() =>
  CATEGORIES.filter(c => allowedCategories.value.includes(c.key)).map(c => ({ label: c.name, value: c.key }))
)

const chunkPresets = [200, 500, 800, 1200]

const customCategoryList = ref<string[]>([])
const showAddCat = ref(false)
const newCatInput = ref('')

const allCategoryOptions = computed(() => [
  ...allowedCatOptions.value,
  ...customCategoryList.value.map(c => ({ label: c, value: '__custom_' + c }))
])

const fileTypeOptions = [
  { label: 'PDF', value: 'pdf' },
  { label: 'Word (DOCX)', value: 'docx' },
  { label: 'Excel (XLSX)', value: 'xlsx' },
  { label: '纯文本 (TXT)', value: 'txt' },
  { label: 'Markdown (MD)', value: 'md' },
  { label: 'HTML', value: 'html' }
]

const statusFilterOptions = [
  { label: '全部状态', value: 'all' },
  { label: '排队中', value: '排队中' },
  { label: '解析中', value: '解析中' },
  { label: '已解析', value: '已解析' }
]

const queueColumns = [
  { accessorKey: 'file_name', header: '文件名' },
  { accessorKey: 'category', header: '分类' },
  { accessorKey: 'file_type', header: '文件类型' },
  { accessorKey: 'chunk_size', header: '切片大小' },
  { accessorKey: 'status', header: '状态' },
  {
    accessorKey: 'submitted_at',
    header: '创建时间',
    meta: {
      class: {
        td: 'whitespace-nowrap'
      }
    }
  }
]

function addCustomCategory() {
  const name = newCatInput.value.trim()
  if (!name) return
  const value = '__custom_' + name
  if (!customCategoryList.value.includes(name)) {
    customCategoryList.value.push(name)
  }
  form.category = value
  errors.category = ''
  newCatInput.value = ''
  showAddCat.value = false
}

const form = reactive({
  title: '',
  category: '',
  fileType: 'pdf',
  docDate: new Date().toISOString().slice(0, 10),
  chunkSize: 500,
  file: null as File | null
})

const errors = reactive({ title: '', category: '', file: '' })
const customChunk = ref(false)
const dragActive = ref(false)
const submitting = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function setChunk(preset: number) {
  form.chunkSize = preset
  customChunk.value = false
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  form.file = input.files?.[0] ?? null
}

function onDrop(e: DragEvent) {
  dragActive.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) form.file = files[0]
}

function validate() {
  errors.title = form.title.trim() ? '' : '请输入文档标题'
  errors.category = form.category ? '' : '请选择知识分类'
  errors.file = form.file ? '' : '请选择要导入的文件'
  return !errors.title && !errors.category && !errors.file
}

const importTasks = ref([...IMPORT_TASKS_INIT])
const queueSearch = ref('')
const queueStatusFilter = ref('all')

const filteredQueue = computed(() => {
  let tasks = importTasks.value
  if (queueSearch.value.trim()) {
    const kw = queueSearch.value.toLowerCase()
    tasks = tasks.filter(t => t.file_name.toLowerCase().includes(kw) || t.category.toLowerCase().includes(kw))
  }
  if (queueStatusFilter.value !== 'all') {
    tasks = tasks.filter(t => t.status === queueStatusFilter.value)
  }
  return tasks
})

async function submitForm() {
  if (!validate()) return
  submitting.value = true
  await new Promise(r => setTimeout(r, 800))

  const catLabel = form.category.startsWith('__custom_')
    ? form.category.replace('__custom_', '')
    : CATEGORIES.find(c => c.key === form.category)?.name || form.category

  importTasks.value.unshift({
    id: `T${Date.now()}`,
    file_name: form.file!.name,
    category: catLabel,
    file_type: form.fileType,
    chunk_size: form.chunkSize,
    status: '排队中',
    submitted_at: new Date().toLocaleDateString('zh-CN') + ' ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    chunk_count: 0,
    vector_count: 0,
    submitter: authStore.user?.name || '',
    finished_at: null
  })

  const fileName = form.file!.name
  submitting.value = false
  toast.add({ title: '导入成功', description: `"${fileName}" 已成功加入导入队列`, color: 'success' })
  resetForm()
}

function resetForm() {
  form.title = ''
  form.category = ''
  form.fileType = 'pdf'
  form.docDate = new Date().toISOString().slice(0, 10)
  form.chunkSize = 500
  form.file = null
  customChunk.value = false
  errors.title = ''
  errors.category = ''
  errors.file = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function taskStatusColor(status: string) {
  const map: Record<string, 'success' | 'primary' | 'warning' | 'error' | 'neutral'> = {
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
.import-layout {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 20px;
  margin-bottom: 0;
}

.form-card { padding: 24px; }

.form-card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.flex-1 {
  flex: 1;
}

.form-group { margin-bottom: 18px; }
.required { color: var(--danger); }
.error-msg { font-size: 11px; color: var(--danger); margin-top: 4px; }
.cursor-pointer { cursor: pointer; }



.chunk-presets { display: flex; gap: 8px; flex-wrap: wrap; }

.upload-zone {
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 32px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--surface-alt);
}
.upload-zone:hover { border-color: var(--primary); }
.upload-zone.drop-active { border-color: var(--primary); background: var(--primary-soft); }
.upload-zone.has-file { border-style: solid; border-color: var(--success); }
.upload-icon { color: var(--text-muted); margin: 0 auto 12px; }
.upload-text { font-size: 13px; color: var(--text); margin-bottom: 4px; }
.upload-hint { font-size: 11px; color: var(--text-muted); }

.form-actions { display: flex; gap: 10px; align-items: center; }

.help-card { padding: 20px; }
.help-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 14px;
}
.help-list { padding-left: 18px; margin: 0; font-size: 12px; color: var(--text-muted); line-height: 1.8; }
.help-divider { border-top: 1px solid var(--border); margin: 14px 0; }
.help-sub-title { font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 10px; }
.help-status-list { display: flex; flex-direction: column; gap: 8px; }
.help-status-row { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-muted); }

.queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.queue-toolbar { display: flex; gap: 8px; align-items: center; }

.table-wrap { overflow-x: auto; }
.queue-table { width: 100%; }
.cell-text { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.queue-time { color: var(--text-muted); font-size: 12px; }

.category-selector { display: flex; gap: 8px; align-items: center; }
.add-cat-panel { display: flex; gap: 8px; margin-top: 8px; align-items: center; }
.custom-cat-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }

@media (max-width: 768px) {
  .import-layout { grid-template-columns: 1fr; }
}
</style>
