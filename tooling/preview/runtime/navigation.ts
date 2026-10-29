// Navigation for prototype views, imported from `#studio/prototype`. A view
// names another artifact by its path inside the prototype (`flows/Details`),
// never by its ID; the path resolves to the artifact's permanent address,
// so a rename or move of the view that links keeps working once the path is
// updated. Links render as plain anchors: the preview document sends a
// click on them, and `usePrototypeNavigate`, through the studio, so history,
// Back and Forward and the highlighted navigation stay correct.
import {
  defineComponent,
  h,
  inject,
  type InjectionKey,
  type PropType,
} from 'vue'

/** What a rendered view knows of its prototype. */
export interface PrototypeScope {
  /** The studio's base path, ending in a slash. */
  base: string
  /** The prototype's permanent ID. */
  prototype: string
  /** The artifact on screen: a view or one of its states. */
  current: string
  /** The view on screen, the same as `current` unless a state is. */
  currentView: string
  /** The prototype's artifacts (not states), by path without the extension. */
  artifacts: () => readonly { id: string; path: string }[]
  /** Opens a studio address (with the base path). */
  navigate: (href: string, options?: { replace?: boolean }) => void
}

export const PROTOTYPE_SCOPE: InjectionKey<PrototypeScope> =
  Symbol('studio-prototype')

const ID = /^[0-9abcdefghjkmnpqrstvwxyz]{16}$/

/**
 * The permanent address of the artifact at `path` inside the prototype,
 * keeping any `?query` or `#anchor`. The path may keep its extension.
 */
export function prototypeArtifactHref(scope: PrototypeScope, path: string) {
  const at = path.search(/[?#]/)
  const file = at < 0 ? path : path.slice(0, at)
  const suffix = at < 0 ? '' : path.slice(at)
  const matches = scope
    .artifacts()
    .filter(
      (artifact) =>
        artifact.path === file ||
        artifact.path === file.replace(/\.[^./]+$/, ''),
    )
  if (matches.length > 1)
    throw new Error(
      `The prototype path "${file}" is ambiguous: more than one artifact is at it.`,
    )
  const artifact = matches[0]
  if (!artifact)
    throw new Error(
      `No artifact of this prototype is at the path "${file}". Paths are inside the prototype, without the extension, like "flows/Sign in".`,
    )
  if (!ID.test(scope.prototype) || !ID.test(artifact.id))
    throw new Error(`The artifact at "${file}" has no permanent identity yet.`)
  return `${scope.base}prototypes/${scope.prototype}/artifacts/${artifact.id}${suffix}`
}

/**
 * Where a link goes: a path inside the prototype, or a studio address
 * starting with `/`, which is used as given under the studio's base path.
 */
export function targetHref(scope: PrototypeScope, to: string) {
  return to.startsWith('/')
    ? `${scope.base}${to.slice(1)}`
    : prototypeArtifactHref(scope, to)
}

function useScope() {
  const scope = inject(PROTOTYPE_SCOPE, null)
  if (!scope)
    throw new Error(
      'Prototype navigation works only inside a view the studio renders.',
    )
  return scope
}

/** Returns a function giving the permanent address of a path. */
export function usePrototypeArtifactHref() {
  const scope = useScope()
  return (path: string) => prototypeArtifactHref(scope, path)
}

/** Whether the artifact at `path` is the one on screen (or the view of the state on screen). */
export function useIsPrototypeArtifact(path: string) {
  const scope = useScope()
  const href = prototypeArtifactHref(scope, path).split(/[?#]/)[0]
  const id = href!.slice(href!.lastIndexOf('/') + 1)
  return id === scope.current || id === scope.currentView
}

/** Returns a function that opens a path inside the prototype, or a `/` studio address. */
export function usePrototypeNavigate() {
  const scope = useScope()
  return (to: string, options?: { replace?: boolean }) =>
    scope.navigate(targetHref(scope, to), options)
}

/** A link to another artifact of this prototype, by its path inside it. */
export const PrototypeLink = defineComponent({
  name: 'PrototypeLink',
  props: {
    /** A path inside the prototype, or a studio address starting with `/`. */
    to: { type: String as PropType<string>, required: true },
  },
  setup(props, { slots }) {
    const scope = useScope()
    return () =>
      h('a', { href: targetHref(scope, props.to) }, slots.default?.())
  },
})
