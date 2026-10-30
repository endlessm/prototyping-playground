import { useClipboard } from '@vueuse/core'
import type { ContextMenuItem } from '@nuxt/ui'
import type { SourceAccess } from '../components/source/sourceAccess'
import { menuGroups } from '../utils/menus'
import { onApple, shortcutLabel } from '../utils/shortcuts'
import { requestJson } from '../utils/studioRequest'

/** A Manual chapter or guidance document in a navigation list. */
export interface DocumentationEntry {
  /** Its studio address. */
  to: string
  /** Its file, repository-relative. */
  path: string
}

/**
 * The dev server's access to the Manual's chapters and shared guidance:
 * reading and saving their source (an Admin saves), and showing a file in
 * the file browser or a code editor. Locally only; the address is left out
 * of the deployed site.
 */
export function useGuidanceFiles() {
  const url = import.meta.dev
    ? `${useRuntimeConfig().app.baseURL}_studio/files/guidance-source`
    : ''
  const post = <T>(body: object) =>
    requestJson<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  return {
    access: (path: () => string): SourceAccess => ({
      read: () =>
        requestJson(`${url}?${new URLSearchParams({ path: path() })}`),
      write: (content, base) =>
        requestJson(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: path(), content, base }),
        }),
    }),
    reveal: (path: string) => post<object>({ op: 'reveal', path }),
    open: (path: string) =>
      post<{ opened: boolean; message?: string }>({ op: 'open', path }),
  }
}

/**
 * A documentation entry's right-click menu: locally, Edit source, Open in
 * editor and the file browser; anywhere, Copy link and Copy path. Entries
 * are never created, moved, renamed or deleted from here.
 */
export function useDocumentationActions() {
  const { t } = useI18n()
  const toast = useStudioToast()
  const router = useRouter()
  const files = useGuidanceFiles()
  const { copy } = useClipboard({ legacy: true })
  const failed = (message: string) => toast.error(t('actions.failed'), message)
  const later = (action: () => unknown) => afterMenuCloses(action, failed)
  const revealLabel = () =>
    onApple()
      ? t('files.reveal.apple')
      : /Win/.test(navigator.userAgent)
        ? t('files.reveal.windows')
        : t('files.reveal.other')

  return (entry: DocumentationEntry): ContextMenuItem[][] =>
    menuGroups<ContextMenuItem>([
      [
        import.meta.dev && {
          label: t('documentation.editSource'),
          icon: 'i-lucide-code-xml',
          kbds: [shortcutLabel('source')],
          onSelect: later(() =>
            navigateTo({ path: entry.to, query: { mode: 'source' } }),
          ),
        },
        import.meta.dev && {
          label: t('files.openInEditor'),
          icon: 'i-lucide-square-pen',
          onSelect: later(async () => {
            const reply = await files.open(entry.path)
            if (!reply.opened && reply.message) toast.success(reply.message)
          }),
        },
        import.meta.dev && {
          label: revealLabel(),
          icon: 'i-lucide-folder-open',
          onSelect: later(() => files.reveal(entry.path)),
        },
        {
          label: t('actions.copyLink'),
          icon: 'i-lucide-link',
          onSelect: later(async () => {
            await copy(
              new URL(router.resolve(entry.to).href, location.href).href,
            )
            toast.success(t('actions.linkCopied'))
          }),
        },
        {
          label: t('actions.copyPath'),
          icon: 'i-lucide-copy',
          onSelect: later(async () => {
            await copy(entry.path)
            toast.success(t('actions.pathCopied'))
          }),
        },
      ],
    ])
}
