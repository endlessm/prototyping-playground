// The studio's name and tagline from `studio.config.json`, read at build time.
export function useStudioConfig() {
  return useRuntimeConfig().public.studio
}
