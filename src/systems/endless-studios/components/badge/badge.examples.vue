<!--
  The Endless Studios badge's examples, written as screens write it: <UBadge> with the app's props. Each
  <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
</script>

<template>
  <Example name="Default">
    <UBadge>Featured</UBadge>
  </Example>

  <Example name="CohortStatus">
    <UBadge color="success" variant="soft">Active</UBadge>
    <UBadge color="info" variant="soft">Upcoming</UBadge>
    <UBadge color="neutral" variant="soft">Draft</UBadge>
    <UBadge color="error" variant="soft">Archived</UBadge>
  </Example>

  <Example name="SecondarySoft">
    <UBadge color="secondary" variant="soft">Game Design</UBadge>
    <UBadge color="secondary" variant="soft" icon="i-lucide-graduation-cap">Pathway</UBadge>
  </Example>

  <Example name="Variants">
    <UBadge variant="solid">Solid</UBadge>
    <UBadge variant="outline">Outline</UBadge>
    <UBadge variant="soft">Soft</UBadge>
    <UBadge variant="subtle">Subtle</UBadge>
  </Example>

  <Example name="Colors">
    <UBadge color="primary" variant="soft">Primary</UBadge>
    <UBadge color="secondary" variant="soft">Secondary</UBadge>
    <UBadge color="kids" variant="soft">Kids</UBadge>
    <UBadge color="info" variant="soft">Info</UBadge>
    <UBadge color="success" variant="soft">Success</UBadge>
    <UBadge color="warning" variant="soft">Warning</UBadge>
    <UBadge color="error" variant="soft">Error</UBadge>
    <UBadge color="neutral" variant="soft">Neutral</UBadge>
  </Example>

  <Example name="Sizes">
    <UBadge size="xs" variant="soft">Extra Small</UBadge>
    <UBadge size="sm" variant="soft">Small</UBadge>
    <UBadge size="md" variant="soft">Medium</UBadge>
    <UBadge size="lg" variant="soft">Large</UBadge>
    <UBadge size="xl" variant="soft">Extra Large</UBadge>
  </Example>

  <Example name="WithIcons">
    <UBadge color="success" icon="i-lucide-git-merge">Merged</UBadge>
    <UBadge color="error" icon="i-lucide-git-pull-request-closed">Closed</UBadge>
    <UBadge color="info" icon="i-lucide-git-pull-request-create">Open</UBadge>
  </Example>

  <Example name="Markers">
    <UBadge color="info" variant="subtle" size="sm">New</UBadge>
    <UBadge color="warning" variant="outline" size="sm">Pending Review</UBadge>
    <UBadge color="neutral" variant="outline" size="sm" square>3</UBadge>
    <UBadge color="neutral" variant="solid" icon="i-lucide-radio">Live Stream</UBadge>
  </Example>
</template>
