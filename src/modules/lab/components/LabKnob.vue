<script setup lang="ts">
import {
  KNOB_FAMILIES,
  knobClass,
  knobDisplay,
  knobParse,
  knobPixels,
  knobStep,
  knobValues,
  type Knob,
  type KnobTheme,
} from '../../../../tooling/preview/knobs'
import { KNOB_ICONS } from '../utils/knobs'

// One knob in the Breakdown's inspector: its family's coloured icon, then
// its value, in pixels for sizes. Drag the icon sideways, type a value, or
// press the arrow keys to move it along the theme's scale. A colour knob's
// value opens the theme's colours and shades instead of taking text, each
// with a swatch of the colour the system paints it with.
const props = defineProps<{
  knob: Knob
  /** The value it shows: an unsaved one, or what the piece renders with. */
  value: string
  label: string
  theme: KnobTheme
  /** Each colour class's colour in the preview, by class; empty until known. */
  swatches?: Record<string, string>
}>()
const emit = defineEmits<{ change: [value: string]; hover: [on: boolean] }>()
const { t } = useI18n()

const look = computed(() => KNOB_FAMILIES[props.knob.family])
const isColor = computed(() => look.value.kind === 'color')
const at = computed(() => ({ ...props.knob, value: props.value }))
const display = computed(() =>
  knobDisplay(props.knob.family, props.value, props.theme),
)
const pixels = computed(() =>
  knobPixels(props.knob.family, props.value, props.theme),
)
const valueText = computed(() =>
  pixels.value === null
    ? display.value
    : t('lab.knobs.pixels', { value: display.value }),
)

function step(by: number) {
  const next = knobStep(at.value, by, props.theme)
  if (next !== props.value) emit('change', next)
}
const STEP_KEYS: Record<string, number> = {
  ArrowRight: 1,
  ArrowUp: 1,
  ArrowLeft: -1,
  ArrowDown: -1,
}
function stepKey(event: KeyboardEvent) {
  const by = STEP_KEYS[event.key]
  if (by === undefined) return
  event.preventDefault()
  step(event.shiftKey ? by * 4 : by)
}

// Typing: the field shows the value until it is edited, and takes the
// typed one on Enter or when focus leaves.
const draft = ref<string | null>(null)
function commit() {
  if (draft.value === null) return
  const next = knobParse(props.knob.family, draft.value, props.theme)
  draft.value = null
  if (next && next !== props.value) emit('change', next)
}
function typed(event: KeyboardEvent) {
  if (event.key === 'Enter') commit()
  else if (event.key === 'Escape' && draft.value !== null) {
    // Escape drops the typing, and leaves the selection alone.
    event.preventDefault()
    draft.value = null
  } else stepKey(event)
}

// Dragging the icon sideways: one step every few pixels.
const DRAG_STEP = 8
let drag: { id: number; x: number; from: Knob } | null = null
function grab(event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  drag = { id: event.pointerId, x: event.clientX, from: at.value }
}
function dragged(event: PointerEvent) {
  if (!drag || drag.id !== event.pointerId) return
  const by = Math.trunc((event.clientX - drag.x) / DRAG_STEP)
  const next = knobStep(drag.from, by, props.theme)
  if (next !== props.value) emit('change', next)
}
const released = () => void (drag = null)

const open = ref(false)
const colors = computed(() => {
  const values = knobValues(props.knob.family, props.theme)
  const named = values.filter(
    (value) =>
      !props.theme.colors.some(
        (color) =>
          value === color ||
          value.startsWith(`${color}/`) ||
          value.startsWith(`${color}-`),
      ),
  )
  return [
    { name: t('lab.knobs.semantic'), values: named },
    ...props.theme.colors.map((color) => ({
      name: color,
      values: values.filter(
        (value) =>
          value === color ||
          value.startsWith(`${color}/`) ||
          value.startsWith(`${color}-`),
      ),
    })),
  ]
})
// Within a colour's row, a shade or an opacity is named by its number.
const short = (row: string, value: string) =>
  value.startsWith(`${row}-`)
    ? value.slice(row.length + 1)
    : value.startsWith(`${row}/`)
      ? `${value.slice(row.length + 1)}%`
      : value
const swatch = (value: string) => props.swatches?.[knobClass(props.knob, value)]
function choose(value: string) {
  open.value = false
  if (value !== props.value) emit('change', value)
}

let hovered = false
function hover(on: boolean) {
  if (hovered === on) return
  hovered = on
  emit('hover', on)
}
onBeforeUnmount(() => hover(false))
</script>

<template>
  <UTooltip :text="label" :content="{ side: 'top' }">
    <div
      :data-knob="knob.id"
      class="flex h-7 shrink-0 items-center gap-1 rounded-full pr-1.5 pl-0.5 transition-colors focus-within:bg-elevated hover:bg-elevated"
      @pointerenter="hover(true)"
      @pointerleave="hover(false)"
      @focusin="hover(true)"
      @focusout="hover(false)"
    >
      <span
        data-knob-handle
        aria-hidden="true"
        class="grid size-6 shrink-0 cursor-ew-resize touch-none place-items-center rounded-full"
        :style="{ color: look.color, backgroundColor: `${look.color}1f` }"
        @pointerdown="grab"
        @pointermove="dragged"
        @pointerup="released"
        @pointercancel="released"
      >
        <UIcon :name="KNOB_ICONS[knob.family]" class="size-3.5" />
      </span>
      <UPopover v-if="isColor" v-model:open="open" :content="{ side: 'top' }">
        <button
          type="button"
          class="flex max-w-28 items-center gap-1 rounded font-mono text-xs text-default outline-none focus-visible:ring-2 focus-visible:ring-primary"
          :aria-label="t('lab.knobs.color', { label, value })"
          @keydown="stepKey"
        >
          <span
            v-if="swatch(value)"
            aria-hidden="true"
            class="size-3 shrink-0 rounded-full ring-1 ring-default ring-inset"
            :style="{ backgroundColor: swatch(value) }"
          />
          <span class="truncate">{{ display }}</span>
        </button>
        <template #content>
          <div
            role="group"
            :aria-label="t('lab.knobs.colors', { label })"
            class="max-h-80 w-88 space-y-2 overflow-y-auto p-2"
          >
            <div v-for="row in colors" :key="row.name" class="space-y-1">
              <p class="text-xs font-medium text-muted">{{ row.name }}</p>
              <div class="flex flex-wrap gap-1">
                <UButton
                  v-for="option in row.values"
                  :key="option"
                  size="xs"
                  :color="option === value ? 'primary' : 'neutral'"
                  :variant="option === value ? 'solid' : 'outline'"
                  class="font-mono"
                  :label="short(row.name, option)"
                  :aria-label="option"
                  :aria-pressed="option === value"
                  @click="choose(option)"
                >
                  <template v-if="swatch(option)" #leading>
                    <span
                      aria-hidden="true"
                      class="size-3 shrink-0 rounded-full ring-1 ring-default ring-inset"
                      :style="{ backgroundColor: swatch(option) }"
                    />
                  </template>
                </UButton>
              </div>
            </div>
          </div>
        </template>
      </UPopover>
      <input
        v-else
        role="spinbutton"
        type="text"
        inputmode="decimal"
        :aria-label="label"
        :aria-valuetext="valueText"
        :aria-valuenow="pixels ?? undefined"
        :value="draft ?? display"
        class="field-sizing-content min-w-3 max-w-12 rounded bg-transparent px-0.5 font-mono text-xs text-default tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary"
        @input="draft = ($event.target as HTMLInputElement).value"
        @keydown="typed"
        @blur="commit"
      />
    </div>
  </UTooltip>
</template>
