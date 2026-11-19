<script setup lang="ts">
import Btn from './Btn.vue'
import Icon from './Icon.vue'
import Pill from './Pill.vue'
import { N, type StepId } from './content'
import { useWalkthrough } from './walkthrough'

// The product's home answers three questions: what changed in the app,
// which prototypes it touched, and what the team is exploring.
const { go } = useWalkthrough()

const prototypes: { title: string; by: string; updates?: string; to?: StepId }[] = [
  { title: 'Cohort invite flow', by: 'Ada, Bernardo', updates: '↻ 2 updates', to: 'canvas' },
  { title: 'Educator Onboarding', by: 'Bernardo', updates: '↻ 1 update', to: 'canvas' },
  { title: 'Comments', by: 'Bernardo' },
]
const changed = [
  { title: 'Cohort overview', date: '8 Nov' },
  { title: 'Programs list', date: '7 Nov' },
  { title: 'Program page', date: '6 Nov' },
]
const experiments = [
  { title: 'ProgramTile · Bigger cover', by: 'Bernardo' },
  { title: 'ProgramTile · Progress ring', by: 'Ada · in review' },
]
</script>

<template>
  <div class="home">
    <h1 class="title">Endless Studios</h1>
    <p class="lead">The learning platform's real screens, its design system and what the team is exploring.</p>

    <div class="source">
      <Icon name="folder-git-2" :size="26" class="source-icon" />
      <div class="source-text">
        <div class="eyebrow">{{ N.source }}</div>
        <div class="repo">Endless-Game-Making-Studio/studio · <span class="branch">dev</span></div>
        <div class="meta">Last pull 2 days ago (dev @ 05c2c7a) · 12 screens · 41 components</div>
      </div>
      <Pill tone="sky">↻ 3 screens updated</Pill>
      <Btn @click="go('screens')">Review updates</Btn>
      <Btn primary><Icon name="refresh-cw" :size="14" /> Pull now</Btn>
    </div>

    <div class="columns">
      <div>
        <h2 class="heading">Your prototypes</h2>
        <button
          v-for="p in prototypes"
          :key="p.title"
          type="button"
          class="row"
          @click="p.to && go(p.to)"
        >
          <Icon name="pen-tool" :size="13" class="muted" />
          <span class="row-title">{{ p.title }}</span>
          <Pill v-if="p.updates" tone="sky">{{ p.updates }}</Pill>
          <span class="muted">{{ p.by }}</span>
        </button>
        <p class="hint">↻ means the app changed after this prototype started. It's news, not an error.</p>
      </div>
      <div>
        <h2 class="heading">Changed in the app</h2>
        <button v-for="c in changed" :key="c.title" type="button" class="row" @click="go('screen')">
          <span class="dot" />
          <span class="row-title">{{ c.title }}</span>
          <span class="muted">{{ c.date }}</span>
        </button>
        <h2 class="heading lab">In the {{ N.lab }}</h2>
        <button v-for="e in experiments" :key="e.title" type="button" class="row" @click="go('lab')">
          <Icon name="flask-conical" :size="13" class="muted" />
          <span class="row-title">{{ e.title }}</span>
          <span class="muted">{{ e.by }}</span>
        </button>
      </div>
    </div>

    <div class="footer">
      <span>
        <b>{{ N.system }}:</b> Endless Studios UI (default) · Button updated yesterday, already in every view
      </span>
      <span><b>Context:</b> 6 docs · <b>Skills:</b> 4</span>
    </div>
  </div>
</template>

<style scoped>
.home {
  padding: 32px;
  max-width: 896px;
}
.title {
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
  letter-spacing: -0.025em;
  color: var(--zinc-900);
}
.lead {
  color: var(--zinc-600);
  margin-top: 4px;
}
.source {
  margin-top: 24px;
  border-radius: 12px;
  border: 1px solid var(--zinc-200);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.source-icon {
  color: var(--zinc-700);
}
.source-text {
  flex: 1;
  min-width: 0;
}
.eyebrow {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  color: var(--zinc-400);
}
.repo {
  font-weight: 500;
  color: var(--zinc-900);
}
.branch {
  font-weight: 400;
}
.meta {
  font-size: 13px;
  color: var(--zinc-500);
}
.columns {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.heading {
  font-size: 13px;
  font-weight: 600;
  color: var(--zinc-900);
  margin-bottom: 8px;
}
.heading.lab {
  margin-top: 20px;
}
.row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--zinc-100);
  font-size: 13px;
  text-align: left;
}
.row-title {
  flex: 1;
  color: var(--zinc-800);
}
.muted {
  color: var(--zinc-400);
}
.dot {
  height: 8px;
  width: 8px;
  border-radius: 50%;
  background: var(--sky-500);
}
.hint {
  font-size: 12px;
  color: var(--zinc-500);
  margin-top: 8px;
}
.footer {
  margin-top: 24px;
  border-radius: 12px;
  background: var(--zinc-50);
  padding: 12px 16px;
  font-size: 13px;
  color: var(--zinc-600);
  display: flex;
  gap: 24px;
}
.footer b {
  font-weight: 500;
  color: var(--zinc-800);
}
</style>
