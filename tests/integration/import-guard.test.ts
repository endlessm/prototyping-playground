import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, expect, test } from 'vitest'
import { build, createServer } from 'vite'
import { importGuard } from '../../tooling/checks/imports'

const root = mkdtempSync(path.join(os.tmpdir(), 'studio-guard-'))
afterEach(() => rmSync(root, { recursive: true, force: true }))

test('[CL-117] [PR-95] actual dev transforms and production builds refuse private imports', async () => {
  const dir = path.join(root, 'src/prototypes/ada/demo')
  mkdirSync(dir, { recursive: true })
  const file = path.join(dir, 'Home.ts')
  writeFileSync(
    file,
    'export { secret } from "../../../../../tooling/private.ts"',
  )
  const policy = {
    root,
    prototypesDir: path.join(root, 'src/prototypes'),
    system: null,
    modules: [],
  }
  const server = await createServer({
    configFile: false,
    root,
    plugins: [importGuard(policy)],
    server: { middlewareMode: true, ws: false },
    logLevel: 'silent',
  })
  try {
    await expect(
      server.transformRequest('/src/prototypes/ada/demo/Home.ts'),
    ).rejects.toThrow('Forbidden import')
  } finally {
    await server.close()
  }
  await expect(
    build({
      configFile: false,
      root,
      plugins: [importGuard(policy)],
      build: { write: false, lib: { entry: file, formats: ['es'] } },
      logLevel: 'silent',
    }),
  ).rejects.toThrow('Forbidden import')
})

test('[PR-84] [SH-139] the guard preserves Vue syntax details and source locations', async () => {
  const dir = path.join(root, 'src/prototypes/ada/demo')
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'Broken.vue'), '<template>\n<div>\n</template>')
  const server = await createServer({
    configFile: false,
    root,
    plugins: [
      importGuard({
        root,
        prototypesDir: path.join(root, 'src/prototypes'),
        system: null,
        modules: [],
      }),
    ],
    server: { middlewareMode: true, ws: false },
    logLevel: 'silent',
  })
  try {
    await expect(
      server.transformRequest('/src/prototypes/ada/demo/Broken.vue'),
    ).rejects.toThrow(/Broken\.vue:2:1: Element is missing end tag/)
  } finally {
    await server.close()
  }
})
