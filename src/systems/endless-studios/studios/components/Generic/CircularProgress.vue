<template>
  <section
    ref="progress"
    class="circular-progress"
    :style="`background: ${backgroundStyle} `"
  >
    <p class="progress-value">{{ progress }}%</p>
  </section>
</template>

<script>
export default {
  props: {
    progress: {
      type: Number,
      required: true,
    },
    isError: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  computed: {
    backgroundStyle() {
      const backgroundStyle = `conic-gradient(${
        this.isError ? '#f95656' : '#2196f3'
      } ${this.progress * 3.6}deg, white 0deg);`
      return backgroundStyle
    },
  },
}
</script>

<style scoped>
@reference "~/assets/css/main.css";
.circular-progress {
  @apply relative flex items-center justify-center rounded-full;
  &::before {
    content: '';
    position: absolute;
    height: 80%;
    width: 80%;
    border-radius: 50%;
    background-color: white;
  }

  .progress-value {
    @apply relative font-bold text-center;
    font-size: 8px;
  }
}
.circular-progress__success {
  background: conic-gradient(#2196f3 3.6deg, white 0deg);
}
.circular-progress__error {
  background: conic-gradient(#f95656 3.6deg, white 0deg);
}
</style>
