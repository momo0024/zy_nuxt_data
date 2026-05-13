<template>
  <ClientOnly>
    <div class="opinion-screen" :style="screenVars">

      <!-- 全局背景装饰 -->
      <div class="bg-grid" aria-hidden="true" />
      <div class="bg-glow bg-glow-1" aria-hidden="true" />
      <div class="bg-glow bg-glow-2" aria-hidden="true" />

      <!-- 顶部角标装饰 -->
      <div class="screen-corner sc-tl" aria-hidden="true" />
      <div class="screen-corner sc-tr" aria-hidden="true" />
      <div class="screen-corner sc-bl" aria-hidden="true" />
      <div class="screen-corner sc-br" aria-hidden="true" />

      <div class="screen-grid">

        <!-- ══ 标题栏 ══ -->
        <header class="screen-header">
          <div class="header-wing left-wing" />
          <div class="header-title-wrap">
            <div class="ht-decoration ht-left" aria-hidden="true" />
            <span class="header-title">舆情实时监测数据可视化</span>
            <div class="ht-decoration ht-right" aria-hidden="true" />
          </div>
          <div class="header-wing right-wing" />
        </header>

        <!-- ══ 舆情数据概览 ══ -->
        <section class="panel overview-panel" aria-labelledby="title-overview">
          <PanelTitle id="title-overview" title="舆情数据概览" desc="展示当日全网舆情汇总规模" />
          <div class="metric-grid single">
            <div class="metric-card metric-card-lg" :style="{ '--mc': totalMetric.color }">
              <div class="mc-top-line" />
              <div class="metric-value">{{ totalMetric.value }}<span class="metric-unit">{{ totalMetric.unit }}</span></div>
              <div class="metric-label">{{ totalMetric.label }}</div>
              <div class="mc-bottom-bar" :style="{ background: totalMetric.color }" />
            </div>
          </div>
        </section>

        <!-- ══ 媒体来源分布 ══ -->
        <section class="panel source-panel" aria-labelledby="title-source">
          <PanelTitle id="title-source" title="媒体来源分布" desc="展示不同渠道声量占比，悬停可高亮对应层级" />
          <div class="source-body">
            <div class="source-stack" aria-hidden="true">
              <span
                v-for="(layer, index) in sourceDistribution"
                :key="layer.name"
                class="source-layer"
                :class="{ active: hoveredSource === layer.name }"
                :style="{ '--lc': layer.color, '--ld': `${(sourceDistribution.length - index - 1) * 12}px` }"
                @mouseenter="hoveredSource = layer.name"
                @mouseleave="hoveredSource = null"
              />
            </div>
            <div class="source-list">
              <div
                v-for="item in sourceDistribution"
                :key="item.name"
                class="source-row"
                :class="{ 'source-row-active': hoveredSource === item.name }"
                @mouseenter="hoveredSource = item.name"
                @mouseleave="hoveredSource = null"
              >
                <span class="source-dot" :style="{ '--dc': item.color }" />
                <span class="source-name">{{ item.name }}</span>
                <span class="source-bar-wrap">
                  <span class="source-bar" :style="{ width: `${item.percent}%`, background: item.color }" />
                </span>
                <span class="source-pct">{{ item.percent }}%</span>
                <span class="source-cnt">({{ item.count }})</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ══ 产业动态摘要 ══ -->
        <section class="panel brief-panel" aria-labelledby="title-brief">
          <PanelTitle id="title-brief" title="产业动态摘要" desc="提炼当日半导体重点事件、政策与情绪变化" />
          <div class="brief-body">
            <div class="brief-icon" aria-hidden="true">
              <div class="brief-icon-ring" />
              <div class="brief-icon-core" />
            </div>
            <div class="brief-content">
              <p class="brief-lead">
                今日半导体产业延续 AI 算力爆发驱动的高景气态势，整体情绪维持乐观，台积电董事会拍板
                200 亿美元增资美国亚利桑那厂，并公布逾 312 亿美元资本开支规划，晶圆代工与先进制程相关议题热度持续抬升。
              </p>
              <p class="brief-lead brief-sub">
                HBM、CoWoS、Chiplet 等先进封装链条讨论继续升温，市场对高端产能、良率爬坡与交付周期保持高度关注，
                热点事件整体以扩产、订单兑现和政策扶持为主。
              </p>
              <div class="brief-tags">
                <span v-for="tag in summaryHighlights" :key="tag" class="brief-tag">{{ tag }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ══ 舆情情感对比分析 ══ -->
        <section class="panel sent-home-panel" aria-labelledby="title-sent-home">
          <PanelTitle id="title-sent-home" title="舆情情感对比" desc="对比历史与最新舆情情感结构变化" />
          <div class="sc-wrap">
            <!-- 顶部：总量对比 -->
            <div class="sc-meta">
              <div class="scm-side scm-hist">
                <span class="scm-label">历史总量</span>
                <span class="scm-count">{{ SENTIMENT_DATA.historical.total.toLocaleString() }}<em>条</em></span>
              </div>
              <div class="scm-vs">VS</div>
              <div class="scm-side scm-latest">
                <span class="scm-label">最新总量</span>
                <span class="scm-count">{{ SENTIMENT_DATA.latest.total.toLocaleString() }}<em>条</em></span>
              </div>
            </div>
            <!-- 蝴蝶对比图 -->
            <v-chart class="sc-chart" :option="sentCompareOption" autoresize />
            <!-- 底部：变化量 -->
            <div class="sc-delta-row">
              <div
                v-for="item in sentDeltaItems"
                :key="item.name"
                class="sc-delta-item"
                :style="{ '--dc': item.color }"
              >
                <span class="sdi-dot" />
                <span class="sdi-name">{{ item.name }}</span>
                <span class="sdi-delta" :class="{ up: item.delta > 0, down: item.delta < 0 }">
                  {{ item.delta > 0 ? '↑' : '↓' }}{{ Math.abs(item.delta) }}%
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- ══ 舆情预警信息（滚动）══ -->
        <section class="panel ticker-panel" aria-labelledby="title-ticker">
          <PanelTitle id="title-ticker" title="舆情预警信息" desc="滚动展示热点事件与政策预警，悬停暂停" />
          <div
            class="ticker-shell"
            @mouseenter="tickerPaused = true"
            @mouseleave="tickerPaused = false"
          >
            <div class="ticker-head">
              <span>分类</span><span>事件标题</span><span>时间</span>
            </div>
            <div class="ticker-body">
              <div class="ticker-track" :class="{ paused: tickerPaused }">
                <div
                  v-for="(item, index) in scrollingAlerts"
                  :key="`${item.title}-${index}`"
                  class="ticker-row"
                >
                  <span class="ticker-cat" :class="item.catClass">{{ item.category }}</span>
                  <span class="ticker-title">{{ item.title }}</span>
                  <span class="ticker-time">{{ item.time }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ══ 热门关键词（技术 + 实体）══ -->
        <section class="panel technology-panel" aria-labelledby="title-tech">
          <PanelTitle id="title-tech" title="热门关键词" desc="热门技术名词与实体名词热度排行" />
          <div class="kw-body">

            <!-- ▲ 上区：热门技术名词（3D 浮动云）-->
            <div class="kw-top">
              <div class="kw-sub-bar">
                <i class="kw-gem" aria-hidden="true" />
                <span>热门技术名词</span>
                <i class="kw-bar-line" aria-hidden="true" />
              </div>
              <div class="kw-cloud-wrap">
                <span
                  v-for="(item, i) in techTerms"
                  :key="item.name"
                  class="sphere-word"
                  :data-tip="`${item.count} 篇`"
                  :style="sphereWordStyles[i]"
                  @mouseenter="spherePaused = true"
                  @mouseleave="spherePaused = false"
                >{{ item.name }}</span>
              </div>
            </div>

            <!-- 分割线 -->
            <div class="kw-split" aria-hidden="true" />

            <!-- ▼ 下区：热门实体名词（排行榜）-->
            <div class="kw-bottom">
              <div class="kw-sub-bar">
                <i class="kw-gem kw-gem-ent" aria-hidden="true" />
                <span>热门实体名词</span>
                <i class="kw-bar-line" aria-hidden="true" />
              </div>
              <div class="kw-ent-list">
                <div
                  v-for="(item, idx) in entityTerms"
                  :key="item.name"
                  class="kw-ent-row"
                  :style="{ '--ec': item.color }"
                >
                  <span class="ker-rank">{{ String(idx + 1).padStart(2, '0') }}</span>
                  <span class="ker-name">{{ item.name }}</span>
                  <span class="ker-badge" :class="`kbt-${item.type}`">{{ item.typeLabel }}</span>
                  <span class="ker-bar-wrap"><span class="ker-bar" :style="{ width: `${item.heat}%` }" /></span>
                  <span class="ker-count">{{ item.count }}</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        <!-- ══ 舆情趋势分析 ══ -->
        <section class="panel trend-panel" aria-labelledby="title-trend">
          <PanelTitle id="title-trend" title="舆情趋势分析" desc="展示近 12 个周期内情感趋势变化" />
          <v-chart class="panel-chart" :option="trendOption" autoresize />
        </section>

      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue'
import VChart from 'vue-echarts'
import { SENTIMENT_DATA } from '~/data/mock'

definePageMeta({ middleware: 'auth' })

const settingsStore = useSettingsStore()

/* ── PanelTitle 子组件 ── */
const PanelTitle = defineComponent({
  name: 'PanelTitle',
  props: {
    title: { type: String, required: true },
    desc: { type: String, default: '' }
  },
  template: `
    <div class="panel-title">
      <span class="pt-rail" aria-hidden="true"><i></i><i></i></span>
      <span class="pt-caret" aria-hidden="true"></span>
      <span class="pt-text">{{ title }}</span>
      <span class="pt-line" aria-hidden="true"></span>
      <span v-if="desc" class="pt-help" :title="desc">?</span>
      <span class="pt-dots" aria-hidden="true"><i></i><i></i><i></i></span>
    </div>
  `
})

/* ── 主题色板 ── */
const THEME_VISUALS = {
  dark:   { bgTop:'#07101c', bgBottom:'#020811', panelTop:'rgba(18,88,148,0.52)',   panelBottom:'rgba(3,17,39,0.86)',  primary:'#2ce9ff', secondary:'#1b63ff', accent:'#ffd24a', line:'rgba(76,221,255,0.4)',  lineSoft:'rgba(76,221,255,0.14)', shadow:'rgba(22,150,255,0.2)',  titleGlow:'rgba(77,231,255,0.85)' },
  light:  { bgTop:'#091528', bgBottom:'#021020', panelTop:'rgba(28,98,172,0.46)',   panelBottom:'rgba(5,25,55,0.84)', primary:'#34d6ff', secondary:'#2563eb', accent:'#fbbf24', line:'rgba(89,208,255,0.36)', lineSoft:'rgba(89,208,255,0.13)', shadow:'rgba(37,99,235,0.2)',   titleGlow:'rgba(52,214,255,0.82)' },
  green:  { bgTop:'#071612', bgBottom:'#020b09', panelTop:'rgba(22,110,86,0.48)',   panelBottom:'rgba(4,30,23,0.86)', primary:'#38f5c6', secondary:'#14b8a6', accent:'#fde047', line:'rgba(83,255,207,0.38)', lineSoft:'rgba(83,255,207,0.13)', shadow:'rgba(20,184,166,0.2)',  titleGlow:'rgba(56,245,198,0.8)'  },
  purple: { bgTop:'#100c22', bgBottom:'#050614', panelTop:'rgba(70,44,148,0.48)',   panelBottom:'rgba(16,10,40,0.86)',primary:'#b372ff', secondary:'#38bdf8', accent:'#f472b6', line:'rgba(191,122,255,0.4)', lineSoft:'rgba(191,122,255,0.14)',shadow:'rgba(168,85,247,0.24)', titleGlow:'rgba(179,114,255,0.78)'},
  warm:   { bgTop:'#1c1208', bgBottom:'#0e0703', panelTop:'rgba(144,86,17,0.46)',   panelBottom:'rgba(47,24,5,0.86)', primary:'#ffbf47', secondary:'#38bdf8', accent:'#fb7185', line:'rgba(255,202,92,0.36)', lineSoft:'rgba(255,202,92,0.14)', shadow:'rgba(217,119,6,0.24)', titleGlow:'rgba(255,191,71,0.76)' }
} as const

const palette = computed(() => THEME_VISUALS[settingsStore.theme])

const screenVars = computed(() => ({
  '--op-bg-top':    palette.value.bgTop,
  '--op-bg-bottom': palette.value.bgBottom,
  '--op-pt':        palette.value.panelTop,
  '--op-pb':        palette.value.panelBottom,
  '--op-primary':   palette.value.primary,
  '--op-sec':       palette.value.secondary,
  '--op-accent':    palette.value.accent,
  '--op-line':      palette.value.line,
  '--op-ls':        palette.value.lineSoft,
  '--op-shadow':    palette.value.shadow,
  '--op-tglow':     palette.value.titleGlow,
  '--op-ok':  '#42c95f',
  '--op-warn':'#ffd12f',
  '--op-err': '#ff5a69',
  '--op-fs':  '#f3fbff',
  '--op-ft':  '#ddf6ff',
  '--op-fm':  '#9fc9e4'
}))

/* ── 数据 ── */
const totalMetric = { label:'今日舆情总量', value:'24685', unit:'条', color:'#2ce9ff' }

const sourceDistribution = [
  { name:'微博',   percent:40, count:124, color:'#2ce9ff' },
  { name:'微信',   percent:22, count:68,  color:'#ffd24a' },
  { name:'视频平台',percent:38, count:87,  color:'#ff9e3d' },
  { name:'论坛',   percent:35, count:87,  color:'#39ff91' }
]
const hoveredSource = ref<string | null>(null)

const summaryHighlights = ['AI 算力','晶圆代工','先进制程','HBM','先进封装','亚利桑那厂']

const techTerms = [
  { name:'晶圆代工', count:126, color:'#2ce9ff', desc:'扩产与资本开支相关报道集中' },
  { name:'先进制程', count:98,  color:'#ffd24a', desc:'2nm/3nm 工艺进度持续升温'  },
  { name:'HBM',      count:84,  color:'#ff8a4f', desc:'AI GPU 存储需求高频提及'   },
  { name:'先进封装', count:112, color:'#46f7a8', desc:'CoWoS、Chiplet 产能焦点'  },
  { name:'Chiplet',  count:67,  color:'#8ea8ff', desc:'异构集成架构讨论升温'      },
  { name:'EUV',      count:51,  color:'#b9ff6b', desc:'设备导入与良率话题高频'    },
  { name:'2nm',      count:49,  color:'#ffd97c', desc:'先进节点量产时间表热议'    },
  { name:'CoWoS',    count:79,  color:'#7cf0ff', desc:'封装产能扩张交付关注重点'  }
]

/* ── 3D 球形词云动画 ── */
const spherePaused = ref(false)
const _sphereRY   = ref(0)
const _sphereRX   = ref(-10)
let   _sphereFrame = 0
let   _sphereRafId = 0

// Fibonacci 球面均匀分布
function fibonacciSphere(n: number) {
  const pts: Array<{x:number;y:number;z:number}> = []
  const phi = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const θ = phi * i
    pts.push({ x: Math.cos(θ) * r, y, z: Math.sin(θ) * r })
  }
  return pts
}
const _sphereBase = fibonacciSphere(techTerms.length)
const _maxCount   = Math.max(...techTerms.map(t => t.count))

const sphereWordStyles = computed(() => {
  const ryR = _sphereRY.value * Math.PI / 180
  const rxR = _sphereRX.value * Math.PI / 180
  const cosY = Math.cos(ryR), sinY = Math.sin(ryR)
  const cosX = Math.cos(rxR), sinX = Math.sin(rxR)
  return techTerms.map((item, i) => {
    const p  = _sphereBase[i]
    // 绕 Y 轴旋转
    const x1 =  p.x * cosY + p.z * sinY
    const z1 = -p.x * sinY + p.z * cosY
    // 绕 X 轴倾斜
    const y2 = p.y * cosX - z1 * sinX
    const z2 = p.y * sinX + z1 * cosX
    const depth   = (z2 + 1) / 2                         // 0=远 1=近
    const scale   = 0.36 + depth * 0.64
    const opacity = 0.18 + depth * 0.82
    const fs      = (9 + (item.count / _maxCount) * 14) * scale
    const glow    = Math.round(4 + depth * 14)
    return {
      left:       `${(50 + x1 * 44).toFixed(2)}%`,
      top:        `${(50 - y2 * 40).toFixed(2)}%`,
      fontSize:   `${fs.toFixed(1)}px`,
      opacity:    opacity.toFixed(3),
      zIndex:     Math.round(depth * 20),
      color:      item.color,
      textShadow: `0 0 ${glow}px ${item.color}, 0 0 ${glow * 2}px ${item.color}66`,
      filter:     depth < 0.22 ? `blur(${((0.22 - depth) * 4).toFixed(1)}px)` : 'none'
    }
  })
})

function _animateSphere() {
  if (!spherePaused.value) {
    _sphereFrame++
    _sphereRY.value = (_sphereRY.value + 0.26) % 360
    _sphereRX.value = -10 + Math.sin(_sphereFrame * 0.016) * 7
  }
  _sphereRafId = requestAnimationFrame(_animateSphere)
}

onMounted(()    => { _sphereRafId = requestAnimationFrame(_animateSphere) })
onUnmounted(()  => { cancelAnimationFrame(_sphereRafId) })

const entityTerms = [
  { name:'台积电',    count:218, heat:100, color:'#2ce9ff', type:'corp', typeLabel:'企业' },
  { name:'英伟达',    count:186, heat:85,  color:'#ffd24a', type:'corp', typeLabel:'企业' },
  { name:'三星',      count:143, heat:66,  color:'#ff8a4f', type:'corp', typeLabel:'企业' },
  { name:'SK海力士',  count:112, heat:51,  color:'#46f7a8', type:'corp', typeLabel:'企业' },
  { name:'亚利桑那厂',count:98,  heat:45,  color:'#ff8fc0', type:'loc',  typeLabel:'地点' },
  { name:'黄仁勋',    count:87,  heat:40,  color:'#b9ff6b', type:'per',  typeLabel:'人物' },
  { name:'拜登政府',  count:72,  heat:33,  color:'#8ea8ff', type:'org',  typeLabel:'机构' },
  { name:'中国大陆',  count:61,  heat:28,  color:'#ffd97c', type:'loc',  typeLabel:'地点' }
]

const trendSeries = [
  { name:'正面', data:[72,88,54,91,61,78,83,44,82,20,86,40] },
  { name:'中性', data:[42,63,79,36,73,34,32,31,82,70,19,84] },
  { name:'负面', data:[18,25,44,38,72,84,60,64,52,24,20,38] }
]

const alertItems = [
  { category:'热门事件', catClass:'event', title:'台积电增资亚利桑那厂引发代工链热议',       time:'16:08' },
  { category:'热门政策', catClass:'policy',title:'美国先进制造补贴新规影响晶圆厂投资节奏', time:'15:42' },
  { category:'热门事件', catClass:'event', title:'HBM 产能紧张持续发酵，厂商关注度走高',   time:'15:16' },
  { category:'热门政策', catClass:'policy',title:'多地半导体政策聚焦先进封装与测试',       time:'14:55' },
  { category:'热门事件', catClass:'event', title:'北美 AI 服务器拉货带动先进制程需求抬升', time:'14:33' },
  { category:'热门政策', catClass:'policy',title:'关键材料国产替代政策窗口期进一步明确',   time:'14:05' }
]
const scrollingAlerts = computed(() => [...alertItems, ...alertItems])
const tickerPaused = ref(false)

/* ── ECharts 通用样式 ── */
const chartTooltip = computed(() => ({
  backgroundColor:'rgba(4,18,38,0.96)',
  borderColor:palette.value.line,
  textStyle:{ color:'#e7fbff', fontSize:12 },
  borderRadius:6,
  padding:[10,14]
}))

const ax = computed(() => ({
  axisLine:  { lineStyle:{ color:'rgba(136,211,255,0.3)' } },
  axisTick:  { show:false },
  axisLabel: { color:'#9ad8ff', fontSize:10 },
  splitLine: { lineStyle:{ color:'rgba(105,201,255,0.1)' } }
}))

/* 情感对比蝴蝶图 */
const SC_COLORS = [
  { bright:'#ef4444', soft:'rgba(239,68,68,0.22)', glow:'rgba(239,68,68,0.52)' },  // 负向
  { bright:'#06b6d4', soft:'rgba(6,182,212,0.22)',  glow:'rgba(6,182,212,0.52)'  },  // 中性
  { bright:'#22c55e', soft:'rgba(34,197,94,0.22)',  glow:'rgba(34,197,94,0.52)'  }   // 正向
]

const sentDeltaItems = computed(() => {
  const h = SENTIMENT_DATA.historical
  const l = SENTIMENT_DATA.latest
  return [
    { name:'正向', delta: l.positive - h.positive, color:'#22c55e' },
    { name:'中性', delta: l.neutral  - h.neutral,  color:'#06b6d4' },
    { name:'负向', delta: l.negative - h.negative, color:'#ef4444' }
  ]
})

const sentCompareOption = computed(() => {
  const h = SENTIMENT_DATA.historical
  const l = SENTIMENT_DATA.latest
  const categories = ['负向', '中性', '正向']
  const hVals = [h.negative, h.neutral, h.positive]
  const lVals = [l.negative, l.neutral, l.positive]

  return {
    backgroundColor: 'transparent',
    animationDuration: 800, animationEasing: 'cubicOut',
    tooltip: {
      ...chartTooltip.value,
      trigger: 'item',
      formatter: (p: any) => `<span style="font-size:12px;font-weight:700;color:#ddf6ff">${p.name}</span><br/>${p.seriesName}: <b>${p.value}%</b>`
    },
    title: [
      { text:'历史', left:'22%', top:'2%', textAlign:'center', textStyle:{ color:'rgba(157,216,255,0.72)', fontSize:11, fontWeight:600 } },
      { text:'最新', right:'20%', top:'2%', textAlign:'center', textStyle:{ color:'rgba(157,216,255,0.72)', fontSize:11, fontWeight:600 } }
    ],
    grid: [
      { left:'6%',  right:'54%', top:'14%', bottom:'6%' },
      { left:'54%', right:'6%',  top:'14%', bottom:'6%' }
    ],
    xAxis: [
      { gridIndex:0, type:'value', inverse:true, max:68, min:0,
        axisLabel:{ show:false }, axisLine:{ show:false }, axisTick:{ show:false },
        splitLine:{ lineStyle:{ color:'rgba(136,211,255,0.07)', type:'dashed' } }
      },
      { gridIndex:1, type:'value', max:68, min:0,
        axisLabel:{ show:false }, axisLine:{ show:false }, axisTick:{ show:false },
        splitLine:{ lineStyle:{ color:'rgba(136,211,255,0.07)', type:'dashed' } }
      }
    ],
    yAxis: [
      { gridIndex:0, type:'category', data:categories, position:'right',
        axisLine:{ show:true, lineStyle:{ color:'rgba(136,211,255,0.36)', width:2 } },
        axisTick:{ show:false },
        axisLabel:{ color:'#e8f9ff', fontSize:12, fontWeight:700, margin:12 },
        splitLine:{ show:false }
      },
      { gridIndex:1, type:'category', data:categories, position:'left',
        axisLine:{ show:false }, axisTick:{ show:false },
        axisLabel:{ show:false }, splitLine:{ show:false }
      }
    ],
    series: [
      {
        name:'历史', type:'bar', xAxisIndex:0, yAxisIndex:0,
        barWidth:'54%',
        label:{ show:true, position:'left', formatter:'{c}%', color:'#c8eeff', fontSize:13, fontWeight:800 },
        emphasis:{ focus:'series', itemStyle:{ shadowBlur:32 } },
        data: hVals.map((v, i) => ({
          value: v,
          itemStyle: {
            color:{ type:'linear', x:1, y:0, x2:0, y2:0,
              colorStops:[
                { offset:0, color: SC_COLORS[i].bright },
                { offset:0.72, color: SC_COLORS[i].soft },
                { offset:1, color:'rgba(4,18,38,0.04)' }
              ]
            },
            borderRadius:[0, 6, 6, 0],
            shadowBlur:20, shadowColor: SC_COLORS[i].glow
          }
        }))
      },
      {
        name:'最新', type:'bar', xAxisIndex:1, yAxisIndex:1,
        barWidth:'54%',
        label:{ show:true, position:'right', formatter:'{c}%', color:'#c8eeff', fontSize:13, fontWeight:800 },
        emphasis:{ focus:'series', itemStyle:{ shadowBlur:32 } },
        data: lVals.map((v, i) => ({
          value: v,
          itemStyle: {
            color:{ type:'linear', x:0, y:0, x2:1, y2:0,
              colorStops:[
                { offset:0, color: SC_COLORS[i].bright },
                { offset:0.72, color: SC_COLORS[i].soft },
                { offset:1, color:'rgba(4,18,38,0.04)' }
              ]
            },
            borderRadius:[6, 0, 0, 6],
            shadowBlur:20, shadowColor: SC_COLORS[i].glow
          }
        }))
      }
    ]
  }
})

/* 趋势折线 */
const trendOption = computed(() => ({
  backgroundColor:'transparent',
  color:[palette.value.primary,'#ffd12f','#ff6f6f'],
  tooltip:{ ...chartTooltip.value, trigger:'axis' },
  legend:{ top:4, right:10, icon:'circle', itemWidth:7, itemHeight:7, textStyle:{ color:'#d7f8ff', fontSize:10 } },
  grid:{ top:30, right:12, bottom:20, left:30 },
  xAxis:{ type:'category', boundaryGap:false,
    data:Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0')), ...ax.value },
  yAxis:{ type:'value', max:100, ...ax.value },
  series:trendSeries.map(s => ({
    name:s.name, type:'line', smooth:true,
    symbol:'circle', symbolSize:4,
    lineStyle:{ width:2 }, areaStyle:{ opacity:0.11 },
    data:s.data
  }))
}))

</script>

<style scoped>
/* ═══════════════════════════════
   1. 大屏容器 & 背景
════════════════════════════════ */
.opinion-screen {
  position: relative;
  height: calc(100vh - 138px);
  min-height: calc(100vh - 138px);
  color: var(--op-ft);
  background:
    radial-gradient(circle at 50% 15%, color-mix(in srgb, var(--op-primary) 24%, transparent), transparent 35%),
    radial-gradient(circle at 8% 8%,   color-mix(in srgb, var(--op-sec) 18%,     transparent), transparent 22%),
    radial-gradient(circle at 92% 88%, color-mix(in srgb, var(--op-sec) 14%,     transparent), transparent 20%),
    linear-gradient(180deg, var(--op-bg-top) 0%, var(--op-bg-bottom) 100%);
  border: 1px solid var(--op-ls);
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    0 28px 80px rgba(0,0,0,0.5),
    inset 0 0 50px color-mix(in srgb, var(--op-primary) 12%, transparent);
}

.bg-grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(var(--op-ls) 1px, transparent 1px),
    linear-gradient(90deg, var(--op-ls) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: radial-gradient(circle at 50% 44%, rgba(0,0,0,0.6) 0, transparent 72%);
}
.bg-glow {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(60px);
  z-index: 0;
}
.bg-glow-1 {
  width: 480px; height: 320px;
  top: -60px; left: 50%; transform: translateX(-50%);
  background: color-mix(in srgb, var(--op-primary) 18%, transparent);
}
.bg-glow-2 {
  width: 280px; height: 280px;
  bottom: 80px; right: -40px;
  background: color-mix(in srgb, var(--op-sec) 14%, transparent);
}

/* ═══════════════════════════════
   2. 四角装饰
════════════════════════════════ */
.screen-corner {
  position: absolute;
  width: 22px; height: 22px;
  z-index: 10;
  pointer-events: none;
}
.sc-tl { top: 0;    left: 0;    border-top: 2px solid var(--op-primary); border-left:  2px solid var(--op-primary); }
.sc-tr { top: 0;    right: 0;   border-top: 2px solid var(--op-primary); border-right: 2px solid var(--op-primary); }
.sc-bl { bottom: 0; left: 0;    border-bottom: 2px solid var(--op-primary); border-left:  2px solid var(--op-primary); }
.sc-br { bottom: 0; right: 0;   border-bottom: 2px solid var(--op-primary); border-right: 2px solid var(--op-primary); }

/* ═══════════════════════════════
   3. 栅格布局
════════════════════════════════ */
.screen-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(248px,1fr) minmax(460px,1.94fr) minmax(248px,1fr);
  grid-template-rows: 52px 0.9fr 1.1fr 0.86fr 1.52fr;
  grid-template-areas:
    "header    header    header"
    "overview  map       technology"
    "source    map       technology"
    "brief     map       technology"
    "brief     ticker    trend";
  gap: 10px;
  height: 100%;
  min-height: 0;
  padding: 0 12px 12px;
}

/* ═══════════════════════════════
   4. 标题栏
════════════════════════════════ */
.screen-header {
  grid-area: header;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 52px;
}
.header-title-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-width: 340px;
  height: 42px;
  padding: 0 28px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--op-primary) 18%, transparent), rgba(2,15,36,0.88)),
    rgba(5,18,40,0.82);
  border: 1px solid var(--op-line);
  clip-path: polygon(18px 0,calc(100% - 18px) 0,100% 50%,calc(100% - 18px) 100%,18px 100%,0 50%);
  box-shadow: 0 0 30px color-mix(in srgb, var(--op-primary) 20%, transparent);
}
.header-title {
  color: var(--op-fs);
  font-size: clamp(18px,2vw,28px);
  font-weight: 800;
  letter-spacing: 0.13em;
  text-shadow: 0 0 20px var(--op-tglow);
  white-space: nowrap;
}
.ht-decoration {
  width: 16px; height: 16px;
  border: 1.5px solid var(--op-primary);
  transform: rotate(45deg);
  opacity: 0.72;
  flex-shrink: 0;
}
.header-wing {
  height: 28px;
  border-top: 1px solid var(--op-line);
  border-bottom: 1px solid var(--op-ls);
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--op-sec) 28%, transparent));
  clip-path: polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%);
}
.right-wing { transform: scaleX(-1); }

/* ═══════════════════════════════
   5. 通用面板
════════════════════════════════ */
.panel {
  position: relative;
  overflow: hidden;
  min-height: 0;
  padding: 40px 20px 12px;
  background:
    linear-gradient(180deg, var(--op-pt), var(--op-pb)),
    rgba(3,17,40,0.86);
  border: 1px solid var(--op-line);
  box-shadow:
    inset 0 0 28px color-mix(in srgb, var(--op-primary) 8%, transparent),
    0 6px 26px var(--op-shadow),
    0 1px 0 color-mix(in srgb, white 5%, transparent) inset;
}
/* 面板角标 */
.panel::before, .panel::after {
  content: '';
  position: absolute;
  width: 22px; height: 22px;
  pointer-events: none;
}
.panel::before { top:0; left:0; border-top:2px solid var(--op-primary); border-left:2px solid var(--op-primary); }
.panel::after  { right:0; bottom:0; border-right:2px solid var(--op-primary); border-bottom:2px solid var(--op-primary); }

/* 区域分配 */
.overview-panel  { grid-area: overview; }
.source-panel    { grid-area: source; }
.brief-panel     { grid-area: brief; }
.sent-home-panel { grid-area: map; }
.ticker-panel    { grid-area: ticker; padding: 8px 16px 8px; }
.technology-panel{ grid-area: technology; overflow: visible; z-index: 2; }
.trend-panel     { grid-area: trend; }
.sent-home-panel,
.ticker-panel {
  padding-top: 30px;
}

/* ═══════════════════════════════
   6. 面板标题
════════════════════════════════ */
.panel-title {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  height: 28px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px 0 8px;
  color: var(--op-fs);
  font-size: 14px;
  font-weight: 700;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--op-sec) 44%, rgba(8,42,86,0.96)), rgba(9,40,78,0.88) 72%, rgba(7,22,46,0.28)),
    rgba(8,42,86,0.88);
  border: 1px solid color-mix(in srgb, var(--op-primary) 60%, transparent);
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, white 5%, transparent),
    0 0 14px color-mix(in srgb, var(--op-primary) 16%, transparent);
  clip-path: polygon(0 0, 82% 0, 85% 22%, 100% 22%, 100% 100%, 0 100%);
  text-shadow: 0 0 10px var(--op-tglow);
}
.panel-title::before,
.panel-title::after {
  content: '';
  position: absolute;
  pointer-events: none;
}
.panel-title::before {
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #73e7ff, #1cb7ff);
  box-shadow: 0 0 10px rgba(44, 233, 255, 0.55);
}
.panel-title::after {
  right: 10px;
  bottom: -1px;
  width: 48px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #fff66d, #fff66d);
}
.pt-rail {
  display: inline-flex;
  flex-direction: column;
  gap: 3px;
  margin-left: 8px;
}
.pt-rail i {
  display: block;
  width: 2px;
  height: 5px;
  background: rgba(223, 250, 255, 0.82);
  box-shadow: 0 0 6px rgba(223, 250, 255, 0.45);
}
.pt-caret {
  width: 0; height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left: 11px solid color-mix(in srgb, white 72%, var(--op-primary));
  filter: drop-shadow(0 0 6px rgba(255,255,255,0.35));
  flex-shrink: 0;
}
.pt-text { flex: 0 0 auto; }
.pt-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--op-primary) 56%, transparent), transparent);
}
.pt-help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 10px;
  line-height: 1;
  color: #eefbff;
  border-radius: 50%;
  border: 1px solid var(--op-ls);
  background: color-mix(in srgb, var(--op-primary) 18%, rgba(8,35,70,0.9));
  box-shadow: 0 0 8px color-mix(in srgb, var(--op-primary) 16%, transparent);
  cursor: help;
}
.pt-dots { display: inline-flex; gap: 4px; }
.pt-dots i {
  width: 4px; height: 4px; border-radius: 50%;
  background: var(--op-ok); box-shadow: 0 0 6px currentColor;
}
.pt-dots i:nth-child(2) { color: var(--op-warn); background: currentColor; }
.pt-dots i:nth-child(3) { color: var(--op-primary); background: currentColor; }

/* ═══════════════════════════════
   7. 舆情数据概览
════════════════════════════════ */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 8px;
  height: 100%;
}
.metric-grid.single {
  grid-template-columns: 1fr;
}
.metric-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  background: linear-gradient(160deg,
    color-mix(in srgb, var(--mc, var(--op-sec)) 14%, rgba(5,24,58,0.7)),
    rgba(3,13,36,0.82));
  border: 1px solid color-mix(in srgb, var(--mc, var(--op-line)) 44%, transparent);
  box-shadow: inset 0 0 18px color-mix(in srgb, var(--mc, var(--op-primary)) 8%, transparent);
  overflow: hidden;
}
.metric-card-lg {
  min-height: 100%;
  gap: 10px;
}
.metric-card-lg .metric-value {
  font-size: 36px;
}
.metric-card-lg .metric-label {
  font-size: 13px;
}
.metric-card-lg .metric-unit {
  font-size: 14px;
}
.mc-top-line {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--mc, var(--op-primary)), transparent);
  opacity: 0.7;
}
.mc-bottom-bar {
  position: absolute;
  bottom: 0; left: 0;
  height: 2px;
  width: 60%;
  border-radius: 999px;
  opacity: 0.5;
}
.metric-value {
  color: var(--op-fs);
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 0 14px var(--mc, var(--op-primary));
}
.metric-unit { margin-left: 3px; font-size: 10px; font-weight: 500; color: var(--op-fm); }
.metric-label { font-size: 10px; color: var(--op-fm); }

/* ═══════════════════════════════
   8. 媒体来源分布
════════════════════════════════ */
.source-body {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 12px;
}
.source-stack {
  width: 72px; height: 68px;
  transform: rotateX(56deg) rotateZ(-38deg);
  transform-style: preserve-3d;
  flex-shrink: 0;
  margin-left: 2px;
}
.source-layer {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, color-mix(in srgb, var(--lc) 78%, white), var(--lc));
  border: 1px solid rgba(255,255,255,0.28);
  box-shadow: 0 10px 22px rgba(0,0,0,0.3);
  transform: translateZ(var(--ld));
  transition: transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
  opacity: 0.72;
}
.source-layer.active {
  transform: translateZ(calc(var(--ld) + 16px)) scale(1.06);
  filter: brightness(1.14);
  box-shadow: 0 18px 28px color-mix(in srgb, var(--lc) 34%, rgba(0,0,0,0.45));
  opacity: 1;
}
.source-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 10px;
}
.source-row {
  display: grid;
  grid-template-columns: 8px 42px 1fr 32px 32px;
  align-items: center;
  gap: 5px;
  min-height: 22px;
  padding: 0 4px;
  border-radius: 6px;
  transition: background 0.18s ease, box-shadow 0.18s ease;
}
.source-row-active {
  background: color-mix(in srgb, var(--op-sec) 18%, transparent);
  box-shadow: inset 0 0 0 1px var(--op-ls);
}
.source-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--dc);
  box-shadow: 0 0 8px var(--dc);
  flex-shrink: 0;
}
.source-name { color: var(--op-fs); white-space: nowrap; }
.source-bar-wrap {
  height: 4px;
  background: rgba(255,255,255,0.08);
  border-radius: 999px;
  overflow: hidden;
}
.source-bar {
  display: block; height: 100%; border-radius: 999px;
  box-shadow: 0 0 6px currentColor;
}
.source-pct { color: var(--op-warn); text-align: right; }
.source-cnt { color: var(--op-fm); text-align: right; }

/* ═══════════════════════════════
   9. 传播影响力（ECharts）
════════════════════════════════ */
.panel-chart {
  width: 100%; height: 100%; min-height: 88px;
}

/* ═══════════════════════════════
   10. 产业动态摘要
════════════════════════════════ */
.brief-body {
  display: flex;
  gap: 12px;
  height: 100%;
  align-items: flex-start;
  padding-top: 6px;
}
.brief-icon {
  position: relative;
  width: 40px; height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.brief-icon-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid var(--op-primary);
  opacity: 0.7;
  animation: ringPulse 2.6s ease-in-out infinite;
}
.brief-icon-core {
  width: 14px; height: 14px;
  border-radius: 50%;
  background: var(--op-primary);
  box-shadow: 0 0 14px var(--op-primary);
}
@keyframes ringPulse {
  0%,100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.25); opacity: 0.2; }
}
.brief-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.brief-lead {
  margin: 0;
  color: var(--op-fs);
  font-size: 12px;
  line-height: 1.75;
}
.brief-sub {
  color: var(--op-ft);
  opacity: 0.94;
}
.brief-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.brief-tag {
  padding: 3px 9px;
  color: var(--op-fs);
  font-size: 10px;
  background: color-mix(in srgb, var(--op-sec) 22%, transparent);
  border: 1px solid var(--op-ls);
  border-radius: 999px;
}

/* ═══════════════════════════════
   11. 舆情情感对比（蝴蝶图）
════════════════════════════════ */
.sc-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100% - 4px);
}

/* 中轴发光线 */
.sc-wrap::before {
  content: '';
  position: absolute;
  top: 56px;
  bottom: 32px;
  left: calc(50% - 1px);
  width: 2px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    color-mix(in srgb, var(--op-primary) 30%, transparent) 15%,
    color-mix(in srgb, var(--op-primary) 30%, transparent) 85%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 2;
  filter: blur(1px);
}

/* 顶部：总量对比 */
.sc-meta {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 2px 8px 0;
  flex-shrink: 0;
}
.scm-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}
.scm-label {
  font-size: 10px;
  color: var(--op-fm);
  letter-spacing: 0.06em;
}
.scm-count {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
  font-family: var(--font-display);
}
.scm-count em {
  font-size: 10px;
  font-style: normal;
  font-weight: 400;
  color: var(--op-fm);
  margin-left: 2px;
}
.scm-hist   .scm-count { color: var(--op-primary); text-shadow: 0 0 18px var(--op-primary); }
.scm-latest .scm-count { color: var(--op-sec);     text-shadow: 0 0 18px var(--op-sec); }
.scm-vs {
  font-size: 14px;
  font-weight: 900;
  color: var(--op-accent);
  letter-spacing: 0.14em;
  text-shadow: 0 0 18px var(--op-accent);
}

/* 主图 */
.sc-chart {
  flex: 1;
  min-height: 0;
}

/* 底部：delta 指标 */
.sc-delta-row {
  display: flex;
  justify-content: center;
  gap: 28px;
  padding: 4px 0 5px;
  flex-shrink: 0;
  border-top: 1px solid var(--op-ls);
}
.sc-delta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
}
.sdi-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--dc);
  box-shadow: 0 0 7px var(--dc);
  flex-shrink: 0;
}
.sdi-name { color: var(--op-ft); }
.sdi-delta { font-weight: 800; font-size: 12px; }
.sdi-delta.up   { color: #22c55e; text-shadow: 0 0 10px rgba(34,197,94,0.8); }
.sdi-delta.down { color: #ef4444; text-shadow: 0 0 10px rgba(239,68,68,0.8); }

/* ═══════════════════════════════
   12. 舆情预警信息（滚动 ticker）
════════════════════════════════ */
.ticker-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid var(--op-ls);
  overflow: hidden;
}
.ticker-head {
  display: grid;
  grid-template-columns: 92px 1fr 60px;
  align-items: center;
  height: 24px;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--op-sec) 42%, rgba(8,50,100,0.7));
  font-size: 11px;
  font-weight: 700;
  color: var(--op-fs);
}
.ticker-head span, .ticker-row span { padding: 0 8px; }
.ticker-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}
.ticker-track {
  display: flex;
  flex-direction: column;
  gap: 0;
  animation: tickerScroll 22s linear infinite;
}
.ticker-track.paused { animation-play-state: paused; }
.ticker-row {
  display: grid;
  grid-template-columns: 92px 1fr 60px;
  align-items: center;
  min-height: 32px;
  border-top: 1px solid var(--op-ls);
  font-size: 11px;
  background: rgba(6,28,64,0.4);
  transition: background 0.15s;
}
.ticker-row:hover { background: rgba(18,70,140,0.5); }
.ticker-cat {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 8px;
  height: 20px;
  min-width: 72px;
  padding: 0 10px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 999px;
  white-space: nowrap;
}
.ticker-cat.event  { color: #fff5f8; background: color-mix(in srgb, var(--op-err)  52%, transparent); }
.ticker-cat.policy { color: #fff8df; background: color-mix(in srgb, var(--op-warn) 44%, transparent); }
.ticker-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--op-fs); }
.ticker-time  { color: var(--op-fm); font-size: 10px; text-align: right; }
@keyframes tickerScroll {
  0%   { transform: translateY(0); }
  100% { transform: translateY(calc(-50% - 1px)); }
}


/* ═══════════════════════════════
   14. 热门关键词（双区）
════════════════════════════════ */

/* 面板主体：垂直 flex */
.kw-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0;
  overflow: visible;
}

/* ── 共用子标题栏 ── */
.kw-sub-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px 3px 6px;
  flex-shrink: 0;
}
.kw-gem {
  display: block;
  width: 6px; height: 6px;
  background: var(--op-primary);
  box-shadow: 0 0 9px var(--op-primary);
  transform: rotate(45deg);
  flex-shrink: 0;
  border-radius: 1px;
}
.kw-gem-ent {
  background: var(--op-accent);
  box-shadow: 0 0 9px var(--op-accent);
}
.kw-sub-bar span {
  font-size: 10px;
  color: var(--op-fm);
  letter-spacing: 0.09em;
  white-space: nowrap;
  opacity: 0.88;
}
.kw-bar-line {
  flex: 1;
  display: block;
  height: 1px;
  background: linear-gradient(90deg, var(--op-ls), transparent);
}

/* ── 分割横线 ── */
.kw-split {
  height: 1px;
  margin: 1px 6px 2px;
  background: linear-gradient(90deg, transparent, var(--op-line), transparent);
  flex-shrink: 0;
}

/* ── 上区：3D浮动云 ── */
.kw-top {
  flex: 1.15;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: visible;
}
.kw-cloud-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
/* 球面中心柔和辉光 */
.kw-cloud-wrap::before {
  content: '';
  position: absolute;
  left: 50%; top: 50%;
  width: 60%; height: 60%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--op-primary) 8%, transparent) 0%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
}

/* ── 下区：实体排行 ── */
.kw-bottom {
  flex: 0.85;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.kw-ent-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 1px 8px 4px;
  gap: 1px;
}
.kw-ent-row {
  flex: 1;
  display: grid;
  grid-template-columns: 20px 1.3fr 34px 1fr 26px;
  align-items: center;
  gap: 5px;
  min-height: 0;
  padding: 2px 4px 2px 8px;
  border-radius: 5px;
  cursor: default;
  position: relative;
  transition: background 0.15s ease;
}
/* 左侧高亮竖条 */
.kw-ent-row::before {
  content: '';
  position: absolute;
  left: 0; top: 18%; bottom: 18%;
  width: 2.5px;
  background: var(--ec);
  box-shadow: 0 0 7px var(--ec);
  border-radius: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.kw-ent-row:hover {
  background: color-mix(in srgb, var(--ec) 11%, rgba(4,18,38,0.52));
}
.kw-ent-row:hover::before { opacity: 1; }

/* 排名 */
.ker-rank {
  font-size: 9px;
  font-weight: 900;
  color: var(--ec);
  text-align: center;
  font-family: var(--font-display);
  opacity: 0.82;
  letter-spacing: 0.02em;
}
/* 名称 */
.ker-name {
  font-size: 11px;
  font-weight: 700;
  color: var(--op-fs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 类型徽章 */
.ker-badge {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  text-align: center;
  white-space: nowrap;
  line-height: 1.65;
}
.kbt-corp { color:#2ce9ff; background:rgba(44,233,255,0.12); border:1px solid rgba(44,233,255,0.28); }
.kbt-loc  { color:#46f7a8; background:rgba(70,247,168,0.12); border:1px solid rgba(70,247,168,0.28); }
.kbt-per  { color:#ffd24a; background:rgba(255,210,74,0.12);  border:1px solid rgba(255,210,74,0.28);  }
.kbt-org  { color:#ff8fc0; background:rgba(255,143,192,0.12); border:1px solid rgba(255,143,192,0.28); }
/* 热度条 */
.ker-bar-wrap {
  height: 3px;
  background: rgba(255,255,255,0.07);
  border-radius: 999px;
  overflow: hidden;
}
.ker-bar {
  display: block;
  height: 100%;
  background: var(--ec);
  border-radius: 999px;
  box-shadow: 0 0 5px var(--ec);
}
/* 数量 */
.ker-count {
  font-size: 9px;
  color: var(--op-fm);
  text-align: right;
  font-family: var(--font-display);
}

/* ── 球形旋转词云 sphere-word ── */
.sphere-word {
  position: absolute;
  transform: translate(-50%, -50%);
  font-weight: 800;
  white-space: nowrap;
  cursor: default;
  user-select: none;
  letter-spacing: 0.07em;
  z-index: 1;
  transition: transform 0.14s ease;
  /* 避免 transition 干扰帧动画的 opacity / filter */
}
.sphere-word:hover {
  opacity: 1 !important;
  filter: none !important;
  transform: translate(-50%, -50%) scale(1.22) !important;
  z-index: 100 !important;
  cursor: pointer;
}
/* 悬停时显示数量提示气泡 */
.sphere-word::after {
  content: attr(data-tip);
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  font-weight: 400;
  color: #c8eeff;
  background: rgba(4, 18, 38, 0.92);
  border: 1px solid rgba(136, 211, 255, 0.28);
  padding: 2px 9px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.14s ease;
  letter-spacing: 0.04em;
  z-index: 200;
}
.sphere-word:hover::after { opacity: 1; }
/* ═══════════════════════════════
   15. 动画
════════════════════════════════ */
@keyframes ringPulse {
  0%,100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.25); opacity: 0.2; }
}

/* ═══════════════════════════════
   16. 响应式
════════════════════════════════ */
@media (max-width: 1240px) {
  .opinion-screen {
    height: auto;
  }
  .screen-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    grid-template-areas:
      "header"
      "map"
      "ticker"
      "overview"
      "source"
      "brief"
      "technology"
      "trend";
    height: auto;
    min-height: unset;
  }
  .panel { min-height: 210px; overflow: hidden; }
  .technology-panel { overflow: hidden; }
  .sc-wrap::before { display: none; }
  .ticker-shell { min-height: 160px; }
}
@media (max-width: 720px) {
  .opinion-screen { border-radius: 10px; }
  .screen-grid { padding: 0 8px 8px; gap: 8px; }
  .header-title-wrap { min-width: 0; clip-path: none; }
  .header-title { font-size: 16px; letter-spacing: 0.04em; }
  .panel-title {
    left: 6px;
    right: 6px;
  }
  .ticker-head, .ticker-row { grid-template-columns: 82px 1fr 52px 40px; }
}
</style>
