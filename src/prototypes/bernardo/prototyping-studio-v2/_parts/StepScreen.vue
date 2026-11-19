<script setup lang="ts">
import { ref } from 'vue'
import Btn from './Btn.vue'
import Icon from './Icon.vue'
import Pill from './Pill.vue'
import ProdTag from './ProdTag.vue'
import Thumb from './Thumb.vue'
import { N, SAMPLES } from './content'
import { useWalkthrough } from './walkthrough'

// One app screen: its samples, where it's used, its history, and "Explore",
// which makes a view in a prototype stamped with where it came from.
const { go } = useWalkthrough()
const sample = ref(SAMPLES[0])
const open = ref(false)
const target = ref('Cohort invite flow')
const targets = ['New prototype', 'Cohort invite flow', 'Educator Onboarding']

const usedIn = [
  { title: 'Cohort invite flow', by: 'Ada, Bernardo' },
  { title: 'Educator Onboarding', by: 'Bernardo' },
  { title: 'Leader tour', by: 'Ana' },
]
const history = [
  { date: '8 Nov', change: '“Export CSV” button added' },
  { date: '6 Nov', change: '“Progress” column renamed' },
  { date: '12 Oct', change: 'First pulled' },
]
</script>

<template>
  <div class="detail">
    <div class="preview">
      <div class="crumbs">{{ N.screens }} › Leader › Programs</div>
      <div class="heading">
        <h1 class="title">Cohort overview</h1>
        <ProdTag />
      </div>
      <div class="samples">
        <button
          v-for="x in SAMPLES"
          :key="x"
          type="button"
          class="sample"
          :class="{ on: sample === x }"
          :aria-pressed="sample === x"
          @click="sample = x"
        >
          {{ x }}
        </button>
        <span class="samples-note">Samples written by the agent, reviewed by engineering</span>
      </div>
      <div class="screen">
        <Thumb
          kind="table"
          :h="330"
          :empty="sample === 'Empty cohort'"
          :highlight="sample === 'Missing consent'"
          extra
        />
      </div>
    </div>

    <aside class="side">
      <div class="explore">
        <button type="button" class="explore-button" :aria-expanded="open" @click="open = !open">
          <Icon name="pen-tool" :size="15" /> Explore this screen
        </button>
        <div v-if="open" class="popover">
          <div class="popover-label">Create a {{ N.view.toLowerCase() }} in…</div>
          <button
            v-for="x in targets"
            :key="x"
            type="button"
            class="target"
            :class="{ on: target === x }"
            :aria-pressed="target === x"
            @click="target = x"
          >
            <Icon v-if="x === 'New prototype'" name="plus" :size="13" />
            <Icon v-else name="pen-tool" :size="13" class="muted" />
            {{ x }}
            <Icon v-if="target === x" name="check" :size="13" class="check" />
          </button>
          <div class="origin">
            <Icon name="git-branch" :size="13" class="origin-icon" />
            <span>
              Based on the app as pulled on 8 Nov · sample “{{ sample }}”. You'll see ↻ if this screen
              changes in the app.
            </span>
          </div>
          <div class="create">
            <Btn primary small @click="go('canvas')">Create view <Icon name="arrow-right" :size="13" /></Btn>
          </div>
        </div>
      </div>

      <button type="button" class="comment">
        <Icon name="message-square" :size="14" /> Comment on this screen <Pill tone="violet">v2</Pill>
      </button>

      <div>
        <h2 class="side-heading">Used in</h2>
        <div v-for="u in usedIn" :key="u.title" class="used">
          <Icon name="pen-tool" :size="12" class="muted" />
          <span class="grow">{{ u.title }}</span>
          <span class="by">{{ u.by }}</span>
        </div>
      </div>

      <div>
        <h2 class="side-heading"><Icon name="history" :size="13" /> History</h2>
        <div v-for="h in history" :key="h.date" class="event">
          <span class="date">{{ h.date }}</span>
          <span class="change">{{ h.change }}</span>
        </div>
      </div>

      <div class="file">
        Pulled from dev @ 05c2c7a on 8 Nov ·
        frontend/app/pages/leader/programs/[programId]/cohorts/[cohortId]/index.vue
      </div>
    </aside>
  </div>
</template>

<style scoped>
.detail {
  display: flex;
  height: 100%;
}
.preview {
  flex: 1;
  min-width: 0;
  padding: 24px;
  overflow: auto;
}
.crumbs {
  font-size: 12px;
  color: var(--zinc-500);
}
.heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}
.title {
  font-size: 20px;
  line-height: 28px;
  font-weight: 600;
  color: var(--zinc-900);
}
.samples {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.sample {
  font-size: 12px;
  border-radius: 9999px;
  white-space: nowrap;
  padding: 4px 10px;
  border: 1px solid var(--zinc-200);
  color: var(--zinc-600);
}
.sample.on {
  border-color: var(--zinc-900);
  background: var(--zinc-900);
  color: #fff;
}
.samples-note {
  font-size: 11px;
  color: var(--zinc-400);
  align-self: center;
  margin-left: 4px;
}
.screen {
  margin-top: 12px;
  border-radius: 8px;
  box-shadow: 0 0 0 2px var(--sky-300);
}

.side {
  width: 288px;
  flex-shrink: 0;
  border-left: 1px solid var(--zinc-200);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-size: 13px;
  overflow: auto;
}
.explore {
  position: relative;
}
.explore-button {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  background: var(--zinc-900);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.popover {
  position: absolute;
  top: 48px;
  left: 0;
  right: 0;
  z-index: 10;
  border-radius: 12px;
  border: 1px solid var(--zinc-200);
  background: #fff;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  padding: 12px;
}
.popover-label {
  font-size: 12px;
  color: var(--zinc-500);
  margin-bottom: 8px;
}
.target {
  width: 100%;
  text-align: left;
  border-radius: 6px;
  padding: 6px 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.target.on {
  background: var(--zinc-100);
  font-weight: 500;
}
.check {
  margin-left: auto;
}
.muted {
  color: var(--zinc-400);
}
.origin {
  margin-top: 8px;
  border-radius: 6px;
  background: var(--sky-50);
  color: var(--sky-900);
  font-size: 12px;
  padding: 8px;
  display: flex;
  gap: 6px;
}
.origin-icon {
  margin-top: 2px;
}
.create {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}
.comment {
  width: 100%;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--zinc-300);
  font-size: 13px;
  color: var(--zinc-600);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.side-heading {
  font-size: 13px;
  font-weight: 600;
  color: var(--zinc-900);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.used {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}
.grow {
  flex: 1;
}
.by {
  font-size: 12px;
  color: var(--zinc-400);
}
.event {
  display: flex;
  gap: 8px;
  padding: 4px 0;
}
.date {
  width: 48px;
  flex-shrink: 0;
  color: var(--zinc-400);
}
.change {
  color: var(--zinc-700);
}
.file {
  margin-top: auto;
  font-size: 11px;
  line-height: 1.375;
  color: var(--zinc-400);
  overflow-wrap: anywhere;
}
</style>
