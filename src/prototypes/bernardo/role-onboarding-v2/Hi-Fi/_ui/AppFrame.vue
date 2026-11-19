<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { computed, ref } from 'vue'
import navLogo from '~/assets/images/logo-endless-navbar.svg'
import { places as placesByRole, roles, type Level, type Place, type RoleKey } from '../../_wire/world'
import CreateTeamModal from './CreateTeamModal.vue'

// The platform's frame for the proposed roles. The app's StudioSidebar can't take a new group, so this redraws it
// with the same classes (224px, Home in orange, Play in purple, Learning in blue) and adds the proposed Teach group in
// orange, with one link per level where the viewer holds a teaching role: a place where they are a learner doesn't
// count. Over the content, the top bar's place switcher names the place on screen and the viewer's role in it, and
// lists every place where they hold one, one role each, marking Independent ones: one account often holds several, at
// different levels and in more than one Organization or Independent Team. Create an Independent Team, at the foot of
// the switcher, is there for every educator: the switcher sits above every place, so a Team made from it belongs to
// no Organization. Org Teams are created from the Organization's Teams tab.
const props = defineProps<{
  viewer: RoleKey
  place: string
  /** Roles gained during the flow, such as the Cohort Owner of a Cohort just created. */
  extra?: Place[]
}>()

const LINK_BASE = 'gap-4 h-9 py-0.5 px-4 rounded-lg text-sm font-semibold'
const NO_MARKER = 'before:bg-transparent hover:before:bg-transparent'
const CHILD_BASE = `py-1.5 px-2.5 rounded-lg text-sm font-normal items-center ${NO_MARKER}`
const COLORS = {
  orange: { hover: 'hover:bg-slate-50 hover:text-orange-500', active: 'bg-orange-50 text-orange-600' },
  purple: { hover: 'hover:bg-slate-50 hover:text-purple-500', active: 'bg-purple-50 text-purple-500' },
  blue: { hover: 'hover:bg-slate-50 hover:text-blue-500', active: 'bg-blue-50 text-blue-500' },
}
const ICON_UI = { linkLeadingIcon: '!text-current size-5', linkLabel: 'flex-1 flex items-center justify-between' }
type Colors = (typeof COLORS)[keyof typeof COLORS]

const person = roles[props.viewer].person
const mine = computed(() => [...placesByRole[props.viewer], ...(props.extra ?? [])])
const creatingIndependent = ref(false)
const current = computed(() => mine.value.find((p) => p.name === props.place) ?? mine.value[0])

const levelOrder: Level[] = ['Organization', 'Team', 'Cohort']
const levelLabel: Record<Level, string> = { Organization: 'Organizations', Team: 'Teams', Cohort: 'Cohorts' }
const levelIcon: Record<Level, string> = {
  Organization: 'i-lucide-building-2',
  Team: 'i-lucide-users',
  Cohort: 'i-lucide-graduation-cap',
}

const label = (text: string, icon: string, colors: Colors): NavigationMenuItem => ({
  type: 'label',
  label: text,
  icon,
  ui: { label: `${LINK_BASE} cursor-default text-slate-700 hover:text-slate-700 hover:bg-transparent`, ...ICON_UI },
})
const child = (text: string, colors: Colors, active = false): NavigationMenuItem => ({
  label: text,
  ui: { item: 'ps-[42px]', link: `${CHILD_BASE} ${active ? colors.active : `text-slate-700 ${colors.hover}`}` },
})

const items = computed<NavigationMenuItem[][]>(() => {
  const held = levelOrder.filter((level) => mine.value.some((p) => !p.learner && p.level === level))
  return [
    [
      { label: 'Home', icon: 'i-lucide-home', ui: { link: `${LINK_BASE} text-slate-700 ${COLORS.orange.hover}`, ...ICON_UI } },
      label('Teach', 'i-lucide-presentation', COLORS.orange),
      ...held.map((level) => child(levelLabel[level], COLORS.orange, level === current.value?.level)),
      label('Play', 'i-lucide-gamepad-2', COLORS.purple),
      child('Explore Games', COLORS.purple),
      child('My Projects', COLORS.purple),
      label('Learning', 'i-lucide-brain', COLORS.blue),
      child('My Programs', COLORS.blue),
      child('Resources', COLORS.blue),
    ],
  ]
})

const placeItems = computed(() => [
  [{ type: 'label' as const, label: 'Your places' }],
  mine.value.map((p) => ({
    label: p.name,
    icon: levelIcon[p.level],
    role: p.independent ? `${p.role} · Independent` : p.role,
    current: p.name === props.place,
  })),
  [
    {
      label: 'Create an Independent Team',
      description: 'Its own place, outside any Organization',
      icon: 'i-lucide-plus',
      onSelect: () => (creatingIndependent.value = true),
    },
  ],
])
</script>

<template>
  <div class="flex min-h-screen bg-slate-50">
    <aside class="sticky top-0 flex h-screen w-56 flex-none flex-col border-e border-default bg-default">
      <div class="mt-4 flex h-16 items-center px-4">
        <img :src="navLogo" alt="Endless Studios" class="ms-3" />
      </div>
      <div class="flex-1 overflow-y-auto px-4">
        <UNavigationMenu
          :items="items"
          orientation="vertical"
          variant="link"
          color="neutral"
          :ui="{ root: 'gap-0', list: 'flex flex-col gap-2', link: 'no-underline', childLink: 'no-underline' }"
        />
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-16 items-center justify-between gap-4 border-b border-default bg-default px-8">
        <UDropdownMenu :items="placeItems" :content="{ align: 'start' }" :ui="{ content: 'min-w-80' }">
          <UButton color="neutral" variant="ghost" class="-ms-2.5 gap-2" trailing-icon="i-lucide-chevron-down">
            <UIcon :name="levelIcon[current?.level ?? 'Organization']" class="size-5 text-dimmed" />
            <span class="font-semibold text-highlighted">{{ place }}</span>
            <UBadge color="secondary" variant="soft" size="sm">{{ current?.role ?? roles[viewer].label }}</UBadge>
          </UButton>
          <template #item-trailing="{ item }">
            <span class="flex items-center gap-2">
              <span class="text-xs text-muted">{{ (item as { role?: string }).role }}</span>
              <UIcon v-if="(item as { current?: boolean }).current" name="i-lucide-check" class="size-4 text-secondary" />
            </span>
          </template>
        </UDropdownMenu>
        <div class="flex items-center gap-3">
          <UButton icon="i-lucide-bell" color="neutral" variant="ghost" aria-label="Notifications" />
          <UAvatar :text="person.initials" size="md" :alt="person.name" class="bg-secondary-50 text-secondary-700" />
        </div>
      </header>

      <main class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-8 pt-8 pb-16"><slot /></main>
    </div>
    <slot name="overlay" />
    <CreateTeamModal v-if="creatingIndependent" :viewer="viewer" independent-only @close="creatingIndependent = false" />
  </div>
</template>
