import { useLocalStorage } from '@vueuse/core'

export type CollectionView = 'cards' | 'list'

/**
 * Whether collections (Systems, and other indexes) show cards or a plain
 * list. One choice for every collection, remembered in this browser; cards
 * by default.
 */
export function useCollectionView() {
  return useLocalStorage<CollectionView>(
    'design-studio:collection-view',
    'cards',
  )
}
