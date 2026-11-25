<script setup lang="ts">
import logo from '~/assets/images/logo-endless-studios-orange.svg'
import s from './ui.module.css'

// The live account pages pin the logo and the language switch to the window's top corners, outside the content.
</script>

<template>
  <div :class="s.authTopBar">
    <img :src="logo" alt="Endless Studios" :class="s.logo" />
    <nav :class="s.languages" aria-label="Language">
      <span :class="s.languageActive" aria-current="true">English</span>
      <span>Español</span>
    </nav>
  </div>
</template>
