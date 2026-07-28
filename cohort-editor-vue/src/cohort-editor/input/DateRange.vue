<template>
  <div class="date-range d-flex align-center ga-2 flex-nowrap">
    <v-select
      class="date-range__operator"
      :model-value="activeValue?.Op"
      :items="operators"
      item-title="title"
      item-value="value"
      variant="outlined"
      density="compact"
      hide-details
      @update:model-value="(value) => setOp(value as DateRangeOp)"
    />
    <v-text-field
      class="date-range__value"
      :model-value="activeValue?.Value"
      type="date"
      variant="outlined"
      density="compact"
      hide-details
      @update:model-value="(value) => setValue(value)"
    />
    <template v-if="activeValue?.Op === 'bt' || activeValue?.Op === '!bt'">
      <span class="date-range__and text-medium-emphasis">{{ andLabel }}</span>
      <v-text-field
        class="date-range__extent"
        :model-value="activeValue?.Extent"
        type="date"
        variant="outlined"
        density="compact"
        hide-details
        @update:model-value="(value) => setExtent(value)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import type { DateRange, DateRangeOp } from '../circe.types'

const { t } = useI18n()

const props = defineProps<{
  modelValue?: DateRange
}>()

const operators = computed(() => [
  { title: t('options.before', 'before').value, value: 'lt' },
  { title: t('options.onOrBefore', 'on or before').value, value: 'lte' },
  { title: t('options.on', 'on').value, value: 'eq' },
  { title: t('options.notOn', 'not on').value, value: '!eq' },
  { title: t('options.after', 'after').value, value: 'gt' },
  { title: t('options.onOrAfter', 'on or after').value, value: 'gte' },
  { title: t('options.between', 'between').value, value: 'bt' },
  { title: t('options.notBetween', 'not between').value, value: '!bt' },
])

const andLabel = computed(() => t('common.and', 'and').value)

const activeValue = computed(() => props.modelValue)

function setOp(op: DateRangeOp) {
  if (!props.modelValue) return
  props.modelValue.Op = op
}

function setValue(value: unknown) {
  if (!props.modelValue) return
  props.modelValue.Value = value === '' || value === null || value === undefined ? undefined : String(value)
}

function setExtent(value: unknown) {
  if (!props.modelValue) return
  props.modelValue.Extent = value === '' || value === null || value === undefined ? undefined : String(value)
}
</script>

<style scoped>
.date-range__operator {
  min-width: 120px;
  max-width: 120px;
  flex: 0 0 120px;
}

.date-range__value,
.date-range__extent {
  min-width: 130px;
  max-width: 130px;
  flex: 0 0 130px;
}

.date-range__and {
  white-space: nowrap;
}
</style>
