import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

function node(args: string[], input?: string) {
  return spawnSync(process.execPath, args, {
    encoding: 'utf8',
    input,
    env: Object.fromEntries(
      Object.entries(process.env).filter(([key]) => !key.startsWith('VITEST')),
    ),
  })
}

function formatCheck(file: string, source: string) {
  return node(
    [
      'node_modules/prettier/bin/prettier.cjs',
      '--check',
      '--stdin-filepath',
      file,
    ],
    source,
  )
}

describe('toolchain commands', () => {
  test('[CL-135] a test run that finds no tests fails', () => {
    const result = node([
      'node_modules/vitest/vitest.mjs',
      'run',
      '--project',
      'unit',
      'no-test-file-has-this-name',
    ])
    expect(result.status).not.toBe(0)
    expect(result.stdout + result.stderr).toMatch(/No test files found/)
  })

  test('[CL-141] the installed Git hooks are the studio’s', () => {
    const result = spawnSync('git', ['config', 'core.hooksPath'], {
      encoding: 'utf8',
    })
    expect(result.stdout.trim()).toBe('.husky/_')
  })

  test('[CL-142] the format check refuses unformatted code and accepts formatted code', () => {
    const bad = formatCheck('app/example.ts', 'const a = "x";\n')
    expect(bad.status).not.toBe(0)
    const good = formatCheck('app/example.ts', "const a = 'x'\n")
    expect(good.status).toBe(0)
  })

  test('[CL-142] prototypes and systems keep their own formatting', () => {
    const result = formatCheck(
      'src/prototypes/someone/x/View.ts',
      'const a = "x";\n',
    )
    expect(result.status).toBe(0)
  })

  // What `yarn install` runs after installing, on a checkout with no build
  // folder yet, as in CI. The copy links this checkout's dependencies.
  test('Nuxt prepares a checkout that has never been built', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-prepare-'))
    try {
      const skipped = /^(.git|node_modules|.nuxt.*|.output.*|.scratch)$/
      for (const entry of fs.readdirSync('.'))
        if (!skipped.test(entry))
          fs.cpSync(entry, path.join(root, entry), { recursive: true })
      fs.symlinkSync(
        path.resolve('node_modules'),
        path.join(root, 'node_modules'),
        'junction',
      )
      const result = spawnSync(
        process.execPath,
        ['node_modules/nuxt/bin/nuxt.mjs', 'prepare'],
        {
          cwd: root,
          encoding: 'utf8',
          env: Object.fromEntries(
            Object.entries(process.env).filter(
              ([key]) =>
                !key.startsWith('VITEST') && key !== 'STUDIO_BUILD_DIR',
            ),
          ),
        },
      )
      expect(result.stdout + result.stderr).not.toMatch(/Tsconfig not found/)
      expect(result.status).toBe(0)
      expect(fs.existsSync(path.join(root, '.nuxt/tsconfig.app.json'))).toBe(
        true,
      )
    } finally {
      // Removes the link, not the dependencies it points to.
      fs.rmSync(root, { recursive: true, force: true })
    }
  }, 180_000)
})
