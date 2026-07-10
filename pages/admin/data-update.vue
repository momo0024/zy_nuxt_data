<template>
  <div class="du-root">
    <header class="du-header">
      <div class="du-header-main">
        <div class="du-header-icon">
          <UIcon name="i-lucide-database-zap" class="size-5" />
        </div>
        <div>
          <h1 class="du-title">企业数据更新</h1>
          <p class="du-subtitle">管理企业库、地图边界与新闻资讯的数据同步状态</p>
        </div>
      </div>
      <UButton
        color="primary"
        icon="i-lucide-refresh-cw"
        :loading="syncingAll"
        @click="syncAll"
      >
        全部检测
      </UButton>
    </header>

    <div class="du-cards">
      <div
        v-for="mod in modules"
        :key="mod.id"
        class="du-card card"
        :class="{ 'du-card--loading': mod.status === 'loading' }"
      >
        <div class="du-card-head">
          <div class="du-card-icon" :style="{ background: mod.color }">
            <UIcon :name="mod.icon" class="size-4 text-white" />
          </div>
          <div class="du-card-meta">
            <div class="du-card-name">{{ mod.name }}</div>
            <div class="du-card-desc">{{ mod.desc }}</div>
          </div>
          <UBadge
            :label="statusLabel(mod.status)"
            :color="statusColor(mod.status)"
            variant="soft"
            size="sm"
          />
        </div>

        <div class="du-card-stats">
          <div class="du-stat">
            <span class="du-stat-val">{{ mod.count ?? '—' }}</span>
            <span class="du-stat-lbl">{{ mod.countLabel }}</span>
          </div>
          <div class="du-stat">
            <span class="du-stat-val du-stat-val--sm">{{ mod.lastSync || '未检测' }}</span>
            <span class="du-stat-lbl">最近检测</span>
          </div>
        </div>

        <div v-if="mod.message" class="du-card-msg" :class="`du-card-msg--${mod.status}`">
          {{ mod.message }}
        </div>

        <div class="du-card-actions">
          <UButton
            size="sm"
            variant="outline"
            icon="i-lucide-refresh-cw"
            :loading="mod.status === 'loading'"
            @click="syncModule(mod.id)"
          >
            检测连接
          </UButton>
        </div>
      </div>
    </div>

    <div class="du-log card">
      <div class="du-log-head">
        <div class="du-log-title">
          <UIcon name="i-lucide-scroll-text" class="size-4" />
          操作记录
        </div>
        <UButton
          v-if="logs.length"
          size="xs"
          variant="ghost"
          color="neutral"
          @click="clearLogs"
        >
          清空
        </UButton>
      </div>
      <div v-if="!logs.length" class="du-log-empty">暂无操作记录，点击「检测连接」开始</div>
      <div v-else class="du-log-list">
        <div v-for="log in logs" :key="log.id" class="du-log-item">
          <span class="du-log-time">{{ log.time }}</span>
          <UBadge :label="log.module" variant="soft" size="xs" />
          <span class="du-log-text" :class="{ 'du-log-text--error': !log.success }">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { fetchCompanies } from '~/types/company'
import { newsRequest } from '~/utils/request'

definePageMeta({ middleware: ['auth', 'admin'], keepalive: true })

type ModuleStatus = 'idle' | 'loading' | 'ok' | 'error'

interface DataModule {
  id: string
  name: string
  desc: string
  icon: string
  color: string
  countLabel: string
  count: string | number | null
  lastSync: string
  status: ModuleStatus
  message: string
}

interface SyncLog {
  id: string
  time: string
  module: string
  message: string
  success: boolean
}

const GEO_FILES = [
  'park_areas_gcj02.json',
  'region_gcj02.json',
  'hubei-cities_gcj02.json',
  '高新区范围_gcj02.json',
]

const modules = ref<DataModule[]>([
  {
    id: 'company',
    name: '企业数据库',
    desc: '8096 企业主库，供产业图谱与企业地图使用',
    icon: 'i-lucide-building-2',
    color: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    countLabel: '企业总数',
    count: null,
    lastSync: '',
    status: 'idle',
    message: '',
  },
  {
    id: 'geo',
    name: '地图边界数据',
    desc: '园区、区域、城市边界 GeoJSON 静态资源',
    icon: 'i-lucide-map',
    color: 'linear-gradient(135deg, #0891b2, #06b6d4)',
    countLabel: '可用文件',
    count: null,
    lastSync: '',
    status: 'idle',
    message: '',
  },
  {
    id: 'news',
    name: '新闻资讯库',
    desc: 'zy-news 后端，供新闻中心与会议监测使用',
    icon: 'i-lucide-newspaper',
    color: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
    countLabel: '来源数量',
    count: null,
    lastSync: '',
    status: 'idle',
    message: '',
  },
])

const logs = ref<SyncLog[]>([])
const syncingAll = ref(false)

function nowStr() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

function getModule(id: string) {
  return modules.value.find(m => m.id === id)!
}

function addLog(module: string, message: string, success: boolean) {
  logs.value.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time: nowStr(),
    module,
    message,
    success,
  })
  if (logs.value.length > 50) logs.value.length = 50
}

function statusLabel(status: ModuleStatus) {
  const map: Record<ModuleStatus, string> = {
    idle: '待检测',
    loading: '检测中',
    ok: '正常',
    error: '异常',
  }
  return map[status]
}

function statusColor(status: ModuleStatus): 'neutral' | 'primary' | 'success' | 'error' {
  const map: Record<ModuleStatus, 'neutral' | 'primary' | 'success' | 'error'> = {
    idle: 'neutral',
    loading: 'primary',
    ok: 'success',
    error: 'error',
  }
  return map[status]
}

async function syncCompany() {
  const mod = getModule('company')
  mod.status = 'loading'
  mod.message = ''
  try {
    const res = await fetchCompanies(1, 1)
    if (res.code === 0) {
      mod.count = res.data?.total ?? 0
      mod.status = 'ok'
      mod.message = '企业库连接正常'
      mod.lastSync = nowStr()
      addLog('企业数据库', `连接成功，共 ${mod.count} 家企业`, true)
    } else {
      throw new Error(res.msg || '接口返回异常')
    }
  } catch (e: any) {
    mod.status = 'error'
    mod.message = e?.message || '连接失败'
    addLog('企业数据库', mod.message, false)
  }
}

async function syncGeo() {
  const mod = getModule('geo')
  mod.status = 'loading'
  mod.message = ''
  let okCount = 0
  const missing: string[] = []
  for (const file of GEO_FILES) {
    try {
      await $fetch(`/geo/${file}`, { method: 'HEAD' })
      okCount++
    } catch {
      missing.push(file)
    }
  }
  mod.count = `${okCount}/${GEO_FILES.length}`
  mod.lastSync = nowStr()
  if (missing.length === 0) {
    mod.status = 'ok'
    mod.message = '全部边界文件可访问'
    addLog('地图边界', '全部 GeoJSON 文件检测通过', true)
  } else {
    mod.status = 'error'
    mod.message = `缺失：${missing.join('、')}`
    addLog('地图边界', mod.message, false)
  }
}

async function syncNews() {
  const mod = getModule('news')
  mod.status = 'loading'
  mod.message = ''
  try {
    const res = await newsRequest.get<{ sources?: unknown[] }>('/sources')
    const data = res.data as { code?: number; msg?: string; data?: { sources?: unknown[] } | unknown[] }
    const payload = data?.data
    const sources = Array.isArray(payload) ? payload : (payload as { sources?: unknown[] })?.sources
    if (data?.code === 0 || sources) {
      mod.count = sources?.length ?? 0
      mod.status = 'ok'
      mod.message = '新闻后端连接正常'
      mod.lastSync = nowStr()
      addLog('新闻资讯', `连接成功，${mod.count} 个来源`, true)
    } else {
      throw new Error(data?.msg || '接口返回异常')
    }
  } catch (e: any) {
    mod.status = 'error'
    mod.message = e?.message || '连接失败，请确认 zy-news 服务已启动'
    addLog('新闻资讯', mod.message, false)
  }
}

async function syncModule(id: string) {
  if (id === 'company') await syncCompany()
  else if (id === 'geo') await syncGeo()
  else if (id === 'news') await syncNews()
}

async function syncAll() {
  syncingAll.value = true
  await syncCompany()
  await syncGeo()
  await syncNews()
  syncingAll.value = false
}

function clearLogs() {
  logs.value = []
}

onMounted(() => {
  syncAll()
})
</script>

<style scoped>
.du-root {
  max-width: 1100px;
  margin: 0 auto;
  padding: 28px 24px 40px;
}

.du-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
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

.du-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.du-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.du-card--loading {
  opacity: 0.85;
}

.du-card-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.du-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.du-card-meta {
  flex: 1;
  min-width: 0;
}

.du-card-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}

.du-card-desc {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
  line-height: 1.4;
}

.du-card-stats {
  display: flex;
  gap: 24px;
  padding: 12px 14px;
  background: var(--surface-alt);
  border-radius: 10px;
}

.du-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.du-stat-val {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-strong);
  font-variant-numeric: tabular-nums;
}

.du-stat-val--sm {
  font-size: 12px;
  font-weight: 600;
}

.du-stat-lbl {
  font-size: 11px;
  color: var(--text-muted);
}

.du-card-msg {
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--surface-alt);
  color: var(--text-muted);
}

.du-card-msg--ok {
  background: color-mix(in srgb, #22c55e 12%, var(--surface-alt));
  color: #16a34a;
}

.du-card-msg--error {
  background: color-mix(in srgb, #ef4444 10%, var(--surface-alt));
  color: #dc2626;
}

.du-card-actions {
  display: flex;
  gap: 8px;
}

.du-log {
  padding: 18px;
}

.du-log-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.du-log-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}

.du-log-empty {
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  padding: 24px 0;
}

.du-log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}

.du-log-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--surface-alt);
}

.du-log-time {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  width: 140px;
}

.du-log-text {
  flex: 1;
  color: var(--text);
}

.du-log-text--error {
  color: #dc2626;
}
</style>
