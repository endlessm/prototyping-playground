---
title: App page
description: The app's common page layout, a header slot for full-width banners flush to the top and the page's content under it, with the app's bottom spacing.
source: The app's own components/App/AppPage.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452.
app: components/App/AppPage.vue
---

## When to use

Wrap a page that lays out its own content, such as a dashboard or a list. For a page showing one standalone piece of content, constrained to the app's container, use App simple page instead. Both slots are optional.

## In Vue screens

Import the copied file and fill its slots:

```vue
<script setup lang="ts">
import AppPage from '~/components/App/AppPage.vue'
</script>

<template>
  <AppPage>
    <template #header>
      <UAlert title="Spring cohorts start March 3" />
    </template>
    <h1>My Programs</h1>
  </AppPage>
</template>
```
