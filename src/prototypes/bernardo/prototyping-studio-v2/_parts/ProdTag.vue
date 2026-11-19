<script setup lang="ts">
import Icon from './Icon.vue'
import { N } from './content'

// The mark of what exists: a screen as the app has it, read-only.
withDefaults(defineProps<{ date?: string; note?: string | null }>(), {
  date: '8 Nov',
  note: null,
})
</script>

<template>
  <span class="tag">
    <Icon name="lock" :size="9" />
    {{ N.prod.toUpperCase() }} · {{ date }}<span v-if="note" class="note"> · {{ note }}</span>
  </span>
</template>

<style scoped>
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  line-height: 1.5;
  font-weight: 600;
  letter-spacing: 0.025em;
  border-radius: 4px;
  background: var(--sky-600);
  color: #fff;
  padding: 2px 6px;
  white-space: nowrap;
}
.note {
  font-weight: 400;
  opacity: 0.8;
}
</style>
