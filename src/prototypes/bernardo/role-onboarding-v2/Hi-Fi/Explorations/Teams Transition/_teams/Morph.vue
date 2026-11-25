<script setup lang="ts">
import { ref } from 'vue'

// Swaps one piece of a page for another in place: the old one rises and fades out, the new one's parts marked
// `data-enter` rise in one after another (`--d` is each one's place in line), and the box between them grows or shrinks
// to the new height, so the page below follows instead of jumping. `swapKey` names what is showing.
defineProps<{ swapKey: string }>()

const box = ref<HTMLElement>()
let from = 0
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

function lock() {
  if (!box.value) return
  from = box.value.offsetHeight
  box.value.style.height = `${from}px`
}

function enter(el: Element, done: () => void) {
  const b = box.value
  if (!b || !from || reduced()) {
    if (b) b.style.height = ''
    from = 0
    done()
    return
  }
  const to = (el as HTMLElement).offsetHeight
  b.style.height = ''
  b.animate([{ height: `${from}px` }, { height: `${to}px` }], {
    duration: 360,
    easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
  })
  from = 0
  // Long enough for the last part to finish rising, so its animation isn't cut by the class going away.
  setTimeout(done, 820)
}
</script>

<template>
  <div ref="box" class="tt-morph">
    <Transition name="tt-morph" :css="true" @before-leave="lock" @enter="enter">
      <div :key="swapKey">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tt-morph {
  position: relative;
  overflow: hidden;
}

.tt-morph-leave-active {
  position: absolute;
  inset: 0 0 auto 0;
  pointer-events: none;
  transition:
    opacity 180ms ease-out,
    transform 220ms cubic-bezier(0.23, 1, 0.32, 1),
    filter 220ms ease-out;
}
.tt-morph-leave-to {
  opacity: 0;
  transform: translateY(-24px) scale(0.98);
  filter: blur(2px);
}

.tt-morph-enter-active :deep([data-enter]) {
  animation: tt-rise 300ms cubic-bezier(0.23, 1, 0.32, 1) both;
  animation-delay: calc(140ms + var(--d, 0) * 50ms);
}

@keyframes tt-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tt-morph-leave-active {
    transition: none !important;
  }
  .tt-morph-enter-active :deep([data-enter]) {
    animation: none !important;
  }
}
</style>
