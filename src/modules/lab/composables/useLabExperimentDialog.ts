import type { ExperimentRequest } from '../utils/experiments'

export interface ExperimentDialog {
  request: ExperimentRequest
  systemId: string
  component: string
  title: string
  description: string
  name?: string
}

/**
 * Opens the dialog that names a new experiment or a copy, only while the
 * studio runs locally: the deployed site carries neither the dialog nor the
 * dev server's address.
 */
export function useLabExperimentDialog() {
  const modal = import.meta.dev
    ? useOverlay().create(
        defineAsyncComponent(
          () => import('../components/LabExperimentNameModal.vue'),
        ),
      )
    : undefined
  return (dialog: ExperimentDialog) => void modal?.open(dialog)
}
