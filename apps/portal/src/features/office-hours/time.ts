export function torontoLocalDateTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return undefined
  const [, year, month, day, hour, minute] = match
  const localAsUtc = Date.UTC(+year, +month - 1, +day, +hour, +minute)
  let timestamp = localAsUtc
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const values = Object.fromEntries(
      torontoFormatter
        .formatToParts(new Date(timestamp))
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value]),
    )
    const formattedAsUtc = Date.UTC(
      +values.year,
      +values.month - 1,
      +values.day,
      +values.hour,
      +values.minute,
    )
    timestamp += localAsUtc - formattedAsUtc
  }
  const date = new Date(timestamp)
  return formatTorontoDateTime(date) === value ? date : undefined
}

function formatTorontoDateTime(date: Date) {
  const values = Object.fromEntries(
    torontoFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`
}

const torontoFormatter = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  month: '2-digit',
  timeZone: 'America/Toronto',
  year: 'numeric',
})
