// How a document's links and embeds find artifacts: only inside its own
// prototype, by a path relative to the document or a permanent address.
import { describe, expect, test } from 'vitest'
import { resolveReference } from '../../app/utils/artifactReference'
import type {
  ManifestArtifact,
  ManifestPrototype,
} from '../../tooling/manifest/build'

const prototype: ManifestPrototype = {
  id: 'p000000000000001',
  title: 'Demo',
  contributor: 'ada',
  folder: 'src/prototypes/ada/demo',
  owner: null,
  created: null,
  systemId: null,
}
const artifact = (
  id: string,
  inside: string,
  extension: string,
  type: string,
  extra: Partial<ManifestArtifact> = {},
): ManifestArtifact => ({
  id,
  title: inside.split('/').pop()!,
  path: inside,
  file: `${prototype.folder}/${inside}${extension}`,
  type,
  ...extra,
})
const brief = artifact('d000000000000001', 'notes/Brief', '.md', 'document')
const signIn = artifact('v000000000000001', 'flows/Sign in', '.vue', 'view')
const home = artifact('v000000000000002', 'Home', '.vue', 'view')
const board = artifact('c000000000000001', 'Board', '.canvas', 'canvas', {
  unavailable: { type: 'Canvas', module: 'Canvas' },
})
const artifacts = [signIn, brief, home, board]
const origin = { prototype, artifact: brief }
const embeds = (type: string) => (type === 'view' ? 'preview' : 'card')
const resolve = (reference: string, extension: 'required' | 'optional') =>
  resolveReference(reference, origin, artifacts, {
    extension,
    presentation: embeds,
    extensions: ['.md', '.vue', '.canvas'],
  })

describe('a reference inside the document’s prototype', () => {
  test('[PR-112] [PR-99] a view embeds as a preview, by its path relative to the document', () => {
    expect(resolve('../flows/Sign%20in.vue', 'required')).toEqual({
      state: 'resolved',
      artifact: signIn,
      presentation: 'preview',
    })
    expect(resolve('./../Home.vue', 'required')).toMatchObject({
      artifact: home,
    })
  })

  test('[PR-101] a document embeds as a card', () => {
    expect(resolve('./Brief.md', 'required')).toEqual({
      state: 'resolved',
      artifact: brief,
      presentation: 'card',
    })
  })

  test('[PR-111] a link may leave out the extension; an embed may not', () => {
    expect(resolve('../Home', 'optional')).toMatchObject({ artifact: home })
    expect(resolve('../Home', 'required')).toEqual({
      state: 'unavailable',
      code: 'invalid_reference',
    })
  })

  test('[PR-111] a permanent address of the same prototype resolves', () => {
    expect(
      resolve(
        `/prototypes/${prototype.id}/artifacts/${home.id}#top`,
        'required',
      ),
    ).toMatchObject({ state: 'resolved', artifact: home })
  })
})

describe('a reference that can’t be shown', () => {
  test('[PR-102] [PR-75] a file that isn’t there is not found', () => {
    expect(resolve('../Gone.vue', 'required')).toEqual({
      state: 'unavailable',
      code: 'not_found',
    })
  })

  test('[PR-102] a file no installed type opens is unavailable', () => {
    expect(resolve('../sketch.excalidraw', 'required')).toEqual({
      state: 'unavailable',
      code: 'unavailable',
    })
  })

  test('[PR-102] a file of a turned-off type’s format is unavailable', () => {
    expect(resolve('../Board.canvas', 'required')).toEqual({
      state: 'unavailable',
      code: 'inactive_format',
    })
  })

  test('[PR-103] [PR-102] a path out of the prototype, or into its helpers, is refused', () => {
    for (const reference of [
      '../../other/Home.vue',
      '../_helpers/Card.vue',
      'https://example.com/a.vue',
      '//example.com/a.vue',
    ])
      expect(resolve(reference, 'required')).toEqual({
        state: 'unavailable',
        code: 'invalid_reference',
      })
  })

  test('[PR-103] [PR-102] a permanent address in another prototype is refused as another prototype', () => {
    expect(
      resolve(
        '/prototypes/p000000000000002/artifacts/v000000000000009',
        'required',
      ),
    ).toEqual({ state: 'unavailable', code: 'elsewhere' })
  })
})
