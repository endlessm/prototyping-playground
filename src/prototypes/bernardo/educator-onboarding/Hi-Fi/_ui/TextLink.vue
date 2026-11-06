<script setup lang="ts">
import { PrototypeLink } from '#studio/prototype'
import s from './ui.module.css'

defineProps<{ to?: string }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <PrototypeLink v-if="to" :to="to" :class="s.link"><slot /></PrototypeLink>
  <button v-else type="button" :class="s.link" @click="$emit('click')"><slot /></button>
</template>
