<!-- @studio-id tt6xk2rf30g7v32y -->
<!-- @studio-state r5zehvtg9dv7pn3p Signed In -->
<!-- @studio-state vghr9b11dbc6wxax Expired -->
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
  <AcceptInvite role="orgManager" :mode="mode" />
</template>
