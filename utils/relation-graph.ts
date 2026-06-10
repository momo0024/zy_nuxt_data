/**
 * 关联关系路径解析器 & ECharts 关系图配置构建
 *
 * 数据格式: "EntityA --Role--> EntityB" 或 "EntityA <--Role-- EntityB"
 *   --> 表示从左到右的关系
 *   <-- 表示从右到左的关系
 * 支持链式: "A <--r1-- B --r2--> C"
 */

export interface RelationNode {
  id: string
  name: string
}

export interface RelationEdge {
  source: string
  target: string
  label: string
}

export interface RelationGraph {
  nodes: RelationNode[]
  edges: RelationEdge[]
}

/** 节点配色 */
const NODE_COLORS = [
  '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
  '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#48b8d0',
]

function getNodeColor(index: number): string {
  return NODE_COLORS[index % NODE_COLORS.length]
}

/**
 * 解析单条关联路径字符串为节点和边
 * 格式示例: "武汉佑辉投资有限公司 --持股44.51%--> 四方光电股份有限公司"
 *          "武汉佑辉投资有限公司 <--持股95.0%-- 熊友辉 --董事长、经理--> 四方光电股份有限公司"
 */
export function parseRelationPath(text: string): RelationGraph {
  const nodeMap = new Map<string, number>()
  const nodes: RelationNode[] = []
  const edges: RelationEdge[] = []

  function getOrCreateNode(name: string): string {
    const trimmed = name.trim()
    if (!trimmed) return ''
    if (!nodeMap.has(trimmed)) {
      const id = `n${nodeMap.size}`
      nodeMap.set(trimmed, nodeMap.size)
      nodes.push({ id, name: trimmed })
    }
    return `n${nodeMap.get(trimmed)!}`
  }

  const trimmed = text.trim()
  if (!trimmed) return { nodes, edges }

  // 找到所有箭头位置
  interface ArrowPos {
    start: number // 箭头起始位置
    direction: 'right' | 'left'
  }
  const arrows: ArrowPos[] = []
  let searchFrom = 0
  while (searchFrom < trimmed.length) {
    const rIdx = trimmed.indexOf('-->', searchFrom)
    const lIdx = trimmed.indexOf('<--', searchFrom)
    if (rIdx === -1 && lIdx === -1) break

    if (rIdx >= 0 && (lIdx < 0 || rIdx <= lIdx)) {
      arrows.push({ start: rIdx, direction: 'right' })
      searchFrom = rIdx + 3
    } else {
      arrows.push({ start: lIdx!, direction: 'left' })
      searchFrom = lIdx! + 3
    }
  }

  if (arrows.length === 0) {
    getOrCreateNode(trimmed)
    return { nodes, edges }
  }

  let segmentStart = 0

  for (let i = 0; i < arrows.length; i++) {
    const arrow = arrows[i]
    const nextArrowStart = i + 1 < arrows.length ? arrows[i + 1].start : trimmed.length

    if (arrow.direction === 'right') {
      // 格式: "EntityA --Role--> EntityB..."
      const beforeArrow = trimmed.substring(segmentStart, arrow.start)
      const lastDashIdx = beforeArrow.lastIndexOf('--')
      if (lastDashIdx < 0) continue

      const entityA = beforeArrow.substring(0, lastDashIdx).trim()
      const role = beforeArrow.substring(lastDashIdx + 2).trim()

      // 箭头后面的文本，提取 EntityB（截取到下一个 --或结束）
      const afterArrow = trimmed.substring(arrow.start + 3, nextArrowStart).trim()
      let entityB = afterArrow
      // 如果后面还有箭头，需要截断 entityB 到下一个 --之前
      if (i + 1 < arrows.length) {
        const nextDash = entityB.indexOf('--')
        if (nextDash >= 0) {
          entityB = entityB.substring(0, nextDash).trim()
        }
      }

      if (entityA && entityB) {
        const sourceId = getOrCreateNode(entityA)
        const targetId = getOrCreateNode(entityB)
        edges.push({ source: sourceId, target: targetId, label: role })
      }

      // segmentStart 指向 EntityB 的起始位置，供后续箭头使用
      const afterRaw = trimmed.substring(arrow.start + 3, nextArrowStart)
      const entityBIdx = afterRaw.indexOf(entityB)
      segmentStart = arrow.start + 3 + (entityBIdx >= 0 ? entityBIdx : 0)
    } else {
      // 格式: "EntityA <--Role-- EntityB..."
      const entityA = trimmed.substring(segmentStart, arrow.start).trim()

      // 箭头后面的文本: "Role-- EntityB..."
      const afterArrow = trimmed.substring(arrow.start + 3, nextArrowStart)
      const firstDashIdx = afterArrow.indexOf('--')
      let role: string
      let entityB: string

      if (firstDashIdx >= 0) {
        role = afterArrow.substring(0, firstDashIdx).trim()
        const afterRole = afterArrow.substring(firstDashIdx + 2)
        // EntityB 可能后面还跟着 --NextRole
        const nextDashInAfter = afterRole.indexOf('--')
        if (nextDashInAfter >= 0) {
          entityB = afterRole.substring(0, nextDashInAfter).trim()
        } else {
          entityB = afterRole.trim()
        }
      } else {
        role = ''
        entityB = afterArrow.trim()
      }

      if (entityA && entityB) {
        // <-- 表示从右到左，即 entityB -> entityA
        const sourceId = getOrCreateNode(entityB)
        const targetId = getOrCreateNode(entityA)
        edges.push({ source: sourceId, target: targetId, label: role })
      }

      // segmentStart 指向 EntityB 的起始位置，供后续箭头使用
      const afterRaw = trimmed.substring(arrow.start + 3, nextArrowStart)
      const entityBIdx = afterRaw.indexOf(entityB)
      segmentStart = arrow.start + 3 + (entityBIdx >= 0 ? entityBIdx : 0)
    }
  }

  return { nodes, edges }
}

/**
 * 合并多条关联路径图为一个图
 */
export function mergeRelationGraphs(graphs: RelationGraph[]): RelationGraph {
  const nodeMap = new Map<string, RelationNode>()
  const edges: RelationEdge[] = []

  for (const g of graphs) {
    for (const node of g.nodes) {
      const existing = nodeMap.get(node.name)
      if (!existing) {
        nodeMap.set(node.name, node)
      }
    }
    for (const edge of g.edges) {
      // 重映射 source/target 到合并后的节点 id
      const srcNode = g.nodes.find(n => n.id === edge.source)
      const tgtNode = g.nodes.find(n => n.id === edge.target)
      const mergedSource = srcNode ? (nodeMap.get(srcNode.name)?.id || edge.source) : edge.source
      const mergedTarget = tgtNode ? (nodeMap.get(tgtNode.name)?.id || edge.target) : edge.target

      // 去重：相同 source+target+label 的边只保留一条
      const dup = edges.find(
        e => e.source === mergedSource && e.target === mergedTarget && e.label === edge.label,
      )
      if (!dup) {
        edges.push({ source: mergedSource, target: mergedTarget, label: edge.label })
      }
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
  }
}

/**
 * 从多条路径文本构建 relation-graph 数据
 * @param pathTexts 关联路径文本数组
 * @param mainCompanyName 主企业名称
 * @param relatedPartyName 关联方名称
 */
export function buildRelationGraphJsonData(
  pathTexts: string[],
  mainCompanyName: string,
  relatedPartyName: string,
): { rootId: string, nodes: any[], lines: any[] } | null {
  if (!pathTexts?.length) return null

  const graphs = pathTexts.map(t => parseRelationPath(t)).filter(g => g.nodes.length > 0)
  if (!graphs.length) return null

  const merged = mergeRelationGraphs(graphs)
  if (!merged.nodes.length) return null

  const mainName = mainCompanyName.trim()
  const partyName = relatedPartyName.trim()

  // 企查查风格配色
  const COLOR_MAIN = '#2B7AF0'      // 主企业 - 蓝色
  const COLOR_PARTY = '#F5A623'     // 关联方 - 橙色
  const COLOR_COMPANY = '#4A90E2'   // 普通公司 - 蓝
  const COLOR_PERSON = '#F5A623'    // 个人 - 橙
  const COLOR_OTHER = '#9B9B9B'     // 其他 - 灰

  // 判断是否为个人（简单启发：名称较短、不含"公司/集团/有限"等）
  function isPerson(name: string): boolean {
    if (name.includes('公司') || name.includes('集团') || name.includes('有限') || name.includes('合伙')) return false
    if (name.length <= 4) return true
    return false
  }

  // 确定 rootId：优先主企业，其次是关联方
  let rootId = merged.nodes.find(n => n.name === mainName)?.id
    || merged.nodes.find(n => n.name === partyName)?.id
    || merged.nodes[0].id

  const rgNodes = merged.nodes.map(node => {
    let color: string
    let borderColor: string
    let fontColor = '#333'
    const isMain = node.name === mainName
    const isParty = node.name === partyName
    const person = isPerson(node.name)

    if (isMain) {
      color = COLOR_MAIN
      borderColor = '#1a5fd1'
      fontColor = '#fff'
    } else if (isParty) {
      color = COLOR_PARTY
      borderColor = '#d98e0e'
      fontColor = '#fff'
    } else if (person) {
      color = COLOR_PERSON
      borderColor = '#d98e0e'
      fontColor = '#fff'
    } else {
      color = COLOR_COMPANY
      borderColor = '#357abd'
      fontColor = '#fff'
    }

    return {
      id: node.id,
      text: node.name,
      color,
      borderColor,
      fontColor,
      borderWidth: isMain ? 3 : 2,
      width: isMain ? 220 : person ? 100 : 200,
      height: isMain ? 56 : person ? 40 : 48,
      data: { isMain, isParty, isPerson: person },
    }
  })

  const rgLines = merged.edges.map(edge => ({
    from: edge.source,
    to: edge.target,
    text: edge.label,
    color: '#999',
    fontColor: '#666',
    lineWidth: 1.5,
  }))

  return { rootId, nodes: rgNodes, lines: rgLines }
}

/**
 * 从多条路径文本构建 ECharts 关系图配置（保留兼容）
 * @deprecated 使用 buildRelationGraphJsonData + relation-graph 组件
 */
export function buildRelationGraphChartOption(
  pathTexts: string[],
  mainCompanyName: string,
  relatedPartyName: string,
) {
  if (!pathTexts?.length) return null

  const graphs = pathTexts.map(t => parseRelationPath(t)).filter(g => g.nodes.length > 0)
  if (!graphs.length) return null

  const merged = mergeRelationGraphs(graphs)
  if (!merged.nodes.length) return null

  const nodeCategories = [
    { name: '主企业', itemStyle: { color: '#c23531' }, symbolSize: 45 },
    { name: '关联方', itemStyle: { color: '#5470c6' }, symbolSize: 38 },
    { name: '中间人/企业', itemStyle: { color: '#91cc75' }, symbolSize: 30 },
    { name: '其他', itemStyle: { color: '#a0a0a0' }, symbolSize: 25 },
  ]

  const mainName = mainCompanyName.trim()
  const partyName = relatedPartyName.trim()

  const echartsNodes = merged.nodes.map((node) => {
    let category: number
    if (node.name === mainName) {
      category = 0
    } else if (node.name === partyName) {
      category = 1
    } else if (merged.edges.some(e => {
      const src = merged.nodes.find(n => n.id === e.source)
      const tgt = merged.nodes.find(n => n.id === e.target)
      return (src?.name === node.name || tgt?.name === node.name)
        && (src?.name === mainName || tgt?.name === mainName
          || src?.name === partyName || tgt?.name === partyName)
    })) {
      category = 2
    } else {
      category = 3
    }

    return {
      id: node.id,
      name: node.name,
      symbolSize: nodeCategories[category]?.symbolSize ?? 25,
      category,
      itemStyle: { color: getNodeColor(category === 0 ? -1 : category) },
      label: {
        show: true,
        fontSize: 12,
        color: '#333',
        formatter: (p: any) => {
          const n = p.name || ''
          return n.length > 8 ? n.slice(0, 8) + '...' : n
        },
      },
    }
  })

  const echartsEdges = merged.edges.map((edge) => {
    // 保持使用节点 id 作为 source/target，避免 dataIndex 错误
    return {
      source: edge.source,
      target: edge.target,
      label: {
        show: true,
        formatter: edge.label,
        fontSize: 11,
        color: '#666',
      },
      lineStyle: {
        color: '#aaa',
        curveness: 0.15,
        width: 1.5,
      },
      symbol: ['none', 'arrow'],
      symbolSize: [0, 8],
    }
  })

  // 如果有主企业节点，固定它在中心
  const mainNode = echartsNodes.find(n => n.name === mainName)
  if (mainNode) {
    mainNode.x = 0
    mainNode.y = 0
    mainNode.fixed = true
  }

  return {
    tooltip: {
      show: true,
      formatter: (params: any) => {
        if (params.dataType === 'edge') {
          return `${params.data.source} → ${params.data.target}<br/>关系: ${params.data.label?.formatter || ''}`
        }
        return params.name || ''
      },
    },
    legend: {
      show: true,
      bottom: 10,
      data: nodeCategories.map(c => c.name),
      textStyle: { fontSize: 11 },
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        force: {
          repulsion: 800,
          gravity: 0.05,
          edgeLength: [120, 280],
          layoutAnimation: true,
        },
        data: echartsNodes,
        edges: echartsEdges,
        categories: nodeCategories,
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 3 },
        },
        lineStyle: {
          color: 'source',
          curveness: 0.15,
        },
      },
    ],
  }
}