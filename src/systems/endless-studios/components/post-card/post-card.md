---
title: Post card
description: One post in a community feed — author, post type, time, text, image, tags, Like and Comment, and the first comment or the whole thread.
source: The app's own components/CommunityFeed/PostCard.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452.
---

## When to use

Use it for every post in a feed: the Main Feed on the home page, a program's or cohort's feed, a game's feed, and a single post's page. Each post is one card, stacked down the feed.

Don't use it to show a post's text alone (use Post text) or a single comment (use Comment).

## In Vue screens

```vue
<script setup lang="ts">
import PostCard from '~/components/CommunityFeed/PostCard.vue'
</script>

<template>
  <PostCard :id="`post-${post.id}`" :post="post" />
</template>
```

`post` is the feed query's `ObjectFeed`, in the shape the write-sample-data skill's data shapes records. The viewer comes from the screen's `system.user`.

## What changes with the post and the viewer

- **Post type** (`object_feed_type_id`) labels the header: Announcement, Progress Update, Question, Tip, Random or Feedback.
- **Source**: with `showSourceLink`, the author's line links where the post was made: Main Feed, a program, a cohort or a game.
- **Comments**: closed, the card shows the first comment and "See all N comments"; Comment or the count opens the thread with a comment box ("What are your thoughts?") that suggests @mentions.
- **Liked**: Like turns orange when the signed-in person has liked the post.
- **Menu**: everyone gets Copy Link and, signed in, Report. The author, admins and the program's admins also get Edit and Delete, and Pin or Unpin with `enablePinning`.
- **Permissions**: `not_member` hides the comment box; `restricted_partner` keeps Like and Comment visible and opens the restricted partner explanation instead.
