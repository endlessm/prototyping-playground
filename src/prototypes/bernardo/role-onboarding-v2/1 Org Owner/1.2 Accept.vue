<!-- @studio-id fcafqjt47913azwe -->
<!-- @studio-state ahwgv2rqfw6k6mxt Signed In -->
<!-- @studio-state ddtvc9e4vpm024kf Expired -->
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
