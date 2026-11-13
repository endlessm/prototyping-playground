<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import { computed } from 'vue'
import { useEscape } from '../_wire/useEscape'
import { roleIllustrations } from './illustrations'
import {
  arrival,
  arrivalHeading,
  canDo,
  canSee,
  chainTo,
  flowStart,
  heldRoles,
  isFlowPerson,
  LEARNER_NOTE,
  roleColor,
} from './panel'
import { usePathPlayer } from './path'
import { useMapState } from './state'
import { mapRoles, nodeTitle, type MapNode } from './story'

// The selected person: who they are, who brought them in, what they can do and see, the chain of awards that led to
// them, and their onboarding flow. Shown only while a tile is selected; closing it clears the selection.
const props = defineProps<{ id: string }>()

const { story, select, mode } = useMapState()

const node = computed(() => story.value.nodes[props.id])
const isLearner = computed(() => node.value.role === 'learner')
const title = computed(() => nodeTitle(node.value))
const name = computed(() => (node.value.person ? firstName(node.value) : 'learners'))
const possessive = computed(() => (isLearner.value ? 'learners' : `${name.value}’s`))
/** The link names the flow after its person, or after the role when the flow follows someone else. */
const flowName = computed(() =>
  isFlowPerson(main.value.role, node.value) ? possessive.value : `the ${mapRoles[main.value.role].label}`,
)
const held = computed(() => heldRoles(story.value, props.id))
const main = computed(() => held.value[0])
const came = computed(() => arrival(story.value, props.id))
const created = computed(() => held.value.filter((role) => role.created))
const can = computed(() => canDo(main.value.role))
const sees = computed(() => canSee(main.value.role, main.value.place, story.value))
const chain = computed(() => chainTo(story.value, props.id))
const flow = computed(() => flowStart(main.value.role))
const kind = computed(() => mapRoles[node.value.role].kind)
const pathName = computed(() => (isLearner.value ? 'the learners’ path' : `${name.value}’s path`))
const { on: onPath, toggle: togglePath } = usePathPlayer(() => props.id)

function firstName(member: MapNode): string {
  return member.person ? (member.person.name.split(' ')[0] ?? member.person.name) : nodeTitle(member)
}

const close = () => select(null)
useEscape(close)
</script>

<template>
  <aside class="panel" :aria-label="`${title}, selected`">
    <div class="flex items-center justify-between">
      <span class="label">Selected</span>
      <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" aria-label="Close" @click="close" />
    </div>

    <div class="flex items-center gap-3.5">
      <div class="art" :class="kind.toLowerCase()">
        <img :src="roleIllustrations[node.role]" alt="" />
      </div>
      <div class="min-w-0">
        <h2 class="font-heading text-xl font-bold tracking-tight text-highlighted">{{ title }}</h2>
        <p v-if="node.person" class="truncate text-xs text-dimmed">{{ node.person.email }}</p>
        <div
          v-for="role in held"
          :key="`${role.role}-${role.place.id}`"
          class="mt-1.5 flex flex-wrap gap-1.5"
        >
          <UBadge :color="roleColor(role.role)" variant="soft">{{ mapRoles[role.role].label }}</UBadge>
          <UBadge color="neutral" variant="soft">{{ role.place.name }}</UBadge>
        </div>
      </div>
    </div>

    <section>
      <h3 class="label mb-2">{{ arrivalHeading(came) }}</h3>
      <div v-if="came?.by" class="card">
        <img :src="roleIllustrations[came.byRole ?? came.by.role]" alt="" class="size-8 shrink-0" />
        <div class="min-w-0">
          <p class="text-[13px] font-semibold leading-4 text-highlighted">{{ nodeTitle(came.by) }}</p>
          <p class="text-[11.5px] leading-4 text-dimmed">{{ mapRoles[came.byRole ?? came.by.role].label }}</p>
        </div>
        <span v-if="story.timed" class="step">Step {{ came.step }}</span>
      </div>
      <p v-else class="text-[12.5px] leading-[17px] text-muted">
        Nobody. Endless Admins are Endless Access staff, there from the start.
      </p>
      <div v-for="role in created" :key="role.place.id" class="card mt-2">
        <img :src="roleIllustrations[role.role]" alt="" class="size-8 shrink-0" />
        <div class="min-w-0">
          <p class="text-[13px] font-semibold leading-4 text-highlighted">Created {{ role.place.name }}</p>
          <p class="text-[11.5px] leading-4 text-dimmed">and became its {{ mapRoles[role.role].label }}</p>
        </div>
        <span v-if="story.timed" class="step">Step {{ role.step }}</span>
      </div>
    </section>

    <section>
      <h3 class="label mb-2">What {{ name }} can do</h3>
      <ul class="flex flex-col gap-1.5">
        <li v-for="line in can" :key="line" class="flex items-start gap-2 text-[13px] leading-[18px] text-default">
          <UIcon name="i-lucide-check" class="mt-px size-4 shrink-0 text-success" />
          {{ line }}
        </li>
      </ul>
    </section>

    <section>
      <h3 class="label mb-2">What {{ name }} can see</h3>
      <p class="rounded-xl bg-elevated px-3 py-2.5 text-[12.5px] leading-[17px] text-muted">
        <b class="font-semibold text-default">{{ sees.lead }}</b>
        {{ sees.rest }}
      </p>
    </section>

    <section>
      <h3 class="label mb-2">How {{ name }} got here</h3>
      <ol class="chain">
        <li v-for="link in chain" :key="link.node.id">
          <button
            type="button"
            class="link"
            :class="{ me: link.node.id === id }"
            :aria-current="link.node.id === id ? 'true' : undefined"
            @click="select(link.node.id)"
          >
            <img :src="roleIllustrations[link.role]" alt="" />
            <b>{{ firstName(link.node) }}</b>
            <span>{{ mapRoles[link.role].label }}</span>
          </button>
        </li>
      </ol>
    </section>

    <p v-if="isLearner" class="text-[12.5px] leading-[17px] text-dimmed">{{ LEARNER_NOTE }}</p>

    <div class="mt-auto flex flex-col gap-2">
      <UButton
        v-if="mode === 'story'"
        :icon="onPath ? 'i-lucide-square' : 'i-lucide-play'"
        color="primary"
        variant="soft"
        block
        class="play"
        @click="togglePath"
      >
        {{ onPath ? 'Stop' : 'Play' }} {{ pathName }}
      </UButton>
      <PrototypeLink v-if="flow" :to="flow" class="flow">
        Open {{ flowName }} onboarding flow
        <UIcon name="i-lucide-arrow-up-right" class="size-4" />
      </PrototypeLink>
    </div>
  </aside>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 340px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 16px 22px 20px;
  border-left: 1px solid var(--ui-border);
  background: var(--ui-bg);
}

.label {
  color: var(--ui-text-dimmed);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

.art {
  display: grid;
  place-items: center;
  flex: none;
  width: 84px;
  height: 84px;
  border: 1px solid var(--ui-border);
  border-radius: 24px;
  background: var(--ui-bg-elevated);
}

.art img {
  width: 64px;
  height: 64px;
}

.art.organization {
  background: color-mix(in oklab, var(--color-cornflower-50) 60%, white);
  border-color: color-mix(in oklab, var(--color-cornflower-500) 18%, transparent);
}

.art.team {
  background: var(--color-orange-50);
  border-color: color-mix(in oklab, var(--color-orange-500) 18%, transparent);
}

.art.cohort {
  background: var(--color-sky-50);
  border-color: var(--color-sky-100);
}

.card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--ui-border);
  border-radius: 12px;
}

.step {
  margin-left: auto;
  flex: none;
  padding: 1px 8px;
  border-radius: 100px;
  background: var(--ui-bg-elevated);
  color: var(--ui-text-muted);
  font-size: 10.5px;
  font-weight: 700;
}

.chain {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.chain::before {
  content: '';
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 13px;
  width: 2px;
  background: var(--ui-border-muted);
}

.link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: calc(100% + 4px);
  margin-left: -4px;
  padding: 2px 4px;
  border-radius: 100px;
  font-size: 12.5px;
  line-height: 16px;
  text-align: left;
}

.link:hover {
  background: var(--ui-bg-elevated);
}

.link:focus-visible {
  outline: 2px solid var(--ui-info);
}

.link img {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--ui-bg);
}

.link b {
  color: var(--ui-text-highlighted);
  font-weight: 600;
}

.link span {
  color: var(--ui-text-dimmed);
}

.link.me {
  background: var(--color-sky-50);
}

.link.me b {
  color: var(--color-sky-700);
}

.play {
  padding: 9px 14px;
  border: 1px solid var(--color-orange-200);
  background: var(--color-orange-50);
  color: var(--color-orange-900);
  font-size: 13px;
  font-weight: 600;
}

.play:hover {
  background: var(--color-orange-100);
}

.flow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 14px;
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius);
  color: var(--ui-text-highlighted);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.flow:hover {
  background: var(--ui-bg-elevated);
}

.flow:focus-visible {
  outline: 2px solid var(--ui-info);
  outline-offset: 2px;
}
</style>
