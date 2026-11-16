<!-- @studio-id rtzk10ta6htmerj4 -->
<!-- @studio-state 04hbhb350v94wpzq Signed In -->
<!-- @studio-state 2a9at8f6enzmvhww Expired -->
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
  <AcceptInvite role="cohortOwner" :mode="mode" />
</template>
