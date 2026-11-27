<script setup lang="ts">
import Tb from './Tb.vue'

// Where "Teach" leads someone who isn't an educator yet. Signed out, it asks them to create an educator account;
// signed in as an adult learner, it adds the educator path to the account they have. Learners under 18 never see it,
// as in the educator onboarding prototypes' Choose a Path (Under 18).
const open = defineModel<boolean>('open', { default: false })
defineProps<{ signedIn: boolean; program?: string }>()

const benefits = [
  { icon: 'i-lucide-users', text: 'Start a group for your learners and invite them with a code or link' },
  { icon: 'i-lucide-graduation-cap', text: 'Free educator training before your first session' },
  { icon: 'i-lucide-chart-line', text: 'See each learner’s progress and review their work' },
]
</script>

<template>
  <UModal
    v-model:open="open"
    :description="signedIn ? 'Add educator tools to your account to run programs with your learners.' : 'Create an educator account to run programs with your learners.'"
  >
    <template #title><Tb :text="program ? `Teach ${program}` : 'Teach with Endless Studios'" /></template>
    <template #body>
      <ul class="flex flex-col gap-3">
        <li v-for="b in benefits" :key="b.text" class="flex items-start gap-3 text-sm text-default">
          <UIcon :name="b.icon" class="mt-0.5 size-5 flex-none text-primary" />{{ b.text }}
        </li>
      </ul>
    </template>
    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <UButton class="rounded-full" v-if="!signedIn" color="neutral" variant="outline" label="I have an account. Log in" @click="open = false" />
        <UButton class="rounded-full" v-else color="neutral" variant="outline" label="Not now" @click="open = false" />
        <UButton class="rounded-full" :label="signedIn ? 'Become an educator' : 'Create an educator account'" trailing-icon="i-lucide-arrow-right" @click="open = false" />
      </div>
    </template>
  </UModal>
</template>
