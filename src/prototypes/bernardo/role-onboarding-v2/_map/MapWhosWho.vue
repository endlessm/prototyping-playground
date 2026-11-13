<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue'
import { roleIllustrations } from './illustrations'
import { useMapState, type MapLayers } from './state'
import { rowTarget, whosWho, type WhoRow } from './whoswho'

// The left column: everyone in the story grouped by where their role lives, with a count per role at the current
// step, a search by person or role, and the switches that show or hide kinds of things on the map. A row selects its
// person on the map (the panel opens); repeated clicks walk through a role several people hold. On a preview too
// narrow for the column, the canvas and the panel together, it folds into a rail of illustrations while the panel is
// open, so the map keeps a readable size; its button folds or unfolds it at any width.
const { story, step, mode, layers, selectedId, select } = useMapState()

const query = ref('')
const at = computed(() => (mode.value === 'story' ? step.value : story.value.steps.length))
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

function choose(row: WhoRow) {
  const id = rowTarget(row, selectedId.value)
  if (id) select(id)
}
</script>

<template>
  <aside v-if="collapsed" class="whoswho rail" aria-label="Who's who">
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
      <i class="dot mb-1" :class="group.kind.toLowerCase()" aria-hidden="true" />
      <UTooltip v-for="row in group.rows" :key="row.role" :text="row.label" :content="{ side: 'right' }">
        <button
          type="button"
          class="row"
          :class="{ selected: isSelected(row), off: row.count === 0 }"
          :disabled="row.holders.length === 0"
          :aria-current="isSelected(row) ? 'true' : undefined"
          :aria-label="`${row.label}, ${row.count}`"
          :data-role="row.role"
          @click="choose(row)"
        >
          <img :src="roleIllustrations[row.role]" alt="" class="size-[26px] shrink-0" />
          <span class="count" aria-hidden="true">{{ row.count }}</span>
        </button>
      </UTooltip>
    </section>
  </aside>

  <aside v-else class="whoswho" aria-label="Who's who">
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
        <h3 :id="`whoswho-${group.kind}`" class="label">
          <i class="dot" :class="group.kind.toLowerCase()" aria-hidden="true" />
          {{ group.title }}
        </h3>
        <ul class="flex flex-col gap-px">
          <li v-for="row in group.rows" :key="row.role">
            <button
              type="button"
              class="row"
              :class="{ selected: isSelected(row), off: row.count === 0 }"
              :disabled="row.holders.length === 0"
              :aria-current="isSelected(row) ? 'true' : undefined"
              :data-role="row.role"
              @click="choose(row)"
            >
              <img :src="roleIllustrations[row.role]" alt="" class="size-[26px] shrink-0" />
              <span class="min-w-0 flex-1">
                <span class="block truncate">{{ row.label }}</span>
                <span v-if="row.matches.length" class="block truncate text-[11.5px] leading-4 text-dimmed">
                  {{ row.matches.map((holder) => holder.name).join(', ') }}
                </span>
              </span>
              <span class="count">{{ row.count }}</span>
            </button>
          </li>
        </ul>
      </section>
      <p v-if="groups.length === 0" class="px-1 text-[12.5px] text-dimmed" role="status">
        Nobody matches “{{ query.trim() }}”.
      </p>
    </div>

    <div class="flex flex-col gap-2 border-t border-muted pt-3">
      <label v-for="item in switches" :key="item.key" class="flex items-center justify-between gap-3 text-[13px] text-muted">
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

<style scoped>
.whoswho {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 14px;
  width: 232px;
  overflow-y: auto;
  padding: 20px 14px;
  border-right: 1px solid var(--ui-border);
  background: var(--ui-bg);
}

.label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0 4px 4px;
  color: var(--ui-text-dimmed);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 3px;
  background: var(--color-slate-300);
}

.dot.organization {
  background: var(--color-cornflower-500);
}

.dot.team {
  background: var(--color-orange-500);
}

.dot.cohort {
  background: var(--color-sky-500);
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 4px 6px;
  border-radius: 8px;
  color: var(--ui-text);
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  text-align: left;
}

.row:not(:disabled):hover {
  background: var(--ui-bg-elevated);
}

.row:focus-visible {
  outline: 2px solid var(--ui-info);
}

.row.selected {
  background: var(--color-sky-50);
}

.row.off {
  opacity: 0.45;
}

.rail {
  align-items: center;
  width: 60px;
  padding: 14px 8px;
}

.rail .row {
  position: relative;
  justify-content: center;
  width: 44px;
  height: 40px;
  padding: 0;
}

.rail .count {
  position: absolute;
  right: 1px;
  bottom: 1px;
  min-width: 15px;
  padding: 0 3px;
  border-radius: 100px;
  background: var(--ui-bg);
  font-size: 10px;
  line-height: 14px;
  text-align: center;
}

.count {
  flex: none;
  color: var(--ui-text-dimmed);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
</style>
