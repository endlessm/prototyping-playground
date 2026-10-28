// What the browser may know about contributors and systems: their public
// selectors (keys) and permanent studio IDs. Profiles, emails and
// preferences stay on Node.
import { registeredSystems } from '../studio/systems.ts'
import { readContributors } from './profiles.ts'

export interface PublicDirectory {
  contributors: { key: string; studioId: string }[]
  systems: { key: string; studioId: string | null }[]
}

export function publicDirectory(
  root: string,
  { contributorsFolder, systems }: { contributorsFolder?: string; systems?: unknown },
): PublicDirectory {
  const { contributors } = readContributors(root, contributorsFolder)
  return {
    contributors: Object.entries(contributors).map(([key, { studioId }]) => ({
      key,
      studioId,
    })),
    systems: registeredSystems(root, systems).map(({ key, studioId }) => ({
      key,
      studioId,
    })),
  }
}
