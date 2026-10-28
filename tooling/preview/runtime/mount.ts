// Runs inside the preview document: mounts the view named in the address
// with the system's app factory, and tells the studio around it how it went.
// It imports nothing of the studio.
import type { App, Component } from 'vue'
import { PREVIEW_CHANNEL as CHANNEL } from '../constants.ts'

export type PreviewState = 'loading' | 'ready' | 'error'

export interface PreviewStatus {
  channel: typeof CHANNEL
  kind: 'status'
  state: PreviewState
  artifact: string | null
  detail: string
}

interface MountOptions {
  create: (options: {
    component: Component
    props?: Record<string, unknown>
  }) => App
  views: Record<string, () => Promise<{ default?: Component }>>
}

export async function mountPreview({ create, views }: MountOptions) {
  const artifact = new URLSearchParams(location.search).get('artifact')
  const report = (state: PreviewState, detail = '') => {
    document.documentElement.dataset.previewState = state
    if (window.parent === window) return
    const status: PreviewStatus = {
      channel: CHANNEL,
      kind: 'status',
      state,
      artifact,
      detail,
    }
    window.parent.postMessage(status, location.origin)
  }
  const fail = (detail: string) => {
    const message = document.createElement('p')
    message.setAttribute('role', 'alert')
    message.textContent = detail
    document.getElementById('app')?.replaceChildren(message)
    report('error', detail)
  }
  report('loading')
  const load = artifact ? views[artifact] : undefined
  if (!load) return fail('This view is not part of this preview.')
  try {
    const component = (await load()).default
    if (!component)
      return fail('The view has no component. A view is a .vue file.')
    create({ component }).mount('#app')
    report('ready')
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error))
  }
}
