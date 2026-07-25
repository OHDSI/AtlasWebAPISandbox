<template>
  <div class="cohort-toolbar-actions">
    <AtlasIconButton
      icon="mdi-shape-outline"
      ariaLabel="Concept Sets"
      variant="text"
      size="sm"
      tone="primary"
      @click="$emit('show-concept-sets')"
    />
    <AtlasIconButton
      icon="mdi-alert-circle-outline"
      ariaLabel="Validation"
      variant="text"
      size="sm"
      tone="neutral"
      @click="$emit('show-validation')"
    />
    <AtlasIconButton
      icon="mdi-code-json"
      ariaLabel="Toggle JSON Preview"
      variant="text"
      size="sm"
      tone="neutral"
      @click="$emit('toggle-json-preview')"
    />
    <AtlasIconButton
      icon="mdi-form-textbox"
      ariaLabel="Import JSON"
      variant="text"
      size="sm"
      tone="neutral"
      @click="$emit('import-json')"
    />
    <AtlasIconButton
      icon="mdi-export-variant"
      ariaLabel="Export JSON"
      variant="text"
      size="sm"
      tone="primary"
      @click="$emit('export-json')"
    />
    <AtlasIconButton
      icon="mdi-refresh"
      ariaLabel="Reset"
      variant="text"
      size="sm"
      tone="danger"
      @click="$emit('reset')"
    />
  </div>
</template>

<script setup lang="ts">
import { AtlasIconButton } from '@/components/ui'

defineEmits<{
  (e: 'import-json'): void
  (e: 'show-concept-sets'): void
  (e: 'show-validation'): void
  (e: 'toggle-json-preview'): void
  (e: 'export-json'): void
  (e: 'reset'): void
}>()
</script>

<style scoped>
.cohort-toolbar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
</style>