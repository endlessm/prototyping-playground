// A content date (`2026-10-28`, as metadata stores it) the way people read
// it: "Oct 28, 2026". Anything else is shown as written.
export function formatDate(date: string | null | undefined) {
  if (!date) return ''
  const day = new Date(`${date}T00:00:00`)
  return Number.isNaN(day.getTime())
    ? date
    : day.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
}
