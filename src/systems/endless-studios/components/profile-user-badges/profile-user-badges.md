---
title: User badges
description: A titled list of small grey tags on a profile, such as the user's interests. It hides itself when the list is empty.
source: The app's own components/Profile/UserBadges.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452.
app: components/Profile/UserBadges.vue
---

## When to use

The profile page uses it for the user's interests. Use it for any short list of names a profile shows as tags.

## Empty and filled

With elements it shows the title and one tag per element; with none it renders nothing, title included. In the Lab, the **Empty** toggle switches between the two.

## In Vue screens

Import the copied file and pass it a title and the elements:

```vue
<script setup lang="ts">
import UserBadges from '~/components/Profile/UserBadges.vue'

const interests = [{ id: 1, name: 'Pixel art' }, { id: 2, name: 'Game design' }]
</script>

<template>
  <UserBadges :title="$t('interests')" :elements="interests" />
</template>
```
