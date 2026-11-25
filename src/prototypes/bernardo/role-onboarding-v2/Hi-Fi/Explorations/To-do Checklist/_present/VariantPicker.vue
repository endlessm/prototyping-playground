<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// The emil-prototype picker, verbatim: harness chrome, not part of the design. Number keys and arrows switch, R replays.
const props = defineProps<{ labels: string[] }>()
const current = defineModel<number>({ required: true })
const emit = defineEmits<{ replay: [] }>()

const nav = ref<HTMLElement>()
const items = ref<HTMLButtonElement[]>([])
const highlight = ref({ width: '0px', transform: 'translateX(0px)' })
const ready = ref(false)

function moveHighlight() {
  const el = items.value[current.value]
  if (!el) return
  highlight.value = { width: `${el.offsetWidth}px`, transform: `translateX(${el.offsetLeft}px)` }
}

function setActive(i: number) {
  if (i < 0 || i >= props.labels.length) return
  current.value = i
  try {
    const url = new URL(location.href)
    url.searchParams.set('v', String(i + 1))
    history.replaceState(history.state, '', url)
  } catch {
    // The preview document may refuse; the picker still works without the address.
  }
}

function onKey(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable) return
  if (e.metaKey || e.ctrlKey || e.altKey) return
  const num = parseInt(e.key, 10)
  if (num >= 1 && num <= props.labels.length) setActive(num - 1)
  else if (e.key === 'ArrowRight') setActive((current.value + 1) % props.labels.length)
  else if (e.key === 'ArrowLeft') setActive((current.value - 1 + props.labels.length) % props.labels.length)
  else if (e.key === 'r' || e.key === 'R') emit('replay')
}

watch(current, () => nextTick(moveHighlight))

onMounted(() => {
  const requested = parseInt(new URLSearchParams(location.search).get('v') ?? '', 10)
  if (requested >= 1 && requested <= props.labels.length) current.value = requested - 1
  nextTick(moveHighlight)
  requestAnimationFrame(() => requestAnimationFrame(() => (ready.value = true)))
  document.addEventListener('keydown', onKey)
  window.addEventListener('resize', moveHighlight)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', moveHighlight)
})
</script>

<template>
  <nav ref="nav" class="proto-picker" aria-label="Prototype variants" :data-ready="ready ? '' : undefined">
    <span class="proto-picker-highlight" aria-hidden="true" :style="highlight" />
    <button
      v-for="(label, i) in labels"
      :key="label"
      :ref="(el) => el && (items[i] = el as HTMLButtonElement)"
      type="button"
      class="proto-picker-item"
      :data-active="i === current ? '' : undefined"
      :aria-current="i === current ? 'true' : undefined"
      @click="setActive(i)"
    >
      {{ label }}
    </button>
    <span class="proto-picker-divider" aria-hidden="true" />
    <button type="button" class="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" @click="emit('replay')">
      ↻
    </button>
  </nav>
</template>

<style scoped>
.proto-picker {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(10, 10, 10, 0.82);
  -webkit-backdrop-filter: blur(12px) saturate(1.4);
  backdrop-filter: blur(12px) saturate(1.4);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 8px 24px rgba(0, 0, 0, 0.24),
    0 2px 6px rgba(0, 0, 0, 0.12);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 13px;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  -webkit-user-select: none;
}

.proto-picker-highlight {
  position: absolute;
  top: 4px;
  left: 0;
  height: 28px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

/* The slide is enabled only after first paint (data-ready), so load doesn't animate. */
.proto-picker[data-ready] .proto-picker-highlight {
  transition:
    transform 250ms cubic-bezier(0.23, 1, 0.32, 1),
    width 250ms cubic-bezier(0.23, 1, 0.32, 1);
}

@media (prefers-reduced-motion: reduce) {
  .proto-picker[data-ready] .proto-picker-highlight { transition: none; }
}

.proto-picker-item {
  position: relative; /* sits above the highlight */
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font: inherit;
  cursor: pointer;
  transition:
    color 150ms ease-out,
    transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}

@media (hover: hover) and (pointer: fine) {
  .proto-picker-item:hover {
    color: rgba(255, 255, 255, 0.85);
  }
}

.proto-picker-item:active {
  transform: scale(0.97);
}

.proto-picker-item:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.4);
  outline-offset: 2px;
}

.proto-picker-item[data-active] {
  color: #fff;
}

.proto-picker-divider {
  width: 1px;
  height: 16px;
  margin: 0 4px;
  background: rgba(255, 255, 255, 0.12);
}

.proto-picker-replay {
  padding: 0 10px;
  font-size: 14px;
}

.proto-picker[data-position="top"] {
  bottom: auto;
  top: 24px;
}
</style>
