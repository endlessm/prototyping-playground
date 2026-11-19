<!-- @studio-id gzgpw471cwxpkxgb -->
<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import { roleList, type Level } from '../_wire/world'
import Marker from './_ui/Marker.vue'
import { hifi } from './_ui/paths'

// The Hi-Fi of the Lo-Fi Overview: the seven roles by level, each with who receives it here, who awards it, and a
// link to the first page of its Hi-Fi flow.
const levels: Level[] = ['Organization', 'Team', 'Cohort']
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-8 p-8">
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <h1 class="text-3xl font-semibold text-highlighted">Role Onboarding v2</h1>
        <UBadge color="neutral" variant="outline">Proposed</UBadge>
        <Marker :flow="0" :n="1" />
      </div>
      <div class="flex items-center gap-2">
        <p class="text-base text-muted">Invite → Accept → Welcome → First task, for each educator role.</p>
        <Marker :flow="0" :n="2" />
      </div>
      <PrototypeLink to="Roles Map" class="w-fit text-sm font-medium text-secondary no-underline hover:underline">
        See how every role connects on the Roles Map
      </PrototypeLink>
    </div>

    <div class="grid grid-cols-3 items-start gap-4">
      <section v-for="level in levels" :key="level" class="flex flex-col gap-3">
        <h2 class="text-lg font-semibold text-highlighted">{{ level }}</h2>
        <PrototypeLink
          v-for="r in roleList.filter((role) => role.level === level)"
          :key="r.key"
          :to="hifi(r.key, 1)"
          class="group rounded-2xl no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          <UCard
            variant="bordered"
            class="transition-colors group-hover:bg-elevated/50 motion-reduce:transition-none"
            :ui="{ body: 'flex flex-col gap-3 sm:p-5' }"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="text-base font-semibold text-highlighted">{{ r.flow }}. {{ r.label }}</span>
              <UIcon name="i-lucide-arrow-right" class="size-4 text-dimmed group-hover:text-highlighted" />
            </div>
            <div class="flex items-center gap-2">
              <UAvatar :text="r.person.initials" :alt="r.person.name" size="xs" class="bg-secondary-50 text-secondary-700" />
              <span class="text-sm text-default">{{ r.person.name }}</span>
            </div>
            <div class="flex flex-col gap-0.5 text-sm text-muted">
              <span>Awarded by {{ r.awardedBy }}</span>
              <span>Here: {{ r.by.name }} ({{ r.byRole }})</span>
            </div>
          </UCard>
        </PrototypeLink>
      </section>
    </div>
  </div>
</template>
