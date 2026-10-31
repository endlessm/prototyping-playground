<script setup lang="ts">
import { opensWelcome } from '../utils/progress'
import WelcomeModal from './WelcomeModal.vue'

// Home's part of the welcome shows nothing itself. Once the dev server
// says who you are, it asks whether this is your first visit, and opens the
// welcome over Home if so. Until then nothing is claimed, so a slow
// identity never uses up your first visit.
const { me, known } = useMe()
const toast = useStudioToast()
const overlay = useOverlay()
const base = useRuntimeConfig().app.baseURL
let asked = false

async function ask() {
  if (asked || !known.value) return
  asked = true
  try {
    if (await opensWelcome(base, me.value.key))
      void overlay.create(WelcomeModal).open()
  } catch (error) {
    toast.error((error as Error).message)
  }
}
onMounted(ask)
watch(known, ask)
</script>

<template>
  <span hidden />
</template>
