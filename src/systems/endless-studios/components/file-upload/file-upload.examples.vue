<!--
  The Endless Studios file upload's examples, written as screens write it: <UFileUpload v-model="…">. Each
  <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const cover = ref<File | null>(null);
const avatar = ref<File | null>(null);
const screenshots = ref<File[]>([]);
</script>

<template>
  <Example name="Default">
    <UFileUpload
      v-model="cover"
      label="Drop your image or click to upload"
      description="SVG, PNG, JPG (max 2MB)"
      accept=".svg,.png,.jpg,.jpeg"
      class="min-h-48 w-full"
      :ui="{ files: 'hidden' }"
    />
  </Example>

  <Example name="Uploading">
    <UFileUpload
      v-model="cover"
      label="Uploading your image"
      description="Please wait while the image uploads."
      icon="i-lucide-loader-circle"
      accept=".svg,.png,.jpg,.jpeg"
      class="min-h-48 w-full"
      :ui="{ files: 'hidden', icon: 'animate-spin' }"
      disabled
    />
  </Example>

  <Example name="CustomTrigger">
    <UFileUpload v-slot="{ open }" v-model="avatar" accept="image/*" :preview="false">
      <div class="flex items-center gap-4">
        <UAvatar text="AS" size="3xl" />
        <div class="flex flex-col gap-2">
          <UButton color="neutral" variant="outline" icon="i-lucide-upload" @click="open()">Upload Photo</UButton>
          <p class="text-xs text-muted">PNG or JPG, at least 200 × 200 px.</p>
        </div>
      </div>
    </UFileUpload>
  </Example>

  <Example name="Multiple">
    <UFileUpload
      v-model="screenshots"
      multiple
      layout="list"
      label="Add screenshots of your game"
      description="PNG or JPG, up to 5 images"
      accept="image/*"
      class="w-full"
    />
  </Example>
</template>
