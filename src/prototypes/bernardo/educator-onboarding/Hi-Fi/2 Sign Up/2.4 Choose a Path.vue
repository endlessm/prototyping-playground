<!-- @studio-id 8q0aq7h57af5g6kf -->
<script setup lang="ts">
import ChoosePage from '../_ui/ChoosePage.vue'
import Lead from '../_ui/Lead.vue'
import Logic from '../_ui/Logic.vue'
import PathCard from '../_ui/PathCard.vue'
import Title from '../_ui/Title.vue'
import s from '../_ui/ui.module.css'

// After Create Account, the same for everyone: one page asks what they came to do, and the choice opens that
// area's own onboarding. This prototype follows Teach; Learn, Play and Contribute are off here.
// A 13 to 17 year old sees 2.5 instead, with no Teach card: educators must be 18 or older.

const routes = [
  { label: 'Teach → the educator onboarding: a team is made, then the first class', to: 'Hi-Fi/3 Create Team/3.1 After Sign-Up' },
  { label: "Learn, Play or Contribute → that area's own onboarding, outside this prototype (Soon)", disabled: true },
]
</script>

<template>
  <ChoosePage>
    <div :class="s.chooseIntro">
      <Title :flow="2" :note="5">What would you like to do on Endless?</Title>
      <Lead>Choose where to start.</Lead>
    </div>
    <div :class="s.paths">
      <PathCard title="Teach" icon="i-lucide-presentation" to="Hi-Fi/3 Create Team/3.1 After Sign-Up">
        Run a class or club, invite learners and follow their games.
      </PathCard>
      <PathCard title="Learn" icon="i-lucide-graduation-cap">
        Join a program and make your first games, step by step.
      </PathCard>
      <PathCard title="Play" icon="i-lucide-gamepad-2">
        Play the community's games and share what you think.
      </PathCard>
      <PathCard title="Contribute" icon="i-lucide-hand-helping">
        Help build real games with the community: art, design or code.
      </PathCard>
    </div>
    <Logic title="After the choice" :rows="routes" />
  </ChoosePage>
</template>
