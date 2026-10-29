import { studioToast } from '../utils/toasts'

/** Shows a confirmation or an error at the bottom-right of the window. */
export function useStudioToast() {
  const toast = useToast()
  return {
    success: (title: string, description?: string) =>
      toast.add(studioToast('success', title, description)),
    error: (title: string, description?: string) =>
      toast.add(studioToast('error', title, description)),
  }
}
