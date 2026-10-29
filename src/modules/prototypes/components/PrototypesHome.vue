<script setup lang="ts">
import HomeBlock from '../../../../app/components/HomeBlock.vue'

// Home's block of the newest prototypes. Each opens its first artifact.
const LIMIT = 5
const manifest = await useManifest()
const recent = computed(() =>
  [...manifest.value.prototypes]
    .sort((a, b) => (b.created ?? '').localeCompare(a.created ?? ''))
    .slice(0, LIMIT),
)
const { t } = useI18n()
</script>

<template>
  <HomeBlock
    :title="t('prototypes.recent')"
    :hint="t('prototypes.none')"
    :empty="!recent.length"
  >
    <ul>
      <li v-for="prototype in recent" :key="prototype.id">
        <ULink
          :to="`/prototypes/${prototype.id}`"
          class="flex rounded-md px-2 py-1.5 text-sm text-default hover:bg-elevated/50"
        >
          {{ prototype.title }}
        </ULink>
      </li>
    </ul>
  </HomeBlock>
</template>
