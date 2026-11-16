<!-- @studio-id fae2247sakqfd68g -->
<!-- @studio-state 36frjnb6ndbbzzh9 Signed In -->
<!-- @studio-state krsd7w7c4ep9n0ce Expired -->
<!-- @lofi -->
<script setup lang="ts">
import AcceptInvite from '../_wire/AcceptInvite.vue'

// Where Accept Invite lands: the invite's card on top, then the one door (signed out), one Accept button (signed in), or who to ask for a new invite (expired).
withDefaults(defineProps<{ mode?: 'signedOut' | 'signedIn' | 'expired' }>(), { mode: 'signedOut' })
</script>

<script lang="ts">
export const states = [
  { title: 'Signed In', props: { mode: 'signedIn' } },
  { title: 'Expired', props: { mode: 'expired' } },
]
</script>

<template>
  <AcceptInvite role="orgEducator" :mode="mode" />
</template>
