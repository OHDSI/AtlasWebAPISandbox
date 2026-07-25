<template>
  <component
    v-if="editorComponent"
    :is="editorComponent"
    v-bind="editorProps"
    @remove="$emit('remove')"
    @select-concept-set="$emit('select-concept-set', $event)"
    @edit-concept-set="$emit('edit-concept-set', $event)"
    @clear-concept-set="$emit('clear-concept-set')"
  />

  <v-card
    v-else
    class="criteria-renderer__placeholder"
    rounded="lg"
    variant="outlined"
  >
    <v-card-text class="d-flex align-center ga-3 py-3">
      <div>
        <div class="text-subtitle-2">
          {{ wrapperKey }}
        </div>
        <div class="text-caption">
          Editor not implemented yet.
        </div>
      </div>

      <v-spacer />

      <v-btn
        icon="mdi-delete"
        variant="text"
        color="error"
        size="small"
        @click="$emit('remove')"
      />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getCriteriaWrapperKey, type Criteria, type CriteriaWrapperKey } from '../circe.types'
import ConditionEraEditor from './ConditionEraEditor.vue'
import ConditionOccurrenceEditor from './ConditionOccurrenceEditor.vue'
import DrugExposureEditor from './DrugExposureEditor.vue'
import type { ConceptSetOption, ConceptSetSelectionTarget } from './criteria-editor.types'

const props = defineProps<{
  criteria: Criteria
  conceptSets: ConceptSetOption[]
}>()

defineEmits<{
  remove: []
  'select-concept-set': [target: ConceptSetSelectionTarget | undefined]
  'edit-concept-set': [target: ConceptSetSelectionTarget | undefined]
  'clear-concept-set': []
}>()

const wrapperKey = computed(() => getCriteriaWrapperKey(props.criteria))

const editorMap: Partial<Record<CriteriaWrapperKey, unknown>> = {
  ConditionEra: ConditionEraEditor,
  ConditionOccurrence: ConditionOccurrenceEditor,
  DrugExposure: DrugExposureEditor,
}

const editorComponent = computed(() => editorMap[wrapperKey.value])

const editorProps = computed(() => {
  return {
    criteria: props.criteria,
    conceptSets: props.conceptSets,
  }
})
</script>

<style scoped>
.criteria-renderer__placeholder {
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.24);
}
</style>
