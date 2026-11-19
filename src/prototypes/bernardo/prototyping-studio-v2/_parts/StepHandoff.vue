<script setup lang="ts">
import Btn from './Btn.vue'
import Icon from './Icon.vue'
import ProdTag from './ProdTag.vue'
import Thumb from './Thumb.vue'
import { N, SAMPLES } from './content'

// One link for engineering: the app beside the proposal, its states and a
// brief the agent drafts. Nothing reaches the app's code.
const brief = [
  {
    label: 'What changes',
    text: 'A banner above the learner table lists parents who haven\'t given consent, with a “Remind” action.',
  },
  { label: 'Components', text: `Table (existing) · Banner (new, tried in the ${N.lab})` },
  { label: 'Needs a product decision', text: 'Can a leader dismiss the banner?' },
  { label: 'From the review', text: 'Ada: keep “Remind” away from “Remove”. 2 more comments.' },
]
</script>

<template>
  <div class="handoff">
    <div class="crumbs">Cohort invite flow › Share</div>
    <div class="header">
      <h1 class="title">Share with engineering</h1>
      <div class="address"><Icon name="link-2" :size="13" /> studio.endless…/compare/cohort-invite</div>
      <Btn primary><Icon name="copy" :size="14" /> Copy link</Btn>
    </div>

    <div class="body">
      <div class="side-by-side">
        <div class="pair">
          <div>
            <div class="label"><ProdTag /></div>
            <div class="frame app"><Thumb kind="table" :h="170" extra /></div>
          </div>
          <div>
            <div class="label text">Proposal · Option A</div>
            <div class="frame proposal"><Thumb kind="table" :h="170" highlight extra /></div>
          </div>
        </div>
        <div class="states">
          <span v-for="(x, i) in SAMPLES" :key="x" class="state" :class="{ on: i === 2 }">{{ x }}</span>
          <span class="comments"><Icon name="message-square" :size="12" /> 3 comments added to the brief</span>
        </div>
      </div>

      <div class="brief">
        <div class="brief-title">
          <Icon name="sparkles" :size="14" /> Change brief
          <span class="brief-note">drafted by the agent · editable</span>
        </div>
        <template v-for="b in brief" :key="b.label">
          <div class="brief-label">{{ b.label }}</div>
          <div class="brief-text">{{ b.text }}</div>
        </template>
      </div>
    </div>

    <div class="footer">Engineering gets a link and a brief. Nothing is sent to the app's code.</div>
  </div>
</template>

<style scoped>
.handoff {
  padding: 24px;
}
.crumbs {
  font-size: 12px;
  color: var(--zinc-500);
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
  color: var(--zinc-900);
}
.address {
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--zinc-300);
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--zinc-600);
}
.body {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}
.side-by-side {
  grid-column: span 3;
}
.pair {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
/* The APP mark and the plain label take the same height, so the two
   screens below them line up. */
.label {
  min-height: 21px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}
.label.text {
  font-size: 12px;
  color: var(--zinc-500);
}
.frame {
  border-radius: 8px;
}
.frame.app {
  box-shadow: 0 0 0 2px var(--sky-300);
}
.frame.proposal {
  box-shadow: 0 0 0 2px var(--violet-300);
}
.states {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
}
.state {
  border-radius: 9999px;
  white-space: nowrap;
  padding: 4px 10px;
  border: 1px solid var(--zinc-200);
  color: var(--zinc-600);
}
.state.on {
  border-color: var(--zinc-900);
  color: inherit;
}
.comments {
  border-radius: 9999px;
  white-space: nowrap;
  padding: 4px 10px;
  background: var(--amber-50);
  color: var(--amber-800);
  display: flex;
  align-items: center;
  gap: 4px;
}
.brief {
  grid-column: span 2;
  border-radius: 12px;
  border: 1px solid var(--zinc-200);
  padding: 16px;
  font-size: 13px;
}
.brief-title {
  font-weight: 600;
  color: var(--zinc-900);
  display: flex;
  align-items: center;
  gap: 6px;
}
.brief-note {
  font-size: 11px;
  font-weight: 400;
  color: var(--zinc-400);
}
.brief-label {
  margin-top: 8px;
  font-size: 12px;
  color: var(--zinc-500);
}
.brief-text {
  color: var(--zinc-800);
}
.footer {
  margin-top: 16px;
  border-radius: 8px;
  background: var(--zinc-50);
  padding: 12px;
  font-size: 12px;
  color: var(--zinc-600);
}
</style>
