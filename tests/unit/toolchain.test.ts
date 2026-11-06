import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { parse } from 'yaml'
import config from '../../vitest.config'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const yarnrc = parse(readFileSync('.yarnrc.yml', 'utf8'))
const workflow = parse(readFileSync('.github/workflows/checks.yml', 'utf8'))

// Every file under the studio's own source folders.
const sourceFiles = ['tooling', 'src', 'app', '.github'].flatMap((folder) =>
  readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name)),
)

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
  test('[CL-36] every module lives in one folder, with no separate platform modules', () => {
    expect(existsSync('src/platform/modules')).toBe(false)
    for (const id of readdirSync('src/modules'))
      expect(existsSync(`src/modules/${id}/module.ts`), id).toBe(true)
  })

  test('[CL-128] [CL-160] the ownership map and command remain absent', () => {
    expect(existsSync('.studio/ownership.json')).toBe(false)
    expect(pkg.scripts.ownership).toBeUndefined()
  })

  test('[CL-133] there is no public platform contract or its snapshot', () => {
    expect(pkg.scripts.contract).toBeUndefined()
    expect(
      sourceFiles.filter((file) => /contract\.snapshot/.test(file)),
    ).toEqual([])
  })

  test('[CL-134] there is no starter distribution guard', () => {
    expect(JSON.stringify(pkg.scripts)).not.toMatch(/starter/)
    expect(sourceFiles.filter((file) => /starter/i.test(file))).toEqual([])
    expect(readFileSync('tooling/checks/run.ts', 'utf8')).not.toMatch(/starter/)
  })

  test('[CL-156] [CL-157] there is no release or baseline command', () => {
    expect(pkg.scripts.release).toBeUndefined()
    expect(pkg.scripts.baseline).toBeUndefined()
    expect(
      sourceFiles.filter((file) => /\b(release|baseline)\.[jt]s$/.test(file)),
    ).toEqual([])
  })

  test('[CL-159] there is no CHANGELOG of platform releases', () => {
    expect(existsSync('CHANGELOG.md')).toBe(false)
  })

  test('[CL-155] issues and security reports go to the Endless repository; the original is only credited', () => {
    for (const file of ['CONTRIBUTING.md', 'SECURITY.md']) {
      const text = readFileSync(file, 'utf8')
      expect(text, file).not.toMatch(/itspatmorgan/)
    }
    expect(readFileSync('README.md', 'utf8')).not.toMatch(/This branch/)
  })

  test('[CL-158] there is no studio.lock.json, and nothing reads one', () => {
    expect(existsSync('studio.lock.json')).toBe(false)
    // The studio's own code: tooling and the app.
    const code = sourceFiles.filter((file) =>
      /^(tooling|app)[\\/].*\.(ts|vue)$/.test(file),
    )
    expect(code.length).toBeGreaterThan(100)
    for (const file of code)
      expect(readFileSync(file, 'utf8'), file).not.toContain('studio.lock')
  })

  test('[CL-140] pre-push only gives the committed scope summary', () => {
    expect(readFileSync('.husky/pre-push', 'utf8').trim()).toBe(
      'node tooling/checks/run.ts scope --push',
    )
  })

  test('[CL-147] CI checks scope and asset blobs on the pushed range', () => {
    const scope = JSON.stringify(workflow.jobs.scope)
    expect(scope).toContain('scope --ci')
    expect(scope).toContain('assets --ci')
    expect(scope).toContain('collaborators/$GITHUB_ACTOR/permission')
    expect(scope).toContain('pull_request.base.sha')
    // It installs nothing, so there is no yarn cache to save.
    const setupNode = workflow.jobs.scope.steps.find(
      (step: { uses?: string }) => step.uses?.startsWith('actions/setup-node'),
    )
    expect(setupNode.with.cache).toBeUndefined()
    expect(setupNode.with['package-manager-cache']).toBe(false)
  })
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

  test('[CL-139] [CL-132] the pre-commit hook checks your identity, then lints and formats staged files', () => {
    expect(
      readFileSync('.husky/pre-commit', 'utf8').trim().split(/\r?\n/),
    ).toEqual([
      'node tooling/check-identity.ts',
      'node tooling/checks/run.ts scope',
      'node tooling/checks/run.ts assets',
      'node tooling/checks/run.ts modules',
      'yarn lint-staged',
    ])
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

  test('[CL-148] the test jobs install browsers and together run the full suite, without selecting tests', () => {
    expect(steps('tests')).toEqual([
      'corepack enable',
      'yarn install --immutable',
      'yarn test',
    ])
    expect(steps('e2e')).toEqual([
      'corepack enable',
      'yarn install --immutable',
      'yarn playwright install --with-deps chromium',
      'yarn test:e2e --shard=${{ matrix.shard }}/${{ strategy.job-total }}',
    ])
    // Shards 1 to N, each finishing even when another fails.
    const { matrix, 'fail-fast': failFast } = workflow.jobs.e2e.strategy
    expect(matrix.shard).toEqual(
      matrix.shard.map((_: number, index: number) => index + 1),
    )
    expect(failFast).toBe(false)
    // Between them, `yarn test` and `yarn test:e2e` name every project.
    expect(pkg.scripts['test:e2e']).toBe('vitest run --project e2e')
    const projects = (config.test?.projects ?? []) as {
      test: { name: string }
    }[]
    expect(projects.map((project) => project.test.name).sort()).toEqual([
      'e2e',
      'integration',
      'unit',
    ])
  })

  test('[CL-149] the bundle job checks lint, format and types, then builds and inspects the build', () => {
    expect(steps('bundle')).toEqual([
      'corepack enable',
      'yarn install --immutable',
      'yarn lint',
      'yarn format:check',
      'yarn typecheck',
      'yarn check',
      'yarn studio sync --check',
      'yarn build',
      'yarn build:inspect',
    ])
  })

  test('[CL-150] the required "build" check passes only when the bundle and test jobs succeeded', () => {
    const build = workflow.jobs.build
    expect(build.needs).toEqual(['bundle', 'tests', 'e2e', 'scope'])
    expect(build.if).toBe('always()')
    const check = build.steps.at(-1).run
    expect(check).toContain('needs.bundle.result }}" = success')
    expect(check).toContain('needs.tests.result }}" = success')
    expect(check).toContain('needs.e2e.result }}" = success')
  })

  test('[CL-151] [CL-152] [CL-153] no upstream-only steps, upgrade rehearsal or publishing', () => {
    const text = readFileSync('.github/workflows/checks.yml', 'utf8')
    expect(text).not.toMatch(
      /1401250166|ownership|starter|contract|upgrade|demo|deploy|publish|pages/i,
    )
    expect(Object.keys(workflow.jobs).sort()).toEqual([
      'build',
      'bundle',
      'e2e',
      'scope',
      'tests',
    ])
    expect(existsSync('.github/workflows/demo.yml')).toBe(false)
  })

  test('[CL-154] there is no funding link', () => {
    expect(existsSync('.github/FUNDING.yml')).toBe(false)
  })

  test('[CL-120] nothing publishes the studio: the checks are the only workflow', () => {
    expect(readdirSync('.github/workflows')).toEqual(['checks.yml'])
    expect(
      Object.keys(pkg.scripts).filter((name) =>
        /deploy|publish|release/.test(name),
      ),
    ).toEqual([])
  })
})
