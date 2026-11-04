import { studioToast } from '../utils/toasts'

/** A button on a confirmation, such as Undo. */
export interface StudioToastAction {
  label: string
  onClick: () => unknown
}

/** Shows a confirmation or an error at the bottom-right of the window. */
export function useStudioToast() {
  const toast = useToast()
  return {
    success: (
      title: string,
      description?: string,
      action?: StudioToastAction,
    ) =>
      toast.add({
        ...studioToast('success', title, description),
        ...(action && {
          actions: [
            {
              label: action.label,
              color: 'neutral' as const,
              variant: 'outline' as const,
              onClick: () => void action.onClick(),
            },
          ],
        }),
      }),
    error: (title: string, description?: string) =>
      toast.add(studioToast('error', title, description)),
  }
}
