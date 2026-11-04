<!-- @studio-id 9qbk7twz28edebxw -->
<!-- @studio-state wq1jf4d0a6vtcxbt Browsing -->
<!-- @studio-state a8r0t4ga9e2ms0s2 Commenting -->
<!-- @studio-state 25pre026j1tm6mtt Thread open -->
<!-- @studio-state 25xpchjfg7f9qv5m All comments -->
<script setup lang="ts">
import { usePrototypeArtifactHref } from '#studio/prototype'
import CommentLayer from './_parts/CommentLayer.vue'
import type { Start, Thread } from './_parts/comments'

// A diagram with comments, drawn like the studio's Mermaid renderer draws
// it. In comment mode a click on a step or an arrow comments on it, and the
// agent gets its Mermaid ID and label; a click on empty space pins the
// comment there.
withDefaults(defineProps<{ start?: Start; focus?: string }>(), {
  start: 'browse',
  focus: undefined,
})
const href = usePrototypeArtifactHref()

const threads: Thread[] = [
  {
    id: 'g1',
    target: 'n-age',
    label: 'Step "Under 18?" (age)',
    at: { x: 0.78, y: 0.2 },
    status: 'open',
    messages: [
      {
        author: 'ada',
        body: 'Where does the consent email go? It needs its own step after this.',
        time: '1 h ago',
      },
    ],
  },
  {
    id: 'g2',
    target: 'e-google',
    label: 'Arrow "Google account" → "Confirm details"',
    at: { x: 0.25, y: 0.67 },
    status: 'open',
    messages: [
      {
        author: 'bernardo',
        body: 'Google sign-ups skip this step: their details come from the school account. Check with engineering.',
        time: '45 min ago',
      },
      {
        author: 'agent',
        body: 'The notes in 2 Sign Up/Notes.md say Google users still confirm their role, so I kept the arrow.',
        time: '20 min ago',
      },
    ],
  },
  {
    id: 'g3',
    target: 'n-team',
    label: 'Step "Create team" (team)',
    at: { x: 0.95, y: 0.1 },
    status: 'resolved',
    resolvedBy: 'bernardo',
    messages: [
      {
        author: 'bernardo',
        body: 'Rename to “Create your team”, as in the screens.',
        time: 'Yesterday',
      },
    ],
  },
  {
    id: 'g4',
    target: 'artifact',
    label: 'The whole diagram',
    at: { x: 0, y: 0 },
    status: 'open',
    messages: [
      {
        author: 'ada',
        body: 'It misses the GitHub branch from 2.6 GitHub Unverified.',
        time: '2 h ago',
      },
    ],
  },
]

interface Step {
  id: string
  label: string
  x: number
  y: number
  shape?: 'diamond' | 'pill'
}
const steps: Step[] = [
  { id: 'join', label: 'Teacher opens Join', x: 500, y: 50, shape: 'pill' },
  { id: 'choice', label: 'Signs up with?', x: 500, y: 165, shape: 'diamond' },
  { id: 'google', label: 'Google account', x: 300, y: 285 },
  { id: 'email', label: 'Email and password', x: 700, y: 285 },
  { id: 'confirm', label: 'Confirm details', x: 500, y: 395 },
  { id: 'age', label: 'Under 18?', x: 500, y: 515, shape: 'diamond' },
  { id: 'team', label: 'Create team', x: 300, y: 640 },
  { id: 'consent', label: 'Parental consent', x: 700, y: 640 },
]
const arrows = [
  { id: 'e-join', d: 'M500 74 V125', from: 'Teacher opens Join', to: 'Signs up with?' },
  { id: 'e-pick-google', d: 'M455 185 Q300 200 300 261', label: 'Google', lx: 360, ly: 205, from: 'Signs up with?', to: 'Google account' },
  { id: 'e-pick-email', d: 'M545 185 Q700 200 700 261', label: 'Email', lx: 640, ly: 205, from: 'Signs up with?', to: 'Email and password' },
  { id: 'e-google', d: 'M300 309 Q300 380 410 393', from: 'Google account', to: 'Confirm details' },
  { id: 'e-email', d: 'M700 309 Q700 380 590 393', label: 'Verify email', lx: 690, ly: 360, from: 'Email and password', to: 'Confirm details' },
  { id: 'e-confirm', d: 'M500 419 V475', from: 'Confirm details', to: 'Under 18?' },
  { id: 'e-no', d: 'M455 535 Q300 550 300 616', label: 'No', lx: 365, ly: 556, from: 'Under 18?', to: 'Create team' },
  { id: 'e-yes', d: 'M545 535 Q700 550 700 616', label: 'Yes', lx: 635, ly: 556, from: 'Under 18?', to: 'Parental consent' },
]
</script>

<script lang="ts">
export const states = [
  { title: 'Browsing', props: { start: 'browse' } },
  { title: 'Commenting', props: { start: 'comment', focus: 'n-email' } },
  { title: 'Thread open', props: { start: 'thread', focus: 'g2' } },
  { title: 'All comments', props: { start: 'list' } },
]
</script>

<template>
  <CommentLayer
    :artifact="{
      kind: 'diagram',
      title: 'Sign-up flow',
      file: 'src/prototypes/bernardo/comments/Sign-up flow.mermaid',
      address: href('3 Diagram'),
    }"
    :threads="threads"
    :start="start"
    :focus="focus"
  >
    <div class="stage" data-target="page" data-label="Diagram · Empty space">
      <svg
        viewBox="120 0 760 700"
        class="diagram"
        role="img"
        aria-label="Sign-up flow"
      >
        <defs>
          <marker
            id="head"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="#737373" />
          </marker>
        </defs>
        <g
          v-for="arrow in arrows"
          :key="arrow.id"
          class="arrow"
          :data-target="arrow.id"
          :data-label="`Arrow &quot;${arrow.from}&quot; → &quot;${arrow.to}&quot;`"
        >
          <path :d="arrow.d" class="hit" />
          <path :d="arrow.d" class="line" marker-end="url(#head)" />
          <template v-if="arrow.label">
            <rect
              :x="arrow.lx - 38"
              :y="arrow.ly - 11"
              width="76"
              height="22"
              rx="4"
              class="edge-label"
            />
            <text :x="arrow.lx" :y="arrow.ly + 4" class="edge-text">
              {{ arrow.label }}
            </text>
          </template>
        </g>
        <g
          v-for="step in steps"
          :key="step.id"
          class="step"
          :data-target="`n-${step.id}`"
          :data-label="`Step &quot;${step.label}&quot; (${step.id})`"
        >
          <path
            v-if="step.shape === 'diamond'"
            :d="`M${step.x} ${step.y - 40} L${step.x + 80} ${step.y} L${step.x} ${step.y + 40} L${step.x - 80} ${step.y} Z`"
          />
          <rect
            v-else
            :x="step.x - 90"
            :y="step.y - 24"
            width="180"
            height="48"
            :rx="step.shape === 'pill' ? 24 : 6"
          />
          <text :x="step.x" :y="step.y + 5">{{ step.label }}</text>
        </g>
      </svg>
    </div>
  </CommentLayer>
</template>

<style scoped>
.stage {
  height: 100%;
  display: grid;
  place-items: center;
  padding: 24px;
  box-sizing: border-box;
  background: #fff;
}
.diagram {
  width: 100%;
  height: 100%;
  max-height: calc(100vh - 48px);
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.step rect,
.step path {
  fill: #f5f5f5;
  stroke: #a3a3a3;
  stroke-width: 1.2;
}
.step text {
  fill: #262626;
  font-size: 15px;
  text-anchor: middle;
}
.arrow .line {
  fill: none;
  stroke: #737373;
  stroke-width: 1.6;
}
.arrow .hit {
  fill: none;
  stroke: transparent;
  stroke-width: 16;
}
.edge-label {
  fill: #fff;
  stroke: #e5e5e5;
}
.edge-text {
  fill: #525252;
  font-size: 13px;
  text-anchor: middle;
}
</style>
