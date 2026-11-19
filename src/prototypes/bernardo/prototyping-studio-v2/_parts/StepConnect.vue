<script setup lang="ts">
import { ref } from 'vue'
import Icon from './Icon.vue'
import Pill from './Pill.vue'
import { N } from './content'

// The product's Source, set once by whoever looks after the system: which
// pages come in, and how updates arrive.
type Sample = 'ready' | 'making' | 'help' | null
const pages: { title: string; included: boolean; sample: Sample }[] = [
  { title: 'Cohort overview', included: true, sample: 'ready' },
  { title: 'Leader dashboard', included: true, sample: 'ready' },
  { title: 'Game users', included: true, sample: 'help' },
  { title: 'AI literacy', included: true, sample: 'making' },
  { title: 'Settings', included: false, sample: null },
  { title: 'Admin · Users', included: false, sample: null },
]
const fields = [
  { label: 'Repository', value: 'Endless-Game-Making-Studio/studio', icon: 'folder-git-2' },
  { label: 'Branch', value: 'dev', icon: 'git-branch' },
]
const modes = [
  { key: 'manual', label: 'A maintainer presses “Pull now”', version: 'v1' },
  { key: 'notify', label: 'Tell us when the app changes', version: 'v2' },
  { key: 'release', label: 'Pull on every app release', version: 'v3' },
]
const mode = ref('manual')
</script>

<template>
  <div class="connect">
    <div class="crumbs">Endless Studios › Settings</div>
    <h1 class="title">{{ N.source }}</h1>
    <p class="lead">Where this product's screens and components come from. The Studio only reads it.</p>

    <div class="fields">
      <div v-for="f in fields" :key="f.label">
        <div class="field-label">{{ f.label }}</div>
        <div class="field"><Icon :name="f.icon" :size="15" class="muted-icon" />{{ f.value }}</div>
      </div>
    </div>

    <h2 class="found">
      Found in the app: 78 pages · 41 components
      <span class="found-meta">· last pull dev @ 05c2c7a, 8 Nov</span>
    </h2>
    <div class="pages">
      <div v-for="p in pages" :key="p.title" class="page">
        <span class="check" :class="{ on: p.included }">
          <Icon v-if="p.included" name="check" :size="11" />
        </span>
        <span class="page-title">{{ p.title }}</span>
        <Pill v-if="p.sample === 'ready'" tone="emerald">Sample ready</Pill>
        <Pill v-else-if="p.sample === 'making'" tone="sky">Sample written · in review</Pill>
        <Pill v-else-if="p.sample === 'help'" tone="rose">Agent needs help: which game?</Pill>
        <span v-else class="excluded">Not included</span>
      </div>
      <div class="page-more">
        + 72 more pages · the agent writes each sample and an engineer reviews it, like any other change
      </div>
    </div>

    <div class="updates">
      <div class="field-label">Getting updates</div>
      <div class="modes">
        <button
          v-for="m in modes"
          :key="m.key"
          type="button"
          class="mode"
          :class="{ on: mode === m.key }"
          :aria-pressed="mode === m.key"
          @click="mode = m.key"
        >
          {{ m.label }} <span class="version">{{ m.version }}</span>
        </button>
      </div>
      <div class="promise">
        <Icon name="clock" :size="12" /> Updates are listed for you to review. Your layouts never change by
        themselves.
      </div>
    </div>
  </div>
</template>

<style scoped>
.connect {
  padding: 32px;
  max-width: 768px;
}
.crumbs {
  font-size: 12px;
  color: var(--zinc-500);
}
.title {
  font-size: 20px;
  line-height: 28px;
  font-weight: 600;
  color: var(--zinc-900);
}
.lead {
  font-size: 13px;
  color: var(--zinc-600);
  margin-top: 4px;
}
.fields {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  font-size: 13px;
}
.field-label {
  color: var(--zinc-500);
  margin-bottom: 4px;
}
.field {
  height: 40px;
  border-radius: 8px;
  border: 1px solid var(--zinc-300);
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.muted-icon {
  color: var(--zinc-500);
}
.found {
  margin-top: 20px;
  font-size: 13px;
  font-weight: 600;
  color: var(--zinc-900);
}
.found-meta {
  font-weight: 400;
  color: var(--zinc-500);
}
.pages {
  margin-top: 8px;
  border-radius: 12px;
  border: 1px solid var(--zinc-200);
  font-size: 13px;
}
.page,
.page-more {
  padding: 8px 16px;
}
.page + .page,
.page + .page-more {
  border-top: 1px solid var(--zinc-100);
}
.page {
  display: flex;
  align-items: center;
  gap: 12px;
}
.check {
  height: 16px;
  width: 16px;
  border-radius: 4px;
  border: 1px solid var(--zinc-300);
  display: flex;
  align-items: center;
  justify-content: center;
}
.check.on {
  background: var(--zinc-900);
  border-color: var(--zinc-900);
  color: #fff;
}
.page-title {
  flex: 1;
  color: var(--zinc-800);
}
.excluded {
  font-size: 12px;
  color: var(--zinc-400);
}
.page-more {
  font-size: 12px;
  color: var(--zinc-500);
}
.updates {
  margin-top: 20px;
  font-size: 13px;
}
.modes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.mode {
  border-radius: 9999px;
  white-space: nowrap;
  padding: 6px 12px;
  border: 1px solid var(--zinc-200);
  color: var(--zinc-700);
  display: flex;
  align-items: center;
  gap: 6px;
}
.mode.on {
  border-color: var(--zinc-900);
  background: var(--zinc-900);
  color: #fff;
}
.version {
  font-size: 10px;
  border-radius: 4px;
  padding: 0 4px;
  background: var(--zinc-100);
}
.mode.on .version {
  background: rgb(255 255 255 / 0.2);
}
.promise {
  font-size: 12px;
  color: var(--zinc-500);
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
