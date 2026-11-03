<!--
  The Endless Studios chip's examples, written as screens write it: <UChip> around the element it marks. Each
  <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import blackEndlessLogo from '~/assets/images/black-endless-logo.png';

const unread = ref(3);
</script>

<template>
  <Example name="Default">
    <UButton color="neutral" variant="ghost" :aria-label="unread ? `Notifications, ${unread} unread` : 'Notifications'" @click="unread = 0">
      <UChip :show="!!unread" color="primary" position="top-left">
        <UIcon name="i-lucide-bell" class="size-5" />
      </UChip>
    </UButton>
  </Example>

  <Example name="Standalone">
    <p class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      Your mentor left feedback on Level 3
      <UChip standalone />
    </p>
  </Example>

  <Example name="OnAnAvatar">
    <UChip size="lg" position="top-right" :ui="{ base: 'bg-transparent ring-0' }">
      <UAvatar :src="blackEndlessLogo" alt="" size="xl" />
      <template #content>
        <UIcon name="i-lucide-trophy" class="size-5 text-warning" />
      </template>
    </UChip>
  </Example>

  <Example name="WithText">
    <UChip :text="12" size="3xl" color="error">
      <UAvatar alt="Ana Souza" />
    </UChip>
  </Example>
</template>
