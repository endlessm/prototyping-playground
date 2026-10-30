import {
  guidanceAddress,
  linkedFile,
  type GuidanceOwner,
} from '../../tooling/guidance/addresses'

/**
 * Where a relative link in a Manual chapter or guidance file (`from`,
 * repository-relative) opens in the studio: a chapter in the Manual, a
 * guidance document in Context & Skills, or nowhere (it stays as written).
 */
export function documentationLink(
  owners: GuidanceOwner[],
  manual:
    { folder: string; chapters: { slug: string; file: string }[] } | undefined,
  from: string,
  href: string,
) {
  const linked = linkedFile(from, href)
  if (!linked) return undefined
  const chapter = manual?.chapters.find(
    ({ file }) => `${manual.folder}/${file}` === linked.file,
  )
  if (chapter)
    return `/documentation/manual${chapter.slug === 'index' ? '' : `/${chapter.slug}`}${linked.hash}`
  return guidanceAddress(owners, from, href)
}
