<script setup lang="ts">
// The welcome's drawings, ported from the React studio's onboarding
// illustrations (AgentSketch, StorySketch and the canvas ArtifactSketch).
// They use the studio's theme colours, so they follow light and dark mode,
// and human labels: they introduce ideas, not file formats.
export type SketchKind =
  'agent' | 'toolkit' | 'context' | 'skills' | 'canvas' | 'brief'

const props = defineProps<{ kind: SketchKind }>()
const { t } = useI18n()
const studio = useStudioConfig()
const grid = useId()

const paper = 'var(--ui-bg)'
const ink = 'var(--ui-text-highlighted)'
const muted = 'var(--ui-text-muted)'
const border = 'var(--ui-border)'

// The "screen" and arrow most story sketches share.
const story = {
  toolkit: {
    screen: { x: 249, y: 38, width: 166, label: 'toolkit.screen' },
    arrow: { x: 194, y: 90, length: 38 },
  },
  context: {
    screen: { x: 250, y: 38, width: 165, label: 'context.screen' },
    arrow: { x: 204, y: 89, length: 30 },
  },
  skills: { screen: null, arrow: { x: 207, y: 89, length: 30 } },
  brief: {
    screen: { x: 257, y: 38, width: 157, label: 'brief.concept' },
    arrow: { x: 219, y: 91, length: 23 },
  },
} as const
const layout = computed(() =>
  props.kind in story ? story[props.kind as keyof typeof story] : null,
)
const lines = ({ x, y, width }: { x: number; y: number; width: number }) =>
  `M${x + 52} ${y + 43}h${width - 65}M${x + 52} ${y + 61}h${width - 78}M${x + 52} ${y + 80}h${width - 70}`
const briefRows = ['problem', 'audience', 'learn'] as const
</script>

<template>
  <svg
    v-if="kind === 'agent'"
    viewBox="0 0 440 210"
    class="h-44 w-full text-highlighted"
    role="img"
    :aria-label="t('welcome.sketch.agent.label')"
  >
    <defs>
      <pattern :id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
        <path d="M16 0H0V16" fill="none" stroke="currentColor" opacity=".07" />
      </pattern>
    </defs>
    <rect x="8" y="8" width="424" height="194" :fill="`url(#${grid})`" />
    <g transform="rotate(-3 126 102)">
      <rect
        x="32"
        y="32"
        width="200"
        height="134"
        rx="5"
        :fill="paper"
        :stroke="border"
      />
      <path d="M32 58H232" :stroke="border" />
      <text x="47" y="49" font-size="12" :fill="muted">
        {{ t('welcome.sketch.agent.agent') }}
      </text>
      <text x="47" y="86" font-size="12" :fill="ink">
        {{ t('welcome.sketch.agent.prompt') }}
      </text>
      <path
        d="M47 104H177M47 115H206M47 126H164"
        stroke="currentColor"
        opacity=".2"
      />
      <rect
        x="47"
        y="138"
        width="56"
        height="14"
        rx="3"
        fill="currentColor"
        opacity=".08"
      />
    </g>
    <g transform="rotate(3 302 135)">
      <rect
        x="209"
        y="72"
        width="199"
        height="118"
        rx="5"
        :fill="paper"
        :stroke="border"
      />
      <path d="M209 98H408" :stroke="border" />
      <text x="223" y="89" font-size="12" :fill="muted">{{ studio.name }}</text>
      <rect
        x="223"
        y="111"
        width="44"
        height="62"
        rx="3"
        fill="currentColor"
        opacity=".07"
      />
      <path
        d="M279 116H393M279 131H367M279 155H393M279 170H352"
        stroke="currentColor"
        opacity=".3"
      />
      <path d="M355 130V148L360 143L365 151L369 149L364 141H372Z" :fill="ink" />
    </g>
  </svg>

  <svg
    v-else-if="kind === 'canvas'"
    viewBox="0 0 440 150"
    class="h-32 w-full text-highlighted"
    role="img"
    :aria-label="t('welcome.sketch.canvas.label')"
  >
    <g :fill="paper" :stroke="border">
      <rect
        x="35"
        y="20"
        width="122"
        height="87"
        rx="3"
        transform="rotate(-3 96 63)"
      />
      <rect
        x="186"
        y="9"
        width="103"
        height="71"
        rx="3"
        transform="rotate(2 237 44)"
      />
      <rect x="177" y="96" width="180" height="44" rx="3" />
      <rect x="318" y="31" width="82" height="52" rx="3" />
    </g>
    <g font-size="11" :fill="muted">
      <text x="48" y="39">{{ t('welcome.sketch.canvas.screen') }}</text>
      <text x="199" y="28">{{ t('welcome.sketch.canvas.brief') }}</text>
      <text x="329" y="50">{{ t('welcome.sketch.canvas.note') }}</text>
    </g>
    <path
      d="M49 54H141M49 66H132M49 78H139M200 42H271M200 52H262M200 62H267"
      stroke="currentColor"
      opacity=".25"
    />
    <g stroke="currentColor" fill="none" opacity=".35">
      <rect x="190" y="109" width="38" height="17" rx="2" />
      <path d="M228 118H243L257 104L271 118L257 132L243 118M271 118H299" />
      <rect x="299" y="109" width="44" height="17" rx="2" />
    </g>
  </svg>

  <svg
    v-else-if="layout"
    viewBox="0 0 440 180"
    class="h-40 w-full text-highlighted"
    role="img"
    :aria-label="t(`welcome.sketch.${kind}.label`)"
  >
    <template v-if="kind === 'toolkit'">
      <rect
        x="24"
        y="24"
        width="158"
        height="132"
        rx="5"
        :fill="paper"
        :stroke="border"
      />
      <text x="38" y="46" :fill="muted" font-size="12">
        {{ t('welcome.sketch.toolkit.kit') }}
      </text>
      <circle
        v-for="i in [0, 1, 2]"
        :key="i"
        :cx="48 + i * 30"
        cy="69"
        r="9"
        :fill="ink"
        :opacity="0.15 + i * 0.25"
      />
      <rect x="38" y="92" width="64" height="21" rx="5" :fill="ink" />
      <text x="49" y="107" font-size="10" :fill="paper">
        {{ t('welcome.sketch.toolkit.button') }}
      </text>
      <rect
        x="38"
        y="124"
        width="126"
        height="18"
        rx="3"
        :fill="paper"
        :stroke="border"
      />
    </template>

    <template v-else-if="kind === 'context'">
      <rect
        x="25"
        y="29"
        width="166"
        height="122"
        rx="4"
        :fill="paper"
        :stroke="border"
      />
      <text x="40" y="53" font-size="12" :fill="ink">
        {{ t('welcome.sketch.context.heading') }}
      </text>
      <circle cx="53" cy="80" r="11" :fill="ink" opacity=".1" />
      <path
        d="M76 76H173M76 88H147M40 112H174M40 127H156"
        :stroke="ink"
        opacity=".25"
      />
    </template>

    <template v-else-if="kind === 'skills'">
      <rect
        x="28"
        y="35"
        width="166"
        height="110"
        rx="5"
        :fill="paper"
        :stroke="border"
      />
      <text x="43" y="58" font-size="12" :fill="ink">
        {{ t('welcome.sketch.skills.heading') }}
      </text>
      <text x="43" y="85" font-size="11" :fill="muted">
        {{ t('welcome.sketch.skills.task') }}
      </text>
      <path d="M43 104H174M43 118H149" :stroke="ink" opacity=".25" />
      <rect
        x="250"
        y="43"
        width="162"
        height="94"
        rx="5"
        :fill="paper"
        :stroke="border"
      />
      <text x="266" y="65" font-size="12" :fill="ink">
        {{ t('welcome.sketch.skills.agent') }}
      </text>
      <rect
        x="260"
        y="77"
        width="142"
        height="24"
        rx="4"
        :fill="paper"
        :stroke="border"
      />
      <text x="266" y="93" font-size="10" font-family="monospace" :fill="ink">
        /build-prototype
      </text>
      <text x="266" y="121" font-size="10" :fill="muted">
        {{ t('welcome.sketch.skills.running') }}
      </text>
    </template>

    <template v-else-if="kind === 'brief'">
      <rect
        x="24"
        y="15"
        width="183"
        height="150"
        rx="4"
        :fill="paper"
        :stroke="border"
      />
      <text x="40" y="35" font-size="12" :fill="ink">
        {{ t('welcome.sketch.brief.heading') }}
      </text>
      <g v-for="(row, i) in briefRows" :key="row">
        <text x="40" :y="61 + i * 34" font-size="10" :fill="muted">
          {{ t(`welcome.sketch.brief.${row}`) }}
        </text>
        <path :d="`M40 ${72 + i * 34}h146`" :stroke="ink" opacity=".25" />
      </g>
    </template>

    <path
      :d="`M${layout.arrow.x} ${layout.arrow.y}h${layout.arrow.length}m-7 -5l7 5l-7 5`"
      :stroke="muted"
      fill="none"
    />
    <g v-if="layout.screen">
      <rect
        :x="layout.screen.x"
        :y="layout.screen.y"
        :width="layout.screen.width"
        height="104"
        rx="5"
        :fill="paper"
        :stroke="border"
      />
      <path
        :d="`M${layout.screen.x} ${layout.screen.y + 25}h${layout.screen.width}`"
        :stroke="border"
      />
      <text
        :x="layout.screen.x + 12"
        :y="layout.screen.y + 17"
        font-size="11"
        :fill="muted"
      >
        {{ t(`welcome.sketch.${layout.screen.label}`) }}
      </text>
      <rect
        :x="layout.screen.x + 12"
        :y="layout.screen.y + 37"
        width="28"
        height="52"
        rx="3"
        :fill="ink"
        opacity=".07"
      />
      <path :d="lines(layout.screen)" :stroke="ink" opacity=".25" />
    </g>
    <template v-if="kind === 'context'">
      <circle cx="365" cy="118" r="15" :fill="paper" :stroke="ink" />
      <path d="M358 118l5 5l9-11" :stroke="ink" fill="none" />
    </template>
  </svg>
</template>
