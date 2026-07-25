<template>
  <v-btn
    :icon="icon"
    :color="vuetifyColor"
    :variant="variant"
    :size="vuetifySize"
    :loading="loading"
    :disabled="disabled"
    :aria-label="ariaLabel"
    v-bind="forwardAttrs"
    @click="$emit('click', $event)"
  />
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

export type AtlasIconButtonVariant = 'tonal' | 'text' | 'flat'
export type AtlasIconButtonSize = 'sm' | 'md' | 'lg'
export type AtlasIconButtonTone = 'primary' | 'neutral' | 'danger'

interface Props {
  icon: string
  ariaLabel: string
  variant?: AtlasIconButtonVariant
  size?: AtlasIconButtonSize
  tone?: AtlasIconButtonTone
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'tonal',
  size: 'md',
  tone: 'neutral',
})

defineEmits<{ click: [event: MouseEvent] }>()
defineOptions({ inheritAttrs: false })

const TONE_COLOR: Record<AtlasIconButtonTone, string | undefined> = {
  primary: 'primary',
  neutral: undefined,
  danger: 'error',
}

const vuetifyColor = computed(() => TONE_COLOR[props.tone])
const vuetifySize = computed(() => (props.size === 'sm' ? 'small' : props.size === 'lg' ? 'large' : 'default'))

const attrs = useAttrs()
const forwardAttrs = computed(() => {
  const { color: _color, size: _size, icon: _icon, variant: _variant, ...rest } = attrs as Record<string, unknown>
  void _color
  void _size
  void _icon
  void _variant
  return rest
})
</script>