<!-- @studio-id s5ertbngpg0q1n9w -->
<!-- @studio-state 5kg8vnzzz9ryvbdd Signed In -->
<!-- @studio-state gfzq3x5kmfs46atv Expired -->
<!-- @lofi -->
<script setup lang="ts">
import AcceptInvite from '../../_wire/AcceptInvite.vue'

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
  <AcceptInvite role="facilitator" :mode="mode" />
</template>
