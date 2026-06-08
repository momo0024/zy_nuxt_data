<template>
  <div class="chain-page">
    <header class="chain-top">
      <h1>产业供应链图谱</h1>
      <div class="chain-tabs">
        <button class="chain-tab" :class="{ on: !phaseFilter }" @click="phaseFilter = ''">
          全部<span>{{ totalModules }}</span>
        </button>
        <button
          v-for="p in allPhases"
          :key="p.key"
          class="chain-tab"
          :class="{ on: phaseFilter === p.key }"
          :style="{ '--tc': p.color }"
          @click="phaseFilter = phaseFilter === p.key ? '' : p.key"
        >
          <UIcon :name="p.icon" class="size-3.5" />
          {{ p.name }}<span>{{ p.count }}</span>
        </button>
      </div>
    </header>

    <div class="chain-bar">
      <div class="chain-view-switch">
        <button class="chain-view-btn" :class="{ on: viewStyle === 'list' }" @click="viewStyle = 'list'">
          <UIcon name="i-lucide-list-tree" class="size-4" />
        </button>
        <button class="chain-view-btn" :class="{ on: viewStyle === 'mind' }" @click="viewStyle = 'mind'">
          <UIcon name="i-lucide-layout-grid" class="size-4" />
        </button>
      </div>
      <div class="chain-search">
        <UIcon name="i-lucide-search" class="chain-search-ico" />
        <input v-model.trim="keyword" type="search" placeholder="搜索" class="chain-search-inp" />
        <button v-if="keyword" class="chain-search-clr" @click="keyword = ''">
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
      </div>
      <button v-if="viewStyle === 'list'" class="chain-icon-btn" title="展开" @click="expandAll">
        <UIcon name="i-lucide-unfold-vertical" class="size-4" />
      </button>
      <button v-if="viewStyle === 'list'" class="chain-icon-btn" title="收起" @click="collapseAll">
        <UIcon name="i-lucide-fold-vertical" class="size-4" />
      </button>
    </div>

    <main class="chain-main">
      <div v-if="loading" class="chain-state">
        <UIcon name="i-lucide-loader-2" class="chain-spin size-6" />
      </div>
      <div v-else-if="!treeReady" class="chain-state">
        <UIcon name="i-lucide-network" class="size-10 opacity-30" />
      </div>

      <section v-else-if="keyword" class="chain-search-wrap">
        <div v-if="!searchResults.length" class="chain-state chain-state-sm">—</div>
        <div v-else class="chain-search-grid">
          <button
            v-for="item in searchResults"
            :key="item.id"
            class="chain-search-hit"
            :style="{ '--hc': item.color }"
            @click="focusNode(item.nodeId)"
          >
            <span class="csh-tag">{{ item.phaseName }}</span>
            <strong>{{ item.name }}</strong>
            <span class="csh-path">{{ item.path.join(' / ') }}</span>
            <span class="csh-num">{{ item.isLeaf ? item.companyCount : item.childCount }}</span>
          </button>
        </div>
      </section>

      <div v-else-if="viewStyle === 'mind'" class="chain-mind-layout">
        <ClientOnly>
          <ChainMindMap
            ref="mindMapRef"
            :phases="filteredPhases"
            :selected-id="selectedNodeId"
            @select="selectNodeById"
          />
        </ClientOnly>

        <Transition name="chain-panel">
          <aside
            v-if="selectedNode && activeCompanies.length"
            class="chain-mind-panel"
            :style="{ '--tc': selectedPhase?.color }"
          >
            <header class="chain-mind-panel-head">
              <div class="chain-mind-panel-crumb">
                <span v-for="(c, i) in breadcrumb" :key="c.id">
                  {{ c.name }}<i v-if="i < breadcrumb.length - 1">/</i>
                </span>
              </div>
              <button class="chain-mind-close" @click="selectedNodeId = ''">
                <UIcon name="i-lucide-x" class="size-4" />
              </button>
            </header>
            <div class="chain-co-bar">
              <input v-model.trim="coKeyword" type="search" placeholder="搜索" class="chain-co-inp" />
              <span class="chain-co-total">{{ filteredCompanies.length }}</span>
            </div>
            <div class="chain-co-list chain-co-list-panel">
              <template v-for="co in pagedCompanies" :key="co.code + co.name">
                <NuxtLink
                  v-if="isValidCode(co.code)"
                  :to="companyUrl(co.code)"
                  class="chain-co-item"
                >
                  <span class="chain-co-av">{{ co.name.charAt(0) }}</span>
                  <span class="chain-co-name">{{ co.name }}</span>
                  <UIcon name="i-lucide-chevron-right" class="chain-co-ext size-3.5" />
                </NuxtLink>
                <div v-else class="chain-co-item dim">
                  <span class="chain-co-av">{{ co.name.charAt(0) }}</span>
                  <span class="chain-co-name">{{ co.name }}</span>
                </div>
              </template>
            </div>
            <div v-if="coTotalPages > 1" class="chain-co-pager">
              <button :disabled="coPage <= 1" @click="coPage--">
                <UIcon name="i-lucide-chevron-left" class="size-4" />
              </button>
              <span>{{ coPage }}/{{ coTotalPages }}</span>
              <button :disabled="coPage >= coTotalPages" @click="coPage++">
                <UIcon name="i-lucide-chevron-right" class="size-4" />
              </button>
            </div>
          </aside>
        </Transition>
      </div>

      <div v-else class="chain-split">
        <!-- 左：树 -->
        <aside class="chain-tree">
          <div class="chain-tree-scroll">
            <button
              v-for="row in visibleTreeRows"
              :key="row.node.id"
              class="chain-tree-row"
              :class="{ on: selectedNodeId === row.node.id, leaf: row.isLeaf }"
              :style="{ '--tc': row.color, '--depth': row.depth }"
              @click="selectTreeNode(row)"
            >
              <span
                v-if="row.hasChildren"
                class="chain-tree-exp"
                @click.stop="toggleExpand(row.node.id)"
              >
                <UIcon :name="expandedIds.has(row.node.id) ? 'i-lucide-minus' : 'i-lucide-plus'" class="size-3" />
              </span>
              <span v-else class="chain-tree-leaf" />
              <span class="chain-tree-name">{{ row.node.name }}</span>
              <span class="chain-tree-num">{{ row.displayCount }}</span>
            </button>
          </div>
        </aside>

        <!-- 右：子模块 + 企业 -->
        <section class="chain-detail">
          <nav v-if="breadcrumb.length" class="chain-crumb">
            <button
              v-for="(c, i) in breadcrumb"
              :key="c.id"
              class="chain-crumb-btn"
              :class="{ last: i === breadcrumb.length - 1 }"
              :style="i === 0 ? { '--tc': selectedPhase?.color } : undefined"
              @click="selectNodeById(c.id)"
            >
              {{ c.name }}
              <UIcon v-if="i < breadcrumb.length - 1" name="i-lucide-chevron-right" class="size-3 opacity-40" />
            </button>
          </nav>

          <!-- 未选中：分栏总览 -->
          <div v-if="!selectedNode" class="chain-overview">
            <div
              v-for="phase in filteredPhases"
              :key="phase.key"
              class="chain-ov-col"
              :style="{ '--tc': phase.color }"
            >
              <button class="chain-ov-head" @click="selectNodeById(phase.id)">
                <UIcon :name="phase.icon" class="size-4" />
                <span>{{ phase.name }}</span>
                <b>{{ phase.count }}</b>
              </button>
              <button
                v-for="mod in phase.children"
                :key="mod.id"
                class="chain-ov-item"
                @click="selectNodeById(mod.id)"
              >
                <span>{{ mod.name }}</span>
                <em>{{ mod.count }}</em>
              </button>
            </div>
          </div>

          <template v-else>
            <div v-if="selectedNode.children.length" class="chain-mod-grid">
              <button
                v-for="child in selectedNode.children"
                :key="child.id"
                class="chain-mod-card"
                :class="{ on: selectedNodeId === child.id }"
                :style="{ '--tc': selectedPhase?.color }"
                @click="selectNodeById(child.id)"
              >
                <span class="cmc-name">{{ child.name }}</span>
                <span class="cmc-num">{{ child.count }}</span>
                <UIcon v-if="child.children.length" name="i-lucide-folder" class="cmc-ico size-3.5" />
                <UIcon v-else name="i-lucide-building-2" class="cmc-ico size-3.5" />
              </button>
            </div>

            <div v-if="activeCompanies.length" class="chain-co-section">
              <div class="chain-co-bar">
                <input v-model.trim="coKeyword" type="search" placeholder="搜索" class="chain-co-inp" />
                <span class="chain-co-total">{{ filteredCompanies.length }}</span>
              </div>
              <div class="chain-co-list">
                <template v-for="co in pagedCompanies" :key="co.code + co.name">
                  <NuxtLink
                    v-if="isValidCode(co.code)"
                    :to="companyUrl(co.code)"
                    class="chain-co-item"
                    :title="co.name"
                  >
                    <span class="chain-co-av">{{ co.name.charAt(0) }}</span>
                    <span class="chain-co-name">{{ co.name }}</span>
                    <UIcon name="i-lucide-chevron-right" class="chain-co-ext size-3.5" />
                  </NuxtLink>
                  <div v-else class="chain-co-item dim" :title="co.name">
                    <span class="chain-co-av">{{ co.name.charAt(0) }}</span>
                    <span class="chain-co-name">{{ co.name }}</span>
                  </div>
                </template>
              </div>
              <div v-if="coTotalPages > 1" class="chain-co-pager">
                <button :disabled="coPage <= 1" @click="coPage--">
                  <UIcon name="i-lucide-chevron-left" class="size-4" />
                </button>
                <span>{{ coPage }}/{{ coTotalPages }}</span>
                <button :disabled="coPage >= coTotalPages" @click="coPage++">
                  <UIcon name="i-lucide-chevron-right" class="size-4" />
                </button>
              </div>
            </div>
          </template>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { request } from '~/utils/request'

definePageMeta({ middleware: 'auth' })

const route = useRoute()

type CompanyItem = { code: string; name: string }

type ChainNode = {
  id: string
  key: string
  name: string
  phaseName: string
  desc: string
  count: number
  companies: CompanyItem[]
  color: string
  icon: string
  children: ChainNode[]
}

type TreeRow = {
  node: ChainNode
  color: string
  depth: number
  hasChildren: boolean
  isLeaf: boolean
  companyCount: number
  displayCount: number
}

type SearchItem = {
  id: string
  nodeId: string
  phaseName: string
  name: string
  path: string[]
  companyCount: number
  childCount: number
  isLeaf: boolean
  color: string
}

const CO_PAGE_SIZE = 30

const loading = ref(false)
const allPhases = ref<ChainNode[]>([])
const phaseFilter = ref('')
const keyword = ref('')
const coKeyword = ref('')
const coPage = ref(1)
const selectedNodeId = ref('')
const expandedIds = ref(new Set<string>())
const viewStyle = ref<'list' | 'mind'>('mind')
const mindMapRef = ref<{ focusNode: (id: string) => void } | null>(null)

const phaseMeta: Record<string, { color: string; icon: string; desc: string; order: number }> = {
  up:     { color: '#38bdf8', icon: 'i-lucide-flask-conical', desc: '', order: 1 },
  midlle: { color: '#a78bfa', icon: 'i-lucide-cpu',           desc: '', order: 2 },
  middle: { color: '#a78bfa', icon: 'i-lucide-cpu',           desc: '', order: 2 },
  down:   { color: '#fbbf24', icon: 'i-lucide-smartphone',    desc: '', order: 3 },
  others: { color: '#34d399', icon: 'i-lucide-orbit',         desc: '', order: 4 },
}

const nodeMap = computed(() => {
  const map = new Map<string, { node: ChainNode; phase: ChainNode; path: ChainNode[] }>()
  for (const phase of allPhases.value) {
    map.set(phase.id, { node: phase, phase, path: [phase] })
    walkMap(phase, phase, [phase], map)
  }
  return map
})

function walkMap(phase: ChainNode, node: ChainNode, path: ChainNode[], map: Map<string, { node: ChainNode; phase: ChainNode; path: ChainNode[] }>) {
  for (const child of node.children) {
    const p = [...path, child]
    map.set(child.id, { node: child, phase, path: p })
    walkMap(phase, child, p, map)
  }
}

const treeReady = computed(() => allPhases.value.length > 0)
const filteredPhases = computed(() =>
  phaseFilter.value ? allPhases.value.filter(p => p.key === phaseFilter.value) : allPhases.value
)
const totalModules = computed(() => allPhases.value.reduce((s, p) => s + countModules(p), 0))

const selectedNode = computed(() => selectedNodeId.value ? nodeMap.value.get(selectedNodeId.value)?.node ?? null : null)
const selectedPhase = computed(() => selectedNodeId.value ? nodeMap.value.get(selectedNodeId.value)?.phase ?? null : null)
const breadcrumb = computed(() => selectedNodeId.value ? nodeMap.value.get(selectedNodeId.value)?.path ?? [] : [])

const activeCompanies = computed(() => {
  if (!selectedNode.value) return []
  return selectedNode.value.companies
})

const filteredCompanies = computed(() => {
  const q = coKeyword.value.toLowerCase()
  if (!q) return activeCompanies.value
  return activeCompanies.value.filter(c => c.name.toLowerCase().includes(q))
})

const coTotalPages = computed(() => Math.max(1, Math.ceil(filteredCompanies.value.length / CO_PAGE_SIZE)))
const pagedCompanies = computed(() => {
  const start = (coPage.value - 1) * CO_PAGE_SIZE
  return filteredCompanies.value.slice(start, start + CO_PAGE_SIZE)
})

const visibleTreeRows = computed(() => {
  const rows: TreeRow[] = []
  for (const phase of filteredPhases.value) {
    appendTreeRow(phase, phase, 0, rows)
  }
  return rows
})

const searchResults = computed((): SearchItem[] => {
  const q = keyword.value.toLowerCase()
  if (!q) return []
  const hits: SearchItem[] = []
  for (const [id, entry] of nodeMap.value) {
    const { node, phase, path } = entry
    const pathNames = path.map(n => n.name)
    const match = node.name.toLowerCase().includes(q)
      || pathNames.some(n => n.toLowerCase().includes(q))
      || node.companies.some(c => c.name.toLowerCase().includes(q))
    if (!match) continue
    hits.push({
      id,
      nodeId: id,
      phaseName: phase.name,
      name: node.name,
      path: pathNames,
      companyCount: node.companies.length || node.count,
      childCount: node.children.length,
      isLeaf: !node.children.length,
      color: phase.color,
    })
  }
  return hits.sort((a, b) => a.path.length - b.path.length || a.name.localeCompare(b.name, 'zh'))
})

function countCompanies(raw: any): number {
  if (!raw) return 0
  if (typeof raw.company_count === 'number') return raw.company_count
  if (raw.company_list) return normList(raw.company_list).length
  if (raw.child_info?.company_list) return normList(raw.child_info.company_list).length
  if (raw.child_info && typeof raw.child_info === 'object')
    return Object.values(raw.child_info).reduce((s: number, v: any) => s + countCompanies(v), 0)
  return 0
}

function normList(list: any): CompanyItem[] {
  if (!list) return []
  if (Array.isArray(list)) return list.filter(Boolean).map((n, i) => ({ code: `item-${i}`, name: String(n).trim() }))
  if (typeof list === 'object')
    return Object.entries(list).filter(([, v]) => Boolean(v)).map(([k, v]) => ({ code: String(k), name: String(v).trim().replace(/\n/g, '') }))
  return []
}

function collectCompanies(raw: any): CompanyItem[] {
  if (!raw) return []
  if (raw.company_list) return normList(raw.company_list)
  if (raw.child_info?.company_list) return normList(raw.child_info.company_list)
  if (!raw.child_info || typeof raw.child_info !== 'object') return []
  const all = Object.values(raw.child_info).flatMap((v: any) => collectCompanies(v))
  const seen = new Set<string>()
  return all.filter(c => {
    const k = `${c.code}|${c.name}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function buildTree(raw: Record<string, any>): ChainNode[] {
  return Object.entries(raw)
    .filter(([, v]) => v && typeof v === 'object')
    .map(([k, v]) => buildNode(v, k, k, v.name || k))
    .sort((a, b) => (phaseMeta[a.key]?.order ?? 9) - (phaseMeta[b.key]?.order ?? 9))
}

function buildNode(raw: any, id: string, phaseKey: string, phaseName: string): ChainNode {
  const m = phaseMeta[phaseKey] ?? { color: '#64748b', icon: 'i-lucide-box', desc: '', order: 9 }
  const children = Object.entries(raw.child_info ?? {})
    .filter(([k, v]) => k !== 'company_list' && v && typeof v === 'object' && (v as any).name)
    .map(([k, v]) => buildNode(v, `${id}-${k}`, phaseKey, phaseName))
  return {
    id, key: phaseKey, name: raw.name || id, phaseName,
    desc: id === phaseKey ? m.desc : phaseName,
    count: countCompanies(raw),
    companies: collectCompanies(raw),
    color: m.color, icon: m.icon, children,
  }
}

function countModules(node: ChainNode): number {
  if (!node.children.length) return 1
  return node.children.reduce((s, c) => s + countModules(c), 0)
}

function appendTreeRow(node: ChainNode, phase: ChainNode, depth: number, rows: TreeRow[]) {
  const hasChildren = node.children.length > 0
  const isLeaf = !hasChildren
  const companyCount = node.companies.length || (isLeaf ? node.count : 0)
  rows.push({
    node,
    color: phase.color,
    depth,
    hasChildren,
    isLeaf,
    companyCount,
    displayCount: hasChildren ? node.children.length : companyCount,
  })
  if (hasChildren && expandedIds.value.has(node.id)) {
    for (const child of node.children) appendTreeRow(child, phase, depth + 1, rows)
  }
}

function toggleExpand(id: string) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIds.value = next
}

function expandAll() {
  const ids = new Set<string>()
  for (const [, entry] of nodeMap.value) {
    if (entry.node.children.length) ids.add(entry.node.id)
  }
  expandedIds.value = ids
}

function collapseAll() {
  expandedIds.value = new Set(allPhases.value.map(p => p.id))
}

function selectTreeNode(row: TreeRow) {
  selectedNodeId.value = row.node.id
  coKeyword.value = ''
  coPage.value = 1
  if (row.hasChildren && !expandedIds.value.has(row.node.id)) toggleExpand(row.node.id)
}

function selectNodeById(id: string) {
  selectedNodeId.value = id
  coKeyword.value = ''
  coPage.value = 1
  const entry = nodeMap.value.get(id)
  if (entry) {
    const next = new Set(expandedIds.value)
    for (const n of entry.path) {
      if (n.children.length) next.add(n.id)
    }
    expandedIds.value = next
  }
}

function focusNode(id: string) {
  keyword.value = ''
  selectNodeById(id)
  if (viewStyle.value === 'mind') {
    nextTick(() => mindMapRef.value?.focusNode(id))
  }
}

function isValidCode(c: string) {
  return Boolean(c && c !== 'null' && !c.startsWith('item-'))
}

function companyUrl(code: string) {
  return {
    path: '/company-detail',
    query: { id: code, from: route.fullPath },
  }
}

watch(selectedNodeId, () => { coPage.value = 1 })

async function fetchChainData() {
  loading.value = true
  try {
    const res = await request.get('/company/chain')
    if (res.data?.code === 0 && res.data.data) {
      allPhases.value = buildTree(res.data.data)
      expandedIds.value = new Set(allPhases.value.map(p => p.id))
    }
  } catch (e) {
    console.error('获取产业链数据失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchChainData)
</script>

<style scoped>
.chain-page {
  min-height: 100%;
  color: var(--text);
  background: var(--bg);
}

/* ── 顶栏 ── */
.chain-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 12px;
  flex-wrap: wrap;
}

.chain-top h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: 0.01em;
}

.chain-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.chain-tab {
  --tc: var(--primary);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.chain-tab span {
  font-size: 11px;
  font-weight: 700;
  color: var(--tc);
}

.chain-tab:hover {
  background: var(--surface-alt);
  color: var(--text);
}

.chain-tab.on {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text-strong);
  box-shadow: var(--shadow-sm);
}

/* ── 工具栏 ── */
.chain-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 24px 16px;
  padding: 0;
}

.chain-view-switch {
  display: flex;
  gap: 1px;
  padding: 2px;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 7px;
}

.chain-view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 26px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.chain-view-btn.on {
  background: var(--surface);
  color: var(--text-strong);
  box-shadow: var(--shadow-sm);
}

.chain-search {
  position: relative;
  flex: 1;
  max-width: 280px;
}

.chain-search-ico {
  position: absolute;
  left: 10px;
  top: 50%;
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  transform: translateY(-50%);
  pointer-events: none;
}

.chain-search-inp {
  width: 100%;
  height: 30px;
  padding: 0 28px 0 30px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--surface);
  color: var(--text-strong);
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s;
}

.chain-search-inp:focus {
  border-color: var(--primary);
}

.chain-search-clr {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  border: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
}

.chain-search-clr:hover { color: var(--text-strong); }

.chain-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--surface);
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.12s, border-color 0.12s;
}

.chain-icon-btn:hover {
  color: var(--text-strong);
  border-color: color-mix(in srgb, var(--primary) 40%, var(--border));
}

/* ── 主区域 ── */
.chain-main { padding: 0 24px 32px; }

.chain-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  color: var(--text-muted);
}

.chain-state-sm { min-height: 60px; }

.chain-spin { animation: spin 1s linear infinite; }

@keyframes spin { to { transform: rotate(360deg); } }

/* ── 列表视图 ── */
.chain-split {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 12px;
  min-height: calc(100vh - 160px);
}

.chain-tree {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chain-tree-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
  max-height: calc(100vh - 170px);
}

.chain-tree-row {
  --tc: var(--primary);
  --depth: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: 34px;
  padding: 0 12px 0 calc(10px + var(--depth) * 14px);
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  border-left: 2px solid transparent;
  transition: background 0.1s, border-color 0.1s;
}

.chain-tree-row:hover { background: var(--surface-alt); }

.chain-tree-row.on {
  background: color-mix(in srgb, var(--tc) 6%, var(--surface-alt));
}

.chain-tree-row.leaf .chain-tree-name { font-weight: 600; }

.chain-tree-exp,
.chain-tree-leaf {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chain-tree-exp {
  border: 1px solid var(--border);
  border-radius: 3px;
  color: var(--text-muted);
  background: var(--surface);
  font-size: 10px;
}

.chain-tree-exp:hover {
  border-color: var(--tc);
  color: var(--tc);
}

.chain-tree-leaf::after {
  content: '';
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--tc) 60%, var(--border));
}

.chain-tree-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--text);
}

.chain-tree-num {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  color: var(--tc);
  font-variant-numeric: tabular-nums;
}

/* ── 详情区 ── */
.chain-detail {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 400px;
}

.chain-crumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
}

.chain-crumb-btn {
  --tc: var(--primary);
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: 0;
  background: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  padding: 2px 0;
  transition: color 0.12s;
}

.chain-crumb-btn.last {
  color: var(--tc);
  font-weight: 700;
}

.chain-crumb-btn:hover { color: var(--text-strong); }

.chain-overview {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  align-content: start;
  max-height: calc(100vh - 170px);
}

.chain-ov-col {
  --tc: var(--primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface);
}

.chain-ov-head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  cursor: pointer;
  text-align: left;
  background: var(--surface-alt);
  border-bottom: 1px solid var(--border);
  color: var(--text-strong);
  font-size: 13px;
  font-weight: 700;
  transition: background 0.12s;
}

.chain-ov-head:hover { background: color-mix(in srgb, var(--tc) 6%, var(--surface-alt)); }

.chain-ov-head b {
  margin-left: auto;
  color: var(--tc);
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.chain-ov-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-size: 12px;
  color: var(--text);
  transition: background 0.1s;
}

.chain-ov-item:last-child { border-bottom: 0; }

.chain-ov-item:hover {
  background: var(--surface-alt);
  color: var(--text-strong);
}

.chain-ov-item em {
  font-style: normal;
  font-weight: 700;
  color: var(--tc);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.chain-mod-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--border);
  max-height: 220px;
  overflow-y: auto;
}

.chain-mod-card {
  --tc: var(--primary);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  min-height: 60px;
  text-align: left;
  cursor: pointer;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: border-color 0.12s, background 0.12s;
}

.chain-mod-card:hover,
.chain-mod-card.on {
  border-color: color-mix(in srgb, var(--tc) 40%, var(--border));
  background: color-mix(in srgb, var(--tc) 4%, var(--surface));
}

.cmc-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-strong);
  line-height: 1.35;
  padding-right: 14px;
}

.cmc-num {
  font-size: 15px;
  font-weight: 700;
  color: var(--tc);
  font-variant-numeric: tabular-nums;
}

.cmc-ico {
  position: absolute;
  top: 8px;
  right: 8px;
  color: var(--text-muted);
  opacity: 0.4;
}

/* ── 企业列表 ── */
.chain-co-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chain-co-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}

.chain-co-inp {
  flex: 1;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface-alt);
  color: var(--text-strong);
  font-size: 12px;
  outline: none;
}

.chain-co-inp:focus {
  border-color: var(--primary);
}

.chain-co-total {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  min-width: 24px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.chain-co-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 2px;
  align-content: start;
  max-height: calc(100vh - 340px);
}

.chain-co-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 6px;
  border: 1px solid transparent;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: background 0.1s;
}

.chain-co-item:hover:not(.dim) {
  background: var(--surface-alt);
}

.chain-co-item.dim {
  opacity: 0.4;
  cursor: default;
}

.chain-co-av {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-alt);
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}

.chain-co-item:hover:not(.dim) .chain-co-av {
  background: color-mix(in srgb, var(--primary) 10%, var(--surface-alt));
  border-color: color-mix(in srgb, var(--primary) 30%, var(--border));
  color: var(--primary);
}

.chain-co-name {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chain-co-ext {
  color: var(--text-muted);
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.1s;
}

.chain-co-item:hover:not(.dim) .chain-co-ext { opacity: 0.6; }

.chain-co-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 8px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.chain-co-pager button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  cursor: pointer;
  color: var(--text);
  transition: border-color 0.12s;
}

.chain-co-pager button:hover:not(:disabled) {
  border-color: var(--primary);
}

.chain-co-pager button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ── 搜索 ── */
.chain-search-wrap { animation: fadeIn 0.15s ease; }

@keyframes fadeIn { from { opacity: 0; } }

.chain-search-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px;
}

.chain-search-hit {
  --hc: var(--primary);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: border-color 0.12s;
}

.chain-search-hit:hover {
  border-color: color-mix(in srgb, var(--hc) 40%, var(--border));
}

.csh-tag {
  font-size: 10px;
  font-weight: 700;
  color: var(--hc);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.chain-search-hit strong {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
}

.csh-path {
  font-size: 11px;
  color: var(--text-muted);
}

.csh-num {
  font-size: 11px;
  font-weight: 700;
  color: var(--hc);
  font-variant-numeric: tabular-nums;
}

/* ── 图谱视图浮层 ── */
.chain-mind-layout {
  position: relative;
}

.chain-mind-panel {
  --tc: var(--primary);
  position: fixed;
  top: 80px;
  right: 24px;
  z-index: 30;
  width: min(340px, calc(100vw - 48px));
  max-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.chain-mind-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
}

.chain-mind-panel-crumb {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  line-height: 1.5;
}

.chain-mind-panel-crumb i {
  margin: 0 4px;
  font-style: normal;
  opacity: 0.4;
}

.chain-mind-close {
  border: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  transition: background 0.12s, color 0.12s;
}

.chain-mind-close:hover {
  background: var(--surface-alt);
  color: var(--text-strong);
}

.chain-co-list-panel { max-height: 360px; }

.chain-panel-enter-active,
.chain-panel-leave-active {
  transition: opacity 0.18s, transform 0.18s;
}

.chain-panel-enter-from,
.chain-panel-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 900px) {
  .chain-split { grid-template-columns: 1fr; }
  .chain-tree-scroll,
  .chain-overview,
  .chain-co-list { max-height: 280px; }
  .chain-overview { grid-template-columns: 1fr 1fr; }
  .chain-mind-panel {
    position: absolute;
    top: auto;
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    max-height: 50vh;
    border-radius: 10px 10px 0 0;
  }
}

@media (max-width: 520px) {
  .chain-overview { grid-template-columns: 1fr; }
  .chain-top { flex-direction: column; align-items: flex-start; }
  .chain-main { padding: 0 16px 24px; }
  .chain-bar { margin: 0 16px 12px; }
  .chain-top { padding: 16px 16px 10px; }
}
</style>
