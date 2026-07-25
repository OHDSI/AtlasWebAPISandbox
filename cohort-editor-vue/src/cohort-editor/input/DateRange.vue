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
      <span class="date-range__and text-medium-emphasis">and</span>
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
import type { DateRange, DateRangeOp } from '../circe.types'

const props = defineProps<{
  modelValue?: DateRange
}>()

const operators = [
  { title: 'before', value: 'lt' },
  { title: 'on or before', value: 'lte' },
  { title: 'on', value: 'eq' },
  { title: 'not on', value: '!eq' },
  { title: 'after', value: 'gt' },
  { title: 'on or after', value: 'gte' },
  { title: 'between', value: 'bt' },
  { title: 'not between', value: '!bt' },
]

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
