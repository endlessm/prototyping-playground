import path from 'node:path'
import ts from 'typescript'
import { expect, test } from 'vitest'

test('[CL-129] Nuxt typechecks the app, Node tooling and tests without compiling rebuild source in the Studio runtime', () => {
  const files = ['app', 'node', 'server', 'shared'].flatMap((project) => {
    const file = path.resolve(`.nuxt/tsconfig.${project}.json`)
    const config = ts.readConfigFile(file, ts.sys.readFile)
    expect(config.error).toBeUndefined()
    return ts
      .parseJsonConfigFileContent(config.config, ts.sys, path.dirname(file))
      .fileNames.map((name) => name.replaceAll('\\', '/'))
  })
  expect(
    files.some((file) => file.includes('/app/') && file.endsWith('.ts')),
  ).toBe(true)
  expect(files.some((file) => file.endsWith('/tooling/checks/run.ts'))).toBe(
    true,
  )
  expect(
    files.some((file) => file.endsWith('/tests/unit/typecheck-scope.test.ts')),
  ).toBe(true)
  expect(
    files.filter((file) => /\/src\/(prototypes|systems)\//.test(file)),
  ).toEqual([])
})
