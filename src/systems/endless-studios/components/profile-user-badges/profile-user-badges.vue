<!--
  The profile's badge list: the app's own components/Profile/UserBadges.vue, copied unchanged.
  Screens don't use this file: they import `~/components/Profile/UserBadges.vue` and pass it a title and its
  elements. This file gives it sample interests and lets the Lab switch to an empty list.
-->
<script setup lang="ts">
import UserBadges from '~/components/Profile/UserBadges.vue';

withDefaults(
  defineProps<{
    /** The list's heading. */
    title?: string;
    /** The Lab's switch for the empty state: no elements, so the list doesn't show at all. */
    empty?: boolean;
  }>(),
  { title: 'Interests', empty: false },
);

const sampleElements = [
  { id: 1, name: 'Pixel art' },
  { id: 2, name: 'Game design' },
  { id: 3, name: 'Music' },
  { id: 4, name: 'Storytelling' },
  { id: 5, name: '3D modelling' },
];
</script>

<template>
  <UserBadges :title="title" :elements="empty ? [] : sampleElements" />
</template>
