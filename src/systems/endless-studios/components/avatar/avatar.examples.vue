<!--
  The Endless Studios avatar's examples, written as screens write it: <UAvatar>. Each <Example name="…"> is one
  example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import avatar from '~/assets/images/avatar.svg';

const sizes = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;
</script>

<template>
  <Example name="Default">
    <UAvatar :src="avatar" alt="Ana Souza" size="xl" />
    <UAvatar alt="Ana Souza" size="xl" />
    <UAvatar icon="i-lucide-graduation-cap" size="xl" />
  </Example>

  <Example name="Sizes">
    <div class="flex items-end gap-3">
      <UAvatar v-for="size in sizes" :key="size" alt="Ana Souza" :size="size" />
    </div>
  </Example>

  <Example name="BrokenPicture">
    <UAvatar src="/missing-picture.png" alt="João Lima" size="xl" />
  </Example>

  <Example name="WithName">
    <div class="flex items-center gap-3">
      <UAvatar alt="" text="AS" size="3xl" />
      <div class="flex min-w-0 flex-col">
        <span class="font-heading text-lg font-semibold text-highlighted">ana.souza</span>
        <span class="text-sm text-toned">Ana Souza</span>
      </div>
    </div>
  </Example>

</template>
