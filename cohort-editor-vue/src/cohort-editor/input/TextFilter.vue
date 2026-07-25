<template>
  <div class="text-filter d-flex align-center ga-2 flex-nowrap">
    <v-select
      class="text-filter__operator"
      :model-value="activeValue?.Op"
      :items="operators"
      item-title="title"
      item-value="value"
      variant="outlined"
      density="compact"
      hide-details
      @update:model-value="(value) => setOp(value as TextFilterOp)"
    />
    <v-text-field
      class="text-filter__value"
      :model-value="activeValue?.Value"
      variant="outlined"
      density="compact"
      hide-details
      @update:model-value="(value) => setValue(value)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TextFilter, TextFilterOp } from '../circe.types'

const props = defineProps<{
  modelValue?: TextFilter
}>()

const operators = [
  { title: 'ends with', value: 'endsWith' },
  { title: 'starts with', value: 'startsWith' },
  { title: 'contains', value: 'contains' },
  { title: 'not ends with', value: '!endsWith' },
  { title: 'not starts with', value: '!startsWith' },
  { title: 'not contains', value: '!contains' },
]

const activeValue = computed(() => props.modelValue)

function setOp(op: TextFilterOp) {
  if (!props.modelValue) return
  props.modelValue.Op = op
}

function setValue(value: unknown) {
  if (!props.modelValue) return
  props.modelValue.Value = value === '' || value === null || value === undefined ? undefined : String(value)
}
</script>

<style scoped>
.text-filter__operator {
  min-width: 140px;
  max-width: 140px;
  flex: 0 0 140px;
}

.text-filter__value {
  min-width: 180px;
  flex: 1 1 auto;
}
</style>
