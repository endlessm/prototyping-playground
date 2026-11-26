---
title: User card
description: A user's avatar and username, both linking to their profile, with their full name underneath when it's known.
source: The app's own components/Generic/UserCard.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452.
app: components/Generic/UserCard.vue
---

## When to use

Show it wherever a person needs to be recognised at a glance: an author on a post, a member in a list, the heading of a profile. Use the `lg` size when the card is the page's heading.

## Disabled accounts

A disabled user shows with a greyscale avatar and a struck-through username, so admin views can tell the account state at a glance.

## In Vue screens

Import the copied file and pass it the user:

```vue
<script setup lang="ts">
import UserCard from '~/components/Generic/UserCard.vue'

const user = { username: 'ana.learner', full_name: 'Ana Souza', metadata: { image_url: null } }
</script>

<template>
  <UserCard :user="user" />
</template>
```

Pass `:to="null"` to show the avatar and username as plain text, as admin tables do. The default slot adds a line under the name, and the `badge` slot sits right after the username.
