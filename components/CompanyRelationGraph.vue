<script setup lang="ts">
import { ref } from 'vue'
import { useRelationGraph } from '@relation-graph/vue'
import '@relation-graph/vue/style.css'

interface GraphNode {
  id: string
  text: string
  color?: string
  borderColor?: string
  fontColor?: string
  borderWidth?: number
  width?: number
  height?: number
  data?: Record<string, any>
}

interface GraphLine {
  from: string
  to: string
  text?: string
  color?: string
  fontColor?: string
  lineWidth?: number
}

interface GraphData {
  rootId: string
  nodes: GraphNode[]
  lines: GraphLine[]
}

defineProps<{
  graphData: GraphData | null
}>()

const { RelationGraph, graphInstance } = useRelationGraph()
const isReady = ref(false)

const canvasHeight = 500

const options = {
  defaultExpandHolderPosition: 'hide',
  defaultNodeShape: 1,
  defaultNodeBorderWidth: 2,
  defaultNodeColor: '#fff',
  defaultLineColor: '#aaa',
  defaultLineWidth: 1.5,
  defaultLineShape: 6,
  defaultJunctionPoint: 'border',
  layout: {
    layoutName: 'force',
    maxLayoutTimes: 80,
    fastStart: true,
    force_node_repulsion: 150,
    force_line_elastic: 1.5,
  },
  showToolBar: true,
  allowShowMiniToolBar: true,
  allowShowMiniView: false,
  backgroundColor: '#fafbfc',
  viewHeight: canvasHeight + 'px',
  viewWidth: '100%',
}

function onGraphReady() {
  setTimeout(() => {
    graphInstance.value?.zoomToFit?.()
  }, 200)
}

function onLayoutFinish() {
  isReady.value = true
  setTimeout(() => {
    graphInstance.value?.zoomToFit?.()
  }, 100)
}
</script>

<template>
  <div class="company-relation-graph" :style="{ '--canvas-h': canvasHeight + 'px' }">
    <div v-if="graphData" class="rg-canvas-wrap">
      <div v-if="!isReady" class="rg-loading-mask">
        <span class="rg-loading-text">关联关系计算中...</span>
      </div>
      <RelationGraph
        :options="options"
        :initialData="graphData"
        @on-ready="onGraphReady"
        @on-force-layout-finish="onLayoutFinish"
      />
    </div>
    <div v-else class="rg-empty">
      <UIcon name="i-lucide-git-branch" class="size-8 text-gray-300" />
      <span class="text-gray-400 text-sm mt-2">暂无关联关系数据</span>
    </div>
  </div>
</template>

<style>
.company-relation-graph {
  width: 100%;
  border-radius: 8px;
  background: #fafbfc;
}
.company-relation-graph .rg-canvas-wrap {
  position: relative;
  width: 100%;
  min-height: var(--canvas-h);
  height: var(--canvas-h);
}
.company-relation-graph .relation-graph {
  min-height: var(--canvas-h);
  height: var(--canvas-h);
}
.company-relation-graph .rg-loading-mask {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafbfc;
  border-radius: 8px;
}
.company-relation-graph .rg-loading-text {
  font-size: 13px;
  color: #94a3b8;
}
.company-relation-graph .rg-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
}
</style>
