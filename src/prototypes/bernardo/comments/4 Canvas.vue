<!-- @studio-id em3gr2razkbea5y4 -->
<!-- @studio-state w1bwq0x34wd8vgp8 Browsing -->
<!-- @studio-state j62n6601z6ksgw9r Commenting -->
<!-- @studio-state s9d77pe00rygpmy3 Thread open -->
<!-- @studio-state jmhyey410whdsfvs All comments -->
<script setup lang="ts">
import { usePrototypeArtifactHref } from '#studio/prototype'
import { computed, ref } from 'vue'
import CommentLayer from './_parts/CommentLayer.vue'
import type { Start, Thread } from './_parts/comments'
import { useEndlessFonts } from './_parts/useLook'

// A canvas with comments, drawn like the studio's Excalidraw canvas. A
// comment is pinned to a canvas element (an item, a note, an arrow, a text)
// and follows it as the canvas pans, zooms or the element moves. Scroll to
// pan, Ctrl or ⌘ + scroll to zoom. The comment toolbar sits above the
// canvas's save status.
withDefaults(defineProps<{ start?: Start; focus?: string }>(), {
  start: 'browse',
  focus: undefined,
})
useEndlessFonts()
const href = usePrototypeArtifactHref()

const threads: Thread[] = [
  {
    id: 'k1',
    target: 'item-google',
    label: 'Item "2.1 Google Confirm" (view)',
    at: { x: 0.97, y: 0.04 },
    status: 'open',
    messages: [
      {
        author: 'ada',
        body: 'This screen should show the school’s name, like 1.1 Join does.',
        time: '1 h ago',
      },
    ],
  },
  {
    id: 'k2',
    target: 'note',
    label: 'Sticky note "Ask eng: do Google users…"',
    at: { x: 0.94, y: 0.08 },
    status: 'open',
    messages: [
      {
        author: 'bernardo',
        body: 'Turn this note into a document, so it’s kept with the flow.',
        time: '50 min ago',
      },
      {
        author: 'agent',
        body: 'Added it to 2 Sign Up/Notes.md and linked the document on the canvas.',
        time: '30 min ago',
      },
    ],
  },
  {
    id: 'k3',
    target: 'arrow',
    label: 'Arrow "1.1 Join" → "2.1 Google Confirm"',
    at: { x: 0.5, y: 0.2 },
    status: 'open',
    messages: [
      {
        author: 'bernardo',
        body: 'Add the email branch too: 1.1 Join → 2.3 Email Confirm.',
        time: '25 min ago',
      },
    ],
  },
  {
    id: 'k4',
    target: 'title',
    label: 'Text "Sign-up flow"',
    at: { x: 1, y: 0.3 },
    status: 'resolved',
    resolvedBy: 'ada',
    messages: [
      { author: 'ada', body: 'Call it “Educator sign-up”.', time: 'Yesterday' },
    ],
  },
]

// The camera: scrolling pans, Ctrl or ⌘ + scrolling zooms at the pointer.
const camera = ref({ x: 72, y: 84, zoom: 0.85 })
const world = computed(
  () =>
    `translate(${camera.value.x}px, ${camera.value.y}px) scale(${camera.value.zoom})`,
)
function onWheel(event: WheelEvent) {
  event.preventDefault()
  const view = camera.value
  if (event.ctrlKey || event.metaKey) {
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const px = event.clientX - box.left
    const py = event.clientY - box.top
    const zoom = Math.min(2, Math.max(0.3, view.zoom * (1 - event.deltaY / 400)))
    camera.value = {
      zoom,
      x: px - ((px - view.x) / view.zoom) * zoom,
      y: py - ((py - view.y) / view.zoom) * zoom,
    }
  } else {
    camera.value = { ...view, x: view.x - event.deltaX, y: view.y - event.deltaY }
  }
}
const zoomBy = (factor: number) =>
  (camera.value = {
    ...camera.value,
    zoom: Math.min(2, Math.max(0.3, camera.value.zoom * factor)),
  })

const tools = ['lock', 'hand', 'select', 'rect', 'diamond', 'ellipse', 'arrow', 'line', 'pen', 'text', 'eraser']
</script>

<script lang="ts">
export const states = [
  { title: 'Browsing', props: { start: 'browse' } },
  { title: 'Commenting', props: { start: 'comment', focus: 'item-github' } },
  { title: 'Thread open', props: { start: 'thread', focus: 'k2' } },
  { title: 'All comments', props: { start: 'list' } },
]
</script>

<template>
  <CommentLayer
    :artifact="{
      kind: 'canvas',
      title: 'Flows',
      file: 'src/prototypes/bernardo/comments/Flows.excalidraw',
      address: href('4 Canvas'),
    }"
    :threads="threads"
    :start="start"
    :focus="focus"
    :raise="24"
  >
    <div
      class="canvas"
      data-target="page"
      data-label="Canvas · Empty space"
      @wheel="onWheel"
    >
      <div class="world" :style="{ transform: world }">
        <p
          class="title"
          data-target="title"
          data-label='Text "Sign-up flow"'
        >
          Sign-up flow
        </p>

        <figure
          class="item"
          style="left: 0; top: 70px"
          data-target="item-join"
          data-label='Item "1.1 Join" (view)'
        >
          <figcaption>1.1 Join <span>View</span></figcaption>
          <div class="shot">
            <span class="logo" />
            <span class="line wide" />
            <span class="line" />
            <span class="btn google" />
            <span class="btn" />
          </div>
        </figure>

        <svg
          class="arrow"
          style="left: 400px; top: 170px"
          width="190"
          height="80"
          viewBox="0 0 190 80"
          data-target="arrow"
          data-label='Arrow "1.1 Join" → "2.1 Google Confirm"'
        >
          <path d="M6 54 C 60 10, 120 10, 176 40" class="stroke" />
          <path d="M162 28 L178 41 L158 48" class="stroke" />
        </svg>

        <figure
          class="item"
          style="left: 600px; top: 70px"
          data-target="item-google"
          data-label='Item "2.1 Google Confirm" (view)'
        >
          <figcaption>2.1 Google Confirm <span>View</span></figcaption>
          <div class="shot">
            <span class="logo" />
            <span class="line wide" />
            <span class="field" />
            <span class="field" />
            <span class="btn primary" />
          </div>
        </figure>

        <div
          class="note"
          style="left: 40px; top: 400px"
          data-target="note"
          data-label='Sticky note "Ask eng: do Google users…"'
        >
          Ask eng: do Google users confirm their role?
        </div>

        <figure
          class="item"
          style="left: 600px; top: 400px"
          data-target="item-github"
          data-label='Item "2.6 GitHub Unverified" (view)'
        >
          <figcaption>2.6 GitHub Unverified <span>View</span></figcaption>
          <div class="shot">
            <span class="logo" />
            <span class="line wide" />
            <span class="alert" />
            <span class="btn" />
          </div>
        </figure>
      </div>

      <!-- Excalidraw's own controls, as the studio trims them. -->
      <div class="ui menu-button" aria-hidden="true" data-comment-ui>
        <span /><span /><span />
      </div>
      <div class="ui tools" aria-hidden="true" data-comment-ui>
        <span
          v-for="tool in tools"
          :key="tool"
          class="tool"
          :class="{ on: tool === 'select', gap: tool === 'hand' }"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path v-if="tool === 'lock'" d="M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z" />
            <path v-else-if="tool === 'hand'" d="M8 13V5a1.5 1.5 0 0 1 3 0v6m0-1V4a1.5 1.5 0 0 1 3 0v6m0-1V5.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.5-1.5L8 15" />
            <path v-else-if="tool === 'select'" d="M5 3l14 8-6 2-3 6z" />
            <rect v-else-if="tool === 'rect'" x="4" y="5" width="16" height="14" rx="2" />
            <path v-else-if="tool === 'diamond'" d="M12 3l9 9-9 9-9-9z" />
            <circle v-else-if="tool === 'ellipse'" cx="12" cy="12" r="8" />
            <path v-else-if="tool === 'arrow'" d="M4 20L20 4M10 4h10v10" />
            <path v-else-if="tool === 'line'" d="M4 20L20 4" />
            <path v-else-if="tool === 'pen'" d="M4 20l4-1 11-11-3-3L5 16z" />
            <path v-else-if="tool === 'text'" d="M5 6V4h14v2M12 4v16M9 20h6" />
            <path v-else d="M7 20h10M5 15l8-8 6 6-5 5H9z" />
          </svg>
        </span>
      </div>
      <div class="ui library" aria-hidden="true" data-comment-ui>Library</div>
      <div class="ui zoom" data-comment-ui>
        <button type="button" aria-label="Zoom out" @click="zoomBy(0.9)">−</button>
        <span>{{ Math.round(camera.zoom * 100) }}%</span>
        <button type="button" aria-label="Zoom in" @click="zoomBy(1.1)">+</button>
      </div>
      <p class="ui saved" role="status" data-comment-ui><span class="dot" />Saved</p>
    </div>
  </CommentLayer>
</template>

<style scoped>
.canvas {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: #fff;
  font-family: Nunito, ui-rounded, system-ui, sans-serif;
  color: #1e1e1e;
}
.world {
  position: absolute;
  left: 0;
  top: 0;
  width: 1000px;
  height: 700px;
  transform-origin: 0 0;
}
.title {
  position: absolute;
  left: 0;
  top: 0;
  margin: 0;
  font-size: 34px;
  font-weight: 600;
}
.item {
  position: absolute;
  width: 380px;
  height: 260px;
  margin: 0;
  border-radius: 10px;
  border: 1px solid #e5e5e5;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
  font-family: ui-sans-serif, system-ui, sans-serif;
}
figcaption {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  border-bottom: 1px solid #e5e5e5;
  font-size: 13px;
  font-weight: 500;
  color: #171717;
}
figcaption span {
  color: #737373;
  font-weight: 400;
}
.shot {
  height: calc(100% - 37px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 26px;
  background: #f8fafc;
}
.shot .logo {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: #ff6900;
}
.shot .line {
  width: 120px;
  height: 10px;
  border-radius: 5px;
  background: #cad5e2;
}
.shot .line.wide {
  width: 180px;
  height: 14px;
  background: #1d293d;
}
.shot .field {
  width: 200px;
  height: 22px;
  border-radius: 11px;
  border: 1px solid #dcdce9;
  background: #fff;
}
.shot .btn {
  width: 200px;
  height: 26px;
  border-radius: 13px;
  border: 1px solid #dcdce9;
  background: #fff;
}
.shot .btn.google {
  background: #e7e5fc;
  border-color: #e7e5fc;
}
.shot .btn.primary {
  background: #fff7ed;
  border-color: #ffd2ad;
}
.shot .alert {
  width: 200px;
  height: 40px;
  border-radius: 12px;
  background: #fffbeb;
  border: 1px solid #fde4b8;
}
.arrow {
  position: absolute;
  overflow: visible;
}
.stroke {
  fill: none;
  stroke: #1e1e1e;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.note {
  position: absolute;
  width: 220px;
  height: 170px;
  padding: 20px;
  box-sizing: border-box;
  background: #ffec99;
  border-radius: 4px;
  font-size: 20px;
  line-height: 1.35;
  box-shadow: 0 2px 6px rgb(0 0 0 / 0.08);
}
.ui {
  position: absolute;
  z-index: 2;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.menu-button {
  left: 16px;
  top: 16px;
  display: grid;
  gap: 3px;
  place-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f5f5f5;
}
.menu-button span {
  width: 14px;
  height: 2px;
  border-radius: 1px;
  background: #404040;
}
.tools {
  left: 50%;
  top: 16px;
  display: flex;
  gap: 2px;
  padding: 4px;
  transform: translateX(-50%);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 0 0 1px #e5e5e5, 0 2px 6px rgb(0 0 0 / 0.06);
}
.tool {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: #404040;
}
.tool.gap {
  margin-right: 6px;
}
.tool.on {
  background: #e5e5e5;
  color: #171717;
}
.tool svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.library {
  right: 16px;
  top: 16px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f5f5f5;
  color: #404040;
  font-size: 13px;
}
.zoom {
  left: 16px;
  bottom: 16px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  background: #f5f5f5;
  color: #404040;
  font-size: 13px;
}
.zoom button {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: inherit;
  font-size: 16px;
  cursor: pointer;
}
.zoom span {
  min-width: 44px;
  text-align: center;
}
.saved {
  right: 16px;
  bottom: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: #737373;
  font-size: 12px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: #22c55e;
}
</style>
