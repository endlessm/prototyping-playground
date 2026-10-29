import { describe, expect, test } from 'vitest'
import {
  prototypeArtifactHref,
  targetHref,
  type PrototypeScope,
} from '../../tooling/preview/runtime/navigation'

const scope = (
  artifacts: { id: string; path: string }[],
  base = '/studio/',
): PrototypeScope => ({
  base,
  prototype: 'f1ws000000000001',
  current: 'hme0000000000a01',
  currentView: 'hme0000000000a01',
  artifacts: () => artifacts,
  navigate: () => {},
})
const flows = scope([
  { id: 'hme0000000000a01', path: 'Home' },
  { id: 'det0000000000a01', path: 'flows/Details' },
])

describe('a path inside the prototype', () => {
  test('[PR-94] resolves to the artifact’s permanent address under the studio’s base path', () => {
    expect(prototypeArtifactHref(flows, 'flows/Details')).toBe(
      '/studio/prototypes/f1ws000000000001/artifacts/det0000000000a01',
    )
    expect(prototypeArtifactHref(flows, 'flows/Details.vue')).toBe(
      '/studio/prototypes/f1ws000000000001/artifacts/det0000000000a01',
    )
  })

  test('[PR-94] keeps its query and anchor', () => {
    expect(prototypeArtifactHref(flows, 'Home?tab=2#top')).toBe(
      '/studio/prototypes/f1ws000000000001/artifacts/hme0000000000a01?tab=2#top',
    )
  })

  test('[PR-94] that matches nothing, or more than one artifact, raises a clear error', () => {
    expect(() => prototypeArtifactHref(flows, 'Nope')).toThrow(
      'No artifact of this prototype is at the path "Nope".',
    )
    const twins = scope([
      { id: 'hme0000000000a01', path: 'Home' },
      { id: 'hme0000000000a02', path: 'Home' },
    ])
    expect(() => prototypeArtifactHref(twins, 'Home')).toThrow(
      'The prototype path "Home" is ambiguous',
    )
  })

  test('[PR-94] an absolute target is a studio address, used as given', () => {
    expect(targetHref(flows, '/prototypes')).toBe('/studio/prototypes')
    expect(targetHref(scope([], '/'), '/')).toBe('/')
  })
})
