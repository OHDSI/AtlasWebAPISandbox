<template>
  <div class="period-editor d-flex align-center ga-2 flex-nowrap">
    <v-text-field
      class="period-editor__value"
      :model-value="activeValue?.StartDate"
      type="date"
      variant="outlined"
      density="compact"
      hide-details
      :label="startLabel"
      @update:model-value="(value) => setStartDate(value)"
    />
    <span class="period-editor__and text-medium-emphasis">{{ andLabel }}</span>
    <v-text-field
      class="period-editor__value"
      :model-value="activeValue?.EndDate"
      type="date"
      variant="outlined"
      density="compact"
      hide-details
      :label="endLabel"
      @update:model-value="(value) => setEndDate(value)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import type { Period } from '../circe.types'

const { t } = useI18n()

const props = defineProps<{
  modelValue?: Period
}>()

const activeValue = computed(() => props.modelValue)
const startLabel = computed(() => t('common.startDate', 'start date').value)
const endLabel = computed(() => t('common.endDate', 'end date').value)
const andLabel = computed(() => t('common.and', 'and').value)

function setStartDate(value: unknown) {
  if (!props.modelValue) return
  props.modelValue.StartDate = value === '' || value === null || value === undefined ? undefined : String(value)
}

function setEndDate(value: unknown) {
  if (!props.modelValue) return
  props.modelValue.EndDate = value === '' || value === null || value === undefined ? undefined : String(value)
}
</script>

<style scoped>
.period-editor__value {
  min-width: 150px;
  max-width: 150px;
  flex: 0 0 150px;
}

.period-editor__and {
  white-space: nowrap;
}
</style>