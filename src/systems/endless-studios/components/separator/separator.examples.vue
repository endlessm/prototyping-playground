<!--
  The Endless Studios separator's examples, written as screens write it: <USeparator> with margin classes. Each
  <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
</script>

<template>
  <Example name="Default">
    <div class="w-full">
      <h1 class="font-heading text-2xl font-semibold text-highlighted">Notifications</h1>
      <USeparator class="mt-6" />
    </div>
  </Example>

  <Example name="WithLabel">
    <USeparator label="or" class="w-full" />
  </Example>

  <Example name="ShowMore">
    <USeparator class="my-4 w-full">
      <UButton variant="ghost" color="neutral" label="Show more" />
    </USeparator>
  </Example>

  <Example name="Vertical">
    <div class="flex items-center">
      <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-bold" aria-label="Bold" />
      <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-italic" aria-label="Italic" />
      <USeparator orientation="vertical" class="mx-1 h-6" />
      <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-link" aria-label="Link" />
      <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-external-link" aria-label="Open in new window" />
    </div>
  </Example>

  <Example name="Types">
    <div class="grid w-full gap-4">
      <USeparator type="solid" />
      <USeparator type="dashed" />
      <USeparator type="dotted" />
    </div>
  </Example>
</template>
