<template>
  <div class="cd-page">
    <!-- 顶部面包屑 -->
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
      <!-- 企业头部 -->
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

      <!-- 主体：左侧菜单 + 右侧内容 -->
      <div class="cd-body">
        <aside class="cd-sidebar">
          <div
            v-for="menu in menus"
            :key="menu.key"
            class="cd-menu-item"
            :class="{ 'cd-menu-active': activeMenu === menu.key }"
            @click="activeMenu = menu.key"
          >
            <UIcon :name="menu.icon" class="size-4 cd-menu-icon" />
            <span class="cd-menu-label">{{ menu.label }}</span>
            <UIcon name="i-lucide-chevron-right" class="size-3.5 cd-menu-arrow" />
          </div>
        </aside>

        <div class="cd-content">
          <!-- 企业概览 -->
          <div v-if="activeMenu === 'overview'" class="cd-section">
            <h2 class="cd-section-title">
              <UIcon name="i-lucide-layout-dashboard" class="size-5" />
              企业概览
            </h2>
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
          </div>

          <!-- 基本信息 -->
          <div v-if="activeMenu === 'basic'" class="cd-section">
            <h2 class="cd-section-title">
              <UIcon name="i-lucide-file-text" class="size-5" />
              基本信息
            </h2>
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
          </div>

          <!-- 经营状况 -->
          <div v-if="activeMenu === 'business'" class="cd-section">
            <h2 class="cd-section-title">
              <UIcon name="i-lucide-bar-chart-3" class="size-5" />
              经营状况
            </h2>
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
          </div>

          <!-- 联系方式 -->
          <div v-if="activeMenu === 'contact'" class="cd-section">
            <h2 class="cd-section-title">
              <UIcon name="i-lucide-phone-call" class="size-5" />
              联系方式
            </h2>
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
          </div>
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

const menus = [
  { key: 'overview', label: '企业概览', icon: 'i-lucide-layout-dashboard' },
  { key: 'basic', label: '基本信息', icon: 'i-lucide-file-text' },
  { key: 'business', label: '经营状况', icon: 'i-lucide-bar-chart-3' },
  { key: 'contact', label: '联系方式', icon: 'i-lucide-phone-call' },
]

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
  min-height: calc(100vh - 90px);
  background: var(--bg);
}

/* ── 顶部面包屑 ─────────────────────────────────────── */
.cd-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
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

/* ── 未找到 ──────────────────────────────────────────── */
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

/* ── 企业头部 ────────────────────────────────────────── */
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

/* ── 主体 ────────────────────────────────────────────── */
.cd-body {
  display: flex;
  min-height: calc(100vh - 260px);
}

/* ── 左侧菜单 ────────────────────────────────────────── */
.cd-sidebar {
  width: 210px;
  min-width: 210px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 12px 0;
}
.cd-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 20px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  border-left: 3px solid transparent;
}
.cd-menu-item:hover {
  background: var(--surface-alt);
  color: var(--text-strong);
}
.cd-menu-active {
  background: color-mix(in srgb, var(--primary) 8%, transparent) !important;
  color: var(--primary) !important;
  border-left-color: var(--primary);
  font-weight: 600;
}
.cd-menu-icon {
  flex-shrink: 0;
  opacity: 0.65;
}
.cd-menu-active .cd-menu-icon {
  opacity: 1;
}
.cd-menu-arrow {
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.15s;
}
.cd-menu-active .cd-menu-arrow {
  opacity: 0.6;
}

/* ── 右侧内容 ────────────────────────────────────────── */
.cd-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 28px 32px;
}

/* ── 区块标题 ────────────────────────────────────────── */
.cd-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-strong);
  margin: 0 0 20px;
}

/* ── 概览卡片 ────────────────────────────────────────── */
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

/* ── 描述卡片 ────────────────────────────────────────── */
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

/* ── 信息网格 ────────────────────────────────────────── */
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

/* ── 信息表格 ────────────────────────────────────────── */
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

/* ── 经营卡片 ────────────────────────────────────────── */
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

/* ── 类型颜色 ────────────────────────────────────────── */
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