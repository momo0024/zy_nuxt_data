<script setup lang="ts">
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { CalendarDay } from 'date-fns'
import { addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, format } from 'date-fns'

interface Props {
  modelValue?: Date | null
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
})

const emit = defineEmits<{
  'update:modelValue': [date: Date | null]
}>()

const currentMonth = ref<Date>(props.modelValue || new Date())

const selectedDate = ref<Date | null>(props.modelValue)

watch(() => props.modelValue, (val) => {
  selectedDate.value = val
  if (val) {
    currentMonth.value = val
  }
})

watch(selectedDate, (val) => {
  emit('update:modelValue', val)
})

const nextMonth = () => {
  currentMonth.value = addMonths(currentMonth.value, 1)
}

const prevMonth = () => {
  currentMonth.value = addMonths(currentMonth.value, -1)
}

const days = computed(() => {
  const monthStart = startOfMonth(currentMonth.value)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  
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
  <div :class="cn('p-3', class)">
    <div class="flex items-center justify-between mb-4">
      <Button variant="outline" size="icon" @click="prevMonth">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <span class="text-sm font-medium">
        {{ format(currentMonth, 'yyyy年MM月') }}
      </span>
      <Button variant="outline" size="icon" @click="nextMonth">
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>
    <div class="grid grid-cols-7 gap-1 mb-2">
      <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day" class="h-9 w-9 flex items-center justify-center text-xs font-medium text-muted-foreground">
        {{ day }}
      </div>
    </div>
    <div class="grid grid-cols-7 gap-1">
      <button
        v-for="day in days"
        :key="day.toISOString()"
        @click="selectedDate = day"
        :class="cn(
          'h-9 w-9 flex items-center justify-center rounded-md text-sm',
          !isSameMonth(day, currentMonth) && 'text-muted-foreground opacity-50',
          isSameDay(day, selectedDate) && 'bg-primary text-primary-foreground',
          !isSameDay(day, selectedDate) && 'hover:bg-accent hover:text-accent-foreground'
        )"
      >
        {{ format(day, 'd') }}
      </button>
    </div>
  </div>
</template>
