<script setup lang="ts">
// The card for anything in a collection: a neutral tile with the module's
// icon, the title, an optional description and a line of detail, so the
// studio's theme is what gives it colour. With `image`, a picture fills a
// 16:10 area above the title instead of the tile. The whole card is the
// link, named by the title and described by the detail; the menu (the
// `menu` slot) sits beside it, not inside it.
const props = defineProps<{
  to: string
  icon: string
  title: string
  /** Shown as "No description" when empty; left out when undefined. */
  description?: string
  archived?: boolean
  /**
   * A picture's address. Null keeps the picture's area, with the icon as a
   * placeholder, so a grid of such cards stays even; left out, no area.
   */
  image?: string | null
}>()
defineSlots<{ meta?: () => unknown; menu?: () => unknown }>()
const { t } = useI18n()
const metaId = useId()

const media = computed(() => props.image !== undefined)
// The picture fades in over the placeholder once loaded, so nothing moves;
// one that fails to load leaves the placeholder.
const loaded = ref<string | null>(null)
const failed = ref<string | null>(null)
const picture = useTemplateRef<HTMLImageElement>('picture')
// A cached picture can finish loading before Vue listens for it.
watch(
  picture,
  (element) => {
    if (element?.complete && element.naturalWidth)
      loaded.value = element.getAttribute('src')
  },
  { flush: 'post' },
)
</script>

<template>
  <div class="group/card relative h-full" :class="{ 'opacity-60': archived }">
    <UPageCard
      :to="props.to"
      :title="props.title"
      :aria-describedby="$slots.meta ? metaId : undefined"
      variant="outline"
      class="h-full hover:bg-elevated/50"
      :class="{ 'overflow-hidden': media }"
      :ui="{
        container: media ? 'p-0 sm:p-0' : 'p-4 sm:p-4',
        wrapper: media ? 'gap-3 pb-4' : 'gap-3',
        header: 'mb-0 w-full',
        leading: 'mb-0',
        body: media ? 'px-4' : undefined,
        title: 'pr-8 text-sm leading-snug font-semibold',
        description: 'line-clamp-2 text-xs leading-relaxed',
        footer: media ? 'mt-auto px-4 pt-0.5' : 'mt-auto pt-0.5',
      }"
    >
      <template v-if="media" #header>
        <div
          class="relative grid aspect-[16/10] w-full place-items-center border-b border-default bg-elevated text-dimmed"
          data-card-media
        >
          <UIcon :name="props.icon" class="size-6" aria-hidden="true" />
          <!-- Decorative: the card's link is named by its title. -->
          <img
            v-if="props.image && failed !== props.image"
            ref="picture"
            :key="props.image"
            :src="props.image"
            alt=""
            loading="lazy"
            decoding="async"
            class="absolute inset-0 size-full object-cover object-top transition-opacity duration-300 motion-reduce:transition-none"
            :class="loaded === props.image ? 'opacity-100' : 'opacity-0'"
            @load="loaded = props.image"
            @error="failed = props.image"
          />
        </div>
      </template>
      <template v-else #leading>
        <span
          class="grid size-8 place-items-center rounded-lg bg-elevated text-toned"
          aria-hidden="true"
        >
          <UIcon :name="props.icon" class="size-4" />
        </span>
      </template>
      <template v-if="props.description !== undefined" #description>
        {{ props.description || t('collection.noDescription') }}
      </template>
      <template v-if="$slots.meta" #footer>
        <div :id="metaId" class="flex items-center gap-1.5 text-xs text-muted">
          <slot name="meta" />
        </div>
      </template>
    </UPageCard>
    <!-- Over a picture, the menu's button gets the card's background, so
         it stays legible. -->
    <div
      v-if="$slots.menu"
      class="absolute top-2 right-2"
      :class="{ '[&_button]:bg-default/90': media }"
    >
      <slot name="menu" />
    </div>
  </div>
</template>
