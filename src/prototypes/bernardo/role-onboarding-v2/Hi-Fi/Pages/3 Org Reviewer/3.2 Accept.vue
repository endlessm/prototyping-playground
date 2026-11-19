<!-- @studio-id essg07tertcp3ymh -->
<!-- @studio-state yyqbrhkrfzh840jd Signed In -->
<!-- @studio-state 37e9w7s7tc112ct3 Expired -->
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
  <AcceptInvite role="orgReviewer" :mode="mode" />
</template>
