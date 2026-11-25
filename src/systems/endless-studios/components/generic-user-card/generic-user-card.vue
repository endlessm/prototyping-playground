<!--
  The user card: the app's own components/Generic/UserCard.vue, copied unchanged.
  Screens don't use this file: they import `~/components/Generic/UserCard.vue` and pass it a `user` object. This file
  spreads that object into props of their own, so the component page and the Lab's Playground can fill it.
-->
<script setup lang="ts">
import { computed } from 'vue';
import UserCard from '~/components/Generic/UserCard.vue';

const props = withDefaults(
  defineProps<{
    /** The user's username, shown beside the avatar and used for the profile link. */
    username?: string;
    /** The user's full name, shown under the username. Leave it empty to hide the line. */
    fullName?: string;
    /** The avatar's image address. Without one the avatar shows its placeholder. */
    imageUrl?: string;
    /** Shows a disabled account: a greyscale avatar and a struck-through username. */
    disabled?: boolean;
    /** Where the avatar and username link to. Defaults to the user's profile page. */
    to?: string;
    /** The card's text size. Use `lg` when the card serves as a page heading. */
    size?: 'sm' | 'lg';
  }>(),
  { username: 'ana.learner', fullName: 'Ana Souza', imageUrl: undefined, disabled: false, to: undefined, size: 'sm' },
);

const user = computed(() => ({
  username: props.username,
  full_name: props.fullName || null,
  disabled: props.disabled,
  metadata: { image_url: props.imageUrl || null },
}));
</script>

<template>
  <UserCard :user="user" :to="to" :size="size" />
</template>
