import { estimateRelatedMindMapHeight } from '~/utils/related-mind-map'

export type ShareholderMindMapTable = {
  column: string[]
  data: string[][]
}

const ROOT_STYLE = {
  fillColor: '#eef2ff',
  borderColor: '#4f46e5',
  color: '#1e1b4b',
  borderWidth: 2,
}

const SHAREHOLDER_GROUP_STYLE = {
  fillColor: '#f3e8ff',
  borderColor: '#8b5cf6',
  color: '#5b21b6',
  lineColor: '#8b5cf6',
  borderWidth: 2,
}

const MEMBER_GROUP_STYLE = {
  fillColor: '#cffafe',
  borderColor: '#06b6d4',
  color: '#0e7490',
  lineColor: '#06b6d4',
  borderWidth: 2,
}

export function buildShareholderMindMapTree(
  latest: ShareholderMindMapTable | null | undefined,
  members: ShareholderMindMapTable | null | undefined,
  companyName: string,
) {
  const children: Array<{
    data: Record<string, unknown>
    children: Array<{ data: Record<string, unknown>; children: [] }>
  }> = []

  if (latest?.data?.length) {
    const columns = latest.column
    const ratioIdx = columns.findIndex(c => c.includes('持股比例') || c.includes('持股'))
    const shareholderChildren = latest.data.map((row) => {
      const fullName = row[0] || '-'
      const name = fullName.length > 14 ? `${fullName.slice(0, 14)}…` : fullName
      const ratio = ratioIdx >= 0 ? parseFloat(row[ratioIdx]) || 0 : 0
      const text = ratio > 0 ? `${name} ${ratio}%` : name
      return {
        data: {
          text,
          lineText: ratio > 0 ? `${ratio}%` : '',
        },
        children: [] as [],
      }
    })

    children.push({
      data: {
        text: `股东\n(${shareholderChildren.length}项)`,
        expand: true,
        ...SHAREHOLDER_GROUP_STYLE,
      },
      children: shareholderChildren,
    })
  }

  if (members?.data?.length) {
    const memberChildren = members.data.map((row) => ({
      data: {
        text: `${row[0] || '-'} (${row[1] || '-'})`,
      },
      children: [] as [],
    }))

    children.push({
      data: {
        text: `主要成员\n(${memberChildren.length}项)`,
        expand: true,
        ...MEMBER_GROUP_STYLE,
      },
      children: memberChildren,
    })
  }

  if (!children.length) return null

  return {
    data: {
      text: companyName,
      expand: true,
      ...ROOT_STYLE,
    },
    children,
  }
}

export function registerShareholderMindMapNodeProps(MindMap: {
  extendNodeDataNoStylePropList: (list: string[]) => void
  __shareholderPropsRegistered?: boolean
}) {
  if (MindMap.__shareholderPropsRegistered) return
  MindMap.extendNodeDataNoStylePropList(['lineText'])
  MindMap.__shareholderPropsRegistered = true
}

export function estimateShareholderMindMapHeight(
  shareholderCount: number,
  memberCount: number,
) {
  return estimateRelatedMindMapHeight(shareholderCount + memberCount)
}
