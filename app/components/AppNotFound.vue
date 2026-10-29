<script setup lang="ts">
// Unknown addresses, prototypes and artifacts.
const { t } = useI18n()
const deployed = !import.meta.dev
</script>

<template>
  <div class="space-y-2">
    <p class="text-sm font-medium text-highlighted">
      {{ t('notFound.title') }}
    </p>
    <p class="text-sm text-muted">
      {{ t('notFound.message') }}
      <ULink to="/prototypes" class="text-primary hover:underline">
        {{ t('notFound.home') }}
      </ULink>
    </p>
    <!-- Archived work isn't on the deployed site, and nothing there says
         which address it had. -->
    <p v-if="deployed" class="text-sm text-muted">
      {{ t('notFound.archived') }}
    </p>
  </div>
</template>
