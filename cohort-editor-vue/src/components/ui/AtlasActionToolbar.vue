<template>
  <div class="builder-action-toolbar">
    <div
      v-if="$slots.status"
      class="builder-action-toolbar__status"
    >
      <slot name="status" />
    </div>
    <span
      v-if="$slots.status && $slots.actions"
      class="builder-action-toolbar__divider"
      aria-hidden="true"
    />
    <div
      v-if="$slots.actions"
      class="builder-action-toolbar__actions"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Shared action-row layout for the cohort builder shell.
</script>

<style scoped lang="scss">
.builder-action-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.builder-action-toolbar__status {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.builder-action-toolbar__divider {
  width: 1px;
  height: 24px;
  background: rgba(var(--v-theme-on-surface), 0.12);
  margin: 0 4px;
  flex-shrink: 0;
}

.builder-action-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
</style>