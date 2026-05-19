<template>
  <div class="cd-page">
    <div class="cd-topbar">
      <NuxtLink to="/geo-screen" class="cd-back-link">
        <UIcon name="i-lucide-arrow-left" class="size-4" />
        <span>返回地图</span>
      </NuxtLink>
      <div class="cd-breadcrumb">
        <span class="cd-bc-text">高新区企业地图</span>
        <UIcon name="i-lucide-chevron-right" class="size-3.5 cd-bc-sep" />
        <span class="cd-bc-current">{{ company?.name || '企业详情' }}</span>
      </div>
    </div>

    <div v-if="!company" class="cd-not-found">
      <UIcon name="i-lucide-building-x" class="size-12 opacity-20" />
      <p>未找到该企业信息</p>
      <NuxtLink to="/geo-screen" class="cd-back-btn">返回地图</NuxtLink>
    </div>

    <template v-else>
      <div class="cd-hero">
        <div class="cd-hero-logo" :style="{ background: getIndustryBg(company.industry) }">
          <span class="cd-hero-logo-text">{{ company.name.slice(0, 2) }}</span>
        </div>
        <div class="cd-hero-info">
          <h1 class="cd-hero-name">{{ company.name }}</h1>
          <div class="cd-hero-meta">
            <span :class="['cd-hero-type', getTypeCls(company.type)]">{{ company.type }}</span>
            <span class="cd-hero-industry">
              <UIcon name="i-lucide-briefcase" class="size-3.5" />
              {{ company.industry }}
            </span>
            <span class="cd-hero-founded">
              <UIcon name="i-lucide-calendar" class="size-3.5" />
              成立{{ company.founded }}年
            </span>
            <span class="cd-hero-city">
              <UIcon name="i-lucide-map-pin" class="size-3.5" />
              {{ company.province }} · {{ company.city }}
            </span>
          </div>
        </div>
      </div>

      <div class="cd-body">
        <aside class="cd-sidebar">
          <div
            v-for="group in menuGroups"
            :key="group.key"
            class="cd-menu-group"
            :class="{ 'cd-menu-group-open': expandedGroups.has(group.key) }"
          >
            <div
              class="cd-menu-group-header"
              @click="toggleGroup(group.key)"
            >
              <UIcon :name="group.icon" class="size-4 cd-menu-icon" />
              <span class="cd-menu-label">{{ group.label }}</span>
              <UIcon
                name="i-lucide-chevron-down"
                class="size-3.5 cd-menu-arrow"
              />
            </div>
            <Transition name="cd-slide">
              <div v-if="expandedGroups.has(group.key)" class="cd-menu-group-children">
                <div
                  v-for="child in group.children"
                  :key="child.key"
                  class="cd-menu-item"
                  :class="{ 'cd-menu-active': activeMenu === child.key }"
                  @click="scrollToSection(child.key)"
                >
                  <span class="cd-menu-item-label">{{ child.label }}</span>
                </div>
              </div>
            </Transition>
          </div>
        </aside>

        <div ref="contentRef" class="cd-content">
          <!-- 企业概览 -->
          <section id="section-overview" class="cd-section">
            <h2 class="cd-section-title">
              <UIcon name="i-lucide-layout-dashboard" class="size-5" />
              企业概览
            </h2>
            <template v-if="hasSectionData('overview')">
            <div class="cd-overview-cards">
              <div class="cd-ov-card">
                <div class="cd-ov-card-icon cd-ov-icon-employees">
                  <UIcon name="i-lucide-users" class="size-5" />
                </div>
                <div class="cd-ov-card-body">
                  <div class="cd-ov-card-val">{{ fmtNum(company.employees) }}</div>
                  <div class="cd-ov-card-lbl">在职员工</div>
                </div>
              </div>
              <div class="cd-ov-card">
                <div class="cd-ov-card-icon cd-ov-icon-revenue">
                  <UIcon name="i-lucide-trending-up" class="size-5" />
                </div>
                <div class="cd-ov-card-body">
                  <div class="cd-ov-card-val">{{ company.revenue }}</div>
                  <div class="cd-ov-card-lbl">年营收</div>
                </div>
              </div>
              <div class="cd-ov-card">
                <div class="cd-ov-card-icon cd-ov-icon-founded">
                  <UIcon name="i-lucide-calendar-check" class="size-5" />
                </div>
                <div class="cd-ov-card-body">
                  <div class="cd-ov-card-val">{{ company.founded }}年</div>
                  <div class="cd-ov-card-lbl">成立年份</div>
                </div>
              </div>
              <div class="cd-ov-card">
                <div class="cd-ov-card-icon cd-ov-icon-tags">
                  <UIcon name="i-lucide-tags" class="size-5" />
                </div>
                <div class="cd-ov-card-body">
                  <div class="cd-ov-card-val">{{ company.tags.length }}</div>
                  <div class="cd-ov-card-lbl">业务标签</div>
                </div>
              </div>
            </div>

            <div class="cd-desc-card">
              <h3 class="cd-desc-card-title">企业简介</h3>
              <p class="cd-desc-text">{{ company.description }}</p>
            </div>

            <div class="cd-desc-card">
              <h3 class="cd-desc-card-title">业务标签</h3>
              <div class="cd-tags">
                <UBadge v-for="t in company.tags" :key="t" :label="t" variant="soft" color="primary" size="sm" />
              </div>
            </div>

            <div class="cd-desc-card">
              <h3 class="cd-desc-card-title">基本信息</h3>
              <div class="cd-info-grid">
                <div class="cd-info-item">
                  <span class="cd-info-label">企业类型</span>
                  <span :class="['cd-info-value cd-type-text', getTypeCls(company.type)]">{{ company.type }}</span>
                </div>
                <div class="cd-info-item">
                  <span class="cd-info-label">所属行业</span>
                  <span class="cd-info-value">{{ company.industry }}</span>
                </div>
                <div class="cd-info-item">
                  <span class="cd-info-label">所在地区</span>
                  <span class="cd-info-value">{{ company.province }} · {{ company.city }}</span>
                </div>
                <div class="cd-info-item">
                  <span class="cd-info-label">成立时间</span>
                  <span class="cd-info-value">{{ company.founded }}年</span>
                </div>
              </div>
            </div>
            </template>
            <div v-else class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 基本信息 -->
          <section id="section-basic" class="cd-section">
            <h2 class="cd-section-title">
              <UIcon name="i-lucide-file-text" class="size-5" />
              基本信息
            </h2>
            <template v-if="hasSectionData('basic')">
            <div class="cd-info-table">
              <div class="cd-info-row-detail">
                <div class="cd-info-row-left">
                  <UIcon name="i-lucide-building-2" class="size-4" />
                  <span>企业名称</span>
                </div>
                <span class="cd-info-row-right">{{ company.name }}</span>
              </div>
              <div class="cd-info-row-detail">
                <div class="cd-info-row-left">
                  <UIcon name="i-lucide-tag" class="size-4" />
                  <span>企业类型</span>
                </div>
                <span :class="['cd-info-row-right cd-type-text', getTypeCls(company.type)]">{{ company.type }}</span>
              </div>
              <div class="cd-info-row-detail">
                <div class="cd-info-row-left">
                  <UIcon name="i-lucide-briefcase" class="size-4" />
                  <span>所属行业</span>
                </div>
                <span class="cd-info-row-right">{{ company.industry }}</span>
              </div>
              <div class="cd-info-row-detail">
                <div class="cd-info-row-left">
                  <UIcon name="i-lucide-calendar" class="size-4" />
                  <span>成立时间</span>
                </div>
                <span class="cd-info-row-right">{{ company.founded }}年</span>
              </div>
              <div class="cd-info-row-detail">
                <div class="cd-info-row-left">
                  <UIcon name="i-lucide-map-pin" class="size-4" />
                  <span>注册地区</span>
                </div>
                <span class="cd-info-row-right">{{ company.province }} · {{ company.city }}</span>
              </div>
              <div class="cd-info-row-detail">
                <div class="cd-info-row-left">
                  <UIcon name="i-lucide-map" class="size-4" />
                  <span>详细地址</span>
                </div>
                <span class="cd-info-row-right">{{ company.address }}</span>
              </div>
              <div class="cd-info-row-detail">
                <div class="cd-info-row-left">
                  <UIcon name="i-lucide-align-left" class="size-4" />
                  <span>企业简介</span>
                </div>
                <span class="cd-info-row-right">{{ company.description }}</span>
              </div>
            </div>
            </template>
            <div v-else class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 经营状况 -->
          <section id="section-business" class="cd-section">
            <h2 class="cd-section-title">
              <UIcon name="i-lucide-bar-chart-3" class="size-5" />
              经营状况
            </h2>
            <template v-if="hasSectionData('business')">
            <div class="cd-business-cards">
              <div class="cd-biz-card">
                <div class="cd-biz-card-header">
                  <UIcon name="i-lucide-users" class="size-5 text-primary" />
                  <span>员工规模</span>
                </div>
                <div class="cd-biz-card-value">{{ fmtNum(company.employees) }}</div>
                <div class="cd-biz-card-desc">在职员工总数</div>
              </div>
              <div class="cd-biz-card">
                <div class="cd-biz-card-header">
                  <UIcon name="i-lucide-trending-up" class="size-5 text-success" />
                  <span>年度营收</span>
                </div>
                <div class="cd-biz-card-value">{{ company.revenue }}</div>
                <div class="cd-biz-card-desc">最新年度营收额</div>
              </div>
            </div>

            <div class="cd-desc-card cd-mt">
              <h3 class="cd-desc-card-title">业务标签</h3>
              <div class="cd-tags">
                <UBadge v-for="t in company.tags" :key="t" :label="t" variant="soft" color="primary" size="sm" />
              </div>
            </div>
            </template>
            <div v-else class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 联系方式 -->
          <section id="section-contact" class="cd-section">
            <h2 class="cd-section-title">
              <UIcon name="i-lucide-phone-call" class="size-5" />
              联系方式
            </h2>
            <template v-if="hasSectionData('contact')">
            <div class="cd-info-table">
              <div class="cd-info-row-detail">
                <div class="cd-info-row-left">
                  <UIcon name="i-lucide-phone" class="size-4" />
                  <span>联系电话</span>
                </div>
                <span class="cd-info-row-right cd-link-text">{{ company.phone }}</span>
              </div>
              <div class="cd-info-row-detail">
                <div class="cd-info-row-left">
                  <UIcon name="i-lucide-globe" class="size-4" />
                  <span>官方网站</span>
                </div>
                <a :href="`https://${company.website}`" target="_blank" class="cd-info-row-right cd-link-text cd-link-hover">
                  {{ company.website }}
                  <UIcon name="i-lucide-external-link" class="size-3.5" />
                </a>
              </div>
              <div class="cd-info-row-detail">
                <div class="cd-info-row-left">
                  <UIcon name="i-lucide-map-pin" class="size-4" />
                  <span>公司地址</span>
                </div>
                <span class="cd-info-row-right">{{ company.address }}</span>
              </div>
              <div class="cd-info-row-detail">
                <div class="cd-info-row-left">
                  <UIcon name="i-lucide-map" class="size-4" />
                  <span>所在地区</span>
                </div>
                <span class="cd-info-row-right">{{ company.province }} · {{ company.city }}</span>
              </div>
            </div>
            </template>
            <div v-else class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { COMPANIES } from '~/data/mock'
import type { CompanyRecord } from '~/data/mock'
import {
  getIndustryColor,
} from '~/composables/useGeoLeafletMap'

definePageMeta({ middleware: 'auth', layout: 'blank' })

const route = useRoute()
const companyId = computed(() => route.query.id as string | undefined)
const company = computed<CompanyRecord | undefined>(() =>
  COMPANIES.find(c => c.id === companyId.value),
)

const activeMenu = ref('overview')
const expandedGroups = ref(new Set(['company-info', 'business-info', 'contact-info']))
const contentRef = ref<HTMLElement | null>(null)
const isScrolling = ref(false)

const menuGroups = [
  {
    key: 'company-info',
    label: '企业信息',
    icon: 'i-lucide-building-2',
    children: [
      { key: 'overview', label: '企业概览', icon: 'i-lucide-layout-dashboard' },
      { key: 'basic', label: '基本信息', icon: 'i-lucide-file-text' },
    ],
  },
  {
    key: 'business-info',
    label: '经营数据',
    icon: 'i-lucide-bar-chart-3',
    children: [
      { key: 'business', label: '经营状况', icon: 'i-lucide-bar-chart-3' },
    ],
  },
  {
    key: 'contact-info',
    label: '联系信息',
    icon: 'i-lucide-phone-call',
    children: [
      { key: 'contact', label: '联系方式', icon: 'i-lucide-phone-call' },
    ],
  },
]

const sectionKeys = menuGroups.flatMap(g => g.children.map(c => c.key))

function findGroupKey(childKey: string): string | undefined {
  return menuGroups.find(g => g.children.some(c => c.key === childKey))?.key
}

function toggleGroup(key: string) {
  if (expandedGroups.value.has(key)) {
    expandedGroups.value.delete(key)
  } else {
    expandedGroups.value.add(key)
  }
  expandedGroups.value = new Set(expandedGroups.value)
}

function ensureGroupExpanded(childKey: string) {
  const groupKey = findGroupKey(childKey)
  if (groupKey && !expandedGroups.value.has(groupKey)) {
    expandedGroups.value.add(groupKey)
    expandedGroups.value = new Set(expandedGroups.value)
  }
}

function hasSectionData(key: string): boolean {
  if (!company.value) return false
  const c = company.value
  switch (key) {
    case 'overview':
      return !!(c.employees || c.revenue || c.description || c.tags?.length)
    case 'basic':
      return !!(c.name || c.type || c.industry || c.founded || c.address || c.description)
    case 'business':
      return !!(c.employees || c.revenue || c.tags?.length)
    case 'contact':
      return !!(c.phone || c.website || c.address)
    default:
      return true
  }
}

function scrollToSection(key: string) {
  ensureGroupExpanded(key)
  activeMenu.value = key
  isScrolling.value = true
  nextTick(() => {
    const el = document.getElementById(`section-${key}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setTimeout(() => {
      isScrolling.value = false
      activeMenu.value = key
      ensureGroupExpanded(key)
    }, 800)
  })
}

let scrollRaf = 0

function onContentScroll() {
  if (isScrolling.value) return
  cancelAnimationFrame(scrollRaf)
  scrollRaf = requestAnimationFrame(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    const offset = 120
    let current = sectionKeys[0]
    if (maxScroll > 0 && scrollTop >= maxScroll - 10) {
      current = sectionKeys[sectionKeys.length - 1]
    } else {
      for (const key of sectionKeys) {
        const el = document.getElementById(`section-${key}`)
        if (el && el.offsetTop - offset <= scrollTop) {
          current = key
        }
      }
    }
    if (current && activeMenu.value !== current) {
      activeMenu.value = current
      ensureGroupExpanded(current)
    }
  })
}

onMounted(() => {
  window.addEventListener('scroll', onContentScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onContentScroll)
  cancelAnimationFrame(scrollRaf)
})

function getIndustryBg(industry: string): string {
  return getIndustryColor(industry)
}

function getTypeCls(type: string): string {
  return ({ '国企': 'type-state', '民企': 'type-private', '外资': 'type-foreign', '上市公司': 'type-listed' })[type] || ''
}

function fmtNum(n: number): string {
  if (n >= 100000) return `${(n / 10000).toFixed(0)}万`
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return `${n}`
}
</script>

<style scoped>
.cd-page {
  margin: -24px;
  min-height: 100vh;
  background: var(--bg);
}

.cd-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
}
.cd-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.15s;
}
.cd-back-link:hover {
  color: var(--primary);
}
.cd-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
}
.cd-bc-sep {
  opacity: 0.4;
}
.cd-bc-current {
  color: var(--text-strong);
  font-weight: 600;
}

.cd-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 24px;
  color: var(--text-muted);
  font-size: 15px;
}
.cd-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  background: var(--primary);
  border-radius: 8px;
  text-decoration: none;
  transition: opacity 0.15s;
}
.cd-back-btn:hover {
  opacity: 0.85;
}

.cd-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 32px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.cd-hero-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  flex-shrink: 0;
}
.cd-hero-logo-text {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}
.cd-hero-info {
  flex: 1;
  min-width: 0;
}
.cd-hero-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-strong);
  margin: 0 0 10px;
  line-height: 1.25;
}
.cd-hero-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.cd-hero-type {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 5px;
}
.cd-hero-industry,
.cd-hero-founded,
.cd-hero-city {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-muted);
}

.cd-body {
  display: flex;
  gap: 24px;
  padding: 24px;
  align-items: flex-start;
}

.cd-sidebar {
  width: 232px;
  min-width: 232px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 8px;
  position: sticky;
  top: 62px;
  max-height: calc(100vh - 86px);
  overflow-y: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02);
}
.cd-sidebar::-webkit-scrollbar {
  width: 0;
}
.cd-menu-group {
  border-radius: 10px;
  overflow: hidden;
}
.cd-menu-group + .cd-menu-group {
  margin-top: 4px;
}
.cd-menu-group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  user-select: none;
  border-radius: 10px;
  letter-spacing: 0.02em;
}
.cd-menu-group-header:hover {
  background: color-mix(in srgb, var(--primary) 6%, transparent);
}
.cd-menu-icon {
  flex-shrink: 0;
  opacity: 0.5;
  transition: opacity 0.2s, color 0.2s;
}
.cd-menu-group-header:hover .cd-menu-icon {
  opacity: 0.9;
  color: var(--primary);
}
.cd-menu-group-header .cd-menu-arrow {
  margin-left: auto;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.35;
}
.cd-menu-group-header:hover .cd-menu-arrow {
  opacity: 0.65;
}
.cd-menu-group-open .cd-menu-arrow {
  transform: rotate(180deg);
}
.cd-menu-group-open .cd-menu-group-header {
  background: color-mix(in srgb, var(--primary) 4%, transparent);
}
.cd-menu-group-children {
  overflow: hidden;
  padding: 4px 0 6px;
}
.cd-slide-enter-active,
.cd-slide-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
  max-height: 200px;
  opacity: 1;
}
.cd-slide-enter-from,
.cd-slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.cd-menu-item {
  display: flex;
  align-items: center;
  padding: 9px 14px 9px 28px;
  margin: 2px 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 8px;
  position: relative;
}
.cd-menu-item::before {
  content: '';
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--text-muted);
  opacity: 0.35;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.cd-menu-item:hover {
  background: var(--surface-alt);
  color: var(--text);
}
.cd-menu-item:hover::before {
  opacity: 0.6;
}
.cd-menu-active {
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  color: var(--primary);
  font-weight: 600;
}
.cd-menu-active::before {
  width: 4px;
  height: 16px;
  border-radius: 2px;
  background: var(--primary);
  opacity: 1;
  top: 50%;
  transform: translateY(-50%);
}

.cd-content {
  flex: 1;
  min-width: 0;
}

.cd-section {
  scroll-margin-top: 72px;
  padding-bottom: 32px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border);
}
.cd-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}
.cd-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-strong);
  margin: 0 0 20px;
}

.cd-overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}
.cd-ov-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.cd-ov-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  flex-shrink: 0;
}
.cd-ov-icon-employees {
  background: color-mix(in srgb, var(--primary) 12%, transparent);
  color: var(--primary);
}
.cd-ov-icon-revenue {
  background: color-mix(in srgb, var(--success) 12%, transparent);
  color: var(--success);
}
.cd-ov-icon-founded {
  background: color-mix(in srgb, var(--warning) 12%, transparent);
  color: var(--warning);
}
.cd-ov-icon-tags {
  background: color-mix(in srgb, var(--info) 12%, transparent);
  color: var(--info);
}
.cd-ov-card-body {
  flex: 1;
  min-width: 0;
}
.cd-ov-card-val {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-strong);
  font-family: var(--font-display);
}
.cd-ov-card-lbl {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.cd-desc-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px 22px;
  margin-bottom: 16px;
}
.cd-desc-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-strong);
  margin: 0 0 10px;
}
.cd-desc-text {
  font-size: 13px;
  color: var(--text);
  line-height: 1.7;
  margin: 0;
}
.cd-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cd-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}
.cd-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cd-info-label {
  font-size: 11px;
  color: var(--text-muted);
}
.cd-info-value {
  font-size: 13px;
  color: var(--text);
  font-weight: 500;
}

.cd-info-table {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.cd-info-row-detail {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  gap: 16px;
}
.cd-info-row-detail:last-child {
  border-bottom: none;
}
.cd-info-row-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
  flex-shrink: 0;
}
.cd-info-row-right {
  font-size: 13px;
  color: var(--text);
  font-weight: 500;
  text-align: right;
  word-break: break-all;
}
.cd-link-text {
  color: var(--primary) !important;
}
.cd-link-hover {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-decoration: none;
}
.cd-link-hover:hover {
  text-decoration: underline;
}

.cd-business-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}
.cd-biz-card {
  padding: 22px 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.cd-biz-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 14px;
}
.cd-biz-card-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-strong);
  font-family: var(--font-display);
  margin-bottom: 6px;
}
.cd-biz-card-desc {
  font-size: 11px;
  color: var(--text-muted);
}

.cd-mt {
  margin-top: 0;
}

.cd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
}
.cd-empty-divider {
  width: 40px;
  height: 1px;
  background: var(--border);
}
.cd-empty-text {
  font-size: 13px;
  color: var(--text-muted);
  opacity: 0.6;
}

.type-state {
  background: color-mix(in srgb, var(--danger) 10%, transparent);
  color: var(--danger);
}
.type-private {
  background: color-mix(in srgb, var(--info) 10%, transparent);
  color: var(--info);
}
.type-foreign {
  background: color-mix(in srgb, var(--warning) 10%, transparent);
  color: var(--warning);
}
.type-listed {
  background: color-mix(in srgb, var(--success) 10%, transparent);
  color: var(--success);
}
.cd-type-text.type-state { color: var(--danger); background: none; }
.cd-type-text.type-private { color: var(--info); background: none; }
.cd-type-text.type-foreign { color: var(--warning); background: none; }
.cd-type-text.type-listed { color: var(--success); background: none; }
</style>
