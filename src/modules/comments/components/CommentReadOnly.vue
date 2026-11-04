<script setup lang="ts">
import { useStudioModule } from '../../../../app/composables/useStudioModules'

// Why the person can't write here, in the service's own words, in place of
// a field or button: they aren't registered (with a link to how to join,
// while the Manual is on), or the prototype is archived.
defineProps<{ reason: string; join: boolean }>()

const { t } = useI18n()
const manual = Boolean(useStudioModule('documentation'))
</script>

<template>
  <p class="flex gap-1.5 rounded-lg bg-elevated px-2 py-1.5 text-xs text-muted">
    <UIcon name="i-lucide-lock" class="mt-px size-3.5 shrink-0" />
    <span>
      {{ reason }}
      <ULink
        v-if="join && manual"
        to="/documentation/manual/environment#how-do-i-join-the-team"
        class="font-medium text-highlighted underline"
        >{{ t('comments.readOnly.join') }}</ULink
      >
    </span>
  </p>
</template>
