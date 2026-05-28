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
        <div class="cd-hero-logo" :style="{ background: getIndustryBg(company.product_type) }">
          <span class="cd-hero-logo-text">{{ company.company_name.slice(0, 2) }}</span>
        </div>
        <div class="cd-hero-info">
          <h1 class="cd-hero-name">
            {{ company.company_name }}
          </h1>
          <div class="cd-hero-meta">
            <span v-if="company.company_traded === 1" class="cd-hero-listed-badge">上市公司</span>
            <span v-if="company.import_project === 1" class="cd-hero-project-badge">重大项目</span>
            <span class="cd-hero-type-badge">{{ company.chain_name }}</span>
            <span class="cd-hero-industry">
              <UIcon name="i-lucide-briefcase" class="size-3.5" />
              {{ company.product_type }}
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
            v-for="group in visibleMenuGroups"
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
          <!-- 经营状况（合并企业概览） -->
          <section id="section-business" class="cd-section" v-if="isSectionVisible('business')">
            <h2 class="cd-section-title cd-title-business">
              <span class="cd-title-icon"><UIcon name="i-lucide-bar-chart-3" class="size-5" /></span>
              经营状况
            </h2>
            <template v-if="hasSectionData('business')">
            <div class="cd-business-cards">
              <div class="cd-biz-card">
                <div class="cd-biz-card-header">
                  <UIcon name="i-lucide-landmark" class="size-5 cd-biz-icon-capital" />
                  <span>注册资本</span>
                </div>
                <div class="cd-biz-card-value">{{ company.company_registered_capital }}</div>
                <div class="cd-biz-card-desc">企业注册资金</div>
              </div>
              <div class="cd-biz-card">
                <div class="cd-biz-card-header">
                  <UIcon name="i-lucide-calendar-check" class="size-5 cd-biz-icon-date" />
                  <span>成立日期</span>
                </div>
                <div class="cd-biz-card-value">{{ company.company_found_date }}</div>
                <div class="cd-biz-card-desc">企业成立时间</div>
              </div>
              <div class="cd-biz-card">
                <div class="cd-biz-card-header">
                  <UIcon name="i-lucide-activity" class="size-5 cd-biz-icon-status" />
                  <span>经营状态</span>
                </div>
                <div class="cd-biz-card-value">{{ company.company_business_status }}</div>
                <div class="cd-biz-card-desc">当前经营状态</div>
              </div>
              <div class="cd-biz-card">
                <div class="cd-biz-card-header">
                  <UIcon name="i-lucide-briefcase" class="size-5 cd-biz-icon-industry" />
                  <span>产品类型</span>
                </div>
                <div class="cd-biz-card-value">{{ company.product_type }}</div>
                <div class="cd-biz-card-desc">主要产品分类</div>
              </div>
            </div>

            <div class="cd-desc-card">
              <h3 class="cd-desc-card-title">经营范围</h3>
              <p ref="bizScopeRef" class="cd-desc-text" :class="{ 'cd-desc-text-collapsed': !bizScopeExpanded }">{{ company.company_business_scope }}</p>
              <button v-if="bizScopeNeedExpand" class="cd-scope-expand-btn" @click="bizScopeExpanded = !bizScopeExpanded">
                {{ bizScopeExpanded ? '收起' : '展开全部' }}
              </button>
            </div>

            <div v-if="company.product && company.product !== '-'" class="cd-desc-card">
              <h3 class="cd-desc-card-title">经营产品</h3>
              <div class="cd-product-list">
                <span v-for="(p, pi) in company.product.split(/[、,，;；]/).filter(s => s.trim())" :key="pi" class="cd-product-tag">{{ p.trim() }}</span>
              </div>
            </div>
            </template>
            <div v-else class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 基本信息（含工商信息） -->
          <section id="section-basic" class="cd-section" v-if="isSectionVisible('basic')">
            <h2 class="cd-section-title cd-title-basic">
              <span class="cd-title-icon"><UIcon name="i-lucide-file-text" class="size-5" /></span>
              基本信息
              <span v-if="sectionLoading.register" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <div class="cd-register-grid">
              <template v-if="basicInfo?.length">
                <div v-for="(item, idx) in basicInfo.filter(i => !registerDisplayMap[i.key]?.hidden)" :key="idx" class="cd-register-item">
                  <div class="cd-register-label">
                    <UIcon :name="registerDisplayMap[item.key]?.icon || 'i-lucide-file-text'" class="size-3.5" />
                    <span>{{ item.key }}</span>
                  </div>
                  <div class="cd-register-value">{{ item.value || '-' }}</div>
                </div>
              </template>
              <template v-else-if="registerInfo?.length">
                <div v-for="(item, idx) in registerInfo.filter(i => !registerDisplayMap[i.key]?.hidden)" :key="idx" class="cd-register-item">
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
                    <span>产品链名称</span>
                  </div>
                  <span class="cd-info-row-right">{{ company.chain_name }}</span>
                </div>
                <div class="cd-info-row-detail">
                  <div class="cd-info-row-left">
                    <UIcon name="i-lucide-briefcase" class="size-4" />
                    <span>产品类型</span>
                  </div>
                  <span class="cd-info-row-right">{{ company.product_type }}</span>
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

          <!-- 股东信息 -->
          <section id="section-shareholder" class="cd-section" v-if="isSectionVisible('shareholder')">
            <h2 class="cd-section-title cd-title-shareholder">
              <span class="cd-title-icon"><UIcon name="i-lucide-users" class="size-5" /></span>
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
              <!-- 最新股份 - 饼图单独一行 -->
              <div v-if="shareholderChartOption" class="cd-sub-section">
                <h3 class="cd-sub-title">最新股份信息</h3>
                <ClientOnly>
                  <VChart
                    :option="shareholderChartOption"
                    class="cd-chart"
                    autoresize
                  />
                </ClientOnly>
              </div>
              <!-- 最新股份 - 表格单独一行 -->
              <div v-if="shareholderData?.latest?.data?.length" class="cd-sub-section">
                <div class="cd-table-wrap cd-table-elegant">
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
              <!-- 主要成员 - 关系图 -->
              <div v-if="shareholderData?.members?.data?.length" class="cd-sub-section">
                <h3 class="cd-sub-title">主要成员</h3>
                <ClientOnly>
                  <VChart
                    v-if="memberGraphOption"
                    :option="memberGraphOption"
                    class="cd-member-graph"
                    autoresize
                  />
                </ClientOnly>
              </div>
            </template>
            <div v-else-if="!sectionLoading.shareholder" class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 商标信息 -->
          <section id="section-trademark" class="cd-section" v-if="isSectionVisible('trademark')">
            <h2 class="cd-section-title cd-title-trademark">
              <span class="cd-title-icon"><UIcon name="i-lucide-stamp" class="size-5" /></span>
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
          <section id="section-patent" class="cd-section" v-if="isSectionVisible('patent')">
            <h2 class="cd-section-title cd-title-patent">
              <span class="cd-title-icon"><UIcon name="i-lucide-lightbulb" class="size-5" /></span>
              专利信息
              <span v-if="sectionLoading.patent" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <template v-if="patentData?.data?.length">
              <div class="cd-card-grid cd-card-grid-patent">
                <div
                  v-for="(row, ri) in patentPageData.items"
                  :key="`p-${ri}`"
                  class="cd-info-card cd-info-card-patent"
                >
                  <div class="cd-info-card-icon cd-patent-icon">
                    <UIcon name="i-lucide-lightbulb" class="size-5" />
                  </div>
                  <div class="cd-info-card-body">
                    <div class="cd-info-card-title cd-patent-title">{{ row[0] || '-' }}</div>
                    <div class="cd-info-card-meta cd-patent-meta">
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
          <section id="section-change" class="cd-section" v-if="isSectionVisible('change')">
            <h2 class="cd-section-title cd-title-change">
              <span class="cd-title-icon"><UIcon name="i-lucide-history" class="size-5" /></span>
              变更记录
              <span v-if="sectionLoading.changeRecord" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <template v-if="changeRecordData?.data?.length">
              <!-- 变更次数图 -->
              <div v-if="changeTrendOption" class="cd-sub-section">
                <h3 class="cd-sub-title">变更次数</h3>
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
                <div v-for="(row, i) in changeRecordDisplayData" :key="i" class="cd-timeline-item">
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
              <button v-if="changeRecordData.data.length > 10 && !changeRecordExpanded" class="cd-scope-expand-btn" @click="changeRecordExpanded = true">
                展开全部
              </button>
            </template>
            <div v-else-if="!sectionLoading.changeRecord" class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 荣誉资质 -->
          <section id="section-honor" class="cd-section" v-if="isSectionVisible('honor')">
            <h2 class="cd-section-title cd-title-honor">
              <span class="cd-title-icon"><UIcon name="i-lucide-award" class="size-5" /></span>
              荣誉资质
              <span v-if="sectionLoading.honor" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <template v-if="honorsData?.honor?.data?.length">
              <div class="cd-honor-grid">
                <div v-for="(row, ri) in honorPageData.items" :key="`h-${ri}`" class="cd-honor-card">
                  <div class="cd-honor-badge" :class="getHonorLevelStyle(row[2])">
                    <UIcon name="i-lucide-award" class="size-3" />
                    <span>{{ row[2] || '-' }}</span>
                  </div>
                  <div class="cd-honor-body">
                    <div class="cd-honor-name">{{ row[0] || '-' }}</div>
                    <div class="cd-honor-details">
                      <span v-if="row[1] && row[1] !== '-'" class="cd-honor-detail-item">
                        许可证号: {{ row[1] }}
                      </span>
                      <span v-if="row[3] && row[3] !== '-'" class="cd-honor-detail-item">
                        公布状态: {{ row[3] }}
                      </span>
                      <span v-if="row[4] && row[4] !== '-'" class="cd-honor-detail-item">
                        发布日期: {{ row[4] }}
                      </span>
                      <span v-if="row[5] && row[5] !== '-'" class="cd-honor-detail-item">
                        有效期至: {{ row[5] }}
                      </span>
                    </div>
                    <div class="cd-honor-footer">
                      <span v-if="row[6] && row[6] !== '-'" class="cd-honor-status" :class="row[6] === '有效' ? 'cd-status-active' : 'cd-status-inactive'">{{ row[6] }}</span>
                      <span v-if="row[7] && row[7] !== '-'" class="cd-honor-org">发布单位: {{ row[7] }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="honorPageData.totalPages > 1" class="cd-pagination">
                <button class="cd-page-btn" :disabled="honorPage <= 1" @click="honorPage--">&lt;</button>
                <span class="cd-page-info">{{ honorPage }} / {{ honorPageData.totalPages }}</span>
                <button class="cd-page-btn" :disabled="honorPage >= honorPageData.totalPages" @click="honorPage++">&gt;</button>
              </div>
            </template>
            <div v-else-if="!sectionLoading.honor" class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 上榜榜单 -->
          <section id="section-ranking" class="cd-section" v-if="isSectionVisible('ranking')">
            <h2 class="cd-section-title cd-title-ranking">
              <span class="cd-title-icon"><UIcon name="i-lucide-trophy" class="size-5" /></span>
              上榜榜单
              <span v-if="sectionLoading.ranking" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <template v-if="honorsData?.ranking?.data?.length">
              <div class="cd-ranking-timeline">
                <div v-for="group in rankingYearGroups" :key="group.year" class="cd-ranking-year-group">
                  <div class="cd-ranking-year-label">{{ group.year }}年</div>
                  <div class="cd-ranking-items">
                    <div v-for="(row, ri) in group.items" :key="`r-${group.year}-${ri}`" class="cd-ranking-card">
                      <div class="cd-ranking-rank">
                        <span class="cd-ranking-rank-num">{{ formatRanking(row[1]) }}</span>
                      </div>
                      <div class="cd-ranking-body">
                        <div class="cd-ranking-name"><span class="cd-ranking-label">榜单名称</span>{{ row[0] || '-' }}</div>
                        <div class="cd-ranking-meta">
                          <span class="cd-ranking-publisher">
                            <UIcon name="i-lucide-building" class="size-3" />
                            发布方: {{ row[3] || '-' }}
                          </span>
                          <span class="cd-ranking-date">
                            <UIcon name="i-lucide-calendar" class="size-3" />
                            发布日期: {{ row[2] || '-' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <div v-else-if="!sectionLoading.ranking" class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 政府奖励项目 -->
          <section id="section-govAward" class="cd-section" v-if="isSectionVisible('govAward')">
            <h2 class="cd-section-title cd-title-govAward">
              <span class="cd-title-icon"><UIcon name="i-lucide-gift" class="size-5" /></span>
              政府奖励项目
              <span v-if="sectionLoading.govAward" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <template v-if="honorsData?.govAward?.data?.length">
              <div class="cd-gov-grid">
                <div v-for="(row, ri) in govAwardPageData.items" :key="`g-${ri}`" class="cd-gov-card">
                  <div class="cd-gov-ribbon" :class="getHonorLevelStyle(row[2])">
                    <UIcon name="i-lucide-ribbon" class="size-3.5" />
                    {{ row[2] || '-' }}
                  </div>
                  <div class="cd-gov-body">
                    <div class="cd-gov-name">{{ row[0] || '-' }}</div>
                    <div class="cd-gov-project">{{ row[1] || '-' }}</div>
                    <div class="cd-gov-meta">
                      <span class="cd-gov-year">
                        <UIcon name="i-lucide-calendar" class="size-3" />
                        奖励年份: {{ row[3] || '-' }}年
                      </span>
                      <span v-if="row[5] && row[5] !== '-'" class="cd-gov-person">
                        <UIcon name="i-lucide-user" class="size-3" />
                        相关人员: {{ row[5] }}
                      </span>
                    </div>
                    <div class="cd-gov-date">发布时间: {{ row[4] || '-' }}</div>
                  </div>
                </div>
              </div>
              <div v-if="govAwardPageData.totalPages > 1" class="cd-pagination">
                <button class="cd-page-btn" :disabled="govAwardPage <= 1" @click="govAwardPage--">&lt;</button>
                <span class="cd-page-info">{{ govAwardPage }} / {{ govAwardPageData.totalPages }}</span>
                <button class="cd-page-btn" :disabled="govAwardPage >= govAwardPageData.totalPages" @click="govAwardPage++">&gt;</button>
              </div>
            </template>
            <div v-else-if="!sectionLoading.govAward" class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 集成电路布图 -->
          <section id="section-layout" class="cd-section" v-if="isSectionVisible('layout')">
            <h2 class="cd-section-title cd-title-layout">
              <span class="cd-title-icon"><UIcon name="i-lucide-circuit-board" class="size-5" /></span>
              集成电路布图
              <span v-if="sectionLoading.layout" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <template v-if="layoutData?.data?.length">
              <div class="cd-layout-grid">
                <div v-for="(row, ri) in layoutPageData.items" :key="`l-${ri}`" class="cd-layout-card">
                  <div class="cd-layout-header">
                    <div class="cd-layout-chip-icon">
                      <UIcon name="i-lucide-cpu" class="size-5" />
                    </div>
                    <div class="cd-layout-name" :title="row[0] || '-'">{{ row[0] || '-' }}</div>
                    <div class="cd-layout-reg" :title="row[4] || '-'">{{ row[4] || '-' }}</div>
                  </div>
                  <div class="cd-layout-tags" v-if="row[1] !== '-' || row[2] !== '-' || row[3] !== '-'">
                    <span v-if="row[1] && row[1] !== '-'" class="cd-layout-tag cd-layout-tag-struct">{{ row[1] }}</span>
                    <span v-if="row[2] && row[2] !== '-'" class="cd-layout-tag cd-layout-tag-tech">{{ row[2] }}</span>
                    <span v-if="row[3] && row[3] !== '-'" class="cd-layout-tag cd-layout-tag-func">{{ row[3] }}</span>
                  </div>
                  <div class="cd-layout-info">
                    <div v-if="row[8] && row[8] !== '-'" class="cd-layout-info-row">
                      <span class="cd-layout-info-label">创作人</span>
                      <span class="cd-layout-info-value">{{ row[8] }}</span>
                    </div>
                    <div v-if="row[9] && row[9] !== '-'" class="cd-layout-info-row">
                      <span class="cd-layout-info-label">权利人</span>
                      <span class="cd-layout-info-value">{{ row[9] }}</span>
                    </div>
                    <div v-if="row[5] && row[5] !== '-'" class="cd-layout-info-row">
                      <span class="cd-layout-info-label">申请日期</span>
                      <span class="cd-layout-info-value">{{ row[5] }}</span>
                    </div>
                    <div v-if="row[6] && row[6] !== '-'" class="cd-layout-info-row">
                      <span class="cd-layout-info-label">公告日期</span>
                      <span class="cd-layout-info-value">{{ row[6] }}</span>
                    </div>
                    <div v-if="row[7] && row[7] !== '-'" class="cd-layout-info-row">
                      <span class="cd-layout-info-label">公告号</span>
                      <span class="cd-layout-info-value">{{ row[7] }}</span>
                    </div>
                    <div v-if="row[10] && row[10] !== '-'" class="cd-layout-info-row">
                      <span class="cd-layout-info-label">代理机构</span>
                      <span class="cd-layout-info-value">{{ row[10] }}</span>
                    </div>
                    <div v-if="row[11] && row[11] !== '-'" class="cd-layout-info-row">
                      <span class="cd-layout-info-label">代理人</span>
                      <span class="cd-layout-info-value">{{ row[11] }}</span>
                    </div>
                    <div v-if="row[12] && row[12] !== '-'" class="cd-layout-info-row">
                      <span class="cd-layout-info-label">创作完成日期</span>
                      <span class="cd-layout-info-value">{{ row[12] }}</span>
                    </div>
                    <div v-if="row[13] && row[13] !== '-'" class="cd-layout-info-row">
                      <span class="cd-layout-info-label">首次商业利用日</span>
                      <span class="cd-layout-info-value">{{ row[13] }}</span>
                    </div>
                    <div v-if="row[14] && row[14] !== '-'" class="cd-layout-info-row">
                      <span class="cd-layout-info-label">保护期届满日</span>
                      <span class="cd-layout-info-value">{{ row[14] }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="layoutPageData.totalPages > 1" class="cd-pagination">
                <button class="cd-page-btn" :disabled="layoutPage <= 1" @click="layoutPage--">&lt;</button>
                <span class="cd-page-info">{{ layoutPage }} / {{ layoutPageData.totalPages }}</span>
                <button class="cd-page-btn" :disabled="layoutPage >= layoutPageData.totalPages" @click="layoutPage++">&gt;</button>
              </div>
            </template>
            <div v-else-if="!sectionLoading.layout" class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 联系方式 -->
          <section id="section-contact" class="cd-section" v-if="isSectionVisible('contact')">
            <h2 class="cd-section-title cd-title-contact">
              <span class="cd-title-icon"><UIcon name="i-lucide-phone-call" class="size-5" /></span>
              联系方式
            </h2>
            <template v-if="hasSectionData('contact')">
            <div class="cd-info-table">
              <div class="cd-info-row-detail">
                <div class="cd-info-row-left">
                  <UIcon name="i-lucide-phone" class="size-4" />
                  <span>联系方式</span>
                </div>
                <span class="cd-info-row-right cd-link-text">{{ company.contact_info || '-' }}</span>
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
  HonorsParsed,
  LayoutTable,
} from '~/types/company-detail'
import {
  fetchShareholders,
  fetchTrademarks,
  fetchChangeRecords,
  fetchPatents,
  fetchRegisterInfo,
  fetchBasicInfo,
  fetchHonors,
  fetchLayout,
  type BasicInfoItem,
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
const trademarkPage = ref(1)
const patentPage = ref(1)
const shareholderPage = ref(1)
const TRADEMARK_PAGE_SIZE = 9
const PATENT_PAGE_SIZE = 9
const SHAREHOLDER_PAGE_SIZE = 10
const bizScopeExpanded = ref(false)
const bizScopeRef = ref<HTMLElement | null>(null)
const bizScopeNeedExpand = ref(false)
const changeRecordExpanded = ref(false)

function checkBizScopeOverflow() {
  nextTick(() => {
    const el = bizScopeRef.value
    if (!el) { bizScopeNeedExpand.value = false; return }
    // 临时移除折叠以测量完整高度
    const hadCollapsed = el.classList.contains('cd-desc-text-collapsed')
    if (hadCollapsed) el.classList.remove('cd-desc-text-collapsed')
    const fullHeight = el.scrollHeight
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 22
    const maxLines = 4
    if (hadCollapsed) el.classList.add('cd-desc-text-collapsed')
    bizScopeNeedExpand.value = fullHeight > lineHeight * maxLines + 2
  })
}

// 新增接口数据
const shareholderData = ref<ShareholderParsed | null>(null)
const trademarkData = ref<TrademarkTable | null>(null)
const changeRecordData = ref<ChangeRecordTable | null>(null)
const patentData = ref<PatentTable | null>(null)
const registerInfo = ref<RegisterItem[] | null>(null)
const basicInfo = ref<BasicInfoItem[] | null>(null)
const honorsData = ref<HonorsParsed | null>(null)
const layoutData = ref<LayoutTable | null>(null)
const honorPage = ref(1)
const rankingPage = ref(1)
const govAwardPage = ref(1)
const layoutPage = ref(1)
const HONOR_PAGE_SIZE = 6
const RANKING_PAGE_SIZE = 8
const GOV_AWARD_PAGE_SIZE = 6
const LAYOUT_PAGE_SIZE = 6

// 各接口独立加载状态
const sectionLoading = ref({
  shareholder: false,
  trademark: false,
  changeRecord: false,
  patent: false,
  register: false,
  basic: false,
  honor: false,
  ranking: false,
  govAward: false,
  layout: false,
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

    // 检查经营范围是否需要展开按钮
    checkBizScopeOverflow()

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
      sectionLoading.value.basic = true
      fetchBasicInfo(code).then(r => { basicInfo.value = r }).catch(() => {}).finally(() => { sectionLoading.value.basic = false })
      sectionLoading.value.honor = true
      sectionLoading.value.ranking = true
      sectionLoading.value.govAward = true
      fetchHonors(code).then(r => { honorsData.value = r }).catch(() => {}).finally(() => { sectionLoading.value.honor = false; sectionLoading.value.ranking = false; sectionLoading.value.govAward = false })
      sectionLoading.value.layout = true
      fetchLayout(code).then(r => { layoutData.value = r }).catch(() => {}).finally(() => { sectionLoading.value.layout = false })
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
  '产品链名称': { label: '产品链名称', icon: 'i-lucide-tag' },
  '产品类型': { label: '产品类型', icon: 'i-lucide-briefcase' },
  '统一社会信用代码': { label: '统一社会信用代码', icon: 'i-lucide-fingerprint' },
  '法定代表人': { label: '法定代表人', icon: 'i-lucide-user' },
  '注册资本': { label: '注册资本', icon: 'i-lucide-landmark' },
  '成立日期': { label: '成立日期', icon: 'i-lucide-calendar' },
  '经营状态': { label: '经营状态', icon: 'i-lucide-activity' },
  '注册地址': { label: '注册地址', icon: 'i-lucide-map-pin' },
  '经营范围': { label: '经营范围', icon: 'i-lucide-file-text', hidden: true },
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

// 股东饼图数据
const shareholderChartOption = computed(() => {
  const latest = shareholderData.value?.latest
  if (!latest?.data?.length || latest.data.length <= 1) return null
  const columns = latest.column
  // 查找"直接持股比例"或"持股比例"列索引
  const ratioIdx = columns.findIndex((c: string) => c.includes('持股比例') || c.includes('持股'))
  if (ratioIdx === -1) return null
  const nameIdx = 0 // 股东名称通常是第一列

  const pieData = latest.data.map((row: string[]) => {
    const fullName = row[nameIdx] || '-'
    const name = fullName.length > 12 ? fullName.slice(0, 12) + '...' : fullName
    const ratio = parseFloat(row[ratioIdx]) || 0
    return { name, fullName, value: ratio }
  }).filter((d: { value: number }) => d.value > 0)

  if (pieData.length === 0) return null

  return {
    tooltip: { trigger: 'item' as const, formatter: (params: any) => {
      const fullName = params.data?.fullName || params.name
      return `${fullName}: ${params.value}%`
    } },
    legend: { show: false },
    series: [{
      type: 'pie' as const,
      radius: ['40%', '80%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 1 },
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
      const fullName = row[0] || '-'
      const name = fullName.length > 14 ? fullName.slice(0, 14) + '…' : fullName
      const ratio = ratioIdx >= 0 ? parseFloat(row[ratioIdx]) || 0 : 0
      return { name: `${name}${ratio > 0 ? ` ${ratio}%` : ''}`, fullName, value: ratio }
    })
    children.push({ name: '股东', children: shareholderChildren, symbolSize: 12, itemStyle: { color: '#8b5cf6', borderColor: '#8b5cf6', borderWidth: 2 } })
  }

  // 主要成员子节点
  if (members?.data?.length) {
    const memberChildren = members.data.map((row: string[]) => {
      return { name: `${row[0] || '-'} (${row[1] || '-'})`, value: 1 }
    })
    children.push({ name: '主要成员', children: memberChildren, symbolSize: 12, itemStyle: { color: '#06b6d4', borderColor: '#06b6d4', borderWidth: 2 } })
  }

  if (children.length === 0) return null

  return {
    tooltip: { trigger: 'item' as const, triggerOn: 'mousemove', formatter: (params: any) => {
      const fullName = params.data?.fullName || params.data?.name || ''
      const value = params.data?.value
      if (value > 1) return `${fullName}<br/>持股比例: ${value}%`
      return fullName
    } },
    series: [{
      type: 'tree' as const,
      data: [{
        name: companyName,
        children,
        symbolSize: 20,
        itemStyle: { color: '#4f46e5', borderColor: '#4f46e5', borderWidth: 2, shadowBlur: 8, shadowColor: 'rgba(79,70,229,0.3)' },
        label: { position: 'right' as const, align: 'left', fontSize: 13, fontWeight: 'bold', color: '#1e1b4b', backgroundColor: 'rgba(255,255,255,0.95)', padding: [4, 10], borderRadius: 6, distance: 10 },
      }],
      top: '10%', left: '10%', bottom: '5%', right: '18%',
      symbolSize: 8,
      orient: 'LR' as const,
      roam: true,
      label: {
        position: 'left' as const,
        verticalAlign: 'middle',
        align: 'right',
        fontSize: 11,
        fontWeight: '500',
        color: '#334155',
        backgroundColor: 'rgba(255,255,255,0.85)',
        padding: [2, 6],
        borderRadius: 3,
        distance: 5,
      },
      leaves: {
        label: {
          position: 'right' as const,
          verticalAlign: 'middle',
          align: 'left',
          fontSize: 10,
          fontWeight: '400',
          color: '#64748b',
          backgroundColor: 'transparent',
          padding: [1, 2],
          distance: 4,
        },
      },
      emphasis: { focus: 'descendant' as const, itemStyle: { color: '#4338ca', borderColor: '#4338ca', borderWidth: 3 } },
      expandAndCollapse: true,
      initialTreeDepth: 2,
      animationDuration: 550,
      animationDurationUpdate: 750,
      lineStyle: { color: '#c7d2fe', width: 1.5, curveness: 0 },
      itemStyle: { color: '#6366f1', borderColor: '#6366f1', borderWidth: 2 },
      edgeShape: 'polyline' as const,
      edgeForkPosition: '63%',
      layerPadding: 160,
      nodePadding: 30,
    }],
  }
})

// 主要成员关系图 - 中心根节点 + 外环成员，风扇曲线
const memberGraphOption = computed(() => {
  const members = shareholderData.value?.members
  if (!members?.data?.length) return null
  const companyName = company.value?.company_name || '企业'
  const memberCount = members.data.length

  const nodes: any[] = []
  const links: any[] = []
  const memberColorPalette = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']

  // 中心节点 - 不显示名称，hover时tooltip展示
  nodes.push({
    name: 'root',
    symbolSize: 56,
    x: 400,
    y: 280,
    itemStyle: { color: '#4f46e5', shadowBlur: 12, shadowColor: 'rgba(79,70,229,0.3)' },
    label: { show: true, fontSize: 12, fontWeight: 'bold', color: '#fff', position: 'inside', formatter: '企业' },
    category: 0,
    fullName: companyName,
  })

  const shortRadius = 120
  const longRadius = shortRadius * 1.8
  members.data.forEach((row: string[], i: number) => {
    const name = row[0] || '-'
    const title = row[1] || ''
    const nodeName = name.length > 8 ? name.slice(0, 8) + '…' : name
    const color = memberColorPalette[i % memberColorPalette.length]
    const angle = (Math.PI * 2 * i) / memberCount - Math.PI / 2
    const isLong = i % 2 === 0
    const r = isLong ? longRadius : shortRadius
    const x = 400 + Math.cos(angle) * r
    const y = 280 + Math.sin(angle) * r

    nodes.push({
      name: nodeName,
      symbolSize: 36,
      x,
      y,
      itemStyle: { color, shadowBlur: 4, shadowColor: 'rgba(0,0,0,0.1)', borderColor: '#fff', borderWidth: 2 },
      label: {
        show: true,
        position: 'bottom',
        fontSize: 12,
        color: '#1e293b',
        fontWeight: '500',
        formatter: `{fullName|${name}}\n{fullTitle|${title}}`,
        rich: {
          fullName: { fontSize: 12, fontWeight: '600', color: '#1e293b', lineHeight: 18 },
          fullTitle: { fontSize: 11, color: '#64748b', lineHeight: 16 },
        },
      },
      category: 1,
      fullName: name,
      fullTitle: title,
    })

    links.push({
      source: 'root',
      target: nodeName,
      lineStyle: {
        color,
        width: 1.8,
        curveness: 0.2,
        opacity: 0.6,
      },
    })
  })

  return {
    tooltip: {
      trigger: 'item' as const,
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          if (params.data?.fullName) {
            return params.data.fullName === companyName
              ? `${companyName}`
              : `${params.data.fullName}<br/>${params.data.fullTitle || ''}`
          }
        }
        return params.name
      },
    },
    animationDuration: 600,
    animationEasingUpdate: 'quinticInOut',
    series: [{
      type: 'graph' as const,
      layout: 'none' as const,
      roam: true,
      draggable: true,
      data: nodes,
      links,
      categories: [
        { name: '企业', itemStyle: { color: '#4f46e5' } },
        { name: '成员' },
      ],
      emphasis: {
        focus: 'adjacency' as const,
        itemStyle: { borderWidth: 2, borderColor: '#333' },
        lineStyle: { width: 3 },
      },
      edgeSymbol: ['none', 'none'],
      edgeLabel: { show: false },
      lineStyle: { opacity: 0.7, curveness: 0.25 },
      scaleLimit: { min: 0.3, max: 3 },
      zoom: 0.7,
      center: [400, 280],
    }],
  }
})

// 商标分页
const trademarkPageData = computed(() => {
  const data = trademarkData.value?.data
  if (!data) return { items: [] as string[][], total: 0, totalPages: 0 }
  const total = data.length
  const totalPages = Math.ceil(total / TRADEMARK_PAGE_SIZE)
  const start = (trademarkPage.value - 1) * TRADEMARK_PAGE_SIZE
  return { items: data.slice(start, start + TRADEMARK_PAGE_SIZE), total, totalPages }
})

// 专利分页
const patentPageData = computed(() => {
  const data = patentData.value?.data
  if (!data) return { items: [] as string[][], total: 0, totalPages: 0 }
  const total = data.length
  const totalPages = Math.ceil(total / PATENT_PAGE_SIZE)
  const start = (patentPage.value - 1) * PATENT_PAGE_SIZE
  return { items: data.slice(start, start + PATENT_PAGE_SIZE), total, totalPages }
})

// 最新股份分页
const shareholderLatestPage = computed(() => {
  const data = shareholderData.value?.latest?.data
  if (!data) return { items: [] as string[][], total: 0, totalPages: 0 }
  const total = data.length
  const totalPages = Math.ceil(total / SHAREHOLDER_PAGE_SIZE)
  const start = (shareholderPage.value - 1) * SHAREHOLDER_PAGE_SIZE
  return { items: data.slice(start, start + SHAREHOLDER_PAGE_SIZE), total, totalPages }
})

// 荣誉资质分页
const honorPageData = computed(() => {
  const data = honorsData.value?.honor?.data
  if (!data) return { items: [] as string[][], total: 0, totalPages: 0 }
  const total = data.length
  const totalPages = Math.ceil(total / HONOR_PAGE_SIZE)
  const start = (honorPage.value - 1) * HONOR_PAGE_SIZE
  return { items: data.slice(start, start + HONOR_PAGE_SIZE), total, totalPages }
})

// 上榜榜单分页
const rankingPageData = computed(() => {
  const data = honorsData.value?.ranking?.data
  if (!data) return { items: [] as string[][], total: 0, totalPages: 0 }
  const total = data.length
  const totalPages = Math.ceil(total / RANKING_PAGE_SIZE)
  const start = (rankingPage.value - 1) * RANKING_PAGE_SIZE
  return { items: data.slice(start, start + RANKING_PAGE_SIZE), total, totalPages }
})

// 政府奖励分页
const govAwardPageData = computed(() => {
  const data = honorsData.value?.govAward?.data
  if (!data) return { items: [] as string[][], total: 0, totalPages: 0 }
  const total = data.length
  const totalPages = Math.ceil(total / GOV_AWARD_PAGE_SIZE)
  const start = (govAwardPage.value - 1) * GOV_AWARD_PAGE_SIZE
  return { items: data.slice(start, start + GOV_AWARD_PAGE_SIZE), total, totalPages }
})

// 集成电路布图分页
const layoutPageData = computed(() => {
  const data = layoutData.value?.data
  if (!data) return { items: [] as string[][], total: 0, totalPages: 0 }
  const total = data.length
  const totalPages = Math.ceil(total / LAYOUT_PAGE_SIZE)
  const start = (layoutPage.value - 1) * LAYOUT_PAGE_SIZE
  return { items: data.slice(start, start + LAYOUT_PAGE_SIZE), total, totalPages }
})

// 上榜榜单年份分组
const rankingYearGroups = computed(() => {
  const data = honorsData.value?.ranking
  if (!data?.data?.length) return []
  const groups: Record<string, string[][]> = {}
  data.data.forEach((row: string[]) => {
    const dateStr = row[2] || ''
    const year = dateStr.slice(0, 4) || '未知'
    if (!groups[year]) groups[year] = []
    groups[year].push(row)
  })
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])).map(([year, items]) => ({ year, items }))
})

// 荣誉级别颜色映射
function getHonorLevelStyle(level: string) {
  if (level.includes('国家级')) return 'cd-level-national'
  if (level.includes('省级') || level.includes('省')) return 'cd-level-provincial'
  if (level.includes('市级') || level.includes('市')) return 'cd-level-city'
  return 'cd-level-other'
}

// 排名数字格式化
function formatRanking(rank: string) {
  const n = parseInt(rank)
  if (isNaN(n)) return rank
  return `第${rank}名`
}

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

  const chartData = Array.from(statusMap.entries()).map(([name, value]) => {
    const shortName = name.length > 8 ? name.slice(0, 8) + '…' : name
    return { name: shortName, fullName: name, value }
  })
  if (chartData.length <= 1) return null

  return {
    tooltip: { trigger: 'item' as const, formatter: (params: any) => {
      const fullName = params.data?.fullName || params.name
      return `${fullName}: ${params.value}项`
    } },
    legend: { bottom: 0, textStyle: { fontSize: 11 }, type: 'scroll' as const },
    series: [{
      type: 'pie' as const,
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c}项', fontSize: 11, position: 'outside' },
      labelLine: { length: 15, length2: 10, smooth: true },
      emphasis: { label: { fontSize: 13, fontWeight: 'bold' } },
      data: chartData,
    }],
  }
})

// 变更记录展示数据（默认10条，展开后全部）
const changeRecordDisplayData = computed(() => {
  const data = changeRecordData.value?.data
  if (!data) return []
  if (changeRecordExpanded.value) return data
  return data.slice(0, 10)
})

// 变更趋势图（按年份统计变更次数 - 折线图）
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
    tooltip: { trigger: 'axis' as const },
    grid: { left: 40, right: 20, top: 15, bottom: 30 },
    xAxis: {
      type: 'category' as const,
      data: sorted.map(([y]) => y),
      axisLabel: { fontSize: 11 },
      boundaryGap: false,
    },
    yAxis: {
      type: 'value' as const,
      minInterval: 1,
      axisLabel: { fontSize: 11 },
    },
    series: [{
      type: 'line' as const,
      data: sorted.map(([, v]) => v),
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#6366f1', width: 2.5 },
      itemStyle: { color: '#6366f1', borderColor: '#fff', borderWidth: 2 },
      areaStyle: {
        color: {
          type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(99,102,241,0.25)' },
            { offset: 1, color: 'rgba(99,102,241,0.02)' },
          ],
        },
      },
      emphasis: { itemStyle: { color: '#4f46e5', borderWidth: 3 } },
    }],
  }
})

// 变更类型分布图
const changeTypeOption = computed(() => {
  const data = changeRecordData.value?.data
  if (!data?.length) return null

  const typeMap = new Map<string, number>()
  const typeFullMap = new Map<string, string>()
  data.forEach((row: string[]) => {
    const type = row[0] || '未知'
    const shortType = type.length > 10 ? type.slice(0, 10) + '…' : type
    typeMap.set(shortType, (typeMap.get(shortType) || 0) + 1)
    if (!typeFullMap.has(shortType)) typeFullMap.set(shortType, type)
  })

  const chartData = Array.from(typeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, fullName: typeFullMap.get(name) || name, value }))

  if (chartData.length <= 1) return null

  return {
    tooltip: { trigger: 'item' as const, formatter: (params: any) => {
      const fullName = params.data?.fullName || params.name
      return `${fullName}<br/>${params.value}次`
    } },
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

const activeMenu = ref('business')
const expandedGroups = ref(new Set(['company-info', 'business-info', 'contact-info', 'detail-info', 'honor-info', 'layout-info']))
const contentRef = ref<HTMLElement | null>(null)
const isScrolling = ref(false)

const menuGroups = [
  {
    key: 'company-info',
    label: '企业信息',
    icon: 'i-lucide-building-2',
    children: [
      { key: 'business', label: '经营状况', icon: 'i-lucide-bar-chart-3' },
      { key: 'basic', label: '基本信息', icon: 'i-lucide-file-text' },
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
    key: 'honor-info',
    label: '荣誉资质',
    icon: 'i-lucide-award',
    children: [
      { key: 'honor', label: '荣誉资质', icon: 'i-lucide-award' },
      { key: 'ranking', label: '上榜榜单', icon: 'i-lucide-trophy' },
      { key: 'govAward', label: '政府奖励', icon: 'i-lucide-gift' },
    ],
  },
  {
    key: 'layout-info',
    label: '产业布局',
    icon: 'i-lucide-circuit-board',
    children: [
      { key: 'layout', label: '集成电路布图', icon: 'i-lucide-circuit-board' },
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

const sectionKeys = computed(() => visibleMenuGroups.value.flatMap(g => g.children.map(c => c.key)))

function findGroupKey(childKey: string): string | undefined {
  return visibleMenuGroups.value.find(g => g.children.some(c => c.key === childKey))?.key
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
    case 'basic':
      return !!(c.company_name || c.chain_name || c.product_type || c.company_legal_person || c.company_credit_code || basicInfo.value?.length)
    case 'business':
      return !!(c.company_registered_capital || c.company_found_date || c.company_business_status || c.product_type || c.company_business_scope)
    case 'contact':
      return !!(c.contact_info || c.company_website || c.company_work_add)
    case 'shareholder':
      return !!(shareholderData.value?.latest?.data?.length || shareholderData.value?.members?.data?.length)
    case 'trademark':
      return !!(trademarkData.value?.data?.length)
    case 'patent':
      return !!(patentData.value?.data?.length)
    case 'change':
      return !!(changeRecordData.value?.data?.length)
    case 'honor':
      return !!(honorsData.value?.honor?.data?.length)
    case 'ranking':
      return !!(honorsData.value?.ranking?.data?.length)
    case 'govAward':
      return !!(honorsData.value?.govAward?.data?.length)
    case 'layout':
      return !!(layoutData.value?.data?.length)
    default:
      return true
  }
}

// 判断section是否应该显示（考虑加载状态）
function isSectionVisible(key: string): boolean {
  // 基础数据section：直接检查数据
  if (['basic', 'business', 'contact'].includes(key)) {
    return hasSectionData(key)
  }
  // API加载section：加载中显示（有spinner），加载完且有数据显示
  const loadingMap: Record<string, keyof typeof sectionLoading.value> = {
    shareholder: 'shareholder',
    trademark: 'trademark',
    patent: 'patent',
    change: 'changeRecord',
    honor: 'honor',
    ranking: 'ranking',
    govAward: 'govAward',
    layout: 'layout',
  }
  const loadKey = loadingMap[key]
  if (loadKey) {
    if (sectionLoading.value[loadKey]) return true
    return hasSectionData(key)
  }
  return hasSectionData(key)
}

// 过滤菜单组：隐藏无数据的子项和空组
const visibleMenuGroups = computed(() => {
  return menuGroups
    .map((group) => ({
      ...group,
      children: group.children.filter((child) => isSectionVisible(child.key)),
    }))
    .filter((group) => group.children.length > 0)
})

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
    const keys = sectionKeys.value
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    const offset = 120
    let current = keys[0]
    if (maxScroll > 0 && scrollTop >= maxScroll - 10) {
      current = keys[keys.length - 1]
    } else {
      for (const key of keys) {
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
.cd-hero-project-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 5px;
  background: rgba(250, 204, 21, 0.2);
  color: #ca8a04;
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
  padding: 9px 14px 9px 14px;
  margin: 2px 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 8px;
}
.cd-menu-item:hover {
  background: var(--surface-alt);
  color: var(--text);
}
.cd-menu-active {
  background: color-mix(in srgb, var(--primary) 8%, transparent);
  color: var(--primary);
  font-weight: 600;
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
  font-size: 18px;
  font-weight: 700;
  color: var(--text-strong);
  margin: 0 0 20px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--border-light);
}
.cd-title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  flex-shrink: 0;
}

/* ── 各模块标题配色 ───────────────────────── */
.cd-title-business { --s-color: #3b82f6; --s-bg: rgba(59,130,246,0.06); }
.cd-title-business .cd-title-icon { background: rgba(59,130,246,0.12); color: #3b82f6; }

.cd-title-basic { --s-color: #10b981; --s-bg: rgba(16,185,129,0.06); }
.cd-title-basic .cd-title-icon { background: rgba(16,185,129,0.12); color: #10b981; }

.cd-title-shareholder { --s-color: #8b5cf6; --s-bg: rgba(139,92,246,0.06); }
.cd-title-shareholder .cd-title-icon { background: rgba(139,92,246,0.12); color: #8b5cf6; }

.cd-title-trademark { --s-color: #f59e0b; --s-bg: rgba(245,158,11,0.06); }
.cd-title-trademark .cd-title-icon { background: rgba(245,158,11,0.12); color: #f59e0b; }

.cd-title-patent { --s-color: #14b8a6; --s-bg: rgba(20,184,166,0.06); }
.cd-title-patent .cd-title-icon { background: rgba(20,184,166,0.12); color: #14b8a6; }

.cd-title-change { --s-color: #f43f5e; --s-bg: rgba(244,63,94,0.06); }
.cd-title-change .cd-title-icon { background: rgba(244,63,94,0.12); color: #f43f5e; }

.cd-title-honor { --s-color: #eab308; --s-bg: rgba(234,179,8,0.06); }
.cd-title-honor .cd-title-icon { background: rgba(234,179,8,0.12); color: #eab308; }

.cd-title-ranking { --s-color: #f97316; --s-bg: rgba(249,115,22,0.06); }
.cd-title-ranking .cd-title-icon { background: rgba(249,115,22,0.12); color: #f97316; }

.cd-title-govAward { --s-color: #ec4899; --s-bg: rgba(236,72,153,0.06); }
.cd-title-govAward .cd-title-icon { background: rgba(236,72,153,0.12); color: #ec4899; }

.cd-title-layout { --s-color: #06b6d4; --s-bg: rgba(6,182,212,0.06); }
.cd-title-layout .cd-title-icon { background: rgba(6,182,212,0.12); color: #06b6d4; }

.cd-title-contact { --s-color: #0ea5e9; --s-bg: rgba(14,165,233,0.06); }
.cd-title-contact .cd-title-icon { background: rgba(14,165,233,0.12); color: #0ea5e9; }

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
.cd-desc-text-collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cd-scope-expand-btn {
  display: inline-block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--primary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.cd-scope-expand-btn:hover {
  text-decoration: underline;
}

.cd-product-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.cd-product-tag {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  color: #4f46e5;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.15);
  padding: 4px 12px;
  border-radius: 6px;
  line-height: 1.4;
  transition: all 0.15s;
}
.cd-product-tag:hover {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
}

.cd-info-table {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.cd-info-table .cd-info-row-detail:nth-child(even) {
  background: var(--surface-alt);
}
.cd-info-table .cd-info-row-detail:nth-child(odd) {
  background: var(--surface);
}
.cd-info-table .cd-info-row-detail {
  transition: all 0.15s;
}
.cd-info-table .cd-info-row-detail:hover {
  background: rgba(14, 165, 233, 0.04);
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
  padding: 22px 26px;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-top: 3px solid var(--border-light);
  border-radius: 12px;
  transition: all 0.2s;
}
.cd-biz-card:hover {
  border-top-color: #3b82f6;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.1);
}
.cd-biz-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 14px;
}
.cd-biz-icon-capital { color: #6366f1; }
.cd-biz-icon-date { color: #f59e0b; }
.cd-biz-icon-status { color: #10b981; }
.cd-biz-icon-industry { color: #06b6d4; }
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
  padding: 48px 20px;
  gap: 14px;
}
.cd-empty :deep(.size-8) {
  color: var(--text-muted);
  opacity: 0.35;
}
.cd-empty-divider {
  width: 40px;
  height: 1px;
  background: color-mix(in srgb, var(--primary) 20%, transparent);
}
.cd-empty-text {
  font-size: 13px;
  color: var(--text-muted);
  opacity: 0.7;
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
  padding-left: 12px;
  border-left: 3px solid;
  border-image: linear-gradient(180deg, var(--primary), color-mix(in srgb, var(--primary) 30%, transparent)) 1;
}

/* 数据表格 - 美化版 */
.cd-table-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow-x: auto;
  overflow-y: hidden;
}
.cd-table-elegant {
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
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
  font-size: 12px;
  color: var(--text-muted);
  background: linear-gradient(180deg, var(--surface-alt), color-mix(in srgb, var(--primary) 3%, var(--surface-alt)));
  border-bottom: 2px solid color-mix(in srgb, var(--primary) 20%, var(--border));
  white-space: nowrap;
  letter-spacing: 0.02em;
}
.cd-data-table tbody td {
  padding: 12px 16px;
  color: var(--text);
  border-bottom: 1px solid var(--border-light);
  font-size: 13px;
}
.cd-data-table tbody tr:last-child td {
  border-bottom: none;
}
.cd-data-table tbody tr:nth-child(odd) {
  background: var(--surface);
}
.cd-data-table tbody tr:nth-child(even) {
  background: var(--surface-alt);
}
.cd-data-table tbody tr {
  transition: background 0.15s;
}
.cd-data-table tbody tr:hover {
  background: color-mix(in srgb, var(--primary) 6%, var(--surface-alt));
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
  background: linear-gradient(180deg, #f43f5e, rgba(244,63,94,0.2));
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
  background: #f43f5e;
  border: 2px solid var(--surface);
  box-shadow: 0 0 0 2px rgba(244,63,94,0.3);
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

.cd-chart {
  width: 100%;
  height: 300px;
}
.cd-chart-sm {
  width: 100%;
  height: 220px;
}
.cd-tree-chart {
  width: 100%;
  height: 500px;
}
.cd-member-graph {
  width: 100%;
  height: 420px;
}

/* ── 专利卡片样式 ───────────────────────── */
.cd-card-grid-patent {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 10px;
}
.cd-info-card-patent {
  padding: 14px 16px;
  border: 1px solid var(--border-light);
  border-radius: 10px;
}
.cd-patent-title {
  white-space: normal !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  word-break: break-word;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  max-height: calc(1.5em * 3);
}
.cd-patent-meta {
  flex-direction: column;
  gap: 4px;
}
.cd-patent-meta .cd-info-card-tag {
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
}

/* ── 工商信息卡片网格 ────────────────────────── */
.cd-register-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 8px;
}
.cd-register-item {
  display: flex;
  align-items: center;
  padding: 13px 18px;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-left: 3px solid var(--border-light);
  border-radius: 10px;
  gap: 14px;
  transition: all 0.2s;
}
.cd-register-item:hover {
  border-color: #10b981;
  border-left-color: #10b981;
  background: rgba(16, 185, 129, 0.03);
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.08);
  transform: translateX(2px);
}
.cd-register-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 100px;
}
.cd-register-label :deep(.size-3\\.5),
.cd-register-label :deep(svg) {
  color: #10b981;
}
.cd-register-value {
  font-size: 13px;
  color: var(--text);
  word-break: break-all;
  flex: 1;
  text-align: left;
  font-weight: 500;
}

/* 基本信息行样式（无API数据时使用） */
.cd-info-row-detail {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  gap: 16px;
}
.cd-register-grid > .cd-info-row-detail:nth-child(even) {
  background: var(--surface-alt);
}
.cd-register-grid > .cd-info-row-detail:nth-child(odd) {
  background: var(--surface);
}
.cd-register-grid > .cd-info-row-detail:hover {
  background: color-mix(in srgb, var(--primary) 5%, var(--surface-alt));
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
  min-width: 140px;
}
.cd-info-row-right {
  font-size: 13px;
  color: var(--text);
  font-weight: 500;
  text-align: left;
  word-break: break-all;
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
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  transition: all 0.2s;
}
.cd-info-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border-color: var(--border);
  transform: translateY(-2px);
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
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #d97706;
}
.cd-patent-icon {
  background: linear-gradient(135deg, #ccfbf1, #99f6e4);
  color: #0f766e;
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
  .cd-section-title {
    font-size: 15px;
    padding: 10px 14px;
    border-radius: 10px;
  }
  .cd-title-icon {
    width: 30px;
    height: 30px;
    border-radius: 8px;
  }
  .cd-business-cards {
    grid-template-columns: 1fr;
  }
  .cd-card-grid {
    grid-template-columns: 1fr;
  }
  .cd-card-grid-patent {
    grid-template-columns: 1fr;
  }
  .cd-register-grid {
    grid-template-columns: 1fr;
  }
  .cd-member-graph {
    height: 280px;
  }
  .cd-tree-chart {
    height: 320px;
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
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text);
  transition: all 0.2s;
}
.cd-page-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: #fff;
  background: var(--primary);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
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

/* ── 荣誉资质样式 ───────────────────────── */
.cd-honor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 14px;
}
.cd-honor-card {
  position: relative;
  padding: 18px 20px;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: 14px;
  transition: all 0.2s;
  overflow: hidden;
}
.cd-honor-card:hover {
  box-shadow: 0 4px 16px rgba(234, 179, 8, 0.14);
  border-color: rgba(234, 179, 8, 0.35);
  transform: translateY(-2px);
}
.cd-honor-badge {
  position: absolute;
  top: 0;
  left: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 0 0 8px 0;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  line-height: 1.4;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.cd-level-national {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
  border: 1px solid #fcd34d;
}
.cd-level-provincial {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1e40af;
  border: 1px solid #93c5fd;
}
.cd-level-city {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #065f46;
  border: 1px solid #6ee7b7;
}
.cd-level-other {
  background: var(--surface-alt);
  color: var(--text-muted);
  border: 1px solid var(--border);
}
.cd-honor-body {
  flex: 1;
  min-width: 0;
  padding-top: 4px;
}
.cd-honor-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 10px;
  margin-top: 16px;
  line-height: 1.4;
}
.cd-honor-details {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.cd-honor-detail-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-muted);
  background: var(--surface-alt);
  padding: 3px 8px;
  border-radius: 4px;
}
.cd-honor-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.cd-honor-status {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 10px;
}
.cd-status-active {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}
.cd-status-inactive {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}
.cd-honor-org {
  font-size: 11px;
  color: var(--text-muted);
}

/* ── 上榜榜单样式 ───────────────────────── */
.cd-ranking-timeline {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.cd-ranking-year-group {
  position: relative;
}
.cd-ranking-year-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #f97316;
  background: rgba(249, 115, 22, 0.08);
  padding: 5px 18px;
  border-radius: 8px;
  margin-bottom: 12px;
  letter-spacing: 0.02em;
}
.cd-ranking-year-label::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f97316;
}
.cd-ranking-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 12px;
  border-left: 2px solid rgba(249, 115, 22, 0.25);
  margin-left: 8px;
}
.cd-ranking-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 18px;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-left: 3px solid var(--border-light);
  border-radius: 10px;
  transition: all 0.2s;
  position: relative;
}
.cd-ranking-card:hover {
  box-shadow: 0 2px 12px rgba(249, 115, 22, 0.1);
  border-color: rgba(249, 115, 22, 0.3);
  border-left-color: #f97316;
  transform: translateX(2px);
}
.cd-ranking-rank {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: #fff;
  font-weight: 800;
  box-shadow: 0 3px 10px rgba(249, 115, 22, 0.3);
}
.cd-ranking-rank-num {
  font-size: 15px;
  font-family: var(--font-display);
  letter-spacing: -0.02em;
}
.cd-ranking-body {
  flex: 1;
  min-width: 0;
}
.cd-ranking-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-strong);
  margin-bottom: 6px;
  line-height: 1.4;
}
.cd-ranking-label {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface-alt);
  padding: 1px 6px;
  border-radius: 3px;
  margin-right: 6px;
  vertical-align: middle;
}
.cd-ranking-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.cd-ranking-publisher,
.cd-ranking-date {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
}

/* ── 政府奖励样式 ───────────────────────── */
.cd-gov-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 14px;
}
.cd-gov-card {
  position: relative;
  padding: 20px 22px;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-top: 3px solid var(--border-light);
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.2s;
}
.cd-gov-card:hover {
  box-shadow: 0 4px 16px rgba(236, 72, 153, 0.12);
  border-color: rgba(236, 72, 153, 0.3);
  border-top-color: #ec4899;
  transform: translateY(-2px);
}
.cd-gov-ribbon {
  position: absolute;
  top: 0;
  right: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 14px 4px 12px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 0 14px 0 10px;
}
.cd-gov-ribbon.cd-level-national {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #78350f;
  border: none;
}
.cd-gov-ribbon.cd-level-provincial {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  color: #fff;
  border: none;
}
.cd-gov-ribbon.cd-level-city {
  background: linear-gradient(135deg, #34d399, #10b981);
  color: #fff;
  border: none;
}
.cd-gov-ribbon.cd-level-other {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
  color: #fff;
  border: none;
}
.cd-gov-body {
  padding-top: 4px;
}
.cd-gov-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 6px;
  padding-right: 60px;
  line-height: 1.4;
}
.cd-gov-project {
  font-size: 13px;
  color: var(--text);
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cd-gov-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}
.cd-gov-year,
.cd-gov-person {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
}
.cd-gov-date {
  font-size: 11px;
  color: var(--text-muted);
  opacity: 0.7;
}

/* ── 集成电路布图样式 ───────────────────────── */
.cd-layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 14px;
}
.cd-layout-card {
  padding: 18px 20px;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: 14px;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}
.cd-layout-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #06b6d4, #0891b2, #06b6d4);
  border-radius: 3px 3px 0 0;
  opacity: 0;
  transition: opacity 0.3s;
}
.cd-layout-card:hover::before {
  opacity: 1;
}
.cd-layout-card:hover {
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.12);
  border-color: rgba(6, 182, 212, 0.3);
  transform: translateY(-2px);
}
.cd-layout-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.cd-layout-chip-icon {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: #fff;
  flex-shrink: 0;
}
.cd-layout-reg {
  font-size: 11px;
  font-weight: 600;
  color: #0891b2;
  background: rgba(6, 182, 212, 0.1);
  padding: 3px 10px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  flex-shrink: 0;
}
.cd-layout-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.cd-layout-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.cd-layout-tag {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
}
.cd-layout-tag-struct {
  background: rgba(99, 102, 241, 0.1);
  color: #4f46e5;
}
.cd-layout-tag-tech {
  background: rgba(6, 182, 212, 0.1);
  color: #0891b2;
}
.cd-layout-tag-func {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}
.cd-layout-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cd-layout-info-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cd-layout-info-label {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  min-width: 56px;
  flex-shrink: 0;
}
.cd-layout-info-value {
  font-size: 12px;
  color: var(--text);
  font-weight: 500;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── 新模块响应式 ────────────────────────── */
@media (max-width: 768px) {
  .cd-honor-grid {
    grid-template-columns: 1fr;
  }
  .cd-gov-grid {
    grid-template-columns: 1fr;
  }
  .cd-layout-grid {
    grid-template-columns: 1fr;
  }
}

</style>
