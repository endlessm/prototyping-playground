<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import { computed } from 'vue'
import { useEscape } from '../_wire/useEscape'
import { roleIllustrations } from './illustrations'
import { EYEBROW, levelTint, NOW_TINT, roleColor } from './look'
import { arrivalHeading, canDo, canSee, flowStart, isFlowPerson, LEARNER_NOTE } from './panel'
import { usePathPlayer } from './path'
import { useMapState } from './state'
import { arrival, chainTo, heldRoles, mapRoles, nodeTitle, shortName } from './story'

// The selected person: who they are, who brought them in, what they can do and see, the chain of awards that led to
// them, and their onboarding flow. Shown only while a tile is selected; closing it clears the selection.
const props = defineProps<{ id: string }>()

const { story, select, mode } = useMapState()

const node = computed(() => story.value.nodes[props.id])
const isLearner = computed(() => node.value.role === 'learner')
const title = computed(() => nodeTitle(node.value))
const name = computed(() => (node.value.person ? shortName(node.value) : 'learners'))
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
const tint = computed(() => levelTint[mapRoles[node.value.role].kind])
const pathName = computed(() => (isLearner.value ? 'the learners’ path' : `${name.value}’s path`))
const { on: onPath, toggle: togglePath } = usePathPlayer(() => props.id)

const close = () => select(null)
useEscape(close)
</script>

<template>
  <aside
    class="flex w-[340px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-default bg-default px-5.5 pt-4 pb-5"
    :aria-label="`${title}, selected`"
  >
    <div class="flex items-center justify-between">
      <span :class="EYEBROW">Selected</span>
      <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" aria-label="Close" @click="close" />
    </div>

    <div class="flex items-center gap-3.5">
      <div class="grid size-21 flex-none place-items-center rounded-3xl border" :class="tint.art">
        <img :src="roleIllustrations[node.role]" alt="" class="size-16" />
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
      <h3 class="mb-2" :class="EYEBROW">{{ arrivalHeading(came) }}</h3>
      <div v-if="came?.by" class="flex items-center gap-2.5 rounded-xl border border-default px-2.5 py-2">
        <img :src="roleIllustrations[came.byRole ?? came.by.role]" alt="" class="size-8 shrink-0" />
        <div class="min-w-0">
          <p class="text-sm leading-4 font-semibold text-highlighted">{{ nodeTitle(came.by) }}</p>
          <p class="text-xs leading-4 text-dimmed">{{ mapRoles[came.byRole ?? came.by.role].label }}</p>
        </div>
        <UBadge v-if="story.timed" color="neutral" variant="soft" size="sm" class="ml-auto flex-none rounded-full">
          Step {{ came.step }}
        </UBadge>
      </div>
      <p v-else class="text-xs leading-4 text-muted">Nobody. Endless Admins are Endless Access staff, there from the start.</p>
      <div
        v-for="role in created"
        :key="role.place.id"
        class="mt-2 flex items-center gap-2.5 rounded-xl border border-default px-2.5 py-2"
      >
        <img :src="roleIllustrations[role.role]" alt="" class="size-8 shrink-0" />
        <div class="min-w-0">
          <p class="text-sm leading-4 font-semibold text-highlighted">Created {{ role.place.name }}</p>
          <p class="text-xs leading-4 text-dimmed">and became its {{ mapRoles[role.role].label }}</p>
        </div>
        <UBadge v-if="story.timed" color="neutral" variant="soft" size="sm" class="ml-auto flex-none rounded-full">
          Step {{ role.step }}
        </UBadge>
      </div>
    </section>

    <section>
      <h3 class="mb-2" :class="EYEBROW">What {{ name }} can do</h3>
      <ul class="flex flex-col gap-1.5">
        <li v-for="line in can" :key="line" class="flex items-start gap-2 text-sm leading-[18px] text-default">
          <UIcon name="i-lucide-check" class="mt-px size-4 shrink-0 text-success" />
          {{ line }}
        </li>
      </ul>
    </section>

    <section>
      <h3 class="mb-2" :class="EYEBROW">What {{ name }} can see</h3>
      <p class="rounded-xl bg-elevated px-3 py-2.5 text-xs leading-4 text-muted">
        <b class="font-semibold text-default">{{ sees.lead }}</b>
        {{ sees.rest }}
      </p>
    </section>

    <section>
      <h3 class="mb-2" :class="EYEBROW">How {{ name }} got here</h3>
      <ol
        class="relative flex flex-col gap-[3px] before:absolute before:inset-y-3.5 before:left-[13px] before:w-0.5 before:bg-(--ui-border-muted)"
      >
        <li v-for="link in chain" :key="link.node.id">
          <button
            type="button"
            class="relative -ml-1 flex w-[calc(100%+4px)] items-center gap-2.5 rounded-full px-1 py-0.5 text-left text-xs leading-4 focus-visible:outline-2 focus-visible:outline-info"
            :class="link.node.id === id ? 'bg-info-50' : 'hover:bg-elevated'"
            :aria-current="link.node.id === id ? 'true' : undefined"
            @click="select(link.node.id)"
          >
            <img :src="roleIllustrations[link.role]" alt="" class="relative size-7 rounded-full bg-default" />
            <b class="font-semibold" :class="link.node.id === id ? 'text-info-700' : 'text-highlighted'">
              {{ shortName(link.node) }}
            </b>
            <span class="text-dimmed">{{ mapRoles[link.role].label }}</span>
          </button>
        </li>
      </ol>
    </section>

    <p v-if="isLearner" class="text-xs leading-4 text-dimmed">{{ LEARNER_NOTE }}</p>

    <div class="mt-auto flex flex-col gap-2">
      <UButton
        v-if="mode === 'story'"
        :icon="onPath ? 'i-lucide-square' : 'i-lucide-play'"
        color="primary"
        variant="soft"
        block
        class="px-3.5 py-2 font-semibold hover:bg-primary-100"
        :class="NOW_TINT"
        @click="togglePath"
      >
        {{ onPath ? 'Stop' : 'Play' }} {{ pathName }}
      </UButton>
      <PrototypeLink
        v-if="flow"
        :to="flow"
        class="inline-flex items-center justify-center gap-1.5 rounded-md border border-default px-3.5 py-2 text-sm font-semibold text-highlighted no-underline hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info"
      >
        Open {{ flowName }} onboarding flow
        <UIcon name="i-lucide-arrow-up-right" class="size-4" />
      </PrototypeLink>
    </div>
  </aside>
</template>
