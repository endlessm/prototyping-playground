<script setup lang="ts">
import AppLogo from './AppLogo.vue'
import AppRailButton from './AppRailButton.vue'

// The main navigation: a narrow icon rail on every page. Top: the logo
// (Home), search, then each enabled module's section. Bottom: the section
// navigation toggle (only where the page has one), the modules placed
// there and Studio settings (locally).
const studio = useStudioConfig()
const modules = useStudioModules()
const route = useRoute()
const { t } = useI18n()
const palette = useCommandPalette()
const sectionNav = useSectionNav()
const local = import.meta.dev

function railItems(position: 'top' | 'bottom') {
  return modules
    .flatMap(({ id, label, rail }) =>
      rail?.position === position ? [{ id, label, rail }] : [],
    )
    .sort((a, b) => a.rail.order - b.rail.order)
    .map(({ id, label, rail }) => ({
      id,
      label,
      icon: rail.icon ?? 'i-lucide-square',
      to: rail.to,
    }))
}
const top = railItems('top')
const bottom = railItems('bottom')

// You are in a section anywhere under its address.
const inSection = (to: string) =>
  route.path === to || route.path.startsWith(`${to.replace(/\/$/, '')}/`)
</script>

<template>
  <UDashboardSidebar
    id="rail"
    role="navigation"
    :aria-label="t('rail.label')"
    :toggle="false"
    :ui="{
      root: 'flex min-h-0 w-12 min-w-12 bg-elevated/50',
      header: 'h-auto flex-col justify-center gap-1 px-0 pt-3',
      body: 'items-center gap-1 px-0 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
      footer: 'flex-col items-center gap-1 px-0 pb-3',
    }"
  >
    <template #header>
      <AppRailButton
        to="/"
        :label="studio.name"
        class="active:scale-95"
        :current="false"
      >
        <AppLogo class="size-4" />
      </AppRailButton>
      <AppRailButton
        :label="t('rail.search', { shortcut: shortcutLabel('palette') })"
        icon="i-lucide-search"
        @click="palette.show()"
      />
    </template>
    <!-- With many modules this group scrolls, so none is out of reach. -->
    <AppRailButton
      v-for="item in top"
      :key="item.id"
      :to="item.to"
      :label="item.label"
      :icon="item.icon"
      :current="inSection(item.to)"
    />
    <template #footer>
      <AppRailButton
        v-if="sectionNav.present.value"
        :label="
          t(
            sectionNav.open.value
              ? 'rail.hideNavigation'
              : 'rail.showNavigation',
            { shortcut: shortcutLabel('navigation') },
          )
        "
        :icon="
          sectionNav.open.value
            ? 'i-lucide-panel-left-close'
            : 'i-lucide-panel-left-open'
        "
        @click="sectionNav.toggle()"
      />
      <AppRailButton
        v-for="item in bottom"
        :key="item.id"
        :to="item.to"
        :label="item.label"
        :icon="item.icon"
        :current="inSection(item.to)"
      />
      <AppRailButton
        v-if="local"
        to="/settings"
        :label="t('rail.settings')"
        icon="i-lucide-settings"
        :current="route.path === '/settings'"
      />
    </template>
  </UDashboardSidebar>
</template>
