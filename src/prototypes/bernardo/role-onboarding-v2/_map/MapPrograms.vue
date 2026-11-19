<script setup lang="ts">
import { computed } from 'vue'
import { programIllustration } from './illustrations'
import { shelfId, SHELF } from './layout'
import { FADE, FADED, FLOATING, RUNS_TINT } from './look'
import { accessLabel, cohortCount, cohortsRunning, shelfPrograms } from './programs'
import { usePathView } from './path'
import { useMapState } from './state'
import type { PlaceId } from './story'

// The Programs an Organization can run, on a shelf inside it: open to everyone, or custom through a Partnership,
// each with how many of the Cohorts on the map run it. Programs belong to the Organization's access, not to a Team.
const props = defineProps<{ place: PlaceId }>()

const { story, layout, shown } = useMapState()

const rect = computed(() => layout.value.boxes[shelfId(props.place)])
/** Programs are never on someone's path of invitations, so the shelf fades while one plays. */
const { active: dim } = usePathView()
const name = computed(() => story.value.places[props.place]?.name ?? '')
const programs = computed(() =>
  shelfPrograms(story.value).map((program) => ({
    ...program,
    cohorts: cohortsRunning(story.value, program.name, shown.value.places, props.place).length,
  })),
)
const sizes = {
  '--shelf-top': `${SHELF.top}px`,
  '--shelf-header': `${SHELF.header}px`,
  '--shelf-row': `${SHELF.row}px`,
  '--shelf-gap': `${SHELF.rowGap}px`,
  '--shelf-bottom': `${SHELF.bottom}px`,
}
</script>

<template>
  <section
    v-if="rect"
    class="absolute z-4 rounded-3xl border border-muted bg-default px-3 pt-(--shelf-top) pb-(--shelf-bottom)"
    :class="[FLOATING, FADE, { [FADED]: dim }]"
    :style="{
      ...sizes,
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    }"
    :aria-label="`Programs ${name} can run`"
  >
    <header class="flex h-(--shelf-header) items-start gap-2.5 px-1">
      <img :src="programIllustration" alt="" class="size-[30px]" />
      <div>
        <h3 class="font-heading text-sm leading-[18px] font-bold text-highlighted">Programs</h3>
        <p class="text-xs leading-3.5 text-dimmed">{{ name }} can run these</p>
      </div>
    </header>
    <ul>
      <li
        v-for="program in programs"
        :key="program.name"
        class="mt-(--shelf-gap) flex h-(--shelf-row) items-center gap-2.5 rounded-xl px-2"
        :class="{ [RUNS_TINT]: program.cohorts > 0 }"
        :data-program="program.name"
      >
        <img :src="programIllustration" alt="" class="size-7" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-xs leading-4 font-semibold text-highlighted">{{ program.name }}</p>
          <p
            class="truncate text-xs leading-3.5"
            :class="program.access === 'partnership' ? 'font-semibold text-secondary-500' : 'text-dimmed'"
          >
            {{ accessLabel[program.access] }}
          </p>
        </div>
        <UBadge
          v-if="program.cohorts > 0"
          color="secondary"
          variant="outline"
          size="sm"
          class="flex-none rounded-full bg-default font-bold whitespace-nowrap text-secondary-700 ring-secondary-100"
        >
          {{ cohortCount(program.cohorts) }}
        </UBadge>
        <UBadge
          v-else
          color="neutral"
          variant="soft"
          size="sm"
          class="flex-none rounded-full bg-transparent whitespace-nowrap text-dimmed"
        >
          {{ cohortCount(program.cohorts) }}
        </UBadge>
      </li>
    </ul>
  </section>
</template>
