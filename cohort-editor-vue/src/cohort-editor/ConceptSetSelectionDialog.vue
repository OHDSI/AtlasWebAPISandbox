<template>
  <v-dialog
    :model-value="modelValue"
    max-width="960"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="lg">
      <v-card-title class="d-flex flex-column align-start ga-1">
        <span class="text-eyebrow">CONCEPT SET</span>
        <span class="text-h6">Select concept set</span>
      </v-card-title>

      <v-card-text class="d-flex flex-column ga-6">
        <section>
          <div class="text-subtitle-2 mb-2">
            In this definition
          </div>
          <v-alert
            v-if="localConceptSets.length === 0"
            type="info"
            variant="tonal"
            density="compact"
          >
            No local concept sets yet.
          </v-alert>
          <v-list
            v-else
            density="compact"
            nav
          >
            <v-list-item
              v-for="conceptSet in localConceptSets"
              :key="`local-${conceptSet.id}`"
              :title="conceptSet.name"
              :subtitle="`ID ${conceptSet.id}`"
              @click="selectLocal(conceptSet)"
            />
          </v-list>
        </section>

        <section>
          <div class="text-subtitle-2 mb-2">
            Repository concept sets
          </div>
          <v-alert
            v-if="repositoryConceptSets.length === 0"
            type="info"
            variant="tonal"
            density="compact"
          >
            Repository lookup is mocked for now.
          </v-alert>
          <v-list
            v-else
            density="compact"
            nav
          >
            <v-list-item
              v-for="conceptSet in repositoryConceptSets"
              :key="`repository-${conceptSet.id}`"
              :title="conceptSet.name"
              :subtitle="`Repository ID ${conceptSet.id}`"
              @click="selectRepository(conceptSet)"
            />
          </v-list>
        </section>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="tonal" @click="$emit('update:modelValue', false)">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
export interface ConceptSetReference {
  id: number | string
  name: string
  items?: unknown[]
}

interface Props {
  modelValue: boolean
  localConceptSets: ConceptSetReference[]
  repositoryConceptSets: ConceptSetReference[]
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [conceptSet: ConceptSetReference, source: 'local' | 'repository']
}>()

function selectLocal(conceptSet: ConceptSetReference) {
  emit('select', conceptSet, 'local')
  emit('update:modelValue', false)
}

function selectRepository(conceptSet: ConceptSetReference) {
  emit('select', conceptSet, 'repository')
  emit('update:modelValue', false)
}
</script>