<script setup lang="ts">
import s from './wire.module.css'

// Account pages: the Threadbare illustration beside one 400px column.
withDefaults(defineProps<{ header?: boolean; centered?: boolean; caption?: string }>(), {
  header: true,
  centered: false,
})
</script>

<template>
  <div :class="s.page">
    <div :class="s.auth">
      <div :class="s.illustration">
        Threadbare illustration
        <template v-if="caption"><br />{{ caption }}</template>
      </div>
      <div :class="[s.authColumn, centered && s.centered]">
        <div v-if="header" :class="s.authHeader">
          <span>∞ Endless</span>
          <span :class="s.languages"><b>English</b> · Español</span>
        </div>
        <div :class="s.stack"><slot /></div>
      </div>
    </div>
  </div>
</template>
