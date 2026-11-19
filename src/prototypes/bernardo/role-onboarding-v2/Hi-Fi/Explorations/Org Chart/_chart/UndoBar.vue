<script setup lang="ts">
import { useOrgChart } from './district'

// Removing someone takes one click, so it stays undoable for a few seconds instead of asking first.
const { removed, undo, dismiss } = useOrgChart()
</script>

<template>
  <div class="dock" role="status" aria-live="polite">
    <div v-if="removed" class="bar">
      <span>
        <strong>{{ removed.member.name }}</strong>
        removed from {{ removed.position.title }} in {{ removed.place.name }}
      </span>
      <button type="button" class="action undo" @click="undo">Undo</button>
      <button type="button" class="action" aria-label="Dismiss" @click="dismiss">
        <UIcon name="i-lucide-x" class="size-4" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.dock {
  position: fixed;
  right: 0;
  bottom: 24px;
  left: 0;
  z-index: 40;
  display: flex;
  justify-content: center;
  padding: 0 16px;
  pointer-events: none;
}

.bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 8px 16px;
  border-radius: 12px;
  background: var(--ui-bg-inverted);
  color: var(--ui-bg);
  font-size: 14px;
  line-height: 20px;
  box-shadow: 0 10px 24px rgb(0 0 0 / 0.18);
  pointer-events: auto;
}

.bar strong {
  font-weight: 600;
}

.action {
  display: flex;
  padding: 6px;
  border-radius: 8px;
  color: inherit;
  cursor: pointer;
}

.action:hover {
  background: rgb(255 255 255 / 0.12);
}

.action:focus-visible {
  outline: 2px solid var(--ui-bg);
  outline-offset: 2px;
}

.undo {
  padding: 6px 12px;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
