<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue'
import { roleIllustrations } from './illustrations'
import { EYEBROW, levelTint } from './look'
import { useMapState, type MapLayers } from './state'
import { rowTarget, whosWho, type WhoRow } from './whoswho'

// The left column: everyone in the story grouped by where their role lives, with a count per role at the current
// step, a search by person or role, and the switches that show or hide kinds of things on the map. A row selects its
// person on the map (the panel opens); repeated clicks walk through a role several people hold. On a preview too
// narrow for the column, the canvas and the panel together, it folds into a rail of illustrations while the panel is
// open, so the map keeps a readable size; its button folds or unfolds it at any width.
const { story, at, mode, layers, selectedId, select } = useMapState()

const query = ref('')
const groups = computed(() => whosWho(story.value, at.value, query.value))
const railGroups = computed(() => whosWho(story.value, at.value))

const narrow = ref(false)
if (typeof window !== 'undefined' && window.matchMedia) {
  const media = window.matchMedia('(max-width: 1399px)')
  const update = () => {
    narrow.value = media.matches
  }
  update()
  media.addEventListener('change', update)
  onScopeDispose(() => media.removeEventListener('change', update))
}
const panelOpen = computed(() => Boolean(selectedId.value && story.value.nodes[selectedId.value]))
const folded = ref<boolean | null>(null)
const collapsed = computed(() => folded.value ?? (narrow.value && panelOpen.value))
const fold = () => {
  folded.value = !collapsed.value
}

const switches: { key: keyof MapLayers; label: string }[] = [
  { key: 'invitations', label: 'Invitations' },
  { key: 'creations', label: 'Teams and Cohorts created' },
  { key: 'programs', label: 'Programs' },
  { key: 'next', label: 'What comes next' },
]

const isSelected = (row: WhoRow) => row.holders.some((holder) => holder.id === selectedId.value)
const rowClass = (row: WhoRow) => [
  'rounded-lg text-default focus-visible:outline-2 focus-visible:outline-info',
  isSelected(row) ? 'bg-info-50' : 'enabled:hover:bg-elevated',
  { 'opacity-45': row.count === 0 },
]

function choose(row: WhoRow) {
  const id = rowTarget(row, selectedId.value)
  if (id) select(id)
}
</script>

<template>
  <aside
    v-if="collapsed"
    class="flex w-15 shrink-0 flex-col items-center gap-3.5 overflow-y-auto border-r border-default bg-default px-2 py-3.5"
    aria-label="Who's who"
  >
    <UTooltip text="Show Who's who" :content="{ side: 'right' }">
      <UButton
        icon="i-lucide-panel-left-open"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="Show Who's who"
        :aria-expanded="false"
        @click="fold"
      />
    </UTooltip>
    <section v-for="group in railGroups" :key="group.kind" :aria-label="group.title" class="flex flex-col items-center">
      <i class="mb-1 size-2 rounded-[3px]" :class="levelTint[group.kind].dot" aria-hidden="true" />
      <UTooltip v-for="row in group.rows" :key="row.role" :text="row.label" :content="{ side: 'right' }">
        <button
          type="button"
          class="relative flex h-10 w-11 items-center justify-center"
          :class="rowClass(row)"
          :disabled="row.holders.length === 0"
          :aria-current="isSelected(row) ? 'true' : undefined"
          :aria-label="`${row.label}, ${row.count}`"
          :data-role="row.role"
          @click="choose(row)"
        >
          <img :src="roleIllustrations[row.role]" alt="" class="size-[26px] shrink-0" />
          <span
            class="absolute right-px bottom-px min-w-[15px] rounded-full bg-default px-[3px] text-center text-xs leading-3.5 text-dimmed tabular-nums"
            aria-hidden="true"
          >
            {{ row.count }}
          </span>
        </button>
      </UTooltip>
    </section>
  </aside>

  <aside
    v-else
    class="flex w-58 shrink-0 flex-col gap-3.5 overflow-y-auto border-r border-default bg-default px-3.5 py-5"
    aria-label="Who's who"
  >
    <div class="flex items-start justify-between gap-2">
      <div>
        <h2 class="font-heading text-base font-bold tracking-tight text-highlighted">Who's who</h2>
        <p class="mt-0.5 text-xs text-dimmed">
          {{ mode === 'story' ? 'Everyone in this story' : 'Everyone in the district' }}, grouped by where their role
          lives.
        </p>
      </div>
      <UTooltip text="Hide Who's who" :content="{ side: 'right' }">
        <UButton
          icon="i-lucide-panel-left-close"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Hide Who's who"
          :aria-expanded="true"
          @click="fold"
        />
      </UTooltip>
    </div>

    <UInput
      v-model="query"
      type="search"
      icon="i-lucide-search"
      placeholder="Find a person or role"
      aria-label="Find a person or role"
      class="w-full"
    />

    <div class="flex flex-col gap-3">
      <section v-for="group in groups" :key="group.kind" :aria-labelledby="`whoswho-${group.kind}`">
        <h3 :id="`whoswho-${group.kind}`" class="mt-0.5 mb-1 ml-1 flex items-center gap-1.5" :class="EYEBROW">
          <i class="size-2 rounded-[3px]" :class="levelTint[group.kind].dot" aria-hidden="true" />
          {{ group.title }}
        </h3>
        <ul class="flex flex-col gap-px">
          <li v-for="row in group.rows" :key="row.role">
            <button
              type="button"
              class="flex w-full items-center gap-2.5 px-1.5 py-1 text-left text-sm leading-[18px] font-medium"
              :class="rowClass(row)"
              :disabled="row.holders.length === 0"
              :aria-current="isSelected(row) ? 'true' : undefined"
              :data-role="row.role"
              @click="choose(row)"
            >
              <img :src="roleIllustrations[row.role]" alt="" class="size-[26px] shrink-0" />
              <span class="min-w-0 flex-1">
                <span class="block truncate">{{ row.label }}</span>
                <span v-if="row.matches.length" class="block truncate text-xs leading-4 text-dimmed">
                  {{ row.matches.map((holder) => holder.name).join(', ') }}
                </span>
              </span>
              <span class="flex-none text-xs text-dimmed tabular-nums">{{ row.count }}</span>
            </button>
          </li>
        </ul>
      </section>
      <p v-if="groups.length === 0" class="px-1 text-xs text-dimmed" role="status">
        Nobody matches “{{ query.trim() }}”.
      </p>
    </div>

    <div class="flex flex-col gap-2 border-t border-muted pt-3">
      <label v-for="item in switches" :key="item.key" class="flex items-center justify-between gap-3 text-sm text-muted">
        {{ item.label }}
        <USwitch
          v-model="layers[item.key]"
          color="secondary"
          size="sm"
          :aria-label="item.label"
          :disabled="item.key === 'next' && mode !== 'story'"
        />
      </label>
    </div>
  </aside>
</template>

