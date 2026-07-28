<template>
  <v-menu
    v-model="menuOpen"
    :close-on-content-click="false"
    location="bottom"
    offset="8"
  >
    <template #activator="{ props: menuProps }">
      <v-chip
        v-bind="menuProps"
        class="date-adjustment-editor__chip"
        color="primary"
        data-testid="attribute-date-adjustment-chip"
        label
        prepend-icon="mdi-calendar-edit"
        variant="outlined"
      >
        {{ summaryLabel }}
      </v-chip>
    </template>

    <v-card
      class="date-adjustment-editor__menu"
      rounded="lg"
    >
      <v-card-text class="d-flex flex-column ga-4">
        <div class="text-subtitle-1">
          {{ dateAdjustmentLabel }}
        </div>
        <div>
          <div class="text-subtitle-2 mb-2">
            {{ startDateAdjustmentLabel }}
          </div>

          <div class="date-adjustment-editor__row d-flex ga-3 flex-wrap">
            <v-select
              class="date-adjustment-editor__select"
              :model-value="activeValue.StartWith"
              :items="dateReferenceOptions"
              item-title="label"
              item-value="value"
              :label="startWithLabel"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="updateStartWith"
            />

            <v-text-field
              class="date-adjustment-editor__offset"
              :model-value="activeValue.StartOffset"
              :label="offsetDaysLabel"
              type="number"
              variant="outlined"
              density="compact"
              hide-details
              :suffix="daysSuffix"
              @update:model-value="updateStartOffset"
            />
          </div>
        </div>

        <v-divider />

        <div>
          <div class="text-subtitle-2 mb-2">
            {{ endDateAdjustmentLabel }}
          </div>

          <div class="date-adjustment-editor__row d-flex ga-3 flex-wrap">
            <v-select
              class="date-adjustment-editor__select"
              :model-value="activeValue.EndWith"
              :items="dateReferenceOptions"
              item-title="label"
              item-value="value"
              :label="endWithLabel"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="updateEndWith"
            />

            <v-text-field
              class="date-adjustment-editor__offset"
              :model-value="activeValue.EndOffset"
              :label="offsetDaysLabel"
              type="number"
              variant="outlined"
              density="compact"
              hide-details
              :suffix="daysSuffix"
              @update:model-value="updateEndOffset"
            />
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '@/composables/useI18n'
import type { DateAdjustment } from '../circe.types'
import { createDefaultDateAdjustment } from '../criteria/criteria-editor-helper'

const { t } = useI18n()

const props = defineProps<{
  modelValue?: DateAdjustment
}>()

const menuOpen = ref(false)

const activeValue = computed(() => props.modelValue ?? createDefaultDateAdjustment())

const dateReferenceOptions = computed(() => [
  { label: t('options.startDate', 'Start Date').value, value: 'START_DATE' },
  { label: t('options.endDate', 'End Date').value, value: 'END_DATE' },
])

const dateAdjustmentLabel = computed(() => t('components.dateAdjust.criteriaLabel', 'Date Adjustment').value)
const startDateAdjustmentLabel = computed(() => t('common.startDateAdjustment', 'Start Date Adjustment').value)
const endDateAdjustmentLabel = computed(() => t('common.endDateAdjustment', 'End Date Adjustment').value)
const startWithLabel = computed(() => t('common.startWith', 'Start With').value)
const endWithLabel = computed(() => t('common.endWith', 'End With').value)
const offsetDaysLabel = computed(() => t('common.offsetDays', 'Offset (Days)').value)
const daysSuffix = computed(() => t('common.days', 'days').value)
const summaryStartLabel = computed(() => t('common.start', 'Start').value)
const summaryEndLabel = computed(() => t('common.end', 'End').value)

const summaryLabel = computed(() => {
  return `${summaryStartLabel.value}: ${formatDateReference(activeValue.value.StartWith)} ${formatOffset(activeValue.value.StartOffset)}, ${summaryEndLabel.value}: ${formatDateReference(activeValue.value.EndWith)} ${formatOffset(activeValue.value.EndOffset)}`
})

function updateStartWith(value: unknown) {
  if (!props.modelValue) return
  props.modelValue.StartWith = value === 'END_DATE' ? 'END_DATE' : 'START_DATE'
}

function updateStartOffset(value: unknown) {
  if (!props.modelValue) return
  props.modelValue.StartOffset = normalizeOffset(value)
}

function updateEndWith(value: unknown) {
  if (!props.modelValue) return
  props.modelValue.EndWith = value === 'START_DATE' ? 'START_DATE' : 'END_DATE'
}

function updateEndOffset(value: unknown) {
  if (!props.modelValue) return
  props.modelValue.EndOffset = normalizeOffset(value)
}

function normalizeOffset(value: unknown) {
  if (value === '' || value === null || value === undefined) {
    return 0
  }

  return Number(value)
}

function formatDateReference(value: 'START_DATE' | 'END_DATE' | undefined) {
  return value === 'END_DATE' ? summaryEndLabel.value : summaryStartLabel.value
}

function formatOffset(value: number | undefined) {
  const offset = value ?? 0
  const sign = offset < 0 ? '-' : '+'
  return `${sign} ${Math.abs(offset)}${t('common.daysAbbr', 'd').value}`
}
</script>

<style scoped>
.date-adjustment-editor__chip {
  cursor: pointer;
  text-transform: none;
}

.date-adjustment-editor__menu {
  min-width: 420px;
  max-width: min(560px, calc(100vw - 32px));
}

.date-adjustment-editor__select,
.date-adjustment-editor__offset {
  flex: 1 1 180px;
}
</style>