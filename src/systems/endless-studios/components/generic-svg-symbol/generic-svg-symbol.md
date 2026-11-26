---
title: SVG symbol
description: Draws an SVG component once as a shared symbol, so every copy on the page points to it instead of repeating its paths.
source: The app's own components/Generic/SvgSymbol.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452.
app: components/Generic/SvgSymbol.vue
---

## When to use

Use it for an SVG that shows many times on one page, such as the Endless Loader. The first copy moves its paths into a hidden `<symbol>` with the key's id, and every copy, the first included, becomes a `<use>` pointing to it.

## In Vue screens

Import the copied file and pass it an SVG component and a key:

```vue
<script setup lang="ts">
import SvgSymbol from '~/components/Generic/SvgSymbol.vue'
import EndlessLoader from '~/assets/images/loader/endless-loader.svg?component'
</script>

<template>
  <SvgSymbol :icon="EndlessLoader" symbol-key="endless_loader" class="block w-full aspect-[466/194]" />
</template>
```

For a loading state, use `~/components/Generic/CircularLoading.vue`, which wraps this with the right size and label.
