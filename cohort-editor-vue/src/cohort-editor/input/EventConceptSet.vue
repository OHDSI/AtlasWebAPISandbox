<template>
  <div
    class="event-concept-set-field"
    :class="{ 'event-concept-set-field--compact': props.compact }"
    data-testid="event-concept-set-field"
  >
    <div
      v-if="!props.compact"
      class="event-concept-set-field__title"
    >
      {{ props.label ?? 'Concept set' }}
    </div>
    <div class="event-concept-set-field__input">
      <v-btn
        v-if="!selectedConceptSet"
        variant="outlined"
        size="small"
        :data-testid="props.pickerTestId"
        @click="emit('select', selectionTarget)"
      >
        <v-icon
          start
          size="small"
        >
          mdi-plus
        </v-icon>
        {{ props.selectLabel ?? 'Select concept set' }}
      </v-btn>

      <v-chip
        v-else
        closable
        color="primary"
        variant="elevated"
        :data-testid="props.chipTestId"
        style="cursor: pointer"
        @click="emit('edit', selectionTarget)"
        @click:close="clearConceptSet"
      >
        {{ selectedConceptSet.name }}
      </v-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import type { ConceptSetOption, ConceptSetSelectionTarget } from '../criteria/criteria-editor.types'
import type { ConceptSetSelection } from '../circe.types'

const props = withDefaults(
  defineProps<{
    conceptSets: ConceptSetOption[]
    modelValue?: ConceptSetSelection
    label?: string
    selectLabel?: string
    compact?: boolean
    pickerTestId?: string
    chipTestId?: string
  }>(),
  {
    label: undefined,
    selectLabel: undefined,
    compact: false,
    pickerTestId: 'concept-set-picker',
    chipTestId: 'selected-concept-set',
  }
)

const selectionTarget = computed<ConceptSetSelectionTarget | undefined>(() => {
  if (!props.modelValue) {
    return undefined
  }

  return { targetRef: toRef(props.modelValue, 'CodesetId') }
})

const selectedConceptSet = computed(() => {
  const selectedId = props.modelValue?.CodesetId
  if (selectedId === undefined || selectedId === null) {
    return undefined
  }

  return props.conceptSets.find(conceptSet => conceptSet.id === selectedId)
})

const emit = defineEmits<{
  select: [target: ConceptSetSelectionTarget | undefined]
  clear: []
  edit: [target: ConceptSetSelectionTarget | undefined]
}>()

function clearConceptSet() {
  if (selectionTarget.value) {
    selectionTarget.value.targetRef.value = undefined
  }

  emit('clear')
}
</script>

<style scoped>
.event-concept-set-field {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 6px;
  border: 1px solid rgb(var(--v-theme-primary));
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

.event-concept-set-field__title {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  flex: 0 0 auto;
  min-width: 140px;
  color: rgb(var(--v-theme-primary));
  background: #ebf2fa;
  font-size: 13px;
  font-weight: 500;
  border-right: 1px solid rgb(var(--v-theme-primary));
}

.event-concept-set-field__input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  flex: 1 1 auto;
  color: rgb(var(--v-theme-primary));
}

.event-concept-set-field--compact {
  border: none;
  background: transparent;
  border-radius: 0;
}

.event-concept-set-field--compact .event-concept-set-field__input {
  padding: 0;
}
</style>