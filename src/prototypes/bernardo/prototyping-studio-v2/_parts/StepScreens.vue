<script setup lang="ts">
import { computed, ref } from 'vue'
import Btn from './Btn.vue'
import Icon from './Icon.vue'
import Pill from './Pill.vue'
import Thumb from './Thumb.vue'
import { AREAS, N, SCREENS, STATUS, type Screen } from './content'
import { useWalkthrough } from './walkthrough'

// The library of the app's screens: only the chosen ones, each with a sample.
const { go } = useWalkthrough()
const area = ref('All')
const onlyChanged = ref(false)
const list = computed(() =>
  SCREENS.filter(
    (s) => (area.value === 'All' || s.area === area.value) && (!onlyChanged.value || s.status === 'changed'),
  ),
)
const updatedCount = SCREENS.filter((s) => s.status === 'changed').length

function usage(s: Screen) {
  if (s.status === 'removed') return `Still in ${s.used} prototypes, so it stays`
  if (s.used) return `In ${s.used} prototype${s.used > 1 ? 's' : ''}`
  return 'Not explored yet'
}
</script>

<template>
  <div class="screens">
    <div class="header">
      <h1 class="title">{{ N.screens }}</h1>
      <span class="from"><Icon name="lock" :size="12" /> From the app · dev @ 05c2c7a · read-only</span>
    </div>

    <div class="filters">
      <button
        v-for="a in AREAS"
        :key="a"
        type="button"
        class="chip"
        :class="{ on: area === a }"
        :aria-pressed="area === a"
        @click="area = a"
      >
        {{ a }}
      </button>
      <div class="grow" />
      <button
        type="button"
        class="chip updated"
        :class="{ on: onlyChanged }"
        :aria-pressed="onlyChanged"
        @click="onlyChanged = !onlyChanged"
      >
        ↻ Updated ({{ updatedCount }})
      </button>
    </div>

    <div v-if="list.length" class="grid">
      <button
        v-for="s in list"
        :key="s.title"
        type="button"
        class="screen"
        :class="{ unavailable: s.status === 'broken' }"
        :aria-disabled="s.status === 'broken' || undefined"
        @click="s.status !== 'broken' && go('screen')"
      >
        <div :class="{ removed: s.status === 'removed' }">
          <Thumb :kind="s.kind" :changed="s.status === 'changed'" :broken="s.status === 'broken'" />
        </div>
        <div class="name-row">
          <span class="name">{{ s.title }}</span>
          <Pill :tone="STATUS[s.status].tone">{{ STATUS[s.status].label }}</Pill>
        </div>
        <div class="route">{{ s.route }}</div>
        <div class="usage">{{ usage(s) }}</div>
      </button>
    </div>
    <p v-else class="none">No screens in {{ area }} were updated in the app.</p>

    <div class="more">
      <Icon name="plus" :size="15" />
      <span class="grow">
        66 more pages were found in the app but aren't included yet. Each one needs a sample before it
        can be shown.
      </span>
      <Btn small @click="go('connect')">Choose pages</Btn>
    </div>
  </div>
</template>

<style scoped>
.screens {
  padding: 24px;
}
.header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.title {
  flex: 1;
  font-size: 20px;
  line-height: 28px;
  font-weight: 600;
  letter-spacing: -0.025em;
  color: var(--zinc-900);
}
.from {
  font-size: 12px;
  color: var(--zinc-500);
  display: flex;
  align-items: center;
  gap: 4px;
}
.filters {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  height: 32px;
  padding: 0 12px;
  border-radius: 9999px;
  white-space: nowrap;
  font-size: 13px;
  border: 1px solid var(--zinc-200);
  color: var(--zinc-700);
}
.chip.on {
  background: var(--zinc-900);
  border-color: var(--zinc-900);
  color: #fff;
}
.chip.updated {
  border-color: var(--sky-200);
  background: var(--sky-50);
  color: var(--sky-800);
}
.chip.updated.on {
  border-color: var(--sky-600);
  background: var(--sky-600);
  color: #fff;
}
.grow {
  flex: 1;
}
.grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.screen {
  text-align: left;
  min-width: 0;
}
.screen.unavailable {
  cursor: default;
}
.removed {
  opacity: 0.5;
  filter: grayscale(1);
}
.name-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--zinc-900);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.route {
  font-size: 11px;
  color: var(--zinc-400);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.usage {
  font-size: 11px;
  color: var(--zinc-500);
}
.none {
  margin-top: 16px;
  font-size: 13px;
  color: var(--zinc-500);
}
.more {
  margin-top: 24px;
  border-radius: 12px;
  border: 1px dashed var(--zinc-300);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--zinc-600);
}
</style>
