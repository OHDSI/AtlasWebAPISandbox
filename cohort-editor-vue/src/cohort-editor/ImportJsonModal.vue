<template>
  <v-dialog v-model="isOpen" max-width="600">
    <v-card>
      <v-card-title>Import Cohort Expression JSON</v-card-title>
      <v-card-text>
        <v-textarea
          v-model="jsonText"
          label="Paste JSON here"
          placeholder="{ Title: 'My Cohort', ... }"
          outlined
          rows="15"
          @keydown.tab.prevent="insertTab"
        />
        <v-alert v-if="validationError" type="error" class="mt-3">
          {{ validationError }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="cancel">Cancel</v-btn>
        <v-btn color="primary" @click="importJson">Import</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  import: [json: string]
}>()

const jsonText = ref('')
const validationError = ref('')

const isOpen = ref(props.open)

watch(
  () => props.open,
  (newVal) => {
    isOpen.value = newVal
  }
)

watch(isOpen, (newVal) => {
  emit('update:open', newVal)
})

/**
 * Insert tab in textarea (instead of changing focus)
 */
function insertTab(event: KeyboardEvent) {
  const textarea = event.target as HTMLTextAreaElement
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  jsonText.value = jsonText.value.substring(0, start) + '\t' + jsonText.value.substring(end)
  textarea.selectionStart = textarea.selectionEnd = start + 1
}

/**
 * Try to import the JSON
 */
function importJson() {
  validationError.value = ''

  if (!jsonText.value.trim()) {
    validationError.value = 'Please paste JSON content'
    return
  }

  try {
    // Try to parse to validate JSON syntax
    JSON.parse(jsonText.value)
  } catch (error) {
    validationError.value = `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`
    return
  }

  // Emit the JSON string for parent to validate with Zod
  emit('import', jsonText.value)
  jsonText.value = ''
  isOpen.value = false
}

/**
 * Cancel import
 */
function cancel() {
  jsonText.value = ''
  validationError.value = ''
  isOpen.value = false
}
</script>

<style scoped></style>
