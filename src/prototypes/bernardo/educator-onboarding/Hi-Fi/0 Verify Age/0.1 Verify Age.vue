<!-- @studio-id dv3bmm3hpf5vfves -->
<!-- @studio-state merj3ees8d7ecy9m Under 13 -->
<!-- @studio-state mfp1s7mmd96t882n Not a date -->
<script setup lang="ts">
import AuthPage from '../_ui/AuthPage.vue'
import Button from '../_ui/Button.vue'
import Field from '../_ui/Field.vue'
import Input from '../_ui/Input.vue'
import Lead from '../_ui/Lead.vue'
import Logic from '../_ui/Logic.vue'
import Marker from '../_ui/Marker.vue'
import Spot from '../_ui/Spot.vue'
import Title from '../_ui/Title.vue'

// The age gate in front of Join: one date of birth decides the path, before anyone types an email.
defineProps<{ date?: string; error?: string; note?: number }>()
</script>

<script lang="ts">
export const states = [
  { title: 'Under 13', props: { date: '03/14/2016', error: 'You need to be 13 or older to join Endless.', note: 2 } },
  { title: 'Not a date', props: { date: '02/30/1988', error: "February 30 isn't a date. Check the day.", note: 3 } },
]
</script>

<template>
  <AuthPage>
    <Spot icon="i-lucide-cake" />
    <Title :flow="0" :note="1">Before we begin…</Title>
    <Lead>
      We need to verify your age. We verify your age to ensure you receive appropriate content and maintain a safe
      environment for all users.
    </Lead>
    <Field label="What is your date of birth?" :error="error">
      <template v-if="note" #note><Marker :flow="0" :n="note" /></template>
      <Input :value="date" placeholder="mm/dd/yyyy" :active="!!error" />
    </Field>
    <Button v-if="error" block>Continue</Button>
    <Button v-else block to="Hi-Fi/1 Join and Log In/1.1 Join">Continue</Button>
    <Logic
      title="Age checked on Continue"
      :rows="[
        { label: '18 or older → Join', to: 'Hi-Fi/1 Join and Log In/1.1 Join' },
        { label: '13 to 17 → kID Safety page, then Join as a learner (never as an educator)', to: 'Hi-Fi/0 Verify Age/0.2 kID Safety' },
        { label: 'Under 13 → inline error under the date, no account' },
      ]"
    />
  </AuthPage>
</template>
