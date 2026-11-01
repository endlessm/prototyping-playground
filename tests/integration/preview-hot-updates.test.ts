import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import { afterEach, expect, test } from 'vitest'
import { createServer, type ViteDevServer } from 'vite'
import { vueUpdatesFromOwnModules } from '../../tooling/preview/pipeline'

// Inside the checkout, where the view's `vue` import resolves.
mkdirSync('.e2e', { recursive: true })
const root = mkdtempSync(path.resolve('.e2e', 'hot-'))
const servers: ViteDevServer[] = []
afterEach(async () => {
  for (const server of servers.splice(0)) await server.close()
  rmSync(root, { recursive: true, force: true })
})

const view = (heading: string) => `<template><h1>${heading}</h1></template>\n`
const settle = () => new Promise((resolve) => setTimeout(resolve, 300))

async function server() {
  const started = await createServer({
    configFile: false,
    root,
    plugins: [vue(), vueUpdatesFromOwnModules()],
    server: { middlewareMode: true, ws: false, watch: null },
    logLevel: 'silent',
  })
  servers.push(started)
  return started
}

test('[PR-81] a view’s change reaches the document showing it, even when the studio’s own server hears it first', async () => {
  const file = path.join(root, 'Counter.vue')
  writeFileSync(file, view('Counter one'))
  // The studio's Vite and a preview document's, in one process, as in
  // `yarn dev`: only the document compiles the view.
  const studio = await server()
  const preview = await server()
  await preview.transformRequest('/Counter.vue')
  const sent: string[] = []
  const send = preview.environments.client.hot.send.bind(
    preview.environments.client.hot,
  )
  preview.environments.client.hot.send = (...args: unknown[]) => {
    const payload = args[0] as { type?: string } | string
    sent.push(typeof payload === 'string' ? payload : (payload.type ?? ''))
    return (send as (...rest: unknown[]) => void)(...args)
  }

  writeFileSync(file, view('Counter two'))
  studio.watcher.emit('change', file)
  await settle()
  preview.watcher.emit('change', file)
  await settle()
  expect(sent.filter((type) => type !== 'custom')).not.toEqual([])
})
