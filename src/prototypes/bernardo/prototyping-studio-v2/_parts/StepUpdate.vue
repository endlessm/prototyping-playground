<script setup lang="ts">
import { ref } from 'vue'
import Btn from './Btn.vue'
import Icon from './Icon.vue'
import ProdTag from './ProdTag.vue'
import Thumb from './Thumb.vue'

// The app changed after a view started from it. The layout never changes by
// itself: the agent explains the change and the person chooses.
const when = ref<'then' | 'now'>('now')
const choice = ref<'keep' | 'restart' | 'carry' | null>(null)
const moments = [
  { key: 'then', label: 'when you started' },
  { key: 'now', label: 'now' },
] as const
</script>

<template>
  <div class="update">
    <div class="crumbs">Cohort invite flow › Option A</div>
    <h1 class="title">Option A · based on the app @ 6 Nov</h1>

    <div class="notice">
      <div class="notice-title"><Icon name="refresh-cw" :size="15" /> The app changed twice since you started</div>
      <ul class="changes">
        <li><Icon name="sparkles" :size="13" class="bullet" /> An “Export CSV” button was added to the header.</li>
        <li><Icon name="sparkles" :size="13" class="bullet" /> The “Progress” column is now called “Tasks done”.</li>
      </ul>
      <div class="choices">
        <Btn @click="choice = 'keep'">Keep mine</Btn>
        <Btn @click="choice = 'restart'">Start over from latest</Btn>
        <Btn primary @click="choice = 'carry'">
          <Icon name="sparkles" :size="14" /> Carry over with the agent <span class="version">v2</span>
        </Btn>
      </div>
      <div aria-live="polite">
        <div v-if="choice" class="outcome">
          <template v-if="choice === 'keep'">
            Your layout stays as it is and still remembers it started on 6 Nov. The notice goes away until
            this screen changes again.
          </template>
          <template v-else-if="choice === 'restart'">
            A new view is made from the app's latest screen, next to your Option A. Nothing is deleted.
          </template>
          <template v-else>
            The agent made <b>Option A · v2</b> with both changes. Check it before it replaces your version.
            <span class="link">Review v2</span>
          </template>
        </div>
      </div>
    </div>

    <div class="compare">
      <div>
        <div class="label"><span class="dot" /> Your version</div>
        <div class="frame mine"><Thumb kind="table" :h="200" highlight /></div>
      </div>
      <div>
        <div class="label">
          <ProdTag :date="when === 'now' ? '8 Nov' : '6 Nov'" :note="when === 'now' ? null : 'picture'" />
          {{ when === 'now' ? 'latest pull' : 'when you started' }}
        </div>
        <div class="frame app">
          <Thumb kind="table" :h="200" :extra="when === 'now'" :changed="when === 'now'" />
        </div>
      </div>
    </div>

    <div class="controls">
      Show the app:
      <div class="segmented">
        <button
          v-for="m in moments"
          :key="m.key"
          type="button"
          :class="{ on: when === m.key }"
          :aria-pressed="when === m.key"
          @click="when = m.key"
        >
          {{ m.label }}
        </button>
      </div>
      <span class="together">
        <span class="box"><Icon name="check" :size="10" /></span> Scroll together
      </span>
    </div>

    <div class="system">
      <Icon name="shapes" :size="13" /> Components inside your layout follow the design system, so a Button
      change shows up in every view. That arrives as its own notice.
    </div>
  </div>
</template>

<style scoped>
.update {
  padding: 24px;
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
.notice {
  margin-top: 12px;
  border-radius: 12px;
  border: 1px solid var(--sky-200);
  background: var(--sky-50);
  padding: 16px;
}
.notice-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--sky-950);
  display: flex;
  align-items: center;
  gap: 6px;
}
.changes {
  margin-top: 6px;
  font-size: 13px;
  color: var(--sky-900);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.changes li {
  display: flex;
  gap: 6px;
}
.bullet {
  margin-top: 2px;
}
.choices {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.version {
  font-size: 10px;
  border-radius: 4px;
  background: rgb(255 255 255 / 0.2);
  padding: 0 4px;
}
.outcome {
  margin-top: 12px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid var(--sky-200);
  padding: 12px;
  font-size: 13px;
  color: var(--zinc-700);
}
.outcome b {
  font-weight: 500;
}
.link {
  text-decoration: underline;
}
.compare {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.label {
  font-size: 12px;
  color: var(--zinc-500);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.dot {
  height: 10px;
  width: 10px;
  border-radius: 50%;
  background: var(--violet-500);
}
.frame {
  border-radius: 8px;
}
.frame.mine {
  box-shadow: 0 0 0 2px var(--violet-300);
}
.frame.app {
  box-shadow: 0 0 0 2px var(--sky-300);
}
.controls {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--zinc-600);
}
.segmented {
  display: flex;
  border-radius: 8px;
  border: 1px solid var(--zinc-300);
  overflow: hidden;
}
.segmented button {
  padding: 4px 10px;
  background: #fff;
}
.segmented button.on {
  background: var(--zinc-900);
  color: #fff;
}
.together {
  display: flex;
  align-items: center;
  gap: 4px;
}
.box {
  height: 14px;
  width: 14px;
  border-radius: 4px;
  border: 1px solid var(--zinc-900);
  background: var(--zinc-900);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.system {
  margin-top: 12px;
  font-size: 12px;
  color: var(--zinc-500);
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
