<script setup lang="ts">
import HomeBlock from '../../../../app/components/HomeBlock.vue'
import { useSystemCatalog } from '../composables/useSystemCatalog'
import { homeSystems, systemAddress } from '../utils/pages'

// Home's block of systems: up to three active ones, the default first, and
// a link to the whole collection.
const { t } = useI18n()
const manifest = await useManifest()
const { systems } = await useSystemCatalog()
const shown = computed(() =>
  homeSystems(systems.value, manifest.value.defaultSystem),
)
</script>

<template>
  <HomeBlock
    :title="t('systems.home.title')"
    to="/systems"
    :hint="t('systems.home.none')"
    :empty="!shown.length"
  >
    <ul>
      <li v-for="system in shown" :key="system.id">
        <ULink
          :to="systemAddress(system.id)"
          class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-default hover:bg-elevated/50"
        >
          <UIcon name="i-lucide-shapes" class="size-4 shrink-0 text-muted" />
          {{ system.label }}
        </ULink>
      </li>
    </ul>
  </HomeBlock>
</template>
