<script setup lang="ts">
import modules from '#studio/modules'
import { paletteGroups } from '../utils/palette'

const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const route = useRoute()
const palette = useCommandPalette()
const manifest = await useManifest()
const artifacts = await usePrototypeArtifacts(() =>
  String(route.params.prototypeId ?? ''),
)
const groups = computed(() =>
  paletteGroups(
    modules,
    manifest.value,
    artifacts.value,
    {
      path: route.path,
      prototype: route.params.prototypeId as string | undefined,
    },
    import.meta.dev,
    {
      places: t('palette.places'),
      home: t('palette.home'),
      settings: t('rail.settings'),
    },
  ).map((group) => ({
    ...group,
    items: group.items.map(({ to, ...item }) => ({
      ...item,
      onSelect: () => {
        palette.forgetFocus()
        emit('close')
        void navigateTo(to)
      },
    })),
  })),
)
</script>

<template>
  <UModal
    :title="t('home.search')"
    :description="t('palette.description')"
    :content="{ onCloseAutoFocus: palette.restoreFocus }"
    @update:open="(open: boolean) => !open && emit('close')"
  >
    <template #content>
      <UCommandPalette
        :groups="groups"
        :placeholder="t('home.search')"
        :fuse="{
          fuseOptions: {
            keys: ['label', 'keywords', 'suffix'],
            threshold: 0.1,
            ignoreLocation: true,
          },
          resultLimit: 1000,
          matchAllWhenSearchEmpty: true,
        }"
        close
        @update:open="(open: boolean) => !open && emit('close')"
      >
        <template #empty>{{ t('palette.empty') }}</template>
      </UCommandPalette>
    </template>
  </UModal>
</template>
