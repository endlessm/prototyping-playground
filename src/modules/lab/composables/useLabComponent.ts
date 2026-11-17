import type { ComputedRef, InjectionKey } from 'vue'
import type {
  CatalogComponent,
  ComponentPageData,
  SystemCatalog,
} from '../../systems/composables/useSystemCatalog'

/** The component the bench has open, for its tab pages. */
export interface LabComponent {
  system: ComputedRef<SystemCatalog>
  component: ComputedRef<CatalogComponent>
  /** Its files' shared name, such as `button` for `button.vue`. */
  stem: ComputedRef<string>
  /** Its page, examples text and props; undefined until they load. */
  data: ComputedRef<ComponentPageData | undefined>
  /** Fetches the components' data again, as "Try again" does. */
  reload: () => Promise<void>
}

const KEY: InjectionKey<LabComponent> = Symbol('lab-component')

/** The bench gives its open component to the tab pages under it. */
export function provideLabComponent(value: LabComponent) {
  provide(KEY, value)
}

/** The open component, in a tab page under the bench. */
export function useLabComponent() {
  const value = inject(KEY)
  if (!value)
    throw new Error('useLabComponent() runs only in a Lab component’s tab.')
  return value
}
