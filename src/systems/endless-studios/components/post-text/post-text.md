---
title: Post text
description: The text of a feed post or comment, rendered from its HTML, with @mentions linked to profiles and images as square thumbnails.
source: The app's own components/CommunityFeed/PostText.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452. Built on Generic/RichText.vue.
---

## When to use

Use it wherever the app shows text someone wrote in the feed editor: the body of a Post card, a Comment, or a post quoted elsewhere. It keeps the editor's formatting (bold, lists, links) and turns `@username` into a link to that person's profile.

For text the platform writes itself, such as program and task descriptions, use the screen's own type styles instead.

## In Vue screens

```vue
<script setup lang="ts">
import PostText from '~/components/CommunityFeed/PostText.vue'
</script>

<template>
  <PostText :html="post.description" />
</template>
```

Clicking a mention follows the profile link. Images inside the text show as 208 px squares, cropped, side by side.
