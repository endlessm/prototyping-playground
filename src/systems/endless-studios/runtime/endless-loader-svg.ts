// `~/assets/images/loader/endless-loader.svg?component`: the app turns the SVG file into a Vue component with
// nuxt-svgo, which the preview build doesn't have. This renders the same copied file as one `<svg>` element.
import { defineComponent, h } from 'vue';
import raw from '~/assets/images/loader/endless-loader.svg?raw';

const [, attributeText = '', inner = ''] = raw.match(/<svg([^>]*)>([\s\S]*)<\/svg>/) ?? [];
const attributes = Object.fromEntries(
  [...attributeText.matchAll(/([\w:-]+)="([^"]*)"/g)].filter(([, name]) => name !== 'xmlns').map(([, name, value]) => [name, value]),
);

export default defineComponent({
  name: 'EndlessLoaderSvg',
  setup() {
    return () => h('svg', { ...attributes, innerHTML: inner });
  },
});
