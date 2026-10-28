import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { parse } from 'yaml'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const yarnrc = parse(readFileSync('.yarnrc.yml', 'utf8'))
const workflow = parse(readFileSync('.github/workflows/checks.yml', 'utf8'))

// The commands a job runs, in order.
function steps(job: string): string[] {
  return workflow.jobs[job].steps
    .map((step: { run?: string }) => step.run)
    .filter(Boolean)
}

describe('package scripts', () => {
  test('[CL-135] `yarn test` runs the unit and integration projects', () => {
    expect(pkg.scripts.test).toBe(
      'vitest run --project unit --project integration',
    )
  })

  test('[CL-136] `yarn test:full` runs every project, e2e included', () => {
    expect(pkg.scripts['test:full']).toBe('vitest run')
  })

  test('[CL-137] `yarn build:full` runs the full tests, then the build', () => {
    expect(pkg.scripts['build:full']).toBe('yarn test:full && yarn build')
  })

  test('[CL-107] `yarn build` writes the static site', () => {
    expect(pkg.scripts.build).toBe('nuxt generate')
  })

  test('[CL-138] change-based test selection is absent', () => {
    expect(pkg.scripts['test:changed']).toBeUndefined()
    expect(JSON.stringify(pkg.scripts)).not.toMatch(/--changed|test-selection/)
  })
})

describe('toolchain', () => {
  test('[CL-143] yarn 4 is pinned for corepack, with the node-modules linker', () => {
    expect(pkg.packageManager).toMatch(/^yarn@4\./)
    expect(yarnrc.nodeLinker).toBe('node-modules')
  })

  test('[CL-144] systems are workspace packages, and install scripts are off unless allowed', () => {
    expect(pkg.workspaces).toEqual(['src/systems/*'])
    expect(yarnrc.enableScripts).toBe(false)
    for (const meta of Object.values<{ built?: boolean }>(
      pkg.dependenciesMeta ?? {},
    ))
      expect(meta.built).toBe(true)
  })

  test('[CL-139] the pre-commit hook lints and formats staged files', () => {
    expect(readFileSync('.husky/pre-commit', 'utf8').trim()).toBe(
      'yarn lint-staged',
    )
    expect(pkg['lint-staged']['**/*.{js,mjs,ts,vue,css}']).toEqual([
      'eslint --fix',
      'prettier --write',
    ])
  })

  test('[CL-141] installing dependencies installs the hooks', () => {
    expect(pkg.scripts.postinstall).toMatch(/\bhusky\b/)
  })

  test('[CL-142] Prettier follows Endless Studios and skips content', () => {
    expect(JSON.parse(readFileSync('.prettierrc', 'utf8'))).toEqual({
      semi: false,
      singleQuote: true,
      endOfLine: 'auto',
    })
    const ignored = readFileSync('.prettierignore', 'utf8')
    for (const folder of [
      'src/prototypes/',
      'src/systems/',
      'contributors/',
      'studio.config.json',
    ])
      expect(ignored).toContain(folder)
    expect(pkg.scripts.format).toBe('prettier --write .')
    expect(pkg.scripts['format:check']).toBe('prettier --check .')
    expect(pkg.scripts.lint).toBe('eslint .')
  })
})

describe('CI workflow', () => {
  test('[CL-146] runs on pushes and pull requests to main, by hand and from other workflows, cancelling superseded runs', () => {
    expect(workflow.on.push.branches).toEqual(['main'])
    expect(workflow.on.pull_request.branches).toEqual(['main'])
    expect(workflow.on).toHaveProperty('workflow_dispatch')
    expect(workflow.on).toHaveProperty('workflow_call')
    expect(workflow.concurrency['cancel-in-progress']).toBe(true)
    expect(workflow.concurrency.group).toMatch(/pull_request\.number/)
  })

  test('[CL-148] the test job installs browsers and runs the full suite, without selecting tests', () => {
    expect(steps('tests')).toEqual([
      'corepack enable',
      'yarn install --immutable',
      'yarn playwright install --with-deps chromium',
      'yarn test:full',
    ])
  })

  test('[CL-149] the bundle job checks lint, format and types, then builds and inspects the build', () => {
    expect(steps('bundle')).toEqual([
      'corepack enable',
      'yarn install --immutable',
      'yarn lint',
      'yarn format:check',
      'yarn typecheck',
      'yarn build',
      'yarn build:inspect',
    ])
  })

  test('[CL-150] the required "build" check passes only when the bundle and test jobs succeeded', () => {
    const build = workflow.jobs.build
    expect(build.needs).toEqual(['bundle', 'tests'])
    expect(build.if).toBe('always()')
    const check = build.steps.at(-1).run
    expect(check).toContain('needs.bundle.result }}" = success')
    expect(check).toContain('needs.tests.result }}" = success')
  })

  test('[CL-151] [CL-152] [CL-153] no upstream-only steps, upgrade rehearsal or publishing', () => {
    const text = readFileSync('.github/workflows/checks.yml', 'utf8')
    expect(text).not.toMatch(
      /1401250166|ownership|starter|contract|upgrade|demo|deploy|publish|pages/i,
    )
    expect(Object.keys(workflow.jobs).sort()).toEqual([
      'build',
      'bundle',
      'tests',
    ])
    expect(existsSync('.github/workflows/demo.yml')).toBe(false)
  })

  test('[CL-154] there is no funding link', () => {
    expect(existsSync('.github/FUNDING.yml')).toBe(false)
  })
})
