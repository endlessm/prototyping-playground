<script setup lang="ts">
import s from './wire.module.css'

// A page with no illustration column, for a choice that needs the room: the logo and languages on top, then
// the content.
</script>

<template>
  <div :class="s.page">
    <div :class="s.choose">
      <div :class="s.chooseHeader">
        <span>∞ Endless</span>
        <span :class="s.languages"><b>English</b> · Español</span>
      </div>
      <slot />
    </div>
  </div>
</template>
