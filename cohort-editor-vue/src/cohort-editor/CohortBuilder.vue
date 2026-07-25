<template>
  <v-app>
    <v-container class="cohort-builder pa-4">
      <v-row class="mb-2">
        <v-col>
          <div class="text-eyebrow">
            Atlas3-style shell POC
          </div>
          <h1 class="text-page-title">
            Cohort Builder
          </h1>
          <div class="text-page-subtitle">
            Direct reactive JSON binding with an Atlas3-style layout.
          </div>
        </v-col>
      </v-row>

      <v-card class="mb-4 cohort-builder__toolbar-card" rounded="lg">
        <v-card-text>
                        <AtlasActionToolbar>
            <template #status>
              <CohortToolbarStatus
                :total-concept-sets="expression.ConceptSets?.length || 0"
                :validation-count="validationWarnings.length"
                :validation-color="validationColor"
                :is-dirty="isDirty"
              />
            </template>
            <template #actions>
              <CohortToolbarActions
                @show-concept-sets="showConceptSetsDialog = true"
                @show-validation="showValidationDialog = true"
                @toggle-json-preview="showJsonPreview = !showJsonPreview"
                @import-json="showJsonDialog = true"
                @export-json="exportJson"
                @reset="resetExpression"
              />
            </template>
          </AtlasActionToolbar>
        </v-card-text>
      </v-card>

      <div class="cohort-builder__main-row">
        <div class="cohort-builder__editor-pane">
          <CohortExpressionEditor
            :expression="expression"
            :concept-sets="availableConceptSets"
            @select-concept-set="openConceptSetSelection($event)"
            @edit-concept-set="openConceptSetSelection($event)"
            @clear-concept-set="() => undefined"
          />
        </div>

        <aside
          class="cohort-builder__preview-drawer"
          :class="{ 'cohort-builder__preview-drawer--open': showJsonPreview }"
        >
          <div class="cohort-builder__preview-rail">
            <v-btn
              class="cohort-builder__preview-toggle"
              icon
              variant="text"
              size="small"
              :title="showJsonPreview ? 'Hide live JSON preview' : 'Show live JSON preview'"
              @click="showJsonPreview = !showJsonPreview"
            >
              <v-icon>
                {{ showJsonPreview ? 'mdi-chevron-right' : 'mdi-chevron-left' }}
              </v-icon>
            </v-btn>

            <div
              v-if="!showJsonPreview"
              class="cohort-builder__preview-rail-label"
            >
              Live JSON
            </div>
          </div>

          <v-card
            v-show="showJsonPreview"
            class="cohort-builder__preview-card"
            rounded="lg"
          >
            <v-card-title class="d-flex align-center ga-2">
              <span>Live JSON Preview</span>
              <v-spacer />
              <v-btn
                size="small"
                variant="tonal"
                icon="mdi-content-copy"
                @click="copyJsonToClipboard"
              />
            </v-card-title>
            <v-card-text class="cohort-builder__preview-body">
              <pre>{{ jsonPreview }}</pre>
            </v-card-text>
          </v-card>
        </aside>
      </div>

      <CohortJsonDialog
        v-model="showJsonDialog"
        :json="jsonPreview"
        filename="cohort-expression.json"
        @apply="handleImportJson"
      />

      <ConceptSetsListDialog
        v-model="showConceptSetsDialog"
        :concept-sets="currentConceptSets"
        :used-concept-sets="currentConceptSets"
      />

      <ConceptSetSelectionDialog
        v-model="showConceptSetSelectionDialog"
        :local-concept-sets="availableConceptSets"
        :repository-concept-sets="mockRepositoryConceptSets"
        @select="applyConceptSetSelection"
      />

      <ValidationMessagesDialog
        v-model="showValidationDialog"
        :warnings="validationWarnings"
      />
    </v-container>
  </v-app>
</template>

<script setup lang="ts">
import { computed, reactive, ref, shallowRef } from 'vue'
import { AtlasActionToolbar } from '@/components/ui'
import CohortJsonDialog from './CohortJsonDialog.vue'
import CohortExpressionEditor from './CohortExpressionEditor.vue'
import ConceptSetsListDialog from './ConceptSetsListDialog.vue'
import ConceptSetSelectionDialog from './ConceptSetSelectionDialog.vue'
import CohortToolbarActions from './CohortToolbarActions.vue'
import CohortToolbarStatus from './CohortToolbarStatus.vue'
import ValidationMessagesDialog from './ValidationMessagesDialog.vue'
import {
  CohortExpressionSchema,
  type CohortExpression,
} from './circe.types'
import type { ConceptSetSelectionTarget } from './criteria/criteria-editor.types'

type ValidationSeverity = 'INFO' | 'WARNING' | 'CRITICAL'

interface ValidationWarning {
  severity: ValidationSeverity
  message: string
}

const expression = reactive<CohortExpression>({
  ...createDefaultExpression(),
})

const showJsonDialog = ref(false)
const showConceptSetsDialog = ref(false)
const showConceptSetSelectionDialog = ref(false)
const showValidationDialog = ref(false)
const showJsonPreview = ref(true)
const selectedConceptSetTarget = shallowRef<ConceptSetSelectionTarget | null>(null)
const initialSnapshot = JSON.stringify(expression)

const currentConceptSets = computed(() => {
  return (expression.ConceptSets || [])
    .filter((conceptSet): conceptSet is { id: number; name: string } => (
      conceptSet.id !== undefined && conceptSet.name !== undefined
    ))
    .map(conceptSet => ({ id: conceptSet.id, name: conceptSet.name }))
})

const mockRepositoryConceptSets = [
  { id: 101, name: 'Diabetes concepts' },
  { id: 102, name: 'Recent drug exposure' },
  { id: 103, name: 'Labs and measurements' },
  { id: 201, name: 'ICD-10 diabetes repository set' },
  { id: 202, name: 'Drug exposure repository set' },
  { id: 203, name: 'Measurement repository set' },
]

const availableConceptSets = computed(() => {
  const localConceptSets = [...currentConceptSets.value]
  const seen = new Set<number>()

  return localConceptSets
    .filter((conceptSet): conceptSet is { id: number; name: string } => (
      conceptSet.id !== undefined && conceptSet.name !== undefined
    ))
    .filter(conceptSet => {
      if (seen.has(conceptSet.id)) {
        return false
      }

      seen.add(conceptSet.id)
      return true
    })
    .map(conceptSet => ({ id: conceptSet.id, name: conceptSet.name }))
})

const validationWarnings = computed<ValidationWarning[]>(() => {
  const warnings: ValidationWarning[] = []

  if (!expression.Title?.trim()) {
    warnings.push({ severity: 'CRITICAL', message: 'Title is required.' })
  }

  if (!expression.PrimaryCriteria?.CriteriaList?.length) {
    warnings.push({ severity: 'WARNING', message: 'No primary criteria have been added yet.' })
  }

  if (!expression.ConceptSets?.length) {
    warnings.push({ severity: 'INFO', message: 'No concept sets are currently attached.' })
  }

  return warnings
})

const validationColor = computed<'success' | 'warning' | 'error' | 'info'>(() => {
  if (validationWarnings.value.some(warning => warning.severity === 'CRITICAL')) return 'error'
  if (validationWarnings.value.some(warning => warning.severity === 'WARNING')) return 'warning'
  if (validationWarnings.value.length > 0) return 'info'
  return 'success'
})

const isDirty = computed(() => JSON.stringify(expression) !== initialSnapshot)
const jsonPreview = computed(() => JSON.stringify(expression, null, 2))

function createDefaultExpression(): CohortExpression {
  return {
    Title: 'New Cohort',
    PrimaryCriteria: {
      CriteriaList: [],
      ObservationWindow: {
        PriorDays: 0,
        PostDays: 0,
      },
      PrimaryCriteriaLimit: { Type: 'First' },
    },
    QualifiedLimit: { Type: 'First' },
    ExpressionLimit: { Type: 'All' },
    ConceptSets: [createDemoConceptSet()],
    InclusionRules: [],
    CensoringCriteria: [],
    cdmVersionRange: '>=5.3',
  }
}

function createDemoConceptSet() {
  return {
    id: 1,
    name: 'Demo concept set',
  }
}

function handleImportJson(jsonString: string) {
  try {
    const parsed = JSON.parse(jsonString)
    const result = CohortExpressionSchema.safeParse(parsed)

    if (!result.success) {
      alert(`Validation error:\n${result.error.message}`)
      return
    }

    Object.assign(expression, result.data)
    showJsonDialog.value = false
  } catch (error) {
    alert(`Error importing JSON: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function exportJson() {
  const json = JSON.stringify(expression, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `cohort-${expression.Title?.replace(/\s+/g, '-') || 'new'}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function resetExpression() {
  Object.assign(expression, createDefaultExpression())
}

function openConceptSetSelection(target: ConceptSetSelectionTarget | undefined) {
  if (!target) {
    return
  }

  selectedConceptSetTarget.value = target
  showConceptSetSelectionDialog.value = true
}

function nextConceptSetId() {
  const ids = [...currentConceptSets.value, ...mockRepositoryConceptSets]
    .map(conceptSet => Number(conceptSet.id))
    .filter(id => Number.isFinite(id))

  return ids.length > 0 ? Math.max(...ids) + 1 : 1
}

function applyConceptSetSelection(conceptSet: { id: number | string; name: string }, source: 'local' | 'repository') {
  const target = selectedConceptSetTarget.value
  if (!target) {
    return
  }

  if (source === 'repository') {
    const importedConceptSet = {
      id: nextConceptSetId(),
      name: conceptSet.name,
    }
    expression.ConceptSets = [...(expression.ConceptSets || []), importedConceptSet]
    target.targetRef.value = importedConceptSet.id
  } else {
    target.targetRef.value = conceptSet.id as number
  }

  selectedConceptSetTarget.value = null
}

function copyJsonToClipboard() {
  navigator.clipboard.writeText(jsonPreview.value).then(() => {
    alert('JSON copied to clipboard')
  })
}

</script>

<style scoped lang="scss">
.cohort-builder {
  max-width: 1440px;
}

.cohort-builder__toolbar-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.cohort-builder__main-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.cohort-builder__editor-pane {
  flex: 1 1 auto;
  min-width: 0;
}

.cohort-builder__preview-drawer {
  flex: 0 0 48px;
  width: 48px;
  min-width: 48px;
  max-width: 48px;
  display: flex;
  align-items: stretch;
  gap: 8px;
  overflow: hidden;
  transition: flex-basis 0.25s ease, width 0.25s ease, min-width 0.25s ease, max-width 0.25s ease;
}

.cohort-builder__preview-drawer--open {
  flex-basis: 420px;
  width: 420px;
  min-width: 420px;
  max-width: 420px;
}

.cohort-builder__preview-rail {
  flex: 0 0 48px;
  width: 48px;
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgb(var(--v-theme-surface));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 0;
}

.cohort-builder__preview-toggle {
  color: rgb(var(--v-theme-primary));
}

.cohort-builder__preview-rail-label {
  writing-mode: sideways-lr;
  text-orientation: sideways;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.cohort-builder__preview-card {
  flex: 1 1 auto;
  min-width: 0;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  position: sticky;
  top: 16px;
  max-width: 100%;
}

.cohort-builder__preview-body {
  max-height: calc(100vh - 220px);
  overflow: auto;
  background: #f5f5f5;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.cohort-builder__preview-body pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

</style>