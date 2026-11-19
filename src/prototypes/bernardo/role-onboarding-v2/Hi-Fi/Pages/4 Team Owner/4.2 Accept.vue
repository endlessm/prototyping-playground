<!-- @studio-id c256h3a2y1v6zc0b -->
<!-- @studio-state g1awem6k7e2mx55y Signed In -->
<!-- @studio-state vevh6dnc9g03z1nb Expired -->
<script setup lang="ts">
import AcceptInvite from '../../_ui/AcceptInvite.vue'

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
  <AcceptInvite role="teamOwner" :mode="mode" />
</template>
