<script setup lang="ts">
import { useId } from 'vue'
import IconButton from './IconButton.vue'
import { useEscape } from './useEscape'
import s from './wire.module.css'

// A full-frame, step-by-step task that any page can open, such as creating a cohort. A progress bar names the
// steps (earlier ones can be revisited); each step has its content and a context column (the aside slot) beside it.
defineProps<{ title: string; steps: string[]; current: number }>()
const emit = defineEmits<{ step: [step: number]; close: [] }>()

const titleId = useId()
useEscape(() => emit('close'))
</script>

<template>
  <div role="dialog" aria-modal="true" :aria-labelledby="titleId" :class="s.takeover">
    <div :class="s.wizardHeader">
      <h2 :id="titleId" :class="s.subtitle">{{ title }}</h2>
      <IconButton label="Close" @click="emit('close')">×</IconButton>
    </div>
    <ol :class="s.stepper">
      <li v-for="(step, i) in steps" :key="step" :class="[i < current && s.stepDone, i === current && s.stepCurrent]">
        <button
          type="button"
          :disabled="i >= current"
          :aria-current="i === current ? 'step' : undefined"
          @click="emit('step', i)"
        >
          <span :class="s.step">{{ i + 1 }}</span>
          {{ step }}
        </button>
      </li>
    </ol>
    <div :class="s.wizardBody">
      <div :class="[s.wizardMain, s.stack]"><slot /></div>
      <aside :class="[s.wizardAside, s.stack]"><slot name="aside" /></aside>
    </div>
    <div :class="s.wizardFooter"><slot name="footer" /></div>
  </div>
</template>
