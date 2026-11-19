<!-- @studio-id 49e0ccd3zgewcz3r -->
<!-- @studio-state p3ngfnysns9xfcrt 1 · O mapa -->
<!-- @studio-state rnddx6d7zb27wk9c 2 · Casa do produto -->
<!-- @studio-state zeat81g8kkpb8j6v 3 · Telas reais -->
<!-- @studio-state w16a9rq7btspvg8y 4 · Explorar uma tela -->
<!-- @studio-state knjth6xhbrmk7dnh 5 · No canvas -->
<!-- @studio-state wtyrd31aj9z4jdvv 6 · O app mudou -->
<!-- @studio-state aqarxrwpxcn7d6z0 7 · Lab -->
<!-- @studio-state 9xbpxx3kqzsd0qz2 8 · Entregar à engenharia -->
<!-- @studio-state xz99sv0yr0s6g69w 9 · Conectar a fonte -->
<!-- @studio-state fdyk6qtnrbcchryp 10 · Fases -->
<script setup lang="ts">
import { computed, watch } from 'vue'
import Icon from './_parts/Icon.vue'
import StepCanvas from './_parts/StepCanvas.vue'
import StepConnect from './_parts/StepConnect.vue'
import StepHandoff from './_parts/StepHandoff.vue'
import StepHome from './_parts/StepHome.vue'
import StepLab from './_parts/StepLab.vue'
import StepMap from './_parts/StepMap.vue'
import StepPhases from './_parts/StepPhases.vue'
import StepScreen from './_parts/StepScreen.vue'
import StepScreens from './_parts/StepScreens.vue'
import StepUpdate from './_parts/StepUpdate.vue'
import StudioFrame from './_parts/StudioFrame.vue'
import { NOTES, STEPS, type StepId } from './_parts/content'
import { provideWalkthrough, useInterFont } from './_parts/walkthrough'

// The Design Studio v2 proposal (Product, Screens, Lab), walked through in
// ten steps: the council's final mockup in .scratch/design-studio-v2.
// Eight steps show the proposed studio; the map and the phases stand alone.
const props = withDefaults(defineProps<{ start?: StepId }>(), { start: 'map' })
const { step, go } = provideWalkthrough(props.start)
// A state's props change in place when another state opens.
watch(
  () => props.start,
  (start) => go(start),
)
useInterFont()

const IN_STUDIO = {
  home: StepHome,
  screens: StepScreens,
  screen: StepScreen,
  canvas: StepCanvas,
  update: StepUpdate,
  lab: StepLab,
  handoff: StepHandoff,
  connect: StepConnect,
}
const index = computed(() => STEPS.findIndex((s) => s.id === step.value))
function move(by: number) {
  const next = STEPS[index.value + by]
  if (next) go(next.id)
}
const inStudio = computed(() =>
  step.value === 'map' || step.value === 'phases' ? null : IN_STUDIO[step.value],
)
</script>

<script lang="ts">
export const states = [
  { title: '1 · O mapa', props: { start: 'map' } },
  { title: '2 · Casa do produto', props: { start: 'home' } },
  { title: '3 · Telas reais', props: { start: 'screens' } },
  { title: '4 · Explorar uma tela', props: { start: 'screen' } },
  { title: '5 · No canvas', props: { start: 'canvas' } },
  { title: '6 · O app mudou', props: { start: 'update' } },
  { title: '7 · Lab', props: { start: 'lab' } },
  { title: '8 · Entregar à engenharia', props: { start: 'handoff' } },
  { title: '9 · Conectar a fonte', props: { start: 'connect' } },
  { title: '10 · Fases', props: { start: 'phases' } },
]
</script>

<template>
  <div class="walkthrough">
    <!-- Previous and next sit up here, not at the foot: the studio draws its
         comment tools over the preview's bottom corner. -->
    <nav class="steps" aria-label="Passos">
      <button
        v-for="s in STEPS"
        :key="s.id"
        type="button"
        class="step"
        :class="{ on: step === s.id }"
        :aria-current="step === s.id ? 'step' : undefined"
        @click="go(s.id)"
      >
        {{ s.label }}
      </button>
      <div class="pager">
        <button type="button" class="prev" :disabled="index === 0" @click="move(-1)">← Anterior</button>
        <button type="button" class="next" :disabled="index === STEPS.length - 1" @click="move(1)">
          Próximo <Icon name="chevron-right" :size="14" />
        </button>
      </div>
    </nav>

    <p class="note" aria-live="polite">{{ NOTES[step] }}</p>

    <StudioFrame v-if="inStudio" class="studio">
      <component :is="inStudio" />
    </StudioFrame>
    <StepMap v-else-if="step === 'map'" />
    <StepPhases v-else />
  </div>
</template>

<style scoped>
/* Browser defaults the mockup's Tailwind reset took away. `:where` keeps
   them weaker than any part's own class, whatever order styles load in. */
:deep(:where(*)) {
  box-sizing: border-box;
}
:deep(:where(button)) {
  margin: 0;
  padding: 0;
  border: 0 solid;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
}
:deep(:where(h1, h2, p, ul)) {
  margin: 0;
  padding: 0;
  font-size: inherit;
  font-weight: inherit;
}
:deep(:where(ul)) {
  list-style: none;
}
:deep(:where(b)) {
  font-weight: 600;
}

.walkthrough {
  --zinc-50: #fafafa;
  --zinc-100: #f4f4f5;
  --zinc-200: #e4e4e7;
  --zinc-300: #d4d4d8;
  --zinc-400: #a1a1aa;
  --zinc-500: #71717a;
  --zinc-600: #52525b;
  --zinc-700: #3f3f46;
  --zinc-800: #27272a;
  --zinc-900: #18181b;
  --slate-50: #f8fafc;
  --slate-100: #f1f5f9;
  --slate-300: #cbd5e1;
  --violet-50: #f5f3ff;
  --violet-100: #ede9fe;
  --violet-200: #ddd6fe;
  --violet-300: #c4b5fd;
  --violet-400: #a78bfa;
  --violet-500: #8b5cf6;
  --violet-600: #7c3aed;
  --violet-800: #5b21b6;
  --violet-900: #4c1d95;
  --sky-50: #f0f9ff;
  --sky-100: #e0f2fe;
  --sky-200: #bae6fd;
  --sky-300: #7dd3fc;
  --sky-400: #38bdf8;
  --sky-500: #0ea5e9;
  --sky-600: #0284c7;
  --sky-700: #0369a1;
  --sky-800: #075985;
  --sky-900: #0c4a6e;
  --sky-950: #082f49;
  --amber-50: #fffbeb;
  --amber-100: #fef3c7;
  --amber-200: #fde68a;
  --amber-300: #fcd34d;
  --amber-400: #fbbf24;
  --amber-800: #92400e;
  --amber-900: #78350f;
  --emerald-50: #ecfdf5;
  --emerald-200: #a7f3d0;
  --emerald-300: #6ee7b7;
  --emerald-400: #34d399;
  --emerald-700: #047857;
  --emerald-800: #065f46;
  --emerald-900: #064e3b;
  --rose-100: #ffe4e6;
  --rose-200: #fecdd3;
  --rose-300: #fda4af;
  --rose-400: #fb7185;
  --rose-500: #f43f5e;
  --rose-800: #9f1239;
  --yellow-100: #fef9c3;
  --yellow-300: #fde047;

  /* The whole window, past the document body's default margin. */
  position: fixed;
  inset: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #fff;
  color: var(--zinc-900);
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.5;
}
.steps {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.step {
  height: 32px;
  padding: 0 12px;
  border-radius: 9999px;
  white-space: nowrap;
  font-size: 13px;
  border: 1px solid var(--zinc-200);
  color: var(--zinc-700);
}
.step:hover {
  border-color: var(--zinc-400);
}
.step.on {
  background: var(--violet-600);
  border-color: var(--violet-600);
  color: #fff;
}
.note {
  flex-shrink: 0;
  border-radius: 12px;
  border: 1px solid var(--violet-200);
  background: var(--violet-50);
  color: var(--violet-900);
  font-size: 14px;
  line-height: 1.625;
  padding: 12px 16px;
}
/* The studio takes the height the window has left, never less than its
   steps need. */
.studio {
  flex: 1 1 0;
  min-height: 560px;
}
.pager {
  margin-left: auto;
  display: flex;
  gap: 6px;
}
.prev,
.next {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.prev {
  border: 1px solid var(--zinc-300);
}
.next {
  background: var(--zinc-900);
  color: #fff;
}
.prev:disabled,
.next:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
