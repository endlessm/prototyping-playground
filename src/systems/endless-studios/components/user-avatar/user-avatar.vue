<!--
  The app's own UserAvatar (components/Generic/UserAvatar.vue), copied unchanged: a UAvatar that shows the app's
  default profile picture when someone has none. Screens import `~/components/Generic/UserAvatar.vue`; this file
  gives the component page its examples and props table.
-->
<script setup lang="ts">
import UserAvatar from '~/components/Generic/UserAvatar.vue';

withDefaults(
  defineProps<{
    /** The person's profile picture. Leave it out, or pass `null`, for the app's default picture. */
    src?: string | null;
    /** The person's name, read by screen readers and shown if the picture fails to load. */
    alt?: string;
    /** UAvatar's size, from `3xs` (16 px) to `3xl` (48 px). */
    size?: '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  }>(),
  { src: null, alt: '', size: 'sm' },
);
</script>

<template>
  <UserAvatar :src="src" :alt="alt" :size="size" />
</template>
