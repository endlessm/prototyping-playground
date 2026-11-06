<script setup lang="ts">
import brush from '~/assets/images/backgrounds/F76E40.png'
import brushKids from '~/assets/images/backgrounds/27CEA6.png'
import logo from '~/assets/images/logo-endless-studios-orange.svg'
import s from './ui.module.css'

// Account pages: the brand panel beside one 400px column. `kids` turns the panel teal, the colour reserved for
// youth-gated surfaces.
withDefaults(defineProps<{ header?: boolean; centered?: boolean; kids?: boolean }>(), {
  header: true,
  centered: false,
  kids: false,
})
</script>

<template>
  <div :class="s.page">
    <div :class="s.auth">
      <div
        :class="s.illustration"
        :style="{
          backgroundImage: `url(${kids ? brushKids : brush})`,
          backgroundColor: kids ? 'var(--es-teal-50)' : 'var(--es-orange-50)',
          backgroundPosition: 'top center',
          backgroundSize: '160% auto',
          color: kids ? 'var(--es-teal-700)' : 'var(--es-orange-900)',
        }"
      >
        <UIcon :name="kids ? 'i-lucide-shield-check' : 'i-lucide-gamepad-2'" class="size-12" />
        <p :class="s.illustrationTitle">{{ kids ? 'A safe place to make games' : 'Make games. Learn together.' }}</p>
        <p :class="s.illustrationCaption">
          {{
            kids
              ? 'Youth protection keeps some features off until a parent or trusted adult says yes.'
              : 'Classes, clubs and co-ops build their first games on Endless.'
          }}
        </p>
      </div>
      <div :class="[s.authColumn, centered && s.centered]">
        <div v-if="header" :class="s.authHeader">
          <img :src="logo" alt="Endless Studios" :class="s.logo" />
          <span :class="s.languages"><b>English</b> · Español</span>
        </div>
        <div :class="s.stack"><slot /></div>
      </div>
    </div>
  </div>
</template>
