import { useManifest } from '../../../../app/composables/useManifest'
import type { Author } from '../threads'

export interface ShownAuthor {
  /** The person's name, or "<first name>'s agent". */
  name: string
  github?: string
  avatar?: string
  agent: boolean
}

// Authors by their profiles: name and picture, an agent under its person's
// first name.
export async function useCommentAuthors() {
  const { t } = useI18n()
  const manifest = await useManifest()
  return (author: Author): ShownAuthor => {
    const profile = manifest.value.contributors.find(
      ({ id }) => id === author.contributor,
    )
    const name = profile?.name ?? t('comments.someone')
    return {
      name: author.agent
        ? t('comments.agentName', { name: name.split(/\s+/)[0] })
        : name,
      github: profile?.github,
      avatar: profile?.avatar,
      agent: Boolean(author.agent),
    }
  }
}
