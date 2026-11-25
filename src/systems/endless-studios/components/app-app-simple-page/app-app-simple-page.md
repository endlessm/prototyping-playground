---
title: App simple page
description: The layout for a page showing one standalone piece of content, a full-width header, a hero and the content, the last two inside the app's container.
source: The app's own components/App/AppSimplePage.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452.
app: components/App/AppSimplePage.vue
---

## When to use

Use it for a page about one thing, such as a program, a game or a settings page. It builds on App page: the `header` slot stays full width, while `hero` and the content sit in the app's container, unless `full-width` lets the content span the page. Every slot is optional.

## In Vue screens

Import the copied file and fill its slots:

```vue
<script setup lang="ts">
import AppSimplePage from '~/components/App/AppSimplePage.vue'
</script>

<template>
  <AppSimplePage>
    <template #hero>
      <h1>Make your first platformer</h1>
    </template>
    <p>About this program</p>
  </AppSimplePage>
</template>
```
