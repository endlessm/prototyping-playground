<script setup lang="ts">
import AppNotFound from '../components/AppNotFound.vue'

// Studio settings, only while the studio runs locally: the deployed site
// answers "Page not found" here. The settings themselves come with the
// Settings page's own work.
const studio = useStudioConfig()
const { t } = useI18n()
const local = import.meta.dev
useHead({
  title: local ? `${t('settings.title')} — ${studio.name}` : studio.name,
})
</script>

<template>
  <UDashboardPanel id="settings">
    <template v-if="local" #header>
      <UDashboardNavbar :title="t('settings.title')" :toggle="false" />
    </template>
    <template #body>
      <AppNotFound v-if="!local" />
    </template>
  </UDashboardPanel>
</template>
