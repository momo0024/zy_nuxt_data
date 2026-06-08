export type RelatedMindMapTable = {
  column: string[]
  data: string[][]
}

function findColIndex(columns: string[], keywords: string[], fallback: number) {
  const idx = columns.findIndex(col => keywords.some(k => col.includes(k)))
  return idx >= 0 ? idx : fallback
}

function isBlank(val?: string | null) {
  if (val === undefined || val === null) return true
  const s = String(val).trim()
  return !s || s === '-' || s === 'null' || s === 'undefined'
}

const LINE_TEXT_KEYWORDS = ['比例', '职务', '职位', '出资', '认缴', '持股', '投资', '关系', '金额', '资本']

/** 关联类型配色，便于区分不同关系 */
const RELATED_TYPE_PALETTE = [
  { fill: '#e0f2fe', border: '#0284c7', line: '#0284c7', text: '#0c4a6e' },
  { fill: '#dcfce7', border: '#16a34a', line: '#16a34a', text: '#14532d' },
  { fill: '#fce7f3', border: '#db2777', line: '#db2777', text: '#831843' },
  { fill: '#fef3c7', border: '#d97706', line: '#d97706', text: '#78350f' },
  { fill: '#ede9fe', border: '#7c3aed', line: '#7c3aed', text: '#4c1d95' },
  { fill: '#ffedd5', border: '#ea580c', line: '#ea580c', text: '#7c2d12' },
  { fill: '#ccfbf1', border: '#0d9488', line: '#0d9488', text: '#134e4a' },
  { fill: '#e2e8f0', border: '#475569', line: '#475569', text: '#1e293b' },
]

function pickTypeColor(type: string, index: number) {
  let hash = index
  for (let i = 0; i < type.length; i++) hash = (hash * 31 + type.charCodeAt(i)) >>> 0
  return RELATED_TYPE_PALETTE[hash % RELATED_TYPE_PALETTE.length]
}

function buildEntityRelationSummary(
  column: string[],
  row: string[],
  lineTextIdxs: number[],
) {
  return lineTextIdxs
    .map((i) => {
      if (isBlank(row[i])) return ''
      const label = column[i] || ''
      const shortLabel = label.length > 8 ? `${label.slice(0, 8)}…` : label
      return `${shortLabel} ${row[i]}`
    })
    .filter(Boolean)
    .slice(0, 2)
    .join(' · ')
}

export const RELATED_MIND_MAP_DEFAULT_ZOOM = 1.55
export const RELATED_MIND_MAP_FIT_PADDING = 28

export function applyRelatedMindMapDefaultView(instance: {
  view?: { fit: (a?: unknown, b?: boolean, c?: number) => void; scale: number; setScale: (s: number, cx?: number, cy?: number) => void }
  width?: number
  height?: number
} | null) {
  if (!instance?.view) return
  const cx = (instance.width ?? 0) / 2
  const cy = (instance.height ?? 0) / 2
  instance.view.fit(undefined, true, RELATED_MIND_MAP_FIT_PADDING)
  const boosted = Math.min(2, instance.view.scale * RELATED_MIND_MAP_DEFAULT_ZOOM)
  instance.view.setScale(boosted, cx, cy)
}

export type RelatedFieldItem = { label: string; value: string }

export function buildRelatedRowFields(column: string[], row: string[]): RelatedFieldItem[] {
  return column.map((label, i) => ({
    label,
    value: isBlank(row[i]) ? '-' : String(row[i]),
  }))
}

export function buildRelatedMindMapTree(
  table: RelatedMindMapTable,
  rootName: string,
) {
  const { column, data } = table
  const groupIdx = findColIndex(column, ['关联类型', '关联关系', '关系类型'], 3)
  const nameIdx = findColIndex(column, ['名称', '企业名称', '人员', '关联方', '股东'], 1)

  const lineTextIdxs = column
    .map((col, i) => ({ col, i }))
    .filter(({ i }) => i !== groupIdx && i !== nameIdx)
    .filter(({ col }) => LINE_TEXT_KEYWORDS.some(k => col.includes(k)))
    .map(({ i }) => i)

  const groups: Record<string, string[][]> = {}
  for (const row of data) {
    const type = !isBlank(row[groupIdx]) ? String(row[groupIdx]) : '其他'
    if (!groups[type]) groups[type] = []
    groups[type].push(row)
  }

  const rowIndexMap = new Map<string[], number>()
  data.forEach((row, i) => rowIndexMap.set(row, i))

  const children = Object.entries(groups).map(([type, rows], typeIndex) => {
    const color = pickTypeColor(type, typeIndex)
    return {
      data: {
        text: `${type}\n(${rows.length}项)`,
        lineText: `${rows.length}项关联`,
        fillColor: color.fill,
        borderColor: color.border,
        color: color.text,
        lineColor: color.line,
        borderWidth: 2,
        expand: true,
      },
      children: rows.map((row) => {
        const name = !isBlank(row[nameIdx]) ? String(row[nameIdx]) : '-'
        const lineParts = lineTextIdxs
          .map(i => (!isBlank(row[i]) ? String(row[i]) : ''))
          .filter(Boolean)
        const metrics = lineParts.slice(0, 2).join(' · ')
        const summary = buildEntityRelationSummary(column, row, lineTextIdxs)
        const lineText = metrics ? `${type} · ${metrics}` : type

        return {
          data: {
            text: summary ? `${name}\n${summary}` : name,
            lineText,
            lineColor: color.line,
            relatedRowIndex: rowIndexMap.get(row) ?? -1,
          },
          children: [],
        }
      }),
    }
  })

  return {
    data: { text: rootName, expand: true },
    children,
  }
}

export function registerRelatedMindMapNodeProps(MindMap: {
  extendNodeDataNoStylePropList: (list: string[]) => void
  __relatedPropsRegistered?: boolean
}) {
  if (MindMap.__relatedPropsRegistered) return
  MindMap.extendNodeDataNoStylePropList(['lineText', 'relatedRowIndex'])
  MindMap.__relatedPropsRegistered = true
}

export function createRelatedLineLabelHandler() {
  return (styleCtx: any, line: any) => {
    const parentNode = styleCtx?.ctx
    if (!parentNode?._lines || !parentNode?.children) return

    const lineIndex = parentNode._lines.indexOf(line)
    if (lineIndex < 0) return

    const childNode = parentNode.children[lineIndex]
    const lineText = childNode?.getData?.('lineText')
    if (!lineText) return

    try {
      if (line._relatedLabelGroup) {
        line._relatedLabelGroup.remove()
        line._relatedLabelGroup = null
      }

      const len = line.length()
      if (!len || !Number.isFinite(len)) return
      const pt = line.pointAt(len * 0.42)
      if (!pt) return

      const container = parentNode.mindMap?.otherDraw
      if (!container) return

      const group = container.group().addClass('smm-related-line-label')
      const label = group.text(lineText)
      label.font({ size: 12, family: 'Microsoft YaHei, sans-serif', weight: 500 })
      label.fill('#334155')
      label.center(pt.x, pt.y)

      const bbox = label.bbox()
      group.rect(bbox.width + 10, bbox.height + 6)
        .move(bbox.x - 5, bbox.y - 3)
        .fill({ color: '#ffffff' })
        .opacity(0.95)
        .radius(4)
        .stroke({ color: '#cbd5e1', width: 1 })
        .insertBefore(label)

      line._relatedLabelGroup = group
    } catch {
      // ignore line label errors
    }
  }
}

export function getMindMapViewCenter(instance: { width?: number; height?: number } | null) {
  if (!instance) return null
  return {
    cx: (instance.width ?? 0) / 2,
    cy: (instance.height ?? 0) / 2,
  }
}

export function estimateRelatedMindMapHeight(rowCount: number) {
  if (typeof window !== 'undefined') {
    const viewport = window.innerHeight
    const byViewport = Math.floor(viewport * 0.55)
    const byRows = 520 + Math.ceil(rowCount / 2) * 6
    return Math.min(680, Math.max(520, byViewport, byRows))
  }
  return Math.min(680, Math.max(520, 520 + Math.ceil(rowCount / 2) * 6))
}
