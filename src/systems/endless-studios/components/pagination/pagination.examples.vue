<!--
  The Endless Studios pagination's examples, written as screens write it: <UPagination v-model:page="…" :total="…"
  :items-per-page="…">. Each <Example name="…"> is one example on the component's page.
-->
<script setup lang="ts">
import { Example } from '#studio/examples';

const page = ref(1);
const longPage = ref(7);
const small = ref(2);
</script>

<template>
  <Example name="Default">
    <UPagination v-model:page="page" :items-per-page="10" :total="48" />
  </Example>

  <Example name="ManyPages">
    <UPagination v-model:page="longPage" :items-per-page="10" :total="240" show-edges :sibling-count="1" />
  </Example>

  <Example name="UnderATable">
    <div class="flex w-full flex-col gap-5">
      <p class="text-sm text-muted">Showing learners {{ (small - 1) * 25 + 1 }}–{{ Math.min(small * 25, 112) }} of 112</p>
      <div class="flex justify-end">
        <UPagination v-model:page="small" :items-per-page="25" :total="112" size="sm" />
      </div>
    </div>
  </Example>
</template>
