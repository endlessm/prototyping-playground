<script setup lang="ts">
// A font file, loaded on its own under a name no stylesheet uses, so it
// never replaces a family the studio or a system has; unloaded on leaving.
const props = defineProps<{ url: string }>()
const { t } = useI18n()

const family = ref<string>()
const failed = ref(false)

watch(
  () => props.url,
  (url, _before, onCleanup) => {
    family.value = undefined
    failed.value = false
    const name = `studio-asset-${Math.random().toString(36).slice(2, 12)}`
    const font = new FontFace(name, `url(${JSON.stringify(url)})`)
    let active = true
    font
      .load()
      .then((loaded) => {
        if (!active) return
        document.fonts.add(loaded)
        family.value = name
      })
      .catch(() => {
        if (active) failed.value = true
      })
    onCleanup(() => {
      active = false
      document.fonts.delete(font)
    })
  },
  { immediate: true },
)
</script>

<template>
  <p v-if="!family" role="status" class="text-sm text-muted">
    {{
      failed ? t('systems.assets.fontFailed') : t('systems.assets.loadingFont')
    }}
  </p>
  <div v-else class="space-y-4 break-words" :style="{ fontFamily: family }">
    <p class="text-3xl">{{ t('systems.assets.pangram') }}</p>
    <p class="text-lg">
      ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
      abcdefghijklmnopqrstuvwxyz<br />
      0123456789
    </p>
  </div>
</template>
