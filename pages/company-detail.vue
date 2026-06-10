<template>
  <div class="cd-page">
    <div class="cd-topbar">
      <div class="cd-shell">
        <div class="cd-breadcrumb">
          <button type="button" class="cd-bc-back" @click="goBack">
            <UIcon name="i-lucide-arrow-left" class="size-3.5" />
            <span>返回上一级</span>
          </button>
          <UIcon name="i-lucide-chevron-right" class="size-3.5 cd-bc-sep" />
          <span class="cd-bc-text">{{ parentLabel }}</span>
          <UIcon name="i-lucide-chevron-right" class="size-3.5 cd-bc-sep" />
          <span class="cd-bc-current">{{ company?.company_name || '企业详情' }}</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="cd-loading">
      <div class="cd-loading-ring" />
      <span>加载中…</span>
    </div>

    <div v-else-if="!company" class="cd-not-found">
      <UIcon name="i-lucide-building-x" class="size-12 opacity-20" />
      <p>未找到该企业信息</p>
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
            <!-- 核心指标 -->
            <div v-if="hasStrengthData" class="cd-strength-section">
              <h3 class="cd-desc-card-title">
                <UIcon name="i-lucide-zap" class="size-4" />
                核心指标
              </h3>
              <div class="cd-strength-grid-detail">
                <div v-if="company.company_score" class="cd-strength-card-detail cd-strength-score">
                  <div class="cd-strength-card-num-detail">{{ company.company_score }}</div>
                  <div class="cd-strength-card-lbl-detail">评分</div>
                </div>
                <div v-if="company.hornor_num" class="cd-strength-card-detail cd-strength-honor">
                  <div class="cd-strength-card-num-detail">{{ company.hornor_num }}</div>
                  <div class="cd-strength-card-lbl-detail">荣誉数量</div>
                </div>
                <div v-if="company.authorized_patents_count" class="cd-strength-card-detail cd-strength-patent">
                  <div class="cd-strength-card-num-detail">{{ company.authorized_patents_count }}</div>
                  <div class="cd-strength-card-lbl-detail">授权专利</div>
                </div>
                <div v-if="company.authorized_invention_patents_count" class="cd-strength-card-detail cd-strength-invention">
                  <div class="cd-strength-card-num-detail">{{ company.authorized_invention_patents_count }}</div>
                  <div class="cd-strength-card-lbl-detail">授权发明专利</div>
                </div>
                <div v-if="company.national_standards_count" class="cd-strength-card-detail cd-strength-standard">
                  <div class="cd-strength-card-num-detail">{{ company.national_standards_count }}</div>
                  <div class="cd-strength-card-lbl-detail">国家标准(项)</div>
                </div>
                <div v-if="company.participated_standards_count" class="cd-strength-card-detail cd-strength-participate">
                  <div class="cd-strength-card-num-detail">{{ company.participated_standards_count }}</div>
                  <div class="cd-strength-card-lbl-detail">参研标准(项)</div>
                </div>
              </div>
              <div class="cd-strength-meta-detail">
                <div v-if="company.company_financing_round && company.company_financing_round !== '-'" class="cd-strength-meta-row">
                  <UIcon name="i-lucide-trending-up" class="size-3.5" />
                  <span class="cd-strength-meta-label-detail">融资轮次</span>
                  <span class="cd-strength-meta-value-detail">{{ company.company_financing_round }}</span>
                </div>
                <div v-if="company.latest_financing_date && company.latest_financing_date !== '-'" class="cd-strength-meta-row">
                  <UIcon name="i-lucide-clock" class="size-3.5" />
                  <span class="cd-strength-meta-label-detail">起始融资时间</span>
                  <span class="cd-strength-meta-value-detail">{{ company.latest_financing_date }}</span>
                </div>
                <div v-if="company.company_scale && company.company_scale !== '-'" class="cd-strength-meta-row">
                  <UIcon name="i-lucide-building" class="size-3.5" />
                  <span class="cd-strength-meta-label-detail">企业规模</span>
                  <span class="cd-strength-meta-value-detail">{{ company.company_scale }}</span>
                </div>
                <div v-if="company.company_nature && company.company_nature !== '-'" class="cd-strength-meta-row">
                  <UIcon name="i-lucide-shield" class="size-3.5" />
                  <span class="cd-strength-meta-label-detail">企业性质</span>
                  <span class="cd-strength-meta-value-detail">{{ company.company_nature }}</span>
                </div>
                <div v-if="company.honrs && company.honrs !== '-'" class="cd-strength-meta-row cd-strength-meta-full">
                  <UIcon name="i-lucide-award" class="size-3.5" />
                  <span class="cd-strength-meta-label-detail">荣誉</span>
                  <span class="cd-strength-meta-value-detail">{{ company.honrs }}</span>
                </div>
              </div>
            </div>

            <div class="cd-business-cards">
              <div class="cd-biz-card">
                <div class="cd-biz-card-header">
                  <UIcon name="i-lucide-landmark" class="size-5 cd-biz-icon-capital" />
                  <span>注册资本</span>
                </div>
                <div class="cd-biz-card-value">{{ company.company_registered_capital }}</div>
              </div>
              <div class="cd-biz-card">
                <div class="cd-biz-card-header">
                  <UIcon name="i-lucide-calendar-check" class="size-5 cd-biz-icon-date" />
                  <span>成立日期</span>
                </div>
                <div class="cd-biz-card-value">{{ company.company_found_date }}</div>
              </div>
              <div class="cd-biz-card">
                <div class="cd-biz-card-header">
                  <UIcon name="i-lucide-activity" class="size-5 cd-biz-icon-status" />
                  <span>经营状态</span>
                </div>
                <div class="cd-biz-card-value">{{ company.company_business_status }}</div>
              </div>
              <div class="cd-biz-card">
                <div class="cd-biz-card-header">
                  <UIcon name="i-lucide-briefcase" class="size-5 cd-biz-icon-industry" />
                  <span>产品类型</span>
                </div>
                <div class="cd-biz-card-value">{{ company.product_type }}</div>
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
              <button
                v-if="honorsData.ranking.data.length > 5"
                class="cd-scope-expand-btn"
                @click="rankingExpanded = !rankingExpanded"
              >
                {{ rankingExpanded ? '收起' : '展示更多' }}
              </button>
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

          <!-- 主营产品 & 旗下品牌 -->
          <section id="section-product" class="cd-section" v-if="isSectionVisible('product')">
            <h2 class="cd-section-title cd-title-product">
              <span class="cd-title-icon"><UIcon name="i-lucide-shopping-bag" class="size-5" /></span>
              主营产品 & 旗下品牌
              <span v-if="sectionLoading.product" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <!-- 主营产品 -->
            <template v-if="productData?.mainProducts?.data?.length">
              <div class="cd-sub-section">
                <h3 class="cd-sub-title">主营产品</h3>
                <div class="cd-product-hero-grid">
                  <div v-for="(row, ri) in productData.mainProducts.data" :key="`mp-${ri}`" class="cd-product-hero-card">
                    <div class="cd-product-hero-icon">
                      <UIcon name="i-lucide-box" class="size-6" />
                    </div>
                    <div class="cd-product-hero-body">
                      <h4 class="cd-product-hero-name">{{ row[0] || '-' }}</h4>
                      <p
                        class="cd-product-hero-desc"
                        :class="{ 'cd-product-hero-desc-expanded': productExpandedMap[`mp-${ri}`] }"
                        :data-key="`mp-${ri}`"
                      >{{ row[1] || '-' }}</p>
                      <button
                        v-if="productNeedExpandMap[`mp-${ri}`]"
                        class="cd-scope-expand-btn"
                        @click="productExpandedMap[`mp-${ri}`] = !productExpandedMap[`mp-${ri}`]"
                      >
                        {{ productExpandedMap[`mp-${ri}`] ? '收起' : '展示更多' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <!-- 旗下品牌 -->
            <template v-if="productData?.brands?.data?.length">
              <div class="cd-sub-section">
                <h3 class="cd-sub-title">旗下品牌</h3>
                <div class="cd-brand-grid">
                  <div v-for="(row, ri) in productData.brands.data" :key="`br-${ri}`" class="cd-brand-card">
                    <div class="cd-brand-badge">
                      <UIcon name="i-lucide-tag" class="size-4" />
                      <span>{{ row[0] || '-' }}</span>
                    </div>
                    <p
                      class="cd-brand-desc"
                      :class="{ 'cd-brand-desc-expanded': brandExpandedMap[`br-${ri}`] }"
                      :data-key="`br-${ri}`"
                    >{{ row[1] || '-' }}</p>
                    <button
                      v-if="brandNeedExpandMap[`br-${ri}`]"
                      class="cd-scope-expand-btn"
                      @click="brandExpandedMap[`br-${ri}`] = !brandExpandedMap[`br-${ri}`]"
                    >
                      {{ brandExpandedMap[`br-${ri}`] ? '收起' : '展示更多' }}
                    </button>
                  </div>
                </div>
              </div>
            </template>
            <div v-if="!sectionLoading.product && !productData?.mainProducts?.data?.length && !productData?.brands?.data?.length" class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
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

          <!-- 知识产权出质 -->
          <section id="section-intellectual" class="cd-section" v-if="isSectionVisible('intellectual')">
            <h2 class="cd-section-title cd-title-intellectual">
              <span class="cd-title-icon"><UIcon name="i-lucide-shield-check" class="size-5" /></span>
              知识产权出质
              <span v-if="sectionLoading.intellectual" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <template v-if="intellectualData?.data?.length">
              <div class="cd-intellectual-list">
                <div v-for="(row, ri) in intellectualData.data" :key="`int-${ri}`" class="cd-intellectual-item">
                  <div class="cd-intellectual-accent" />
                  <div class="cd-intellectual-main">
                    <div class="cd-intellectual-top">
                      <div class="cd-intellectual-name">
                        <UIcon name="i-lucide-file-badge" class="size-4 cd-intellectual-icon" />
                        <span>{{ row[0] || '-' }}</span>
                      </div>
                      <span v-if="row[2] && row[2] !== '-'" class="cd-intellectual-kind">{{ row[2] }}</span>
                    </div>
                    <div class="cd-intellectual-details">
                      <div v-if="row[1] && row[1] !== '-'" class="cd-intellectual-detail">
                        <span class="cd-intellectual-label">登记证号</span>
                        <span class="cd-intellectual-value">{{ row[1] }}</span>
                      </div>
                      <div v-if="row[3] && row[3] !== '-'" class="cd-intellectual-detail">
                        <span class="cd-intellectual-label">出质人</span>
                        <span class="cd-intellectual-value">{{ row[3] }}</span>
                      </div>
                      <div v-if="row[4] && row[4] !== '-'" class="cd-intellectual-detail">
                        <span class="cd-intellectual-label">质权人</span>
                        <span class="cd-intellectual-value">{{ row[4] }}</span>
                      </div>
                      <div v-if="row[5] && row[5] !== '-'" class="cd-intellectual-detail">
                        <span class="cd-intellectual-label">标的方</span>
                        <span class="cd-intellectual-value">{{ row[5] }}</span>
                      </div>
                      <div v-if="row[6] && row[6] !== '-'" class="cd-intellectual-detail">
                        <span class="cd-intellectual-label">质权登记日期</span>
                        <span class="cd-intellectual-value">{{ row[6] }}</span>
                      </div>
                      <div v-if="row[7] && row[7] !== '-'" class="cd-intellectual-detail">
                        <span class="cd-intellectual-label">状态</span>
                        <span class="cd-intellectual-value" :class="row[7]?.includes('有效') ? 'cd-status-active' : ''">{{ row[7] }}</span>
                      </div>
                      <div v-if="row[8] && row[8] !== '-'" class="cd-intellectual-detail">
                        <span class="cd-intellectual-label">公示日期</span>
                        <span class="cd-intellectual-value">{{ row[8] }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <div v-else-if="!sectionLoading.intellectual" class="cd-empty">
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
                      <div class="cd-timeline-text-wrap">
                        <span
                          class="cd-timeline-text cd-timeline-before cd-change-before-text"
                          :class="{ 'cd-change-text-expanded': changeBeforeExpandedMap[`cb-${i}`] }"
                          :data-key="`cb-${i}`"
                        >{{ row[2] || '-' }}</span>
                        <button
                          v-if="changeBeforeNeedExpandMap[`cb-${i}`]"
                          class="cd-scope-expand-btn"
                          @click="changeBeforeExpandedMap[`cb-${i}`] = !changeBeforeExpandedMap[`cb-${i}`]"
                        >
                          {{ changeBeforeExpandedMap[`cb-${i}`] ? '收起' : '查看更多' }}
                        </button>
                      </div>
                    </div>
                    <div class="cd-timeline-row">
                      <span class="cd-timeline-label">变更后</span>
                      <div class="cd-timeline-text-wrap">
                        <span
                          class="cd-timeline-text cd-timeline-after cd-change-after-text"
                          :class="{ 'cd-change-text-expanded': changeAfterExpandedMap[`ca-${i}`] }"
                          :data-key="`ca-${i}`"
                        >{{ row[3] || '-' }}</span>
                        <button
                          v-if="changeAfterNeedExpandMap[`ca-${i}`]"
                          class="cd-scope-expand-btn"
                          @click="changeAfterExpandedMap[`ca-${i}`] = !changeAfterExpandedMap[`ca-${i}`]"
                        >
                          {{ changeAfterExpandedMap[`ca-${i}`] ? '收起' : '查看更多' }}
                        </button>
                      </div>
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

          <!-- 对外投资 & 融资历程 -->
          <section id="section-finance" class="cd-section" v-if="isSectionVisible('finance')">
            <h2 class="cd-section-title cd-title-finance">
              <span class="cd-title-icon"><UIcon name="i-lucide-banknote" class="size-5" /></span>
              对外投资 & 融资历程
              <span v-if="sectionLoading.finance" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <!-- 对外投资 -->
            <template v-if="financeData?.investment?.data?.length">
              <div class="cd-sub-section">
                <h3 class="cd-sub-title">对外投资</h3>
                <div class="cd-table-wrap cd-table-elegant">
                  <table class="cd-data-table">
                    <thead>
                      <tr>
                        <th v-for="(col, ci) in financeData.investment.column" :key="`inv-col-${ci}`">{{ col }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, ri) in financeInvestmentPage.items" :key="`inv-row-${ri}`">
                        <td v-for="(col, ci) in financeData.investment.column" :key="`inv-cell-${ri}-${ci}`">{{ row[ci] || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-if="financeInvestmentPage.totalPages > 1" class="cd-pagination">
                  <button class="cd-page-btn" :disabled="financePage <= 1" @click="financePage--">&lt;</button>
                  <span class="cd-page-info">{{ financePage }} / {{ financeInvestmentPage.totalPages }}</span>
                  <button class="cd-page-btn" :disabled="financePage >= financeInvestmentPage.totalPages" @click="financePage++">&gt;</button>
                </div>
              </div>
            </template>
            <!-- 融资历程 -->
            <template v-if="financeData?.financing?.data?.length">
              <div class="cd-sub-section">
                <h3 class="cd-sub-title">融资历程</h3>
                <div class="cd-table-wrap cd-table-elegant">
                  <table class="cd-data-table">
                    <thead>
                      <tr>
                        <th v-for="(col, ci) in financeData.financing.column" :key="`fin-col-${ci}`">{{ col }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, ri) in financeData.financing.data" :key="`fin-row-${ri}`">
                        <td v-for="(col, ci) in financeData.financing.column" :key="`fin-cell-${ri}-${ci}`">{{ row[ci] || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>
            <div v-if="!sectionLoading.finance && !financeData?.investment?.data?.length && !financeData?.financing?.data?.length" class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 实际控制企业 -->
          <section id="section-control" class="cd-section" v-if="isSectionVisible('control')">
            <h2 class="cd-section-title cd-title-control">
              <span class="cd-title-icon"><UIcon name="i-lucide-git-branch" class="size-5" /></span>
              实际控制企业
              <span v-if="sectionLoading.control" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <template v-if="controlData?.data?.length">
              <!-- 关系图 -->
              <div v-if="controlGraphOption" class="cd-sub-section">
                <h3 class="cd-sub-title">控制关系图谱</h3>
                <ClientOnly>
                  <VChart
                    :option="controlGraphOption"
                    class="cd-member-graph"
                    autoresize
                  />
                </ClientOnly>
              </div>
              <!-- 列表 -->
              <div class="cd-sub-section">
                <h3 class="cd-sub-title">控制企业列表</h3>
                <div class="cd-table-wrap cd-table-elegant">
                  <table class="cd-data-table">
                    <thead>
                      <tr>
                        <th v-for="(col, ci) in controlData?.column" :key="`cc-${ci}`">{{ col }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, ri) in controlPageData.items" :key="`cctrl-${ri}`">
                        <td v-for="(cell, ci) in row" :key="`ccr-${ri}-${ci}`">{{ cell || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-if="controlPageData.totalPages > 1" class="cd-pagination">
                  <button class="cd-page-btn" :disabled="controlPage <= 1" @click="controlPage--">&lt;</button>
                  <span class="cd-page-info">{{ controlPage }} / {{ controlPageData.totalPages }}</span>
                  <button class="cd-page-btn" :disabled="controlPage >= controlPageData.totalPages" @click="controlPage++">&gt;</button>
                </div>
              </div>
            </template>
            <div v-else-if="!sectionLoading.control" class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 人员相关: 间接股东 / 社保人数 / 关联企业人员 -->
          <section id="section-indirectShareholder" class="cd-section" v-if="isSectionVisible('indirectShareholder')">
            <h2 class="cd-section-title cd-title-indirect">
              <span class="cd-title-icon"><UIcon name="i-lucide-user-check" class="size-5" /></span>
              间接股东
              <span v-if="sectionLoading.people" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <template v-if="peopleData?.indirectShareholders?.data?.length">
              <div class="cd-table-wrap cd-table-elegant">
                <table class="cd-data-table">
                  <thead>
                    <tr>
                      <th v-for="(col, ci) in peopleData.indirectShareholders.column" :key="`isc-${ci}`">{{ col }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, ri) in indirectShareholderPageData.items" :key="`isr-${ri}`">
                      <td v-for="(cell, ci) in row" :key="`isc-${ri}-${ci}`">{{ cell }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="indirectShareholderPageData.totalPages > 1" class="cd-pagination">
                <button class="cd-page-btn" :disabled="shareholderIndirectPage <= 1" @click="shareholderIndirectPage--">&lt;</button>
                <span class="cd-page-info">{{ shareholderIndirectPage }} / {{ indirectShareholderPageData.totalPages }}</span>
                <button class="cd-page-btn" :disabled="shareholderIndirectPage >= indirectShareholderPageData.totalPages" @click="shareholderIndirectPage++">&gt;</button>
              </div>
            </template>
            <div v-else-if="!sectionLoading.people" class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 社保人数 -->
          <section id="section-socialSecurity" class="cd-section" v-if="isSectionVisible('socialSecurity')">
            <h2 class="cd-section-title cd-title-social">
              <span class="cd-title-icon"><UIcon name="i-lucide-users" class="size-5" /></span>
              社保人数
              <span v-if="sectionLoading.people" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <template v-if="peopleData?.socialSecurity?.data?.length">
              <div v-if="socialSecurityChartOption" class="cd-sub-section">
                <h3 class="cd-sub-title">社保人数趋势</h3>
                <ClientOnly>
                  <VChart
                    :option="socialSecurityChartOption"
                    class="cd-chart-sm"
                    autoresize
                  />
                </ClientOnly>
              </div>
              <div class="cd-table-wrap cd-table-elegant">
                <table class="cd-data-table">
                  <thead>
                    <tr>
                      <th v-for="(col, ci) in peopleData.socialSecurity.column" :key="`ssc-${ci}`">{{ col }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, ri) in peopleData.socialSecurity.data" :key="`ssr-${ri}`">
                      <td v-for="(cell, ci) in row" :key="`ssc-${ri}-${ci}`">{{ cell }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
            <div v-else-if="!sectionLoading.people" class="cd-empty">
              <div class="cd-empty-divider"></div>
              <span class="cd-empty-text">暂无数据</span>
              <div class="cd-empty-divider"></div>
            </div>
          </section>

          <!-- 关联企业/人员 -->
          <section id="section-relatedEntity" class="cd-section" v-if="isSectionVisible('relatedEntity')">
            <h2 class="cd-section-title cd-title-related">
              <span class="cd-title-icon"><UIcon name="i-lucide-network" class="size-5" /></span>
              关联企业/人员
              <span v-if="sectionLoading.people" class="cd-section-loading">
                <span class="cd-mini-spinner" />
              </span>
            </h2>
            <template v-if="peopleData?.relatedEntities?.data?.length">
              <p class="cd-related-hint">彩色节点为关联类型，连线与节点副标题为关系详情；点击 +/- 收起展开，点击二级节点名称查看完整详情</p>
              <ClientOnly>
                <div
                  ref="relatedMindMapRef"
                  class="cd-related-mindmap"
                  :style="{ height: `${relatedMindMapHeight}px` }"
                />
              </ClientOnly>
            </template>
            <div v-else-if="!sectionLoading.people" class="cd-empty">
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
                      <span class="cd-layout-info-value" :title="row[8]">{{ row[8] }}</span>
                    </div>
                    <div v-if="row[9] && row[9] !== '-'" class="cd-layout-info-row">
                      <span class="cd-layout-info-label">权利人</span>
                      <span class="cd-layout-info-value" :title="row[9]">{{ row[9] }}</span>
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

  <UModal
    v-model:open="relatedEntityModalOpen"
    :title="selectedRelatedEntity?.title || '关联详情'"
    :ui="{ content: 'cd-related-modal-content', body: 'overflow-y-auto max-h-[calc(100vh-120px)]' }"
  >
    <template #body>
      <div v-if="selectedRelatedEntity" class="cd-related-modal-body">
        <!-- 关联关系图谱 -->
        <div v-if="relationGraphData" class="cd-relation-graph-wrap">
          <div class="cd-relation-graph-title">
            <UIcon name="i-lucide-git-branch" class="size-4" />
            <span>关联关系图谱</span>
          </div>
          <ClientOnly>
            <CompanyRelationGraph :graph-data="relationGraphData" />
          </ClientOnly>
        </div>
        <!-- 普通字段表格（展示所有字段） -->
        <div class="cd-table-wrap cd-table-elegant cd-related-modal-table">
          <table class="cd-data-table cd-related-kv-table">
            <tbody>
              <tr v-for="(item, fi) in selectedRelatedEntity.fields" :key="`rel-modal-${fi}`">
                <th>{{ item.label }}</th>
                <td>{{ item.value }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end w-full">
        <UButton variant="ghost" size="sm" @click="relatedEntityModalOpen = false">关闭</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { CompanyRecord } from '~/types/company'
import { fetchCompanyByLegacyId, fetchCompanyByCode, isCreditCode } from '~/types/company'
import type {
  ShareholderParsed,
  ShareholderTable,
  TrademarkTable,
  ChangeRecordTable,
  PatentTable,
  RegisterItem,
  BasicInfoItem,
  HonorsParsed,
  LayoutTable,
  FinanceParsed,
  ControlTable,
  ProductParsed,
  PeopleParsed,
  IntellectualTable,
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
  fetchFinance,
  fetchControl,
  fetchProduct,
  fetchPeople,
  fetchIntellectual,
} from '~/types/company-detail'
import {
  getIndustryColor,
} from '~/composables/useGeoAmapMap'
import VChart from 'vue-echarts'
import {
  applyRelatedMindMapDefaultView,
  buildRelatedMindMapTree,
  buildRelatedRowFields,
  createRelatedLineLabelHandler,
  estimateRelatedMindMapHeight,
  registerRelatedMindMapNodeProps,
  type RelatedFieldItem,
} from '~/utils/related-mind-map'
import { buildRelationGraphJsonData } from '~/utils/relation-graph'

definePageMeta({ middleware: 'auth', layout: 'blank', keepalive: true })

const route = useRoute()
const router = useRouter()

const PAGE_LABELS: Record<string, string> = {
  '/': '产业图谱',
  '/geo-screen': '企业地图',
}

function resolveFromPath(from?: string) {
  if (!from || !from.startsWith('/') || from.startsWith('/company-detail')) return null
  return from
}

const backTarget = computed(() => resolveFromPath(route.query.from as string | undefined))

const parentLabel = computed(() => {
  const target = backTarget.value
  if (target) {
    const path = target.split('?')[0]
    return PAGE_LABELS[path] || '上一级'
  }
  return '产业图谱'
})

function goBack() {
  if (backTarget.value) {
    router.push(backTarget.value)
    return
  }
  if (import.meta.client && window.history.length > 1) {
    router.back()
    return
  }
  router.push('/')
}

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
const productExpandedMap = reactive<Record<string, boolean>>({})
const brandExpandedMap = reactive<Record<string, boolean>>({})
const productNeedExpandMap = reactive<Record<string, boolean>>({})
const brandNeedExpandMap = reactive<Record<string, boolean>>({})
const changeBeforeExpandedMap = reactive<Record<string, boolean>>({})
const changeAfterExpandedMap = reactive<Record<string, boolean>>({})
const changeBeforeNeedExpandMap = reactive<Record<string, boolean>>({})
const changeAfterNeedExpandMap = reactive<Record<string, boolean>>({})
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

function checkDescOverflow() {
  nextTick(() => {
    // 主营产品
    document.querySelectorAll<HTMLElement>('.cd-product-hero-desc').forEach((el) => {
      const key = el.dataset.key || ''
      if (!key) return
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 21
      const maxHeight = lineHeight * 4 + 2
      productNeedExpandMap[key] = el.scrollHeight > maxHeight
    })
    // 旗下品牌
    document.querySelectorAll<HTMLElement>('.cd-brand-desc').forEach((el) => {
      const key = el.dataset.key || ''
      if (!key) return
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 21
      const maxHeight = lineHeight * 3 + 2
      brandNeedExpandMap[key] = el.scrollHeight > maxHeight
    })
    // 变更记录 - 变更前
    document.querySelectorAll<HTMLElement>('.cd-change-before-text').forEach((el) => {
      const key = el.dataset.key || ''
      if (!key) return
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20
      const maxHeight = lineHeight * 3 + 2
      const hadClamped = !el.classList.contains('cd-change-text-expanded')
      if (hadClamped) el.classList.add('cd-change-text-expanded')
      const fullHeight = el.scrollHeight
      if (hadClamped) el.classList.remove('cd-change-text-expanded')
      changeBeforeNeedExpandMap[key] = fullHeight > maxHeight
    })
    // 变更记录 - 变更后
    document.querySelectorAll<HTMLElement>('.cd-change-after-text').forEach((el) => {
      const key = el.dataset.key || ''
      if (!key) return
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20
      const maxHeight = lineHeight * 3 + 2
      const hadClamped = !el.classList.contains('cd-change-text-expanded')
      if (hadClamped) el.classList.add('cd-change-text-expanded')
      const fullHeight = el.scrollHeight
      if (hadClamped) el.classList.remove('cd-change-text-expanded')
      changeAfterNeedExpandMap[key] = fullHeight > maxHeight
    })
  })
}

// 新增接口数据
const shareholderData = ref<ShareholderParsed | null>(null)
const trademarkData = ref<TrademarkTable | null>(null)
const changeRecordData = ref<ChangeRecordTable | null>(null)
const patentData = ref<PatentTable | null>(null)
const intellectualData = ref<IntellectualTable | null>(null)
const registerInfo = ref<RegisterItem[] | null>(null)
const basicInfo = ref<BasicInfoItem[] | null>(null)
const honorsData = ref<HonorsParsed | null>(null)
const layoutData = ref<LayoutTable | null>(null)
const financeData = ref<FinanceParsed | null>(null)
const controlData = ref<ControlTable | null>(null)
const productData = ref<ProductParsed | null>(null)
const peopleData = ref<PeopleParsed | null>(null)
const honorPage = ref(1)
const rankingPage = ref(1)
const rankingExpanded = ref(false)
const govAwardPage = ref(1)
const layoutPage = ref(1)
const financePage = ref(1)
const controlPage = ref(1)
const shareholderIndirectPage = ref(1)
const relatedMindMapRef = ref<HTMLElement | null>(null)
let relatedMindMapInstance: any = null
let relatedMindMapInitialViewApplied = false
const relatedEntityModalOpen = ref(false)
const selectedRelatedEntity = ref<{
  title: string
  fields: RelatedFieldItem[]
  rawRow?: string[]
} | null>(null)
const relatedMindMapHeight = computed(() =>
  estimateRelatedMindMapHeight(peopleData.value?.relatedEntities?.data?.length ?? 0),
)

// 弹窗表格字段（展示所有字段）

// 关联详情弹窗中的关系图数据（给 relation-graph 组件使用）
const relationGraphData = computed(() => {
  const entity = selectedRelatedEntity.value
  if (!entity?.rawRow) {
    console.log('[relationGraphData] no rawRow')
    return null
  }
  const table = peopleData.value?.relatedEntities
  if (!table) {
    console.log('[relationGraphData] no table')
    return null
  }

  // 找到"关联方类型"列的索引
  const typeColIdx = table.column.findIndex(
    c => c.includes('关联方类型') || c.includes('关联类型') || c.includes('关联路径'),
  )
  console.log('[relationGraphData] typeColIdx:', typeColIdx, 'columns:', table.column)
  if (typeColIdx < 0) return null

  const rawValue = entity.rawRow[typeColIdx]
  console.log('[relationGraphData] rawValue type:', typeof rawValue, 'isArray:', Array.isArray(rawValue), 'value:', rawValue)
  if (!rawValue || rawValue === '-') return null

  // rawValue 可能是数组（JSON.parse 后）或字符串
  let pathTexts: string[]
  if (Array.isArray(rawValue)) {
    pathTexts = rawValue.filter((t: unknown) => typeof t === 'string' && t.trim())
  } else if (typeof rawValue === 'string') {
    try {
      const parsed = JSON.parse(rawValue)
      pathTexts = Array.isArray(parsed) ? parsed.filter((t: unknown) => typeof t === 'string' && t.trim()) : []
    } catch {
      pathTexts = []
    }
  } else {
    return null
  }

  console.log('[relationGraphData] pathTexts count:', pathTexts.length)
  if (!pathTexts.length) return null

  const mainCompanyName = company.value?.company_name || '本企业'
  const relatedPartyName = entity.title || '关联方'

  const result = buildRelationGraphJsonData(pathTexts, mainCompanyName, relatedPartyName)
  console.log('[relationGraphData] result:', !!result, 'nodes:', result?.nodes?.length, 'lines:', result?.lines?.length)
  return result
})

const HONOR_PAGE_SIZE = 6
const RANKING_PAGE_SIZE = 8
const GOV_AWARD_PAGE_SIZE = 6
const LAYOUT_PAGE_SIZE = 6
const FINANCE_PAGE_SIZE = 6
const CONTROL_PAGE_SIZE = 6
const INDIRECT_SHAREHOLDER_PAGE_SIZE = 8

// 各接口独立加载状态
const sectionLoading = ref({
  shareholder: false,
  trademark: false,
  changeRecord: false,
  patent: false,
  intellectual: false,
  register: false,
  basic: false,
  honor: false,
  ranking: false,
  govAward: false,
  layout: false,
  finance: false,
  control: false,
  product: false,
  people: false,
})

function buildCompanyFromItems(
  code: string,
  register: RegisterItem[] | null,
  basic: BasicInfoItem[] | null,
  enriched?: CompanyRecord | null,
): CompanyRecord | null {
  const map: Record<string, string> = {}
  for (const item of register ?? []) map[item.key] = item.value
  for (const item of basic ?? []) map[item.key] = item.value
  const name = map['企业名称'] || map['公司名称'] || enriched?.company_name || ''
  if (!name) return null
  return {
    id: code,
    company_name: name,
    company_credit_code: code,
    company_longitude: 0,
    company_latitude: 0,
    company_city: map['所属城市'] || map['城市'] || '-',
    conpany_district: map['所属区域'] || map['区县'] || null,
    company_work_add: map['注册地址'] || map['地址'] || null,
    info_type: 0,
    info_type_name: '',
    company_legal_person: map['法定代表人'] || '-',
    company_registered_capital: map['注册资本'] || '-',
    company_found_date: map['成立日期'] || '-',
    company_business_status: map['经营状态'] || '-',
    company_type: map['企业类型'] || '-',
    company_industry: map['所属行业'] || '-',
    company_business_scope: map['经营范围'] || '-',
    company_phone: map['电话'] || '-',
    company_website: map['官网'] || '-',
    company_email: map['邮箱'] || '-',
    company_traded: 0,
    product_type: map['产品类型'] || '-',
    chain_name: map['产品链名称'] || '-',
    import_project: 0,
    product: map['产品'] || '-',
    honors: map['荣誉'] || '-',
    contact_info: map['联系方式'] || '-',
    honrs: enriched?.honrs || '',
    hornor_num: enriched?.hornor_num || 0,
    company_score: enriched?.company_score || 0,
    latest_financing_date: enriched?.latest_financing_date || '',
    authorized_patents_count: enriched?.authorized_patents_count || 0,
    authorized_invention_patents_count: enriched?.authorized_invention_patents_count || 0,
    national_standards_count: enriched?.national_standards_count || 0,
    participated_standards_count: enriched?.participated_standards_count || 0,
    company_financing_round: enriched?.company_financing_round || '',
    company_scale: enriched?.company_scale || '',
    company_nature: enriched?.company_nature || '',
  }
}

/** 将 register/basic 接口返回的数据合并到已有 company 对象 */
function mergeCompanyFromItems(
  code: string,
  register: RegisterItem[] | null,
  basic: BasicInfoItem[] | null,
) {
  if (!company.value) return
  const map: Record<string, string> = {}
  for (const item of register ?? []) map[item.key] = item.value
  for (const item of basic ?? []) map[item.key] = item.value
  if (map['企业名称'] || map['公司名称']) company.value.company_name = map['企业名称'] || map['公司名称'] || company.value.company_name
  if (map['所属城市'] || map['城市']) company.value.company_city = map['所属城市'] || map['城市'] || company.value.company_city
  if (map['所属区域'] || map['区县']) company.value.conpany_district = map['所属区域'] || map['区县'] || null
  if (map['注册地址'] || map['地址']) company.value.company_work_add = map['注册地址'] || map['地址'] || null
  if (map['法定代表人']) company.value.company_legal_person = map['法定代表人']
  if (map['注册资本']) company.value.company_registered_capital = map['注册资本']
  if (map['成立日期']) company.value.company_found_date = map['成立日期']
  if (map['经营状态']) company.value.company_business_status = map['经营状态']
  if (map['企业类型']) company.value.company_type = map['企业类型']
  if (map['所属行业']) company.value.company_industry = map['所属行业']
  if (map['经营范围']) company.value.company_business_scope = map['经营范围']
  if (map['电话']) company.value.company_phone = map['电话']
  if (map['官网']) company.value.company_website = map['官网']
  if (map['邮箱']) company.value.company_email = map['邮箱']
  if (map['产品类型']) company.value.product_type = map['产品类型']
  if (map['产品链名称']) company.value.chain_name = map['产品链名称']
  if (map['产品']) company.value.product = map['产品']
  if (map['荣誉']) company.value.honors = map['荣誉']
  if (map['联系方式']) company.value.contact_info = map['联系方式']
}

let detailSectionsStarted = false
let loadSeq = 0

function startDetailSections(code: string) {
  if (detailSectionsStarted) return
  detailSectionsStarted = true
  loadDetailSections(code, true)
}

function loadDetailSections(code: string, skipRegisterBasic = false) {
  if (!skipRegisterBasic) {
    sectionLoading.value.register = true
    fetchRegisterInfo(code).then(r => { registerInfo.value = r }).catch(() => {}).finally(() => { sectionLoading.value.register = false })
    sectionLoading.value.basic = true
    fetchBasicInfo(code).then(r => { basicInfo.value = r }).catch(() => {}).finally(() => { sectionLoading.value.basic = false })
  }
  sectionLoading.value.shareholder = true
  fetchShareholders(code).then(r => { shareholderData.value = r }).catch(() => {}).finally(() => { sectionLoading.value.shareholder = false })
  sectionLoading.value.trademark = true
  fetchTrademarks(code).then(r => { trademarkData.value = r }).catch(() => {}).finally(() => { sectionLoading.value.trademark = false })
  sectionLoading.value.changeRecord = true
  fetchChangeRecords(code).then(r => { changeRecordData.value = r; checkDescOverflow() }).catch(() => {}).finally(() => { sectionLoading.value.changeRecord = false })
  sectionLoading.value.patent = true
  fetchPatents(code).then(r => { patentData.value = r }).catch(() => {}).finally(() => { sectionLoading.value.patent = false })
  sectionLoading.value.intellectual = true
  fetchIntellectual(code).then(r => { intellectualData.value = r }).catch(() => {}).finally(() => { sectionLoading.value.intellectual = false })
  sectionLoading.value.honor = true
  sectionLoading.value.ranking = true
  sectionLoading.value.govAward = true
  fetchHonors(code).then(r => { honorsData.value = r }).catch(() => {}).finally(() => { sectionLoading.value.honor = false; sectionLoading.value.ranking = false; sectionLoading.value.govAward = false })
  sectionLoading.value.layout = true
  fetchLayout(code).then(r => { layoutData.value = r }).catch(() => {}).finally(() => { sectionLoading.value.layout = false })
  sectionLoading.value.finance = true
  fetchFinance(code).then(r => { financeData.value = r }).catch(() => {}).finally(() => { sectionLoading.value.finance = false })
  sectionLoading.value.control = true
  fetchControl(code).then(r => { controlData.value = r }).catch(() => {}).finally(() => { sectionLoading.value.control = false })
  sectionLoading.value.product = true
  fetchProduct(code).then(r => { productData.value = r; checkDescOverflow() }).catch(() => {}).finally(() => { sectionLoading.value.product = false })
  sectionLoading.value.people = true
  fetchPeople(code).then(r => { peopleData.value = r }).catch(() => {}).finally(() => { sectionLoading.value.people = false })
}

async function loadCompanyDetail() {
  if (!companyId.value) {
    loading.value = false
    return
  }

  const seq = ++loadSeq
  loading.value = true
  company.value = null
  detailSectionsStarted = false

  const id = companyId.value
  let code: string | null = null

  const applyCompany = (record: CompanyRecord) => {
    if (seq !== loadSeq) return
    company.value = record
    loading.value = false
    checkBizScopeOverflow()
    if (code) startDetailSections(code)
  }

  try {
    if (isCreditCode(id)) {
      code = id
      sectionLoading.value.register = true
      sectionLoading.value.basic = true

      const enrichedP = fetchCompanyByCode(code).then((enriched) => {
        if (seq !== loadSeq || !enriched) return
        applyCompany({
          ...enriched,
          id: enriched.company_credit_code || `${enriched.company_name}-${enriched.company_longitude}`,
        })
      }).catch(() => {})

      const registerP = fetchRegisterInfo(code).then((r) => {
        if (seq !== loadSeq) return
        registerInfo.value = r
        sectionLoading.value.register = false
        if (r && company.value) {
          mergeCompanyFromItems(code!, r, null)
        } else if (!company.value && r) {
          const c = buildCompanyFromItems(code!, r, null, null)
          if (c) applyCompany(c)
        }
      }).catch(() => {
        if (seq === loadSeq) sectionLoading.value.register = false
      })

      const basicP = fetchBasicInfo(code).then((b) => {
        if (seq !== loadSeq) return
        basicInfo.value = b
        sectionLoading.value.basic = false
        if (b && company.value) {
          mergeCompanyFromItems(code!, null, b)
        } else if (!company.value && b) {
          const c = buildCompanyFromItems(code!, null, b, null)
          if (c) applyCompany(c)
        }
      }).catch(() => {
        if (seq === loadSeq) sectionLoading.value.basic = false
      })

      // 等三个主接口都结束后再判定「未找到」，避免 2 秒超时误判
      await Promise.allSettled([enrichedP, registerP, basicP])
      if (seq !== loadSeq) return
      loading.value = false
    } else {
      // 地图页旧格式 id（name-lng）
      const item = await fetchCompanyByLegacyId(id)
      if (seq !== loadSeq) return
      if (item) {
        company.value = item
        code = item.company_credit_code || null
      }
      loading.value = false
      checkBizScopeOverflow()
      if (code) startDetailSections(code)
    }
  } catch (e) {
    if (seq !== loadSeq) return
    console.error('[company-detail] 加载企业详情失败', e)
    loading.value = false
  }
}

onMounted(() => {
  loadCompanyDetail()
})

watch(companyId, () => {
  loadCompanyDetail()
  selectedRelatedEntity.value = null
  relatedEntityModalOpen.value = false
})

watch([() => peopleData.value?.relatedEntities, relatedMindMapRef], () => {
  nextTick(() => initRelatedMindMap())
}, { deep: true })

watch(relatedMindMapHeight, () => {
  nextTick(() => {
    if (!relatedMindMapInstance) return
    try {
      relatedMindMapInstance.getElRectInfo()
      relatedMindMapInstance.resize()
    } catch {
      // ignore
    }
  })
})

onMounted(() => {
  nextTick(() => initRelatedMindMap())
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

// 径向关系图（主要成员 / 控制关系共用）
type RadialGraphItem = { name: string; subtitle: string }

function buildRadialRelationGraphOption(
  companyName: string,
  items: RadialGraphItem[],
  outerCategory: string,
) {
  const nodeCount = items.length
  const nodes: any[] = []
  const links: any[] = []
  const colorPalette = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']

  nodes.push({
    name: 'root',
    symbolSize: 60,
    x: 0,
    y: 0,
    itemStyle: { color: '#4f46e5', shadowBlur: 12, shadowColor: 'rgba(79,70,229,0.3)' },
    label: { show: true, fontSize: 12, fontWeight: 'bold', color: '#fff', position: 'inside', formatter: '企业' },
    category: 0,
    fullName: companyName,
  })

  const baseRadius = nodeCount <= 1 ? 120 : Math.max(120, Math.min(180, 80 + nodeCount * 12))
  const longRadius = baseRadius * 1.3
  const shortRadius = baseRadius * 0.85

  items.forEach((item, i) => {
    const name = item.name || '-'
    const subtitle = item.subtitle || ''
    const uniqueName = `node-${i}`
    const color = colorPalette[i % colorPalette.length]

    const angle = (Math.PI * 2 * i) / nodeCount - Math.PI / 2
    const r = i % 2 === 0 ? longRadius : shortRadius
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r

    nodes.push({
      name: uniqueName,
      symbolSize: 32,
      x,
      y,
      itemStyle: { color, shadowBlur: 4, shadowColor: 'rgba(0,0,0,0.1)', borderColor: '#fff', borderWidth: 2 },
      label: {
        show: true,
        position: 'bottom',
        fontSize: 12,
        color: '#1e293b',
        fontWeight: '500',
        formatter: `{fullName|${name}}\n{fullTitle|${subtitle}}`,
        rich: {
          fullName: { fontSize: 12, fontWeight: '600', color: '#1e293b', lineHeight: 18 },
          fullTitle: { fontSize: 11, color: '#64748b', lineHeight: 16 },
        },
      },
      category: 1,
      fullName: name,
      fullTitle: subtitle,
    })

    links.push({
      source: 'root',
      target: uniqueName,
      lineStyle: {
        color,
        width: 2,
        opacity: 0.7,
        curveness: 0.2,
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
        { name: outerCategory },
      ],
      emphasis: {
        focus: 'adjacency' as const,
        itemStyle: { borderWidth: 2, borderColor: '#333' },
        lineStyle: { width: 3 },
      },
      edgeShape: 'curve',
      edgeSymbol: ['none', 'none'],
      edgeLabel: { show: false },
      lineStyle: { opacity: 0.7 },
      scaleLimit: { min: 0.3, max: 3 },
    }],
  }
}

// 主要成员关系图
const memberGraphOption = computed(() => {
  const members = shareholderData.value?.members
  if (!members?.data?.length) return null
  const companyName = company.value?.company_name || '企业'
  const items: RadialGraphItem[] = members.data.map((row: string[]) => ({
    name: row[0] || '-',
    subtitle: row[1] || '',
  }))
  return buildRadialRelationGraphOption(companyName, items, '成员')
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

// 对外投资分页
const financeInvestmentPage = computed(() => {
  const data = financeData.value?.investment?.data
  if (!data) return { items: [] as string[][], total: 0, totalPages: 0 }
  const total = data.length
  const totalPages = Math.ceil(total / FINANCE_PAGE_SIZE)
  const start = (financePage.value - 1) * FINANCE_PAGE_SIZE
  return { items: data.slice(start, start + FINANCE_PAGE_SIZE), total, totalPages }
})

// 实际控制企业分页
const controlPageData = computed(() => {
  const data = controlData.value?.data
  if (!data) return { items: [] as string[][], total: 0, totalPages: 0 }
  const total = data.length
  const totalPages = Math.ceil(total / CONTROL_PAGE_SIZE)
  const start = (controlPage.value - 1) * CONTROL_PAGE_SIZE
  return { items: data.slice(start, start + CONTROL_PAGE_SIZE), total, totalPages }
})

// 间接股东分页
const indirectShareholderPageData = computed(() => {
  const data = peopleData.value?.indirectShareholders?.data
  if (!data) return { items: [] as string[][], total: 0, totalPages: 0 }
  const total = data.length
  const totalPages = Math.ceil(total / INDIRECT_SHAREHOLDER_PAGE_SIZE)
  const start = (shareholderIndirectPage.value - 1) * INDIRECT_SHAREHOLDER_PAGE_SIZE
  return { items: data.slice(start, start + INDIRECT_SHAREHOLDER_PAGE_SIZE), total, totalPages }
})

// 关联企业/人员详情
function openRelatedEntityDetail(rowIndex: number) {
  const table = peopleData.value?.relatedEntities
  if (!table?.data?.[rowIndex]) return
  const row = table.data[rowIndex]
  const nameIdx = table.column.findIndex(c =>
    ['名称', '企业名称', '人员', '关联方', '股东'].some(k => c.includes(k)),
  )
  const title = nameIdx >= 0 && row[nameIdx] && row[nameIdx] !== '-'
    ? row[nameIdx]
    : `关联项 ${rowIndex + 1}`
  selectedRelatedEntity.value = {
    title,
    fields: buildRelatedRowFields(table.column, row),
    rawRow: row,
  }
  relatedEntityModalOpen.value = true
}

function handleRelatedMindMapNodeClick(node: { getData?: (key: string) => unknown }) {
  const rowIndex = node.getData?.('relatedRowIndex')
  if (typeof rowIndex !== 'number' || rowIndex < 0) return
  openRelatedEntityDetail(rowIndex)
}

function buildRelatedMindMapData() {
  const table = peopleData.value?.relatedEntities
  if (!table?.data?.length) return null
  const companyName = company.value?.company_name || '关联企业/人员'
  return buildRelatedMindMapTree(table, companyName)
}

// 初始化关联企业/人员思维导图
async function initRelatedMindMap() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (!relatedMindMapRef.value) return
  const mindData = buildRelatedMindMapData()
  if (!mindData) {
    if (relatedMindMapInstance) {
      relatedMindMapInstance.destroy()
      relatedMindMapInstance = null
    }
    relatedMindMapInitialViewApplied = false
    return
  }

  if (relatedMindMapInstance) {
    relatedMindMapInstance.destroy()
    relatedMindMapInstance = null
  }
  relatedMindMapInitialViewApplied = false

  // 确保容器已有尺寸，避免 simple-mind-map 报宽高为0的错误
  const el = relatedMindMapRef.value
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) {
    requestAnimationFrame(() => initRelatedMindMap())
    return
  }

  try {
    const [{ default: MindMap }, { default: Drag }] = await Promise.all([
      import('simple-mind-map'),
      import('simple-mind-map/src/plugins/Drag.js'),
    ])

    registerRelatedMindMapNodeProps(MindMap)

    relatedMindMapInstance = new MindMap({
      el: relatedMindMapRef.value,
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
        root: { fontSize: 18, paddingX: 20, paddingY: 10 },
        second: { marginX: 110, marginY: 28, fontSize: 16, paddingX: 16, paddingY: 8 },
        node: { marginX: 80, marginY: 14, fontSize: 14, paddingX: 14, paddingY: 6 },
      },
      customHandleLine: createRelatedLineLabelHandler(),
    })
    relatedMindMapInstance.addPlugin(Drag)
    relatedMindMapInstance.on('node_click', handleRelatedMindMapNodeClick)
    relatedMindMapInstance.on('node_tree_render_end', () => {
      if (relatedMindMapInitialViewApplied) return
      relatedMindMapInitialViewApplied = true
      applyRelatedMindMapDefaultView(relatedMindMapInstance)
    })
  } catch (e) {
    console.error('思维导图初始化失败:', e)
  }
}

// 实际控制企业关系图谱
const controlGraphOption = computed(() => {
  const data = controlData.value?.data
  if (!data?.length) return null
  const companyName = company.value?.company_name || '企业'
  const items: RadialGraphItem[] = data.map((row: string[]) => ({
    name: row[0] || '-',
    subtitle: (row[3] && row[3] !== '-') ? row[3] : (row[1] && row[1] !== '-' ? row[1] : ''),
  }))
  return buildRadialRelationGraphOption(companyName, items, '控制企业')
})

// 社保人数趋势图
const socialSecurityChartOption = computed(() => {
  const data = peopleData.value?.socialSecurity?.data
  if (!data?.length || data.length <= 1) return null
  const sorted = [...data].sort((a, b) => String(a[0] ?? '').localeCompare(String(b[0] ?? '')))
  return {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 45, right: 20, top: 15, bottom: 30 },
    xAxis: { type: 'category' as const, data: sorted.map((r) => r[0]), axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value' as const, axisLabel: { fontSize: 11 }, name: '人数' },
    series: [{
      type: 'bar' as const,
      data: sorted.map((r) => parseInt(r[1]) || 0),
      barWidth: '50%',
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#06b6d4' }, { offset: 1, color: '#0891b2' }] },
      },
      label: { show: true, position: 'top', fontSize: 11, color: '#64748b' },
    }],
  }
})

// 上榜榜单年份分组
const rankingYearGroups = computed(() => {
  const data = honorsData.value?.ranking
  if (!data?.data?.length) return []
  const source = rankingExpanded.value ? data.data : data.data.slice(0, 5)
  const groups: Record<string, string[][]> = {}
  source.forEach((row: string[]) => {
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

watch(changeRecordDisplayData, () => {
  checkDescOverflow()
}, { flush: 'post' })

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
const expandedGroups = ref(new Set(['company-info', 'detail-info', 'invest-info', 'product-info', 'people-info', 'honor-info', 'layout-info', 'contact-info']))
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
    key: 'product-info',
    label: '产品与品牌',
    icon: 'i-lucide-package',
    children: [
      { key: 'product', label: '主营产品/品牌', icon: 'i-lucide-shopping-bag' },
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
      { key: 'intellectual', label: '知识产权出质', icon: 'i-lucide-shield-check' },
      { key: 'change', label: '变更记录', icon: 'i-lucide-history' },
    ],
  },
  {
    key: 'invest-info',
    label: '投资与控制',
    icon: 'i-lucide-trending-up',
    children: [
      { key: 'finance', label: '对外投资/融资', icon: 'i-lucide-banknote' },
      { key: 'control', label: '实际控制企业', icon: 'i-lucide-git-branch' },
    ],
  },
  {
    key: 'people-info',
    label: '人员与关联',
    icon: 'i-lucide-user-plus',
    children: [
      { key: 'indirectShareholder', label: '间接股东', icon: 'i-lucide-user-check' },
      { key: 'socialSecurity', label: '社保人数', icon: 'i-lucide-users' },
      { key: 'relatedEntity', label: '关联企业/人员', icon: 'i-lucide-network' },
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

const hasStrengthData = computed(() => {
  const c = company.value
  if (!c) return false
  return !!(c.company_score || c.hornor_num || c.authorized_patents_count || c.authorized_invention_patents_count || c.national_standards_count || c.participated_standards_count || (c.company_financing_round && c.company_financing_round !== '-') || (c.latest_financing_date && c.latest_financing_date !== '-') || (c.company_scale && c.company_scale !== '-') || (c.company_nature && c.company_nature !== '-') || (c.honrs && c.honrs !== '-'))
})

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
    case 'intellectual':
      return !!(intellectualData.value?.data?.length)
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
    case 'finance':
      return !!(financeData.value?.investment?.data?.length || financeData.value?.financing?.data?.length)
    case 'control':
      return !!(controlData.value?.data?.length)
    case 'product':
      return !!(productData.value?.mainProducts?.data?.length || productData.value?.brands?.data?.length)
    case 'indirectShareholder':
      return !!(peopleData.value?.indirectShareholders?.data?.length)
    case 'socialSecurity':
      return !!(peopleData.value?.socialSecurity?.data?.length)
    case 'relatedEntity':
      return !!(peopleData.value?.relatedEntities?.data?.length)
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
    intellectual: 'intellectual',
    change: 'changeRecord',
    honor: 'honor',
    ranking: 'ranking',
    govAward: 'govAward',
    layout: 'layout',
    finance: 'finance',
    control: 'control',
    product: 'product',
    indirectShareholder: 'people',
    socialSecurity: 'people',
    relatedEntity: 'people',
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
  if (relatedMindMapInstance) {
    relatedMindMapInstance.destroy()
    relatedMindMapInstance = null
  }
})

function getIndustryBg(industry: string): string {
  return getIndustryColor(industry)
}
</script>

<style scoped>
.cd-page {
  --cd-max-width: min(1720px, calc(100vw - 32px));
  margin: -24px;
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cd-topbar {
  display: flex;
  justify-content: center;
  padding: 14px 28px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
}
.cd-shell {
  width: 100%;
  max-width: var(--cd-max-width);
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
.cd-bc-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  font: inherit;
  font-weight: 500;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
}
.cd-bc-back:hover {
  color: var(--primary);
}
.cd-bc-text {
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
  max-width: var(--cd-max-width);
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
  gap: 28px;
  padding: 24px 28px 32px;
  align-items: flex-start;
  width: 100%;
  max-width: var(--cd-max-width);
}

.cd-sidebar {
  width: 268px;
  min-width: 268px;
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
.cd-title-intellectual { --s-color: #f59e0b; --s-bg: rgba(245,158,11,0.06); }
.cd-title-intellectual .cd-title-icon { background: rgba(245,158,11,0.12); color: #f59e0b; }
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
  margin-bottom: 18px;
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
.cd-timeline-text-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.cd-change-before-text,
.cd-change-after-text {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.6;
}
.cd-change-text-expanded {
  -webkit-line-clamp: unset;
  overflow: visible;
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
  background-color: rgba(139, 92, 246, 0.05);
  border-radius: 12px;
}
.cd-member-graph {
  width: 100%;
  height: 500px;
  background-color: rgba(139, 92, 246, 0.05);
  border-radius: 12px;
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

/* ── 知识产权出质列表 ───────────────────────── */
.cd-intellectual-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cd-intellectual-item {
  display: flex;
  align-items: stretch;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.2s;
}
.cd-intellectual-item:hover {
  border-color: color-mix(in srgb, #f59e0b 40%, var(--border-light));
  box-shadow: 0 2px 10px rgba(245, 158, 11, 0.08);
  transform: translateX(4px);
}
.cd-intellectual-accent {
  width: 4px;
  background: linear-gradient(180deg, #f59e0b, #d97706);
  flex-shrink: 0;
}
.cd-intellectual-main {
  flex: 1;
  padding: 14px 16px;
  min-width: 0;
}
.cd-intellectual-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.cd-intellectual-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-strong);
}
.cd-intellectual-icon {
  color: #f59e0b;
  flex-shrink: 0;
}
.cd-intellectual-kind {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
  flex-shrink: 0;
}
.cd-intellectual-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 6px 12px;
}
.cd-intellectual-detail {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.cd-intellectual-label {
  color: var(--text-muted);
  flex-shrink: 0;
}
.cd-intellectual-value {
  color: var(--text);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* ── 核心指标卡片（详情页） ───────────────────── */
.cd-strength-section {
  background: var(--surface-alt);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px 22px;
  margin-bottom: 16px;
}
.cd-strength-section .cd-desc-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 16px;
  padding-bottom: 0;
  border-bottom: none;
}
.cd-strength-section .cd-desc-card-title :deep(svg) {
  color: var(--primary);
}
.cd-strength-grid-detail {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}
.cd-strength-card-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 10px;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  transition: all 0.2s;
}
.cd-strength-card-detail:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.cd-strength-card-num-detail {
  font-size: 26px;
  font-weight: 800;
  font-family: var(--font-display);
  line-height: 1;
}
.cd-strength-card-lbl-detail {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}
.cd-strength-score .cd-strength-card-num-detail { color: #fff; }
.cd-strength-score {
  border: none;
  background: linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 70%, var(--accent)) 100%);
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--primary) 35%, transparent);
}
.cd-strength-score::before {
  content: '';
  position: absolute;
  top: -60%;
  left: -20%;
  width: 140%;
  height: 140%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.28) 0%, transparent 50%);
  animation: cd-score-shine-detail 3.5s ease-in-out infinite;
  pointer-events: none;
}
@keyframes cd-score-shine-detail {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(10px, -10px) rotate(8deg); }
}
.cd-strength-score .cd-strength-card-num-detail {
  font-size: 36px;
  font-weight: 900;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  letter-spacing: -0.04em;
}
.cd-strength-score .cd-strength-card-lbl-detail {
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.92);
  font-size: 12px;
  text-transform: uppercase;
}
.cd-strength-honor .cd-strength-card-num-detail { color: var(--warning); }
.cd-strength-honor { border-color: color-mix(in srgb, var(--warning) 20%, transparent); background: color-mix(in srgb, var(--warning) 5%, var(--surface)); }
.cd-strength-patent .cd-strength-card-num-detail { color: var(--success); }
.cd-strength-patent { border-color: color-mix(in srgb, var(--success) 20%, transparent); background: color-mix(in srgb, var(--success) 5%, var(--surface)); }
.cd-strength-invention .cd-strength-card-num-detail { color: var(--accent); }
.cd-strength-invention { border-color: color-mix(in srgb, var(--accent) 20%, transparent); background: color-mix(in srgb, var(--accent) 5%, var(--surface)); }
.cd-strength-standard .cd-strength-card-num-detail { color: var(--primary); }
.cd-strength-standard { border-color: color-mix(in srgb, var(--primary) 20%, transparent); background: color-mix(in srgb, var(--primary) 5%, var(--surface)); }
.cd-strength-participate .cd-strength-card-num-detail { color: var(--danger); }
.cd-strength-participate { border-color: color-mix(in srgb, var(--danger) 20%, transparent); background: color-mix(in srgb, var(--danger) 5%, var(--surface)); }

.cd-strength-meta-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.cd-strength-meta-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  font-size: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  transition: all 0.15s;
}
.cd-strength-meta-row:hover {
  border-color: color-mix(in srgb, var(--text-muted) 30%, transparent);
  box-shadow: var(--shadow-sm);
}
.cd-strength-meta-row :deep(svg) {
  flex-shrink: 0;
  opacity: 0.7;
  color: var(--text-muted);
}
.cd-strength-meta-label-detail {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.cd-strength-meta-label-detail::after {
  content: '';
  display: inline-block;
  width: 1px;
  height: 10px;
  background: var(--border);
  margin-left: 8px;
  vertical-align: middle;
}
.cd-strength-meta-value-detail {
  font-weight: 700;
  font-size: 11px;
  font-family: var(--font-display);
  color: color-mix(in srgb, var(--primary) 50%, var(--text));
  letter-spacing: -0.01em;
}
.cd-strength-meta-full {
  flex-basis: 100%;
}

/* ── 产品/品牌描述展开状态 ─────────────────────── */

/* ── 新模块响应式 ──────────────────────────────── */
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
    height: 340px;
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
  top: -1px;
  left: -1px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 14px 0 14px 0;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  line-height: 1.4;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
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
  width: 56px;
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
  font-size: 14px;
  font-family: var(--font-display);
  letter-spacing: -0.02em;
  white-space: nowrap;
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
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--text);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── 新模块标题配色 ───────────────────────── */
.cd-title-finance { --s-color: #84cc16; --s-bg: rgba(132,204,22,0.06); }
.cd-title-finance .cd-title-icon { background: rgba(132,204,22,0.12); color: #84cc16; }

.cd-title-control { --s-color: #a855f7; --s-bg: rgba(168,85,247,0.06); }
.cd-title-control .cd-title-icon { background: rgba(168,85,247,0.12); color: #a855f7; }

.cd-title-product { --s-color: #ef4444; --s-bg: rgba(239,68,68,0.06); }
.cd-title-product .cd-title-icon { background: rgba(239,68,68,0.12); color: #ef4444; }

.cd-title-indirect { --s-color: #6366f1; --s-bg: rgba(99,102,241,0.06); }
.cd-title-indirect .cd-title-icon { background: rgba(99,102,241,0.12); color: #6366f1; }

.cd-title-social { --s-color: #06b6d4; --s-bg: rgba(6,182,212,0.06); }
.cd-title-social .cd-title-icon { background: rgba(6,182,212,0.12); color: #06b6d4; }

.cd-title-related { --s-color: #f97316; --s-bg: rgba(249,115,22,0.06); }
.cd-title-related .cd-title-icon { background: rgba(249,115,22,0.12); color: #f97316; }

/* ── 对外投资卡片 ───────────────────────── */
.cd-invest-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cd-invest-item {
  display: flex;
  align-items: stretch;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.2s;
}
.cd-invest-item:hover {
  border-color: color-mix(in srgb, #84cc16 40%, var(--border-light));
  box-shadow: 0 2px 10px rgba(132, 204, 22, 0.08);
  transform: translateX(4px);
}
.cd-invest-accent {
  width: 4px;
  background: linear-gradient(180deg, #84cc16, #65a30d);
  flex-shrink: 0;
}
.cd-invest-main {
  flex: 1;
  padding: 12px 16px;
  min-width: 0;
}
.cd-invest-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.cd-invest-company {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.cd-invest-icon {
  color: #84cc16;
  flex-shrink: 0;
}
.cd-invest-company-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cd-invest-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.cd-invest-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}
.cd-invest-tag-ratio {
  background: rgba(132, 204, 22, 0.12);
  color: #65a30d;
}
.cd-invest-tag-active {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}
.cd-invest-tag-inactive {
  background: var(--surface-alt);
  color: var(--text-muted);
}
.cd-invest-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}
.cd-invest-detail {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
}
.cd-invest-detail :deep(svg) {
  opacity: 0.5;
}

/* ── 融资历程时间线 ───────────────────────── */
.cd-finance-timeline {
  position: relative;
  padding-left: 30px;
}
.cd-finance-timeline::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, #84cc16, rgba(132, 204, 22, 0.15));
  border-radius: 1px;
}
.cd-finance-item {
  position: relative;
  padding-bottom: 20px;
}
.cd-finance-item:last-child {
  padding-bottom: 0;
}
.cd-finance-dot {
  position: absolute;
  left: -30px;
  top: 14px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--surface);
  border: 2px solid #84cc16;
  box-shadow: 0 0 0 3px rgba(132, 204, 22, 0.2);
}
.cd-finance-dot-latest {
  background: #84cc16;
  border-color: #84cc16;
  box-shadow: 0 0 0 4px rgba(132, 204, 22, 0.3);
  animation: cd-finance-pulse 2s ease-in-out infinite;
}
@keyframes cd-finance-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(132, 204, 22, 0.3); }
  50% { box-shadow: 0 0 0 8px rgba(132, 204, 22, 0.1); }
}
.cd-finance-card {
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 16px 20px;
  transition: all 0.2s;
}
.cd-finance-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border-color: rgba(132, 204, 22, 0.3);
}
.cd-finance-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.cd-finance-round {
  display: inline-flex;
  align-items: center;
  padding: 3px 12px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #84cc16, #65a30d);
  border-radius: 6px;
}
.cd-finance-date {
  font-size: 13px;
  color: var(--text-muted);
}
.cd-finance-card-body {
  padding-left: 2px;
}
.cd-finance-amount {
  font-size: 20px;
  font-weight: 700;
  color: #84cc16;
  margin-bottom: 8px;
}
.cd-finance-investors {
  font-size: 13px;
  color: var(--text);
  line-height: 1.5;
}
.cd-finance-investors-label {
  color: var(--text-muted);
  font-weight: 500;
}

/* ── 实际控制企业卡片 ───────────────────────── */
.cd-control-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}
.cd-control-list::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: linear-gradient(180deg, color-mix(in srgb, #a855f7 30%, var(--border)), color-mix(in srgb, #a855f7 10%, var(--border)));
  border-radius: 1px;
}
.cd-control-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  position: relative;
}
.cd-control-connector {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}
.cd-control-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--surface);
  border: 2.5px solid #a855f7;
  box-shadow: 0 0 0 3px color-mix(in srgb, #a855f7 15%, transparent);
}
.cd-control-content {
  flex: 1;
  min-width: 0;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: 10px;
  padding: 12px 16px;
  transition: all 0.2s;
}
.cd-control-item:hover .cd-control-content {
  border-color: color-mix(in srgb, #a855f7 35%, var(--border-light));
  box-shadow: 0 2px 10px rgba(168, 85, 247, 0.08);
}
.cd-control-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}
.cd-control-company {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.cd-control-icon {
  color: #a855f7;
  flex-shrink: 0;
}
.cd-control-company-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cd-control-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.cd-control-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
  background: var(--surface-alt);
  color: var(--text-muted);
}
.cd-control-tag-share {
  background: rgba(168, 85, 247, 0.12);
  color: #9333ea;
}
.cd-control-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}
.cd-control-detail {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
}
.cd-control-detail :deep(svg) {
  opacity: 0.5;
}
.cd-control-detail-path {
  flex-basis: 100%;
}

/* ── 主营产品卡片 ───────────────────────── */
.cd-product-hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 14px;
}
.cd-product-hero-card {
  display: flex;
  gap: 16px;
  padding: 20px 22px;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: 14px;
  border-left: 4px solid #ef4444;
  transition: all 0.2s;
}
.cd-product-hero-card:hover {
  box-shadow: 0 4px 18px rgba(239, 68, 68, 0.1);
  transform: translateX(4px);
}
.cd-product-hero-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  flex-shrink: 0;
}
.cd-product-hero-body {
  flex: 1;
  min-width: 0;
}
.cd-product-hero-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-strong);
  margin: 0 0 8px;
}
.cd-product-hero-desc {
  font-size: 13px;
  color: var(--text);
  line-height: 1.6;
  margin: 0;
  overflow: hidden;
  max-height: calc(1.6em * 4);
  transition: max-height 0.35s ease;
}
.cd-product-hero-desc-expanded {
  max-height: 2000px;
}

/* ── 旗下品牌卡片 ───────────────────────── */
.cd-brand-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}
.cd-brand-card {
  padding: 18px 20px;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  transition: all 0.2s;
}
.cd-brand-card:hover {
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.3);
}
.cd-brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
  border-radius: 20px;
  margin-bottom: 12px;
}
.cd-brand-desc {
  font-size: 13px;
  color: var(--text);
  line-height: 1.6;
  margin: 0;
  overflow: hidden;
  max-height: calc(1.6em * 3);
  transition: max-height 0.35s ease;
}
.cd-brand-desc-expanded {
  max-height: 2000px;
}

/* ── 关联企业/人员思维导图 ───────────────────────── */
.cd-related-hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--text-muted, #64748b);
}

.cd-related-modal-table {
  max-height: min(60vh, 520px);
  overflow: auto;
}

.cd-related-kv-table th {
  width: 28%;
  min-width: 120px;
  font-weight: 500;
  color: var(--text-muted, #64748b);
  background: var(--bg, #f8fafc);
  white-space: nowrap;
}

.cd-related-kv-table td {
  word-break: break-word;
}

.cd-related-mindmap {
  width: 100%;
  min-height: 520px;
  background: var(--surface);
  border-radius: 10px;
  border: 1px solid var(--border-light);
  overflow: hidden;
  cursor: pointer;
}

.cd-related-mindmap :deep(.smm-node) {
  cursor: pointer;
}

.cd-related-mindmap :deep(.smm-expand-btn) {
  cursor: pointer;
}

/* 鈹€鈹€ 鏂版ā鍧楀搷搴斿紡 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€ */
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
  .cd-product-hero-grid {
    grid-template-columns: 1fr;
  }
  .cd-brand-grid {
    grid-template-columns: 1fr;
  }
  .cd-strength-grid-detail {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

<style>
.cd-related-modal-content {
  width: min(1400px, calc(100vw - 40px)) !important;
  max-width: min(1400px, calc(100vw - 40px)) !important;
}

/* ── 关联关系图谱 ───────────────────────── */
.cd-related-modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cd-relation-graph-wrap {
  background: var(--surface, #fafcfd);
  border-radius: 10px;
  border: 1px solid var(--border-light, #e2e8f0);
  overflow: hidden;
}

.cd-relation-graph-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text, #1e293b);
  background: var(--bg, #f8fafc);
  border-bottom: 1px solid var(--border-light, #e2e8f0);
}

.cd-relation-graph-chart {
  width: 100%;
  height: 520px;
}

/* 隐藏 relation-graph 工具栏中的 Force Layout 按钮，保留缩放、全屏等功能 */
.rg-toolbar .rg-mb-button[title="Start Force Layout"],
.rg-toolbar .rg-mb-button[title="Stop Force Layout"] {
  display: none !important;
}
</style>
