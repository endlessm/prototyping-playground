---
title: Channels card
description: A card listing a feed's channels, each after a #, with the selected one highlighted and "more" when there are over four.
source: The app's own components/CommunityFeed/ChannelsCard.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452. Built on shared/DefaultCard.vue.
---

## When to use

Use it beside a feed that is split into channels, so people can switch between topics. Bind the selected channel's `id` with `v-model`; the feed beside it shows that channel's posts.

Don't use it to move between pages: that's the sidebar or tabs.

## In Vue screens

```vue
<script setup lang="ts">
import ChannelsCard from '~/components/CommunityFeed/ChannelsCard.vue'

const channelId = ref<number | null>(null)
</script>

<template>
  <ChannelsCard v-model="channelId" :title="$t('channels')" :channels="channels" />
</template>
```

## Behaviour

- With no `modelValue`, or one that matches no channel, the first channel is selected.
- Four channels show at first; "more" shows the rest and then goes away.
- For people who manage the feed, `hasMultiButton` adds a "…" menu to the header with `options` (such as Manage Channels and Create Channel); choosing one emits `optionSelected` with `{ option: id }`.
