<!--
  UserAvatar as screens write it: the person's picture when they have one, the app's default picture when not.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import avatar from '~/assets/images/avatar.svg';
import UserAvatar from './user-avatar.vue';

const sizes = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;
</script>

<template>
  <Example name="Default">
    <UserAvatar alt="Maya Flores" size="xl" />
  </Example>

  <Example name="WithPicture">
    <UserAvatar :src="avatar" alt="Priya Raman" size="xl" />
  </Example>

  <Example name="Sizes">
    <div class="flex items-end gap-3">
      <UserAvatar v-for="size in sizes" :key="size" alt="Maya Flores" :size="size" />
    </div>
  </Example>

  <Example name="BrokenPicture">
    <UserAvatar src="/missing-picture.png" alt="Zoe Chen" size="xl" />
  </Example>
</template>
