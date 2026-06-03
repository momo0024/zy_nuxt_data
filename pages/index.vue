<template>
  <div class="chain-page">
    <!-- 顶部标题区 -->
    <div class="chain-header">
      <div class="chain-header-left">
        <div class="chain-title-wrap">
          <div class="chain-title-icon">
            <UIcon name="i-lucide-network" class="size-6" />
          </div>
          <div>
            <h1 class="chain-title">集成电路产业链图谱</h1>
            <p class="chain-subtitle">IC Industry Chain · 上下游全链路生态视图</p>
          </div>
        </div>
      </div>
      <div class="chain-header-right">
        <div class="chain-stat">
          <UIcon name="i-lucide-building-2" class="size-4" />
          <span class="chain-stat-num">{{ totalCompanies }}</span>
          <span class="chain-stat-label">家企业</span>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="chain-entries">
      <NuxtLink
        v-for="entry in quickEntries"
        :key="entry.path"
        :to="entry.path"
        class="chain-entry"
        :style="{ '--entry-color': entry.color }"
      >
        <div class="chain-entry-icon-wrap">
          <UIcon :name="entry.icon" class="size-5" />
        </div>
        <div class="chain-entry-info">
          <span class="chain-entry-name">{{ entry.name }}</span>
          <span class="chain-entry-desc">{{ entry.desc }}</span>
        </div>
        <UIcon name="i-lucide-arrow-right" class="chain-entry-arrow size-4" />
      </NuxtLink>
    </div>

    <!-- 图谱区域 -->
    <div class="chain-graph-wrap">
      <ClientOnly>
        <div ref="graphContainer" class="chain-graph-container" />
        <template #fallback>
          <div class="chain-graph-loading">
            <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-[var(--primary)]" />
            <span>正在加载产业链图谱...</span>
          </div>
        </template>
      </ClientOnly>

      <!-- 图例 -->
      <div class="chain-legend">
        <div class="legend-item"><span class="legend-dot" style="background:#3b82f6" />上游</div>
        <div class="legend-item"><span class="legend-dot" style="background:#8b5cf6" />中游</div>
        <div class="legend-item"><span class="legend-dot" style="background:#ef4444" />下游</div>
      </div>

      <!-- 缩放控制 -->
      <div class="chain-zoom-controls">
        <button class="zoom-btn" title="放大" @click="zoomIn">
          <UIcon name="i-lucide-plus" class="size-4" />
        </button>
        <button class="zoom-btn" title="缩小" @click="zoomOut">
          <UIcon name="i-lucide-minus" class="size-4" />
        </button>
        <button class="zoom-btn" title="适应画布" @click="fitView">
          <UIcon name="i-lucide-maximize-2" class="size-4" />
        </button>
      </div>
    </div>

    <!-- 右侧企业列表面板 -->
    <Transition name="slide-panel">
      <div v-if="selectedNode" class="company-panel">
        <div class="company-panel-header">
          <div class="company-panel-header-info">
            <div class="company-panel-title">{{ selectedNode.label }}</div>
            <div class="company-panel-sub">共 {{ selectedNode.companies?.length || 0 }} 家企业</div>
          </div>
          <UButton variant="ghost" size="xs" icon="i-lucide-x" color="neutral" @click="selectedNode = null" />
        </div>
        <div class="company-panel-body">
          <div
            v-for="company in selectedNode.companies"
            :key="company"
            class="company-panel-item"
            @click="goToCompany(company)"
          >
            <span class="company-panel-dot" :style="{ background: selectedNode.color }" />
            <span class="company-panel-name">{{ company }}</span>
            <UIcon name="i-lucide-chevron-right" class="size-3 text-[var(--text-muted)]" />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { Graph } from '@antv/g6'
import { request } from '~/utils/request'

definePageMeta({ middleware: 'auth' })

const router = useRouter()
const graphContainer = ref<HTMLDivElement | null>(null)
const chainData = ref<any>(null)
const loading = ref(false)
const selectedNode = ref<any>(null)
let graphInstance: Graph | null = null

const totalCompanies = computed(() => {
  if (!chainData.value) return 0
  let count = 0
  ;['up', 'mid', 'down'].forEach((key) => {
    count += countPhaseCompanies(chainData.value[key])
  })
  return count
})

const quickEntries = [
  { path: '/geo-screen', name: '企业地图', desc: '查看企业地理分布', icon: 'i-lucide-map', color: '#3b82f6' },
  { path: '/retrieve', name: '文档检索', desc: '检索知识库文档', icon: 'i-lucide-search', color: '#8b5cf6' },
  { path: '/data-search', name: '数据搜索', desc: '搜索企业数据', icon: 'i-lucide-table-properties', color: '#14b8a6' },
  { path: '/import', name: '文档导入', desc: '批量导入文档', icon: 'i-lucide-file-up', color: '#f59e0b' },
  { path: '/public-opinion', name: '舆情监测', desc: '实时舆情分析', icon: 'i-lucide-radar', color: '#ef4444' },
]

function countPhaseCompanies(phase: any): number {
  if (!phase) return 0
  if (phase.company_count !== undefined) return phase.company_count
  if (phase.child_info) {
    return Object.values(phase.child_info).reduce((sum: number, child: any) => sum + countPhaseCompanies(child), 0)
  }
  return 0
}

function getCompanies(node: any): string[] {
  if (!node) return []
  // 直接包含企业列表
  if (node.company_list && Array.isArray(node.company_list)) return node.company_list
  // child_info 中包含企业列表（叶子节点）
  if (node.child_info?.company_list && Array.isArray(node.child_info.company_list)) return node.child_info.company_list
  // 递归处理子节点
  if (node.child_info) {
    return Object.values(node.child_info).flatMap((child: any) => getCompanies(child))
  }
  return []
}

function countCompanies(node: any): number {
  if (!node) return 0
  // 直接包含企业数量
  if (node.company_count !== undefined) return node.company_count
  // child_info 中包含企业数量（叶子节点）
  if (node.child_info?.company_count !== undefined) return node.child_info.company_count
  // 递归处理子节点
  if (node.child_info) {
    return Object.values(node.child_info).reduce((sum: number, child: any) => sum + countCompanies(child), 0)
  }
  return 0
}

function transformChainData(raw: any) {
  const nodes: any[] = []
  const edges: any[] = []
  let idCounter = 0

  const rootId = `n-${idCounter++}`
  nodes.push({
    id: rootId,
    data: { label: '集成电路产业链', type: 'root', phase: 'root' },
  })

  const phases = [
    { key: 'up', label: '上游', color: '#3b82f6' },
    { key: 'mid', label: '中游', color: '#8b5cf6' },
    { key: 'down', label: '下游', color: '#ef4444' },
  ]

  phases.forEach((phase) => {
    const phaseData = raw[phase.key]
    if (!phaseData) return

    const phaseId = `n-${idCounter++}`
    nodes.push({
      id: phaseId,
      data: {
        label: phaseData.name || phase.label,
        type: 'phase',
        phase: phase.key,
        color: phase.color,
      },
    })
    edges.push({ source: rootId, target: phaseId })

    Object.values(phaseData.child_info || {}).forEach((cat1: any) => {
      const cat1Id = `n-${idCounter++}`
      const cat1Count = countCompanies(cat1)
      nodes.push({
        id: cat1Id,
        data: {
          label: cat1.name,
          type: 'category1',
          phase: phase.key,
          color: phase.color,
          count: cat1Count,
        },
      })
      edges.push({ source: phaseId, target: cat1Id })

      Object.values(cat1.child_info || {}).forEach((cat2: any) => {
        if (!cat2 || typeof cat2 !== 'object' || !cat2.name) return
        const cat2Id = `n-${idCounter++}`
        const cat2Count = countCompanies(cat2)
        const companies = getCompanies(cat2)
        nodes.push({
          id: cat2Id,
          data: {
            label: cat2.name,
            type: 'category2',
            phase: phase.key,
            color: phase.color,
            count: cat2Count,
            companies,
          },
        })
        edges.push({ source: cat1Id, target: cat2Id })
      })
    })
  })

  return { nodes, edges }
}

function getNodeSize(type: string): [number, number] {
  switch (type) {
    case 'root': return [180, 48]
    case 'phase': return [120, 40]
    case 'category1': return [140, 36]
    case 'category2': return [160, 36]
    default: return [120, 36]
  }
}

function getNodeFill(type: string, phase: string, isDark: boolean): string {
  if (type === 'root') return isDark ? '#1a1a2a' : '#ffffff'
  if (type === 'phase') {
    if (phase === 'up') return '#3b82f6'
    if (phase === 'mid') return '#8b5cf6'
    if (phase === 'down') return '#ef4444'
  }
  return isDark ? '#13131f' : '#ffffff'
}

function getNodeStroke(type: string, phase: string, isDark: boolean): string {
  if (type === 'phase') return 'transparent'
  if (type === 'root') return isDark ? '#6366f1' : '#6366f1'
  if (phase === 'up') return '#3b82f6'
  if (phase === 'mid') return '#8b5cf6'
  if (phase === 'down') return '#ef4444'
  return isDark ? '#252538' : '#e2e5ed'
}

function getLabelColor(type: string, isDark: boolean): string {
  if (type === 'phase') return '#ffffff'
  return isDark ? '#c0c0dc' : '#2d3240'
}

async function initGraph() {
  if (!graphContainer.value || !chainData.value) return

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    || document.documentElement.getAttribute('data-theme') === 'purple'

  const { nodes, edges } = transformChainData(chainData.value)

  graphInstance = new Graph({
    container: graphContainer.value,
    width: graphContainer.value.clientWidth,
    height: graphContainer.value.clientHeight,
    data: { nodes, edges },
    layout: {
      type: 'dagre',
      rankdir: 'LR',
      nodesep: 24,
      ranksep: 70,
      controlPoints: true,
    },
    node: {
      style: (d: any) => {
        const type = d.data?.type || 'category2'
        const phase = d.data?.phase || ''
        const size = getNodeSize(type)
        return {
          size,
          radius: type === 'root' ? 12 : type === 'phase' ? 20 : 8,
          fill: getNodeFill(type, phase, isDark),
          stroke: getNodeStroke(type, phase, isDark),
          lineWidth: type === 'root' ? 2 : 1,
          labelText: d.data?.label || '',
          labelFill: getLabelColor(type, isDark),
          labelFontSize: type === 'root' ? 14 : type === 'phase' ? 13 : 12,
          labelFontWeight: type === 'root' || type === 'phase' ? 700 : 500,
          labelMaxWidth: size[0] - 16,
          labelWordWrap: true,
          shadowColor: type === 'phase' ? d.data?.color + '33' : 'rgba(0,0,0,0.08)',
          shadowBlur: type === 'phase' ? 12 : 4,
          shadowOffsetY: type === 'phase' ? 4 : 2,
          cursor: 'pointer',
        }
      },
      state: {
        hover: {
          lineWidth: 2,
          shadowBlur: 12,
          shadowColor: 'rgba(99,102,241,0.3)',
        },
        selected: {
          lineWidth: 2,
          stroke: '#6366f1',
        },
      },
    },
    edge: {
      type: 'cubic-horizontal',
      style: {
        stroke: isDark ? '#3a3a55' : '#d1d5db',
        lineWidth: 1.5,
        endArrow: true,
        endArrowSize: 8,
        endArrowFill: isDark ? '#3a3a55' : '#d1d5db',
        radius: 8,
      },
    },
    behaviors: ['drag-canvas', 'zoom-canvas', 'hover-activate'],
    animation: {
      duration: 400,
      easing: 'ease-in-out',
    },
  })

  graphInstance.on('node:click', (evt: any) => {
    const item = evt.item
    if (!item) return
    const data = item.getModel?.() || item.getData?.() || {}
    const nodeData = data.data || data
    if (nodeData.type === 'category2' && nodeData.companies?.length) {
      selectedNode.value = {
        label: nodeData.label,
        companies: nodeData.companies,
        color: nodeData.color,
      }
    }
  })

  graphInstance.on('canvas:click', () => {
    selectedNode.value = null
  })

  await graphInstance.render()
  graphInstance.fitView({ padding: [40, 80, 40, 80] })
}

function zoomIn() {
  if (graphInstance) {
    const zoom = graphInstance.getZoom()
    graphInstance.zoomTo(zoom * 1.2)
  }
}

function zoomOut() {
  if (graphInstance) {
    const zoom = graphInstance.getZoom()
    graphInstance.zoomTo(zoom * 0.8)
  }
}

function fitView() {
  if (graphInstance) {
    graphInstance.fitView({ padding: [40, 80, 40, 80] })
  }
}

async function fetchChainData() {
  loading.value = true
  try {
    const res = await request.get('/company/chain/')
    if (res.data?.code === 0 && res.data?.data) {
      chainData.value = res.data.data
    }
  } catch (err) {
    console.error('获取产业链数据失败:', err)
  } finally {
    loading.value = false
  }
}

function goToCompany(name: string) {
  router.push(`/company-detail?name=${encodeURIComponent(name)}`)
}

function handleResize() {
  if (graphInstance && graphContainer.value) {
    graphInstance.setSize([graphContainer.value.clientWidth, graphContainer.value.clientHeight])
    graphInstance.fitView({ padding: [40, 80, 40, 80] })
  }
}

onMounted(async () => {
  await fetchChainData()
  nextTick(() => {
    initGraph()
  })
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (graphInstance) {
    graphInstance.destroy()
    graphInstance = null
  }
})
</script>

<style scoped>
.chain-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
  position: relative;
  overflow: hidden;
}

/* ── Header ── */
.chain-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 16px;
}

.chain-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chain-title-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.25);
}

.chain-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-strong);
  line-height: 1.2;
}

.chain-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 1px;
}

.chain-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chain-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 20px;
  font-size: 13px;
  color: var(--text);
  font-weight: 600;
}

.chain-stat-num {
  color: var(--primary);
  font-weight: 700;
  font-size: 15px;
}

.chain-stat-label {
  color: var(--text-muted);
  font-size: 12px;
}

/* ── Quick Entries ── */
.chain-entries {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  overflow-x: auto;
}

.chain-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s;
  flex-shrink: 0;
}
.chain-entry:hover {
  border-color: color-mix(in srgb, var(--entry-color) 50%, var(--border));
  box-shadow: 0 2px 8px color-mix(in srgb, var(--entry-color) 15%, transparent);
  transform: translateY(-1px);
}

.chain-entry-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--entry-color) 12%, transparent);
  color: var(--entry-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chain-entry-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.chain-entry-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-strong);
}

.chain-entry-desc {
  font-size: 11px;
  color: var(--text-muted);
}

.chain-entry-arrow {
  color: var(--text-muted);
  opacity: 0;
  transition: opacity 0.15s;
}
.chain-entry:hover .chain-entry-arrow {
  opacity: 1;
  color: var(--entry-color);
}

/* ── Graph ── */
.chain-graph-wrap {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--bg);
}

.chain-graph-container {
  width: 100%;
  height: 100%;
}

.chain-graph-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  height: 100%;
  color: var(--text-muted);
  font-size: 14px;
}

/* 图例 */
.chain-legend {
  position: absolute;
  left: 16px;
  bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: var(--shadow-sm);
  font-size: 12px;
  color: var(--text);
  z-index: 10;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 缩放控制 */
.chain-zoom-controls {
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 10;
}

.zoom-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}
.zoom-btn:hover {
  background: var(--surface-alt);
  color: var(--text-strong);
  border-color: var(--primary);
}

/* ── Company Panel ── */
.company-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 340px;
  background: var(--surface);
  border-left: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  z-index: 20;
}

.company-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.company-panel-header-info {
  min-width: 0;
}

.company-panel-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.company-panel-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.company-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.company-panel-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.company-panel-item:hover {
  background: var(--surface-alt);
}

.company-panel-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.company-panel-name {
  flex: 1;
  font-size: 13px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Transitions ── */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-panel-enter-from,
.slide-panel-leave-to {
  transform: translateX(100%);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .chain-header {
    padding: 10px 14px;
  }
  .chain-subtitle {
    display: none;
  }
  .chain-entries {
    padding: 8px 14px;
  }
  .chain-entry-desc {
    display: none;
  }
  .company-panel {
    width: 100%;
  }
}
</style>
