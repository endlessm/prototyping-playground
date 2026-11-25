<template>
  <div
    class="p-1 border-1 border-gray-secondry rounded-xl"
    @mouseenter="showOptions"
    @mouseleave="hideOptions"
  >
    <div v-if="isHover">
      <img
        v-if="isOnlyDisplay"
        class="relative ml-auto w-7 h-7 p-1.5 option-image object-none z-1"
        src="~/assets/images/Icons/copy-link.svg"
        alt=""
        @click="openLink(url)"
      />

      <img
        v-else
        class="relative ml-auto w-7 h-7 p-1.5 option-image z-1"
        src="~/assets/images/Icons/trash.svg"
        alt=""
        @click="deleteCard"
      />
    </div>

    <div
      class="flex flex-col items-center justify-center"
      :class="isHover ? '-mt-5 ' : 'mt-2'"
    >
      <img
        class="w-7 h-7 p-1.5 ounded-full object-cover"
        src="~/assets/images/Icons/link.svg"
        alt=""
      />
      <UTooltip :text="url" :disabled="!url" :content="{ side: 'top' }">
        <p
          class="w-4/5 font-semibold text-caption-2 leading-caption-2 text-center truncate"
        >
          {{ url }}
        </p>
      </UTooltip>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    id: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    isOnlyDisplay: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ['delete'],
  data() {
    return {
      isHover: false,
    }
  },

  methods: {
    showOptions() {
      this.isHover = true
    },
    hideOptions() {
      this.isHover = false
    },
    openLink(url) {
      window.open(url, '_blank')
    },
    deleteCard() {
      this.$emit('delete', this.id)
    },
  },
}
</script>

<style scoped>
@reference "~/assets/css/main.css";
.option-image {
  @apply rounded-full  cursor-pointer;
  &:hover {
    background-color: rgba(0, 0, 0, 0.06);
  }
}
.input {
  @apply border rounded-md flex;
  width: 271px;
}
</style>
