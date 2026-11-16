<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import s from './wire.module.css'

// A button, or a link styled as one when it has a destination.
withDefaults(
  defineProps<{ to?: string; variant?: 'primary' | 'secondary' | 'ghost' | 'disabled'; block?: boolean }>(),
  { variant: 'primary' },
)
defineEmits<{ click: [] }>()
</script>

<template>
  <PrototypeLink
    v-if="to && variant !== 'disabled'"
    :to="to"
    :class="[s.button, variant !== 'primary' && s[variant], block && s.block]"
  >
    <slot />
  </PrototypeLink>
  <button
    v-else
    type="button"
    :class="[s.button, variant !== 'primary' && s[variant], block && s.block]"
    :disabled="variant === 'disabled'"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>
