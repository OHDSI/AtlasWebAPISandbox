<template>
  <v-card
    class="condition-era-editor"
    rounded="lg"
    variant="outlined"
  >
    <v-card-text class="condition-era-editor__header d-flex align-center ga-3 py-3">
      <div class="condition-era-editor__title-block d-flex align-center ga-3 flex-wrap">
        <div class="condition-era-editor__type">
          Condition era of:
        </div>

        <EventConceptSet
          compact
          :concept-sets="conceptSets"
          :model-value="conditionEraConceptSetModel"
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
            class="condition-era-editor__add-attribute-button"
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
import { AtlasButton } from '@/components/ui'
import type { Criteria, CriteriaGroup, DateAdjustment, DateRange, NumericRange, ConceptSetSelection } from '../circe.types'
import EventConceptSet from '../input/EventConceptSet.vue'
import CriteriaAttributesEditor from './CriteriaAttributesEditor.vue'
import { createConceptSetComponentProps, createDefaultDateAdjustment, createSchemaFieldProps, ensureObjectField } from './criteria-editor-helper'
import type { ConceptArrayBinding, ConceptSetOption, ConceptSetSelectionTarget } from './criteria-editor.types'
import type { CriteriaAttributeSpec } from './criteria-editor.types'

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
      conditionEraData.value.First = true
    },
    clear: () => {
      delete conditionEraData.value.First
    },
    isActive: () => conditionEraData.value.First === true,
  },
  {
    key: 'DateAdjustment',
    label: 'Date adjustment',
    kind: 'dateAdjustment',
    componentProps: () => createSchemaFieldProps(
      ensureObjectField(conditionEraData.value, 'DateAdjustment', createDefaultDateAdjustment) as DateAdjustment
    ),
    init: () => {
      ensureObjectField(conditionEraData.value, 'DateAdjustment', createDefaultDateAdjustment)
    },
    clear: () => {
      delete conditionEraData.value.DateAdjustment
    },
    isActive: () => 'DateAdjustment' in conditionEraData.value,
  },
  {
    key: 'EraStartDate',
    label: 'Era start date',
    kind: 'dateRange',
    componentProps: () => createSchemaFieldProps(
      ensureObjectField(conditionEraData.value, 'EraStartDate', () => ({ Value: '', Op: 'gte', Extent: undefined })) as DateRange
    ),
    init: () => {
      ensureObjectField(conditionEraData.value, 'EraStartDate', () => ({ Value: '', Op: 'gte', Extent: undefined }))
    },
    clear: () => {
      delete conditionEraData.value.EraStartDate
    },
    isActive: () => 'EraStartDate' in conditionEraData.value,
  },
  {
    key: 'EraEndDate',
    label: 'Era end date',
    kind: 'dateRange',
    componentProps: () => createSchemaFieldProps(
      ensureObjectField(conditionEraData.value, 'EraEndDate', () => ({ Value: '', Op: 'gte', Extent: undefined })) as DateRange
    ),
    init: () => {
      ensureObjectField(conditionEraData.value, 'EraEndDate', () => ({ Value: '', Op: 'gte', Extent: undefined }))
    },
    clear: () => {
      delete conditionEraData.value.EraEndDate
    },
    isActive: () => 'EraEndDate' in conditionEraData.value,
  },
  {
    key: 'OccurrenceCount',
    label: 'Condition count',
    kind: 'numericRange',
    componentProps: () => createSchemaFieldProps(
      ensureObjectField(conditionEraData.value, 'OccurrenceCount', () => ({ Value: undefined, Op: 'gte', Extent: undefined })) as NumericRange
    ),
    init: () => {
      ensureObjectField(conditionEraData.value, 'OccurrenceCount', () => ({ Value: undefined, Op: 'gte', Extent: undefined }))
    },
    clear: () => {
      delete conditionEraData.value.OccurrenceCount
    },
    isActive: () => 'OccurrenceCount' in conditionEraData.value,
  },
  {
    key: 'EraLength',
    label: 'Era length',
    kind: 'numericRange',
    componentProps: () => createSchemaFieldProps(
      ensureObjectField(conditionEraData.value, 'EraLength', () => ({ Value: undefined, Op: 'gte', Extent: undefined })) as NumericRange
    ),
    init: () => {
      ensureObjectField(conditionEraData.value, 'EraLength', () => ({ Value: undefined, Op: 'gte', Extent: undefined }))
    },
    clear: () => {
      delete conditionEraData.value.EraLength
    },
    isActive: () => 'EraLength' in conditionEraData.value,
  },
  {
    key: 'AgeAtStart',
    label: 'Age at era start',
    kind: 'numericRange',
    componentProps: () => createSchemaFieldProps(
      ensureObjectField(conditionEraData.value, 'AgeAtStart', () => ({ Value: undefined, Op: 'gte', Extent: undefined })) as NumericRange
    ),
    init: () => {
      ensureObjectField(conditionEraData.value, 'AgeAtStart', () => ({ Value: undefined, Op: 'gte', Extent: undefined }))
    },
    clear: () => {
      delete conditionEraData.value.AgeAtStart
    },
    isActive: () => 'AgeAtStart' in conditionEraData.value,
  },
  {
    key: 'AgeAtEnd',
    label: 'Age at era end',
    kind: 'numericRange',
    componentProps: () => createSchemaFieldProps(
      ensureObjectField(conditionEraData.value, 'AgeAtEnd', () => ({ Value: undefined, Op: 'gte', Extent: undefined })) as NumericRange
    ),
    init: () => {
      ensureObjectField(conditionEraData.value, 'AgeAtEnd', () => ({ Value: undefined, Op: 'gte', Extent: undefined }))
    },
    clear: () => {
      delete conditionEraData.value.AgeAtEnd
    },
    isActive: () => 'AgeAtEnd' in conditionEraData.value,
  },
  {
    key: 'Gender',
    label: 'Gender',
    kind: 'conceptArray',
    componentProps: () => ({
      binding: {
        concepts: toRef(conditionEraData.value, 'Gender'),
      } satisfies ConceptArrayBinding,
    }),
    init: () => {
      ensureObjectField(conditionEraData.value, 'Gender', () => [])
    },
    clear: () => {
      delete conditionEraData.value.Gender
    },
    isActive: () => 'Gender' in conditionEraData.value,
  },
  {
    key: 'GenderCS',
    label: 'Gender concept set',
    kind: 'conceptSet',
    componentProps: () => createConceptSetComponentProps(
      ensureObjectField(conditionEraData.value, 'GenderCS', () => ({ CodesetId: undefined, IsExclusion: false })) as ConceptSetSelection,
      props.conceptSets,
      'Gender concept set',
      target => emit('select-concept-set', target),
      target => emit('edit-concept-set', target),
    ),
    init: () => {
      ensureObjectField(conditionEraData.value, 'GenderCS', () => ({ CodesetId: undefined, IsExclusion: false }))
    },
    clear: () => {
      delete conditionEraData.value.GenderCS
    },
    isActive: () => 'GenderCS' in conditionEraData.value,
  },
  {
    key: 'CorrelatedCriteria',
    label: 'Nested Criteria',
    kind: 'criteriaGroup',
    componentProps: () => ({
      group: ensureObjectField(conditionEraData.value, 'CorrelatedCriteria', () => ({})) as CriteriaGroup,
    }),
    init: () => {
      ensureObjectField(conditionEraData.value, 'CorrelatedCriteria', () => ({}))
    },
    clear: () => {
      delete conditionEraData.value.CorrelatedCriteria
    },
    isActive: () => 'CorrelatedCriteria' in conditionEraData.value,
  },
])

const activeAttributes = computed(() => attributeSpecs.value.filter(attribute => attribute.isActive()))

const availableAttributes = computed(() => attributeSpecs.value.filter(attribute => !attribute.isActive()))

const canAddAttribute = computed(() => availableAttributes.value.length > 0)

const conditionEraData = computed<Record<string, any>>(() => {
  const criteria = props.criteria as Record<string, any>
  if (!criteria.ConditionEra) {
    criteria.ConditionEra = {}
  }
  return criteria.ConditionEra
})

const conditionEraConceptSetModel = {
  get CodesetId() {
    return conditionEraData.value.CodesetId
  },
  set CodesetId(value: number | undefined) {
    conditionEraData.value.CodesetId = value
  },
} as ConceptSetSelection

function addAttribute(row: CriteriaAttributeSpec) {
  row.init()
}
</script>

<style scoped>
.condition-era-editor__type {
  font-weight: 600;
}

.condition-era-editor__add-attribute-button {
  text-transform: none;
  letter-spacing: 0;
}
</style>