<!--
  The Endless Studios button's examples, written as screens write it: <UButton> with the app's props. Each
  <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
</script>

<template>
  <Example name="Default">
    <UButton>Invite Learners</UButton>
  </Example>

  <Example name="CommonPairs">
    <UButton>Save Changes</UButton>
    <UButton color="neutral" variant="outline">Cancel</UButton>
    <UButton color="neutral" variant="ghost">Skip for Now</UButton>
    <UButton color="secondary" variant="ghost">Share</UButton>
    <UButton color="neutral" variant="link">View All</UButton>
  </Example>

  <Example name="Variants">
    <UButton variant="solid">Solid</UButton>
    <UButton variant="outline">Outline</UButton>
    <UButton variant="soft">Soft</UButton>
    <UButton variant="subtle">Subtle</UButton>
    <UButton variant="ghost">Ghost</UButton>
    <UButton variant="link">Link</UButton>
  </Example>

  <Example name="Colors">
    <UButton color="primary">Primary</UButton>
    <UButton color="secondary">Secondary</UButton>
    <UButton color="kids">Kids</UButton>
    <UButton color="info">Info</UButton>
    <UButton color="success">Success</UButton>
    <UButton color="warning">Warning</UButton>
    <UButton color="error">Error</UButton>
    <UButton color="neutral">Neutral</UButton>
  </Example>

  <Example name="Sizes">
    <UButton size="xs">Extra Small</UButton>
    <UButton size="sm">Small</UButton>
    <UButton size="md">Medium</UButton>
    <UButton size="lg">Large</UButton>
    <UButton size="xl">Extra Large</UButton>
  </Example>

  <Example name="WithIcons">
    <UButton icon="i-lucide-user-plus">Invite Learners</UButton>
    <UButton color="neutral" variant="outline" trailing-icon="i-lucide-arrow-right">Next Step</UButton>
    <UButton color="neutral" variant="outline" icon="i-lucide-ellipsis" square aria-label="More actions" />
    <UButton color="error" variant="ghost" icon="i-lucide-trash-2" square aria-label="Delete" />
  </Example>

  <Example name="States">
    <UButton loading>Publishing</UButton>
    <UButton disabled>Publish</UButton>
    <UButton color="neutral" variant="outline" disabled>Cancel</UButton>
  </Example>

  <Example name="KidsGating">
    <UButton color="kids" variant="gating" trailing-icon="i-lucide-lock">Ask a Parent</UButton>
  </Example>

  <Example name="Contrast">
    <div class="flex gap-2 rounded-2xl bg-bg-inverted p-4 text-text-inverted">
      <UButton variant="contrast" icon="i-lucide-play">Watch Trailer</UButton>
      <UButton variant="contrast" icon="i-lucide-heart" square aria-label="Like" />
    </div>
  </Example>

  <Example name="Block">
    <UButton block icon="i-lucide-log-in">Log In</UButton>
  </Example>
</template>
