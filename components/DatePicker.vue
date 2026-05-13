<script setup lang="ts">
import { format, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Props {
  modelValue?: string | Date | null
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: '选择日期',
})

const emit = defineEmits<{
  'update:modelValue': [date: string]
}>()

const isOpen = ref(false)
const currentMonth = ref<Date>(props.modelValue ? (typeof props.modelValue === 'string' ? new Date(props.modelValue) : props.modelValue) : new Date())
const selectedDate = ref<Date | null>(props.modelValue ? (typeof props.modelValue === 'string' ? new Date(props.modelValue) : props.modelValue) : null)

watch(() => props.modelValue, (val) => {
  if (val) {
    selectedDate.value = typeof val === 'string' ? new Date(val) : val
    currentMonth.value = selectedDate.value
  } else {
    selectedDate.value = null
  }
})

const nextMonth = () => {
  currentMonth.value = addMonths(currentMonth.value, 1)
}

const prevMonth = () => {
  currentMonth.value = addMonths(currentMonth.value, -1)
}

const selectDate = (day: Date) => {
  selectedDate.value = day
  emit('update:modelValue', format(day, 'yyyy-MM-dd'))
  isOpen.value = false
}

const clearDate = (e: Event) => {
  e.stopPropagation()
  selectedDate.value = null
  emit('update:modelValue', '')
}

const days = computed(() => {
  const monthStart = startOfMonth(currentMonth.value)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })
  
  const days: Date[] = []
  let day = startDate
  while (day <= endDate) {
    days.push(day)
    day = addDays(day, 1)
  }
  return days
})
</script>

<template>
  <div class="date-picker relative">
    <div 
      class="date-input flex items-center justify-between px-3 py-2 border rounded-lg cursor-pointer bg-[var(--surface-alt)] border-[var(--border)] hover:border-[var(--primary)] transition-colors"
      @click="isOpen = !isOpen"
    >
      <span class="text-[14px]" :class="selectedDate ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'">
        {{ selectedDate ? format(selectedDate, 'yyyy年MM月dd日', { locale: zhCN }) : placeholder }}
      </span>
      <div class="flex items-center gap-2">
        <span v-if="selectedDate" class="text-[var(--text-muted)] hover:text-[var(--danger)]" @click="clearDate">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
        <svg class="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>
    <div v-if="isOpen" class="date-dropdown absolute top-full left-0 mt-2 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg z-50">
      <div class="flex items-center justify-between mb-4">
        <button @click="prevMonth" class="p-1 hover:bg-[var(--surface-alt)] rounded-lg transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span class="text-sm font-medium text-[var(--text-strong)]">
          {{ format(currentMonth, 'yyyy年MM月', { locale: zhCN }) }}
        </span>
        <button @click="nextMonth" class="p-1 hover:bg-[var(--surface-alt)] rounded-lg transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div class="grid grid-cols-7 gap-1 mb-2">
        <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day" class="h-8 w-8 flex items-center justify-center text-xs font-medium text-[var(--text-muted)]">
          {{ day }}
        </div>
      </div>
      <div class="grid grid-cols-7 gap-1">
        <button
          v-for="day in days"
          :key="day.toISOString()"
          @click="selectDate(day)"
          class="h-8 w-8 flex items-center justify-center rounded-lg text-sm transition-colors"
          :class="[
            !isSameMonth(day, currentMonth) ? 'text-[var(--text-muted)] opacity-40' : '',
            isSameDay(day, selectedDate) ? 'bg-[var(--primary)] text-white' : 'hover:bg-[var(--surface-alt)] text-[var(--text)]',
          ]"
        >
          {{ format(day, 'd') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.date-picker {
  width: 100%;
}
</style>
