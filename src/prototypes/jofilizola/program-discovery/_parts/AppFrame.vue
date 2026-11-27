<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { computed } from 'vue'
import { usePrototypeNavigate } from '#studio/prototype'
import logoMark from './logo-mark.svg'
import { FOLDER, people, type Audience } from './programs'

// The app's StudioSidebar can't take a new group, so this redraws it with the same classes, as Bernardo's Role
// Onboarding v2 frame does: Workshop, then the proposed Teach group for educators only, then Play, Learn, Make and Earn. Signed out, the foot holds Log in and Sign up, as the live app does; signed in, the person's avatar.
const props = withDefaults(defineProps<{ audience: Audience; canvas?: string; page?: 'workshop' | 'programs' }>(), {
  canvas: 'bg-stone-50',
  page: 'programs',
})

// Workshop and Programs open this audience's own screens.
const navigate = usePrototypeNavigate()
const go = (screen: string) => () => navigate(`${FOLDER[props.audience]}/${screen}`)

// The Figma redesign (Programs — Guest, 65:5785) sets titles in Allo instead of Figtree, and the sidebar shows only the
// orange mark. Allo isn't bundled: it's a licensed face, so this names the locally installed family and falls back to
// Figtree wherever Allo isn't installed.
const HEADING_FONT = { '--font-heading': "'Allo', 'Figtree Variable', 'Figtree', sans-serif" }

const LINK_BASE = 'gap-4 h-9 py-0.5 px-4 rounded-lg text-sm font-semibold'
const NO_MARKER = 'before:bg-transparent hover:before:bg-transparent'
const CHILD_BASE = `py-1.5 px-2.5 rounded-lg text-sm font-heading font-normal items-center ${NO_MARKER}`
// Black, stone and orange only: every group hovers and highlights the same way (no purple Play or blue Learn).
const NEUTRAL = { hover: 'hover:bg-stone-100 hover:text-black', active: 'bg-stone-100 text-black font-medium' }
const COLORS = { orange: NEUTRAL, purple: NEUTRAL, blue: NEUTRAL }
type Colors = (typeof COLORS)[keyof typeof COLORS]
const ICON_UI = { linkLeadingIcon: '!text-current size-5', linkLabel: 'flex-1 flex items-center justify-between' }

const label = (text: string, icon: string): NavigationMenuItem => ({
  type: 'label',
  label: text,
  icon,
  ui: { label: `${LINK_BASE} font-heading cursor-default text-stone-700 hover:text-stone-700 hover:bg-transparent`, ...ICON_UI },
})
const child = (text: string, colors: Colors, active = false, onSelect?: () => void): NavigationMenuItem => ({
  label: text,
  onSelect,
  ui: { item: 'ps-[42px]', link: `${CHILD_BASE} ${active ? colors.active : `text-stone-700 ${colors.hover}`}` },
})

const items = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: 'Workshop',
      icon: 'i-lucide-home',
      onSelect: go('Workshop'),
      ui: { link: `${LINK_BASE} ${props.page === 'workshop' ? NEUTRAL.active : `text-stone-700 ${NEUTRAL.hover}`}`, ...ICON_UI },
    },
    ...(props.audience === 'educator'
      ? [label('Teach', 'i-lucide-presentation'), child('Teams', COLORS.orange), child('Cohorts', COLORS.orange)]
      : []),
    label('Play', 'i-lucide-gamepad-2'),
    child('Explore Games', COLORS.purple),
    child('My Projects', COLORS.purple),
    label('Learn', 'i-lucide-brain'),
    child('Programs', COLORS.blue, props.page === 'programs', go('Catalogue')),
    child('Resources', COLORS.blue),
    { label: 'Make', icon: 'i-lucide-hammer', ui: { link: `${LINK_BASE} font-heading text-stone-700 ${COLORS.orange.hover}`, ...ICON_UI } },
    // Earn leaves the platform for the contributions site, as in the live app, so it carries the external-link mark.
    {
      label: 'Earn',
      icon: 'i-lucide-coins',
      to: 'https://contributions.endlessstudios.com/',
      target: '_blank',
      ui: { link: `${LINK_BASE} font-heading text-stone-700 ${COLORS.orange.hover}`, ...ICON_UI, linkLabelExternalIcon: 'text-current size-4 shrink-0' },
    },
  ],
])

const person = computed(() => (props.audience === 'guest' ? null : people[props.audience]))
</script>

<template>
  <div class="flex min-h-screen" :class="canvas" :style="HEADING_FONT">
    <aside class="sticky top-0 hidden h-screen w-56 flex-none flex-col border-e border-default bg-default md:flex">
      <div class="flex h-[69px] items-start ps-[26px] pt-[39px]">
        <img :src="logoMark" alt="Endless Studios" class="h-3.5 w-auto" />
      </div>
      <div class="flex-1 overflow-y-auto px-4">
        <UNavigationMenu
          :items="items"
          orientation="vertical"
          variant="link"
          color="neutral"
          external-icon="i-lucide-external-link"
          :ui="{ root: 'gap-0', list: 'flex flex-col gap-2', link: 'no-underline', childLink: 'no-underline' }"
        />
      </div>
      <div class="border-t border-default p-4">
        <div v-if="!person" class="flex gap-2">
          <UButton color="neutral" variant="outline" size="sm" label="Log in" class="rounded-full flex-1 justify-center" />
          <UButton size="sm" label="Sign up" class="rounded-full flex-1 justify-center" />
        </div>
        <div v-else class="flex items-center gap-3">
          <UAvatar :text="person.initials" size="md" :alt="person.name" class="bg-stone-200 text-stone-800" />
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-highlighted">{{ person.name }}</p>
            <p class="truncate text-xs text-muted">{{ person.detail }}</p>
          </div>
        </div>
      </div>
    </aside>

    <main class="mx-auto flex w-full max-w-6xl min-w-0 flex-1 flex-col gap-8 px-4 pt-8 pb-16 md:px-8"><slot /></main>
    <slot name="overlay" />
  </div>
</template>
