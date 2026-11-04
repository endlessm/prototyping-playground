<script setup lang="ts">
import TextLink from './TextLink.vue'
import s from './wire.module.css'

// The Terms of Use as a box the person ticks themselves, so creating an account is never consent by default.
defineProps<{ checked?: boolean; error?: string }>()
</script>

<template>
  <div :class="[s.stack, s.tight]">
    <label :class="[s.row, s.label]" style="align-items: flex-start">
      <input type="checkbox" :class="s.checkbox" :checked="checked" style="margin-top: 2px" />
      <span :class="s.grow">I agree to the <TextLink>Terms of Use</TextLink></span>
      <slot name="note" />
    </label>
    <span v-if="error" :class="s.error">{{ error }}</span>
  </div>
</template>
