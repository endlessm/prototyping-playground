import { RESTART_EVENT } from '../../tooling/restart/names'
import { restartHandoff } from '../utils/restartHandoff'
import { appServer } from '../utils/studioServer'

// Wires the application to the restart handoff its page's head script
// resumed (`tooling/restart/handoff.ts`): a restart the dev server
// announces starts one, and once the application is ready the handoff
// learns where its code came from and how to show a confirmation.
export default defineNuxtPlugin(() => {
  const handoff = restartHandoff()
  if (!import.meta.dev || !handoff) return
  const toast = useStudioToast()
  import.meta.hot?.on(RESTART_EVENT, ({ instance }: { instance: string }) =>
    handoff.start({ kind: 'restart', from: instance }),
  )
  onNuxtReady(() =>
    handoff.connect({
      codeServer: appServer,
      confirm: (title) => toast.success(title),
    }),
  )
})
