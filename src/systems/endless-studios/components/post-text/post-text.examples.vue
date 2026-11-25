<!--
  The text of feed posts and comments, as the feed stores it: HTML from the post editor.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';
// Inlined: the dev server's image address holds `@fs`, which PostText would turn into a mention.
import gameShot from '~/assets/images/games/game-built.png?inline';
import PostText from './post-text.vue';

const formatted = [
  '<p><strong>Devlog #4: the storm</strong></p>',
  '<p>This week I worked on the storm that hits halfway up the lighthouse:</p>',
  '<ul><li>Rain that slows down near the lantern</li><li>Wind that pushes you left on every third jump</li>',
  '<li>A new thunder sound from the Resources library</li></ul>',
  '<p>Try the <a href="https://endlessstudios.com/games/lantern-keeper">latest build</a> and tell me if the wind is too strong.</p>',
].join('');

const withImages = [
  '<p>Sprite sheet progress for the keeper and the first two enemies.</p>',
  `<p><img src="${gameShot}" alt="Keeper sprites"><img src="${gameShot}" alt="Enemy sprites"></p>`,
].join('');
</script>

<template>
  <Example name="Default">
    <PostText
      html="<p>Finished the first boss fight for Lantern Keeper! Thanks @priya for the tip about telegraphing attacks.</p>"
    />
  </Example>
  <Example name="Formatted">
    <PostText :html="formatted" />
  </Example>
  <Example name="WithImages">
    <PostText :html="withImages" />
  </Example>
</template>
