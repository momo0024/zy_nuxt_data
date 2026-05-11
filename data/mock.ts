// ================================================================
// 智知云 · Mock 数据中心
// ================================================================

// ---- 文档类型（15类）----
export const CATEGORIES = [
  { key: 'paper', name: '学术论文', abbr: '论', desc: '学术论文与科研成果' },
  { key: 'research_report', name: '研究报告', abbr: '研', desc: '行业分析与市场研究' },
  { key: 'annual_report', name: '年度报告', abbr: '年', desc: '企业年度财务及运营报告' },
  { key: 'quarterly_report', name: '季度报告', abbr: '季', desc: '企业季度财务及业绩报告' },
  { key: 'disclosure', name: '信息披露', abbr: '披', desc: '上市公司公告及披露文件' },
  { key: 'news', name: '新闻', abbr: '新', desc: '财经及行业新闻资讯' },
  { key: 'information', name: '资讯', abbr: '讯', desc: '市场动态与行业资讯' },
  { key: 'policy', name: '政策文件', abbr: '政', desc: '政府政策法规与通知' },
  { key: 'regulation', name: '制度规范', abbr: '规', desc: '内部制度、标准与规范' },
  { key: 'faq', name: '常见问题', abbr: 'F', desc: '常见问题解答与知识问答' },
  { key: 'qa', name: '知识问答', abbr: 'Q', desc: '结构化知识问答库' },
  { key: 'product_doc', name: '产品说明', abbr: '品', desc: '产品介绍与功能说明文档' },
  { key: 'user_manual', name: '操作手册', abbr: '手', desc: '产品使用与操作指南' },
  { key: 'technical_doc', name: '技术文档', abbr: '技', desc: '技术规格与接口文档' },
  { key: 'other', name: '其他', abbr: '他', desc: '未分类的知识文档' }
]

// ---- 知识库（4个）----
export const KNOWLEDGE_BASES = [
  {
    id: 'kb-market',
    name: '市场研究库',
    categories: ['paper', 'research_report', 'annual_report', 'quarterly_report', 'news', 'information'],
    docCount: 612,
    desc: '聚焦投研与市场分析'
  },
  {
    id: 'kb-policy',
    name: '制度合规库',
    categories: ['policy', 'regulation', 'faq', 'qa'],
    docCount: 214,
    desc: '政策法规与内控制度'
  },
  {
    id: 'kb-product',
    name: '产品资料库',
    categories: ['product_doc', 'user_manual', 'technical_doc', 'faq', 'information'],
    docCount: 351,
    desc: '产品全周期文档体系'
  },
  {
    id: 'kb-public',
    name: '公开资讯库',
    categories: ['news', 'information', 'annual_report', 'quarterly_report', 'disclosure'],
    docCount: 596,
    desc: '公开市场信息与资讯'
  }
]

// ---- 用户角色权限 ----
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'paper', 'research_report', 'annual_report', 'quarterly_report', 'disclosure',
    'news', 'information', 'policy', 'regulation', 'faq', 'qa',
    'product_doc', 'user_manual', 'technical_doc', 'other'
  ],
  analyst: [
    'paper', 'research_report', 'annual_report', 'quarterly_report', 'disclosure',
    'news', 'information', 'faq', 'qa', 'other'
  ],
  operations: [
    'news', 'information', 'policy', 'regulation', 'faq', 'qa',
    'product_doc', 'user_manual', 'technical_doc', 'other'
  ],
  user: ['news', 'information', 'faq', 'other']
}

// ---- Mock 账户 ----
export const MOCK_USERS = [
  {
    id: 'u001',
    username: 'zhangyuan',
    password: '123456',
    name: '张媛',
    role: 'admin',
    roleName: '知识管理员',
    tenant: '集团知识租户',
    avatar: 'ZY'
  },
  {
    id: 'u002',
    username: 'linan',
    password: '123456',
    name: '李楠',
    role: 'analyst',
    roleName: '投研分析师',
    tenant: '投研事业部',
    avatar: 'LN'
  },
  {
    id: 'u003',
    username: 'sunlan',
    password: '123456',
    name: '孙岚',
    role: 'operations',
    roleName: '运营经理',
    tenant: '运营管理部',
    avatar: 'SL'
  }
]

// ---- 舆情分析数据 ----
export const SENTIMENT_DATA = {
  updateTime: '2026-05-10 18:00',
  historical: { positive: 45, neutral: 35, negative: 20 },
  latest: { positive: 52, neutral: 30, negative: 18 },
  trend: { positive: 'up', neutral: 'down', negative: 'down' },
  articles: {
    positive: [
      { id: 'a1', title: '头部券商一季度业绩全面回暖，投行业务同比增长38%', source: '证券时报', date: '2026-05-09', score: 0.91 },
      { id: 'a2', title: '新能源汽车出口再创新高，供应链竞争力显著提升', source: '经济日报', date: '2026-05-08', score: 0.87 },
      { id: 'a3', title: '跨境电商平台Q1营收超预期，东南亚市场持续放量', source: '财经周报', date: '2026-05-07', score: 0.83 }
    ],
    neutral: [
      { id: 'a4', title: '央行发布金融稳定报告，强调防范系统性风险', source: '中国证券报', date: '2026-05-09', score: 0.65 },
      { id: 'a5', title: '半导体行业周期调整接近尾声，去库存进展符合预期', source: '电子工程专辑', date: '2026-05-08', score: 0.61 },
      { id: 'a6', title: '多家银行调整存款利率，市场预期逐步修复', source: '金融时报', date: '2026-05-07', score: 0.58 }
    ],
    negative: [
      { id: 'a7', title: '部分中小房企资金链紧张，债务重组进入关键期', source: '21世纪经济报道', date: '2026-05-09', score: 0.22 },
      { id: 'a8', title: '消费贷不良率小幅上升，金融机构风控压力增加', source: '银行家', date: '2026-05-08', score: 0.28 },
      { id: 'a9', title: '出口订单环比下滑，部分出口企业面临承压', source: '贸易观察', date: '2026-05-06', score: 0.32 }
    ]
  }
}

// ---- 图表数据 ----
export const MONTHLY_IMPORTS = [
  { month: '2025-11', count: 45 },
  { month: '2025-12', count: 62 },
  { month: '2026-01', count: 58 },
  { month: '2026-02', count: 71 },
  { month: '2026-03', count: 89 },
  { month: '2026-04', count: 103 },
  { month: '2026-05', count: 38 }
]

export const DAILY_QUERIES = [
  { date: '05-02', count: 64 },
  { date: '05-03', count: 58 },
  { date: '05-04', count: 72 },
  { date: '05-05', count: 41 },
  { date: '05-06', count: 87 },
  { date: '05-07', count: 95 },
  { date: '05-08', count: 38 }
]

export const DOC_TYPE_DIST = [
  { name: '研究报告', value: 182 },
  { name: '年度报告', value: 134 },
  { name: '新闻', value: 112 },
  { name: '资讯', value: 98 },
  { name: '政策文件', value: 76 },
  { name: '其他', value: 124 }
]

export const KB_DOC_DIST = [
  { name: '市场研究库', value: 612 },
  { name: '公开资讯库', value: 596 },
  { name: '产品资料库', value: 351 },
  { name: '制度合规库', value: 214 }
]

// ---- 文档类型卡片统计 ----
export const CATEGORY_STATS: Record<string, { visible: number; total: number; updatedAt: string }> = {
  paper: { visible: 48, total: 56, updatedAt: '2026-05-08' },
  research_report: { visible: 182, total: 182, updatedAt: '2026-05-10' },
  annual_report: { visible: 134, total: 134, updatedAt: '2026-05-09' },
  quarterly_report: { visible: 98, total: 98, updatedAt: '2026-05-07' },
  disclosure: { visible: 0, total: 76, updatedAt: '2026-05-06' },
  news: { visible: 112, total: 112, updatedAt: '2026-05-10' },
  information: { visible: 98, total: 98, updatedAt: '2026-05-10' },
  policy: { visible: 0, total: 64, updatedAt: '2026-05-05' },
  regulation: { visible: 0, total: 42, updatedAt: '2026-05-03' },
  faq: { visible: 58, total: 58, updatedAt: '2026-05-09' },
  qa: { visible: 34, total: 34, updatedAt: '2026-05-08' },
  product_doc: { visible: 0, total: 88, updatedAt: '2026-05-07' },
  user_manual: { visible: 0, total: 44, updatedAt: '2026-05-06' },
  technical_doc: { visible: 0, total: 38, updatedAt: '2026-05-05' },
  other: { visible: 24, total: 24, updatedAt: '2026-05-04' }
}

// ---- 检索文档（30条）----
export const RETRIEVE_DOCS = [
  {
    id: 'd001', title: '2025年新能源汽车行业深度研究报告', category: 'research_report', categoryName: '研究报告',
    kb: 'kb-market', kbName: '市场研究库', source: '国泰君安证券', score: 0.97,
    updatedAt: '2026-05-08', tags: ['新能源', '汽车', '行业研究'],
    summary: '本报告系统梳理2025年新能源汽车行业发展动态，重点分析电池技术突破、供应链重构与竞争格局演变，并对主要整车厂及供应商进行深度估值分析。'
  },
  {
    id: 'd002', title: '人工智能大模型商业化落地白皮书', category: 'research_report', categoryName: '研究报告',
    kb: 'kb-market', kbName: '市场研究库', source: '中金公司', score: 0.95,
    updatedAt: '2026-05-07', tags: ['AI', '大模型', '商业化'],
    summary: '深度解析AI大模型在金融、医疗、教育等垂直领域的商业落地路径，评估技术成熟度与市场规模，提供企业级部署最佳实践建议。'
  },
  {
    id: 'd003', title: '某科技集团2025年度财务报告', category: 'annual_report', categoryName: '年度报告',
    kb: 'kb-market', kbName: '市场研究库', source: '官方年报', score: 0.93,
    updatedAt: '2026-04-30', tags: ['年报', '财务', '科技'],
    summary: '2025年度营收同比增长28.6%，净利润增幅36.2%，海外市场贡献率首次超过40%。研发投入占比提升至15.8%，创历史新高。'
  },
  {
    id: 'd004', title: '全球半导体行业周期性分析与投资机会', category: 'research_report', categoryName: '研究报告',
    kb: 'kb-market', kbName: '市场研究库', source: '申万宏源', score: 0.91,
    updatedAt: '2026-05-06', tags: ['半导体', '周期', '投资'],
    summary: '从历史周期规律出发，分析当前半导体行业去库存进度，重点关注存储芯片、设备材料领域的复苏节奏与核心标的。'
  },
  {
    id: 'd005', title: '关于进一步加强上市公司信息披露的监管指引', category: 'policy', categoryName: '政策文件',
    kb: 'kb-policy', kbName: '制度合规库', source: '证监会', score: 0.89,
    updatedAt: '2026-04-15', tags: ['监管', '信披', '政策'],
    summary: '明确上市公司定期报告、临时公告的披露标准与时效要求，强化重大事项预披露机制，完善信息披露评价体系。'
  },
  {
    id: 'd006', title: '智能投顾系统API技术文档 v3.2', category: 'technical_doc', categoryName: '技术文档',
    kb: 'kb-product', kbName: '产品资料库', source: '技术部', score: 0.87,
    updatedAt: '2026-05-01', tags: ['API', '智能投顾', '技术'],
    summary: '详细描述智能投顾系统REST API接口规范，包含用户画像接口、组合推荐接口、风险评估接口的请求参数、返回格式与错误码说明。'
  },
  {
    id: 'd007', title: '碳中和政策框架下的绿色金融发展路径', category: 'research_report', categoryName: '研究报告',
    kb: 'kb-market', kbName: '市场研究库', source: '兴业研究', score: 0.85,
    updatedAt: '2026-05-05', tags: ['碳中和', '绿色金融', 'ESG'],
    summary: '系统梳理全球碳中和政策体系，深入分析绿色债券、ESG投资、碳交易市场的发展现状与机遇，为金融机构绿色转型提供路径参考。'
  },
  {
    id: 'd008', title: '2026年Q1宏观经济季报', category: 'quarterly_report', categoryName: '季度报告',
    kb: 'kb-market', kbName: '市场研究库', source: '招商证券', score: 0.83,
    updatedAt: '2026-04-20', tags: ['宏观', '季报', '经济'],
    summary: '2026年Q1 GDP同比增长5.2%，消费、投资、出口三驾马车均有所改善。通胀温和，货币政策维持稳健，财政政策发力加码。'
  },
  {
    id: 'd009', title: '知识管理系统用户操作手册', category: 'user_manual', categoryName: '操作手册',
    kb: 'kb-product', kbName: '产品资料库', source: '产品部', score: 0.81,
    updatedAt: '2026-04-10', tags: ['操作手册', '用户指南'],
    summary: '全面介绍智知云系统的使用方法，包括文档导入、知识检索、数据查询、AI助手等核心功能的操作步骤与注意事项。'
  },
  {
    id: 'd010', title: '机构投资者行为与市场效率研究', category: 'paper', categoryName: '学术论文',
    kb: 'kb-market', kbName: '市场研究库', source: '清华大学金融学院', score: 0.79,
    updatedAt: '2026-03-28', tags: ['机构投资者', '市场效率', '学术'],
    summary: '基于2010-2025年A股市场数据，实证研究机构投资者持股比例对市场价格发现效率的影响，发现持股集中度与信息不对称程度显著负相关。'
  },
  {
    id: 'd011', title: '医疗健康行业2026年投资策略', category: 'research_report', categoryName: '研究报告',
    kb: 'kb-market', kbName: '市场研究库', source: '东方证券', score: 0.77,
    updatedAt: '2026-05-03', tags: ['医疗', '健康', '投资策略'],
    summary: '分析2026年医疗健康行业政策环境、技术趋势和市场空间，重点推荐创新药、医疗器械国产替代、数字健康三大赛道的核心投资机会。'
  },
  {
    id: 'd012', title: '金融风控合规管理制度', category: 'regulation', categoryName: '制度规范',
    kb: 'kb-policy', kbName: '制度合规库', source: '合规部', score: 0.75,
    updatedAt: '2026-02-15', tags: ['风控', '合规', '制度'],
    summary: '明确金融业务风险识别、评估、监控与处置的完整流程，规定各部门合规责任边界，建立全面风险管理的制度体系。'
  },
  {
    id: 'd013', title: '消费电子行业需求复苏跟踪报告', category: 'research_report', categoryName: '研究报告',
    kb: 'kb-market', kbName: '市场研究库', source: '海通证券', score: 0.73,
    updatedAt: '2026-05-09', tags: ['消费电子', '需求', '复苏'],
    summary: '追踪消费电子终端需求回暖进度，重点关注智能手机、PC、穿戴设备出货量改善情况，评估供应链各环节库存消化节奏。'
  },
  {
    id: 'd014', title: '系统常见问题FAQ汇总 v5', category: 'faq', categoryName: '常见问题',
    kb: 'kb-product', kbName: '产品资料库', source: '客服部', score: 0.71,
    updatedAt: '2026-05-07', tags: ['FAQ', '常见问题'],
    summary: '汇总用户在使用知识管理平台过程中的100个高频问题，涵盖登录、权限、文档导入、检索、AI助手等各模块的典型疑问与解答。'
  },
  {
    id: 'd015', title: '房地产行业政策解读与市场展望', category: 'research_report', categoryName: '研究报告',
    kb: 'kb-market', kbName: '市场研究库', source: '光大证券', score: 0.69,
    updatedAt: '2026-05-04', tags: ['房地产', '政策', '市场'],
    summary: '深度解读近期房地产支持政策的实施效果，分析一二线城市去库存进度，判断行业筑底节奏，评估典型房企的流动性风险与修复路径。'
  },
  {
    id: 'd016', title: '企业知识管理最佳实践问答集', category: 'qa', categoryName: '知识问答',
    kb: 'kb-policy', kbName: '制度合规库', source: '知识管理部', score: 0.67,
    updatedAt: '2026-04-25', tags: ['知识管理', '最佳实践'],
    summary: '整理企业知识管理领域的50个核心问题与权威解答，涵盖知识库建设规划、文档分类体系、知识运营机制、AI赋能路径等关键话题。'
  },
  {
    id: 'd017', title: '数字化转型投入产出效益评估模型', category: 'research_report', categoryName: '研究报告',
    kb: 'kb-market', kbName: '市场研究库', source: '德勤咨询', score: 0.65,
    updatedAt: '2026-04-18', tags: ['数字化', '转型', '效益评估'],
    summary: '构建企业数字化转型ROI评估框架，从效率提升、成本降低、收入增长、风险优化四个维度量化数字化投资的综合回报，提供评估工具集。'
  },
  {
    id: 'd018', title: '上市公司2026年三月重大事项公告汇编', category: 'disclosure', categoryName: '信息披露',
    kb: 'kb-public', kbName: '公开资讯库', source: '交易所', score: 0.63,
    updatedAt: '2026-04-01', tags: ['公告', '信披', '重大事项'],
    summary: '汇编2026年3月全市场上市公司重大事项公告，包含并购重组、股权激励、重大合同签署、高管变动等关键信息的结构化摘要。'
  },
  {
    id: 'd019', title: '人民币国际化进程与跨境支付发展报告', category: 'research_report', categoryName: '研究报告',
    kb: 'kb-market', kbName: '市场研究库', source: '中国银行研究院', score: 0.61,
    updatedAt: '2026-04-12', tags: ['人民币', '国际化', '跨境支付'],
    summary: '系统回顾人民币国际化的政策演进与市场进展，重点分析CIPS系统扩容、数字人民币跨境应用、双边货币协议等最新进展与影响。'
  },
  {
    id: 'd020', title: '5G-A与物联网融合发展产业资讯', category: 'information', categoryName: '资讯',
    kb: 'kb-public', kbName: '公开资讯库', source: '通信世界', score: 0.59,
    updatedAt: '2026-05-08', tags: ['5G', '物联网', '产业'],
    summary: '追踪5G-Advanced技术商用进展与物联网产业融合趋势，关注智慧城市、工业互联网、车联网等重点应用场景的落地案例与市场动态。'
  }
]

// ---- 数据搜索表格数据 ----

// doc_files
export const DOC_FILES = Array.from({ length: 30 }, (_, i) => {
  const categories = ['research_report', 'annual_report', 'news', 'policy', 'faq', 'technical_doc', 'paper', 'quarterly_report']
  const fileTypes = ['PDF', 'DOCX', 'TXT', 'XLSX', 'MD']
  const statuses = ['已解析', '解析中', '排队中']
  const kbs = ['kb-market', 'kb-policy', 'kb-product', 'kb-public']
  const owners = ['张媛', '李楠', '孙岚', '王晨', '赵磊']
  const cat = categories[i % categories.length]
  const status = statuses[i % 3]
  return {
    id: `df${String(i + 1).padStart(4, '0')}`,
    title: [
      '2025新能源汽车深度报告', 'AI大模型商业化白皮书', '科技集团2025年报',
      '半导体周期分析', '碳中和绿色金融路径', '宏观经济季报Q1',
      '金融风控合规制度', '医疗行业投资策略', '消费电子需求报告', '数字化转型评估',
      '房地产政策解读', '人民币国际化报告', '5G产业融合资讯', '上市公司公告汇编',
      '智能投顾API文档', '知识管理FAQ汇总', '学术论文-市场效率', '操作手册v5',
      '知识问答集', '季度财报分析', '年度审计报告', '供应链优化方案',
      '客户服务规范手册', '内控合规评估报告', '产品需求说明书', '接口设计规范',
      '用户行为分析报告', '投资组合策略文档', '风险评估模型说明', '数据治理规范'
    ][i],
    category_key: cat,
    file_type: fileTypes[i % fileTypes.length],
    file_size: Math.floor(120 + Math.random() * 4000),
    kb_id: kbs[i % kbs.length],
    owner: owners[i % owners.length],
    status,
    chunk_size: [200, 500, 800, 1200][i % 4],
    created_at: `2026-0${(i % 5) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
    updated_at: `2026-05-${String((i % 10) + 1).padStart(2, '0')}`
  }
})

// doc_chunks
export const DOC_CHUNKS = Array.from({ length: 30 }, (_, i) => ({
  id: `ck${String(i + 1).padStart(4, '0')}`,
  file_id: `df${String((i % 20) + 1).padStart(4, '0')}`,
  chunk_index: i % 15,
  content_len: Math.floor(150 + Math.random() * 600),
  vector_id: `vec-${Math.random().toString(36).slice(2, 10)}`,
  score: +(0.6 + Math.random() * 0.38).toFixed(3),
  hit_count: Math.floor(Math.random() * 120),
  created_at: `2026-0${(i % 5) + 1}-${String((i % 28) + 1).padStart(2, '0')}`
}))

// query_logs
export const QUERY_LOGS = Array.from({ length: 30 }, (_, i) => {
  const queries = [
    '新能源汽车市场份额', '2025年度业绩', '半导体去库存', '绿色金融政策',
    'AI大模型应用', '房地产政策', '人民币国际化', '5G商用进展',
    '碳中和路径', '机构投资者行为', '消费复苏', '风险管理制度',
    'FAQ系统功能', '数字化转型ROI', '季报解读', '上市公告',
    '操作手册', '知识管理最佳实践', '智能投顾API', '数据分析'
  ]
  const cats = ['research_report', 'annual_report', 'news', 'policy', 'faq', 'paper']
  return {
    id: `ql${String(i + 1).padStart(4, '0')}`,
    user_id: ['u001', 'u002', 'u003'][i % 3],
    query_text: queries[i % queries.length],
    category: cats[i % cats.length],
    result_count: Math.floor(1 + Math.random() * 25),
    top_score: +(0.65 + Math.random() * 0.33).toFixed(3),
    duration_ms: Math.floor(80 + Math.random() * 400),
    created_at: `2026-05-${String((i % 10) + 1).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:${String(i * 3 % 60).padStart(2, '0')}:00`
  }
})

// kb_members
export const KB_MEMBERS = [
  { id: 'km001', kb_id: 'kb-market', kb_name: '市场研究库', user_id: 'u001', user_name: '张媛', role: 'admin', granted_at: '2025-10-01', granted_by: '系统' },
  { id: 'km002', kb_id: 'kb-market', kb_name: '市场研究库', user_id: 'u002', user_name: '李楠', role: 'reader', granted_at: '2025-10-05', granted_by: '张媛' },
  { id: 'km003', kb_id: 'kb-policy', kb_name: '制度合规库', user_id: 'u001', user_name: '张媛', role: 'admin', granted_at: '2025-10-01', granted_by: '系统' },
  { id: 'km004', kb_id: 'kb-policy', kb_name: '制度合规库', user_id: 'u003', user_name: '孙岚', role: 'editor', granted_at: '2025-11-10', granted_by: '张媛' },
  { id: 'km005', kb_id: 'kb-product', kb_name: '产品资料库', user_id: 'u001', user_name: '张媛', role: 'admin', granted_at: '2025-10-01', granted_by: '系统' },
  { id: 'km006', kb_id: 'kb-product', kb_name: '产品资料库', user_id: 'u003', user_name: '孙岚', role: 'editor', granted_at: '2025-11-15', granted_by: '张媛' },
  { id: 'km007', kb_id: 'kb-public', kb_name: '公开资讯库', user_id: 'u001', user_name: '张媛', role: 'admin', granted_at: '2025-10-01', granted_by: '系统' },
  { id: 'km008', kb_id: 'kb-public', kb_name: '公开资讯库', user_id: 'u002', user_name: '李楠', role: 'reader', granted_at: '2025-12-01', granted_by: '张媛' },
  { id: 'km009', kb_id: 'kb-public', kb_name: '公开资讯库', user_id: 'u003', user_name: '孙岚', role: 'reader', granted_at: '2025-12-01', granted_by: '张媛' },
  { id: 'km010', kb_id: 'kb-market', kb_name: '市场研究库', user_id: 'u003', user_name: '孙岚', role: 'reader', granted_at: '2026-01-08', granted_by: '张媛' },
  { id: 'km011', kb_id: 'kb-policy', kb_name: '制度合规库', user_id: 'u002', user_name: '李楠', role: 'reader', granted_at: '2026-02-14', granted_by: '张媛' },
  { id: 'km012', kb_id: 'kb-product', kb_name: '产品资料库', user_id: 'u002', user_name: '李楠', role: 'reader', granted_at: '2026-03-01', granted_by: '孙岚' }
]

// import_tasks
export const IMPORT_TASKS_INIT = [
  { id: 'it001', file_name: '2025新能源汽车深度报告.pdf', category: '研究报告', file_type: 'PDF', chunk_size: 500, status: '已解析', chunk_count: 42, vector_count: 42, submitter: '张媛', submitted_at: '2026-05-08 09:10', finished_at: '2026-05-08 09:18' },
  { id: 'it002', file_name: 'AI大模型白皮书.docx', category: '研究报告', file_type: 'DOCX', chunk_size: 500, status: '已解析', chunk_count: 38, vector_count: 38, submitter: '李楠', submitted_at: '2026-05-08 10:20', finished_at: '2026-05-08 10:27' },
  { id: 'it003', file_name: '科技集团2025年报.pdf', category: '年度报告', file_type: 'PDF', chunk_size: 800, status: '已解析', chunk_count: 86, vector_count: 86, submitter: '张媛', submitted_at: '2026-05-07 14:05', finished_at: '2026-05-07 14:22' },
  { id: 'it004', file_name: '半导体行业周期分析.pdf', category: '研究报告', file_type: 'PDF', chunk_size: 500, status: '已解析', chunk_count: 31, vector_count: 31, submitter: '李楠', submitted_at: '2026-05-07 16:30', finished_at: '2026-05-07 16:37' },
  { id: 'it005', file_name: '金融风控合规制度v2.docx', category: '制度规范', file_type: 'DOCX', chunk_size: 200, status: '已解析', chunk_count: 58, vector_count: 58, submitter: '孙岚', submitted_at: '2026-05-06 11:00', finished_at: '2026-05-06 11:09' },
  { id: 'it006', file_name: '医疗行业投资策略2026.pdf', category: '研究报告', file_type: 'PDF', chunk_size: 500, status: '解析中', chunk_count: 18, vector_count: 15, submitter: '李楠', submitted_at: '2026-05-10 14:10', finished_at: null },
  { id: 'it007', file_name: '消费电子需求复苏报告.pdf', category: '研究报告', file_type: 'PDF', chunk_size: 500, status: '排队中', chunk_count: 0, vector_count: 0, submitter: '李楠', submitted_at: '2026-05-10 15:30', finished_at: null },
  { id: 'it008', file_name: '系统FAQ汇总v5.md', category: '常见问题', file_type: 'MD', chunk_size: 200, status: '已解析', chunk_count: 104, vector_count: 104, submitter: '孙岚', submitted_at: '2026-05-06 09:00', finished_at: '2026-05-06 09:16' },
  { id: 'it009', file_name: '碳中和绿色金融报告.pdf', category: '研究报告', file_type: 'PDF', chunk_size: 800, status: '已解析', chunk_count: 45, vector_count: 45, submitter: '张媛', submitted_at: '2026-05-05 13:00', finished_at: '2026-05-05 13:11' },
  { id: 'it010', file_name: '智能投顾API文档v3.2.md', category: '技术文档', file_type: 'MD', chunk_size: 200, status: '排队中', chunk_count: 0, vector_count: 0, submitter: '孙岚', submitted_at: '2026-05-10 16:00', finished_at: null },
  { id: 'it011', file_name: '人民币国际化研究.pdf', category: '研究报告', file_type: 'PDF', chunk_size: 500, status: '已解析', chunk_count: 52, vector_count: 52, submitter: '李楠', submitted_at: '2026-05-04 10:00', finished_at: '2026-05-04 10:12' },
  { id: 'it012', file_name: '数字化转型ROI评估.xlsx', category: '其他', file_type: 'XLSX', chunk_size: 1200, status: '解析中', chunk_count: 8, vector_count: 5, submitter: '张媛', submitted_at: '2026-05-10 13:00', finished_at: null }
]
