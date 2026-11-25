<script setup lang="ts">
import brushKids from '~/assets/images/backgrounds/27CEA6.png'
import AuthTopBar from './AuthTopBar.vue'
import s from './ui.module.css'
import banner from './threadbare-banner.jpg'

// Account pages: the brand panel beside the form panel, whose top corners hold the logo and languages. The brand
// panel is the live sign-up's Threadbare banner (account.endlessstudios.com/static/img/threadbare_banner_1.png),
// image only. `kids` keeps the teal panel, the colour reserved for youth-gated surfaces.
withDefaults(defineProps<{ header?: boolean; centered?: boolean; kids?: boolean }>(), {
  header: true,
  centered: false,
  kids: false,
})
</script>

<template>
  <div :class="s.page">
    <div :class="s.auth">
      <div v-if="!kids" :class="[s.illustration, s.banner]">
        <img :src="banner" alt="" />
      </div>
      <div
        v-else
        :class="s.illustration"
        :style="{
          backgroundImage: `url(${brushKids})`,
          backgroundColor: 'var(--es-teal-50)',
          backgroundPosition: 'top center',
          backgroundSize: '160% auto',
          color: 'var(--es-teal-700)',
        }"
      >
        <UIcon name="i-lucide-shield-check" class="size-12" />
        <p :class="s.illustrationTitle">A safe place to make games</p>
        <p :class="s.illustrationCaption">
          Youth protection keeps some features off until a parent or trusted adult says yes.
        </p>
      </div>
      <div :class="s.authPanel">
        <AuthTopBar v-if="header" />
        <div :class="[s.authColumn, centered && s.centered]">
          <div :class="s.stack"><slot /></div>
        </div>
      </div>
    </div>
  </div>
</template>
