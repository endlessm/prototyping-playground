<template>
  <DefaultCard
    :title="title"
    :has-footer="hasFooter"
    :options="options"
    :has-multi-button="hasMultiButton"
    @option-selected="$emit('optionSelected', $event)"
  >
    <template #body>
      <section class="flex flex-col gap-2">
        <ul class="flex flex-col gap-1">
          <li
            v-for="(channel, idx) in visibleItems"
            :key="channel.id"
            :class="idx === channelSelected ? 'feed-bg' : ''"
            class="flex gap-4 py-2.5 px-4 text-sm text-gray-light rounded-sm cursor-pointer"
            @click="selectChannel(idx, channel.id)"
          >
            <span
              :class="idx === channelSelected ? 'font-medium feed-text' : ''"
              >#</span
            >
            <p
              :class="idx === channelSelected ? 'font-medium channel-text' : ''"
              class="text-sm"
            >
              {{ channel.name }}
            </p>
          </li>
        </ul>
        <p
          v-if="isThereMore && !showAll"
          class="text-xs text-gray-9 capitalize cursor-pointer"
          @click="showAll = !showAll"
        >
          {{ $t('more') }}
        </p>
      </section>
    </template>
  </DefaultCard>
</template>

<script>
import DefaultCard from '~/components/shared/DefaultCard.vue'

export default {
  components: {
    DefaultCard,
  },
  props: {
    title: {
      type: String,
      default: '',
    },
    hasFooter: {
      type: Boolean,
      default: false,
    },
    channels: {
      type: Array,
      default: () => [],
    },
    modelValue: {
      type: Number,
      default: null,
    },
    options: {
      type: Array,
      default: () => [],
    },
    hasMultiButton: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'optionSelected'],
  data() {
    return {
      showAll: false,
    }
  },
  computed: {
    channelSelected() {
      if (this.modelValue == null) return 0
      const idx = this.channels.findIndex((ch) => ch.id === this.modelValue)
      return idx !== -1 ? idx : 0
    },
    isThereMore() {
      return this.channels?.length > 4
    },
    visibleItems() {
      return this.showAll ? this.channels : this.channels.slice(0, 4)
    },
  },
  methods: {
    selectChannel(id, channelId) {
      this.$emit('update:modelValue', channelId)
    },
  },
}
</script>

<style scoped>
.feed-bg {
  background-color: #a2a3b021;
}

.feed-text {
  color: #ff754c;
}

.channel-text {
  color: #393946;
}
</style>
