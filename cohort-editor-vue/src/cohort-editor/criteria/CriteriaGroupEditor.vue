<template>
  <v-card
    class="criteria-group-editor"
    rounded="lg"
    variant="outlined"
  >
    <v-card-text class="criteria-group-editor__body d-flex">
      <v-menu
        v-model="showMatchTypeMenu"
        :close-on-content-click="false"
        location="end"
      >
        <template #activator="{ props: menuProps }">
          <div
            class="vertical-label-container"
            v-bind="menuProps"
          >
            <div
              class="vertical-label match-type-label"
              :data-type="group.Type || 'ALL'"
              :title="'Click to change group match type'"
            >
              {{ groupTypeLabel }}
            </div>
          </div>
        </template>

        <v-card class="match-type-menu">
          <v-card-text class="pa-3">
            <div class="segmented-buttons">
              <v-btn
                :variant="groupType === 'ALL' ? 'tonal' : 'outlined'"
                class="flex-1 match-chip--all"
                size="small"
                @click="groupType = 'ALL'"
              >
                All
              </v-btn>
              <v-btn
                :variant="groupType === 'ANY' ? 'tonal' : 'outlined'"
                class="flex-1 match-chip--any"
                size="small"
                @click="groupType = 'ANY'"
              >
                Any
              </v-btn>
              <v-btn
                :variant="groupType === 'AT_LEAST' ? 'tonal' : 'outlined'"
                class="flex-1 match-chip--at_least"
                size="small"
                @click="groupType = 'AT_LEAST'"
              >
                At least
              </v-btn>
              <v-btn
                :variant="groupType === 'AT_MOST' ? 'tonal' : 'outlined'"
                class="flex-1 match-chip--at_most"
                size="small"
                @click="groupType = 'AT_MOST'"
              >
                At most
              </v-btn>
            </div>

            <v-text-field
              v-if="groupType === 'AT_LEAST' || groupType === 'AT_MOST'"
              v-model="groupCount"
              class="mt-3"
              density="compact"
              hide-details
              label="Count"
              min="1"
              type="number"
            />
          </v-card-text>
        </v-card>
      </v-menu>

      <div class="flex-grow-1 criteria-group-editor__content">
        <div class="group-header d-flex align-center ga-3 mb-3">
          <v-menu>
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                variant="outlined"
                size="small"
                prepend-icon="mdi-plus"
              >
                Add Criteria
              </v-btn>
            </template>

            <v-list density="compact">
              <v-list-item
                title="ConditionOccurrence"
                @click="addCriteria('ConditionOccurrence')"
              />
              <v-list-item
                title="ConditionEra"
                @click="addCriteria('ConditionEra')"
              />
              <v-list-item
                title="DrugExposure"
                @click="addCriteria('DrugExposure')"
              />
            </v-list>
          </v-menu>

          <v-btn
            variant="outlined"
            size="small"
            prepend-icon="mdi-folder-plus"
            @click="addNestedGroup"
          >
            Add Group
          </v-btn>

          <v-spacer />

          <v-btn
            icon="mdi-delete"
            variant="text"
            color="error"
            size="small"
            @click="emit('remove')"
          />
        </div>

        <v-alert
          v-if="depth > 10"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          Deep nesting detected at level {{ depth }}.
        </v-alert>

        <div v-if="criteriaList.length > 0">
          <CorelatedCriteriaEditor
            v-for="(criteriaItem, index) in criteriaList"
            :key="`criteria-${index}`"
            :criteria="criteriaItem"
            :concept-sets="conceptSets"
            class="mb-3"
            @remove="removeCriteria(index)"
            @select-concept-set="emit('select-concept-set', $event)"
            @edit-concept-set="emit('edit-concept-set', $event)"
            @clear-concept-set="emit('clear-concept-set')"
          />
        </div>

        <v-alert
          v-else
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          No correlated criteria in this group yet.
        </v-alert>

        <div v-if="nestedGroups.length > 0">
          <CriteriaGroupEditor
            v-for="(nestedGroup, index) in nestedGroups"
            :key="`group-${index}`"
            :group="nestedGroup"
            :concept-sets="conceptSets"
            class="mb-3"
            :depth="depth + 1"
            @remove="removeNestedGroup(index)"
            @select-concept-set="emit('select-concept-set', $event)"
            @edit-concept-set="emit('edit-concept-set', $event)"
            @clear-concept-set="emit('clear-concept-set')"
          />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CriteriaGroup, CorelatedCriteria } from '../circe.types'
import type { ConceptSetOption, ConceptSetSelectionTarget } from './criteria-editor.types'
import { createDefaultWindow } from './window-utils'
import CorelatedCriteriaEditor from './CorelatedCriteriaEditor.vue'

defineOptions({ name: 'CriteriaGroupEditor' })

const props = defineProps<{
  group: CriteriaGroup
  conceptSets: ConceptSetOption[]
  depth?: number
}>()

const emit = defineEmits<{
  remove: []
  'select-concept-set': [target: ConceptSetSelectionTarget | undefined]
  'edit-concept-set': [target: ConceptSetSelectionTarget | undefined]
  'clear-concept-set': []
}>()

const depth = computed(() => props.depth ?? 0)

const showMatchTypeMenu = ref(false)

const groupType = computed({
  get: () => props.group.Type ?? 'ALL',
  set: value => {
    props.group.Type = value
  },
})

const groupCount = computed({
  get: () => props.group.Count?.toString() ?? '',
  set: value => {
    if (value === '' || value === null || value === undefined) {
      delete props.group.Count
      return
    }

    props.group.Count = Number(value)
  },
})

const groupTypeLabel = computed(() => {
  switch (groupType.value) {
    case 'ANY':
      return 'ANY'
    case 'AT_LEAST':
      return 'AT LEAST'
    case 'AT_MOST':
      return 'AT MOST'
    case 'ALL':
    default:
      return 'ALL'
  }
})

const criteriaList = computed(() => ensureCriteriaList())
const nestedGroups = computed(() => ensureNestedGroups())

function ensureCriteriaList() {
  if (!props.group.CriteriaList) {
    props.group.CriteriaList = []
  }
  return props.group.CriteriaList
}

function ensureNestedGroups() {
  if (!props.group.Groups) {
    props.group.Groups = []
  }
  return props.group.Groups
}

function createDefaultCorelatedCriteria(): CorelatedCriteria {
  return {
    Criteria: { ConditionOccurrence: {} },
    Occurrence: {
      Type: 2,
      Count: 1,
    },
    StartWindow: createDefaultWindow(),
    RestrictVisit: false,
    IgnoreObservationPeriod: false,
  }
}

function addCriteria(type: 'ConditionOccurrence' | 'ConditionEra' | 'DrugExposure') {
  const criteria = createDefaultCorelatedCriteria()
  criteria.Criteria = {
    [type]: {},
  } as CorelatedCriteria['Criteria']
  ensureCriteriaList().push(criteria)
}

function addNestedGroup() {
  ensureNestedGroups().push({
    Type: 'ALL',
    CriteriaList: [],
    Groups: [],
  })
}

function removeCriteria(index: number) {
  ensureCriteriaList().splice(index, 1)
}

function removeNestedGroup(index: number) {
  ensureNestedGroups().splice(index, 1)
}
</script>

<style scoped>
.criteria-group-editor {
  margin-bottom: 16px;
}

.criteria-group-editor__body {
  align-items: stretch;
}

.criteria-group-editor__content {
  padding-left: 12px;
}

.group-header {
  min-height: 40px;
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

.match-type-label {
  font-size: 14px;
}

.vertical-label-container:has(.match-type-label[data-type='ALL']) {
  border: 1px solid #1f425a;
}

.vertical-label-container:has(.match-type-label[data-type='ALL'])::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 30%;
  background: #1f425a;
  border-radius: 0 0 0 6px;
}

.match-type-label[data-type='ALL'] {
  color: #1f425a;
}

.vertical-label-container:has(.match-type-label[data-type='ANY']) {
  border: 1px solid #eb6622;
}

.vertical-label-container:has(.match-type-label[data-type='ANY'])::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 30%;
  background: #eb6622;
  border-radius: 0 0 0 6px;
}

.match-type-label[data-type='ANY'] {
  color: #eb6622;
}

.vertical-label-container:has(.match-type-label[data-type='AT_LEAST']) {
  border: 1px solid #69aed5;
}

.vertical-label-container:has(.match-type-label[data-type='AT_LEAST'])::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 30%;
  background: #69aed5;
  border-radius: 0 0 0 6px;
}

.match-type-label[data-type='AT_LEAST'] {
  color: #69aed5;
}

.vertical-label-container:has(.match-type-label[data-type='AT_MOST']) {
  border: 1px solid #336b91;
}

.vertical-label-container:has(.match-type-label[data-type='AT_MOST'])::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 30%;
  background: #336b91;
  border-radius: 0 0 0 6px;
}

.match-type-label[data-type='AT_MOST'] {
  color: #336b91;
}

.segmented-buttons {
  display: flex;
  gap: 4px;
}

.flex-1 {
  flex: 1;
}

.match-type-menu {
  min-width: 350px;
}

.match-chip--all.v-btn--variant-tonal {
  color: #1f425a !important;
}

.match-chip--any.v-btn--variant-tonal {
  color: #eb6622 !important;
}

.match-chip--at_least.v-btn--variant-tonal {
  color: #4a90ba !important;
}

.match-chip--at_most.v-btn--variant-tonal {
  color: #336b91 !important;
}

.criteria-group-editor__title {
  font-weight: 600;
}
</style>