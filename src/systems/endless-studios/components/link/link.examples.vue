<!--
  The Endless Studios link's examples, written as screens write it: <ULink :to="…">. Each <Example name="…"> is one
  example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
</script>

<template>
  <Example name="Default">
    <p class="text-sm text-default">
      Read the <ULink to="/programs/12/guide/" class="text-primary underline">program guide</ULink> before your first session.
    </p>
  </Example>

  <Example name="ActiveAndInactive">
    <nav class="flex gap-4 text-sm">
      <ULink to="/profile/ana/" active active-class="font-semibold text-highlighted" inactive-class="text-muted">Overview</ULink>
      <ULink to="/profile/ana/games/" active-class="font-semibold text-highlighted" inactive-class="text-muted">Games</ULink>
      <ULink to="/profile/ana/certificates/" active-class="font-semibold text-highlighted" inactive-class="text-muted">
        Certificates
      </ULink>
    </nav>
  </Example>

  <Example name="UserCard">
    <div class="flex items-center gap-3">
      <ULink to="/profile/ana.souza/" raw class="no-underline" tabindex="-1" aria-hidden="true">
        <UAvatar alt="Ana Souza" size="3xl" />
      </ULink>
      <div class="flex min-w-0 flex-col">
        <ULink to="/profile/ana.souza/" raw class="font-heading text-lg font-semibold text-highlighted no-underline hover:underline">
          ana.souza
        </ULink>
        <span class="text-sm text-toned">Ana Souza</span>
      </div>
    </div>
  </Example>

  <Example name="External">
    <ULink to="https://endlessstudios.com" target="_blank" class="inline-flex items-center gap-1 text-sm text-primary underline">
      Endless Studios
      <UIcon name="i-lucide-external-link" class="size-4" />
    </ULink>
  </Example>
</template>
