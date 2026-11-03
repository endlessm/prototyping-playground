const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

/** "now", "5 minutes ago", "yesterday", in English, as the rest of the studio's text, with the platform's wording. */
export function timeAgo(iso: string, now = Date.now()) {
  const seconds = (new Date(iso).getTime() - now) / 1000
  if (Number.isNaN(seconds)) return ''
  const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [unit, size] of UNITS)
    if (Math.abs(seconds) >= size)
      return format.format(Math.round(seconds / size), unit)
  return format.format(0, 'second')
}
