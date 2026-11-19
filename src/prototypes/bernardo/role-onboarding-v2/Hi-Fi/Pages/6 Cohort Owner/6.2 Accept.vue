<!-- @studio-id 4eyp4gsz0rhfr97d -->
<!-- @studio-state e9bsnt6fj2z194gn Signed In -->
<!-- @studio-state vcqej3byxhjrxf0d Expired -->
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
  <AcceptInvite role="cohortOwner" :mode="mode" />
</template>
