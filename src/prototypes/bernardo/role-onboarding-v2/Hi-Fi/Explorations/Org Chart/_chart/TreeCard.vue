<script setup lang="ts">
import { roles } from '../../../../_wire/world'
import { placeIllustrations, roleIllustrations } from '../../../_ui/illustrations'
import { useOrgChart, type Place } from './district'
import PersonPopover from './PersonPopover.vue'

// One place on the tree: its illustration and name, then each position, under its role's illustration, with the
// people in it. A position with nobody shows as an open slot that adds people; the Organization's card is wide and
// lays its positions side by side, as the top of the tree.
defineProps<{ place: Place; wide?: boolean }>()

const chart = useOrgChart()

// Positions name their role as the model writes it, so the illustration is found by that name.
const roleArt = Object.fromEntries(Object.values(roles).map((role) => [role.label, roleIllustrations[role.key]]))
</script>

<template>
  <article class="card overflow-hidden rounded-2xl border border-default bg-default" :class="{ wide }">
    <header class="flex items-center gap-3 border-b border-default px-4 py-3">
      <img class="place-art" :src="placeIllustrations[place.level]" alt="" />
      <div class="min-w-0">
        <p class="text-sm leading-5 font-semibold text-highlighted">{{ place.name }}</p>
        <p class="text-xs leading-4 text-muted">{{ place.level }} · {{ place.detail }}</p>
      </div>
    </header>

    <div class="positions">
      <section v-for="position in place.positions" :key="position.id" class="flex flex-col gap-1 px-3 py-3">
        <div class="flex h-6 items-center justify-between ps-1">
          <h3 class="role-title text-xs font-semibold text-muted">
            <img class="role-art" :src="roleArt[position.role]" alt="" />
            {{ position.title }}
            <span v-if="position.members.length" class="font-normal text-dimmed">{{ position.members.length }}</span>
          </h3>
          <UTooltip v-if="position.members.length" :text="position.add" :delay-duration="150">
            <UButton
              icon="i-lucide-plus"
              color="neutral"
              variant="ghost"
              size="xs"
              :aria-label="`${position.add} to ${place.name}`"
              @click="chart.startAdding(place, position)"
            />
          </UTooltip>
        </div>

        <ul v-if="position.members.length" class="people">
          <li v-for="member in position.members" :key="member.email">
            <PersonPopover :place="place" :position="position" :member="member">
              <button type="button" class="person flex w-full cursor-pointer items-center gap-2 rounded-lg p-1 text-left">
                <UAvatar :text="member.initials" :alt="member.name" size="xs" class="bg-secondary-50 text-secondary-700" />
                <span class="min-w-0 flex-1 truncate text-sm text-highlighted" :title="member.name">
                  {{ member.name }}<span v-if="member.you" class="text-muted"> (you)</span>
                </span>
                <UBadge v-if="member.invited" color="info" variant="soft" size="sm">Invited</UBadge>
              </button>
            </PersonPopover>
          </li>
        </ul>
        <button
          v-else
          type="button"
          class="open-slot flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm"
          :aria-label="`${position.add} to ${place.name}`"
          @click="chart.startAdding(place, position)"
        >
          <UIcon name="i-lucide-plus" class="size-4 flex-none" />
          {{ position.add }}
        </button>
      </section>
    </div>
  </article>
</template>

<style scoped>
.card {
  width: 248px;
}

.card.wide {
  width: 760px;
}

.place-art,
.role-art {
  flex: none;
  max-width: none;
}

.place-art {
  width: 36px;
  height: 36px;
}

.role-art {
  width: 24px;
  height: 24px;
}

.role-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.positions > * + * {
  border-top: 1px solid var(--ui-border);
}

.wide .positions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.wide .positions > * + * {
  border-top: 0;
  border-left: 1px solid var(--ui-border);
}

.people {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.person:hover,
.person[data-state='open'] {
  background: var(--ui-bg-elevated);
}

.open-slot {
  border: 1px dashed var(--ui-border-accented);
  color: var(--ui-text-muted);
}

.open-slot:hover {
  border-color: var(--ui-secondary);
  color: var(--ui-secondary);
}

.person:focus-visible,
.open-slot:focus-visible {
  outline: 2px solid var(--ui-secondary);
  outline-offset: 1px;
}
</style>
