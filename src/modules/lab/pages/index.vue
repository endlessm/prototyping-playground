<script setup lang="ts">
// `/lab` opens the default system's first component, in place of itself in
// the history. Without any component to open, it says so and points to
// Systems.
definePageMeta({
  middleware: async () => {
    const { labLandingAddress } = await import('../utils/redirects')
    const landing = await labLandingAddress()
    if (landing) return navigateTo(landing, { replace: true })
  },
})

const { t } = useI18n()
const studio = useStudioConfig()
useHead({ title: () => `${t('lab.title')} — ${studio.name}` })
</script>

<template>
  <UDashboardPanel id="lab">
    <template #body>
      <div class="mx-auto w-full max-w-3xl px-4 py-6">
        <UEmpty
          icon="i-lucide-flask-conical"
          :title="t('lab.empty.title')"
          :description="t('lab.empty.description')"
          variant="outline"
          class="border-dashed py-16"
        >
          <template #actions>
            <ULink to="/systems" class="text-sm hover:underline">
              {{ t('lab.empty.systems') }}
            </ULink>
          </template>
        </UEmpty>
      </div>
    </template>
  </UDashboardPanel>
</template>
