<template>
  <div class="numeric-range d-flex align-center ga-2 flex-nowrap">
    <v-select
      class="numeric-range__operator"
      :model-value="activeValue?.Op ?? defaultOperator"
      :items="operators"
      item-title="title"
      item-value="value"
      variant="outlined"
      density="compact"
      hide-details
      @update:model-value="(value) => setOp(value as NumericRangeOp)"
    />
    <v-text-field
      class="numeric-range__value"
      :model-value="activeValue?.Value"
      type="number"
      variant="outlined"
      density="compact"
      hide-details
      @update:model-value="(value) => setValue(value)"
    />
    <v-text-field
      v-if="activeValue?.Op === 'bt' || activeValue?.Op === '!bt'"
      class="numeric-range__extent"
      :model-value="activeValue?.Extent"
      type="number"
      variant="outlined"
      density="compact"
      hide-details
      @update:model-value="(value) => setExtent(value)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import type { NumericRange, NumericRangeOp } from '../circe.types'

const { t } = useI18n()

const props = defineProps<{
  modelValue?: NumericRange
}>()

const operators = computed(() => [
  { title: t('options.lessThan', 'less than').value, value: 'lt' },
  { title: t('options.lessThanOrEqual', 'less than or equal').value, value: 'lte' },
  { title: t('options.equal', 'equal').value, value: 'eq' },
  { title: t('options.notEqual', 'not equal').value, value: '!eq' },
  { title: t('options.greaterThan', 'greater than').value, value: 'gt' },
  { title: t('options.greaterThanOrEqual', 'greater than or equal').value, value: 'gte' },
  { title: t('options.between', 'between').value, value: 'bt' },
  { title: t('options.notBetween', 'not between').value, value: '!bt' },
])
const defaultOperator = 'gte'

const activeValue = computed(() => props.modelValue)

function setOp(op: NumericRangeOp) {
  if (!props.modelValue) return
  props.modelValue.Op = op
}

function setValue(value: unknown) {
  if (!props.modelValue) return
  props.modelValue.Value = value === '' || value === null || value === undefined ? undefined : Number(value)
}

function setExtent(value: unknown) {
  if (!props.modelValue) return
  props.modelValue.Extent = value === '' || value === null || value === undefined ? undefined : Number(value)
}
</script>

<style scoped>
.numeric-range__operator {
  min-width: 160px;
  max-width: 160px;
  flex: 0 0 160px;
}

.numeric-range__value,
.numeric-range__extent {
  min-width: 130px;
  max-width: 130px;
  flex: 0 0 130px;
}
</style>
