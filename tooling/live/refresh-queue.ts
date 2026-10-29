// Turns a burst of change notifications into one refresh and runs refreshes
// one at a time. A notification that arrives while a refresh runs schedules
// one more after it, so the latest change is never lost.
export function createRefreshQueue(
  refresh: () => Promise<unknown>,
  schedule: (callback: () => void) => void,
) {
  let scheduled = false
  let running = false
  let dirty = false
  const flush = async () => {
    scheduled = false
    if (running || !dirty) return
    dirty = false
    running = true
    try {
      await refresh()
    } catch (error) {
      console.error(error)
    } finally {
      running = false
      if (dirty) request()
    }
  }
  function request() {
    dirty = true
    if (scheduled || running) return
    scheduled = true
    schedule(() => void flush())
  }
  return request
}
