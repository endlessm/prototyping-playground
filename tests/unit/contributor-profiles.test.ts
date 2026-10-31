import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { readContributors } from '../../tooling/contributors/profiles'

let root: string
beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'profiles-'))
  mkdirSync(path.join(root, 'contributors'))
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

const ada = {
  formatVersion: 1,
  studioId: 'ada0000000000001',
  name: 'Ada Lovelace',
  email: 'ada@endless.example',
  github: 'ada',
  preferences: { onboarding: { welcomeDismissed: true } },
}

function write(key: string, profile: object) {
  writeFileSync(
    path.join(root, 'contributors', `${key}.json`),
    JSON.stringify(profile),
  )
}

describe('the contributor registry', () => {
  test('[CL-45] one JSON file per person: format version, permanent ID, name, emails, GitHub account, avatar and module preferences', () => {
    mkdirSync(path.join(root, 'public/images'), { recursive: true })
    writeFileSync(path.join(root, 'public/images/ada.png'), '')
    write('ada', {
      ...ada,
      emails: ['ada@home.example'],
      avatar: 'images/ada.png',
    })
    write('ben', {
      ...ada,
      studioId: 'ben0000000000002',
      name: 'Ben',
      email: 'ben@endless.example',
      github: '',
      preferences: {},
    })
    const { contributors, problems } = readContributors(root)
    expect(problems).toEqual([])
    expect(Object.keys(contributors)).toEqual(['ada', 'ben'])
    expect(contributors.ada).toMatchObject({
      studioId: 'ada0000000000001',
      emails: ['ada@home.example'],
      preferences: { onboarding: { welcomeDismissed: true } },
    })
  })

  test('[CL-45] each field is checked, naming the file', () => {
    write('ada', {
      formatVersion: 2,
      studioId: 'Ada',
      name: ' ',
      email: 'ada@endless.example',
      preferences: { onboarding: true },
      avatar: '../ada.png',
    })
    const { problems } = readContributors(root)
    expect(problems).toEqual([
      'contributors/ada.json: formatVersion must be 1.',
      'contributors/ada.json: studioId must be 16 lowercase letters and digits (Crockford base32).',
      'contributors/ada.json: add a name.',
      'contributors/ada.json: github must be text; use an empty string when there is none.',
      'contributors/ada.json: avatar must be an image path inside public/, such as images/sam.jpg.',
      'contributors/ada.json: preferences must hold one object per module.',
    ])
  })

  test('[CL-45] an avatar must exist under public/', () => {
    write('ada', { ...ada, avatar: 'images/ada.png' })
    expect(readContributors(root).problems).toEqual([
      'contributors/ada.json: the avatar public/images/ada.png is missing.',
    ])
  })

  test('[CL-45] profiles never hold permissions', () => {
    write('ada', { ...ada, admin: true, permissions: ['all'], role: 'admin' })
    expect(readContributors(root).problems).toEqual([
      'contributors/ada.json: profiles don\'t declare "permissions"; roles live in studio.config.json.',
      'contributors/ada.json: profiles don\'t declare "role"; roles live in studio.config.json.',
      'contributors/ada.json: profiles don\'t declare "admin"; roles live in studio.config.json.',
    ])
  })

  test('[CL-45] emails and GitHub accounts are unique, ignoring case', () => {
    write('ada', ada)
    write('ben', {
      ...ada,
      studioId: 'ben0000000000002',
      name: 'Ben',
      email: 'ben@endless.example',
      emails: ['ADA@Endless.example'],
      github: 'ADA',
    })
    expect(readContributors(root).problems).toEqual([
      'Contributor "ben": email ada@endless.example is also registered to ada.',
      'Contributor "ben": github ada is also registered to ada.',
    ])
  })
})

describe('sample contributors', () => {
  test('[CL-46] a profile can’t be a sample, and the studio ships none', () => {
    write('parker', { ...ada, sample: true })
    expect(readContributors(root).problems).toEqual([
      'contributors/parker.json: profiles don\'t declare "sample"; roles live in studio.config.json.',
    ])
    for (const file of readdirSync('contributors')) {
      expect(file).not.toBe('parker.json')
      expect(
        JSON.parse(readFileSync(path.join('contributors', file), 'utf8')),
      ).not.toHaveProperty('sample')
    }
  })
})
