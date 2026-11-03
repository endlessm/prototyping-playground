<!--
  The Endless Studios navigation menu's examples, written as screens write it: <UNavigationMenu> with :items.
  Each <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const profileTabs = [
  { label: 'Overview', to: '/profile/ana/', active: true },
  { label: 'Skills', to: '/profile/ana/skills/' },
  { label: 'Certificates', to: '/profile/ana/certificates/' },
  { label: 'Games', to: '/profile/ana/games/' },
];

const dashboardTabs = [
  { label: 'Overview', to: '/leader/dashboard/', active: true },
  { label: 'Cohorts', to: '/leader/dashboard/cohorts/' },
  { label: 'Learners', to: '/leader/dashboard/learners/' },
  { label: 'AI Literacy', to: '/leader/dashboard/ai-literacy/' },
];

const sidebar = [
  { label: 'Dashboard', icon: 'i-lucide-house', to: '/dashboard/', active: true },
  { label: 'Programs', icon: 'i-lucide-graduation-cap', to: '/programs/' },
  { label: 'Games', icon: 'i-lucide-gamepad-2', to: '/games/' },
  { label: 'Notifications', icon: 'i-lucide-bell', to: '/notifications/', badge: 3 },
];
</script>

<template>
  <Example name="Pill">
    <UNavigationMenu color="neutral" variant="pill" :items="profileTabs" :ui="{ link: 'no-underline' }" />
  </Example>

  <Example name="PillWithAction">
    <div class="flex w-full flex-wrap items-center justify-between gap-4">
      <UNavigationMenu color="neutral" variant="pill" :items="profileTabs" :ui="{ link: 'no-underline' }" />
      <UButton color="neutral" variant="outline">Manage User</UButton>
    </div>
  </Example>

  <Example name="LinkWithHighlight">
    <UNavigationMenu color="neutral" variant="link" highlight :items="dashboardTabs" class="w-full border-b border-default" />
  </Example>

  <Example name="Vertical">
    <UNavigationMenu orientation="vertical" variant="link" color="neutral" :items="sidebar" class="w-56" />
  </Example>
</template>
