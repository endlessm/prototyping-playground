<template>
  <div
    class="flex items-center justify-center border-1 border-gray-secondry border-dashed rounded-xl"
    :class="isActive ? 'bg-gray-2' : ''"
    @mouseenter="showOptions"
    @mouseleave="hideOptions"
    @dragenter.prevent="toggleIsActive"
    @dragleave.prevent="toggleIsActive"
    @dragover.prevent
    @drop.prevent="dropFile"
  >
    <div v-if="!isHover" class="flex items-center justify-center">
      <img
        class="w-7 h-7 p-1.5 option-image"
        src="~/assets/images/Icons/plus-gray.svg"
        alt=""
      />
    </div>

    <div v-else class="flex items-center justify-center">
      <img
        v-if="!dontAllowFiles"
        class="w-8 h-8 p-1.5 option-image"
        src="~/assets/images/Icons/attachment.svg"
        alt=""
        @click="selectFile"
      />
      <div v-if="!dontAllowLinkes" class="relative">
        <img
          class="ml-3 w-8 h-8 p-1.5 option-image"
          src="~/assets/images/Icons/link.svg"
          alt=""
          @click="toggleShowLinkInput"
        />
        <div
          v-if="isShowLinkInput"
          class="absolute border p-1 rounded-md bg-white"
        >
          <div class="input" :class="urlData.urlError ? 'border-red-700' : ''">
            <img
              class="ml-1.5 w-5 h-5"
              src="~/assets/images/Icons/link.svg"
              alt=""
            />
            <input
              v-model="urlData.url"
              class="ml-0.5 text-caption-2 text-gray-7 w-48 focus:outline-hidden"
              type="text"
              @keypress.enter="addLink"
            />
            <button
              class="tailwind-btn py-1.5 px-3.5 tailwind-btn-orange add-btn"
              @click="addLink"
            >
              Add
            </button>
          </div>
          <p class="input-error">{{ urlData.urlError }}</p>
        </div>
      </div>

      <input :id="id" class="hidden" type="file" @change="onSelectImage" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    id: {
      type: String,
      required: true,
    },
    dontAllowFiles: {
      type: Boolean,
      required: false,
      default: false,
    },
    dontAllowLinkes: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ['input'],
  data() {
    return {
      isActive: false,
      isHover: false,
      fileName: '',
      isShowLinkInput: false,
      urlData: {
        url: '',
        urlError: '',
      },
    }
  },

  methods: {
    showOptions() {
      this.isHover = true
    },
    hideOptions() {
      this.isHover = false
      this.hideLinkInput()
    },
    toggleIsActive() {
      if (!this.dontAllowFiles) {
        this.isActive = !this.isActive
      }
    },
    toggleShowLinkInput() {
      this.isShowLinkInput = !this.isShowLinkInput
    },
    hideLinkInput() {
      this.isShowLinkInput = false
      this.urlData = {
        url: '',
        urlError: '',
      }
    },

    validateLink() {
      if (this.urlData.url.trim() === '') {
        this.urlData.urlError = 'url is required'
        return false
      } else {
        this.urlData.urlError = ''
        return true
      }
    },

    dropFile(e) {
      e.preventDefault()
      if (this.dontAllowFiles) {
        return
      }
      this.toggleIsActive()
      this.fileName = e.dataTransfer.files[0].name
      const body = {
        type: 'file',
        data: e.dataTransfer.files[0],
      }
      this.$emit('input', body)
      this.hideOptions()
    },

    addLink() {
      if (this.validateLink()) {
        const body = {
          type: 'url',
          data: this.urlData.url,
        }
        this.$emit('input', body)
        this.hideOptions()
      }
    },

    selectFile() {
      document.getElementById(this.id)?.click()
    },
    onSelectImage(event) {
      const body = {
        type: 'file',
        data: event.target.files[0],
      }
      this.$emit('input', body)
      this.hideOptions()
    },
  },
}
</script>

<style scoped>
@reference "~/assets/css/main.css";
.option-image {
  @apply rounded-full object-none cursor-pointer;
  &:hover {
    background-color: rgba(0, 0, 0, 0.06);
  }
}
.input {
  @apply relative border rounded-md flex;
  width: 275px;
  height: 33px;
  button {
    position: absolute;
    top: -1px;
    right: -1px;
    height: 33px;
    margin-left: 10px;
  }
}
.add-btn {
  border-radius: 6px !important;
}
</style>
