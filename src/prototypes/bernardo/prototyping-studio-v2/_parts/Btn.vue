<script setup lang="ts">
defineProps<{ primary?: boolean; small?: boolean }>()
</script>

<template>
  <button type="button" class="btn" :class="{ primary, small }"><slot /></button>
</template>

<style scoped>
.btn {
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  border: 1px solid var(--zinc-300);
  background: #fff;
  color: var(--zinc-800);
}
.btn:hover {
  border-color: var(--zinc-400);
}
.small {
  height: 32px;
  padding: 0 10px;
  font-size: 12px;
}
.primary,
.primary:hover {
  border-color: var(--zinc-900);
  background: var(--zinc-900);
  color: #fff;
}
</style>
