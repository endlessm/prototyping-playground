<!-- @studio-id xsrc6cv5nqxykqsg -->
<script setup lang="ts">
import ChoosePage from '../_ui/ChoosePage.vue'
import Lead from '../_ui/Lead.vue'
import Logic from '../_ui/Logic.vue'
import PathCard from '../_ui/PathCard.vue'
import Title from '../_ui/Title.vue'
import s from '../_ui/ui.module.css'

// Choose a Path for a 13 to 17 year old. Verify Age already knows the age and educators must be 18 or older,
// so there is no Teach card: the page offers Learn, Play and Contribute, each leading outside this prototype.
// It's a side screen to show the under 18 view, so its routing box leads back to where it's reached from.
const routes = [
  { label: "Learn, Play or Contribute → that area's own onboarding, outside this prototype (Soon)", disabled: true },
  { label: '← Back to 1.4 Signed In', to: 'Hi-Fi/1 Join and Log In/1.4 Signed In' },
]
</script>

<template>
  <ChoosePage>
    <div :class="s.chooseIntro">
      <Title>What would you like to do on Endless?</Title>
      <Lead>Choose where to start.</Lead>
    </div>
    <div :class="[s.paths, s.paths3]">
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
    <Logic title="After the choice" :flow="2" :note="6" :rows="routes" />
  </ChoosePage>
</template>
