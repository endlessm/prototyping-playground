<script setup lang="ts">
import Icon from './Icon.vue'

// One concept on the map, with the concepts it holds nested inside.
withDefaults(
  defineProps<{
    title: string
    sub?: string
    tone?: 'zinc' | 'violet' | 'sky' | 'amber' | 'emerald' | 'slate'
    dashed?: boolean
    icon?: string
  }>(),
  { sub: undefined, tone: 'zinc', icon: undefined },
)
</script>

<template>
  <div class="box" :class="[tone, { dashed }]">
    <div class="title">
      <Icon v-if="icon" :name="icon" :size="14" class="icon" />{{ title }}
    </div>
    <div v-if="sub" class="sub">{{ sub }}</div>
    <div v-if="$slots.default" class="children"><slot /></div>
  </div>
</template>

<style scoped>
.box {
  border-radius: 8px;
  border: 1px solid;
  padding: 8px 12px;
}
.dashed {
  border-style: dashed;
}
.zinc {
  border-color: var(--zinc-300);
  background: #fff;
}
.violet {
  border-color: var(--violet-300);
  background: var(--violet-50);
}
.sky {
  border-color: var(--sky-300);
  background: var(--sky-50);
}
.amber {
  border-color: var(--amber-300);
  background: var(--amber-50);
}
.emerald {
  border-color: var(--emerald-300);
  background: var(--emerald-50);
}
.slate {
  border-color: var(--slate-300);
  background: var(--slate-100);
}
.title {
  font-size: 13px;
  line-height: 1.5;
  font-weight: 600;
  color: var(--zinc-900);
  display: flex;
  align-items: center;
  gap: 6px;
}
.icon {
  color: var(--zinc-500);
}
.sub {
  font-size: 12px;
  line-height: 1.375;
  color: var(--zinc-600);
}
.children {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
