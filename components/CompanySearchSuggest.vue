<script setup lang="ts">
import type { CompanyRecord } from '~/types/company'
import { filterCompaniesBySearch } from '~/types/company'

const props = withDefaults(defineProps<{
  query: string
  companies: CompanyRecord[]
  maxItems?: number
}>(), {
  maxItems: 8,
})

const emit = defineEmits<{
  select: [company: CompanyRecord]
}>()

const focused = ref(false)

const suggestions = computed(() =>
  filterCompaniesBySearch(props.companies, props.query, props.maxItems),
)

const showPanel = computed(() =>
  focused.value && props.query.trim().length > 0 && suggestions.value.length > 0,
)

function onFocusOut(e: FocusEvent) {
  const related = e.relatedTarget as Node | null
  if (related && (e.currentTarget as HTMLElement).contains(related)) return
  focused.value = false
}

function onSelect(company: CompanyRecord) {
  focused.value = false
  emit('select', company)
}

function companyKey(c: CompanyRecord) {
  return c.id || c.company_credit_code || c.company_name
}
</script>

<template>
  <div class="css-wrap" @focusin="focused = true" @focusout="onFocusOut">
    <slot />
    <Transition name="css-fade">
      <div v-if="showPanel" class="css-panel">
        <button
          v-for="c in suggestions"
          :key="companyKey(c)"
          type="button"
          class="css-item"
          @mousedown.prevent
          @click="onSelect(c)"
        >
          <span class="css-avatar">{{ c.company_name.charAt(0) }}</span>
          <span class="css-info">
            <span class="css-name">
              {{ c.company_name }}
              <span v-if="c.company_traded === 1" class="css-listed">上市</span>
            </span>
            <span v-if="c.company_credit_code" class="css-meta">{{ c.company_credit_code }}</span>
            <span v-else-if="c.product_type && c.product_type !== '-'" class="css-meta">{{ c.product_type }}</span>
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.css-wrap {
  position: relative;
  width: 100%;
}

.css-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  max-height: 280px;
  overflow-y: auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: var(--shadow-md, 0 8px 24px rgba(15, 23, 42, 0.12));
}

.css-panel::-webkit-scrollbar { width: 3px; }
.css-panel::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.css-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s ease;
}

.css-item:hover {
  background: color-mix(in srgb, var(--primary) 8%, transparent);
}

.css-item + .css-item {
  border-top: 1px solid var(--border);
}

.css-avatar {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--primary) 15%, var(--surface-alt));
  color: var(--primary);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.css-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.css-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-strong);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 4px;
}

.css-listed {
  flex-shrink: 0;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  background: color-mix(in srgb, #ef4444 12%, transparent);
  color: #ef4444;
}

.css-meta {
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.css-fade-enter-active,
.css-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.css-fade-enter-from,
.css-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
