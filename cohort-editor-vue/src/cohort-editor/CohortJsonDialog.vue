<template>
  <v-dialog
    :model-value="modelValue"
    max-width="900"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="lg">
      <v-card-title class="d-flex flex-column align-start ga-1">
        <span class="text-eyebrow">JSON</span>
        <span class="text-h6">Cohort JSON</span>
        <span class="text-body-2 text-medium-emphasis">
          Edit the Atlas expression directly. Applying replaces the cohort logic.
        </span>
      </v-card-title>
      <v-card-text>
        <v-textarea
          v-model="draft"
          rows="18"
          auto-grow
          variant="outlined"
          spellcheck="false"
          placeholder="Paste an Atlas cohort expression..."
        />
        <v-alert
          v-if="errorMessage"
          class="mt-3"
          type="error"
          variant="tonal"
        >
          {{ errorMessage }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="tonal" @click="handleLoadFile">Load file</v-btn>
        <v-btn variant="tonal" @click="handleCopy">{{ copied ? 'Copied' : 'Copy' }}</v-btn>
        <v-btn variant="tonal" @click="handleDownload">Download</v-btn>
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Cancel</v-btn>
        <v-btn color="primary" @click="handleApply">Apply to builder</v-btn>
      </v-card-actions>
    </v-card>
    <input
      ref="fileInput"
      type="file"
      accept="application/json,.json"
      class="d-none"
      @change="onFileSelected"
    >
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  modelValue: boolean
  json: string
  filename?: string
  canApply?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  filename: 'cohort.json',
  canApply: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  apply: [json: string]
}>()

const draft = ref('')
const copied = ref(false)
const errorMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

watch(
  () => props.modelValue,
  open => {
    if (!open) return
    draft.value = props.json
    errorMessage.value = ''
    copied.value = false
  },
  { immediate: true }
)

const canApplyDraft = computed(() => props.canApply && !!draft.value.trim())

function handleLoadFile() {
  fileInput.value?.click()
}

function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    draft.value = String(reader.result || '')
    errorMessage.value = ''
  }
  reader.onerror = () => {
    errorMessage.value = 'Could not read file'
  }
  reader.readAsText(file)
  target.value = ''
}

function handleCopy() {
  navigator.clipboard.writeText(draft.value).then(() => {
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1500)
  })
}

function handleDownload() {
  const blob = new Blob([draft.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = props.filename
  link.click()
  URL.revokeObjectURL(url)
}

function handleApply() {
  if (!canApplyDraft.value) return
  emit('apply', draft.value)
}
</script>
