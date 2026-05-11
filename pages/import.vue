<template>
  <div class="import-layout">
    <!-- 左侧表单 3/4 -->
    <div class="import-form-col">
      <!-- 表单卡片 -->
      <div class="card form-card">
        <div class="form-card-title">导入新文档</div>

        <!-- 标题 -->
        <div class="form-group">
          <label class="form-label">文档标题 <span class="required">*</span></label>
          <input
            v-model="form.title"
            class="form-input"
            placeholder="请输入文档标题..."
            :class="{ 'input-error': errors.title }"
          />
          <div v-if="errors.title" class="error-msg">{{ errors.title }}</div>
        </div>

        <!-- 知识分类 -->
        <div class="form-group">
          <label class="form-label">知识分类 <span class="required">*</span></label>
          <select
            v-model="form.category"
            class="form-input"
            :class="{ 'input-error': errors.category }"
          >
            <option value="">选择知识分类...</option>
            <option v-for="c in allowedCatOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
            <option value="__custom">自定义分类...</option>
          </select>
          <div v-if="errors.category" class="error-msg">{{ errors.category }}</div>
        </div>

        <!-- 自定义分类 -->
        <Transition name="slide-up">
          <div v-if="form.category === '__custom'" class="form-group">
            <label class="form-label">自定义分类名</label>
            <input
              v-model="form.customCategory"
              class="form-input"
              placeholder="输入自定义分类名..."
            />
          </div>
        </Transition>

        <!-- 文件类型 -->
        <div class="form-group">
          <label class="form-label">文件类型</label>
          <select v-model="form.fileType" class="form-input">
            <option value="pdf">PDF</option>
            <option value="docx">Word (DOCX)</option>
            <option value="xlsx">Excel (XLSX)</option>
            <option value="txt">纯文本 (TXT)</option>
            <option value="md">Markdown (MD)</option>
            <option value="html">HTML</option>
          </select>
        </div>

        <!-- 文档日期 -->
        <div class="form-group">
          <label class="form-label">文档日期</label>
          <input v-model="form.docDate" type="date" class="form-input" />
        </div>

        <!-- 切片大小 -->
        <div class="form-group">
          <label class="form-label">切片大小（字符数）</label>
          <div class="chunk-presets">
            <button
              v-for="preset in chunkPresets"
              :key="preset"
              class="preset-btn"
              :class="{ active: form.chunkSize === preset && !customChunk }"
              @click="setChunk(preset)"
            >{{ preset }}</button>
            <button
              class="preset-btn"
              :class="{ active: customChunk }"
              @click="customChunk = !customChunk"
            >自定义</button>
          </div>
          <Transition name="slide-up">
            <div v-if="customChunk" style="margin-top: 8px">
              <input
                v-model.number="form.chunkSize"
                type="number"
                class="form-input"
                min="50"
                max="4000"
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
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" class="upload-icon">
                <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="1.5"/>
                <path d="M20 28V14M13 21l7-7 7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <div class="upload-text">
                {{ dragActive ? '松开以添加文件' : '点击选择文件，或将文件拖拽到此处' }}
              </div>
              <div class="upload-hint">支持 PDF、DOCX、XLSX、TXT、MD、HTML</div>
            </template>
            <template v-else>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" class="upload-icon" style="color: var(--success)">
                <circle cx="18" cy="18" r="16" stroke="currentColor" stroke-width="1.5"/>
                <path d="M11 18l5 5 9-9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
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
          <button class="btn btn-primary" @click="submitForm" :disabled="submitting">
            <span v-if="submitting">导入中...</span>
            <template v-else>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="margin-right: 6px">
                <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              加入导入队列
            </template>
          </button>
          <button class="btn btn-ghost" @click="resetForm">重置</button>
        </div>

        <!-- 成功提示 -->
        <Transition name="fade-in">
          <div v-if="successMsg" class="success-toast">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3"/>
              <path d="M4 7l2 2 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            {{ successMsg }}
          </div>
        </Transition>
      </div>
    </div>

    <!-- 右侧帮助卡片 1/4 -->
    <div class="import-help-col">
      <div class="card help-card">
        <div class="help-title">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3"/>
            <path d="M7 6v4M7 4v.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
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
            <span class="badge badge-warning" style="font-size:10px">排队中</span>
            <span>等待解析</span>
          </div>
          <div class="help-status-row">
            <span class="badge badge-primary" style="font-size:10px">解析中</span>
            <span>正在切片向量化</span>
          </div>
          <div class="help-status-row">
            <span class="badge badge-success" style="font-size:10px">已解析</span>
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
        <div class="search-wrapper" style="width: 200px">
          <svg class="search-icon" width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" stroke-width="1.3"/>
            <path d="M8.5 8.5l3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <input
            v-model="queueSearch"
            class="form-input"
            style="padding-left: 30px; height: 33px; font-size: 12px;"
            placeholder="搜索任务..."
          />
        </div>
        <select v-model="queueStatusFilter" class="form-input" style="height: 33px; font-size: 12px; width: 100px;">
          <option value="all">全部状态</option>
          <option value="排队中">排队中</option>
          <option value="解析中">解析中</option>
          <option value="已解析">已解析</option>
        </select>
      </div>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>文件名</th>
            <th>分类</th>
            <th>文件类型</th>
            <th>切片大小</th>
            <th>状态</th>
            <th>创建时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(task, i) in filteredQueue" :key="task.id" :class="i % 2 === 0 ? 'row-even' : 'row-odd'">
            <td>
              <span class="cell-text" style="max-width: 220px">{{ task.file_name }}</span>
            </td>
            <td>{{ task.category }}</td>
            <td><span class="badge badge-outline" style="font-size:10px; text-transform: uppercase">{{ task.file_type }}</span></td>
            <td>{{ task.chunk_size }}</td>
            <td>
              <span class="badge" :class="taskStatusBadge(task.status)">{{ task.status }}</span>
            </td>
            <td style="color: var(--text-muted); font-size: 12px">{{ task.submitted_at }}</td>
          </tr>
          <tr v-if="filteredQueue.length === 0">
            <td colspan="6" style="text-align:center; padding: 32px; color: var(--text-muted); font-size: 13px">暂无任务</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES, IMPORT_TASKS_INIT } from '~/data/mock'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const allowedCategories = computed(() => authStore.user?.allowedCategories || [])

const allowedCatOptions = computed(() =>
  CATEGORIES.filter(c => allowedCategories.value.includes(c.key)).map(c => ({ value: c.key, label: c.name }))
)

const chunkPresets = [200, 500, 800, 1200]

const form = reactive({
  title: '',
  category: '',
  customCategory: '',
  fileType: 'pdf',
  docDate: new Date().toISOString().slice(0, 10),
  chunkSize: 500,
  file: null as File | null
})

const errors = reactive({ title: '', category: '', file: '' })
const customChunk = ref(false)
const dragActive = ref(false)
const submitting = ref(false)
const successMsg = ref('')
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
    tasks = tasks.filter(t => t.filename.toLowerCase().includes(kw) || t.category.toLowerCase().includes(kw))
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

  const catLabel =
    form.category === '__custom'
      ? form.customCategory || '自定义'
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

  submitting.value = false
  successMsg.value = `"${form.file!.name}" 已成功加入导入队列`
  setTimeout(() => { successMsg.value = '' }, 4000)
  resetForm()
}

function resetForm() {
  form.title = ''
  form.category = ''
  form.customCategory = ''
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

function taskStatusBadge(status: string) {
  const map: Record<string, string> = {
    '排队中': 'badge-warning',
    '解析中': 'badge-primary',
    '已解析': 'badge-success'
  }
  return map[status] || 'badge-secondary'
}
</script>

<style scoped>
.import-layout {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 20px;
  margin-bottom: 0;
}

.form-card {
  padding: 24px;
}

.form-card-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 20px;
}

.form-group { margin-bottom: 18px; }

.required { color: var(--danger); }

.error-msg { font-size: 11px; color: var(--danger); margin-top: 4px; }

.input-error { border-color: var(--danger); }

/* Chunk presets */
.chunk-presets { display: flex; gap: 8px; flex-wrap: wrap; }

.preset-btn {
  padding: 5px 14px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  font-family: 'Inter', sans-serif;
  transition: all 0.15s;
}

.preset-btn:hover { border-color: var(--primary); color: var(--primary); }
.preset-btn.active { background: var(--primary); color: white; border-color: var(--primary); }

/* Upload zone */
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

.upload-icon {
  color: var(--text-muted);
  margin-bottom: 12px;
}

.upload-text { font-size: 13px; color: var(--text); margin-bottom: 4px; }
.upload-hint { font-size: 11px; color: var(--text-muted); }

/* form actions */
.form-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.success-toast {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--success);
  margin-top: 12px;
}

/* Help card */
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

.help-list {
  padding-left: 18px;
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.8;
}

.help-divider { border-top: 1px solid var(--border); margin: 14px 0; }

.help-sub-title { font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 10px; }

.help-status-list { display: flex; flex-direction: column; gap: 8px; }

.help-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted);
}

/* Queue */
.queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.queue-toolbar { display: flex; gap: 8px; align-items: center; }

/* Shared table */
.table-wrap { overflow-x: auto; }

.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }

.data-table th {
  background: var(--surface-alt);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table td {
  padding: 10px 14px;
  color: var(--text);
  border-bottom: 1px solid var(--border);
}

.cell-text { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.row-even { background: var(--surface); }
.row-odd { background: color-mix(in srgb, var(--surface-alt) 60%, var(--surface)); }

@media (max-width: 768px) {
  .import-layout { grid-template-columns: 1fr; }
}
</style>
