<!--
  A game's list of feed channels: the app's own ChannelsCard (components/CommunityFeed/ChannelsCard.vue), copied
  unchanged. Screens import `~/components/CommunityFeed/ChannelsCard.vue` directly; this file gives the component page
  its examples and props table, and keeps the selected channel so clicking one moves the highlight.
-->
<script setup lang="ts">
import { ref, watch } from 'vue';
import ChannelsCard from '~/components/CommunityFeed/ChannelsCard.vue';

const props = withDefaults(
  defineProps<{
    /** The card's heading, such as "Channels". */
    title?: string;
    /** The channels, each `{ id, name }`. The first four show, with "more" for the rest. */
    channels?: { id: number; name: string }[];
    /** The selected channel's `id`. Leave it out to select the first. */
    modelValue?: number | null;
    /** Shows the "…" menu in the header, with `options` as its items. */
    hasMultiButton?: boolean;
    /** The header menu's items: a label, or `{ id, label }`. Choosing one emits `optionSelected`. */
    options?: (string | { id: string | number; label: string })[];
    /** Adds an empty footer below the list. */
    hasFooter?: boolean;
  }>(),
  {
    title: 'Channels',
    channels: () => [
      { id: 1, name: 'general' },
      { id: 2, name: 'art-and-sprites' },
      { id: 3, name: 'level-design' },
      { id: 4, name: 'playtesting' },
    ],
    modelValue: null,
    hasMultiButton: false,
    options: () => [],
    hasFooter: false,
  },
);

const selected = ref(props.modelValue);
watch(
  () => props.modelValue,
  (value) => (selected.value = value),
);
</script>

<template>
  <ChannelsCard
    v-model="selected"
    :title="title"
    :channels="channels"
    :has-multi-button="hasMultiButton"
    :options="options"
    :has-footer="hasFooter"
  />
</template>
