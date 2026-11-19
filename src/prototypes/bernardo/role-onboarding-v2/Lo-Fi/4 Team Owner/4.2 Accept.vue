<!-- @studio-id s9q8n2etbfm5x8wc -->
<!-- @studio-state 3ag9337a4hx2tf6k Signed In -->
<!-- @studio-state vm1k46fb9rn84vap Expired -->
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
  <AcceptInvite role="teamOwner" :mode="mode" />
</template>
