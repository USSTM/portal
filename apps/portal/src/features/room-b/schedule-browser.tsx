import { useEffect, useState } from 'react'
import { RoomBCalendarView } from './calendar-view'
import { moveScheduleDate, torontoDate } from './schedule-dates'
import type { RoomBView } from './schedule-dates'
import type { RoomBCalendarViewProps } from './calendar-view'

export interface RoomBScheduleBrowserProps extends RoomBCalendarViewProps {
  date: string
  requestedView?: RoomBView
  onNavigate: (date: string, view: RoomBView) => void
}
const control =
  'rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary'

export function RoomBScheduleBrowser({
  date,
  requestedView,
  onNavigate,
  ...props
}: RoomBScheduleBrowserProps) {
  const [phone, setPhone] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)')
    const update = () => setPhone(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  const view = requestedView ?? (phone ? 'day' : 'week')
  const toolbar = (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <div role="group" aria-label="Calendar view" className="flex gap-1">
        {(['day', 'week', 'month'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={view === mode}
            onClick={() => onNavigate(date, mode)}
            className={`${control} ${view === mode ? 'border-primary bg-primary/10 text-primary' : ''}`}
          >
            {mode[0].toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>
      <nav aria-label="Schedule dates" className="flex flex-wrap gap-1">
        <button
          type="button"
          className={control}
          aria-label={`Previous ${view}`}
          onClick={() => onNavigate(moveScheduleDate(date, view, -1), view)}
        >
          ←
        </button>
        <button
          type="button"
          className={control}
          onClick={() => onNavigate(torontoDate(new Date()), view)}
        >
          Today
        </button>
        <button
          type="button"
          className={control}
          aria-label={`Next ${view}`}
          onClick={() => onNavigate(moveScheduleDate(date, view, 1), view)}
        >
          →
        </button>
      </nav>
      <label className="sr-only" htmlFor="room-b-date">
        Go to date
      </label>
      <input
        id="room-b-date"
        type="date"
        value={date}
        className={`${control} min-w-0 max-w-full`}
        onChange={(event) => {
          if (/^\d{4}-\d{2}-\d{2}$/.test(event.currentTarget.value))
            onNavigate(event.currentTarget.value, view)
        }}
      />
    </div>
  )

  if (view !== 'month') {
    const calendar =
      view === 'day' && !props.calendar.days.some((day) => day.date === date)
        ? {
            ...props.calendar,
            days: [
              {
                date,
                label: new Intl.DateTimeFormat('en-CA', {
                  weekday: 'long',
                  timeZone: 'UTC',
                }).format(new Date(`${date}T12:00:00Z`)),
                slots: [],
              },
            ],
          }
        : props.calendar
    return (
      <RoomBCalendarView
        {...props}
        calendar={calendar}
        displayView={view}
        focusDate={date}
        toolbar={toolbar}
      />
    )
  }
  const month = date.slice(0, 7)
  return (
    <main className="mx-auto w-full min-w-0 space-y-6 px-2 py-8 sm:px-6">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold">EPH 442B Room Booking</h1>
        <p className="text-muted-foreground">
          {new Intl.DateTimeFormat('en-CA', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          }).format(new Date(`${date}T12:00:00Z`))}{' '}
          · Toronto (EST/EDT)
        </p>
        {toolbar}
        {props.readOnly && (
          <p className="text-sm text-muted-foreground">
            Public calendar · View only
          </p>
        )}
      </header>
      <p className="text-sm text-muted-foreground">
        Select a date to view its full schedule. Bookings are Monday–Friday, 8
        AM–10 PM.
      </p>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <p
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </p>
        ))}
        {props.calendar.days.map((day) => {
          const booked = day.slots.filter((slot) => slot.booking)
          const names = [
            ...new Set(booked.map((slot) => slot.booking!.ownerLabel)),
          ]
          const label = new Intl.DateTimeFormat('en-CA', {
            dateStyle: 'full',
            timeZone: 'UTC',
          }).format(new Date(`${day.date}T12:00:00Z`))
          return (
            <button
              key={day.date}
              type="button"
              aria-label={`View schedule for ${label}`}
              onClick={() => onNavigate(day.date, 'day')}
              className={`min-h-24 min-w-0 rounded-lg border p-1 text-left [overflow-wrap:anywhere] hover:border-primary focus-visible:ring-2 focus-visible:ring-primary sm:min-h-32 sm:p-3 ${day.date.slice(0, 7) === month ? 'border-border bg-card' : 'border-border bg-secondary/30 text-muted-foreground'}`}
            >
              <span className="text-sm font-semibold">
                {Number(day.date.slice(8))}
              </span>
              {day.slots.length === 0 ? (
                <span className="mt-2 block text-[10px] text-muted-foreground sm:text-xs">
                  Closed
                </span>
              ) : (
                <>
                  <span className="mt-2 block text-[10px] text-muted-foreground sm:text-xs">
                    {booked.length
                      ? `${booked.length}h reserved`
                      : 'No bookings'}
                  </span>
                  {names.slice(0, 2).map((name) => (
                    <span
                      key={name}
                      className="mt-1 block truncate text-[10px] font-medium sm:text-xs"
                      title={name}
                    >
                      {name}
                    </span>
                  ))}
                  {names.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{names.length - 2} more
                    </span>
                  )}
                </>
              )}
            </button>
          )
        })}
      </div>
    </main>
  )
}
