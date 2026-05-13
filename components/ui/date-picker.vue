<script setup lang="ts">
import { cn } from '~/lib/utils'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Calendar } from '~/components/ui/calendar'
import { format } from 'date-fns'

interface Props {
  modelValue?: Date | null
  placeholder?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: '选择日期',
})

const emit = defineEmits<{
  'update:modelValue': [date: Date | null]
}>()

const selectedDate = ref<Date | null>(props.modelValue)
const isOpen = ref(false)

watch(() => props.modelValue, (val) => {
  selectedDate.value = val
})

watch(selectedDate, (val) => {
  emit('update:modelValue', val)
  if (val) {
    isOpen.value = false
  }
})
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="cn('w-full justify-start text-left font-normal', !selectedDate && 'text-muted-foreground', class)"
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        {{ selectedDate ? format(selectedDate, 'yyyy年MM月dd日') : placeholder }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0">
      <Calendar v-model="selectedDate" />
    </PopoverContent>
  </Popover>
</template>
