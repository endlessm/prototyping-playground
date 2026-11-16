<!-- @studio-id jz3aznbc6awm4376 -->
<!-- @studio-state skx5q87b3dxqq7g7 13 to 17 -->
<!-- @lofi -->
<script setup lang="ts">
import ChoosePage from '../_wire/ChoosePage.vue'
import Lead from '../_wire/Lead.vue'
import Logic from '../_wire/Logic.vue'
import PathCard from '../_wire/PathCard.vue'
import Title from '../_wire/Title.vue'
import s from '../_wire/wire.module.css'

// After Create Account, the same for everyone: one page asks what they came to do, and the choice opens that
// area's own onboarding. This prototype follows Teach; Learn, Play and Contribute are off here.
// Verify Age already knows a 13 to 17 year old's age, and educators must be 18 or older, so they see no Teach card.
defineProps<{ teen?: boolean }>()

const routes = [
  { label: 'Teach → the educator onboarding: a team is made, then the first class', to: 'Lo-Fi/3 Create Team/3.1 After Sign-Up' },
  { label: "Learn, Play or Contribute → that area's own onboarding, outside this prototype" },
  { label: '13 to 17 → no Teach card: educators must be 18 or older' },
]
</script>

<script lang="ts">
export const states = [{ title: '13 to 17', props: { teen: true } }]
</script>

<template>
  <ChoosePage>
    <div :class="s.chooseIntro">
      <Title :flow="2" :note="6">What would you like to do on Endless?</Title>
      <Lead>Choose where to start.</Lead>
    </div>
    <div :class="[s.paths, teen && s.paths3]">
      <PathCard v-if="!teen" title="Teach" to="Lo-Fi/3 Create Team/3.1 After Sign-Up">
        Run a class or club, invite learners and follow their games.
      </PathCard>
      <PathCard title="Learn">Join a program and make your first games, step by step.</PathCard>
      <PathCard title="Play">Play the community's games and share what you think.</PathCard>
      <PathCard title="Contribute">Help build real games with the community: art, design or code.</PathCard>
    </div>
    <Logic title="After the choice" :flow="teen ? 2 : undefined" :note="teen ? 7 : undefined" :rows="routes" />
  </ChoosePage>
</template>
