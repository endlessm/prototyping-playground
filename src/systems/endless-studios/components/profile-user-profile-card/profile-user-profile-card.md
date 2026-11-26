---
title: User profile card
description: The card at the side of a profile page, with the user's avatar, username, games and certificates, interests and when they joined.
source: The app's own components/Profile/UserProfileCard.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452.
app: components/Profile/UserProfileCard.vue
---

## When to use

Show it at the side of a profile page. Its owner (`can-edit`) also sees the Private badge on a private profile, a link to add or edit interests and **Edit profile**; a visitor to a private profile gets the `minimal` card, avatar and username only.

## In Vue screens

Import the copied file and pass it the user:

```vue
<script setup lang="ts">
import UserProfileCard from '~/components/Profile/UserProfileCard.vue'

const user = {
  username: 'ana.learner',
  public: true,
  created_at: '2025-03-14',
  joinedProjectsCount: 4,
  certificatesCount: 2,
  metadata: { image_url: null, interests: [{ id: 1, name: 'Pixel art' }] },
}
</script>

<template>
  <UserProfileCard :user="user" :can-edit="false" />
</template>
```

It emits `openProfileEditModal` and `openProfileInterestsModal` from the owner's buttons.
