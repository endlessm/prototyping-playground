import { useLocalStorage } from '@vueuse/core'

export type CollectionView = 'cards' | 'list'

// How collections (the prototypes gallery, and later others) are shown:
// cards or a plain list. One choice for every collection, remembered in this
// browser and followed by other open tabs. Cards are the default.
export function useCollectionView() {
  const stored = useLocalStorage<string>(
    'design-studio:collection-view',
    'cards',
  )
  return computed<CollectionView>({
    get: () => (stored.value === 'list' ? 'list' : 'cards'),
    set: (view) => {
      stored.value = view
    },
  })
}
