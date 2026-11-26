<!--
  The profile card: the app's own components/Profile/UserProfileCard.vue, copied unchanged.
  Screens don't use this file: they import `~/components/Profile/UserProfileCard.vue` and pass it a `user` object.
  This file spreads that object into props of their own, so the component page and the Lab's Playground can fill it.
-->
<script setup lang="ts">
import { computed } from 'vue';
import UserProfileCard from '~/components/Profile/UserProfileCard.vue';

const props = withDefaults(
  defineProps<{
    /** The user's username, shown under the avatar. */
    username?: string;
    /** The avatar's image address. Without one the card shows the app's placeholder picture. */
    imageUrl?: string;
    /** Whether the profile is public. A private profile shows a Private badge to its owner. */
    public?: boolean;
    /** How many games the user has joined. */
    joinedProjectsCount?: number;
    /** How many certificates the user has earned. */
    certificatesCount?: number;
    /** The user's interests, separated by commas. */
    interests?: string;
    /** When the user joined, as a date such as `2025-03-14`. Shown as month and year. */
    createdAt?: string;
    /** Shows the owner's view: the Private badge, the interests link and Edit profile. */
    canEdit?: boolean;
    /** Shows only the avatar and username, as a visitor sees a private profile. */
    minimal?: boolean;
  }>(),
  {
    username: 'ana.learner',
    imageUrl: undefined,
    public: true,
    joinedProjectsCount: 4,
    certificatesCount: 2,
    interests: 'Pixel art, Game design, Music',
    createdAt: '2025-03-14',
    canEdit: false,
    minimal: false,
  },
);

const user = computed(() => ({
  username: props.username,
  public: props.public,
  created_at: props.createdAt || null,
  joinedProjectsCount: props.joinedProjectsCount,
  certificatesCount: props.certificatesCount,
  metadata: {
    image_url: props.imageUrl || null,
    interests: props.interests
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name, index) => ({ id: index + 1, name })),
  },
}));
</script>

<template>
  <UserProfileCard :user="user" :can-edit="canEdit" :minimal="minimal" />
</template>
