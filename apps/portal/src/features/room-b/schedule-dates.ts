export type RoomBView = 'day' | 'week' | 'month'

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Toronto',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
export function torontoDate(now: Date) {
  return dateFormatter.format(now)
}
export function addScheduleDays(date: string, count: number) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + count)
  return value.toISOString().slice(0, 10)
}
export function scheduleMonday(date: string) {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
  return addScheduleDays(date, -(weekday === 0 ? 6 : weekday - 1))
}
export function isRoomBWeekday(date: string) {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
  return weekday !== 0 && weekday !== 6
}
export function defaultScheduleDate(now: Date) {
  const today = torontoDate(now)
  return isRoomBWeekday(today)
    ? today
    : addScheduleDays(scheduleMonday(today), 7)
}
export function scheduleDates(date: string, view: RoomBView) {
  if (view === 'day') return [date]
  if (view === 'week')
    return Array.from({ length: 5 }, (_, i) =>
      addScheduleDays(scheduleMonday(date), i),
    )
  const first = `${date.slice(0, 7)}-01`
  const next = new Date(`${first}T12:00:00Z`)
  next.setUTCMonth(next.getUTCMonth() + 1)
  const last = addScheduleDays(next.toISOString().slice(0, 10), -1)
  const start = scheduleMonday(first)
  const end = addScheduleDays(scheduleMonday(last), 6)
  const length =
    Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1
  return Array.from({ length }, (_, i) => addScheduleDays(start, i))
}
export function moveScheduleDate(
  date: string,
  view: RoomBView,
  direction: number,
) {
  if (view !== 'month')
    return addScheduleDays(date, direction * (view === 'week' ? 7 : 1))
  const day = Number(date.slice(8))
  const first = new Date(`${date.slice(0, 7)}-01T12:00:00Z`)
  first.setUTCMonth(first.getUTCMonth() + direction)
  const next = new Date(first)
  next.setUTCMonth(next.getUTCMonth() + 1)
  const lastDay = Number(
    addScheduleDays(next.toISOString().slice(0, 10), -1).slice(8),
  )
  return `${first.toISOString().slice(0, 7)}-${String(Math.min(day, lastDay)).padStart(2, '0')}`
}
