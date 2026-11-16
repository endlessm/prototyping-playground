/**
 * Vue code as a fenced Markdown block, for the Markdown pipeline to
 * highlight; the fence is longer than any backtick run inside.
 */
export function vueFence(text: string) {
  const longest = Math.max(
    2,
    ...[...text.matchAll(/`+/g)].map((run) => run[0].length),
  )
  const fence = '`'.repeat(longest + 1)
  return [`${fence}vue`, text.trimEnd(), fence].join('\n')
}
