import { NO_RESTART_EVENT, RESTART_EVENT } from '../../tooling/restart/names'
import { restartHandoff } from '../utils/restartHandoff'
import { appServer } from '../utils/studioServer'

// Wires the application to the restart handoff its page's head script
// resumed (`tooling/restart/handoff.ts`): a restart the dev server
// announces starts one, an announcement that none is coming ends one, and
// once the application is ready the handoff learns where its code came from
// and how to show a confirmation.
export default defineNuxtPlugin(() => {
  const handoff = restartHandoff()
  if (!import.meta.dev || !handoff) return
  const toast = useToast()
  const studioToast = useStudioToast()
  import.meta.hot?.on(RESTART_EVENT, ({ instance }: { instance: string }) =>
    handoff.start({ kind: 'restart', from: instance }),
  )
  import.meta.hot?.on(NO_RESTART_EVENT, ({ instance }: { instance: string }) =>
    handoff.notRestarting(instance),
  )
  onNuxtReady(() =>
    handoff.connect({
      codeServer: appServer,
      // "Settings saved" is a plain notice; a system change's, a success.
      confirm: (title, kind) =>
        kind === 'system' ? studioToast.success(title) : toast.add({ title }),
    }),
  )
})
