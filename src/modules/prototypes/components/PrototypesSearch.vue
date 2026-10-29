<script setup lang="ts">
// The gallery's search box. The text lives in the address (`?q=`); typing
// replaces the history entry instead of adding one per key. It is narrow
// until used, then widens: while focused, and while it holds a search.
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const fromRoute = () => (typeof route.query.q === 'string' ? route.query.q : '')
const text = ref(fromRoute())
watch(fromRoute, (value) => {
  if (value !== text.value) text.value = value
})
function clear() {
  text.value = ''
}
watch(text, (value) => {
  if (value === fromRoute()) return
  void router.replace({
    query: { ...route.query, q: value || undefined },
  })
})
</script>

<template>
  <form
    role="search"
    class="shrink-0 transition-[width] duration-200 ease-out motion-reduce:transition-none"
    :class="text ? 'w-64' : 'w-36 focus-within:w-64'"
    @submit.prevent
  >
    <UInput
      v-model="text"
      type="search"
      name="q"
      icon="i-lucide-search"
      :placeholder="t('prototypes.gallery.searchPlaceholder')"
      :aria-label="t('prototypes.gallery.search')"
      class="w-full"
      :ui="{ trailing: 'pe-1' }"
    >
      <template v-if="text" #trailing>
        <UButton
          icon="i-lucide-x"
          :aria-label="t('prototypes.gallery.clear')"
          color="neutral"
          variant="link"
          size="xs"
          @click="clear"
        />
      </template>
    </UInput>
  </form>
</template>
