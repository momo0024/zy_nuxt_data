<template>
  <div class="chain-page">
    <!-- 顶部概览条 -->
    <header class="chain-header">
      <div class="chain-header-left">
        <div class="chain-logo">
          <UIcon name="i-lucide-cpu" class="chain-logo-icon" />
        </div>
        <div class="chain-header-text">
          <h1 class="chain-title">集成电路产业链图谱</h1>
          <p class="chain-subtitle">IC Industry Chain Map</p>
        </div>
      </div>
      <div class="chain-header-right">
        <div class="chain-stat">
          <UIcon name="i-lucide-building-2" class="chain-stat-icon" />
          <span class="chain-stat-num">{{ totalCompanies }}</span>
          <span class="chain-stat-label">家企业</span>
        </div>
      </div>
    </header>

    <!-- 主体 -->
    <main class="chain-main">
      <!-- 上中下游流程轴 -->
      <div class="flow-axis">
        <div class="flow-track">
          <template v-for="(phase, idx) in normalPhases" :key="phase.id">
            <div
              class="flow-node"
              :class="{ active: selectedNode?.id === phase.id }"
              :style="{ '--c': phase.color }"
              @click="selectNode(phase)"
            >
              <div class="flow-node-icon">
                <UIcon :name="phaseIcons[phase.key] || 'i-lucide-box'" class="flow-node-icon-inner" />
              </div>
              <div class="flow-node-info">
                <span class="flow-node-name">{{ phase.name }}</span>
                <span class="flow-node-count">{{ phase.count }} 家企业</span>
              </div>
            </div>
            <div v-if="idx < normalPhases.length - 1" class="flow-connector">
              <div class="flow-connector-line" />
              <div class="flow-connector-arrow">
                <UIcon name="i-lucide-chevron-right" class="flow-connector-icon" />
              </div>
              <div class="flow-connector-line" />
            </div>
          </template>
        </div>
      </div>

      <!-- 阶段详情区 -->
      <div class="chain-sections">
        <template v-for="(phase, idx) in treePhases" :key="phase.id">
          <!-- 阶段间连接 -->
          <div v-if="idx > 0" class="section-connector">
            <div class="section-connector-line" />
            <div class="section-connector-dot" :style="{ borderColor: phase.color }" />
            <div class="section-connector-line" />
          </div>

          <!-- 阶段区块 -->
          <section class="section" :style="{ '--c': phase.color }">
            <div class="section-header">
              <div class="section-header-left">
                <span class="section-header-bar" :style="{ background: phase.color }" />
                <span class="section-header-title">{{ phase.name }}</span>
                <span class="section-header-badge" :style="{ color: phase.color, background: colorSoft(phase.color) }">
                  {{ phase.count }} 家
                </span>
              </div>
            </div>

            <div class="section-content">
              <div
                v-for="cat1 in phase.children"
                :key="cat1.id"
                class="category"
              >
                <!-- 大类分组标题 -->
                <div v-if="phase.children.length > 1" class="category-header">
                  <span class="category-dot" :style="{ background: phase.color }" />
                  <span class="category-name">{{ cat1.name }}</span>
                  <span class="category-count">{{ cat1.count }} 家</span>
                </div>

                <!-- 小类标签云 -->
                <div class="tag-cloud">
                  <div
                    v-for="cat2 in cat1.children"
                    :key="cat2.id"
                    class="tag-item"
                    :class="{ active: selectedNode?.id === cat2.id }"
                    @click="selectNode(cat2)"
                  >
                    <span class="tag-name">{{ cat2.name }}</span>
                    <span class="tag-count" :style="{ color: phase.color }">{{ cat2.count }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </template>
      </div>
    </main>

    <!-- 右侧企业列表面板 -->
    <Transition name="slide-panel">
      <div v-if="selectedNode" class="company-panel">
        <div class="company-panel-header">
          <div class="company-panel-title-row">
            <span class="company-panel-indicator" :style="{ background: selectedNode.color }" />
            <span class="company-panel-title">{{ selectedNode.label }}</span>
          </div>
          <div class="company-panel-meta">
            <span class="company-panel-total">{{ selectedNode.companies?.length || 0 }}</span>
            <span class="company-panel-unit">家企业</span>
            <UButton
              variant="ghost"
              size="xs"
              icon="i-lucide-x"
              color="neutral"
              class="ml-auto"
              @click="selectedNode = null"
            />
          </div>
        </div>
        <div class="company-panel-list">
          <div
            v-for="company in selectedNode.companies"
            :key="company.code"
            class="company-item"
            @click="goToCompany(company.code)"
          >
            <div class="company-item-avatar" :style="{ background: selectedNode.color }">
              {{ company.name.charAt(0) }}
            </div>
            <div class="company-item-info">
              <span class="company-item-name">{{ company.name }}</span>
              <span class="company-item-code">{{ company.code }}</span>
            </div>
            <UIcon name="i-lucide-chevron-right" class="company-item-arrow" />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { request } from '~/utils/request'

definePageMeta({ middleware: 'auth' })

const router = useRouter()
const chainData = ref<any>(null)
const selectedNode = ref<any>(null)

interface CompanyItem {
  code: string
  name: string
}

interface TreeNode {
  id: string
  name: string
  count: number
  companies: CompanyItem[]
  color: string
  phase: string
  key?: string
  expanded?: boolean
  children?: TreeNode[]
}

const phaseIcons: Record<string, string> = {
  up: 'i-lucide-arrow-up-circle',
  mid: 'i-lucide-arrow-right-circle',
  down: 'i-lucide-arrow-down-circle',
  other: 'i-lucide-more-horizontal',
}

const totalCompanies = computed(() => {
  if (!chainData.value) return 0
  return Object.values(chainData.value).reduce(
    (sum: number, phase: any) => sum + countCompanies(phase),
    0
  )
})

const treePhases = ref<TreeNode[]>([])

const normalPhases = computed(() =>
  treePhases.value.filter((p) => !isOtherPhase(p))
)

function isOtherPhase(phase: TreeNode): boolean {
  return (
    phase.name === '其他' ||
    phase.name.includes('其他') ||
    phase.key === 'other'
  )
}

function colorSoft(color: string): string {
  return `color-mix(in srgb, ${color} 12%, var(--surface-alt))`
}

function countCompanies(node: any): number {
  if (!node) return 0
  if (node.company_count !== undefined) return node.company_count
  const countList = (list: any): number => {
    if (Array.isArray(list)) return list.length
    if (typeof list === 'object' && list !== null) return Object.keys(list).length
    return 0
  }
  if (node.company_list) return countList(node.company_list)
  if (node.child_info?.company_list) return countList(node.child_info.company_list)
  if (node.child_info) {
    return Object.values(node.child_info).reduce(
      (sum: number, child: any) => sum + countCompanies(child),
      0
    )
  }
  return 0
}

function getCompanies(node: any): CompanyItem[] {
  if (!node) return []
  const extract = (list: any): CompanyItem[] => {
    if (Array.isArray(list)) {
      return list.map((name, idx) => ({ code: String(idx), name: String(name) }))
    }
    if (typeof list === 'object' && list !== null) {
      return Object.entries(list).map(([code, name]) => ({ code, name: String(name) }))
    }
    return []
  }
  if (node.company_list) return extract(node.company_list)
  if (node.child_info?.company_list) return extract(node.child_info.company_list)
  if (node.child_info) {
    return Object.values(node.child_info).flatMap((child: any) => getCompanies(child))
  }
  return []
}

function buildTree(raw: any): TreeNode[] {
  const phaseColors: Record<string, string> = {
    up: '#3b82f6',
    mid: '#8b5cf6',
    down: '#ef4444',
  }
  return Object.keys(raw)
    .filter((key) => raw[key] && typeof raw[key] === 'object')
    .map((key) => {
      const phaseData = raw[key]
      const color = phaseColors[key] || '#6366f1'
      const children = Object.values(phaseData.child_info || {})
        .map((cat1: any, idx1: number) => {
          const cat1Companies = getCompanies(cat1)
          const cat2Children = Object.values(cat1.child_info || {})
            .map((cat2: any, idx2: number) => {
              if (!cat2 || typeof cat2 !== 'object' || !cat2.name) return null
              return {
                id: `${key}-${idx1}-${idx2}`,
                name: cat2.name,
                count: countCompanies(cat2),
                companies: getCompanies(cat2),
                color,
                phase: key,
              }
            })
            .filter(Boolean) as TreeNode[]
          return {
            id: `${key}-${idx1}`,
            name: cat1.name,
            count: cat1Companies.length,
            companies: cat1Companies,
            color,
            phase: key,
            expanded: true,
            children: cat2Children,
          }
        })
        .filter(Boolean) as TreeNode[]
      return {
        id: key,
        key,
        name: phaseData.name || key,
        count: countCompanies(phaseData),
        companies: getCompanies(phaseData),
        color,
        phase: key,
        expanded: true,
        children,
      }
    })
}

function selectNode(node: TreeNode) {
  if (node.companies?.length) {
    selectedNode.value = {
      id: node.id,
      label: node.name,
      companies: node.companies,
      color: node.color,
    }
  }
}

async function fetchChainData() {
  try {
    const res = await request.get('/company/chain/')
    if (res.data?.code === 0 && res.data?.data) {
      chainData.value = res.data.data
      treePhases.value = buildTree(res.data.data)
    }
  } catch (err) {
    console.error('获取产业链数据失败:', err)
  }
}

function goToCompany(code: string) {
  router.push(`/company-detail?code=${encodeURIComponent(code)}`)
}

onMounted(async () => {
  await fetchChainData()
})
</script>

<style scoped>
/* ── 页面 ── */
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

.chain-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chain-logo {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 16px color-mix(in srgb, var(--primary) 40%, transparent);
}

.chain-logo-icon {
  width: 20px;
  height: 20px;
  color: #fff;
}

.chain-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-strong);
  line-height: 1.2;
}

.chain-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 1px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.chain-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 20px;
}

.chain-stat-icon {
  width: 16px;
  height: 16px;
  color: var(--primary);
}

.chain-stat-num {
  font-size: 16px;
  font-weight: 800;
  color: var(--primary);
}

.chain-stat-label {
  font-size: 12px;
  color: var(--text-muted);
}

/* ── Main ── */
.chain-main {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 32px;
}

/* ── Flow Axis ── */
.flow-axis {
  padding: 24px 20px 20px;
}

.flow-track {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.flow-node {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  min-width: 160px;
  position: relative;
}

.flow-node:hover {
  border-color: var(--c);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--c) 15%, transparent);
}

.flow-node.active {
  border-color: var(--c);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 12%, transparent), 0 8px 24px color-mix(in srgb, var(--c) 15%, transparent);
}

.flow-node-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--c) 12%, var(--surface-alt));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.flow-node-icon-inner {
  width: 20px;
  height: 20px;
  color: var(--c);
}

.flow-node-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.flow-node-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}

.flow-node-count {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.flow-connector {
  display: flex;
  align-items: center;
  width: 60px;
  flex-shrink: 0;
}

.flow-connector-line {
  flex: 1;
  height: 1.5px;
  background: var(--border);
}

.flow-connector-arrow {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flow-connector-icon {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
}

/* ── Sections ── */
.chain-sections {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0 20px;
}

.section-connector {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  gap: 8px;
}

.section-connector-line {
  flex: 1;
  max-width: 120px;
  height: 0;
  border-top: 1.5px dashed var(--border);
}

.section-connector-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid;
  background: var(--bg);
  flex-shrink: 0;
}

/* ── Section ── */
.section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  transition: box-shadow 0.25s ease;
}

.section:hover {
  box-shadow: var(--shadow-md);
}

.section-header {
  padding: 12px 18px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-header-bar {
  width: 4px;
  height: 18px;
  border-radius: 2px;
}

.section-header-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}

.section-header-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 10px;
}

.section-content {
  padding: 16px 18px;
}

/* ── Category ── */
.category {
  margin-bottom: 16px;
}
.category:last-child {
  margin-bottom: 0;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.category-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.category-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-strong);
}

.category-count {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
  margin-left: auto;
  padding: 1px 8px;
  background: var(--surface-alt);
  border-radius: 8px;
}

/* ── Tag Cloud ── */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.tag-item:hover {
  border-color: var(--c);
  background: color-mix(in srgb, var(--c) 8%, var(--surface-alt));
  transform: translateY(-1px);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--c) 12%, transparent);
}

.tag-item.active {
  border-color: var(--c);
  background: color-mix(in srgb, var(--c) 12%, var(--surface-alt));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--c) 15%, transparent);
}

.tag-name {
  color: var(--text);
  font-weight: 600;
  white-space: nowrap;
}

.tag-count {
  font-size: 11px;
  font-weight: 700;
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
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  z-index: 20;
}

.company-panel-header {
  padding: 16px 18px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.company-panel-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.company-panel-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.company-panel-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-strong);
}

.company-panel-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-left: 18px;
}

.company-panel-total {
  font-size: 18px;
  font-weight: 800;
  color: var(--primary);
}

.company-panel-unit {
  font-size: 12px;
  color: var(--text-muted);
}

.company-panel-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.company-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.company-item:hover {
  background: var(--surface-alt);
}

.company-item-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.company-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.company-item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.company-item-code {
  font-size: 10px;
  color: var(--text-muted);
  font-family: 'SF Mono', 'Cascadia Code', monospace;
}

.company-item-arrow {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.company-item:hover .company-item-arrow {
  color: var(--primary);
  transform: translateX(2px);
}

/* ── Transitions ── */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}
.slide-panel-enter-from,
.slide-panel-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .chain-header {
    padding: 10px 16px;
  }
  .chain-sections {
    padding: 0 16px;
  }
  .flow-axis {
    padding: 20px 16px 16px;
  }
}

@media (max-width: 768px) {
  .chain-header {
    padding: 10px 14px;
  }
  .chain-subtitle {
    display: none;
  }
  .flow-axis {
    padding: 16px 14px;
  }
  .flow-track {
    flex-wrap: wrap;
    gap: 10px;
  }
  .flow-connector {
    display: none;
  }
  .chain-sections {
    padding: 0 14px;
  }
  .section-content {
    padding: 12px 14px;
  }
  .company-panel {
    width: 100%;
  }
}
</style>
