<!--
  The Endless Studios container's examples, written as screens write it: <UContainer> around a band of the page.
  Each <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
</script>

<template>
  <Example name="Default">
    <div class="w-full bg-elevated py-6">
      <UContainer>
        <div class="rounded-2xl border border-dashed border-accented bg-default p-6 text-sm text-muted">
          Page content sits inside the container's padding.
        </div>
      </UContainer>
    </div>
  </Example>

  <Example name="PageBands">
    <div class="w-full bg-elevated pb-6">
      <UContainer class="pt-4 md:pt-12">
        <h1 class="font-heading text-2xl font-semibold text-highlighted">Game Design Foundations</h1>
        <p class="mt-2 text-sm text-muted">Spring 2027 · 24 learners</p>
      </UContainer>
      <UContainer class="mt-4 md:mt-12">
        <UCard title="This week">
          <p class="text-sm">Build a jump that feels good: tune gravity, jump height and coyote time.</p>
        </UCard>
      </UContainer>
    </div>
  </Example>
</template>
