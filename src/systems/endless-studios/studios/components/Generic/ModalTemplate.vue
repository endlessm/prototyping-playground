<template>
  <div class="bg" :style="bgStyles">
    <Transition name="fade" appear>
      <div class="modal-backdrop" @click="closeOutside" />
    </Transition>
    <transition name="pop" appear>
      <div v-if="mount" :id="id" :class="`modal ${modalClasses}`">
        <div
          v-if="slotsMounted"
          class="absolute flex justify-center items-center top-1 -right-12 w-10 h-10 rounded-full bg-white cursor-pointer max-md:hidden"
          @click.stop="close"
        >
          <img
            id="task-modal-close-btn"
            src="~/assets/images/X.svg"
            class="w-2 h-2 cursor-pointer"
            style="box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.1)"
            @click.stop="close"
          />
        </div>

        <div v-if="showMobileCloseBtn" class="w-full pt-6 pb-6 px-6 md:hidden">
          <img
            src="~/assets/images/X.svg"
            class="float-right w-4 h-4 cursor-pointer"
            @click.stop="close"
          />
        </div>
        <slot />
      </div>
    </transition>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import _ from 'lodash'

export default defineComponent({
  props: {
    id: {
      type: String,
      required: true,
    },
    show: {
      type: Boolean,
      required: false,
    },
    modalClasses: {
      type: String,
      required: false,
      default: '',
    },
    showMobileCloseBtn: {
      type: Boolean,
      required: false,
      default: true,
    },
    bgStyles: {
      type: Object,
      default: undefined,
    },
  },
  emits: ['close'],
  data() {
    return {
      mount: true,
      slotsMounted: false,
    }
  },

  mounted() {
    this.slotsMounted = this.$slots.default?.().length
    this.setSlotMounted()
    const observer = new MutationObserver(this.setSlotMounted)
    observer.observe(this.$el, {
      childList: true,
      subtree: true,
    })
    this.observer = observer
    document.body.style.overflow = 'hidden'
  },

  beforeUnmount() {
    this.observer.disconnect()
    this.mount = false
    document.body.style.overflow = 'auto'
  },

  methods: {
    setSlotMounted() {
      if (!this.slotsMounted) {
        this.slotsMounted = this.$slots.default?.().length
      }
    },
    closeOutside(e) {
      const modalBackground =
        document.getElementsByClassName('modal-backdrop')[0]
      if (modalBackground === e.target) {
        this.close()
      }
    },
    close() {
      this.mount = false
      _.delay(() => {
        this.$emit('close')
      }, 500)
    },
  },
})
</script>

<style scoped>
@reference "~/assets/css/main.css";
.bg {
  @apply fixed top-0 bottom-0 left-0 right-0 flex justify-center items-center overflow-y-auto;
  z-index: 9999;
}
.modal-backdrop {
  @apply fixed top-0 bottom-0 left-0 right-0 flex justify-center overflow-y-auto;
  z-index: 999;
  background-color: rgba(0, 0, 0, 0.3);
}
.modal {
  @apply mt-27 mb-27 w-fit h-fit relative bg-white flex flex-col;
  z-index: 1000;
  overflow: initial;
  @variant max-sm {
    @apply w-screen my-0 rounded-none;
    height: 100%;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s linear;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.pop-enter-active,
.pop-leave-active {
  transition:
    transform 0.4s cubic-bezier(0.5, 0, 0.5, 1),
    opacity 0.4s linear;
}

.pop-enter,
.pop-leave-to {
  opacity: 0;
  transform: translateX(50%);
}
</style>
