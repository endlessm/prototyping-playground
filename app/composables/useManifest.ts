import url from 'virtual:studio-manifest'
import type {
  Manifest,
  ManifestArtifact,
  ManifestPrototype,
} from '../../tooling/manifest/build'
import { createLiveManifest } from '../../tooling/live/live-manifest'

export type { Manifest, ManifestArtifact, ManifestPrototype }

type ClientManifest = Manifest & {
  /** Changes whenever the content does. */
  revision: string
  /** Where each prototype's artifact list is, relative to the manifest. */
  artifacts: Record<string, string>
}

// One manifest for the page, fetched on first use. In development the
// server pushes a new one, with every artifact list, when content changes
// on disk; the same content arriving twice applies once.
const manifest = shallowRef<ClientManifest>()
// Artifact lists, by prototype ID, once a prototype has opened.
const lists = shallowReactive(new Map<string, ManifestArtifact[]>())
const requests = new Map<string, Promise<ManifestArtifact[]>>()
let live: ReturnType<typeof createLiveManifest<ClientManifest>> | undefined
let pending: Promise<ClientManifest> | undefined

async function fetchManifest() {
  const response = await fetch(url)
  if (!response.ok) throw new Error('The studio’s manifest failed to load.')
  return (await response.json()) as ClientManifest
}

function fetchList(current: ClientManifest, prototypeId: string) {
  return fetch(
    new URL(current.artifacts[prototypeId]!, new URL(url, location.href)),
  ).then(async (response) => {
    if (!response.ok)
      throw new Error('The prototype’s artifacts failed to load.')
    return (await response.json()) as ManifestArtifact[]
  })
}

function receive(
  next: ClientManifest,
  artifacts?: Record<string, ManifestArtifact[]>,
) {
  if (!live?.receive(next)) return
  manifest.value = next
  requests.clear()
  for (const id of [...lists.keys()]) {
    const list = artifacts?.[id]
    if (list) lists.set(id, list)
    else if (!next.artifacts[id]) lists.delete(id)
    else void loadList(next, id)
  }
}

async function loadList(current: ClientManifest, prototypeId: string) {
  let request = requests.get(prototypeId)
  if (!request) {
    request = fetchList(current, prototypeId)
    requests.set(prototypeId, request)
  }
  const list = await request
  if (manifest.value === current) lists.set(prototypeId, list)
  return list
}

function listen() {
  const hot = import.meta.hot
  if (!hot) return
  hot.on(
    'studio:manifest',
    (data: {
      manifest: ClientManifest
      artifacts: Record<string, ManifestArtifact[]>
    }) => receive(data.manifest, data.artifacts),
  )
  // Pushes sent while the socket was down are not replayed.
  let connected = false
  hot.on('vite:ws:connect', () => {
    if (connected) void fetchManifest().then((next) => receive(next))
    connected = true
  })
}

async function loadManifest() {
  pending ??= fetchManifest().then((first) => {
    live = createLiveManifest(first)
    manifest.value = first
    listen()
    return first
  })
  return pending
}

/** Prototypes, systems and the default system, kept current while open. */
export async function useManifest() {
  await loadManifest()
  return manifest as Ref<ClientManifest>
}

/**
 * A prototype's artifacts in file-tree order, loaded when it first opens and
 * then kept; in development they follow changes on disk.
 */
export async function usePrototypeArtifacts(prototypeId: () => string) {
  await loadManifest()
  const load = async () => {
    const current = manifest.value!
    const id = prototypeId()
    if (!current.artifacts[id] || lists.has(id)) return
    await loadList(current, id)
  }
  await load()
  watch(prototypeId, load)
  return computed(() => lists.get(prototypeId()) ?? [])
}
