<script setup lang="ts">
import {
  format,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isBefore,
  isWithinInterval,
  startOfDay,
  subDays,
  subMonths,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'

export interface DateRangeValue {
  start?: string
  end?: string
}

interface Props {
  modelValue?: DateRangeValue
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  placeholder: '选择日期范围',
})

const emit = defineEmits<{
  'update:modelValue': [value: DateRangeValue]
}>()

const rootRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const currentMonth = ref(new Date())
const rangeStart = ref<Date | null>(null)
const rangeEnd = ref<Date | null>(null)
const pendingEnd = ref(false)

function parseDate(val?: string): Date | null {
  if (!val) return null
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? null : d
}

function syncFromModel(val?: DateRangeValue) {
  rangeStart.value = parseDate(val?.start)
  rangeEnd.value = parseDate(val?.end)
  pendingEnd.value = false
  if (rangeStart.value) {
    currentMonth.value = rangeStart.value
  }
}

watch(() => props.modelValue, syncFromModel, { immediate: true, deep: true })

const displayText = computed(() => {
  const start = rangeStart.value
  const end = rangeEnd.value
  if (start && end) {
    return `${format(start, 'yyyy-MM-dd', { locale: zhCN })} ~ ${format(end, 'yyyy-MM-dd', { locale: zhCN })}`
  }
  if (start && pendingEnd.value) {
    return `${format(start, 'yyyy-MM-dd', { locale: zhCN })} ~ `
  }
  return ''
})

const hasValue = computed(() => !!(props.modelValue?.start || props.modelValue?.end))

function emitRange(start: Date | null, end: Date | null) {
  emit('update:modelValue', {
    start: start ? format(start, 'yyyy-MM-dd') : undefined,
    end: end ? format(end, 'yyyy-MM-dd') : undefined,
  })
}

const nextMonth = () => {
  currentMonth.value = addMonths(currentMonth.value, 1)
}

const prevMonth = () => {
  currentMonth.value = addMonths(currentMonth.value, -1)
}

function normalizedRange(): { from: Date; to: Date } | null {
  if (!rangeStart.value || !rangeEnd.value) return null
  const from = startOfDay(rangeStart.value)
  const to = startOfDay(rangeEnd.value)
  return isBefore(to, from) ? { from: to, to: from } : { from, to }
}

function isRangeEndpoint(day: Date): boolean {
  const range = normalizedRange()
  if (!range) {
    return !!rangeStart.value && isSameDay(day, rangeStart.value)
  }
  return isSameDay(day, range.from) || isSameDay(day, range.to)
}

function isInRange(day: Date): boolean {
  const range = normalizedRange()
  if (!range) return false
  if (isRangeEndpoint(day)) return false
  return isWithinInterval(startOfDay(day), { start: range.from, end: range.to })
}

function selectDate(day: Date) {
  if (!pendingEnd.value || !rangeStart.value || rangeEnd.value) {
    rangeStart.value = day
    rangeEnd.value = null
    pendingEnd.value = true
    return
  }

  let start = rangeStart.value
  let end = day
  if (isBefore(end, start)) {
    const tmp = start
    start = end
    end = tmp
  }
  rangeStart.value = start
  rangeEnd.value = end
  pendingEnd.value = false
  emitRange(start, end)
  isOpen.value = false
}

function isToday(day: Date): boolean {
  return isSameDay(day, new Date())
}

function selectQuickRange(type: 'week' | 'month') {
  const end = startOfDay(new Date())
  const start = type === 'week' ? subDays(end, 6) : subMonths(end, 1)
  rangeStart.value = start
  rangeEnd.value = end
  pendingEnd.value = false
  currentMonth.value = start
  emitRange(start, end)
  isOpen.value = false
}

function selectToday() {
  const today = startOfDay(new Date())
  rangeStart.value = today
  rangeEnd.value = today
  pendingEnd.value = false
  currentMonth.value = today
  emitRange(today, today)
  isOpen.value = false
}

function clearRange(e: Event) {
  e.stopPropagation()
  rangeStart.value = null
  rangeEnd.value = null
  pendingEnd.value = false
  emit('update:modelValue', {})
}

function onDocumentClick(e: MouseEvent) {
  if (!isOpen.value || !rootRef.value) return
  if (!rootRef.value.contains(e.target as Node)) {
    isOpen.value = false
    pendingEnd.value = false
    syncFromModel(props.modelValue)
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})

const days = computed(() => {
  const monthStart = startOfMonth(currentMonth.value)
  const monthEnd = endOfMonth(monthStart)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const result: Date[] = []
  let day = gridStart
  while (day <= gridEnd) {
    result.push(day)
    day = addDays(day, 1)
  }
  return result
})
</script>

<template>
  <div ref="rootRef" class="date-range-picker relative">
    <div
      class="date-input flex items-center justify-between px-3 py-2 border rounded-lg cursor-pointer bg-[var(--surface-alt)] border-[var(--border)] hover:border-[var(--primary)] transition-colors"
      @click.stop="isOpen = !isOpen"
    >
      <span class="text-[14px] truncate" :class="hasValue ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'">
        {{ displayText || placeholder }}
      </span>
      <div class="flex items-center gap-2 shrink-0">
        <span v-if="hasValue" class="text-[var(--text-muted)] hover:text-[var(--danger)]" @click="clearRange">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
        <svg class="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>

    <div
      v-if="isOpen"
      class="date-dropdown absolute top-full left-0 mt-2 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg z-[100] min-w-[280px]"
      @click.stop
    >
      <!-- 快捷选择 -->
      <div class="flex gap-2 mb-4">
        <button type="button" class="dr-quick-btn" @click="selectToday">今天</button>
        <button type="button" class="dr-quick-btn" @click="selectQuickRange('week')">最近一周</button>
        <button type="button" class="dr-quick-btn" @click="selectQuickRange('month')">最近一月</button>
      </div>

      <div class="flex items-center justify-between mb-4">
        <button type="button" class="p-1 hover:bg-[var(--surface-alt)] rounded-lg transition-colors text-[var(--text)]" @click="prevMonth">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span class="text-sm font-medium text-[var(--text-strong)]">
          {{ format(currentMonth, 'yyyy年MM月', { locale: zhCN }) }}
        </span>
        <button type="button" class="p-1 hover:bg-[var(--surface-alt)] rounded-lg transition-colors text-[var(--text)]" @click="nextMonth">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <p v-if="pendingEnd && rangeStart" class="mb-3 text-xs text-[var(--text-muted)]">
        已选开始日期，请选择结束日期
      </p>

      <div class="grid grid-cols-7 gap-1 mb-2">
        <div
          v-for="day in ['日', '一', '二', '三', '四', '五', '六']"
          :key="day"
          class="h-8 w-8 flex items-center justify-center text-xs font-medium text-[var(--text-muted)]"
        >
          {{ day }}
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1">
        <button
          v-for="day in days"
          :key="day.toISOString()"
          type="button"
          class="h-8 w-8 flex items-center justify-center rounded-lg text-sm transition-colors"
          :class="[
            !isSameMonth(day, currentMonth) ? 'text-[var(--text-muted)] opacity-40' : '',
            isRangeEndpoint(day) ? 'bg-[var(--primary)] text-white' : '',
            isInRange(day) ? 'dr-in-range' : '',
            isToday(day) && !isRangeEndpoint(day) ? 'dr-today' : '',
            !isRangeEndpoint(day) && !isInRange(day) && !isToday(day) ? 'hover:bg-[var(--surface-alt)] text-[var(--text)]' : '',
          ]"
          @click="selectDate(day)"
        >
          {{ format(day, 'd') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.date-range-picker {
  width: 100%;
}

.dr-quick-btn {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
  background: var(--surface-alt);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.dr-quick-btn:hover {
  color: #fff;
  background: var(--primary);
  border-color: var(--primary);
}

.dr-in-range {
  background: color-mix(in srgb, var(--primary) 25%, transparent);
  color: var(--text-strong);
}

.dr-today {
  font-weight: 700;
  color: var(--primary) !important;
  position: relative;
}

.dr-today::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--primary);
}
</style>
