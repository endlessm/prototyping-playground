<template>
  <RichText
    class="prose-img:mx-2 prose-img:my-2 prose-img:w-52 prose-img:h-52 prose-img:object-cover prose-img:rounded-lg prose-img:inline-flex prose-img:cursor-pointer"
    :html="htmlWithMentions"
    @click="onClick"
  />
</template>

<script>
import { defineComponent } from 'vue'
import RichText from '~/components/Generic/RichText.vue'

const USERNAME_REGEX = /@([a-z0-9\-_]+)/gi

export default defineComponent({
  name: 'PostText',
  components: {
    RichText,
  },
  props: {
    html: {
      type: String,
      required: true,
    },
  },
  computed: {
    htmlWithMentions() {
      return `<div>${this.replaceMentions(this.html)}</div>`
    },
  },
  mounted() {
    document
      .querySelectorAll(`#${this.id} #description p img`)
      .forEach((image) => {
        image.addEventListener('click', this.viewImage)
      })
  },
  methods: {
    onClick(event) {
      const target = event.target
      const linkMention = target.closest('a.mention')
      // TipTap mentions carry the username in data-label; older Quill posts
      // used data-username, so match both.
      const spanMention = target.closest(
        'span.mention[data-label], span.mention[data-username]',
      )
      if (linkMention) {
        event.preventDefault()
        this.$router.push(linkMention.getAttribute('href'))
      } else if (spanMention) {
        const username =
          spanMention.dataset.label || spanMention.dataset.username
        this.$router.push(`/profile/${username}/`)
      } else if (target.tagName === 'IMG') {
        const imageSrc = target.currentSrc
        this.openModal(`attachment-image-view`, imageSrc)
        event.preventDefault()
      }
    },
    replaceMentions(description) {
      return description.replaceAll(
        USERNAME_REGEX,
        (match, username) =>
          `<a href="/profile/${username}/" class="mention">${match}</a>`,
      )
    },
  },
})
</script>
