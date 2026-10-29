// Permanent identities in the app's own runs. While the dev server runs, new
// artifacts in the running contributor's prototypes get their IDs. The build
// refuses to start while any resource is missing its ID or shares one.
import path from 'node:path'
import { addVitePlugin, defineNuxtModule } from 'nuxt/kit'
import { resolveIdentity } from '../contributors/identity.ts'
import { readContributors } from '../contributors/profiles.ts'
import { PROTOTYPES_FOLDER } from '../manifest/build.ts'
import { loadRegistry } from '../modules/registry.ts'
import { auditIdentities, missingNames, type AuditOptions } from './audit.ts'
import { identityFileTypes } from './file-types.ts'
import { watchNewArtifacts } from './assign.ts'

/** The build's message for an audit with missing or broken identities. */
export function strictIdentityProblems(
  audit: ReturnType<typeof auditIdentities>,
) {
  return [
    ...missingNames(audit).map(
      (name) => `${name}: the permanent identity is missing.`,
    ),
    ...audit.problems,
  ]
}

export default defineNuxtModule({
  meta: { name: 'studio-identities' },
  async setup(_options, nuxt) {
    const root = nuxt.options.rootDir
    // The browser scenarios point the studio at content of their own.
    const options: AuditOptions = {
      prototypesFolder: process.env.STUDIO_PROTOTYPES || PROTOTYPES_FOLDER,
      contributorsFolder: process.env.STUDIO_CONTRIBUTORS || 'contributors',
    }
    // Every installed module's file types count, switched on or not, so an
    // ID is never handed out twice.
    const registry = await loadRegistry(root, {
      modulesFolder: process.env.STUDIO_MODULES || undefined,
      configFile: process.env.STUDIO_CONFIG || undefined,
    })
    const types = await identityFileTypes(registry.modules)

    if (!nuxt.options.dev) {
      nuxt.hook('build:before', () => {
        const audit = auditIdentities(root, types, options)
        const problems = strictIdentityProblems(audit)
        const lines: string[] = []
        if (problems.length)
          lines.push(
            'The build stopped: every prototype and artifact needs its own permanent identity.',
            ...problems.map((problem) => `  ${problem}`),
            'Run yarn studio identity-audit to see them, and yarn studio identify <prototype folder> --yes to fill in missing IDs.',
          )
        // What file types check in their files, such as a view's states.
        if (audit.checks.length)
          lines.push(
            lines.length
              ? 'These files have problems to fix too:'
              : 'The build stopped: these files have problems to fix first.',
            ...audit.checks.map((problem) => `  ${problem}`),
          )
        if (lines.length) throw new Error(lines.join('\n'))
      })
      return
    }

    let contributor: string | null | undefined
    addVitePlugin(
      {
        name: 'studio-identity-assign',
        apply: 'serve',
        configureServer(server) {
          watchNewArtifacts(server.watcher, {
            ...options,
            root,
            types: () => types,
            // Resolving runs Git, so it happens once, on the first new file.
            contributor: () => {
              if (contributor === undefined) {
                const { contributors } = readContributors(
                  root,
                  options.contributorsFolder,
                )
                contributor = resolveIdentity(root, contributors).key
              }
              return contributor
            },
            logger: {
              info: (message) =>
                server.config.logger.info(message, { timestamp: true }),
              warn: (message) => server.config.logger.warn(message),
            },
          })
          // Content kept outside the studio (the browser scenarios) too.
          server.watcher.add(path.resolve(root, options.prototypesFolder!))
        },
      },
      { server: false },
    )
  },
})
