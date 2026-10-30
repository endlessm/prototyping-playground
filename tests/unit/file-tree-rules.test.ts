// What the file tree shows: readable names, which files are hidden until
// "Show all files", the deployed site's tree from the published artifacts,
// filtering, and what a folder's delete would also take.
import { describe, expect, test } from 'vitest'
import {
  clashHint,
  filterNodes,
  hiddenInside,
  nodesFromPaths,
  visibleNodes,
} from '../../app/utils/fileTree'
import { artifactTitle } from '../../tooling/manifest/titles'
import type { FileNode } from '../../tooling/files/tree'

const file = (path: string): FileNode => ({
  name: path.split('/').pop()!,
  path,
  dir: false,
})
const folder = (path: string, children: FileNode[] = []): FileNode => ({
  name: path.split('/').pop()!,
  path,
  dir: true,
  children,
})

const disk: FileNode[] = [
  folder('_parts', [file('_parts/Helper.vue')]),
  folder('empty'),
  folder('flows', [
    file('flows/sign-in.vue'),
    file('flows/notes.txt'),
    folder('flows/assets', [file('flows/assets/logo.png')]),
  ]),
  file('Home.vue'),
  file('meta.json'),
]
const artifacts = new Set(['flows/sign-in.vue', 'Home.vue'])

describe('names', () => {
  test('[SH-71] [PR-48] artifacts and folders read as titles', () => {
    expect(artifactTitle('user-settings')).toBe('User Settings')
    expect(artifactTitle('lofi')).toBe('Lo-fi')
    expect(artifactTitle('home_screen')).toBe('Home Screen')
    expect(artifactTitle('Home - new user')).toBe('Home - New user')
    expect(artifactTitle('Sign in')).toBe('Sign in')
  })
})

describe('what shows', () => {
  test('[SH-68] [PR-49] helpers, meta.json, images and other files are hidden; empty folders you made stay', () => {
    expect(visibleNodes(disk, artifacts)).toEqual([
      folder('empty'),
      folder('flows', [file('flows/sign-in.vue')]),
      file('Home.vue'),
    ])
  })

  test('[SH-69] [PR-64] the deployed site’s tree is the published artifacts, in order, with their folders', () => {
    expect(
      nodesFromPaths(['flows/deep/A.vue', 'flows/B.vue', 'Home.vue']),
    ).toEqual([
      folder('flows', [
        folder('flows/deep', [file('flows/deep/A.vue')]),
        file('flows/B.vue'),
      ]),
      file('Home.vue'),
    ])
  })
})

describe('filtering', () => {
  const label = (node: FileNode) =>
    artifactTitle(node.name.replace(/\.[^.]+$/, ''))
  test('[SH-76] [PR-52] files match by name, title or path, keeping the folders that hold them', () => {
    const shown = visibleNodes(disk, artifacts)
    expect(filterNodes(shown, 'sign in', label)).toEqual([
      folder('flows', [file('flows/sign-in.vue')]),
    ])
    expect(filterNodes(shown, 'flows/sign', label)).toEqual([
      folder('flows', [file('flows/sign-in.vue')]),
    ])
    expect(filterNodes(shown, 'home', label)).toEqual([file('Home.vue')])
    expect(filterNodes(shown, 'zzz', label)).toEqual([])
  })

  test('[SH-76] a matching folder keeps everything in it', () => {
    expect(filterNodes(visibleNodes(disk, artifacts), 'flow', label)).toEqual([
      folder('flows', [file('flows/sign-in.vue')]),
    ])
  })
})

describe('deleting a folder', () => {
  test('[SH-81] [PR-60] lists the files inside that the tree isn’t showing', () => {
    expect(hiddenInside(disk[2]!, artifacts)).toEqual([
      'notes.txt',
      'assets/logo.png',
    ])
  })
})

describe('errors', () => {
  test('[SH-89] [PR-62] a clash with a hidden file says how to see it', () => {
    const shown = visibleNodes(disk, artifacts)
    expect(
      clashHint('Something named “_parts” already exists there.', disk, shown),
    ).toBe(true)
    expect(
      clashHint('Something named “flows” already exists there.', disk, shown),
    ).toBe(false)
    expect(clashHint('Names can’t contain slashes.', disk, shown)).toBe(false)
  })
})
