<script setup lang="ts">
import Icon from './Icon.vue'

withDefaults(
  defineProps<{ icon?: string; label: string; count?: number; active?: boolean; depth?: number }>(),
  { icon: undefined, count: undefined, depth: 0 },
)
</script>

<template>
  <button
    type="button"
    class="item"
    :class="{ active }"
    :aria-current="active ? 'page' : undefined"
    :style="{ paddingLeft: `${8 + depth * 14}px` }"
  >
    <Icon v-if="icon" :name="icon" :size="15" class="icon" />
    <span class="label">{{ label }}</span>
    <slot name="badge" />
    <span v-if="count != null" class="count">{{ count }}</span>
  </button>
</template>

<style scoped>
.item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 13px;
  line-height: 1.5;
  text-align: left;
  color: var(--zinc-700);
}
.item:hover {
  background: var(--zinc-50);
}
.item.active {
  background: var(--zinc-100);
  color: var(--zinc-900);
  font-weight: 500;
}
.icon {
  color: var(--zinc-500);
}
.label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.count {
  font-size: 11px;
  color: var(--zinc-400);
  font-variant-numeric: tabular-nums;
}
</style>
