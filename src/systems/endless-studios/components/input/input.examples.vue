<!--
  The Endless Studios input's examples, written as screens write it: <UInput v-model="…"> with the app's props.
  Each <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const name = ref('Game Design Foundations');
const email = ref('');
const code = ref('');
const search = ref('');
const variants = ['outline', 'soft', 'subtle', 'ghost'] as const;
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
</script>

<template>
  <Example name="Default">
    <UFormField label="Cohort name" required class="w-full">
      <UInput v-model="name" placeholder="Cohort name" class="w-full" />
    </UFormField>
  </Example>

  <Example name="WithIcon">
    <UFormField label="Email" class="w-full">
      <UInput
        v-model="email"
        type="email"
        placeholder="Email address"
        icon="i-lucide-mail"
        class="w-full"
        :ui="{ leadingIcon: 'text-highlighted' }"
      />
    </UFormField>
  </Example>

  <Example name="Search">
    <UInput v-model="search" icon="i-lucide-search" placeholder="Search learners" class="w-full" />
  </Example>

  <Example name="Variants">
    <div class="grid w-full gap-3">
      <UInput v-for="variant in variants" :key="variant" :variant="variant" :placeholder="variant" class="w-full" />
    </div>
  </Example>

  <Example name="Sizes">
    <div class="grid w-full gap-3">
      <UInput v-for="size in sizes" :key="size" :size="size" :placeholder="size" class="w-full" />
    </div>
  </Example>

  <Example name="States">
    <div class="grid w-full gap-3">
      <UInput v-model="code" placeholder="Code" loading class="w-full" />
      <UInput model-value="ENDLESS-2027" disabled class="w-full" />
      <UFormField error="That code has expired." class="w-full">
        <UInput model-value="SPRING-2025" class="w-full" />
      </UFormField>
    </div>
  </Example>
</template>
