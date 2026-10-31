import { addServerHandler, createResolver, defineNuxtModule } from 'nuxt/kit'
export default defineNuxtModule({
  meta: { name: 'studio-people' },
  setup(_options, nuxt) {
    if (!nuxt.options.dev) return
    nuxt.options.runtimeConfig.studioPeople = {
      root: nuxt.options.rootDir,
      contributorsFolder: process.env.STUDIO_CONTRIBUTORS || 'contributors',
      configFile: process.env.STUDIO_CONFIG || 'studio.config.json',
    }
    addServerHandler({
      route: '/_studio/people',
      handler: createResolver(import.meta.url).resolve('./server/people.ts'),
    })
  },
})
