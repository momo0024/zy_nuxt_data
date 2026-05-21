<template>
  <div class="cd-page">
    <div class="cd-topbar">
      <NuxtLink to="/geo-screen" class="cd-back-link">
        <UIcon name="i-lucide-arrow-left" class="size-4" />
        <span>返回地图</span>
      </NuxtLink>
      <div class="cd-breadcrumb">
        <span class="cd-bc-text">企业地图</span>
        <UIcon name="i-lucide-chevron-right" class="size-3.5 cd-bc-sep" />
        <span class="cd-bc-current">{{ company?.company_name || '企业详情' }}</span>
      </div>
    </div>

    <div v-if="loading" class="cd-loading">
      <div class="cd-loading-ring" />
      <span>加载中…</span>
    </div>

    <div v-else-if="!company" class="cd-not-found">
      <UIcon name="i-lucide-building-x" class="size-12 opacity-20" />
      <p>未找到该企业信息</p>
      <NuxtLink to="/geo-screen" class="cd-back-btn">返回地图</NuxtLink>
    </div>

    <template v-else>
      <div class="cd-hero">
        <div class="cd-hero-logo" :style="{ background: getIndustryBg(company.company_industry) }">
          <span class="cd-hero-logo-text">{{ company.company_name.slice(0, 2) }}</span>
        </div>
        <div class="cd-hero-info">
          <h1 class="cd-hero-name">
            {{ company.company_name }}
            <span v-if="company.company_traded === 1" class="cd-hero-listed-badge">上市公司</span>
          </h1>
          <div class="cd-hero-meta">
            <span class="cd-hero-type-badge">{{ company.company_type }}</span>
            <span class="cd-hero-industry">
              <UIcon name="i-lucide-briefcase" class="size-3.5" />
              {{ company.company_industry }}
            </span>
            <span class="cd-hero-founded">
              <UIcon name="i-lucide-calendar" class="size-3.5" />
              {{ company.company_found_date }}
            </span>
            <span class="cd-hero-city">
              <UIcon name="i-lucide-map-pin" class="size-3.5" />
              {{ company.company_city }} · {{ company.conpany_district || '' }}
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
                <div class="cd-ov-card-icon cd-ov-icon-capital">
                  <UIcon name="i-lucide-landmark" class="size-5" />
                </div>
                <div class="cd-ov-card-body">
                  <div class="cd-ov-card-val">{{ company.company_registered_capital }}</div>
                  <div class="cd-ov-card-lbl">注册资本</div>
                </div>
              </div>
              <div class="cd-ov-card">
                <div class="cd-ov-card-icon cd-ov-icon-founded">
                  <UIcon name="i-lucide-calendar-check" class="size-5" />
                </div>
                <div class="cd-ov-card-body">
                  <div class="cd-ov-card-val">{{ company.company_found_date }}</div>
                  <div class="cd-ov-card-lbl">成立日期</div>
                </div>
              </div>
              <div
                v-if="company.company_business_status && company.company_business_status !== '-'"
                class="cd-ov-card cd-ov-card--tip"
              >
                <div class="cd-ov-card-icon cd-ov-icon-status">
                  <UIcon name="i-lucide-activity" class="size-5" />
                </div>
                <div class="cd-ov-card-body">
                  <div class="cd-ov-tip-trigger">
                    <span class="cd-ov-card-lbl cd-ov-card-lbl--inline">经营状态</span>
                    <UIcon name="i-lucide-info" class="cd-ov-tip-icon size-3.5" />
                    <span class="cd-ov-tip-bubble" role="tooltip">{{ company.company_business_status }}</span>
                  </div>
                </div>
              </div>
              <div class="cd-ov-card">
                <div class="cd-ov-card-icon cd-ov-icon-industry">
                  <UIcon name="i-lucide-briefcase" class="size-5" />
                </div>
                <div class="cd-ov-card-body">
                  <div class="cd-ov-card-val">{{ company.company_industry }}</div>
                  <div class="cd-ov-card-lbl">所属行业</div>
                </div>
              </div>
            </div>

            <div class="cd-desc-card">
              <h3 class="cd-desc-card-title">经营范围</h3>
              <p class="cd-desc-text">{{ company.company_business_scope }}</p>
            </div>
            </template>
            <div v-else class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 基本信息（含工商信息） -->
          <section id="section-basic" class="cd-section">
            <h2 class="cd-section-title">
              <UIcon name="i-lucide-file-text" class="size-5" />
              基本信息
              <span v-if="sectionLoading.register" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <div class="cd-register-grid">
              <template v-if="registerInfo?.length">
                <div v-for="(item, idx) in registerInfo" :key="idx" class="cd-register-item">
                  <div class="cd-register-label">
                    <UIcon :name="registerDisplayMap[item.key]?.icon || 'i-lucide-file-text'" class="size-3.5" />
                    <span>{{ item.key }}</span>
                  </div>
                  <div class="cd-register-value">{{ item.value || '-' }}</div>
                </div>
              </template>
              <template v-else>
                <div class="cd-info-row-detail">
                  <div class="cd-info-row-left">
                    <UIcon name="i-lucide-building-2" class="size-4" />
                    <span>企业名称</span>
                  </div>
                  <span class="cd-info-row-right">{{ company.company_name }}</span>
                </div>
                <div class="cd-info-row-detail">
                  <div class="cd-info-row-left">
                    <UIcon name="i-lucide-tag" class="size-4" />
                    <span>企业类型</span>
                  </div>
                  <span class="cd-info-row-right">{{ company.company_type }}</span>
                </div>
                <div class="cd-info-row-detail">
                  <div class="cd-info-row-left">
                    <UIcon name="i-lucide-briefcase" class="size-4" />
                    <span>所属行业</span>
                  </div>
                  <span class="cd-info-row-right">{{ company.company_industry }}</span>
                </div>
                <div class="cd-info-row-detail">
                  <div class="cd-info-row-left">
                    <UIcon name="i-lucide-user" class="size-4" />
                    <span>法定代表人</span>
                  </div>
                  <span class="cd-info-row-right">{{ company.company_legal_person }}</span>
                </div>
                <div class="cd-info-row-detail">
                  <div class="cd-info-row-left">
                    <UIcon name="i-lucide-landmark" class="size-4" />
                    <span>注册资本</span>
                  </div>
                  <span class="cd-info-row-right">{{ company.company_registered_capital }}</span>
                </div>
                <div class="cd-info-row-detail">
                  <div class="cd-info-row-left">
                    <UIcon name="i-lucide-calendar" class="size-4" />
                    <span>成立日期</span>
                  </div>
                  <span class="cd-info-row-right">{{ company.company_found_date }}</span>
                </div>
                <div class="cd-info-row-detail">
                  <div class="cd-info-row-left">
                    <UIcon name="i-lucide-activity" class="size-4" />
                    <span>经营状态</span>
                  </div>
                  <span class="cd-info-row-right">{{ company.company_business_status }}</span>
                </div>
                <div class="cd-info-row-detail">
                  <div class="cd-info-row-left">
                    <UIcon name="i-lucide-fingerprint" class="size-4" />
                    <span>统一社会信用代码</span>
                  </div>
                  <span class="cd-info-row-right cd-mono-text">{{ company.company_credit_code }}</span>
                </div>
                <div class="cd-info-row-detail">
                  <div class="cd-info-row-left">
                    <UIcon name="i-lucide-map-pin" class="size-4" />
                    <span>注册地区</span>
                  </div>
                  <span class="cd-info-row-right">{{ company.company_city }} · {{ company.conpany_district || '' }}</span>
                </div>
                <div class="cd-info-row-detail">
                  <div class="cd-info-row-left">
                    <UIcon name="i-lucide-map" class="size-4" />
                    <span>详细地址</span>
                  </div>
                  <span class="cd-info-row-right">{{ company.company_work_add || '-' }}</span>
                </div>
              </template>
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
                  <UIcon name="i-lucide-landmark" class="size-5 text-primary" />
                  <span>注册资本</span>
                </div>
                <div class="cd-biz-card-value">{{ company.company_registered_capital }}</div>
                <div class="cd-biz-card-desc">企业注册资金</div>
              </div>
              <div class="cd-biz-card">
                <div class="cd-biz-card-header">
                  <UIcon name="i-lucide-activity" class="size-5 text-success" />
                  <span>经营状态</span>
                </div>
                <div class="cd-biz-card-value">{{ company.company_business_status }}</div>
                <div class="cd-biz-card-desc">当前经营状态</div>
              </div>
            </div>

            <div class="cd-desc-card cd-mt">
              <h3 class="cd-desc-card-title">经营范围</h3>
              <p class="cd-desc-text">{{ company.company_business_scope }}</p>
            </div>
            </template>
            <div v-else class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 股东信息 -->
          <section id="section-shareholder" class="cd-section">
            <h2 class="cd-section-title">
              <UIcon name="i-lucide-users" class="size-5" />
              股东信息
              <span v-if="sectionLoading.shareholder" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <template v-if="shareholderData?.latest?.data?.length || shareholderData?.members?.data?.length">
              <!-- 股东结构思维导图 -->
              <div v-if="shareholderTreeOption" class="cd-sub-section">
                <h3 class="cd-sub-title">股东结构</h3>
                <ClientOnly>
                  <VChart
                    :option="shareholderTreeOption"
                    class="cd-tree-chart"
                    autoresize
                  />
                </ClientOnly>
              </div>
              <!-- 最新股份 - 饼图 + 表格 -->
              <div v-if="shareholderData?.latest?.data?.length" class="cd-sub-section">
                <h3 class="cd-sub-title">最新股份信息</h3>
                <div class="cd-shareholder-layout">
                  <div class="cd-shareholder-chart">
                    <ClientOnly>
                      <VChart
                        v-if="shareholderChartOption"
                        :option="shareholderChartOption"
                        class="cd-chart"
                        autoresize
                      />
                    </ClientOnly>
                  </div>
                  <div class="cd-shareholder-table">
                    <div class="cd-table-wrap">
                      <table class="cd-data-table">
                        <thead>
                          <tr>
                            <th v-for="(col, ci) in shareholderData.latest.column" :key="`lc-${ci}`">{{ col }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(row, ri) in shareholderLatestPage.items" :key="`lr-${ri}`">
                            <td v-for="(cell, ci) in row" :key="`lc-${ri}-${ci}`">{{ cell }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div v-if="shareholderLatestPage.totalPages > 1" class="cd-pagination">
                      <button class="cd-page-btn" :disabled="shareholderPage <= 1" @click="shareholderPage--">&lt;</button>
                      <span class="cd-page-info">{{ shareholderPage }} / {{ shareholderLatestPage.totalPages }}</span>
                      <button class="cd-page-btn" :disabled="shareholderPage >= shareholderLatestPage.totalPages" @click="shareholderPage++">&gt;</button>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 主要成员 - 卡片流 -->
              <div v-if="shareholderData?.members?.data?.length" class="cd-sub-section">
                <h3 class="cd-sub-title">主要成员</h3>
                <div class="cd-members-grid">
                  <div
                    v-for="(row, ri) in shareholderData.members.data"
                    :key="`m-${ri}`"
                    class="cd-member-card"
                  >
                    <div class="cd-member-avatar" :style="{ background: getMemberColor(ri) }">
                      {{ row[0]?.charAt(0) || '?' }}
                    </div>
                    <div class="cd-member-info">
                      <div class="cd-member-name">{{ row[0] || '-' }}</div>
                      <div class="cd-member-title">{{ row[1] || '-' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <div v-else-if="!sectionLoading.shareholder" class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 商标信息 -->
          <section id="section-trademark" class="cd-section">
            <h2 class="cd-section-title">
              <UIcon name="i-lucide-stamp" class="size-5" />
              商标信息
              <span v-if="sectionLoading.trademark" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <template v-if="trademarkData?.data?.length">
              <!-- 商标状态分布图 -->
              <div v-if="trademarkStatusOption" class="cd-sub-section">
                <h3 class="cd-sub-title">商标状态分布</h3>
                <ClientOnly>
                  <VChart
                    :option="trademarkStatusOption"
                    class="cd-chart-sm"
                    autoresize
                  />
                </ClientOnly>
              </div>
              <div class="cd-card-grid">
                <div
                  v-for="(row, ri) in trademarkPageData.items"
                  :key="`t-${ri}`"
                  class="cd-info-card"
                >
                  <div class="cd-info-card-icon cd-trademark-icon">
                    <UIcon name="i-lucide-stamp" class="size-5" />
                  </div>
                  <div class="cd-info-card-body">
                    <div class="cd-info-card-title">{{ row[0] || '-' }}</div>
                    <div class="cd-info-card-meta">
                      <span v-for="(col, ci) in trademarkData.column.slice(1)" :key="`tm-${ri}-${ci}`" class="cd-info-card-tag">
                        {{ col }}: {{ row[ci + 1] || '-' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="trademarkPageData.totalPages > 1" class="cd-pagination">
                <button class="cd-page-btn" :disabled="trademarkPage <= 1" @click="trademarkPage--">&lt;</button>
                <span class="cd-page-info">{{ trademarkPage }} / {{ trademarkPageData.totalPages }}</span>
                <button class="cd-page-btn" :disabled="trademarkPage >= trademarkPageData.totalPages" @click="trademarkPage++">&gt;</button>
              </div>
            </template>
            <div v-else-if="!sectionLoading.trademark" class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 专利信息 -->
          <section id="section-patent" class="cd-section">
            <h2 class="cd-section-title">
              <UIcon name="i-lucide-lightbulb" class="size-5" />
              专利信息
              <span v-if="sectionLoading.patent" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <template v-if="patentData?.data?.length">
              <!-- 专利类型分布图 -->
              <div v-if="patentChartOption" class="cd-sub-section">
                <h3 class="cd-sub-title">专利类型分布</h3>
                <ClientOnly>
                  <VChart
                    :option="patentChartOption"
                    class="cd-chart-sm"
                    autoresize
                  />
                </ClientOnly>
              </div>
              <div class="cd-card-grid">
                <div
                  v-for="(row, ri) in patentPageData.items"
                  :key="`p-${ri}`"
                  class="cd-info-card"
                >
                  <div class="cd-info-card-icon cd-patent-icon">
                    <UIcon name="i-lucide-lightbulb" class="size-5" />
                  </div>
                  <div class="cd-info-card-body">
                    <div class="cd-info-card-title">{{ row[0] || '-' }}</div>
                    <div class="cd-info-card-meta">
                      <span v-for="(col, ci) in patentData.column.slice(1)" :key="`pm-${ri}-${ci}`" class="cd-info-card-tag">
                        {{ col }}: {{ row[ci + 1] || '-' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="patentPageData.totalPages > 1" class="cd-pagination">
                <button class="cd-page-btn" :disabled="patentPage <= 1" @click="patentPage--">&lt;</button>
                <span class="cd-page-info">{{ patentPage }} / {{ patentPageData.totalPages }}</span>
                <button class="cd-page-btn" :disabled="patentPage >= patentPageData.totalPages" @click="patentPage++">&gt;</button>
              </div>
            </template>
            <div v-else-if="!sectionLoading.patent" class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 变更记录 -->
          <section id="section-change" class="cd-section">
            <h2 class="cd-section-title">
              <UIcon name="i-lucide-history" class="size-5" />
              变更记录
              <span v-if="sectionLoading.changeRecord" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <template v-if="changeRecordData?.data?.length">
              <!-- 变更趋势图 -->
              <div v-if="changeTrendOption" class="cd-sub-section">
                <h3 class="cd-sub-title">变更趋势</h3>
                <ClientOnly>
                  <VChart
                    :option="changeTrendOption"
                    class="cd-chart-sm"
                    autoresize
                  />
                </ClientOnly>
              </div>
              <!-- 变更类型分布 -->
              <div v-if="changeTypeOption" class="cd-sub-section">
                <h3 class="cd-sub-title">变更类型分布</h3>
                <ClientOnly>
                  <VChart
                    :option="changeTypeOption"
                    class="cd-chart-sm"
                    autoresize
                  />
                </ClientOnly>
              </div>
              <div class="cd-timeline">
                <div v-for="(row, i) in changePageData.items" :key="i" class="cd-timeline-item">
                  <div class="cd-timeline-dot" />
                  <div class="cd-timeline-content">
                    <div class="cd-timeline-date">{{ row[1] }}</div>
                    <div class="cd-timeline-title">{{ row[0] }}</div>
                    <div class="cd-timeline-row">
                      <span class="cd-timeline-label">变更前</span>
                      <span class="cd-timeline-text cd-timeline-before">{{ row[2] || '-' }}</span>
                    </div>
                    <div class="cd-timeline-row">
                      <span class="cd-timeline-label">变更后</span>
                      <span class="cd-timeline-text cd-timeline-after">{{ row[3] || '-' }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="changePageData.totalPages > 1" class="cd-pagination">
                <button class="cd-page-btn" :disabled="changePage <= 1" @click="changePage--">&lt;</button>
                <span class="cd-page-info">{{ changePage }} / {{ changePageData.totalPages }}</span>
                <button class="cd-page-btn" :disabled="changePage >= changePageData.totalPages" @click="changePage++">&gt;</button>
              </div>
            </template>
            <div v-else-if="!sectionLoading.changeRecord" class="cd-empty">
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
                <span class="cd-info-row-right cd-link-text">{{ company.company_phone || '-' }}</span>
              </div>
              <div class="cd-info-row-detail">
                <div class="cd-info-row-left">
                  <UIcon name="i-lucide-globe" class="size-4" />
                  <span>官方网站</span>
                </div>
                <span class="cd-info-row-right cd-link-text">{{ company.company_website || '-' }}</span>
              </div>
              <div class="cd-info-row-detail">
                <div class="cd-info-row-left">
                  <UIcon name="i-lucide-mail" class="size-4" />
                  <span>电子邮箱</span>
                </div>
                <span class="cd-info-row-right cd-link-text">{{ company.company_email || '-' }}</span>
              </div>
              <div class="cd-info-row-detail">
                <div class="cd-info-row-left">
                  <UIcon name="i-lucide-map-pin" class="size-4" />
                  <span>公司地址</span>
                </div>
                <span class="cd-info-row-right">{{ company.company_work_add || company.conpany_district || '-' }}</span>
              </div>
              <div class="cd-info-row-detail">
                <div class="cd-info-row-left">
                  <UIcon name="i-lucide-map" class="size-4" />
                  <span>所在地区</span>
                </div>
                <span class="cd-info-row-right">{{ company.company_city }} · {{ company.conpany_district || '' }}</span>
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
import type { CompanyRecord } from '~/types/company'
import { fetchCompanies } from '~/types/company'
import type {
  ShareholderParsed,
  ShareholderTable,
  TrademarkTable,
  ChangeRecordTable,
  PatentTable,
  RegisterItem,
} from '~/types/company-detail'
import {
  fetchShareholders,
  fetchTrademarks,
  fetchChangeRecords,
  fetchPatents,
  fetchRegisterInfo,
} from '~/types/company-detail'
import {
  getIndustryColor,
} from '~/composables/useGeoLeafletMap'
import VChart from 'vue-echarts'

definePageMeta({ middleware: 'auth', layout: 'blank' })

const route = useRoute()
const companyId = computed(() => route.query.id as string | undefined)
const company = ref<CompanyRecord | null>(null)
const loading = ref(true)

// 新增接口数据
const shareholderData = ref<ShareholderParsed | null>(null)
const trademarkData = ref<TrademarkTable | null>(null)
const changeRecordData = ref<ChangeRecordTable | null>(null)
const patentData = ref<PatentTable | null>(null)
const registerInfo = ref<RegisterItem[] | null>(null)

// 各接口独立加载状态
const sectionLoading = ref({
  shareholder: false,
  trademark: false,
  changeRecord: false,
  patent: false,
  register: false,
})

// 分页状态
const PAGE_SIZE = 10
const shareholderPage = ref(1)
const trademarkPage = ref(1)
const patentPage = ref(1)
const changePage = ref(1)

const shareholderLatestPage = computed(() => {
  const data = shareholderData.value?.latest?.data
  if (!data) return { items: [], total: 0, totalPages: 0 }
  const total = data.length
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const start = (shareholderPage.value - 1) * PAGE_SIZE
  return { items: data.slice(start, start + PAGE_SIZE), total, totalPages }
})

const trademarkPageData = computed(() => {
  const data = trademarkData.value?.data
  if (!data) return { items: [], total: 0, totalPages: 0 }
  const total = data.length
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const start = (trademarkPage.value - 1) * PAGE_SIZE
  return { items: data.slice(start, start + PAGE_SIZE), total, totalPages }
})

const patentPageData = computed(() => {
  const data = patentData.value?.data
  if (!data) return { items: [], total: 0, totalPages: 0 }
  const total = data.length
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const start = (patentPage.value - 1) * PAGE_SIZE
  return { items: data.slice(start, start + PAGE_SIZE), total, totalPages }
})

const changePageData = computed(() => {
  const data = changeRecordData.value?.data
  if (!data) return { items: [], total: 0, totalPages: 0 }
  const total = data.length
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const start = (changePage.value - 1) * PAGE_SIZE
  return { items: data.slice(start, start + PAGE_SIZE), total, totalPages }
})

async function loadCompanyDetail() {
  if (!companyId.value) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    let page = 1
    let found = false
    while (!found) {
      const res = await fetchCompanies(page, 20)
      if (res.code !== 0 || !res.data?.list?.length) break
      const item = res.data.list.find(
        c => c.company_credit_code === companyId.value
          || `${c.company_name}-${c.company_longitude}` === companyId.value,
      )
      if (item) {
        company.value = { ...item, id: item.company_credit_code || `${item.company_name}-${item.company_longitude}` }
        found = true
      } else if (res.data.list.length < 20) {
        break
      } else {
        page++
      }
    }

    // 找到企业后立即渲染页面，各接口独立并发调用，返回后直接更新
    loading.value = false

    if (company.value?.company_credit_code) {
      const code = company.value.company_credit_code
      // 各接口独立调用，返回后立即更新对应数据
      sectionLoading.value.shareholder = true
      fetchShareholders(code).then(r => { shareholderData.value = r }).catch(() => {}).finally(() => { sectionLoading.value.shareholder = false })
      sectionLoading.value.trademark = true
      fetchTrademarks(code).then(r => { trademarkData.value = r }).catch(() => {}).finally(() => { sectionLoading.value.trademark = false })
      sectionLoading.value.changeRecord = true
      fetchChangeRecords(code).then(r => { changeRecordData.value = r }).catch(() => {}).finally(() => { sectionLoading.value.changeRecord = false })
      sectionLoading.value.patent = true
      fetchPatents(code).then(r => { patentData.value = r }).catch(() => {}).finally(() => { sectionLoading.value.patent = false })
      sectionLoading.value.register = true
      fetchRegisterInfo(code).then(r => { registerInfo.value = r }).catch(() => {}).finally(() => { sectionLoading.value.register = false })
    }
  } catch (e) {
    console.error('[company-detail] 加载企业详情失败', e)
    loading.value = false
  }
}

onMounted(() => {
  loadCompanyDetail()
})

const registerDisplayMap: Record<string, { label: string; icon: string }> = {
  '企业名称': { label: '企业名称', icon: 'i-lucide-building-2' },
  '企业类型': { label: '企业类型', icon: 'i-lucide-tag' },
  '统一社会信用代码': { label: '统一社会信用代码', icon: 'i-lucide-fingerprint' },
  '法定代表人': { label: '法定代表人', icon: 'i-lucide-user' },
  '注册资本': { label: '注册资本', icon: 'i-lucide-landmark' },
  '成立日期': { label: '成立日期', icon: 'i-lucide-calendar' },
  '经营状态': { label: '经营状态', icon: 'i-lucide-activity' },
  '注册地址': { label: '注册地址', icon: 'i-lucide-map-pin' },
  '经营范围': { label: '经营范围', icon: 'i-lucide-file-text' },
  '登记机关': { label: '登记机关', icon: 'i-lucide-shield' },
  '核准日期': { label: '核准日期', icon: 'i-lucide-check-circle' },
  '实缴资本': { label: '实缴资本', icon: 'i-lucide-coins' },
  '参保人数': { label: '参保人数', icon: 'i-lucide-users' },
  '所属行业': { label: '所属行业', icon: 'i-lucide-briefcase' },
  '营业期限': { label: '营业期限', icon: 'i-lucide-clock' },
  '电话': { label: '电话', icon: 'i-lucide-phone' },
  '官网': { label: '官网', icon: 'i-lucide-globe' },
  '邮箱': { label: '邮箱', icon: 'i-lucide-mail' },
  '地址': { label: '地址', icon: 'i-lucide-map' },
}

// 成员头像颜色
const memberColors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']
function getMemberColor(index: number): string {
  return memberColors[index % memberColors.length]
}

// 股东饼图数据
const shareholderChartOption = computed(() => {
  const latest = shareholderData.value?.latest
  if (!latest?.data?.length) return null
  const columns = latest.column
  // 查找"直接持股比例"或"持股比例"列索引
  const ratioIdx = columns.findIndex((c: string) => c.includes('持股比例') || c.includes('持股'))
  if (ratioIdx === -1) return null
  const nameIdx = 0 // 股东名称通常是第一列

  const pieData = latest.data.map((row: string[]) => {
    const name = row[nameIdx]?.length > 12 ? row[nameIdx].slice(0, 12) + '...' : row[nameIdx]
    const ratio = parseFloat(row[ratioIdx]) || 0
    return { name, value: ratio }
  }).filter((d: { value: number }) => d.value > 0)

  if (pieData.length === 0) return null

  return {
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c}%' },
    legend: { show: false },
    series: [{
      type: 'pie' as const,
      radius: ['55%', '82%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, position: 'outside' as const, formatter: '{b}\n{d}%', fontSize: 11 },
      emphasis: { label: { fontSize: 14, fontWeight: 'bold' } },
      data: pieData,
    }],
  }
})

// 股东结构思维导图（树图）
const shareholderTreeOption = computed(() => {
  const latest = shareholderData.value?.latest
  const members = shareholderData.value?.members
  if (!latest?.data?.length && !members?.data?.length) return null

  const companyName = company.value?.company_name || '企业'
  const children: any[] = []

  // 股东子节点
  if (latest?.data?.length) {
    const columns = latest.column
    const ratioIdx = columns.findIndex((c: string) => c.includes('持股比例') || c.includes('持股'))
    const shareholderChildren = latest.data.map((row: string[]) => {
      const name = row[0]?.length > 10 ? row[0].slice(0, 10) + '…' : row[0]
      const ratio = ratioIdx >= 0 ? parseFloat(row[ratioIdx]) || 0 : 0
      return { name: `${name}${ratio > 0 ? ` ${ratio}%` : ''}`, value: ratio }
    })
    children.push({ name: '股东', children: shareholderChildren })
  }

  // 主要成员子节点
  if (members?.data?.length) {
    const memberChildren = members.data.map((row: string[]) => {
      return { name: `${row[0] || '-'} (${row[1] || '-'})`, value: 1 }
    })
    children.push({ name: '主要成员', children: memberChildren })
  }

  if (children.length === 0) return null

  return {
    tooltip: { trigger: 'item' as const, triggerOn: 'mousemove', formatter: (params: any) => {
      const name = params.data?.name || ''
      const value = params.data?.value
      return value > 1 ? `${name}<br/>持股比例: ${value}%` : name
    } },
    series: [{
      type: 'tree' as const,
      data: [{ name: companyName, children, symbolSize: 16, itemStyle: { color: '#4f46e5', borderColor: '#4f46e5', borderWidth: 2, shadowBlur: 6, shadowColor: 'rgba(79,70,229,0.3)' }, label: { fontSize: 13, fontWeight: 'bold', color: '#1e1b4b' } }],
      top: '5%', left: '14%', bottom: '5%', right: '14%',
      symbolSize: 9,
      orient: 'LR' as const,
      label: {
        position: 'left' as const,
        verticalAlign: 'middle',
        align: 'right',
        fontSize: 11,
        color: '#334155',
        backgroundColor: 'rgba(255,255,255,0.85)',
        padding: [2, 6],
        borderRadius: 3,
      },
      leaves: {
        label: {
          position: 'right' as const,
          verticalAlign: 'middle',
          align: 'left',
          fontSize: 11,
          backgroundColor: 'transparent',
          padding: 0,
        },
      },
      emphasis: { focus: 'descendant' as const, itemStyle: { color: '#4338ca', borderColor: '#4338ca' } },
      expandAndCollapse: true,
      initialTreeDepth: 2,
      animationDuration: 550,
      animationDurationUpdate: 750,
      lineStyle: { color: '#a5b4fc', width: 1.5, curveness: 0.5 },
      itemStyle: { color: '#6366f1', borderColor: '#6366f1', borderWidth: 1.5 },
    }],
  }
})

// 专利类型分布图
const patentChartOption = computed(() => {
  const data = patentData.value?.data
  if (!data?.length) return null
  const columns = patentData.value?.column || []

  // 统计专利类型分布
  const typeIdx = columns.findIndex((c: string) => c.includes('类型') || c.includes('分类'))
  if (typeIdx === -1) return null

  const typeMap = new Map<string, number>()
  data.forEach((row: string[]) => {
    const type = row[typeIdx] || '未知'
    typeMap.set(type, (typeMap.get(type) || 0) + 1)
  })

  const chartData = Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }))

  return {
    tooltip: { trigger: 'item' as const },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie' as const,
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c}项', fontSize: 11 },
      emphasis: { label: { fontSize: 14, fontWeight: 'bold' } },
      data: chartData,
    }],
  }
})

// 商标状态分布图
const trademarkStatusOption = computed(() => {
  const data = trademarkData.value?.data
  if (!data?.length) return null
  const columns = trademarkData.value?.column || []

  const statusIdx = columns.findIndex((c: string) => c.includes('状态'))
  if (statusIdx === -1) return null

  const statusMap = new Map<string, number>()
  data.forEach((row: string[]) => {
    const status = row[statusIdx] || '未知'
    statusMap.set(status, (statusMap.get(status) || 0) + 1)
  })

  const chartData = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }))
  if (chartData.length <= 1) return null

  return {
    tooltip: { trigger: 'item' as const },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie' as const,
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c}项', fontSize: 11 },
      emphasis: { label: { fontSize: 14, fontWeight: 'bold' } },
      data: chartData,
    }],
  }
})

// 变更趋势图（按年份统计变更次数）
const changeTrendOption = computed(() => {
  const data = changeRecordData.value?.data
  if (!data?.length) return null

  const yearMap = new Map<string, number>()
  data.forEach((row: string[]) => {
    const dateStr = row[1] || ''
    const year = dateStr.slice(0, 4)
    if (year && /^\d{4}$/.test(year)) {
      yearMap.set(year, (yearMap.get(year) || 0) + 1)
    }
  })

  const sorted = Array.from(yearMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  if (sorted.length <= 1) return null

  return {
    tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
    grid: { left: 40, right: 20, top: 10, bottom: 30 },
    xAxis: {
      type: 'category' as const,
      data: sorted.map(([y]) => y),
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'value' as const,
      minInterval: 1,
      axisLabel: { fontSize: 11 },
    },
    series: [{
      type: 'bar' as const,
      data: sorted.map(([, v]) => v),
      barWidth: '40%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: {
          type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#818cf8' },
            { offset: 1, color: '#6366f1' },
          ],
        },
      },
      emphasis: { itemStyle: { color: '#4f46e5' } },
    }],
  }
})

// 变更类型分布图
const changeTypeOption = computed(() => {
  const data = changeRecordData.value?.data
  if (!data?.length) return null

  const typeMap = new Map<string, number>()
  data.forEach((row: string[]) => {
    const type = row[0] || '未知'
    // 简化类型名称
    const shortType = type.length > 10 ? type.slice(0, 10) + '…' : type
    typeMap.set(shortType, (typeMap.get(shortType) || 0) + 1)
  })

  const chartData = Array.from(typeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  if (chartData.length <= 1) return null

  return {
    tooltip: { trigger: 'item' as const },
    legend: { bottom: 0, textStyle: { fontSize: 11 }, type: 'scroll' as const },
    series: [{
      type: 'pie' as const,
      radius: ['35%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{c}次', fontSize: 11 },
      emphasis: { label: { fontSize: 13, fontWeight: 'bold' } },
      data: chartData,
    }],
  }
})

const activeMenu = ref('overview')
const expandedGroups = ref(new Set(['company-info', 'business-info', 'contact-info', 'detail-info']))
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
    key: 'detail-info',
    label: '详细资料',
    icon: 'i-lucide-folder-open',
    children: [
      { key: 'shareholder', label: '股东信息', icon: 'i-lucide-users' },
      { key: 'trademark', label: '商标信息', icon: 'i-lucide-stamp' },
      { key: 'patent', label: '专利信息', icon: 'i-lucide-lightbulb' },
      { key: 'change', label: '变更记录', icon: 'i-lucide-history' },
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
      return !!(c.company_registered_capital || c.company_found_date || c.company_business_status || c.company_industry || c.company_business_scope)
    case 'basic':
      return !!(c.company_name || c.company_type || c.company_industry || c.company_legal_person || c.company_credit_code)
    case 'business':
      return !!(c.company_registered_capital || c.company_business_status || c.company_business_scope)
    case 'contact':
      return !!(c.company_phone || c.company_website || c.company_email || c.company_work_add)
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
</script>

<style scoped>
.cd-page {
  margin: -24px;
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
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
  width: 100%;
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

.cd-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 120px 24px;
  color: var(--text-muted);
  font-size: 14px;
}
.cd-loading-ring {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid rgba(99, 102, 241, 0.15);
  border-top-color: var(--primary);
  animation: cd-spin 0.9s linear infinite;
}
@keyframes cd-spin { to { transform: rotate(360deg); } }

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
  width: 100%;
  max-width: 1200px;
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
  display: flex;
  align-items: center;
  gap: 10px;
}
.cd-hero-listed-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 5px;
  background: rgba(236, 72, 153, 0.15);
  color: #f472b6;
  vertical-align: middle;
}
.cd-hero-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.cd-hero-type-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 5px;
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
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
  width: 100%;
  max-width: 1200px;
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
  z-index: 100;
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
.cd-ov-icon-capital {
  background: color-mix(in srgb, var(--primary) 12%, transparent);
  color: var(--primary);
}
.cd-ov-icon-founded {
  background: color-mix(in srgb, var(--warning) 12%, transparent);
  color: var(--warning);
}
.cd-ov-icon-status {
  background: color-mix(in srgb, var(--success) 12%, transparent);
  color: var(--success);
}
.cd-ov-icon-industry {
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
.cd-ov-card--tip .cd-ov-card-body {
  display: flex;
  align-items: center;
}
.cd-ov-tip-trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: default;
}
.cd-ov-card-lbl--inline {
  margin-top: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
}
.cd-ov-tip-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}
.cd-ov-tip-bubble {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  transform: translateX(-50%) translateY(4px);
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s;
  z-index: 10;
}
.cd-ov-tip-bubble::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--border);
}
.cd-ov-tip-trigger:hover .cd-ov-tip-bubble,
.cd-ov-tip-trigger:focus-within .cd-ov-tip-bubble {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
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
.cd-mono-text {
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
  font-size: 12px;
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

/* 子模块标题 */
.cd-sub-section {
  margin-bottom: 20px;
}
.cd-sub-section:last-child {
  margin-bottom: 0;
}
.cd-sub-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-strong);
  margin: 0 0 12px;
  padding-left: 10px;
  border-left: 3px solid var(--primary);
}

/* 数据表格 */
.cd-table-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow-x: auto;
}
.cd-data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.cd-data-table thead th {
  text-align: left;
  padding: 12px 16px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface-alt);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.cd-data-table tbody td {
  padding: 12px 16px;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.cd-data-table tbody tr:last-child td {
  border-bottom: none;
}
.cd-data-table tbody tr:hover td {
  background: color-mix(in srgb, var(--primary) 3%, transparent);
}

/* 标签网格 */
.cd-tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.cd-tag-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
}
.cd-tag-name {
  font-weight: 600;
  color: var(--text-strong);
}
.cd-tag-role {
  color: var(--text-muted);
  font-size: 12px;
}

/* 时间线 */
.cd-timeline {
  position: relative;
  padding-left: 20px;
}
.cd-timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: var(--border);
  border-radius: 1px;
}
.cd-timeline-item {
  position: relative;
  padding-bottom: 20px;
}
.cd-timeline-item:last-child {
  padding-bottom: 0;
}
.cd-timeline-dot {
  position: absolute;
  left: -20px;
  top: 6px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid var(--surface);
  box-shadow: 0 0 0 2px var(--primary);
}
.cd-timeline-content {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 18px;
}
.cd-timeline-date {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 4px;
}
.cd-timeline-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-strong);
  margin-bottom: 10px;
}
.cd-timeline-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 6px;
}
.cd-timeline-row:last-child {
  margin-bottom: 0;
}
.cd-timeline-label {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface-alt);
  padding: 2px 8px;
  border-radius: 4px;
}
.cd-timeline-text {
  font-size: 13px;
  color: var(--text);
  word-break: break-all;
}
.cd-timeline-before {
  color: var(--text-muted);
  text-decoration: line-through;
  opacity: 0.7;
}
.cd-timeline-after {
  color: var(--success);
  font-weight: 500;
}

/* ── 股东饼图 + 表格左右布局 ─────────────────── */
.cd-shareholder-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.cd-shareholder-chart {
  width: 320px;
  flex-shrink: 0;
}
.cd-shareholder-table {
  flex: 1;
  min-width: 0;
}
.cd-chart {
  width: 100%;
  height: 280px;
}
.cd-chart-sm {
  width: 100%;
  height: 220px;
}
.cd-tree-chart {
  width: 100%;
  height: 320px;
}

/* ── 主要成员卡片网格 ────────────────────────── */
.cd-members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}
.cd-member-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.cd-member-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border-color: var(--border);
}
.cd-member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}
.cd-member-info {
  min-width: 0;
}
.cd-member-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cd-member-title {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* ── 工商信息卡片网格 ────────────────────────── */
.cd-register-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 6px;
}
.cd-register-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: 6px;
  gap: 10px;
  transition: border-color 0.15s;
}
.cd-register-item:hover {
  border-color: var(--border);
}
.cd-register-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 90px;
}
.cd-register-value {
  font-size: 13px;
  color: var(--text);
  word-break: break-all;
  flex: 1;
  text-align: right;
}

/* ── 商标/专利卡片网格 ───────────────────────── */
.cd-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}
.cd-info-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.cd-info-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border-color: var(--border);
}
.cd-info-card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cd-trademark-icon {
  background: #fef3c7;
  color: #d97706;
}
.cd-patent-icon {
  background: #dcfce7;
  color: #16a34a;
}
.cd-info-card-body {
  flex: 1;
  min-width: 0;
}
.cd-info-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cd-info-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.cd-info-card-tag {
  font-size: 11px;
  color: var(--text-muted);
  background: var(--surface-alt);
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

/* ── Responsive ──────────────────────────────── */
@media (max-width: 768px) {
  .cd-shareholder-layout {
    flex-direction: column;
  }
  .cd-shareholder-chart {
    width: 100%;
  }
  .cd-members-grid {
    grid-template-columns: 1fr;
  }
  .cd-card-grid {
    grid-template-columns: 1fr;
  }
  .cd-register-grid {
    grid-template-columns: 1fr;
  }
}

.cd-section-loading {
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
}
.cd-mini-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(99, 102, 241, 0.2);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: cd-spin 0.7s linear infinite;
}

.cd-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 0 4px;
}
.cd-page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  color: var(--text);
  transition: all 0.15s;
}
.cd-page-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}
.cd-page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.cd-page-info {
  font-size: 12px;
  color: var(--text-muted);
  min-width: 60px;
  text-align: center;
}
</style>
