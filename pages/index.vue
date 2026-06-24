﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿<template>
  <div class="chain-page">
    <header class="chain-top">
      <div class="chain-top-title">
        <div class="chain-top-icon">
          <UIcon name="i-lucide-git-branch" class="size-5" />
        </div>
        <div>
<!--          <h1>{{ chainTitle }}</h1>-->
          <h1>产业链</h1>
<!--          <p>上 · 中 · 下游关键环节</p>-->
        </div>
      </div>
      <div v-if="chainPhases.some(p => p.key !== 'all')" class="chain-tabs">
        <button class="chain-tab" :class="{ on: !phaseFilter }" @click="phaseFilter = ''">
          全部<span>{{ totalProductTypes }}</span>
        </button>
        <button
          v-for="p in chainPhases.filter(p => p.key !== 'all')"
          :key="p.key"
          class="chain-tab"
          :class="{ on: phaseFilter === p.key }"
          :style="{ '--tc': p.color }"
          @click="phaseFilter = phaseFilter === p.key ? '' : p.key"
        >
          <UIcon :name="p.icon" class="size-3.5" />
          {{ p.name }}<span>{{ p.children.length }}</span>
        </button>
      </div>
      <div class="chain-view-toggle">
        <button
          class="chain-view-btn"
          :class="{ on: viewMode === 'structure' }"
          title="结构图"
          @click="viewMode = 'structure'"
        >
          <UIcon name="i-lucide-layout-grid" class="size-4" />
        </button>
        <button
          class="chain-view-btn"
          :class="{ on: viewMode === 'tree' }"
          title="树形图"
          @click="viewMode = 'tree'"
        >
          <UIcon name="i-lucide-network" class="size-4" />
        </button>
      </div>
    </header>

    <main class="chain-main">
      <div v-if="loading" class="chain-state">
        <UIcon name="i-lucide-loader-2" class="chain-spin size-6" />
      </div>
      <div v-else-if="!chainPhases.length" class="chain-state">
        <UIcon name="i-lucide-network" class="size-10 opacity-30" />
        <p>暂无产业链数据</p>
      </div>

      <template v-else>
        <!-- 产业链结构 -->
        <section v-if="viewMode === 'structure'" class="chain-structure-v2">

          <!-- ① 双行平行四边形鱼形箭头：上行 \ 方向，下行 / 方向，合成鱼身 -->
          <div class="chain-arrow-banner">
            <!-- 上行：阶段（\ 方向平行四边形） -->
            <div class="chain-arrow-row chain-arrow-top">
              <div
                v-for="(phase, pi) in visiblePhases"
                :key="phase.key"
                class="chain-par chain-par-phase"
                :class="{ 'par-first': pi === 0, 'par-last': pi === visiblePhases.length - 1 }"
                :style="{ '--tc': phase.color, '--f': Math.max(phase.children.length, 1) }"
              >
                <div class="chain-par-in">
                  <span class="cpi-icon"><UIcon :name="phase.icon" class="size-4" /></span>
                  <span class="cpi-name">{{ phase.name }}</span>
                  <em class="cpi-cnt">{{ phase.totalCount }}</em>
                </div>
              </div>
            </div>
            <!-- 下行：子模块（\ 方向平行四边形，与上行镜像） -->
            <div class="chain-arrow-row chain-arrow-bot">
              <template v-for="(phase, pi) in visiblePhases" :key="phase.key">
                <div
                  v-for="(ind, ii) in phase.children"
                  :key="ind.secondIndustryId"
                  class="chain-par chain-par-sub"
                  :class="{
                    'par-first': pi === 0 && ii === 0,
                    'par-last': pi === visiblePhases.length - 1 && ii === phase.children.length - 1
                  }"
                  :style="{ '--tc': phase.color }"
                >
                  <div class="chain-par-in">
                    <span class="cpi-sub-name">{{ ind.name }}</span>
                    <span class="cpi-sub-cnt">{{ ind.totalCount }}</span>
                  </div>
                </div>
                <div
                  v-if="!phase.children.length"
                  class="chain-par chain-par-sub"
                  :class="{
                    'par-first': pi === 0,
                    'par-last': pi === visiblePhases.length - 1
                  }"
                  :style="{ '--tc': phase.color, '--f': 1 }"
                >
                  <div class="chain-par-in"><span class="cpi-sub-name">{{ phase.name }}</span></div>
                </div>
              </template>
            </div>
          </div>

          <!-- ② 节点卡片区域（每子模块一列，含"本土培育/招商引资"来源按钮） -->
          <div ref="chainNodesBoardRef" class="chain-nodes-board">
            <template v-for="phase in visiblePhases" :key="phase.key">
              <div
                v-for="industry in phase.children"
                :key="industry.secondIndustryId"
                class="chain-node-col"
                :style="{ '--tc': phase.color }"
              >
                <!-- 产品类型节点卡片 -->
                <div
                  v-for="product in industry.children.slice(0, 3)"
                  :key="product.productTypeId"
                  class="chain-product-node"
                  :class="{ on: selectedProduct?.productTypeId === product.productTypeId }"
                >
                  <div class="cpn-name" :title="product.name">{{ product.name }}</div>
                  <div class="cpn-sources">
                    <button
                      v-for="src in product.companyInfo"
                      :key="src.sourceId"
                      type="button"
                      class="cpn-src-btn"
                      :data-src-type="src.sourceName.includes('本土') ? 'native' : src.sourceName.includes('招商') ? 'attract' : 'other'"
                      @click="selectProduct(product); openCompanyList({ company_source: src.sourceId })"
                    >
                      <span class="cpn-src-label">{{ src.sourceName }}</span>
                      <span class="cpn-src-num">{{ src.num }}</span>
                    </button>
                  </div>
                </div>
                <button
                  v-if="industry.children.length > 3"
                  class="chain-inline-expand-btn"
                  @click="showICSubModal(industry)"
                >
                  <UIcon name="i-lucide-layers" class="size-3" />
                  <span>展示更多 ({{ industry.children.length - 3 }})</span>
                </button>
                <div v-if="!industry.children.length" class="chain-node-empty">暂无数据</div>
              </div>
              <div
                v-if="!phase.children.length"
                class="chain-node-col chain-node-col-empty"
                :style="{ '--tc': phase.color }"
              >
                <div class="chain-node-empty">暂无数据</div>
              </div>
            </template>
          </div>

          <!-- ③ 其他产业链（tab 卡片形式，点击切换） -->
          <template v-if="chainList.filter(c => c.key !== currentChainKey).length > 0">
            <div class="chain-other-header">
              <span class="coh-line" />
              <span class="coh-title">
                <UIcon name="i-lucide-layers" class="size-4" />
                其他产业领域
              </span>
              <span class="coh-line" />
            </div>
            <div class="chain-other-grid">
              <div
                v-for="(other, oi) in chainList.filter(c => c.key !== currentChainKey)"
                :key="other.key"
                class="chain-other-card"
              >
                <div class="chain-other-card-head">
                  <span class="coc-name">{{ other.name }}</span>
                </div>
                <div class="chain-other-card-body">
                  <template v-for="(sub, si) in getOtherSubList(other)" :key="sub.product_type_id || sub.sencond_industry_id || sub.name || JSON.stringify(sub)">
                    <div v-if="si < 3" class="chain-other-sub-card">
                      <div class="cosc-main">
                        <span class="cosc-name">{{ sub.name }}</span>
                        <div v-if="sub.company_info" class="cosc-sources">
                          <template v-if="!Array.isArray(sub.company_info)">
                            <template v-for="(info, sid) in sub.company_info" :key="sid">
                              <span
                                v-if="info && (info.num || info.num === 0)"
                                class="cosc-src-btn"
                                :class="{
                                  'csc-native': sid === 'native' || (info.source_name && info.source_name.includes('本土')),
                                  'csc-attract': sid === 'attract' || (info.source_name && info.source_name.includes('招商'))
                                }"
                                @click.stop="openOtherCompanyList(sub.product_type_id || 0, sub._secondIndustryId || null, sub.name, { company_source: sid })"
                              >
                                {{ info.source_name || sid }}<span class="cosc-src-num">{{ info.num }}</span>
                              </span>
                            </template>
                          </template>
                          <template v-else>
                            <template v-for="info in sub.company_info" :key="info.sourceId || info.source_name || JSON.stringify(info)">
                              <span
                                v-if="info && (info.num || info.num === 0)"
                                class="cosc-src-btn"
                                :class="{
                                  'csc-native': info.sourceId === 'native' || (info.sourceName && info.sourceName.includes('本土')),
                                  'csc-attract': info.sourceId === 'attract' || (info.sourceName && info.sourceName.includes('招商'))
                                }"
                                @click.stop="openOtherCompanyList(sub.product_type_id || 0, sub._secondIndustryId || null, sub.name, { company_source: info.sourceId })"
                              >
                                {{ info.source_name || info.sourceId }}<span class="cosc-src-num">{{ info.num }}</span>
                              </span>
                            </template>
                          </template>
                        </div>
                      </div>
                      <span v-if="sub.total_count || sub.num" class="cosc-cnt">{{ sub.total_count || sub.num }}</span>
                    </div>
                  </template>
                  <button v-if="getOtherSubList(other).length > 3" class="chain-other-more-btn" @click="showOtherSubModal(other)">
                    展示更多 ({{ getOtherSubList(other).length - 3 }})
                  </button>
                  <div v-if="!getOtherSubList(other).length" class="chain-other-empty">暂无细分数据</div>
                </div>
              </div>
            </div>
          </template>
        </section>

        <!-- 树形图 -->
        <section v-else-if="viewMode === 'tree'" class="chain-tree-wrap">
          <ClientOnly>
            <div ref="chainMindMapRef" class="chain-tree-chart" />
          </ClientOnly>
        </section>

        
        <!-- 底部统计图表 -->
        <section class="chain-charts">
          <div class="chain-chart-card">
            <h3 class="chain-chart-title">
              <UIcon name="i-lucide-map-pin" class="size-4" />
              园区分布
            </h3>
            <div class="chain-chart-wrap">
              <ClientOnly>
                <VChart ref="parkChartRef" v-if="parkChartOption" :option="parkChartOption" class="chain-chart" autoresize @zr:click="handleChartAreaClick($event, 'park')" />
                <div v-else class="chain-chart-empty">暂无数据</div>
              </ClientOnly>
            </div>
          </div>
          <div class="chain-chart-card">
            <h3 class="chain-chart-title">
              <UIcon name="i-lucide-building-2" class="size-4" />
              企业性质分布
            </h3>
            <div class="chain-chart-wrap">
              <ClientOnly>
                <VChart ref="typeChartRef" v-if="typeChartOption" :option="typeChartOption" class="chain-chart" autoresize @zr:click="handleChartAreaClick($event, 'type')" />
                <div v-else class="chain-chart-empty">暂无数据</div>
              </ClientOnly>
            </div>
          </div>
        </section>
      </template>
    </main>

    <!-- 企业列表弹窗 -->
    <Teleport to="body">
      <Transition name="chain-modal">
        <div v-if="companyModalVisible" class="chain-modal-overlay company-modal-overlay" @click.self="closeCompanyList">
          <div class="chain-modal-panel">
            <div class="chain-modal-head">
              <div>
                <h3>企业列表</h3>
                <p v-if="companyModalTitle || selectedProduct">{{ companyModalTitle || selectedProduct?.name }} · 共 {{ companyTotal }} 家</p>
              </div>
              <button class="chain-modal-close" @click="closeCompanyList">
                <UIcon name="i-lucide-x" class="size-5" />
              </button>
            </div>
            <div class="chain-modal-body">
              <div v-if="companyLoading" class="chain-state">
                <UIcon name="i-lucide-loader-2" class="chain-spin size-6" />
              </div>
              <template v-else>
                <div class="chain-modal-list">
                  <NuxtLink
                    v-for="co in companyList"
                    :key="co.company_credit_code"
                    :to="companyUrl(co.company_credit_code)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="chain-modal-item"
                  >
                    <span class="chain-modal-av">{{ co.company_name.charAt(0) }}</span>
                    <span class="chain-modal-name">{{ co.company_name }}</span>
                    <UIcon name="i-lucide-chevron-right" class="size-3.5 opacity-40" />
                  </NuxtLink>
                </div>
                <div v-if="!companyList.length" class="chain-modal-empty">暂无企业数据</div>
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 其他产业领域子项弹窗 -->
    <Teleport to="body">
      <Transition name="chain-modal">
        <div v-if="otherSubModalVisible" class="chain-modal-overlay" @click.self="closeOtherSubModal">
          <div class="chain-modal-panel">
            <div class="chain-modal-head">
              <div>
                <h3>{{ otherSubModalTitle }}</h3>
                <p>共 {{ otherSubModalList.length }} 项</p>
              </div>
              <button class="chain-modal-close" @click="closeOtherSubModal">
                <UIcon name="i-lucide-x" class="size-5" />
              </button>
            </div>
            <div class="chain-modal-body">
              <div class="chain-other-card-body" style="padding: 12px;">
                <div
                  v-for="sub in otherSubModalList"
                  :key="sub.product_type_id || sub.sencond_industry_id || sub.name || JSON.stringify(sub)"
                  class="chain-other-sub-card"
                >
                  <div class="cosc-main">
                    <span class="cosc-name">{{ sub.name }}</span>
                    <div v-if="sub.company_info" class="cosc-sources">
                      <template v-if="!Array.isArray(sub.company_info)">
                        <template v-for="(info, sid) in sub.company_info" :key="sid">
                          <span
                            v-if="info && (info.num || info.num === 0)"
                            class="cosc-src-btn"
                            :class="{
                              'csc-native': sid === 'native' || (info.source_name && info.source_name.includes('本土')),
                              'csc-attract': sid === 'attract' || (info.source_name && info.source_name.includes('招商'))
                            }"
                            @click.stop="openOtherCompanyList(sub.product_type_id || 0, sub._secondIndustryId || null, sub.name, { company_source: sid })"
                          >
                            {{ info.source_name || sid }}<span class="cosc-src-num">{{ info.num }}</span>
                          </span>
                        </template>
                      </template>
                      <template v-else>
                        <template v-for="info in sub.company_info" :key="info.sourceId || info.source_name || JSON.stringify(info)">
                          <span
                            v-if="info && (info.num || info.num === 0)"
                            class="cosc-src-btn"
                            :class="{
                              'csc-native': info.sourceId === 'native' || (info.source_name && info.source_name.includes('本土')),
                              'csc-attract': info.sourceId === 'attract' || (info.source_name && info.source_name.includes('招商'))
                            }"
                            @click.stop="openOtherCompanyList(sub.product_type_id || 0, sub._secondIndustryId || null, sub.name, { company_source: info.sourceId })"
                          >
                            {{ info.source_name || info.sourceId }}<span class="cosc-src-num">{{ info.num }}</span>
                          </span>
                        </template>
                      </template>
                    </div>
                  </div>
                  <span v-if="sub.total_count || sub.num" class="cosc-cnt">{{ sub.total_count || sub.num }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { request } from '~/utils/request'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DatasetComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, GridComponent, TooltipComponent, DatasetComponent, CanvasRenderer])

definePageMeta({ middleware: 'auth', keepalive: true })

type SourceInfo = {
  sourceId: string
  sourceName: string
  num: number
}

type ProductType = {
  productTypeId: number
  name: string
  companyInfo: SourceInfo[]
  totalCount: number
}

type SecondIndustry = {
  secondIndustryId: number
  name: string
  children: ProductType[]
  totalCount: number
}

type ChainPhase = {
  key: string
  name: string
  color: string
  icon: string
  children: SecondIndustry[]
  totalCount: number
}

type ParkItem = { park_id: number; park_name: string; num: number }
type TypeItem = { type_id: number; park_name: string; num: number }
type CompanyItem = { company_name: string; company_credit_code: string }
type ChainItem = { key: string; name: string; raw: any }

const PHASE_KEYS = ['up', 'middle', 'midlle', 'down']

const otherCardColors = ['#c2780a', '#2d7a4f', '#1a7a72', '#9a7b0a', '#8b4513', '#5c4d7a', '#3d6b8e', '#6b5344']

const phaseMeta: Record<string, { name: string; color: string; icon: string; order: number }> = {
  up: { name: '上游', color: '#38bdf8', icon: 'i-lucide-arrow-up-circle', order: 1 },
  middle: { name: '中游', color: '#a78bfa', icon: 'i-lucide-cpu', order: 2 },
  midlle: { name: '中游', color: '#a78bfa', icon: 'i-lucide-cpu', order: 2 },
  down: { name: '下游', color: '#fbbf24', icon: 'i-lucide-arrow-down-circle', order: 3 },
}

const loading = ref(false)
const chainTitle = ref('集成电路产业链')
const chainList = ref<ChainItem[]>([])
const currentChainKey = ref('1')
const chainPhases = ref<ChainPhase[]>([])
const phaseFilter = ref('')
const viewMode = ref<'structure' | 'tree'>('structure')
const selectedProduct = ref<ProductType | null>(null)
const selectedSecondIndustry = ref<SecondIndustry | null>(null)
const expandedIndustries = ref(new Set<number>())

const visiblePhases = computed(() =>
  phaseFilter.value ? chainPhases.value.filter(p => p.key === phaseFilter.value) : chainPhases.value
)

const selectedPhase = computed(() => {
  if (!selectedProduct.value || !selectedSecondIndustry.value) return null
  return chainPhases.value.find(p =>
    p.children.some(ind => ind.secondIndustryId === selectedSecondIndustry.value?.secondIndustryId)
  ) || null
})

const totalProductTypes = computed(() =>
  chainPhases.value.reduce((sum, p) => sum + p.children.reduce((s, i) => s + i.children.length, 0), 0)
)

// 园区 / 企业性质分布（产品维度，当前弹窗已移除展示，保留类型供底部全局图表使用）

// 企业列表弹窗
const companyModalVisible = ref(false)
const companyLoading = ref(false)
const companyList = ref<CompanyItem[]>([])
const companyTotal = ref(0)
const companyFilter = ref<Record<string, any>>({})
const companyModalTitle = ref('')

// 其他产业领域子项弹窗
const otherSubModalVisible = ref(false)
const otherSubModalTitle = ref('')
const otherSubModalList = ref<any[]>([])

// 底部图表
const globalParkList = ref<ParkItem[]>([])
const globalTypeList = ref<TypeItem[]>([])
const parkChartRef = ref<any>(null)
const typeChartRef = ref<any>(null)

function parseSourceInfo(info: Record<string, any>): SourceInfo[] {
  if (!info || typeof info !== 'object') return []
  return Object.entries(info)
    .map(([sourceId, v]: [string, any]) => ({
      sourceId,
      sourceName: v?.source_name || sourceId,
      num: typeof v?.num === 'number' ? v.num : 0,
    }))
    .filter(s => s.num > 0)
}

function parseProductType(raw: any): ProductType | null {
  if (!raw || typeof raw !== 'object') return null
  const info = parseSourceInfo(raw.company_info)
  return {
    productTypeId: raw.product_type_id ?? 0,
    name: raw.name || '-',
    companyInfo: info,
    totalCount: info.reduce((sum, s) => sum + s.num, 0),
  }
}

function parseSecondIndustry(raw: any): SecondIndustry | null {
  if (!raw || typeof raw !== 'object') return null
  const children = (raw.child_info || [])
    .map(parseProductType)
    .filter(Boolean) as ProductType[]
  return {
    secondIndustryId: raw.sencond_industry_id ?? 0,
    name: raw.name || '-',
    children,
    totalCount: children.reduce((sum, c) => sum + c.totalCount, 0),
  }
}

function parsePhase(key: string, raw: any): ChainPhase | null {
  if (!raw || typeof raw !== 'object') return null
  const meta = phaseMeta[key] || { name: raw.name || key, color: '#64748b', icon: 'i-lucide-box', order: 9 }
  const children = (raw.child_info || [])
    .map(parseSecondIndustry)
    .filter(Boolean) as SecondIndustry[]
  return {
    key,
    name: meta.name,
    color: meta.color,
    icon: meta.icon,
    children,
    totalCount: children.reduce((sum, c) => sum + c.totalCount, 0),
  }
}

function buildChain(raw: any): ChainPhase[] {
  if (!raw || typeof raw !== 'object') return []
  const chain = raw.chain
  if (chain && typeof chain === 'object') {
    return PHASE_KEYS
      .filter(k => chain[k])
      .map(k => parsePhase(k, chain[k]))
      .filter(Boolean) as ChainPhase[]
  }
  // 其他产业链数据结构没有 chain 字段，把每个二级行业提升为一个 ChainPhase
  const children = (raw.child_info || [])
    .map(parseSecondIndustry)
    .filter(Boolean) as SecondIndustry[]
  if (!children.length) return []
  return children.map(child => ({
    key: String(child.secondIndustryId),
    name: child.name,
    color: '#64748b',
    icon: 'i-lucide-layers',
    children: [child],
    totalCount: child.totalCount,
  }))
}

async function fetchChainData() {
  loading.value = true
  try {
    const res = await request.get('/company/chain')
    if (res.data?.code === 0 && res.data.data && typeof res.data.data === 'object') {
      const all = res.data.data as Record<string, any>
      chainList.value = Object.entries(all)
        .filter(([, v]) => v && typeof v === 'object')
        .map(([k, v]) => ({ key: k, name: v.name || `产业链${k}`, raw: v }))
      const target = chainList.value.find(c => c.key === '1') || chainList.value[0]
      if (target) {
        currentChainKey.value = target.key
        chainTitle.value = target.name
        chainPhases.value = buildChain(target.raw)
        selectedProduct.value = null
      }
    }
  } catch (e) {
    console.error('获取产业链数据失败:', e)
  } finally {
    loading.value = false
  }
}

function switchChain(key: string) {
  const target = chainList.value.find(c => c.key === key)
  if (!target || currentChainKey.value === key) return
  currentChainKey.value = key
  chainTitle.value = target.name
  chainPhases.value = buildChain(target.raw)
  phaseFilter.value = ''
  selectedProduct.value = null
  expandedIndustries.value = new Set()
}

async function fetchGlobalCharts() {
  try {
    const [parkRes, typeRes] = await Promise.all([
      request.get('/company/park'),
      request.get('/company/typeInfo'),
    ])
    if (parkRes.data?.code === 0 && Array.isArray(parkRes.data.data)) {
      globalParkList.value = parkRes.data.data
    }
    if (typeRes.data?.code === 0 && Array.isArray(typeRes.data.data)) {
      globalTypeList.value = typeRes.data.data
    }
  } catch (e) {
    console.error('获取图表数据失败:', e)
  }
}

function selectProduct(product: ProductType) {
  // 找到所属二级分类
  let parent: SecondIndustry | null = null
  for (const phase of chainPhases.value) {
    for (const ind of phase.children) {
      if (ind.children.some(p => p.productTypeId === product.productTypeId)) {
        parent = ind
        break
      }
    }
    if (parent) break
  }
  selectedSecondIndustry.value = parent
  selectedProduct.value = product
}

function openCompanyList(extra: Record<string, any>) {
  if (!selectedProduct.value) return
  companyFilter.value = {
    product_type: selectedProduct.value.productTypeId,
    ...(selectedSecondIndustry.value ? { sencond_industry_id: selectedSecondIndustry.value.secondIndustryId } : {}),
    ...extra,
  }
  companyModalTitle.value = selectedProduct.value.name
  companyModalVisible.value = true
  fetchCompanyList()
}

function openOtherCompanyList(productTypeId: number, secondIndustryId: number | null, productName: string, extra: Record<string, any>) {
  companyFilter.value = {
    product_type: productTypeId,
    ...(secondIndustryId ? { sencond_industry_id: secondIndustryId } : {}),
    ...extra,
  }
  companyModalTitle.value = productName
  selectedProduct.value = null
  companyModalVisible.value = true
  fetchCompanyList()
}

function getOtherSubList(other: any) {
  const subs: any[] = []
  for (const child of (other.raw.child_info || [])) {
    if (child.child_info && child.child_info.length) {
      for (const sub of child.child_info) {
        subs.push({
          ...sub,
          _secondIndustryId: child.sencond_industry_id,
          _secondIndustryName: child.name,
        })
      }
    } else {
      subs.push(child)
    }
  }
  return subs
}

function showOtherSubModal(other: any) {
  otherSubModalTitle.value = other.name
  otherSubModalList.value = getOtherSubList(other)
  otherSubModalVisible.value = true
}

function showICSubModal(industry: SecondIndustry) {
  otherSubModalTitle.value = industry.name
  otherSubModalList.value = industry.children.map(p => ({
    name: p.name,
    product_type_id: p.productTypeId,
    total_count: p.totalCount,
    company_info: (p.companyInfo || []).map((s: any) => ({
      sourceId: s.sourceId,
      source_name: s.sourceName,
      num: s.num,
    })),
    _secondIndustryId: industry.secondIndustryId,
  }))
  otherSubModalVisible.value = true
}

function toggleIndustryExpand(id: number) {
  const next = new Set(expandedIndustries.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIndustries.value = next
  nextTick(() => requestAnimationFrame(alignNodeCols))
}

function closeOtherSubModal() {
  otherSubModalVisible.value = false
}

async function fetchCompanyList() {
  companyLoading.value = true
  try {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(companyFilter.value)) {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v))
    }
    const res = await request.get(`/company/SearchInfo?${params.toString()}`)
    if (res.data?.code === 0 && res.data.data) {
      const data = res.data.data
      companyList.value = Array.isArray(data) ? data : (data.list || [])
      companyTotal.value = Array.isArray(data) ? data.length : (data.total || companyList.value.length || 0)
    }
  } catch (e) {
    console.error('获取企业列表失败:', e)
  } finally {
    companyLoading.value = false
  }
}

function closeCompanyList() {
  companyModalVisible.value = false
}

function companyUrl(code: string) {
  return { path: '/company-detail', query: { id: code } }
}

const chartTextColor = ref('#334155')
const chartAxisColor = ref('#cbd5e1')
const chartGridColor = ref('#cbd5e1')
const chartSurfaceColor = ref('#ffffff')
const chartSurfaceAltColor = ref('#f8fafc')

function updateChartColors() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const get = (name: string, fallback: string) =>
    getComputedStyle(root).getPropertyValue(name).trim() || fallback
  chartTextColor.value = get('--text', '#334155')
  chartAxisColor.value = get('--border', '#cbd5e1')
  chartGridColor.value = get('--border', '#cbd5e1')
  chartSurfaceColor.value = get('--surface', '#ffffff')
  chartSurfaceAltColor.value = get('--surface-alt', '#f8fafc')
  if (chainMindMapInstance && chainMindMapRef.value) {
    chainMindMapInstance.themeConfig.backgroundColor = chartSurfaceColor.value
    chainMindMapInstance.initTheme()
  }
  if (viewMode.value === 'tree') {
    nextTick(() => initChainMindMap())
  }
}

let chartColorObserver: MutationObserver | null = null
onMounted(() => {
  updateChartColors()
  chartColorObserver = new MutationObserver(() => updateChartColors())
  chartColorObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})
onBeforeUnmount(() => {
  chartColorObserver?.disconnect()
})

// 树形思维导图
const chainMindMapRef = ref<HTMLElement | null>(null)
let chainMindMapInstance: any = null
let chainMindMapViewApplied = false

function buildChainMindMapData() {
  if (!chainList.value.length) return null
  const textColor = chartTextColor.value
  const borderColor = chartAxisColor.value
  const surfaceAlt = chartSurfaceAltColor.value
  const surface = chartSurfaceColor.value
  const NATIVE_COLOR = '#10b981'
  const ATTRACT_COLOR = '#3b82f6'

  const mkSourceNode = (
    src: SourceInfo,
    productTypeId: number,
    secondIndustryId: number,
    productName: string,
  ) => {
    const isNative = src.sourceName.includes('本土')
    const c = isNative ? NATIVE_COLOR : ATTRACT_COLOR
    return {
      data: {
        text: `${src.sourceName}\u2002${src.num}家`,
        nodeType: 'source',
        productTypeId,
        secondIndustryId,
        sourceId: src.sourceId,
        sourceName: src.sourceName,
        productName,
        fillColor: `${c}18`,
        borderColor: c,
        color: c,
      },
      children: [],
    }
  }

  const mkProductNode = (product: ProductType, secondIndustryId: number) => ({
    data: {
      text: product.name,
      nodeType: 'product',
      productTypeId: product.productTypeId,
      secondIndustryId,
      productName: product.name,
      fillColor: surface,
      borderColor,
      color: textColor,
      expand: false,
    },
    children: product.companyInfo
      .filter(s => s.num > 0)
      .map(src => mkSourceNode(src, product.productTypeId, secondIndustryId, product.name)),
  })

  return {
    data: { text: '产业链', expand: true, nodeType: 'root' },
    children: chainList.value.map(chain => {
      const phases = buildChain(chain.raw)
      const isCurrent = chain.key === currentChainKey.value
      const chainColor = isCurrent ? '#6366f1' : '#64748b'
      return {
        data: {
          text: chain.name,
          nodeType: 'chain',
          fillColor: `${chainColor}1f`,
          borderColor: chainColor,
          color: chainColor,
          expand: isCurrent,
        },
        children: phases.map(phase => ({
          data: {
            text: phase.name,
            nodeType: 'phase',
            fillColor: `${phase.color}1f`,
            borderColor: phase.color,
            color: phase.color,
            expand: isCurrent,
          },
          children: phase.children.map(industry => ({
            data: {
              text: industry.name,
              nodeType: 'industry',
              fillColor: surfaceAlt,
              borderColor,
              color: textColor,
              expand: isCurrent,
            },
            children: industry.children.map(p => mkProductNode(p, industry.secondIndustryId)),
          })),
        })),
      }
    }),
  }
}

function handleChainMindMapNodeClick(node: any) {
  const nodeType = node?.getData?.('nodeType')
  if (nodeType === 'product') {
    const productTypeId = node?.getData?.('productTypeId')
    const secondIndustryId = node?.getData?.('secondIndustryId')
    const productName = node?.getData?.('productName') || ''
    if (!productTypeId) return
    openOtherCompanyList(productTypeId, secondIndustryId, productName, {})
  } else if (nodeType === 'source') {
    const productTypeId = node?.getData?.('productTypeId')
    const secondIndustryId = node?.getData?.('secondIndustryId')
    const sourceId = node?.getData?.('sourceId')
    const sourceName = node?.getData?.('sourceName') || ''
    const productName = node?.getData?.('productName') || ''
    if (!productTypeId || !sourceId) return
    openOtherCompanyList(
      productTypeId,
      secondIndustryId,
      productName ? `${productName} · ${sourceName}` : sourceName,
      { company_source: sourceId },
    )
  }
}

async function initChainMindMap() {
  if (typeof window === 'undefined' || !chainMindMapRef.value) return
  if (viewMode.value !== 'tree') return
  const mindData = buildChainMindMapData()
  if (!mindData) {
    if (chainMindMapInstance) {
      chainMindMapInstance.destroy()
      chainMindMapInstance = null
    }
    return
  }

  if (chainMindMapInstance) {
    chainMindMapInstance.destroy()
    chainMindMapInstance = null
    chainMindMapViewApplied = false
  }

  const el = chainMindMapRef.value
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) {
    requestAnimationFrame(() => initChainMindMap())
    return
  }

  try {
    const [{ default: MindMap }, { default: Drag }] = await Promise.all([
      import('simple-mind-map'),
      // @ts-ignore simple-mind-map 插件无类型声明
      import('simple-mind-map/src/plugins/Drag.js'),
    ])

    ;(MindMap as any).extendNodeDataNoStylePropList(['productTypeId', 'value', 'secondIndustryId', 'sourceId', 'sourceName', 'productName', 'nodeType'])
    chainMindMapInstance = new (MindMap as any)({
      el,
      data: mindData,
      layout: 'logicalStructure',
      readonly: true,
      fit: false,
      fitPadding: 28,
      alwaysShowExpandBtn: true,
      notShowExpandBtn: false,
      isShowExpandNum: true,
      scaleRatio: 0.1,
      minZoomRatio: 20,
      maxZoomRatio: 300,
      mousewheelAction: 'zoom',
      mouseScaleCenterUseMousePosition: false,
      initRootNodePosition: ['left', 'center'],
      themeConfig: {
        lineStyle: 'curve',
        backgroundColor: chartSurfaceColor.value,
        root: { fontSize: 18, paddingX: 20, paddingY: 10 },
        second: { marginX: 120, marginY: 28, fontSize: 15, paddingX: 16, paddingY: 8 },
        node: { marginX: 90, marginY: 14, fontSize: 13, paddingX: 12, paddingY: 5 },
      },
    })
    chainMindMapInstance.addPlugin(Drag)
    chainMindMapInstance.on('node_click', handleChainMindMapNodeClick)
    chainMindMapInstance.on('node_tree_render_end', () => {
      if (!chainMindMapInstance || chainMindMapViewApplied) return
      chainMindMapViewApplied = true
      const cx = (chainMindMapInstance.width ?? 0) / 2
      const cy = (chainMindMapInstance.height ?? 0) / 2
      chainMindMapInstance.view.fit(undefined, true, 28)
      const scale = Math.min(1.4, Math.max(0.8, chainMindMapInstance.view.scale * 1.15))
      chainMindMapInstance.view.setScale(scale, cx, cy)
    })
  } catch (e) {
    console.error('产业链思维导图初始化失败:', e)
  }
}

function resizeChainMindMap() {
  if (chainMindMapInstance) chainMindMapInstance.resize()
}

watch([() => viewMode.value, () => chainPhases.value, chainMindMapRef], () => {
  if (viewMode.value !== 'tree') {
    if (chainMindMapInstance) {
      chainMindMapInstance.destroy()
      chainMindMapInstance = null
      chainMindMapViewApplied = false
    }
    return
  }
  nextTick(() => initChainMindMap())
})

onMounted(() => window.addEventListener('resize', resizeChainMindMap))
onUnmounted(() => {
  window.removeEventListener('resize', resizeChainMindMap)
  if (chainMindMapInstance) {
    chainMindMapInstance.destroy()
    chainMindMapInstance = null
    chainMindMapViewApplied = false
  }
})

function buildBarOption(data: { name: string; value: number; id: number }[], color: string) {
  if (!data.length) return null
  return {
    tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
    grid: { left: 12, right: 24, top: 24, bottom: 24, containLabel: true },
    xAxis: {
      type: 'category' as const,
      data: data.map(d => d.name),
      axisLabel: { color: chartTextColor.value, fontSize: 11, interval: 0, rotate: data.length > 6 ? 30 : 0 },
      axisLine: { lineStyle: { color: chartAxisColor.value } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: chartTextColor.value, fontSize: 11 },
      splitLine: { lineStyle: { color: chartGridColor.value, opacity: 0.25, type: 'dashed' } },
    },
    series: [{
      type: 'bar' as const,
      data: data.map(d => ({ value: d.value, id: d.id })),
      barWidth: '50%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color,
      },
      label: { show: true, position: 'top' as const, fontSize: 11, color: chartTextColor.value },
    }],
  }
}

function handleChartAreaClick(evt: any, chartType: 'park' | 'type') {
  const chartComp = chartType === 'park' ? parkChartRef.value : typeChartRef.value
  if (!chartComp?.chart) return
  const ec = chartComp.chart
  const list = chartType === 'park' ? globalParkList.value : globalTypeList.value
  if (!list.length) return

  // 用 xAxisIndex 转换：将像素 x 坐标映射到分类索引，不依赖 y 坐标
  // 这样点击整列纵向任意位置都能命中对应分类
  let idx: number | null = null
  const xPt = ec.convertFromPixel({ xAxisIndex: 0 }, evt.offsetX)
  if (xPt != null && !isNaN(Number(xPt))) {
    idx = Math.round(Number(xPt))
  } else {
    // 降级：从 grid 转换
    const pt = ec.convertFromPixel({ gridIndex: 0 }, [evt.offsetX, evt.offsetY])
    if (pt != null && Array.isArray(pt)) idx = Math.round(pt[0])
  }

  if (idx == null || idx < 0 || idx >= list.length) return
  const item = list[idx]
  const id = chartType === 'park' ? (item as ParkItem).park_id : (item as TypeItem).type_id
  const key = chartType === 'park' ? 'park_id' : 'company_type'
  companyFilter.value = { [key]: id }
  companyModalTitle.value = item.park_name
  selectedProduct.value = null
  companyModalVisible.value = true
  fetchCompanyList()
}

const parkChartOption = computed(() =>
  buildBarOption(globalParkList.value.map(d => ({ name: d.park_name, value: d.num, id: d.park_id })), '#38bdf8')
)

const typeChartOption = computed(() =>
  buildBarOption(globalTypeList.value.map(d => ({ name: d.park_name, value: d.num, id: d.type_id })), '#a78bfa')
)

usePageInit(() => {
  fetchChainData()
  fetchGlobalCharts()
})

/* ── 卡片列与平行四边形底边对齐 ── */
const chainNodesBoardRef = ref<HTMLElement | null>(null)

function alignNodeCols() {
  if (typeof document === 'undefined') return
  const board = chainNodesBoardRef.value
  if (!board) return
  const cols = board.querySelectorAll<HTMLElement>(':scope > .chain-node-col')
  if (!cols.length) return

  /* 移动端垂直布局：清除定位，恢复自然流 */
  if (getComputedStyle(board).flexDirection === 'column') {
    cols.forEach(col => {
      col.style.position = ''
      col.style.top = ''
      col.style.bottom = ''
      col.style.left = ''
      col.style.width = ''
      col.style.flex = ''
      col.style.marginLeft = ''
      col.style.marginRight = ''
      col.style.gridColumn = ''
    })
    board.style.position = ''
    board.style.minHeight = ''
    board.style.gridTemplateColumns = ''
    return
  }

  const banner = board.parentElement?.querySelector('.chain-arrow-banner') as HTMLElement | null
  if (!banner) return
  const s = parseFloat(getComputedStyle(banner).getPropertyValue('--s')) || 14

  const botRow = banner.querySelector('.chain-arrow-bot') as HTMLElement | null
  if (!botRow) return
  const pars = botRow.querySelectorAll<HTMLElement>(':scope > .chain-par-sub')
  if (!pars.length || pars.length !== cols.length) return

  /* 绝对定位方案：每列卡片的 left/width 直接对应平行四边形底边的 left/width，无累计误差 */
  const boardRect = board.getBoundingClientRect()
  const bannerRect = banner.getBoundingClientRect()
  const boardContentLeft = boardRect.left + parseFloat(getComputedStyle(board).borderLeftWidth)

  let maxColHeight = 0
  Array.from(pars).forEach((par, i) => {
    const rect = par.getBoundingClientRect()
    const isLast = par.classList.contains('par-last')
    const isEmpty = cols[i]?.classList.contains('chain-node-col-empty')
    /* 下行平行四边形底边投影宽度：
       默认/中间列：底边从 x=0 到 x=parW-s，宽度 = parW - s
       par-last：底边从 x=0 到 x=parW，宽度 = parW */
    const bottomW = isLast ? rect.width : rect.width - s
    /* 占位列保持原外接矩形宽度，普通列使用底边宽度 */
    const colW = Math.max(1, isEmpty ? rect.width : bottomW)
    const left = rect.left - boardContentLeft

    if (cols[i]) {
      cols[i].style.position = 'absolute'
      cols[i].style.top = '0'
      cols[i].style.bottom = ''   // 先清除，让列高等于真实内容高再量取
      cols[i].style.left = `${left}px`
      cols[i].style.width = `${colW}px`
      cols[i].style.flex = 'none'
      cols[i].style.marginLeft = '0'
      cols[i].style.marginRight = '0'
      cols[i].style.gridColumn = ''
      maxColHeight = Math.max(maxColHeight, cols[i].scrollHeight)
    }
  })

  /* 绝对定位不撑开父容器，需显式设置 board 高度 */
  board.style.position = 'relative'
  board.style.minHeight = `${maxColHeight}px`
  /* 量取完毕后再统一拉伸到 board 底部，保证边框线整齐 */
  cols.forEach(col => { col.style.bottom = '0' })
}

watch([visiblePhases, viewMode], () => {
  if (viewMode.value === 'structure') {
    nextTick(() => {
      requestAnimationFrame(alignNodeCols)
    })
  }
})

onMounted(() => {
  window.addEventListener('resize', alignNodeCols)
  requestAnimationFrame(alignNodeCols)
})
onUnmounted(() => window.removeEventListener('resize', alignNodeCols))
</script>

<style scoped>
.chain-page {
  min-height: 100%;
  color: var(--text);
  background: var(--bg);
  padding-bottom: 32px;
}

/* ── 顶栏 ── */
.chain-top {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 28px 18px;
  flex-wrap: wrap;
  background: linear-gradient(180deg, color-mix(in srgb, var(--primary) 4%, var(--surface)), var(--surface));
  border-bottom: 1px solid var(--border);
}

.chain-top-title {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.chain-top-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 13px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}

.chain-top h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--text-strong);
  letter-spacing: 0.02em;
}

.chain-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.chain-tab {
  --tc: var(--primary);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chain-tab span { font-size: 11px; font-weight: 700; color: var(--tc); }
.chain-tab:hover { background: var(--surface-alt); color: var(--text); border-color: color-mix(in srgb, var(--tc) 30%, var(--border)); }
.chain-tab.on {
  background: color-mix(in srgb, var(--tc) 10%, var(--surface));
  color: var(--text-strong);
  border-color: color-mix(in srgb, var(--tc) 50%, var(--border));
  box-shadow: 0 2px 8px color-mix(in srgb, var(--tc) 15%, transparent);
}

/* ── 视图切换 ── */
.chain-view-toggle {
  flex-shrink: 0;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface-alt);
}

.chain-view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.18s;
}

.chain-view-btn:hover { background: var(--surface); color: var(--text); }
.chain-view-btn.on { background: var(--surface); color: var(--primary); box-shadow: 0 2px 6px rgba(0,0,0,0.06); }

/* ── 主区域 ── */
.chain-main { padding: 0 24px; }

.chain-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 240px;
  color: var(--text-muted);
}

.chain-spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ═══════════════════════════════════════════════════════
   新版产业链结构视图
   ═══════════════════════════════════════════════════════ */
.chain-structure-v2 {
  margin-bottom: 24px;
  margin-top: 20px;
}

/* ═══════════════════════════════════════════════════════
   双行平行四边形鱼形箭头
   ═══════════════════════════════════════════════════════ */
.chain-arrow-banner {
  --s: 14px;
  background: var(--bg);
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  padding: 0 1px;
}

.chain-arrow-row {
  display: flex;
  gap: 0;
}

.chain-arrow-top {
  padding-bottom: 3px; /* 上下行间隔 */
}

/* ── 每格基础样式 ── */
.chain-par {
  --tc: var(--primary);
  --f: 1;
  flex: var(--f);
  min-width: 0;
  position: relative;
}

/* ══ 上行（\ 方向）：左低右高 ══
   ・默认（中游）：左右均钝角斜切
   ・上游（par-first）：左侧同样钝角斜切，不特殊处理，沿用默认
   ・下游（par-last）：右侧垂直线
   ══ */
.chain-arrow-top .chain-par {
  clip-path: polygon(0 0, calc(100% - var(--s)) 0, 100% 100%, var(--s) 100%);
}
.chain-arrow-top .chain-par.par-last {
  /* 下游右侧垂直线 */
  clip-path: polygon(0 0, 100% 0, 100% 100%, var(--s) 100%);
}
.chain-arrow-top .chain-par.par-first.par-last {
  clip-path: polygon(0 0, 100% 0, 100% 100%, var(--s) 100%);
}

/* ══ 下行（/ 方向）：与上行镜像，合成鱼身 ══
   ・默认（中游）：左右均钝角斜切（反向）
   ・上游（par-first）：同默认，不单独处理
   ・下游（par-last）：左侧钝角斜切，右侧改为垂直线
   ══ */
.chain-arrow-bot .chain-par {
  clip-path: polygon(var(--s) 0, 100% 0, calc(100% - var(--s)) 100%, 0 100%);
}
.chain-arrow-bot .chain-par.par-last {
  /* 下游右侧垂直线 */
  clip-path: polygon(var(--s) 0, 100% 0, 100% 100%, 0 100%);
}
.chain-arrow-bot .chain-par.par-first.par-last {
  clip-path: polygon(var(--s) 0, 100% 0, 100% 100%, 0 100%);
}

/* ── 阶段格（上行，渐变色底） ── */
.chain-par-phase {
  background: linear-gradient(135deg, var(--tc), color-mix(in srgb, var(--tc) 70%, #000));
  min-height: 56px;
}

/* ── 子模块格（下行，淡渐变底） ── */
.chain-par-sub {
  background: linear-gradient(180deg, color-mix(in srgb, var(--tc) 22%, var(--surface-alt)), color-mix(in srgb, var(--tc) 12%, var(--surface-alt)));
  min-height: 36px;
}

/* 内容层：居中，左右内边距防止文字被裁剪角覆盖 */
.chain-par-in {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 100%;
  padding: 6px calc(var(--s) + 10px);
  white-space: nowrap;
  overflow: hidden;
}

.chain-arrow-top .chain-par-in { color: #fff; }
.chain-par-sub .chain-par-in { color: var(--text-strong); }

.cpi-icon { display: flex; align-items: center; opacity: 0.85; flex-shrink: 0; }
.cpi-name { font-size: 14px; font-weight: 800; letter-spacing: 0.06em; text-shadow: 0 1px 2px rgba(0,0,0,0.15); }
.cpi-cnt {
  font-style: normal;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.25);
  flex-shrink: 0;
  backdrop-filter: blur(4px);
}

.cpi-sub-name {
  font-size: 12px;
  font-weight: 700;
  color: color-mix(in srgb, var(--tc) 85%, var(--text-strong));
}
.cpi-sub-cnt {
  font-size: 10px;
  font-weight: 600;
  color: color-mix(in srgb, var(--tc) 70%, var(--text-muted));
  background: color-mix(in srgb, var(--tc) 14%, transparent);
  padding: 1px 6px;
  border-radius: 6px;
  flex-shrink: 0;
}

/* ── 节点卡片区域 ── */
.chain-nodes-board {
  display: grid;
  align-items: stretch;
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 14px 14px;
  overflow: hidden;
  background: var(--surface);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.chain-node-col {
  --tc: var(--primary);
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border);
  border-right: 1px solid var(--border);
  background: linear-gradient(180deg, color-mix(in srgb, var(--tc) 3%, var(--surface)), var(--surface));
  padding-top: 4px;
  box-sizing: border-box;
}

/* 产品节点卡片 */
.chain-product-node {
  margin: 6px 6px 0;
  border: 1px solid var(--border);
  border-left: 2px solid color-mix(in srgb, var(--tc) 45%, var(--border));
  border-radius: 8px;
  padding: 6px 8px;
  background: var(--surface);
  cursor: default;
  transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  animation: cpn-in 0.18s ease;
}

@keyframes cpn-in {
  from { opacity: 0; transform: translateY(-3px); }
  to   { opacity: 1; transform: translateY(0); }
}

.chain-product-node:last-child { margin-bottom: 6px; }

.chain-product-node:hover {
  border-color: color-mix(in srgb, var(--tc) 40%, var(--border));
  border-left-color: var(--tc);
  background: color-mix(in srgb, var(--tc) 4%, var(--surface));
  box-shadow: 0 2px 8px color-mix(in srgb, var(--tc) 10%, transparent);
  transform: translateY(-1px);
}

.chain-product-node.on {
  border-color: color-mix(in srgb, var(--tc) 50%, var(--border));
  border-left-color: var(--tc);
  background: color-mix(in srgb, var(--tc) 8%, var(--surface));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--tc) 20%, transparent), 0 2px 8px color-mix(in srgb, var(--tc) 12%, transparent);
}

.cpn-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-strong);
  line-height: 1.3;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 来源按钮区（本土培育 / 招商引资） */
.cpn-sources {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.cpn-src-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface-alt);
  color: var(--text-muted);
  font-size: 9px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
}

.cpn-src-btn:hover {
  border-color: var(--tc, var(--primary));
  background: color-mix(in srgb, var(--tc, var(--primary)) 8%, var(--surface-alt));
  color: var(--text-strong);
}

/* 本土培育：精致标签 */
.cpn-src-btn[data-src-type="native"] {
  --src: #10b981;
  border-color: color-mix(in srgb, var(--src) 40%, var(--border));
  background: color-mix(in srgb, var(--src) 8%, var(--surface-alt));
  color: color-mix(in srgb, var(--src) 55%, var(--text-strong));
  border-radius: 16px;
  padding: 2px 6px;
}
.cpn-src-btn[data-src-type="native"]::before {
  content: '';
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--src);
  opacity: 0.8;
}
.cpn-src-btn[data-src-type="native"] .cpn-src-num { color: color-mix(in srgb, var(--src) 80%, #000); }
.cpn-src-btn[data-src-type="native"]:hover {
  border-color: color-mix(in srgb, var(--src) 65%, var(--border));
  background: color-mix(in srgb, var(--src) 14%, var(--surface-alt));
}

/* 招商引资：精致标签 */
.cpn-src-btn[data-src-type="attract"] {
  --src: #3b82f6;
  border-color: color-mix(in srgb, var(--src) 40%, var(--border));
  background: color-mix(in srgb, var(--src) 8%, var(--surface-alt));
  color: color-mix(in srgb, var(--src) 55%, var(--text-strong));
  border-radius: 16px;
  padding: 2px 6px;
}
.cpn-src-btn[data-src-type="attract"]::before {
  content: '';
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--src);
  opacity: 0.8;
}
.cpn-src-btn[data-src-type="attract"] .cpn-src-num { color: color-mix(in srgb, var(--src) 80%, #000); }
.cpn-src-btn[data-src-type="attract"]:hover {
  border-color: color-mix(in srgb, var(--src) 65%, var(--border));
  background: color-mix(in srgb, var(--src) 14%, var(--surface-alt));
}

.cpn-src-label { font-size: 9px; }

.cpn-src-num {
  font-size: 9px;
  font-weight: 700;
  color: var(--tc, var(--primary));
  font-variant-numeric: tabular-nums;
}

.chain-node-empty {
  padding: 16px 10px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

/* 内联展开/收起按钮 */
.chain-inline-expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin: 6px 6px;
  padding: 6px 10px;
  border: 1px dashed color-mix(in srgb, var(--tc) 35%, var(--border));
  border-radius: 7px;
  background: color-mix(in srgb, var(--tc) 4%, var(--surface-alt));
  color: color-mix(in srgb, var(--tc) 75%, var(--text-muted));
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  width: calc(100% - 12px);
  letter-spacing: 0.02em;
}

.chain-inline-expand-btn:hover {
  border-color: color-mix(in srgb, var(--tc) 60%, var(--border));
  background: color-mix(in srgb, var(--tc) 10%, var(--surface-alt));
  color: var(--tc);
  border-style: solid;
  box-shadow: 0 1px 4px color-mix(in srgb, var(--tc) 12%, transparent);
}

/* ── 其他产业领域 ── */
.chain-other-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 32px 0 16px;
}

.coh-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border), transparent);
}

.coh-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: 0.04em;
}

.coh-title :deep(svg) { color: var(--primary); }

.chain-other-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.chain-other-card {
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: all 0.2s ease;
}

.chain-other-card:hover {
  border-color: color-mix(in srgb, var(--primary) 40%, var(--border));
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.chain-other-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, var(--surface)), color-mix(in srgb, var(--primary) 3%, var(--surface)));
}

.chain-other-card-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chain-other-sub-card {
  margin: 0;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 9px 11px;
  background: var(--surface);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  transition: all 0.15s ease;
}

.chain-other-sub-card:hover {
  border-color: color-mix(in srgb, var(--primary) 30%, var(--border));
  background: color-mix(in srgb, var(--primary) 4%, var(--surface));
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.coc-name {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cosc-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.cosc-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cosc-sources {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.cosc-src-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface-alt);
  color: var(--text-muted);
  font-size: 9px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
}

.cosc-src-btn:hover {
  border-color: var(--tc, var(--primary));
  background: color-mix(in srgb, var(--tc, var(--primary)) 8%, var(--surface-alt));
  color: var(--text-strong);
}

/* 本土培育：精致标签 */
.cosc-src-btn.csc-native {
  --src: #10b981;
  border-color: color-mix(in srgb, var(--src) 40%, var(--border));
  background: color-mix(in srgb, var(--src) 8%, var(--surface-alt));
  color: color-mix(in srgb, var(--src) 55%, var(--text-strong));
  border-radius: 16px;
  padding: 2px 6px;
}
.cosc-src-btn.csc-native::before {
  content: '';
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--src);
  opacity: 0.8;
}
.cosc-src-btn.csc-native .cosc-src-num { color: color-mix(in srgb, var(--src) 80%, #000); }
.cosc-src-btn.csc-native:hover {
  border-color: color-mix(in srgb, var(--src) 65%, var(--border));
  background: color-mix(in srgb, var(--src) 14%, var(--surface-alt));
}

/* 招商引资：精致标签 */
.cosc-src-btn.csc-attract {
  --src: #3b82f6;
  border-color: color-mix(in srgb, var(--src) 40%, var(--border));
  background: color-mix(in srgb, var(--src) 8%, var(--surface-alt));
  color: color-mix(in srgb, var(--src) 55%, var(--text-strong));
  border-radius: 16px;
  padding: 2px 6px;
}
.cosc-src-btn.csc-attract::before {
  content: '';
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--src);
  opacity: 0.8;
}
.cosc-src-btn.csc-attract .cosc-src-num { color: color-mix(in srgb, var(--src) 80%, #000); }
.cosc-src-btn.csc-attract:hover {
  border-color: color-mix(in srgb, var(--src) 65%, var(--border));
  background: color-mix(in srgb, var(--src) 14%, var(--surface-alt));
}

.cosc-src-num {
  font-size: 9px;
  font-weight: 700;
  color: var(--primary);
  font-variant-numeric: tabular-nums;
}

.cosc-cnt {
  font-size: 9px;
  font-weight: 700;
  color: var(--primary);
  padding: 1px 5px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--primary) 12%, transparent);
  flex-shrink: 0;
}

.chain-other-empty {
  padding: 16px 10px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

.chain-other-more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: 1px dashed var(--border);
  border-radius: 10px;
  background: var(--surface-alt);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
  width: 100%;
}

.chain-other-more-btn:hover {
  border-color: color-mix(in srgb, var(--primary) 50%, var(--border));
  background: color-mix(in srgb, var(--primary) 6%, var(--surface-alt));
  color: var(--primary);
  border-style: solid;
}

/* ── 树形图 ── */
.chain-tree-wrap {
  margin-bottom: 24px;
  margin-top: 20px;
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  padding: 12px;
}

.chain-tree-chart {
  width: 100%;
  height: 560px;
}

.chain-tree-chart :deep(.smm-node) { cursor: pointer; }
.chain-tree-chart :deep(.smm-expand-btn) { cursor: pointer; }

/* ── 底部图表 ── */
.chain-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.chain-chart-card {
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;
}

.chain-chart-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.chain-chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, var(--surface-alt), var(--surface));
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}

.chain-chart-title :deep(svg) { color: var(--primary); }

.chain-chart-wrap {
  padding: 12px;
  height: 300px;
}

.chain-chart { width: 100%; height: 100%; }

.chain-chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  font-size: 13px;
}

/* ── 企业列表弹窗 ── */
.chain-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.company-modal-overlay { z-index: 10000; }

.chain-modal-panel {
  width: 90vw;
  max-width: 700px;
  max-height: 80vh;
  background: var(--surface);
  border-radius: 18px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chain-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, var(--surface-alt), var(--surface));
}

.chain-modal-head h3 { margin: 0; font-size: 15px; font-weight: 700; color: var(--text-strong); }
.chain-modal-head p { margin: 4px 0 0; font-size: 12px; color: var(--text-muted); }

.chain-modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.chain-modal-close:hover { background: var(--surface); color: var(--text-strong); }

.chain-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  min-height: 200px;
}

.chain-modal-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
}

.chain-modal-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chain-modal-item:hover {
  background: var(--surface-alt);
  border-color: color-mix(in srgb, var(--primary) 40%, var(--border));
  transform: translateX(2px);
}

.chain-modal-av {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, var(--surface-alt)), var(--surface-alt));
  border: 1px solid var(--border);
  color: var(--primary);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
}

.chain-modal-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chain-modal-empty {
  text-align: center;
  padding: 32px;
  color: var(--text-muted);
  font-size: 13px;
}

/* ── 弹窗过渡 ── */
.chain-modal-enter-active, .chain-modal-leave-active { transition: opacity 0.3s ease; }
.chain-modal-enter-active .chain-modal-panel,
.chain-modal-leave-active .chain-modal-panel { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.chain-modal-enter-from, .chain-modal-leave-to { opacity: 0; }
.chain-modal-enter-from .chain-modal-panel { transform: scale(0.92) translateY(16px); }
.chain-modal-leave-to .chain-modal-panel { transform: scale(0.92) translateY(16px); }

/* ── 响应式 ── */
@media (max-width: 900px) {
  .chain-top { flex-direction: column; align-items: flex-start; }
  /* 移动端：取消鱼形，改为普通堆叠 */
  .chain-arrow-row { flex-wrap: wrap; }
  .chain-par,
  .chain-arrow-top .chain-par,
  .chain-arrow-bot .chain-par {
    clip-path: none !important;
    border-radius: 6px;
    margin-bottom: 2px;
    flex: none;
    width: 100%;
  }
  .chain-arrow-top .chain-par { width: 100%; }
  .chain-arrow-bot .chain-par { width: calc(50% - 2px); }
  .chain-nodes-board { display: flex; flex-direction: column; border-top: 1px solid var(--border); }
  .chain-node-col { border-right: none; border-bottom: 1px solid var(--border); width: 100% !important; grid-column: auto !important; }
  .chain-node-col:last-child { border-bottom: none; }
  .chain-charts { grid-template-columns: 1fr; }
  .chain-tree-chart { height: 420px; }
}

@media (max-width: 520px) {
  .chain-main { padding: 0 12px; }
  .chain-top { padding: 14px 12px; }
  .chain-modal-panel { width: 100vw; max-width: 100vw; border-radius: 12px 12px 0 0; }
  .chain-tree-chart { height: 360px; }
}

@media (prefers-reduced-motion: reduce) {
  .chain-spin,
  .chain-modal-enter-active,
  .chain-modal-leave-active,
  .chain-modal-enter-active .chain-modal-panel,
  .chain-modal-leave-active .chain-modal-panel {
    animation: none;
    transition: none;
  }
}
</style>
