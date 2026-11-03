<!--
  The Endless Studios form's examples, written as screens write it: <UForm :state="…" @submit="…"> with UFormField
  fields inside. The app checks its forms with Zod schemas; these use `validate` so they need no schema library.
  Each <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const enrollment = reactive({ code: '' });
const profile = reactive({ name: 'Ana Souza', email: 'ana@' });
const joined = ref('');

function checkCode(state: typeof enrollment) {
  if (!state.code) return [{ name: 'code', message: 'Enter the code your mentor gave you.' }];
  if (!/^[A-Z0-9-]{6,}$/.test(state.code)) return [{ name: 'code', message: 'Codes use capital letters, numbers and dashes.' }];
  return [];
}

function checkProfile(state: typeof profile) {
  const errors = [];
  if (!state.name.trim()) errors.push({ name: 'name', message: 'Add the name people will see.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.email)) errors.push({ name: 'email', message: 'Enter an email like ana@example.org.' });
  return errors;
}

async function join() {
  await new Promise((resolve) => setTimeout(resolve, 800));
  joined.value = enrollment.code;
}
</script>

<template>
  <Example name="Default">
    <UForm :state="enrollment" :validate="checkCode" class="flex w-full flex-col gap-3" @submit="join">
      <UFormField label="Enrollment code" name="code">
        <UInput v-model="enrollment.code" placeholder="Code" class="w-full" />
      </UFormField>
      <UButton type="submit" class="self-start">Join Program</UButton>
      <p v-if="joined" class="text-sm text-muted">Joined with {{ joined }}.</p>
    </UForm>
  </Example>

  <Example name="ValidatesAsYouType">
    <UForm :state="profile" :validate="checkProfile" :validate-on="['input']" class="flex w-full flex-col gap-4">
      <UFormField label="Profile name" name="name" required>
        <UInput v-model="profile.name" class="w-full" />
      </UFormField>
      <UFormField label="Email" name="email" required>
        <UInput v-model="profile.email" type="email" class="w-full" />
      </UFormField>
      <UButton type="submit" class="self-start">Save Changes</UButton>
    </UForm>
  </Example>

  <Example name="InACard">
    <UCard title="Join a program" class="w-full">
      <UForm id="join-form" :state="enrollment" :validate="checkCode" @submit="join">
        <UFormField label="Enrollment code" name="code">
          <UInput v-model="enrollment.code" placeholder="Code" class="w-full" />
        </UFormField>
      </UForm>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline">Cancel</UButton>
          <UButton type="submit" form="join-form">Join</UButton>
        </div>
      </template>
    </UCard>
  </Example>
</template>
