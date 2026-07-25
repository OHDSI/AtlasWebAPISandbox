<template>
  <v-dialog
    :model-value="modelValue"
    max-width="800"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="lg">
      <v-card-title class="d-flex flex-column align-start ga-1">
        <span class="text-eyebrow">VALIDATION</span>
        <span class="text-h6">Validation Messages</span>
      </v-card-title>
      <v-card-text>
        <v-table density="compact">
          <thead>
            <tr>
              <th class="text-left" style="width: 120px">Severity</th>
              <th class="text-left">Message</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(warning, idx) in warnings"
              :key="idx"
            >
              <td>
                <v-chip
                  size="small"
                  variant="tonal"
                  :color="severityColor(warning.severity)"
                >
                  {{ warning.severity }}
                </v-chip>
              </td>
              <td>{{ warning.message }}</td>
            </tr>
          </tbody>
        </v-table>
        <div
          v-if="warnings.length === 0"
          class="text-center py-8 text-medium-emphasis"
        >
          No validation warnings.
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
type ValidationSeverity = 'INFO' | 'WARNING' | 'CRITICAL'

interface ValidationWarning {
  severity: ValidationSeverity
  message: string
}

interface Props {
  modelValue: boolean
  warnings: ValidationWarning[]
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function severityColor(severity: ValidationSeverity) {
  if (severity === 'CRITICAL') return 'error'
  if (severity === 'WARNING') return 'warning'
  return 'info'
}
</script>