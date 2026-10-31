import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { assetProblems, changedFiles, scopeReport } from './changes.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const [kind, ...args] = process.argv.slice(2)
try {
  if (kind === 'modules') {
    const { studioProblems } = await import('./studio.ts')
    const problems = await studioProblems(root)
    for (const problem of problems) console.error(problem)
    process.exitCode = problems.length ? 1 : 0
  } else {
    const ci = args.indexOf('--ci')
    const before = ci >= 0 ? args[ci + 1] : undefined
    const after = ci >= 0 ? args[ci + 2] : undefined
    if (ci >= 0 && (!before || !after))
      throw new Error('--ci requires before and after revisions.')
    let files = changedFiles(root, before, after)
    const pushReports: ReturnType<typeof scopeReport>[] = []
    if (args.includes('--push')) {
      const ranges = readFileSync(0, 'utf8')
        .trim()
        .split(/\r?\n/)
        .filter(Boolean)
      files = [
        ...new Set(
          ranges.flatMap((line) => {
            const [, local, , remote] = line.split(' ')
            if (!local || /^0+$/.test(local)) return []
            const base = remote && !/^0+$/.test(remote) ? remote : 'HEAD~1'
            const changed = changedFiles(root, base, local)
            pushReports.push(scopeReport(root, changed, base, local))
            return changed
          }),
        ),
      ]
    }
    if (kind === 'assets') {
      const problems = assetProblems(root, files, after)
      for (const problem of problems) console.error(problem)
      process.exitCode = problems.length ? 1 : 0
    } else if (kind === 'scope') {
      const report = args.includes('--push')
        ? {
            lines: pushReports.flatMap((report) => report.lines),
            outside: pushReports.flatMap((report) => report.outside),
            identity: pushReports.flatMap((report) => report.identity),
          }
        : scopeReport(root, files, before, after)
      console.log(
        [...report.lines, ...report.identity].join('\n') || 'No changed files.',
      )
      // This value comes from the authenticated workflow lookup, never from the proposal.
      const repositoryRole = process.env.STUDIO_REPOSITORY_ROLE
      const bypass = repositoryRole === 'admin' || repositoryRole === 'maintain'
      process.exitCode =
        ci >= 0 &&
        !args.includes('--review') &&
        (report.identity.length || (report.outside.length && !bypass))
          ? 1
          : 0
    } else throw new Error('Use modules, assets or scope.')
  }
} catch (error) {
  console.error(String(error))
  process.exitCode = kind === 'scope' && !args.includes('--ci') ? 0 : 2
}
