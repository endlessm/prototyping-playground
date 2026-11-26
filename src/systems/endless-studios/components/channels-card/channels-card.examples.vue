<!--
  A feed's channels. In a view, import `~/components/CommunityFeed/ChannelsCard.vue` and bind the selected channel
  with v-model.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
import ChannelsCard from './channels-card.vue';

const manyChannels = [
  { id: 1, name: 'general' },
  { id: 2, name: 'art-and-sprites' },
  { id: 3, name: 'level-design' },
  { id: 4, name: 'playtesting' },
  { id: 5, name: 'music-and-sound' },
  { id: 6, name: 'bugs' },
  { id: 7, name: 'showcase' },
];

const managerOptions = [
  { id: 'manage', label: 'Manage Channels' },
  { id: 'create', label: 'Create Channel' },
];
</script>

<template>
  <Example name="Default">
    <ChannelsCard title="Channels" />
  </Example>
  <Example name="ChannelSelected">
    <ChannelsCard title="Channels" :model-value="3" />
  </Example>
  <Example name="MoreThanFour">
    <ChannelsCard title="Channels" :channels="manyChannels" />
  </Example>
  <Example name="WithMenu">
    <ChannelsCard title="Channels" :channels="manyChannels" has-multi-button :options="managerOptions" />
  </Example>
</template>
