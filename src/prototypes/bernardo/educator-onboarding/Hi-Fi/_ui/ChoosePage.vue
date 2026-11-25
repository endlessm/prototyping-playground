<script setup lang="ts">
import AuthTopBar from './AuthTopBar.vue'
import s from './ui.module.css'

// A page that fills the window with no brand panel, for a choice that needs the room: the top bar, then the
// content.
</script>

<template>
  <div :class="[s.page, s.authShell]">
    <AuthTopBar />
    <div :class="s.choose">
      <slot />
    </div>
  </div>
</template>
