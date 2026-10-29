// How the studio's short messages look and how long they stay: confirmations
// ("Link copied", "Settings saved") for 4 s, errors for 7 s.

export type StudioToastKind = 'success' | 'error'

export function studioToast(
  kind: StudioToastKind,
  title: string,
  description?: string,
) {
  return {
    title,
    description,
    color: kind,
    icon: kind === 'error' ? 'i-lucide-circle-alert' : 'i-lucide-circle-check',
    duration: kind === 'error' ? 7000 : 4000,
  } as const
}
