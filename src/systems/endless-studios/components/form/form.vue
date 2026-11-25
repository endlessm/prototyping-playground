<!--
  The Endless Studios form: Nuxt UI's UForm as the frontend uses it. Screens write <UForm> directly around
  UFormField fields, with these props and @submit; this file gives the component page its props table.
-->
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** The values the fields edit, a reactive object; each field's `name` is a key in it. Screens always pass it. */
    state?: Record<string, unknown>;
    /** A Standard Schema (Zod, Valibot, Yup…) the state must pass. The app's forms use Zod. */
    schema?: object;
    /** A function of the state that returns `{ name, message }` errors, for checks a schema can't express. */
    validate?: (state: Record<string, unknown>) => { name: string; message: string }[];
    /** When fields check themselves: on `input`, `change` or `blur`. */
    validateOn?: ('input' | 'change' | 'blur')[];
    /** Disables every field and button inside. */
    disabled?: boolean;
    /** Puts a submit button into its loading state while `@submit` runs. */
    loadingAuto?: boolean;
  }>(),
  { loadingAuto: true },
);

// The Lab sets no state, so the frame fills the form with a sample enrollment.
const sample = reactive({ code: 'GAME-2027' });
</script>

<template>
  <UForm v-bind="props" :state="state ?? sample" class="flex w-full flex-col gap-3">
    <slot>
      <UFormField label="Enrollment code" name="code">
        <UInput v-model="sample.code" placeholder="Code" class="w-full" />
      </UFormField>
      <UButton type="submit" class="self-start">Join Program</UButton>
    </slot>
  </UForm>
</template>
