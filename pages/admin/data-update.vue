<template>
  <div class="du-root">
    <header class="du-header">
      <div class="du-header-main">
        <div class="du-header-icon">
          <UIcon name="i-lucide-building-2" class="size-5" />
        </div>
        <div>
          <h1 class="du-title">企业数据更新</h1>
          <p class="du-subtitle">选择企业后编辑可变更信息，还可上传文件解析更新</p>
        </div>
      </div>
    </header>

    <!-- 企业搜索 -->
    <div class="du-search card">
      <label class="du-label">选择企业</label>
      <CompanySearchSuggest
        :query="searchQuery"
        :companies="companyList"
        :max-items="10"
        @select="onSelectCompany"
      >
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          size="lg"
          placeholder="输入企业名称、统一社会信用代码搜索..."
          class="w-full"
          :loading="listLoading"
          @focus="ensureCompanyList"
        />
      </CompanySearchSuggest>
      <div v-if="selected" class="du-selected">
        <span class="du-selected-avatar">{{ selected.company_name.charAt(0) }}</span>
        <div class="du-selected-info">
          <div class="du-selected-name">
            {{ selected.company_name }}
            <UBadge v-if="selected.company_traded === 1" label="上市" color="warning" variant="soft" size="xs" />
          </div>
          <div class="du-selected-meta">
            <span v-if="selected.company_credit_code">{{ selected.company_credit_code }}</span>
            <span v-if="selected.company_city">{{ selected.company_city }}{{ selected.conpany_district || '' }}</span>
          </div>
        </div>
        <UButton variant="ghost" color="neutral" size="sm" icon="i-lucide-x" @click="clearSelection" />
      </div>
    </div>

    <template v-if="selected">
      <div class="du-layout">
        <!-- 主表单区 -->
        <main class="du-main">
          <!-- 基本信息 -->
          <section class="du-section card">
            <div class="du-section-head">
              <div class="du-section-title">
                <UIcon name="i-lucide-building-2" class="size-4" />
                基本信息
              </div>
            </div>
            <div class="du-form-grid">
              <div class="du-field du-field--full">
                <label class="du-label">公司名</label>
                <UInput v-model="form.company_name" placeholder="公司名" />
              </div>
              <div class="du-field">
                <label class="du-label">统一信用编号</label>
                <UInput v-model="form.company_credit_code" placeholder="统一社会信用代码" disabled />
              </div>
              <div class="du-field du-field--full">
                <label class="du-label">公司办公地址</label>
                <UInput v-model="form.company_work_add" placeholder="公司办公地址" />
              </div>
              <div class="du-field">
                <label class="du-label">经度</label>
                <UInput v-model="form.company_longitude" type="number" step="any" placeholder="经度" />
              </div>
              <div class="du-field">
                <label class="du-label">纬度</label>
                <UInput v-model="form.company_latitude" type="number" step="any" placeholder="纬度" />
              </div>
            </div>
          </section>

          <!-- 产业分类 -->
          <section class="du-section card">
            <div class="du-section-head">
              <div class="du-section-title">
                <UIcon name="i-lucide-network" class="size-4" />
                产业分类
              </div>
            </div>
            <div class="du-form-grid">
              <div class="du-field">
                <label class="du-label">产业链大类</label>
                <UInput v-model="form.company_industry" placeholder="如 集成电路 / 材料 / 化合物" />
              </div>
              <div class="du-field">
                <label class="du-label">分类</label>
                <UInput v-model="form.info_type_name" placeholder="如 集成电路 / 材料" />
              </div>
              <div class="du-field">
                <label class="du-label">产业链环节</label>
                <UInput v-model="form.chain_name" placeholder="如 材料 / 模组" />
              </div>
              <div class="du-field">
                <label class="du-label">产品类别</label>
                <UInput v-model="form.product_type" placeholder="如 模拟芯片，多个用逗号分隔" />
              </div>
            </div>
          </section>

          <!-- 企业属性 -->
          <section class="du-section card">
            <div class="du-section-head">
              <div class="du-section-title">
                <UIcon name="i-lucide-tags" class="size-4" />
                企业属性
              </div>
            </div>
            <div class="du-form-grid">
              <div class="du-field du-field--full">
                <label class="du-label">公司所属园区</label>
                <USelectMenu
                  v-model="form.park_ids"
                  :items="parkOptions"
                  value-key="value"
                  multiple
                  placeholder="选择园区（可多选）"
                  class="w-full"
                />
                <p class="du-field-hint">下拉选项来自园区接口，后续支持创建新园区</p>
              </div>
              <div class="du-field">
                <label class="du-label">公司来源</label>
                <USelect
                  v-model="form.company_source"
                  :items="companySourceOptions"
                  placeholder="选择来源"
                  class="w-full"
                />
              </div>
              <div class="du-field">
                <label class="du-label">机构类型</label>
                <UInput v-model="form.val_org_type" placeholder="如 检测机构 / 销售中心，多个用逗号分隔" />
              </div>
              <div class="du-field">
                <label class="du-label">是否上市</label>
                <USelect
                  v-model="form.company_traded"
                  :items="listedOptions"
                  placeholder="选择上市状态"
                  class="w-full"
                />
              </div>
            </div>
          </section>

          <!-- 联系信息 -->
          <section class="du-section card">
            <div class="du-section-head">
              <div class="du-section-title">
                <UIcon name="i-lucide-phone" class="size-4" />
                联系信息
              </div>
            </div>
            <div class="du-form-grid">
              <div class="du-field">
                <label class="du-label">联系人</label>
                <UInput v-model="form.contact_person" placeholder="联系人" />
              </div>
              <div class="du-field">
                <label class="du-label">联系电话</label>
                <UInput v-model="form.company_phone" placeholder="联系电话" />
              </div>
            </div>
          </section>

          <!-- 经营数据 -->
          <section class="du-section card">
            <div class="du-section-head">
              <div class="du-section-title">
                <UIcon name="i-lucide-bar-chart-3" class="size-4" />
                经营数据
              </div>
            </div>
            <div class="du-form-grid">
              <div class="du-field">
                <label class="du-label">规上营收（亿元）</label>
                <UInput v-model="form.above_scale" type="number" step="any" placeholder="数字" />
              </div>
              <div class="du-field">
                <label class="du-label">规上营收类别</label>
                <UInput v-model="form.remark" placeholder="规上营收类别" />
              </div>
              <div class="du-field">
                <label class="du-label">公司规模</label>
                <UInput v-model="form.company_scale" placeholder="如 大型 / 中型" />
              </div>
              <div class="du-field">
                <label class="du-label">公司性质</label>
                <UInput v-model="form.company_nature" placeholder="如 民营 / 国企" />
              </div>
              <div class="du-field">
                <label class="du-label">公司评分</label>
                <UInput v-model="form.company_score" type="number" step="any" placeholder="float" />
              </div>
            </div>
          </section>

          <!-- 融资与专利 -->
          <section class="du-section card">
            <div class="du-section-head">
              <div class="du-section-title">
                <UIcon name="i-lucide-trending-up" class="size-4" />
                融资与专利
              </div>
            </div>
            <div class="du-form-grid">
              <div class="du-field">
                <label class="du-label">融资轮次</label>
                <UInput v-model="form.company_financing_round" placeholder="融资轮次" />
              </div>
              <div class="du-field">
                <label class="du-label">最新融资时间</label>
                <DatePicker v-model="form.latest_financing_date" placeholder="选择日期" />
              </div>
              <div class="du-field">
                <label class="du-label">最新融资金额</label>
                <UInput v-model="form.latest_financing_amount" placeholder="最新融资金额" />
              </div>
              <div class="du-field">
                <label class="du-label">授权专利数</label>
                <UInput v-model="form.authorized_patents_count" type="number" placeholder="整数" />
              </div>
              <div class="du-field">
                <label class="du-label">授权发明专利数量</label>
                <UInput v-model="form.authorized_invention_patents_count" type="number" placeholder="整数" />
              </div>
              <div class="du-field">
                <label class="du-label">创新平台（家）</label>
                <UInput v-model="form.innovation_platform_count" type="number" placeholder="整数" />
              </div>
              <div class="du-field">
                <label class="du-label">参研标准（项）</label>
                <UInput v-model="form.participated_standards_count" type="number" placeholder="整数" />
              </div>
              <div class="du-field">
                <label class="du-label">国家标准（项）</label>
                <UInput v-model="form.national_standards_count" type="number" placeholder="整数" />
              </div>
            </div>
          </section>

          <!-- 其他 -->
          <section class="du-section card">
            <div class="du-section-head">
              <div class="du-section-title">
                <UIcon name="i-lucide-align-left" class="size-4" />
                其他
              </div>
            </div>
            <div class="du-form-grid">
              <div class="du-field du-field--full">
                <label class="du-label">招商推荐原因</label>
                <UTextarea v-model="form.investment_reason" :rows="3" placeholder="招商推荐原因" />
              </div>
            </div>
          </section>
        </main>

        <!-- 侧边栏 -->
        <aside class="du-aside">
          <!-- 企业概要 -->
          <section class="du-aside-card card">
            <div class="du-aside-title">
              <UIcon name="i-lucide-info" class="size-4" />
              企业概要
            </div>
            <dl class="du-summary">
              <div class="du-summary-row">
                <dt>产业链大类</dt>
                <dd>{{ form.company_industry || '-' }}</dd>
              </div>
              <div class="du-summary-row">
                <dt>分类</dt>
                <dd>{{ form.info_type_name || '-' }}</dd>
              </div>
              <div class="du-summary-row">
                <dt>产业链环节</dt>
                <dd>{{ form.chain_name || '-' }}</dd>
              </div>
              <div class="du-summary-row">
                <dt>产品类别</dt>
                <dd>{{ form.product_type || '-' }}</dd>
              </div>
              <div class="du-summary-row">
                <dt>公司来源</dt>
                <dd>{{ sourceLabel(form.company_source) }}</dd>
              </div>
              <div class="du-summary-row">
                <dt>是否上市</dt>
                <dd>{{ form.company_traded === 1 ? '上市' : form.company_traded === 0 ? '未上市' : '-' }}</dd>
              </div>
              <div class="du-summary-row">
                <dt>规上营收</dt>
                <dd>{{ form.above_scale !== '' && form.above_scale != null ? `${form.above_scale} 亿元` : '-' }}</dd>
              </div>
              <div class="du-summary-row">
                <dt>公司评分</dt>
                <dd>{{ form.company_score || '-' }}</dd>
              </div>
            </dl>
          </section>

          <!-- 文件解析更新 -->
          <section class="du-aside-card card">
            <div class="du-aside-title">
              <UIcon name="i-lucide-file-up" class="size-4" />
              文件解析更新
            </div>
            <p class="du-aside-desc">
              上传企业相关数据文件，系统将解析并更新该企业数据。
            </p>

            <div
              class="du-upload"
              :class="{ 'du-upload--active': dragActive, 'du-upload--has': !!uploadFile }"
              @dragover.prevent="dragActive = true"
              @dragleave.prevent="dragActive = false"
              @drop.prevent="onDrop"
              @click="fileInputRef?.click()"
            >
              <template v-if="!uploadFile">
                <UIcon name="i-lucide-cloud-upload" class="du-upload-icon size-8" />
                <div class="du-upload-text">
                  {{ dragActive ? '松开以添加文件' : '点击选择文件，或拖拽到此处' }}
                </div>
                <div class="du-upload-hint">支持 PDF、DOCX、XLSX、TXT、MD、HTML，单文件不超过 20MB</div>
              </template>
              <template v-else>
                <UIcon name="i-lucide-file-check-2" class="du-upload-icon size-8" style="color: var(--success)" />
                <div class="du-upload-text" style="color: var(--success)">{{ uploadFile.name }}</div>
                <div class="du-upload-hint">{{ formatSize(uploadFile.size) }} · 点击更换</div>
              </template>
              <input
                ref="fileInputRef"
                type="file"
                accept=".pdf,.docx,.xlsx,.xls,.txt,.md,.html,.htm"
                class="du-upload-input"
                @change="onFileChange"
              />
            </div>

            <div v-if="uploadError" class="du-error">{{ uploadError }}</div>

            <div class="du-upload-actions">
              <UButton
                color="primary"
                icon="i-lucide-sparkles"
                :loading="uploading"
                :disabled="!uploadFile"
                @click="submitUpload"
              >
                解析并更新
              </UButton>
              <UButton v-if="uploadFile" variant="ghost" @click="clearUpload">清除</UButton>
            </div>

            <div v-if="uploadTasks.length" class="du-tasks">
              <div class="du-tasks-title">上传记录</div>
              <div v-for="task in uploadTasks" :key="task.id" class="du-task">
                <UIcon :name="taskIcon(task.status)" class="size-4" :class="`du-task-icon--${task.status}`" />
                <div class="du-task-body">
                  <div class="du-task-name">{{ task.fileName }}</div>
                  <div class="du-task-meta">{{ task.time }} · {{ task.message }}</div>
                </div>
                <UBadge :label="taskStatusLabel(task.status)" :color="taskStatusColor(task.status)" variant="soft" size="xs" />
              </div>
            </div>
          </section>
        </aside>
      </div>

      <!-- 浮动操作栏 -->
      <Transition name="du-bar">
        <div v-if="isDirty" class="du-actionbar">
          <div class="du-actionbar-inner">
            <div class="du-actionbar-info">
              <UIcon name="i-lucide-circle-dot" class="size-4" />
              <span>{{ changedFields.length }} 项已修改</span>
            </div>
            <div class="du-actionbar-actions">
              <UButton variant="ghost" color="neutral" :disabled="saving" @click="resetForm">
                重置
              </UButton>
              <UButton
                color="primary"
                icon="i-lucide-save"
                :loading="saving"
                @click="saveBasicInfo"
              >
                保存修改
              </UButton>
            </div>
          </div>
        </div>
      </Transition>
    </template>

    <div v-else-if="listLoading" class="du-empty card">
      <UIcon name="i-lucide-loader-circle" class="size-8 du-spin" />
      <p class="du-empty-title">正在加载企业列表...</p>
    </div>

    <div v-else class="du-empty card">
      <UIcon name="i-lucide-search" class="size-10" />
      <p class="du-empty-title">请先搜索并选择一家企业</p>
      <p class="du-empty-desc">选择后可更新数据，或上传文件解析更新企业数据</p>
    </div>

    <UAlert
      v-if="toast.show"
      class="du-toast"
      :color="toast.color"
      variant="soft"
      :icon="toast.color === 'success' ? 'i-lucide-circle-check' : 'i-lucide-circle-alert'"
      :title="toast.message"
      @close="toast.show = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { CompanyRecord } from '~/types/company'
import { fetchCompanies, fetchCompanyByCode } from '~/types/company'
import { request } from '~/utils/request'

definePageMeta({ middleware: ['auth', 'admin'], keepalive: true })

type ParkItem = { park_id: number; park_name: string; num?: number }

interface EditForm {
  company_name: string
  company_credit_code: string
  company_work_add: string
  company_longitude: string
  company_latitude: string
  park_ids: number[]
  company_source: number | undefined
  val_org_type: string
  company_traded: number | undefined
  chain_name: string
  info_type_name: string
  company_industry: string
  product_type: string
  contact_person: string
  company_phone: string
  above_scale: string
  remark: string
  company_scale: string
  company_nature: string
  company_financing_round: string
  company_score: string
  authorized_patents_count: string
  authorized_invention_patents_count: string
  investment_reason: string
  innovation_platform_count: string
  latest_financing_date: string
  latest_financing_amount: string
  participated_standards_count: string
  national_standards_count: string
}

type TaskStatus = 'pending' | 'parsing' | 'done' | 'error'

interface UploadTask {
  id: string
  fileName: string
  time: string
  status: TaskStatus
  message: string
}

const EMPTY_FORM = (): EditForm => ({
  company_name: '',
  company_credit_code: '',
  company_work_add: '',
  company_longitude: '',
  company_latitude: '',
  park_ids: [],
  company_source: undefined,
  val_org_type: '',
  company_traded: undefined,
  chain_name: '',
  info_type_name: '',
  company_industry: '',
  product_type: '',
  contact_person: '',
  company_phone: '',
  above_scale: '',
  remark: '',
  company_scale: '',
  company_nature: '',
  company_financing_round: '',
  company_score: '',
  authorized_patents_count: '',
  authorized_invention_patents_count: '',
  investment_reason: '',
  innovation_platform_count: '',
  latest_financing_date: '',
  latest_financing_amount: '',
  participated_standards_count: '',
  national_standards_count: '',
})

const companySourceOptions = [
  { label: '本土培育', value: 1 },
  { label: '招商引资', value: 2 },
]

const listedOptions = [
  { label: '未上市', value: 0 },
  { label: '上市', value: 1 },
]

const parkList = ref<ParkItem[]>([])
const parkOptions = computed(() =>
  parkList.value.map(p => ({ label: p.park_name, value: p.park_id })),
)

const searchQuery = ref('')
const companyList = ref<CompanyRecord[]>([])
const listLoading = ref(false)
const listLoaded = ref(false)

const selected = ref<CompanyRecord | null>(null)
const form = reactive<EditForm>(EMPTY_FORM())
const formSnapshot = ref('')
const saving = ref(false)

const uploadFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const dragActive = ref(false)
const uploadError = ref('')
const uploading = ref(false)
const uploadTasks = ref<UploadTask[]>([])

const toast = reactive({
  show: false,
  message: '',
  color: 'success' as 'success' | 'error',
})

const isDirty = computed(() => JSON.stringify(form) !== formSnapshot.value)

const changedFields = computed(() => {
  if (!formSnapshot.value) return []
  try {
    const snapshot = JSON.parse(formSnapshot.value) as Record<string, unknown>
    return (Object.keys(form) as (keyof EditForm)[]).filter(
      key => form[key] !== snapshot[key],
    )
  } catch {
    return []
  }
})

function showToast(message: string, color: 'success' | 'error' = 'success') {
  toast.message = message
  toast.color = color
  toast.show = true
  setTimeout(() => { toast.show = false }, 3200)
}

function toInputString(value: unknown): string {
  if (value == null || value === '') return ''
  return String(value)
}

function sourceLabel(source: number | undefined): string {
  if (source === 1) return '本土培育'
  if (source === 2) return '招商引资'
  return '-'
}

function resolveCompanySource(c: CompanyRecord): number | undefined {
  if (c.company_source === 1 || c.company_source === 2) return c.company_source
  if (c.tag_name === '本土培育') return 1
  if (c.tag_name === '招商引资') return 2
  return undefined
}

function fillForm(c: CompanyRecord) {
  form.company_name = c.company_name || ''
  form.company_credit_code = c.company_credit_code || ''
  form.company_work_add = c.company_work_add || ''
  form.company_longitude = toInputString(c.company_longitude)
  form.company_latitude = toInputString(c.company_latitude)
  form.park_ids = []
  form.company_source = resolveCompanySource(c)
  form.val_org_type = c.val_org_type && c.val_org_type !== '-' ? c.val_org_type : ''
  form.company_traded = c.company_traded === 1 ? 1 : c.company_traded === 0 ? 0 : undefined
  form.chain_name = c.chain_name && c.chain_name !== '-' ? c.chain_name : ''
  form.info_type_name = c.info_type_name && c.info_type_name !== '-' ? c.info_type_name : ''
  form.company_industry = c.company_industry && c.company_industry !== '-' ? c.company_industry : ''
  form.product_type = c.product_type && c.product_type !== '-' ? c.product_type : ''
  form.contact_person = ''
  form.company_phone = c.company_phone && c.company_phone !== '-' ? c.company_phone : ''
  form.above_scale = c.above_scale != null ? toInputString(c.above_scale) : ''
  form.remark = c.remark && c.remark !== '-' ? c.remark : ''
  form.company_scale = c.company_scale && c.company_scale !== '-' ? c.company_scale : ''
  form.company_nature = c.company_nature && c.company_nature !== '-' ? c.company_nature : ''
  form.company_financing_round = c.company_financing_round && c.company_financing_round !== '-' ? c.company_financing_round : ''
  form.company_score = c.company_score ? toInputString(c.company_score) : ''
  form.authorized_patents_count = c.authorized_patents_count ? toInputString(c.authorized_patents_count) : ''
  form.authorized_invention_patents_count = c.authorized_invention_patents_count ? toInputString(c.authorized_invention_patents_count) : ''
  form.investment_reason = c.honrs && c.honrs !== '-' ? c.honrs : ''
  form.innovation_platform_count = c.hornor_num ? toInputString(c.hornor_num) : ''
  form.latest_financing_date = c.latest_financing_date && c.latest_financing_date !== '-' ? c.latest_financing_date.slice(0, 10) : ''
  form.latest_financing_amount = ''
  form.participated_standards_count = c.participated_standards_count ? toInputString(c.participated_standards_count) : ''
  form.national_standards_count = c.national_standards_count ? toInputString(c.national_standards_count) : ''
  formSnapshot.value = JSON.stringify(form)
}

function buildSavePayload() {
  const toNum = (v: string) => (v === '' ? null : Number(v))
  const toInt = (v: string) => (v === '' ? null : Number.parseInt(v, 10))
  return {
    table: 'company',
    company_name: form.company_name,
    company_credit_code: form.company_credit_code,
    company_work_add: form.company_work_add || null,
    company_longitude: toNum(form.company_longitude),
    company_latitude: toNum(form.company_latitude),
    park_ids: form.park_ids,
    company_source: form.company_source ?? null,
    tag_name: form.company_source != null ? sourceLabel(form.company_source) : null,
    val_org_type: form.val_org_type || null,
    company_traded: form.company_traded ?? null,
    chain_name: form.chain_name || null,
    info_type_name: form.info_type_name || null,
    company_industry: form.company_industry || null,
    product_type: form.product_type || null,
    contact_person: form.contact_person || null,
    company_phone: form.company_phone || null,
    above_scale: toNum(form.above_scale),
    remark: form.remark || null,
    company_scale: form.company_scale || null,
    company_nature: form.company_nature || null,
    company_financing_round: form.company_financing_round || null,
    company_score: toNum(form.company_score),
    authorized_patents_count: toInt(form.authorized_patents_count),
    authorized_invention_patents_count: toInt(form.authorized_invention_patents_count),
    investment_reason: form.investment_reason || null,
    innovation_platform_count: toInt(form.innovation_platform_count),
    latest_financing_date: form.latest_financing_date || null,
    latest_financing_amount: form.latest_financing_amount || null,
    participated_standards_count: toInt(form.participated_standards_count),
    national_standards_count: toInt(form.national_standards_count),
  }
}

async function loadParkOptions() {
  try {
    const res = await request.get('/company/park')
    if (res.data?.code === 0 && Array.isArray(res.data.data)) {
      parkList.value = res.data.data
    }
  } catch (e) {
    console.error('加载园区列表失败', e)
  }
}

async function ensureCompanyList() {
  if (listLoaded.value || listLoading.value) return
  listLoading.value = true
  try {
    const all: CompanyRecord[] = []
    let page = 1
    const pageSize = 200
    while (page <= 15) {
      const res = await fetchCompanies(page, pageSize)
      if (res.code !== 0 || !res.data?.list?.length) break
      for (const c of res.data.list) {
        all.push({
          ...c,
          id: c.company_credit_code || `${c.company_name}-${c.company_longitude}`,
        })
      }
      if (res.data.list.length < pageSize) break
      page++
    }
    companyList.value = all
    listLoaded.value = true
  } catch (e) {
    console.error('加载企业列表失败', e)
    showToast('加载企业列表失败', 'error')
  } finally {
    listLoading.value = false
  }
}

async function onSelectCompany(c: CompanyRecord) {
  searchQuery.value = c.company_name
  selected.value = c
  fillForm(c)
  clearUpload()

  if (c.company_credit_code) {
    try {
      const detail = await fetchCompanyByCode(c.company_credit_code)
      if (detail) {
        selected.value = detail
        fillForm(detail)
      }
    } catch {
      // 使用列表数据即可
    }
  }
}

function clearSelection() {
  selected.value = null
  searchQuery.value = ''
  Object.assign(form, EMPTY_FORM())
  formSnapshot.value = ''
  clearUpload()
}

function resetForm() {
  if (!selected.value) return
  fillForm(selected.value)
}

async function saveBasicInfo() {
  if (!selected.value || !isDirty.value) return
  saving.value = true
  try {
    const payload = buildSavePayload()
    // 前端占位：实际保存接口对接后替换此处
    // await request.put(`/company/${selected.value.company_credit_code}`, payload)
    console.info('[data-update] save payload', payload)
    await new Promise(r => setTimeout(r, 600))
    selected.value = {
      ...selected.value,
      company_name: form.company_name,
      company_work_add: form.company_work_add || null,
      company_longitude: Number(form.company_longitude) || selected.value.company_longitude,
      company_latitude: Number(form.company_latitude) || selected.value.company_latitude,
      company_source: form.company_source ?? selected.value.company_source,
      tag_name: form.company_source != null ? sourceLabel(form.company_source) : selected.value.tag_name,
      val_org_type: form.val_org_type || selected.value.val_org_type,
      company_traded: form.company_traded ?? selected.value.company_traded,
      chain_name: form.chain_name || selected.value.chain_name,
      info_type_name: form.info_type_name || selected.value.info_type_name,
      company_industry: form.company_industry || selected.value.company_industry,
      product_type: form.product_type || selected.value.product_type,
      company_phone: form.company_phone || selected.value.company_phone,
      above_scale: form.above_scale === '' ? null : Number(form.above_scale),
      remark: form.remark || null,
      company_scale: form.company_scale || selected.value.company_scale,
      company_nature: form.company_nature || selected.value.company_nature,
      company_financing_round: form.company_financing_round || selected.value.company_financing_round,
      company_score: form.company_score === '' ? 0 : Number(form.company_score),
      authorized_patents_count: form.authorized_patents_count === '' ? 0 : Number(form.authorized_patents_count),
      authorized_invention_patents_count: form.authorized_invention_patents_count === '' ? 0 : Number(form.authorized_invention_patents_count),
      latest_financing_date: form.latest_financing_date || selected.value.latest_financing_date,
      participated_standards_count: form.participated_standards_count === '' ? 0 : Number(form.participated_standards_count),
      national_standards_count: form.national_standards_count === '' ? 0 : Number(form.national_standards_count),
      honrs: form.investment_reason || selected.value.honrs,
      hornor_num: form.innovation_platform_count === '' ? 0 : Number(form.innovation_platform_count),
    }
    formSnapshot.value = JSON.stringify(form)
    const idx = companyList.value.findIndex(
      c => c.company_credit_code === selected.value!.company_credit_code
        || c.id === selected.value!.id,
    )
    if (idx >= 0) companyList.value[idx] = { ...selected.value }
    showToast('企业数据已保存')
  } catch (e: any) {
    showToast(e?.message || '保存失败', 'error')
  } finally {
    saving.value = false
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function onDrop(e: DragEvent) {
  dragActive.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) setUploadFile(file)
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) setUploadFile(file)
  input.value = ''
}

function setUploadFile(file: File) {
  uploadError.value = ''
  const max = 20 * 1024 * 1024
  if (file.size > max) {
    uploadError.value = '文件大小不能超过 20MB'
    uploadFile.value = null
    return
  }
  uploadFile.value = file
}

function clearUpload() {
  uploadFile.value = null
  uploadError.value = ''
  dragActive.value = false
}

function nowStr() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

function taskIcon(status: TaskStatus) {
  const map: Record<TaskStatus, string> = {
    pending: 'i-lucide-clock',
    parsing: 'i-lucide-loader-circle',
    done: 'i-lucide-circle-check',
    error: 'i-lucide-circle-x',
  }
  return map[status]
}

function taskStatusLabel(status: TaskStatus) {
  const map: Record<TaskStatus, string> = {
    pending: '排队中',
    parsing: '解析中',
    done: '已完成',
    error: '失败',
  }
  return map[status]
}

function taskStatusColor(status: TaskStatus): 'neutral' | 'primary' | 'success' | 'error' {
  const map: Record<TaskStatus, 'neutral' | 'primary' | 'success' | 'error'> = {
    pending: 'neutral',
    parsing: 'primary',
    done: 'success',
    error: 'error',
  }
  return map[status]
}

async function submitUpload() {
  if (!selected.value || !uploadFile.value) return
  uploading.value = true
  uploadError.value = ''

  const task: UploadTask = {
    id: `${Date.now()}`,
    fileName: uploadFile.value.name,
    time: nowStr(),
    status: 'parsing',
    message: `关联企业：${selected.value.company_name}`,
  }
  uploadTasks.value.unshift(task)

  try {
    // 前端占位：实际解析接口对接后替换
    // const fd = new FormData()
    // fd.append('file', uploadFile.value)
    // fd.append('credit_code', selected.value.company_credit_code)
    // await request.post('/company/parse-update', fd)
    await new Promise(r => setTimeout(r, 1200))
    task.status = 'done'
    task.message = '解析完成（接口待对接，当前为前端模拟）'
    showToast('文件已提交解析')
    clearUpload()
  } catch (e: any) {
    task.status = 'error'
    task.message = e?.message || '解析失败'
    uploadError.value = task.message
    showToast(task.message, 'error')
  } finally {
    uploading.value = false
  }
}

onMounted(() => {
  ensureCompanyList()
  loadParkOptions()
})
</script>

<style scoped>
.du-root {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 24px 96px;
  position: relative;
}

/* ============================
   头部
   ============================ */
.du-header {
  margin-bottom: 20px;
}

.du-header-main {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.du-header-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.du-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-strong);
  margin: 0 0 4px;
}

.du-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

/* ============================
   搜索区
   ============================ */
.du-search {
  padding: 18px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.du-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.du-field-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
}

.du-selected {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
}

.du-selected-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.du-selected-info {
  flex: 1;
  min-width: 0;
}

.du-selected-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}

.du-selected-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* ============================
   双栏布局
   ============================ */
.du-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
  align-items: start;
}

.du-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.du-aside {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 16px;
  min-width: 0;
}

/* ============================
   表单分区
   ============================ */
.du-section {
  padding: 18px;
}

.du-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.du-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}

.du-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}

.du-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.du-field--full {
  grid-column: 1 / -1;
}

/* ============================
   侧边栏卡片
   ============================ */
.du-aside-card {
  padding: 16px;
}

.du-aside-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 12px;
}

.du-aside-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0 0 12px;
  line-height: 1.5;
}

/* 企业概要 */
.du-summary {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.du-summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid var(--border);
}

.du-summary-row:last-child {
  border-bottom: none;
}

.du-summary-row dt {
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.du-summary-row dd {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-strong);
  margin: 0;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60%;
}

/* ============================
   文件上传
   ============================ */
.du-upload {
  border: 1.5px dashed var(--border);
  border-radius: 12px;
  padding: 28px 16px;
  text-align: center;
  cursor: pointer;
  background: var(--surface-alt);
  transition: border-color 0.15s, background 0.15s;
  position: relative;
}

.du-upload:hover,
.du-upload--active {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 6%, var(--surface-alt));
}

.du-upload--has {
  border-style: solid;
  border-color: color-mix(in srgb, var(--success) 40%, var(--border));
}

.du-upload-icon {
  color: var(--text-muted);
  margin: 0 auto 8px;
}

.du-upload-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.du-upload-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 6px;
}

.du-upload-input {
  display: none;
}

.du-upload-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.du-error {
  margin-top: 8px;
  font-size: 12px;
  color: var(--danger);
}

.du-tasks {
  margin-top: 16px;
  border-top: 1px solid var(--border);
  padding-top: 12px;
}

.du-tasks-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.du-task {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--surface-alt);
  margin-bottom: 6px;
}

.du-task-icon--pending { color: var(--text-muted); }
.du-task-icon--parsing { color: var(--primary); animation: du-spin 1s linear infinite; }
.du-task-icon--done { color: var(--success); }
.du-task-icon--error { color: var(--danger); }

@keyframes du-spin {
  to { transform: rotate(360deg); }
}

.du-spin {
  animation: du-spin 1s linear infinite;
  color: var(--primary);
}

.du-task-body {
  flex: 1;
  min-width: 0;
}

.du-task-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.du-task-meta {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* ============================
   空状态 / 加载
   ============================ */
.du-empty {
  padding: 64px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  text-align: center;
}

.du-empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-strong);
  margin: 8px 0 0;
}

.du-empty-desc {
  font-size: 12px;
  margin: 0;
}

/* ============================
   浮动操作栏
   ============================ */
.du-actionbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 90;
  pointer-events: none;
  padding: 0 24px 20px;
}

.du-actionbar-inner {
  max-width: 1152px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow-md);
  pointer-events: auto;
}

.du-actionbar-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
}

.du-actionbar-actions {
  display: flex;
  gap: 8px;
}

.du-bar-enter-active,
.du-bar-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.du-bar-enter-from,
.du-bar-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

/* ============================
   Toast
   ============================ */
.du-toast {
  position: fixed;
  right: 24px;
  bottom: 88px;
  z-index: 100;
  max-width: 360px;
  box-shadow: var(--shadow-md);
}

/* ============================
   响应式
   ============================ */
@media (max-width: 960px) {
  .du-layout {
    grid-template-columns: 1fr;
  }
  .du-aside {
    position: static;
  }
}

@media (max-width: 720px) {
  .du-root {
    padding: 20px 16px 96px;
  }
  .du-form-grid {
    grid-template-columns: 1fr;
  }
  .du-actionbar {
    padding: 0 16px 16px;
  }
  .du-actionbar-inner {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .du-actionbar-actions {
    justify-content: flex-end;
  }
}
</style>
