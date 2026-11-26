<template>
  <section
    class="w-full bg-white rounded-2xl border-1 border-gray-200 overflow-hidden flex flex-col justify-between default-card break-words"
  >
    <section
      v-if="hasImage"
      :style="{
        backgroundImage:
          imageUrl !== null ? `url(${imageUrl})` : `url(${defaultBg})`,
      }"
      class="w-full card-image"
    ></section>
    <section
      v-if="hasHeader"
      class="flex items-center justify-between p-4 border-b-1 border-gray-200"
    >
      <p class="text-sm font-semibold">
        {{ title }}
      </p>
      <UDropdownMenu
        v-if="hasMultiButton"
        :items="menuItems"
        :content="{ align: 'end' }"
      >
        <UButton
          icon="i-lucide-ellipsis"
          color="neutral"
          variant="ghost"
          @click.stop
        />
      </UDropdownMenu>
    </section>
    <section class="flex flex-col gap-y-4 p-4">
      <slot name="body"></slot>
    </section>
    <section
      v-if="hasFooter"
      class="px-4 py-3 border-t-1 border-gray-200 card-footer"
    >
      <slot name="footer"></slot>
    </section>
  </section>
</template>

<script setup>
import defaultBg from '~/assets/images/default-bg.png'
</script>

<script>
export default {
  props: {
    title: {
      type: String,
      default: '',
    },
    hasFooter: {
      type: Boolean,
      default: false,
    },
    hasHeader: {
      type: Boolean,
      default: true,
    },
    hasImage: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    hasMultiButton: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['optionSelected'],
  computed: {
    menuItems() {
      return this.options.map((option) => ({
        label: option?.label ?? option,
        onSelect: () =>
          this.$emit('optionSelected', { option: option?.id ?? option }),
      }))
    },
  },
}
</script>

<style scoped>
.card-image {
  height: 160px;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  background-image: url('~/assets/images/default-bg.png');
}
.card-image-small .card-image {
  height: 140px;
}
.default-card {
  transition: all 0.2s ease;
}
.discover-card .default-card:hover {
  box-shadow: 0 6px 12px 2px rgba(156, 161, 165, 0.15) !important;
}
</style>
