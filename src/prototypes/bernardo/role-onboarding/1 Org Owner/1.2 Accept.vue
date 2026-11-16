<!-- @studio-id 84gsknttzhe5h2gq -->
<!-- @studio-state hvsgh0m7sgz6zttv Signed In -->
<!-- @studio-state 211kx9f1sa6d3khr Expired -->
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
  <AcceptInvite role="orgOwner" :mode="mode" />
</template>
