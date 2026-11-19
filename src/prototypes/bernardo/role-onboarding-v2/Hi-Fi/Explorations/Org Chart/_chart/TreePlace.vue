<script setup lang="ts">
import { roles } from '../../../../_wire/world'
import { placeIllustrations, roleIllustrations } from '../../../_ui/illustrations'
import { useOrgChart, type Place } from './district'
import PersonPopover from './PersonPopover.vue'

// One place on the tree with only its people in cards. The place and its positions are loose headings that group
// those cards: the place's illustration and name on top, then each position under its role's illustration. A card
// says how the person came to the position, or that they are still only invited. A position with nobody shows as an
// open slot the size of a card. The Organization lays its positions side by side, as the top of the tree, and a place
// with places under it closes with a bracket, so the line down leaves the whole group and not the last person in it.
defineProps<{ place: Place; wide?: boolean }>()

const chart = useOrgChart()

// Positions name their role as the model writes it, so the illustration is found by that name.
const roleArt = Object.fromEntries(Object.values(roles).map((role) => [role.label, roleIllustrations[role.key]]))
</script>

<template>
  <div class="place" :class="{ wide }">
    <header class="place-head">
      <img class="place-art" :src="placeIllustrations[place.level]" alt="" />
      <p class="text-sm leading-5 font-semibold text-highlighted">{{ place.name }}</p>
      <p class="text-xs leading-4 text-muted">{{ place.level }} · {{ place.detail }}</p>
    </header>

    <div class="positions">
      <section v-for="position in place.positions" :key="position.id" class="position">
        <div class="role-head">
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
              <button type="button" class="person">
                <UAvatar :text="member.initials" :alt="member.name" size="md" class="bg-secondary-50 text-secondary-700" />
                <span class="person-text">
                  <span class="person-name text-sm font-medium text-highlighted" :title="member.name">
                    {{ member.name }}<span v-if="member.you" class="font-normal text-muted"> (you)</span>
                  </span>
                  <span v-if="!member.invited" class="person-how text-xs text-muted">{{ member.how }}</span>
                </span>
                <UBadge v-if="member.invited" color="info" variant="soft" size="sm">Invited</UBadge>
              </button>
            </PersonPopover>
          </li>
        </ul>
        <button
          v-else
          type="button"
          class="open-slot text-sm"
          :aria-label="`${position.add} to ${place.name}`"
          @click="chart.startAdding(place, position)"
        >
          <UIcon name="i-lucide-plus" class="size-4 flex-none" />
          {{ position.add }}
        </button>
      </section>
    </div>

    <div v-if="place.children.length" class="bracket" aria-hidden="true" />
  </div>
</template>

<style scoped>
.place {
  display: flex;
  flex-direction: column;
  width: 232px;
}

.place.wide {
  width: 728px;
}

.place-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 0 16px;
  text-align: center;
}

.place-art,
.role-art {
  flex: none;
  max-width: none;
}

.place-art {
  width: 44px;
  height: 44px;
  margin-bottom: 6px;
}

.role-art {
  width: 24px;
  height: 24px;
}

.positions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wide .positions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.position {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.role-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 24px;
}

.role-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.people {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.person,
.open-slot {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 56px;
  padding: 10px 12px;
  border-radius: 12px;
  text-align: left;
  cursor: pointer;
}

.person {
  border: 1px solid var(--ui-border);
  background: var(--ui-bg);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.person:hover,
.person[data-state='open'] {
  border-color: var(--ui-border-accented);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.06);
}

.person-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.person-name,
.person-how {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.bracket {
  height: 10px;
  margin-top: 14px;
  border: 1.5px solid var(--ui-border-accented);
  border-top: 0;
  border-radius: 0 0 10px 10px;
}
</style>
