<template>
  <v-card
    class="condition-occurrence-editor"
    rounded="lg"
    variant="outlined"
  >
    <v-card-text class="condition-occurrence-editor__header d-flex align-center ga-3 py-3">
      <div class="condition-occurrence-editor__title-block d-flex align-center ga-3 flex-wrap">
        <div class="condition-occurrence-editor__type">
          Condition occurrence of:
        </div>

        <EventConceptSet
          compact
          :concept-sets="conceptSets"
          :model-value="conditionOccurrenceConceptSetModel"
          :select-label="'Select concept set'"
          @select="emit('select-concept-set', $event)"
          @edit="emit('edit-concept-set', $event)"
          @clear="emit('clear-concept-set')"
        />
      </div>

      <v-spacer />

      <v-menu
        :close-on-content-click="true"
        location="bottom end"
        offset="8"
      >
        <template #activator="{ props: menuProps }">
          <AtlasButton
            v-bind="menuProps"
            class="condition-occurrence-editor__add-attribute-button"
            variant="secondary"
            size="sm"
            icon="mdi-plus"
            :disabled="!canAddAttribute"
          >
            Add Attribute
          </AtlasButton>
        </template>

        <v-list density="compact">
          <v-list-item
            v-for="attr in availableAttributes"
            :key="attr.key"
            :title="attr.label"
            @click="addAttribute(attr)"
          />
        </v-list>
      </v-menu>

      <v-btn
        icon="mdi-delete"
        variant="text"
        color="error"
        size="small"
        @click="emit('remove')"
      />
    </v-card-text>

    <v-divider />

    <v-card-text>
      <CriteriaAttributesEditor
        :attributes="activeAttributes"
        :concept-sets="conceptSets"
        @select-concept-set="emit('select-concept-set', $event)"
        @edit-concept-set="emit('edit-concept-set', $event)"
        @clear-concept-set="emit('clear-concept-set')"
      />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import type { Criteria, CriteriaGroup } from '../circe.types'
import { AtlasButton } from '@/components/ui'
import EventConceptSet from '../input/EventConceptSet.vue'
import type { ConceptSetOption, ConceptSetSelectionTarget } from './criteria-editor.types'
import CriteriaAttributesEditor from './CriteriaAttributesEditor.vue'
import type { ConceptArrayBinding, CriteriaAttributeSpec } from './criteria-editor.types'
import type { ConceptSetSelection, DateAdjustment, DateRange, TextFilter } from '../circe.types'
import { createConceptSetComponentProps, createDefaultDateAdjustment, createSchemaFieldProps, ensureObjectField } from './criteria-editor-helper'

const props = defineProps<{
  criteria: Criteria
  conceptSets: ConceptSetOption[]
}>()

const emit = defineEmits<{
  remove: []
  'select-concept-set': [target: ConceptSetSelectionTarget | undefined]
  'edit-concept-set': [target: ConceptSetSelectionTarget | undefined]
  'clear-concept-set': []
}>()

const attributeSpecs = computed<CriteriaAttributeSpec[]>(() => [
  {
    key: 'First',
    label: 'First in history',
    init: () => {
      conditionOccurrenceData.value.First = true
    },
    clear: () => {
      delete conditionOccurrenceData.value.First
    },
    isActive: () => conditionOccurrenceData.value.First === true,
  },
  {
    key: 'ConditionType',
    label: 'Condition type',
    kind: 'conceptArray',
    componentProps: () => ({
      binding: {
        concepts: toRef(conditionOccurrenceData.value, 'ConditionType'),
        exclude: toRef(conditionOccurrenceData.value, 'ConditionTypeExclude'),
      } satisfies ConceptArrayBinding,
    }),
    init: () => {
      conditionOccurrenceData.value.ConditionType = []
      conditionOccurrenceData.value.ConditionTypeExclude = false
    },
    clear: () => {
      delete conditionOccurrenceData.value.ConditionType
      delete conditionOccurrenceData.value.ConditionTypeExclude
    },
    isActive: () => 'ConditionType' in conditionOccurrenceData.value || 'ConditionTypeExclude' in conditionOccurrenceData.value,
  },
  {
    key: 'ConditionTypeCS',
    label: 'Condition type concept set',
    kind: 'conceptSet',
    componentProps: () => createConceptSetComponentProps(
      ensureObjectField(conditionOccurrenceData.value, 'ConditionTypeCS', () => ({ CodesetId: undefined, IsExclusion: false })) as ConceptSetSelection,
      props.conceptSets,
      'Condition type concept set',
      target => emit('select-concept-set', target),
      target => emit('edit-concept-set', target),
    ),
    init: () => {
      ensureObjectField(conditionOccurrenceData.value, 'ConditionTypeCS', () => ({ CodesetId: undefined, IsExclusion: false }))
    },
    clear: () => {
      delete conditionOccurrenceData.value.ConditionTypeCS
    },
    isActive: () => 'ConditionTypeCS' in conditionOccurrenceData.value,
  },
  {
    key: 'DateAdjustment',
    label: 'Date adjustment',
    kind: 'dateAdjustment',
    componentProps: () => createSchemaFieldProps(
      ensureObjectField(conditionOccurrenceData.value, 'DateAdjustment', createDefaultDateAdjustment) as DateAdjustment
    ),
    init: () => {
      ensureObjectField(conditionOccurrenceData.value, 'DateAdjustment', createDefaultDateAdjustment)
    },
    clear: () => {
      delete conditionOccurrenceData.value.DateAdjustment
    },
    isActive: () => 'DateAdjustment' in conditionOccurrenceData.value,
  },
  {
    key: 'OccurrenceStartDate',
    label: 'Occurrence start date',
    kind: 'dateRange',
    componentProps: () => createSchemaFieldProps(
      ensureObjectField(conditionOccurrenceData.value, 'OccurrenceStartDate', () => ({ Value: '', Op: 'gte', Extent: undefined })) as DateRange
    ),
    init: () => {
      ensureObjectField(conditionOccurrenceData.value, 'OccurrenceStartDate', () => ({ Value: '', Op: 'gte', Extent: undefined }))
    },
    clear: () => {
      delete conditionOccurrenceData.value.OccurrenceStartDate
    },
    isActive: () => 'OccurrenceStartDate' in conditionOccurrenceData.value,
  },
  {
    key: 'OccurrenceEndDate',
    label: 'Occurrence end date',
    kind: 'dateRange',
    componentProps: () => createSchemaFieldProps(
      ensureObjectField(conditionOccurrenceData.value, 'OccurrenceEndDate', () => ({ Value: '', Op: 'gte', Extent: undefined })) as DateRange
    ),
    init: () => {
      ensureObjectField(conditionOccurrenceData.value, 'OccurrenceEndDate', () => ({ Value: '', Op: 'gte', Extent: undefined }))
    },
    clear: () => {
      delete conditionOccurrenceData.value.OccurrenceEndDate
    },
    isActive: () => 'OccurrenceEndDate' in conditionOccurrenceData.value,
  },
  {
    key: 'ConditionSourceConcept',
    label: 'Condition source concept',
    kind: 'conceptSet',
    componentProps: () => createConceptSetComponentProps(
      conditionSourceConceptModel,
      props.conceptSets,
      'Select source concept',
      target => emit('select-concept-set', target),
      target => emit('edit-concept-set', target),
    ),
    init: () => {
      conditionOccurrenceData.value.ConditionSourceConcept = undefined
    },
    clear: () => {
      delete conditionOccurrenceData.value.ConditionSourceConcept
    },
    isActive: () => 'ConditionSourceConcept' in conditionOccurrenceData.value,
  },
  {
    key: 'Gender',
    label: 'Gender',
    kind: 'conceptArray',
    componentProps: () => ({
      binding: {
        concepts: toRef(conditionOccurrenceData.value, 'Gender'),
      } satisfies ConceptArrayBinding,
    }),
    init: () => {
      conditionOccurrenceData.value.Gender = []
    },
    clear: () => {
      delete conditionOccurrenceData.value.Gender
    },
    isActive: () => 'Gender' in conditionOccurrenceData.value,
  },
  {
    key: 'GenderCS',
    label: 'Gender concept set',
    kind: 'conceptSet',
    componentProps: () => createConceptSetComponentProps(
      ensureObjectField(conditionOccurrenceData.value, 'GenderCS', () => ({ CodesetId: undefined, IsExclusion: false })) as ConceptSetSelection,
      props.conceptSets,
      'Gender concept set',
      target => emit('select-concept-set', target),
      target => emit('edit-concept-set', target),
    ),
    init: () => {
      ensureObjectField(conditionOccurrenceData.value, 'GenderCS', () => ({ CodesetId: undefined, IsExclusion: false }))
    },
    clear: () => {
      delete conditionOccurrenceData.value.GenderCS
    },
    isActive: () => 'GenderCS' in conditionOccurrenceData.value,
  },
  {
    key: 'ProviderSpecialty',
    label: 'Provider specialty',
    kind: 'conceptArray',
    componentProps: () => ({
      binding: {
        concepts: toRef(conditionOccurrenceData.value, 'ProviderSpecialty'),
      } satisfies ConceptArrayBinding,
    }),
    init: () => {
      conditionOccurrenceData.value.ProviderSpecialty = []
    },
    clear: () => {
      delete conditionOccurrenceData.value.ProviderSpecialty
    },
    isActive: () => 'ProviderSpecialty' in conditionOccurrenceData.value,
  },
  {
    key: 'ProviderSpecialtyCS',
    label: 'Provider specialty concept set',
    kind: 'conceptSet',
    componentProps: () => createConceptSetComponentProps(
      ensureObjectField(conditionOccurrenceData.value, 'ProviderSpecialtyCS', () => ({ CodesetId: undefined, IsExclusion: false })) as ConceptSetSelection,
      props.conceptSets,
      'Provider specialty concept set',
      target => emit('select-concept-set', target),
      target => emit('edit-concept-set', target),
    ),
    init: () => {
      ensureObjectField(conditionOccurrenceData.value, 'ProviderSpecialtyCS', () => ({ CodesetId: undefined, IsExclusion: false }))
    },
    clear: () => {
      delete conditionOccurrenceData.value.ProviderSpecialtyCS
    },
    isActive: () => 'ProviderSpecialtyCS' in conditionOccurrenceData.value,
  },
  {
    key: 'VisitType',
    label: 'Visit type',
    kind: 'conceptArray',
    componentProps: () => ({
      binding: {
        concepts: toRef(conditionOccurrenceData.value, 'VisitType'),
      } satisfies ConceptArrayBinding,
    }),
    init: () => {
      conditionOccurrenceData.value.VisitType = []
    },
    clear: () => {
      delete conditionOccurrenceData.value.VisitType
    },
    isActive: () => 'VisitType' in conditionOccurrenceData.value,
  },
  {
    key: 'VisitTypeCS',
    label: 'Visit type concept set',
    kind: 'conceptSet',
    componentProps: () => createConceptSetComponentProps(
      ensureObjectField(conditionOccurrenceData.value, 'VisitTypeCS', () => ({ CodesetId: undefined, IsExclusion: false })) as ConceptSetSelection,
      props.conceptSets,
      'Visit type concept set',
      target => emit('select-concept-set', target),
      target => emit('edit-concept-set', target),
    ),
    init: () => {
      ensureObjectField(conditionOccurrenceData.value, 'VisitTypeCS', () => ({ CodesetId: undefined, IsExclusion: false }))
    },
    clear: () => {
      delete conditionOccurrenceData.value.VisitTypeCS
    },
    isActive: () => 'VisitTypeCS' in conditionOccurrenceData.value,
  },
  {
    key: 'ConditionStatus',
    label: 'Condition status',
    kind: 'conceptArray',
    componentProps: () => ({
      binding: {
        concepts: toRef(conditionOccurrenceData.value, 'ConditionStatus'),
      } satisfies ConceptArrayBinding,
    }),
    init: () => {
      conditionOccurrenceData.value.ConditionStatus = []
    },
    clear: () => {
      delete conditionOccurrenceData.value.ConditionStatus
    },
    isActive: () => 'ConditionStatus' in conditionOccurrenceData.value,
  },
  {
    key: 'ConditionStatusCS',
    label: 'Condition status concept set',
    kind: 'conceptSet',
    componentProps: () => createConceptSetComponentProps(
      ensureObjectField(conditionOccurrenceData.value, 'ConditionStatusCS', () => ({ CodesetId: undefined, IsExclusion: false })) as ConceptSetSelection,
      props.conceptSets,
      'Condition status concept set',
      target => emit('select-concept-set', target),
      target => emit('edit-concept-set', target),
    ),
    init: () => {
      ensureObjectField(conditionOccurrenceData.value, 'ConditionStatusCS', () => ({ CodesetId: undefined, IsExclusion: false }))
    },
    clear: () => {
      delete conditionOccurrenceData.value.ConditionStatusCS
    },
    isActive: () => 'ConditionStatusCS' in conditionOccurrenceData.value,
  },
  {
    key: 'StopReason',
    label: 'Stop reason',
    kind: 'textFilter',
    componentProps: () => createSchemaFieldProps(
      ensureObjectField(conditionOccurrenceData.value, 'StopReason', () => ({ Value: '', Op: 'contains' })) as TextFilter
    ),
    init: () => {
      ensureObjectField(conditionOccurrenceData.value, 'StopReason', () => ({ Value: '', Op: 'contains' }))
    },
    clear: () => {
      delete conditionOccurrenceData.value.StopReason
    },
    isActive: () => 'StopReason' in conditionOccurrenceData.value,
  },
  {
    key: 'CorrelatedCriteria',
    label: 'Nested Criteria',
    kind: 'criteriaGroup',
    componentProps: () => ({
      group: ensureObjectField(conditionOccurrenceData.value, 'CorrelatedCriteria', () => ({})) as CriteriaGroup,
    }),
    init: () => {
      ensureObjectField(conditionOccurrenceData.value, 'CorrelatedCriteria', () => ({}))
    },
    clear: () => {
      delete conditionOccurrenceData.value.CorrelatedCriteria
    },
    isActive: () => 'CorrelatedCriteria' in conditionOccurrenceData.value,
  },
])

const activeAttributes = computed(() => attributeSpecs.value.filter(attribute => attribute.isActive()))

const availableAttributes = computed(() => attributeSpecs.value.filter(attribute => !attribute.isActive()))

const canAddAttribute = computed(() => availableAttributes.value.length > 0)

const conditionOccurrenceData = computed<Record<string, any>>(() => {
  const criteria = props.criteria as Record<string, any>
  if (!criteria.ConditionOccurrence) {
    criteria.ConditionOccurrence = {}
  }
  return criteria.ConditionOccurrence
})

const conditionOccurrenceConceptSetModel = {
  get CodesetId() {
    return conditionOccurrenceData.value.CodesetId
  },
  set CodesetId(value: number | undefined) {
    conditionOccurrenceData.value.CodesetId = value
  },
} as ConceptSetSelection

const conditionSourceConceptModel = {
  get CodesetId() {
    return conditionOccurrenceData.value.ConditionSourceConcept
  },
  set CodesetId(value: number | undefined) {
    conditionOccurrenceData.value.ConditionSourceConcept = value
  },
} as ConceptSetSelection

function addAttribute(row: CriteriaAttributeSpec) {
  row.init()
}

</script>

<style scoped>
.condition-occurrence-editor__type {
  font-weight: 600;
}

.condition-occurrence-editor__add-attribute-button {
  text-transform: none;
  letter-spacing: 0;
}
</style>
