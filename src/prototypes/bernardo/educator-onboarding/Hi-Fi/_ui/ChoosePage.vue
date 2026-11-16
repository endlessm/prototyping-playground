<script setup lang="ts">
import logo from '~/assets/images/logo-endless-studios-orange.svg'
import s from './ui.module.css'

// A page that fills the window with no brand panel, for a choice that needs the room: the logo and languages
// on top, then the content.
</script>

<template>
  <div :class="s.page">
    <div :class="s.choose">
      <div :class="s.chooseHeader">
        <img :src="logo" alt="Endless Studios" :class="s.logo" />
        <span :class="s.languages"><b>English</b> · Español</span>
      </div>
      <slot />
    </div>
  </div>
</template>
