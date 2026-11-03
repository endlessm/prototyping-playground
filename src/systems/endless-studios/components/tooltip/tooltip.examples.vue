<!--
  The Endless Studios tooltip's examples, written as screens write it: <UTooltip text="…"> around the element it
  describes. Each example keeps room above for the tooltip. Each <Example name="…"> is one example on the
  component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
</script>

<template>
  <Example name="Default">
    <div class="pt-12">
      <UTooltip text="Delete this comment" :content="{ side: 'top' }">
        <UButton color="neutral" variant="ghost" icon="i-lucide-trash-2" aria-label="Delete this comment" />
      </UTooltip>
    </div>
  </Example>

  <Example name="Toolbar">
    <div class="flex gap-1 pt-12">
      <UTooltip text="Bold">
        <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-bold" aria-label="Bold" />
      </UTooltip>
      <UTooltip text="Italic">
        <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-italic" aria-label="Italic" />
      </UTooltip>
      <UTooltip text="Link">
        <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-link" aria-label="Link" />
      </UTooltip>
    </div>
  </Example>

  <Example name="RestrictedFeature">
    <div class="pt-14">
      <UTooltip arrow :delay-duration="0" :content="{ side: 'top' }" text="Partner accounts can't create cohorts. Click for more information.">
        <UButton color="neutral" variant="outline" icon="i-lucide-lock">Create Cohort</UButton>
      </UTooltip>
    </div>
  </Example>
</template>
