<template>
  <div class="cohort-toolbar-status">
    <v-chip
      size="small"
      variant="tonal"
    >
      Concept Sets {{ totalConceptSets }}
    </v-chip>

    <v-chip
      size="small"
      variant="tonal"
      :color="validationColor"
    >
      Validation {{ validationCount }}
    </v-chip>

    <v-chip
      size="small"
      variant="tonal"
      :color="isDirty ? 'primary' : undefined"
    >
      JSON {{ isDirty ? 'Dirty' : 'Clean' }}
    </v-chip>
  </div>
</template>

<script setup lang="ts">
interface Props {
  totalConceptSets: number
  validationCount: number
  validationColor: 'success' | 'warning' | 'error' | 'info'
  isDirty: boolean
}

defineProps<Props>()
</script>

<style scoped>
.cohort-toolbar-status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>