<template>
  <v-dialog
    :model-value="modelValue"
    max-width="900"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="lg">
      <v-card-title class="d-flex flex-column align-start ga-1">
        <span class="text-eyebrow">CONCEPTS</span>
        <span class="text-h6">Concept Sets</span>
      </v-card-title>
      <v-card-text>
        <v-table density="compact">
          <thead>
            <tr>
              <th class="text-left">ID</th>
              <th class="text-left">Name</th>
              <th class="text-left">Concepts</th>
              <th class="text-left">Status</th>
              <th class="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="conceptSet in conceptSets"
              :key="conceptSet.id"
            >
              <td>{{ conceptSet.id }}</td>
              <td>{{ conceptSet.name }}</td>
              <td>{{ conceptSet.items?.length || 0 }}</td>
              <td>
                <v-chip
                  v-if="isUnused(conceptSet)"
                  size="small"
                  variant="outlined"
                  color="warning"
                >
                    Unused
                </v-chip>
              </td>
              <td>
                <AtlasIconButton
                  icon="mdi-pencil-outline"
                  ariaLabel="Edit"
                  variant="text"
                  size="sm"
                  @click="$emit('view', conceptSet)"
                />
                <AtlasIconButton
                  icon="mdi-delete-outline"
                  ariaLabel="Delete"
                  variant="text"
                  size="sm"
                  @click="$emit('delete', conceptSet)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
        <div
          v-if="conceptSets.length === 0"
          class="text-center py-8 text-medium-emphasis"
        >
          No concept sets in this cohort.
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="tonal" @click="$emit('update:modelValue', false)">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { AtlasIconButton } from '@/components/ui'

interface ConceptSetReference {
  id: number | string
  name: string
  items?: unknown[]
}

interface Props {
  modelValue: boolean
  conceptSets: ConceptSetReference[]
  usedConceptSets?: ConceptSetReference[]
}

const props = defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: boolean]
  view: [conceptSet: ConceptSetReference]
  delete: [conceptSet: ConceptSetReference]
}>()

function isUnused(conceptSet: ConceptSetReference): boolean {
  if (!props.usedConceptSets || props.usedConceptSets.length === 0) {
    return true
  }
  return !props.usedConceptSets.some(used => used.id === conceptSet.id)
}
</script>