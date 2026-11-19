<script setup lang="ts">
import { ref } from 'vue'
import Btn from './Btn.vue'
import Icon from './Icon.vue'
import Pill from './Pill.vue'
import Thumb from './Thumb.vue'
import type { Tone } from './content'

// A component's bench: variants, a playground, experiments, and the
// experiment on the real screens that use it.
type Tab = 'Variants' | 'Playground' | 'Experiments' | 'In real screens'
const TABS: Tab[] = ['Variants', 'Playground', 'Experiments', 'In real screens']
const LATER: Tab[] = ['Playground', 'In real screens']
const tab = ref<Tab>('Experiments')

const components = [
  { name: 'Button', experiments: 0 },
  { name: 'Card', experiments: 0 },
  { name: 'Badge', experiments: 0 },
  { name: 'ProgramTile', experiments: 2 },
  { name: 'UserCard', experiments: 1 },
  { name: 'Notification tile', experiments: 0 },
  { name: 'Table', experiments: 0 },
  { name: 'Modal', experiments: 0 },
]
const variants = ['Default', 'Enrolled', 'Completed', 'Locked', 'Empty', 'Long title']
const fields = [
  { label: 'Title', value: 'Threadbare' },
  { label: 'Status', value: 'Enrolled' },
  { label: 'Progress', value: '60%' },
]
const experiments: { title: string; by: string; status: string; tone: Tone; mine: boolean }[] = [
  { title: 'Bigger cover image', by: 'Bernardo · 2 days ago · 4 comments', status: 'Draft', tone: 'violet', mine: true },
  { title: 'Progress as a ring', by: 'Ada · last week · 2 comments', status: 'Waiting for review', tone: 'amber', mine: false },
]
const realScreens = [
  { title: 'Programs list', kind: 'cards' },
  { title: 'Leader dashboard', kind: 'cards' },
  { title: 'Profile', kind: 'profile' },
] as const
</script>

<template>
  <div class="lab">
    <div class="list">
      <div class="eyebrow">Components</div>
      <div v-for="c in components" :key="c.name" class="component" :class="{ on: c.name === 'ProgramTile' }">
        <span class="grow">{{ c.name }}</span>
        <Pill v-if="c.experiments > 0" tone="emerald">{{ c.experiments }}</Pill>
      </div>
    </div>

    <div class="bench">
      <div class="header">
        <h1 class="title">ProgramTile</h1>
        <span class="owner">Looked after by Ada</span>
      </div>
      <div class="tabs" role="tablist">
        <button
          v-for="t in TABS"
          :key="t"
          type="button"
          role="tab"
          class="tab"
          :class="{ on: tab === t }"
          :aria-selected="tab === t"
          @click="tab = t"
        >
          {{ t }}<Pill v-if="LATER.includes(t)" tone="violet">v2</Pill>
        </button>
      </div>

      <div v-if="tab === 'Variants'" class="variants">
        <div v-for="v in variants" :key="v">
          <div class="tile"><div class="tile-cover" /></div>
          <div class="caption">{{ v }}</div>
        </div>
      </div>

      <div v-else-if="tab === 'Playground'" class="playground">
        <div class="stage">
          <div class="tile big"><div class="tile-cover" /></div>
        </div>
        <div class="fields">
          <div v-for="f in fields" :key="f.label">
            <div class="field-label">{{ f.label }}</div>
            <div class="field">{{ f.value }}</div>
          </div>
        </div>
      </div>

      <div v-else-if="tab === 'Experiments'" class="experiments">
        <div v-for="e in experiments" :key="e.title" class="experiment">
          <div class="experiment-thumb"><div class="tile-cover" :class="{ tall: e.mine }" /></div>
          <div class="grow">
            <div class="experiment-title">{{ e.title }}</div>
            <div class="experiment-by">{{ e.by }}</div>
            <div class="experiment-status"><Pill :tone="e.tone">{{ e.status }}</Pill></div>
          </div>
          <div class="experiment-actions">
            <Btn small @click="tab = 'In real screens'">
              <Icon name="eye" :size="13" /> See in real screens <Pill tone="violet">v2</Pill>
            </Btn>
            <Btn v-if="e.mine" small primary><Icon name="git-pull-request" :size="13" /> Propose to Ada</Btn>
            <Btn v-else small><Icon name="message-square" :size="13" /> Open review</Btn>
          </div>
        </div>
        <button type="button" class="new">
          <Icon name="plus" :size="14" /> New experiment
          <span class="muted">· opens a prototype with this component</span>
        </button>
      </div>

      <div v-else class="real">
        <p class="real-intro">
          The experiment <b>Bigger cover image</b> shown on the real screens that use ProgramTile. Nothing
          changes in the app.
        </p>
        <div class="real-grid">
          <div v-for="s in realScreens" :key="s.title">
            <Thumb :kind="s.kind" :h="110" highlight />
            <div class="caption">{{ s.title }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lab {
  display: flex;
  height: 100%;
}
.list {
  width: 192px;
  flex-shrink: 0;
  border-right: 1px solid var(--zinc-200);
  padding: 12px;
  font-size: 13px;
}
.eyebrow {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  color: var(--zinc-400);
  margin-bottom: 4px;
  padding: 0 4px;
}
.component {
  padding: 6px 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  color: var(--zinc-700);
}
.component.on {
  background: var(--zinc-100);
  font-weight: 500;
  color: inherit;
}
.grow {
  flex: 1;
  min-width: 0;
}
.bench {
  flex: 1;
  min-width: 0;
  padding: 24px;
  overflow: auto;
}
.header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.title {
  flex: 1;
  font-size: 20px;
  line-height: 28px;
  font-weight: 600;
  color: var(--zinc-900);
}
.owner {
  font-size: 12px;
  color: var(--zinc-500);
}
.tabs {
  margin-top: 12px;
  display: flex;
  gap: 16px;
  border-bottom: 1px solid var(--zinc-200);
  font-size: 13px;
}
.tab {
  padding-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--zinc-500);
}
.tab.on {
  border-bottom: 2px solid var(--zinc-900);
  color: var(--zinc-900);
  font-weight: 500;
}
.variants {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.tile {
  height: 96px;
  border-radius: 6px;
  border: 1px solid var(--zinc-200);
  background: #fff;
  overflow: hidden;
}
.tile.big {
  width: 192px;
  height: 144px;
}
.tile-cover {
  height: 50%;
  background: var(--zinc-200);
}
.tile-cover.tall {
  height: 75%;
}
.caption {
  font-size: 12px;
  color: var(--zinc-600);
  margin-top: 4px;
}
.playground {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.stage {
  grid-column: span 2;
  border-radius: 12px;
  border: 1px solid var(--zinc-200);
  background: var(--slate-50);
  height: 224px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fields {
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.field-label {
  font-size: 12px;
  color: var(--zinc-500);
}
.field {
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--zinc-300);
  padding: 0 8px;
  display: flex;
  align-items: center;
}
.experiments {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.experiment {
  border-radius: 12px;
  border: 1px solid var(--zinc-200);
  padding: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
}
.experiment-thumb {
  width: 160px;
  height: 96px;
  flex-shrink: 0;
  border-radius: 6px;
  border: 1px solid var(--zinc-200);
  background: #fff;
  overflow: hidden;
}
.experiment-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--zinc-900);
}
.experiment-by {
  font-size: 12px;
  color: var(--zinc-500);
}
.experiment-status {
  margin-top: 8px;
}
.experiment-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.new {
  border-radius: 12px;
  border: 1px dashed var(--zinc-300);
  padding: 12px;
  font-size: 13px;
  color: var(--zinc-600);
  display: flex;
  align-items: center;
  gap: 8px;
}
.muted {
  color: var(--zinc-400);
}
.real {
  margin-top: 16px;
}
.real-intro {
  font-size: 13px;
  color: var(--zinc-600);
  margin-bottom: 12px;
}
.real-intro b {
  font-weight: 500;
}
.real-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
</style>
