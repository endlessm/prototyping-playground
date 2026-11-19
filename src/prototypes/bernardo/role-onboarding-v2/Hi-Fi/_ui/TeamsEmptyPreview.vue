<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { placeIllustrations, roleIllustrations } from './illustrations'
import { NORTHGATE, TEAM } from '../../_wire/world'

// Teams tab, empty, exploration "Preview": a faded copy of the table this card becomes, whose first row writes itself
// with the district's sample Teams. The columns say what a Team holds, so the card needs no line of explanation. The
// art is decorative. The card's actions come in through the slot, so they stay the page's own buttons.
const names = [TEAM, NORTHGATE]
const typed = ref('')
const written = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    typed.value = names[0]!
    written.value = true
    return
  }
  let index = 0
  let length = 0
  let erasing = false
  const tick = () => {
    const name = names[index]!
    length += erasing ? -1 : 1
    typed.value = name.slice(0, length)
    if (!erasing && length === name.length) {
      written.value = true
      erasing = true
      timer = setTimeout(tick, 2600)
    } else if (erasing && length === 0) {
      erasing = false
      index = (index + 1) % names.length
      timer = setTimeout(tick, 500)
    } else {
      if (erasing) written.value = false
      timer = setTimeout(tick, erasing ? 22 : 55)
    }
  }
  timer = setTimeout(tick, 800)
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="te-preview">
    <div class="te-sheet" aria-hidden="true">
      <div class="te-line te-head">
        <span>Team</span>
        <span class="te-second">Team Owners</span>
        <span class="te-extra">Cohorts</span>
        <span class="te-extra">Learners</span>
      </div>
      <div class="te-line">
        <span class="te-cell">
          <img class="te-mark" :src="placeIllustrations.Team" alt="" />
          <span class="te-typed">{{ typed }}<span class="te-caret" /></span>
        </span>
        <span class="te-cell te-second">
          <img :class="['te-owner', { 'te-on': written }]" :src="roleIllustrations.teamOwner" alt="" />
          <span class="te-bar" style="--w: 58%" />
        </span>
        <span class="te-cell te-extra"><span class="te-bar" style="--w: 28px; --d: 0.2s" /></span>
        <span class="te-cell te-extra"><span class="te-bar" style="--w: 36px; --d: 0.4s" /></span>
      </div>
      <div v-for="n in 2" :key="n" class="te-line">
        <span class="te-cell">
          <span class="te-dot" :style="{ '--d': `${n * 0.3}s` }" />
          <span class="te-bar" :style="{ '--w': n === 1 ? '52%' : '40%', '--d': `${n * 0.3}s` }" />
        </span>
        <span class="te-cell te-second">
          <span class="te-bar" :style="{ '--w': n === 1 ? '46%' : '60%', '--d': `${n * 0.3 + 0.15}s` }" />
        </span>
        <span class="te-cell te-extra"><span class="te-bar" :style="{ '--w': '24px', '--d': `${n * 0.3 + 0.3}s` }" /></span>
        <span class="te-cell te-extra"><span class="te-bar" :style="{ '--w': '32px', '--d': `${n * 0.3 + 0.45}s` }" /></span>
      </div>
    </div>

    <div class="te-cta">
      <p class="text-base font-semibold text-highlighted">No Teams yet</p>
      <div class="te-actions"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.te-preview {
  container-type: inline-size;
  padding: 12px 12px 36px;
}

.te-sheet {
  overflow: hidden;
  border: 1px solid var(--ui-border);
  border-bottom: 0;
  border-radius: 12px 12px 0 0;
  background: var(--ui-bg);
  mask-image: linear-gradient(to bottom, #000 0, #000 46%, transparent 96%);
  animation: te-rise 480ms ease-out backwards;
}

.te-line {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) minmax(0, 1.5fr) minmax(0, 0.8fr) minmax(0, 0.8fr);
  align-items: center;
  gap: 16px;
  height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid var(--ui-border);
}

.te-head {
  height: 44px;
  color: var(--ui-text-muted);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.te-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.te-mark {
  flex: none;
  width: 28px;
  height: 28px;
}

.te-typed {
  overflow: hidden;
  color: var(--ui-secondary);
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.te-caret {
  display: inline-block;
  width: 2px;
  height: 1.05em;
  margin-left: 1px;
  background: currentcolor;
  vertical-align: -0.15em;
  animation: te-blink 1s steps(1) infinite;
}

.te-owner {
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  opacity: 0;
  transform: scale(0.6);
  transition:
    opacity 240ms ease-out,
    transform 240ms ease-out;
}

.te-owner.te-on {
  opacity: 1;
  transform: scale(1);
}

.te-bar {
  width: var(--w);
  max-width: 100%;
  height: 8px;
  border-radius: 9999px;
  background: var(--ui-bg-accented);
  animation: te-breathe 1.6s ease-in-out var(--d, 0s) infinite alternate;
}

.te-dot {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--ui-bg-accented);
  animation: te-breathe 1.6s ease-in-out var(--d, 0s) infinite alternate;
}

.te-cta {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: -20px;
  text-align: center;
  animation: te-rise 480ms ease-out 200ms backwards;
}

.te-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

@container (max-width: 560px) {
  .te-line {
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  }

  .te-extra {
    display: none;
  }
}

@container (max-width: 340px) {
  .te-line {
    grid-template-columns: minmax(0, 1fr);
  }

  .te-second {
    display: none;
  }
}

@keyframes te-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

@keyframes te-breathe {
  from {
    opacity: 1;
  }

  to {
    opacity: 0.45;
  }
}

@keyframes te-blink {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .te-preview * {
    animation: none !important;
    transition: none !important;
  }

  .te-caret {
    display: none;
  }
}
</style>
