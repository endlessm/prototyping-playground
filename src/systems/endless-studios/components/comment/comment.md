---
title: Comment
description: One comment under a feed post — the person's picture and username, how long ago, and what they wrote.
source: The app's own components/CommunityFeed/Comment.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452.
---

## When to use

Post card uses it for each comment in a post's thread, and for the first comment while the thread is closed. Use it on its own only when a screen shows comments apart from their post card.

## In Vue screens

```vue
<script setup lang="ts">
import Comment from '~/components/CommunityFeed/Comment.vue'
</script>

<template>
  <Comment v-for="c in post.comments" :key="c.id" :comment="c" @remove="askToRemove(c)" />
</template>
```

The text goes through Post text, so @mentions link to profiles. The picture and username link to the commenter's profile.

## Deleting

Admins see a delete button ("Delete this comment") when they hover a comment; it emits `remove`, and the screen asks to confirm. The copied code's author check compares the comment's user object with an ID, so authors who aren't admins never get the button.
