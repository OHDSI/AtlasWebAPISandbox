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
import type { NumericRange, NumericRangeOp } from '../circe.types'

const props = defineProps<{
  modelValue?: NumericRange
}>()

const operators = [
  { title: 'less than', value: 'lt' },
  { title: 'less than or equal', value: 'lte' },
  { title: 'equal', value: 'eq' },
  { title: 'not equal', value: '!eq' },
  { title: 'greater than', value: 'gt' },
  { title: 'greater than or equal', value: 'gte' },
  { title: 'between', value: 'bt' },
  { title: 'not between', value: '!bt' },
]
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
