<template>
  <v-card
    class="corelated-criteria-editor"
    rounded="lg"
    variant="outlined"
  >
    <v-card-text class="corelated-criteria-editor__body d-flex">
      <v-menu
        v-model="showOccurrenceMenu"
        :close-on-content-click="false"
        location="end"
      >
        <template #activator="{ props: menuProps }">
          <div
            class="vertical-label-container"
            v-bind="menuProps"
          >
            <div
              class="vertical-label occurrence-label"
              :data-type="occurrenceTypeKey"
              :title="'Click to change occurrence mode'"
            >
              {{ occurrenceLabel }}
            </div>
          </div>
        </template>

        <v-card class="occurrence-menu">
          <v-card-text class="pa-3">
            <div class="segmented-buttons">
              <v-btn
                :variant="occurrenceTypeKey === 'EXACTLY' ? 'tonal' : 'outlined'"
                class="flex-1 occurrence-chip--exactly"
                size="small"
                @click="occurrenceTypeKey = 'EXACTLY'"
              >
                Exactly
              </v-btn>
              <v-btn
                :variant="occurrenceTypeKey === 'AT_LEAST' ? 'tonal' : 'outlined'"
                class="flex-1 occurrence-chip--at_least"
                size="small"
                @click="occurrenceTypeKey = 'AT_LEAST'"
              >
                At least
              </v-btn>
              <v-btn
                :variant="occurrenceTypeKey === 'AT_MOST' ? 'tonal' : 'outlined'"
                class="flex-1 occurrence-chip--at_most"
                size="small"
                @click="occurrenceTypeKey = 'AT_MOST'"
              >
                At most
              </v-btn>
            </div>

            <v-text-field
              v-model="occurrenceCount"
              class="mt-3"
              density="compact"
              hide-details
              label="Count"
              min="0"
              type="number"
            />
          </v-card-text>
        </v-card>
      </v-menu>

      <div class="flex-grow-1 corelated-criteria-editor__content">
        <CriteriaRenderer
          :criteria="innerCriteria"
          :concept-sets="conceptSets"
          class="mb-3"
          @remove="emit('remove')"
          @select-concept-set="emit('select-concept-set', $event)"
          @edit-concept-set="emit('edit-concept-set', $event)"
          @clear-concept-set="emit('clear-concept-set')"
        />

        <v-menu
          v-model="showWindowMenu"
          :close-on-content-click="false"
          location="bottom"
          offset="10"
        >
          <template #activator="{ props: menuProps }">
            <div class="corelated-criteria-editor__temporal mt-3">
              <v-chip
                class="corelated-criteria-editor__window-chip"
                color="primary"
                prepend-icon="mdi-calendar-range"
                variant="tonal"
                v-bind="menuProps"
              >
                {{ windowSummaryLabel }}
              </v-chip>
            </div>
          </template>

          <v-card class="corelated-criteria-editor__window-menu" rounded="lg">
            <v-card-text class="d-flex flex-column ga-4">
              <v-select
                :items="windowPresetOptions"
                item-title="label"
                item-value="label"
                label="Quick Presets"
                variant="outlined"
                density="compact"
                hide-details
                @update:model-value="applyWindowPresetByLabel"
              />

              <WindowEditor :window="ensureStartWindow()" />

              <template v-if="props.criteria.EndWindow">
                <div class="corelated-criteria-editor__window-separator">
                  and
                </div>

                <WindowEditor :window="props.criteria.EndWindow">
                  <template #actions>
                    <v-btn
                      icon="mdi-delete"
                      color="error"
                      variant="text"
                      size="small"
                      @click="removeEndWindow"
                    />
                  </template>
                </WindowEditor>
              </template>
            </v-card-text>

            <v-card-actions>
              <v-btn
                v-if="!props.criteria.EndWindow"
                variant="tonal"
                @click="ensureEndWindow()"
              >
                Add Additional Time-Box
              </v-btn>

              <v-spacer />

              <v-btn
                variant="text"
                @click="showWindowMenu = false"
              >
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>

        <div class="corelated-criteria-editor__flags mt-3">
          <v-chip
            class="mr-2"
            :variant="restrictVisit ? 'tonal' : 'outlined'"
            :color="restrictVisit ? 'success' : 'primary'"
            @click="restrictVisit = !restrictVisit"
          >
            Restrict Visit
          </v-chip>

          <v-chip
            :variant="ignoreObservationPeriod ? 'tonal' : 'outlined'"
            :color="ignoreObservationPeriod ? 'success' : 'primary'"
            @click="ignoreObservationPeriod = !ignoreObservationPeriod"
          >
            Ignore Observation Period
          </v-chip>
        </div>
      </div>
    </v-card-text>
  </v-card>

</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import CriteriaRenderer from './CriteriaRenderer.vue'
import WindowEditor from './WindowEditor.vue'
import type { CorelatedCriteria, Criteria } from '../circe.types'
import type { ConceptSetOption, ConceptSetSelectionTarget } from './criteria-editor.types'
import { createDefaultWindow, formatWindowExpression, getWindowPresetOptions, cloneWindow, type WindowPresetValue } from './window-utils'

defineOptions({ name: 'CorelatedCriteriaEditor' })

const props = defineProps<{
  criteria: CorelatedCriteria
  conceptSets: ConceptSetOption[]
}>()

const emit = defineEmits<{
  remove: []
  'select-concept-set': [target: ConceptSetSelectionTarget | undefined]
  'edit-concept-set': [target: ConceptSetSelectionTarget | undefined]
  'clear-concept-set': []
}>()

const showOccurrenceMenu = ref(false)
const showWindowMenu = ref(false)
const windowPresetOptions = getWindowPresetOptions()

const innerCriteria = computed<Criteria>(() => {
  if (!props.criteria.Criteria) {
    props.criteria.Criteria = { ConditionOccurrence: {} }
  }

  return props.criteria.Criteria
})

const occurrenceTypeKey = computed<'EXACTLY' | 'AT_LEAST' | 'AT_MOST'>({
  get: () => occurrenceTypeFromValue(props.criteria.Occurrence?.Type),
  set: value => {
    ensureOccurrence().Type = occurrenceTypeToValue(value)
  },
})

const occurrenceCount = computed<string>({
  get: () => props.criteria.Occurrence?.Count?.toString() ?? '1',
  set: value => {
    const occurrence = ensureOccurrence()
    occurrence.Count = value === '' ? undefined : Number(value)
  },
})

const occurrenceLabel = computed(() => {
  return `${occurrenceTypeKey.value.replace('_', ' ')} ${occurrenceCount.value}`
})

const windowSummaryLabel = computed(() => {
  const startSummary = formatWindowExpression(props.criteria.StartWindow)
  const endSummary = props.criteria.EndWindow ? formatWindowExpression(props.criteria.EndWindow) : ''

  return endSummary ? `${startSummary} and ${endSummary}` : startSummary
})

const restrictVisit = computed({
  get: () => props.criteria.RestrictVisit ?? false,
  set: value => {
    props.criteria.RestrictVisit = value
  },
})

const ignoreObservationPeriod = computed({
  get: () => props.criteria.IgnoreObservationPeriod ?? false,
  set: value => {
    props.criteria.IgnoreObservationPeriod = value
  },
})

function ensureOccurrence() {
  if (!props.criteria.Occurrence) {
    props.criteria.Occurrence = {
      Type: 2,
      Count: 1,
    }
  }

  return props.criteria.Occurrence
}

function occurrenceTypeFromValue(value: number | undefined): 'EXACTLY' | 'AT_LEAST' | 'AT_MOST' {
  switch (value) {
    case 1:
      return 'AT_MOST'
    case 2:
      return 'AT_LEAST'
    case 0:
    default:
      return 'EXACTLY'
  }
}

function occurrenceTypeToValue(value: 'EXACTLY' | 'AT_LEAST' | 'AT_MOST'): number {
  switch (value) {
    case 'AT_MOST':
      return 1
    case 'AT_LEAST':
      return 2
    case 'EXACTLY':
    default:
      return 0
  }
}

function ensureStartWindow() {
  if (!props.criteria.StartWindow) {
    props.criteria.StartWindow = createDefaultWindow()
  }

  return props.criteria.StartWindow
}

function ensureEndWindow() {
  props.criteria.EndWindow = createDefaultWindow()
}

function removeEndWindow() {
  delete props.criteria.EndWindow
}

function applyWindowPreset(preset: WindowPresetValue | null) {
  if (!preset) {
    return
  }

  props.criteria.StartWindow = cloneWindow(preset.startWindow)

  if (preset.endWindow) {
    props.criteria.EndWindow = cloneWindow(preset.endWindow)
  } else {
    delete props.criteria.EndWindow
  }
}

function applyWindowPresetByLabel(label: string | null) {
  if (!label) {
    return
  }

  const preset = windowPresetOptions.find(option => option.label === label)
  if (!preset) {
    return
  }

  applyWindowPreset(preset.value)
}
</script>

<style scoped>
.corelated-criteria-editor {
  margin-bottom: 12px;
}

.corelated-criteria-editor__body {
  align-items: stretch;
}

.corelated-criteria-editor__content {
  padding-left: 12px;
}

.corelated-criteria-editor__temporal {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.corelated-criteria-editor__window-chip {
  max-width: 100%;
  white-space: normal;
  height: auto;
}

.corelated-criteria-editor__window-menu {
  width: fit-content;
  max-width: calc(100vw - 32px);
}

.corelated-criteria-editor__window-separator {
  display: flex;
  justify-content: center;
  font-weight: 700;
  text-transform: lowercase;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.72;
}

.vertical-label-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  margin-left: -16px;
  margin-top: -16px;
  margin-bottom: -16px;
  width: 30px;
  position: relative;
  border-radius: 0 0 0 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.vertical-label {
  writing-mode: sideways-lr;
  text-orientation: sideways;
  font-weight: 700;
  user-select: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  padding-left: 8px;
  position: relative;
  z-index: 1;
  cursor: pointer;
  width: 100%;
  text-align: center;
}

.occurrence-label {
  font-size: 13px;
}

.vertical-label-container:has(.occurrence-label[data-type='EXACTLY']) {
  border: 1px solid #1f425a;
}

.vertical-label-container:has(.occurrence-label[data-type='EXACTLY'])::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 30%;
  background: #1f425a;
  border-radius: 0 0 0 6px;
}

.occurrence-label[data-type='EXACTLY'] {
  color: #1f425a;
}

.vertical-label-container:has(.occurrence-label[data-type='AT_LEAST']) {
  border: 1px solid #69aed5;
}

.vertical-label-container:has(.occurrence-label[data-type='AT_LEAST'])::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 30%;
  background: #69aed5;
  border-radius: 0 0 0 6px;
}

.occurrence-label[data-type='AT_LEAST'] {
  color: #69aed5;
}

.vertical-label-container:has(.occurrence-label[data-type='AT_MOST']) {
  border: 1px solid #336b91;
}

.vertical-label-container:has(.occurrence-label[data-type='AT_MOST'])::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 30%;
  background: #336b91;
  border-radius: 0 0 0 6px;
}

.occurrence-label[data-type='AT_MOST'] {
  color: #336b91;
}

.segmented-buttons {
  display: flex;
  gap: 4px;
}

.flex-1 {
  flex: 1;
}

.occurrence-menu {
  min-width: 300px;
}

.occurrence-chip--exactly.v-btn--variant-tonal {
  color: #1f425a !important;
}

.occurrence-chip--at_least.v-btn--variant-tonal {
  color: #4a90ba !important;
}

.occurrence-chip--at_most.v-btn--variant-tonal {
  color: #336b91 !important;
}
</style>