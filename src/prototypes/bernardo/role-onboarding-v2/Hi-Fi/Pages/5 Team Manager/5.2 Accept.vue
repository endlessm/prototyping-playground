<!-- @studio-id pf5h8k5jgw6wgnr2 -->
<!-- @studio-state 1fyw2txw2cbwvm7n Signed In -->
<!-- @studio-state 3f19pveqhbra6tck Expired -->
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
  <AcceptInvite role="teamManager" :mode="mode" />
</template>
