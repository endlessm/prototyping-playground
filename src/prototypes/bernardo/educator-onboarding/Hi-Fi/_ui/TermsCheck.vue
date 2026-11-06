<script setup lang="ts">
import TextLink from './TextLink.vue'
import s from './ui.module.css'

// The Terms of Use as a box the person ticks themselves, so creating an account is never consent by default.
defineProps<{ checked?: boolean; error?: string }>()
</script>

<template>
  <div :class="[s.stack, s.tight]">
    <div :class="s.row" style="align-items: flex-start">
      <UCheckbox :default-value="checked" :color="error ? 'error' : 'primary'" class="mt-0.5" aria-label="I agree to the Terms of Use" />
      <span :class="s.grow">I agree to the <TextLink>Terms of Use</TextLink></span>
      <slot name="note" />
    </div>
    <span v-if="error" :class="[s.error, 'flex items-center gap-1']"><UIcon name="i-lucide-circle-alert" />{{ error }}</span>
  </div>
</template>
