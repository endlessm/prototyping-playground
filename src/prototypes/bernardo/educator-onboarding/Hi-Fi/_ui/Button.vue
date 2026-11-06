<script setup lang="ts">
import { usePrototypeNavigate } from '#studio/prototype'

// The system's button. Primary is the one orange action per screen, drawn with dark text: white on orange fails
// contrast. `kids` is the teal action of a youth-gated page. With a destination it opens that view of the prototype.
const props = withDefaults(
  defineProps<{ to?: string; variant?: 'primary' | 'secondary' | 'ghost' | 'disabled' | 'kids'; block?: boolean }>(),
  { variant: 'primary' },
)
const emit = defineEmits<{ click: [] }>()
const navigate = usePrototypeNavigate()

const look = {
  primary: { color: 'primary', variant: 'solid', class: 'text-highlighted' },
  secondary: { color: 'neutral', variant: 'outline', class: '' },
  ghost: { color: 'secondary', variant: 'ghost', class: '' },
  disabled: { color: 'neutral', variant: 'soft', class: '' },
  kids: { color: 'kids', variant: 'solid', class: 'text-highlighted' },
} as const

function select() {
  if (props.to) navigate(props.to)
  else emit('click')
}
</script>

<template>
  <UButton
    :color="look[variant].color"
    :variant="look[variant].variant"
    :disabled="variant === 'disabled'"
    :block="block"
    size="lg"
    :class="['justify-center font-semibold', look[variant].class]"
    @click="select"
  >
    <slot />
  </UButton>
</template>
