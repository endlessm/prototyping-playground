<script setup lang="ts">
import { systemAddress } from '../../systems/utils/pages'
import type { SystemCatalog } from '../../systems/composables/useSystemCatalog'

// `/lab/<system id>` opens the system's first component, in place of itself
// in the history. A system without components says so.
definePageMeta({
  middleware: async (to) => {
    const { systemLandingAddress } = await import('../utils/redirects')
    const first = await systemLandingAddress(String(to.params.systemId))
    if (first) return navigateTo(first, { replace: true })
  },
})

const props = defineProps<{ system: SystemCatalog }>()
const { t } = useI18n()
const studio = useStudioConfig()
useHead({
  title: () => [props.system.label, t('lab.title'), studio.name].join(' — '),
})
</script>

<template>
  <div class="mx-auto w-full max-w-3xl space-y-2 px-4 py-6">
    <p class="text-sm font-medium text-highlighted">
      {{ t('lab.systemEmpty', { name: system.label }) }}
    </p>
    <ULink
      :to="systemAddress(system.id)"
      class="text-sm text-primary hover:underline"
    >
      {{ t('lab.openSystem', { name: system.label }) }}
    </ULink>
  </div>
</template>
